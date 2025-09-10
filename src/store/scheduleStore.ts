"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ScheduledActivity, Day, Category, Plan } from "@/lib/types";
import { planService } from "@/lib/planService";
import { auth } from "@/lib/firebase";

type ScheduleState = {
    plans: Plan[];
    activePlanId: string | null;
    draggingDayKey: string | null;
    hydrated: boolean;
    unsubscribe: (() => void) | null;
    loading: boolean;
    error: string | null;
    lastSyncTimestamp: number;
    pendingChanges: string[];
};

type ScheduleActions = {
    loadPlans: () => Promise<void>;
    setPlans: (plans: Plan[]) => void;
    addPlan: (name: string, color: string) => Promise<void>;
    removePlan: (planId: string) => Promise<void>;
    updatePlan: (planId: string, updates: Partial<Omit<Plan, "id">>) => Promise<void>;
    setActivePlanId: (planId: string) => void;
    addActivity: (day: Day, activity: ScheduledActivity) => void;
    removeActivity: (day: Day, instanceId: string) => void;
    updateActivity: (day: Day, updatedActivity: ScheduledActivity) => void;
    reorderActivities: (day: Day, activities: ScheduledActivity[]) => void;
    moveActivityBetweenDays: (activityInstanceId: string, fromDay: Day, toDay: Day, toIndex?: number) => void;
    addDay: (dayName: string) => void;
    removeDay: (dayName: string) => void;
    moveDay: (draggedDayKey: string, targetDayKey: string) => void;
    setDraggingDayKey: (key: string | null) => void;
    setCategory: (category: Category) => void;
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
    syncToServer: () => Promise<void>;
    addPendingChange: (changeId: string) => void;
    removePendingChange: (changeId: string) => void;
};

const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine;

export const useScheduleStore = create<ScheduleState & ScheduleActions>()(
    persist(
        (set, get) => ({
            plans: [],
            activePlanId: null,
            draggingDayKey: null,
            hydrated: false,
            unsubscribe: null,
            loading: false,
            error: null,
            lastSyncTimestamp: 0,
            pendingChanges: [],

            loadPlans: async () => {
                const { currentUser } = auth;
                if (!currentUser) return;

                try {
                    set({ loading: true, error: null });

                    if (isOnline()) {
                        // Try to fetch from server
                        const response = await fetch(`/api/plans?userId=${currentUser.uid}`);
                        if (response.ok) {
                            const plans = await response.json();
                            set({
                                plans,
                                hydrated: true,
                                lastSyncTimestamp: Date.now(),
                                error: null,
                            });

                            const state = get();
                            if (!state.activePlanId && plans.length > 0) {
                                set({ activePlanId: plans[0].id });
                            }
                        } else {
                            throw new Error('Failed to fetch plans');
                        }
                    } else {
                        // Use cached data from localStorage
                        set({
                            hydrated: true,
                            error: "Using offline data - will sync when online"
                        });
                    }
                } catch (error) {
                    console.error("Error loading plans:", error);
                    set({
                        hydrated: true,
                        error: isOnline() ? "Failed to load plans" : "Using offline data"
                    });
                } finally {
                    set({ loading: false });
                }
            },

            setPlans: (plans) => set({ plans }),
            setActivePlanId: (planId) => set({ activePlanId: planId }),

            addPendingChange: (changeId) => {
                set((state) => ({
                    pendingChanges: [...state.pendingChanges.filter(id => id !== changeId), changeId]
                }));
            },

            removePendingChange: (changeId) => {
                set((state) => ({
                    pendingChanges: state.pendingChanges.filter(id => id !== changeId)
                }));
            },

            syncToServer: async () => {
                const { currentUser } = auth;
                const state = get();

                if (!currentUser || !isOnline() || state.pendingChanges.length === 0) return;

                try {
                    // Sync all pending changes
                    for (const changeId of state.pendingChanges) {
                        // Find the plan that needs syncing
                        const plan = state.plans.find(p => p.id === changeId);
                        if (plan) {
                            await planService.updatePlan(currentUser.uid, plan.id, plan);
                        }
                    }

                    set({
                        pendingChanges: [],
                        lastSyncTimestamp: Date.now(),
                        error: null
                    });
                } catch (error) {
                    console.error("Error syncing to server:", error);
                    set({ error: "Failed to sync changes to server" });
                }
            },

            addPlan: async (name, color) => {
                const { currentUser } = auth;
                if (!currentUser) return;

                const planId = crypto.randomUUID();
                const newPlan: Plan = {
                    id: planId,
                    name,
                    color,
                    schedule: { saturday: [], sunday: [] },
                    category: "all" as const,
                };

                set((state) => ({
                    plans: [...state.plans, newPlan],
                    activePlanId: planId,
                    error: null,
                }));

                if (isOnline()) {
                    try {
                        const serverPlan = await planService.createPlan(currentUser.uid, name, color);
                        set((state) => ({
                            plans: state.plans.map((plan) => (plan.id === planId ? serverPlan : plan)),
                            activePlanId: serverPlan.id,
                        }));
                    } catch (error) {
                        console.error("Error adding plan:", error);
                        get().addPendingChange(planId);
                        set({ error: "Plan created offline - will sync when online" });
                    }
                } else {
                    get().addPendingChange(planId);
                    set({ error: "Plan created offline - will sync when online" });
                }
            },

            removePlan: async (planId) => {
                const { currentUser } = auth;
                if (!currentUser) return;

                const currentState = get();
                const planToRemove = currentState.plans.find((p) => p.id === planId);
                if (!planToRemove) return;

                const optimisticPlans = currentState.plans.filter((p) => p.id !== planId);
                const newActivePlanId =
                  currentState.activePlanId === planId ? optimisticPlans[0]?.id || null : currentState.activePlanId;

                set({ plans: optimisticPlans, activePlanId: newActivePlanId, error: null });

                if (isOnline()) {
                    try {
                        await planService.deletePlan(currentUser.uid, planId);
                        get().removePendingChange(planId);
                    } catch (error) {
                        console.error("Error removing plan:", error);
                        set({ plans: currentState.plans, activePlanId: currentState.activePlanId, error: "Failed to delete plan" });
                    }
                } else {
                    get().addPendingChange(`delete_${planId}`);
                    set({ error: "Plan deleted offline - will sync when online" });
                }
            },

            updatePlan: async (planId, updates) => {
                const { currentUser } = auth;
                if (!currentUser) return;

                const currentState = get();
                const planToUpdate = currentState.plans.find((p) => p.id === planId);
                if (!planToUpdate) return;

                const optimisticPlans = currentState.plans.map((plan) => (plan.id === planId ? { ...plan, ...updates } : plan));
                set({ plans: optimisticPlans, error: null });

                if (isOnline()) {
                    try {
                        await planService.updatePlan(currentUser.uid, planId, updates);
                        get().removePendingChange(planId);
                    } catch (error) {
                        console.error("Error updating plan:", error);
                        get().addPendingChange(planId);
                        set({ error: "Plan updated offline - will sync when online" });
                    }
                } else {
                    get().addPendingChange(planId);
                    set({ error: "Plan updated offline - will sync when online" });
                }
            },

            addActivity: (day, activity) => {
                const { activePlanId, plans, updatePlan } = get();
                if (!activePlanId) return;

                const activePlan = plans.find((p) => p.id === activePlanId);
                if (!activePlan) return;

                const dayKey = day.toLowerCase().replace(/\s/g, "_");
                const newSchedule = { ...activePlan.schedule, [dayKey]: [...(activePlan.schedule[dayKey] || []), activity] };

                set({
                    plans: plans.map((plan) => (plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan)),
                });

                updatePlan(activePlanId, { schedule: newSchedule });
            },

            removeActivity: (day, instanceId) => {
                const { activePlanId, plans, updatePlan } = get();
                if (!activePlanId) return;

                const activePlan = plans.find((p) => p.id === activePlanId);
                if (!activePlan) return;

                const dayKey = day.toLowerCase().replace(/\s/g, "_");
                const newSchedule = {
                    ...activePlan.schedule,
                    [dayKey]: (activePlan.schedule[dayKey] || []).filter((a) => a.instanceId !== instanceId),
                };

                set({ plans: plans.map((plan) => (plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan)) });
                updatePlan(activePlanId, { schedule: newSchedule });
            },

            updateActivity: (day, updatedActivity) => {
                const { activePlanId, plans, updatePlan } = get();
                if (!activePlanId) return;

                const activePlan = plans.find((p) => p.id === activePlanId);
                if (!activePlan) return;

                const dayKey = day.toLowerCase().replace(/\s/g, "_");
                const newSchedule = {
                    ...activePlan.schedule,
                    [dayKey]: (activePlan.schedule[dayKey] || []).map((a) =>
                      a.instanceId === updatedActivity.instanceId ? updatedActivity : a
                    ),
                };

                set({ plans: plans.map((plan) => (plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan)) });
                updatePlan(activePlanId, { schedule: newSchedule });
            },

            reorderActivities: (day, activities) => {
                const { activePlanId, plans, updatePlan } = get();
                if (!activePlanId) return;

                const activePlan = plans.find((p) => p.id === activePlanId);
                if (!activePlan) return;

                const dayKey = day.toLowerCase().replace(/\s/g, "_");
                const newSchedule = { ...activePlan.schedule, [dayKey]: activities };

                set({ plans: plans.map((plan) => (plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan)) });
                updatePlan(activePlanId, { schedule: newSchedule });
            },

            moveActivityBetweenDays: (activityInstanceId, fromDay, toDay, toIndex) => {
                const { activePlanId, plans, updatePlan } = get();
                if (!activePlanId) return;

                const activePlan = plans.find((p) => p.id === activePlanId);
                if (!activePlan) return;

                const fromDayKey = fromDay.toLowerCase().replace(/\s/g, "_");
                const toDayKey = toDay.toLowerCase().replace(/\s/g, "_");

                const fromActivities = activePlan.schedule[fromDayKey] || [];
                const toActivities = activePlan.schedule[toDayKey] || [];

                const activityToMove = fromActivities.find((a) => a.instanceId === activityInstanceId);
                if (!activityToMove) return;

                const newFromActivities = fromActivities.filter((a) => a.instanceId !== activityInstanceId);
                const newToActivities =
                  typeof toIndex === "number" && toIndex >= 0 && toIndex <= toActivities.length
                    ? [...toActivities.slice(0, toIndex), activityToMove, ...toActivities.slice(toIndex)]
                    : [...toActivities, activityToMove];

                const newSchedule = { ...activePlan.schedule, [fromDayKey]: newFromActivities, [toDayKey]: newToActivities };

                set({ plans: plans.map((plan) => (plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan)) });
                updatePlan(activePlanId, { schedule: newSchedule });
            },

            moveDay: (draggedDayKey, targetDayKey) => {
                const { activePlanId, plans, updatePlan } = get();
                if (!activePlanId) return;

                const activePlan = plans.find((p) => p.id === activePlanId);
                if (!activePlan) return;

                const dayKeys = Object.keys(activePlan.schedule);
                const draggedIndex = dayKeys.indexOf(draggedDayKey);
                const targetIndex = dayKeys.indexOf(targetDayKey);

                if (draggedIndex === -1 || targetIndex === -1) return;

                const newDayKeys = [...dayKeys];
                newDayKeys.splice(draggedIndex, 1);
                newDayKeys.splice(targetIndex, 0, draggedDayKey);

                const newSchedule: { [key: string]: ScheduledActivity[] } = {};
                newDayKeys.forEach((key) => (newSchedule[key] = activePlan.schedule[key]));

                updatePlan(activePlanId, { schedule: newSchedule });
            },

            setDraggingDayKey: (key) => set({ draggingDayKey: key }),

            setCategory: (category) => {
                const { activePlanId, updatePlan } = get();
                if (!activePlanId) return;
                updatePlan(activePlanId, { category });
            },

            addDay: (dayName) => {
                const { activePlanId, plans, updatePlan } = get();
                if (!activePlanId) return;

                const activePlan = plans.find((p) => p.id === activePlanId);
                if (!activePlan) return;

                const newDayKey = dayName.toLowerCase().replace(/\s/g, "_");
                if (activePlan.schedule[newDayKey]) return;

                updatePlan(activePlanId, { schedule: { ...activePlan.schedule, [newDayKey]: [] } });
            },

            removeDay: (dayName) => {
                const { activePlanId, plans, updatePlan } = get();
                if (!activePlanId) return;

                const activePlan = plans.find((p) => p.id === activePlanId);
                if (!activePlan) return;

                const newSchedule = { ...activePlan.schedule };
                delete newSchedule[dayName];

                updatePlan(activePlanId, { schedule: newSchedule });
            },

            setError: (error) => set({ error }),
            setLoading: (loading) => set({ loading }),
        }),
        {
            name: 'schedule-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                plans: state.plans,
                activePlanId: state.activePlanId,
                lastSyncTimestamp: state.lastSyncTimestamp,
                pendingChanges: state.pendingChanges,
            }),
        }
    )
);

// Auto-sync when coming online
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        const store = useScheduleStore.getState();
        if (store.pendingChanges.length > 0) {
            store.syncToServer();
        }
    });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        useScheduleStore.getState().loadPlans();
    } else {
        const prevUnsubscribe = useScheduleStore.getState().unsubscribe;
        if (prevUnsubscribe) prevUnsubscribe();
        useScheduleStore.setState({
            plans: [],
            activePlanId: null,
            hydrated: false,
            unsubscribe: null,
            error: null,
            loading: false,
            pendingChanges: [],
        });
    }
});
