"use client";

import { create } from "zustand";
import type { ScheduledActivity, Day, Theme, Plan } from "@/lib/types";
import {
    doc,
    setDoc,
    deleteDoc,
    collection,
    onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type ScheduleState = {
    plans: Plan[];
    activePlanId: string | null;
    draggingActivityId: string | null;
    draggingDayKey: string | null;
    hydrated: boolean;
    unsubscribe: (() => void) | null;
};

type ScheduleActions = {
    // Firestore sync
    syncWithFirestore: () => void;

    // Plan actions
    setPlans: (plans: Plan[]) => void;
    addPlan: (name: string, color: string) => Promise<void>;
    removePlan: (planId: string) => Promise<void>;
    updatePlan: (planId: string, updates: Partial<Omit<Plan, "id">>) => Promise<void>;
    setActivePlanId: (planId: string) => void;

    // Activity actions
    addActivity: (day: Day, activity: ScheduledActivity) => void;
    removeActivity: (day: Day, instanceId: string) => void;
    updateActivity: (day: Day, updatedActivity: ScheduledActivity) => void;
    moveActivity: (
        activityId: string,
        targetDay: Day,
        targetIndex: number
    ) => void;
    setDraggingActivityId: (id: string | null) => void;

    // Day actions
    addDay: (dayName: string) => void;
    removeDay: (dayName: string) => void;
    moveDay: (draggedDayKey: string, targetDayKey: string) => void;
    setDraggingDayKey: (key: string | null) => void;

    // Theme
    setTheme: (theme: Theme) => void;
};

const defaultPlan: Omit<Plan, 'id'> = {
    name: "My First Weekend",
    color: "blue",
    schedule: {
        saturday: [],
        sunday: [],
    },
    theme: "default",
};

export const useScheduleStore = create<ScheduleState & ScheduleActions>()(
    (set, get) => ({
        plans: [],
        activePlanId: null,
        draggingActivityId: null,
        draggingDayKey: null,
        hydrated: false,
        unsubscribe: null,

        syncWithFirestore: () => {
            const { currentUser } = auth;
            if (!currentUser) return;

            const prevUnsubscribe = get().unsubscribe;
            if (prevUnsubscribe) prevUnsubscribe();

            const plansCollection = collection(db, "users", currentUser.uid, "plans");
            const unsubscribe = onSnapshot(plansCollection, (snapshot) => {
                if (snapshot.empty) {
                    // Create default plan if none exist
                    const newPlanId = "default_plan";
                    setDoc(doc(db, "users", currentUser.uid, "plans", newPlanId), defaultPlan);
                } else {
                    const plans = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Plan[];
                    set({ plans });
                    if (!get().activePlanId || !plans.some(p => p.id === get().activePlanId)) {
                        set({ activePlanId: plans[0]?.id || null });
                    }
                }
                set({ hydrated: true });
            });
            set({unsubscribe});
        },

        setPlans: (plans) => set({ plans }),

        setActivePlanId: (planId) => set({ activePlanId: planId }),

        addPlan: async (name, color) => {
            const { currentUser } = auth;
            if (!currentUser) return;

            const newPlanId = crypto.randomUUID();
            const newPlan: Plan = {
                id: newPlanId,
                name,
                color,
                schedule: { saturday: [], sunday: [] },
                theme: "default",
            };
            const planRef = doc(db, "users", currentUser.uid, "plans", newPlanId);
            await setDoc(planRef, newPlan);
            set({ activePlanId: newPlanId });
        },

        removePlan: async (planId) => {
            const { currentUser } = auth;
            if (!currentUser) return;

            await deleteDoc(doc(db, "users", currentUser.uid, "plans", planId));
        },

        updatePlan: async (planId, updates) => {
            const { currentUser } = auth;
            if (!currentUser) return;

            const planRef = doc(db, "users", currentUser.uid, "plans", planId);
            // We get the current plan and merge updates
            const currentPlan = get().plans.find(p => p.id === planId);
            if(currentPlan) {
                await setDoc(planRef, { ...currentPlan, ...updates }, { merge: true });
            }
        },

        setTheme: (theme) => {
            const { activePlanId, updatePlan } = get();
            if (activePlanId) {
                updatePlan(activePlanId, { theme });
            }
        },

        addActivity: (day, activity) => {
            const { activePlanId, plans, updatePlan } = get();
            if (!activePlanId) return;
            const activePlan = plans.find(p => p.id === activePlanId);
            if (!activePlan) return;

            const newSchedule = { ...activePlan.schedule };
            newSchedule[day] = [...(newSchedule[day] || []), activity];
            updatePlan(activePlanId, { schedule: newSchedule });
        },

        removeActivity: (day, instanceId) => {
            const { activePlanId, plans, updatePlan } = get();
            if (!activePlanId) return;
            const activePlan = plans.find(p => p.id === activePlanId);
            if (!activePlan) return;

            const newSchedule = { ...activePlan.schedule };
            newSchedule[day] = newSchedule[day].filter(act => act.instanceId !== instanceId);
            updatePlan(activePlanId, { schedule: newSchedule });
        },

        updateActivity: (day, updatedActivity) => {
            const { activePlanId, plans, updatePlan } = get();
            if (!activePlanId) return;
            const activePlan = plans.find(p => p.id === activePlanId);
            if (!activePlan) return;

            const newSchedule = { ...activePlan.schedule };
            newSchedule[day] = newSchedule[day].map((act) =>
                act.instanceId === updatedActivity.instanceId ? updatedActivity : act
            );
            updatePlan(activePlanId, { schedule: newSchedule });
        },

        setDraggingActivityId: (id) => set({ draggingActivityId: id }),

        moveActivity: (instanceId, targetDay, targetIndex) => {
            const { activePlanId, plans, updatePlan } = get();
            if (!activePlanId) return;
            const activePlan = plans.find(p => p.id === activePlanId);
            if (!activePlan) return;

            let activityToMove: ScheduledActivity | undefined;
            const newSchedule = { ...activePlan.schedule };

            for (const day in newSchedule) {
                const typedDay = day as Day;
                const foundActivity = newSchedule[typedDay].find(act => act.instanceId === instanceId);
                if (foundActivity) {
                    activityToMove = foundActivity;
                    newSchedule[typedDay] = newSchedule[typedDay].filter(act => act.instanceId !== instanceId);
                    break;
                }
            }

            if (activityToMove) {
                const destinationActivities = [...(newSchedule[targetDay] || [])];
                destinationActivities.splice(targetIndex, 0, activityToMove);
                newSchedule[targetDay] = destinationActivities;
                updatePlan(activePlanId, { schedule: newSchedule });
            }
        },

        setDraggingDayKey: (key) => set({ draggingDayKey: key }),

        moveDay: (draggedDayKey, targetDayKey) => {
            const { activePlanId, plans, updatePlan } = get();
            if (!activePlanId) return;
            const activePlan = plans.find(p => p.id === activePlanId);
            if (!activePlan) return;

            const schedule = activePlan.schedule;
            const scheduleEntries = Object.entries(schedule);

            const draggedIndex = scheduleEntries.findIndex(([key]) => key === draggedDayKey);
            const targetIndex = scheduleEntries.findIndex(([key]) => key === targetDayKey);

            if (draggedIndex === -1 || targetIndex === -1) return;

            const [draggedItem] = scheduleEntries.splice(draggedIndex, 1);
            scheduleEntries.splice(targetIndex, 0, draggedItem);

            const newSchedule = scheduleEntries.reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
            }, {} as Record<Day, ScheduledActivity[]>);

            updatePlan(activePlanId, { schedule: newSchedule });
        },

        addDay: (dayName) => {
            const { activePlanId, plans, updatePlan } = get();
            if (!activePlanId) return;
            const activePlan = plans.find(p => p.id === activePlanId);
            if (!activePlan) return;

            const newDayKey = dayName.toLowerCase().replace(/\s/g, '_');
            if (activePlan.schedule[newDayKey]) {
                return; // Day already exists
            }

            const newSchedule = { ...activePlan.schedule, [newDayKey]: [] };
            updatePlan(activePlanId, { schedule: newSchedule });
        },

        removeDay: (dayName) => {
            const { activePlanId, plans, updatePlan } = get();
            if (!activePlanId) return;
            const activePlan = plans.find(p => p.id === activePlanId);
            if (!activePlan) return;

            const newSchedule = { ...activePlan.schedule };
            delete newSchedule[dayName];
            updatePlan(activePlanId, { schedule: newSchedule });
        },
    })
);

// Listen to auth changes to sync data
auth.onAuthStateChanged((user) => {
    if (user) {
        useScheduleStore.getState().syncWithFirestore();
    } else {
        // Clear state on logout
        const prevUnsubscribe = useScheduleStore.getState().unsubscribe;
        if (prevUnsubscribe) prevUnsubscribe();
        useScheduleStore.setState({ plans: [], activePlanId: null, hydrated: false, unsubscribe: null });
    }
});
