"use client";

import { create } from "zustand";
import type { ScheduledActivity, Day, Category, Plan } from "@/lib/types";
import { planService } from "@/lib/planService";
import { auth } from "@/lib/firebase";
import { offlineManager, type OfflineAction } from "@/lib/offlineManager";

type ScheduleState = {
    plans: Plan[];
    activePlanId: string | null;
    draggingDayKey: string | null;
    hydrated: boolean;
    unsubscribe: (() => void) | null;
    loading: boolean;
    error: string | null;
};

type ScheduleActions = {
    // API sync methods
    loadPlans: () => Promise<void>;

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
    reorderActivities: (day: Day, activities: ScheduledActivity[]) => void;
    moveActivityBetweenDays: (activityInstanceId: string, fromDay: Day, toDay: Day, toIndex?: number) => void;

    // Day actions
    addDay: (dayName: string) => void;
    removeDay: (dayName: string) => void;
    moveDay: (draggedDayKey: string, targetDayKey: string) => void;
    setDraggingDayKey: (key: string | null) => void;

    // Category
    setCategory: (category: Category) => void;

    // Error handling
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
};

export const useScheduleStore = create<ScheduleState & ScheduleActions>()(
  (set, get) => ({
      plans: [],
      activePlanId: null,
      draggingDayKey: null,
      hydrated: false,
      unsubscribe: null,
      loading: false,
      error: null,

      loadPlans: async () => {
          const { currentUser } = auth;
          if (!currentUser) return;

          try {
              set({ loading: true, error: null });

              // Try to fetch plans with offline support
              const { data: plans, isOffline } = await offlineManager.fetchWithOfflineSupport(
                  `/api/plans?userId=${currentUser.uid}`
              );

              set({
                  plans,
                  hydrated: true,
                  error: isOffline ? 'Using offline data' : null
              });

              const state = get();
              if (!state.activePlanId && plans.length > 0) {
                  set({ activePlanId: plans[0].id });
              }

              // Cache plans for offline use
              if (!isOffline) {
                  plans.forEach((plan: any) => offlineManager.cachePlan(plan));
              }
          } catch (error) {
              console.error('Error loading plans:', error);
              set({ error: 'Failed to load plans' });
          } finally {
              set({ loading: false });
          }
      },

      setPlans: (plans) => set({ plans }),

      setActivePlanId: (planId) => set({ activePlanId: planId }),

      addPlan: async (name, color) => {
          const { currentUser } = auth;
          if (!currentUser) return;

          const optimisticPlanId = `temp_${crypto.randomUUID()}`;
          const optimisticPlan = {
              id: optimisticPlanId,
              name,
              color,
              schedule: { saturday: [], sunday: [] },
              category: "all" as const,
          };

          const currentState = get();
          set({
              plans: [...currentState.plans, optimisticPlan],
              activePlanId: optimisticPlanId,
              error: null
          });

          try {
              if (offlineManager.isOnline) {
                  const newPlan = await planService.createPlan(currentUser.uid, name, color);

                  const updatedState = get();
                  const updatedPlans = updatedState.plans.map(plan =>
                      plan.id === optimisticPlanId ? newPlan : plan
                  );

                  set({
                      plans: updatedPlans,
                      activePlanId: newPlan.id
                  });

                  // Cache the new plan for offline use
                  await offlineManager.cachePlan(newPlan);
              } else {
                  // We're offline, queue the action for later sync
                  const offlineAction: OfflineAction = {
                      type: 'CREATE',
                      endpoint: `/api/plans`,
                      method: 'POST',
                      data: { name, color, userId: currentUser.uid },
                      timestamp: Date.now()
                  };

                  await offlineManager.queueAction(offlineAction);

                  // Update the optimistic plan with offline indicator
                  const finalPlan = { ...optimisticPlan, id: crypto.randomUUID() };
                  const updatedState = get();
                  const updatedPlans = updatedState.plans.map(plan =>
                      plan.id === optimisticPlanId ? finalPlan : plan
                  );

                  set({
                      plans: updatedPlans,
                      activePlanId: finalPlan.id,
                      error: 'Plan created offline - will sync when online'
                  });

                  // Cache for offline use
                  await offlineManager.cachePlan(finalPlan);
              }
          } catch (error) {
              console.error('Error adding plan:', error);

              // Rollback optimistic update on error
              const rollbackState = get();
              const rollbackPlans = rollbackState.plans.filter(plan => plan.id !== optimisticPlanId);
              const newActivePlanId = rollbackPlans.length > 0 ? rollbackPlans[0].id : null;

              set({
                  plans: rollbackPlans,
                  activePlanId: newActivePlanId,
                  error: 'Failed to create plan'
              });
          }
      },

      removePlan: async (planId) => {
          const { currentUser } = auth;
          if (!currentUser) return;

          const currentState = get();
          const planToRemove = currentState.plans.find(p => p.id === planId);

          if (!planToRemove) return;

          // Optimistically update UI immediately
          const optimisticPlans = currentState.plans.filter(p => p.id !== planId);
          const newActivePlanId = currentState.activePlanId === planId
              ? (optimisticPlans[0]?.id || null)
              : currentState.activePlanId;

          set({
              plans: optimisticPlans,
              activePlanId: newActivePlanId,
              error: null
          });

          try {
              if (offlineManager.isOnline) {
                  await planService.deletePlan(currentUser.uid, planId);
              } else {
                  // Queue for sync when online
                  const offlineAction: OfflineAction = {
                      type: 'DELETE',
                      endpoint: `/api/plans/${planId}`,
                      method: 'DELETE',
                      planId,
                      timestamp: Date.now()
                  };

                  await offlineManager.queueAction(offlineAction);
                  set({ error: 'Plan deleted offline - will sync when online' });
              }
          } catch (error) {
              console.error('Error removing plan:', error);

              // Rollback optimistic update on error
              set({
                  plans: currentState.plans,
                  activePlanId: currentState.activePlanId,
                  error: 'Failed to delete plan'
              });
          }
      },

      updatePlan: async (planId, updates) => {
          const { currentUser } = auth;
          if (!currentUser) return;

          const currentState = get();
          const planToUpdate = currentState.plans.find(p => p.id === planId);

          if (!planToUpdate) return;

          // Optimistically update UI immediately
          const optimisticPlans = currentState.plans.map(plan =>
              plan.id === planId ? { ...plan, ...updates } : plan
          );

          set({
              plans: optimisticPlans,
              error: null
          });

          try {
              if (offlineManager.isOnline) {
                  await planService.updatePlan(currentUser.uid, planId, updates);

                  // Cache updated plan for offline use
                  const updatedPlan = optimisticPlans.find(p => p.id === planId);
                  if (updatedPlan) {
                      await offlineManager.cachePlan(updatedPlan);
                  }
              } else {
                  // Queue for sync when online
                  const offlineAction: OfflineAction = {
                      type: 'UPDATE',
                      endpoint: `/api/plans/${planId}`,
                      method: 'PUT',
                      data: updates,
                      planId,
                      timestamp: Date.now()
                  };

                  await offlineManager.queueAction(offlineAction);

                  // Cache updated plan for offline use
                  const updatedPlan = optimisticPlans.find(p => p.id === planId);
                  if (updatedPlan) {
                      await offlineManager.cachePlan(updatedPlan);
                  }

                  set({ error: 'Plan updated offline - will sync when online' });
              }
          } catch (error) {
              console.error('Error updating plan:', error);

              // Rollback optimistic update on error
              set({
                  plans: currentState.plans,
                  error: 'Failed to update plan'
              });
          }
      },

      addActivity: (day, activity) => {
          const { activePlanId, plans, updatePlan } = get();
          if (!activePlanId) return;
          const activePlan = plans.find(p => p.id === activePlanId);
          if (!activePlan) return;

          const dayKey = day.toLowerCase().replace(/\s/g, '_');
          const currentActivities = activePlan.schedule[dayKey] || [];
          const newSchedule = {
              ...activePlan.schedule,
              [dayKey]: [...currentActivities, activity]
          };

          const optimisticPlans = plans.map(plan =>
              plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan
          );
          set({ plans: optimisticPlans });

          updatePlan(activePlanId, { schedule: newSchedule });
      },

      removeActivity: (day, instanceId) => {
          const { activePlanId, plans, updatePlan } = get();
          if (!activePlanId) return;
          const activePlan = plans.find(p => p.id === activePlanId);
          if (!activePlan) return;

          const dayKey = day.toLowerCase().replace(/\s/g, '_');
          const currentActivities = activePlan.schedule[dayKey] || [];
          const newSchedule = {
              ...activePlan.schedule,
              [dayKey]: currentActivities.filter(activity => activity.instanceId !== instanceId)
          };

          // Optimistically update local state immediately
          const optimisticPlans = plans.map(plan =>
              plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan
          );
          set({ plans: optimisticPlans });

          // Then sync with server
          updatePlan(activePlanId, { schedule: newSchedule });
      },

      updateActivity: (day, updatedActivity) => {
          const { activePlanId, plans, updatePlan } = get();
          if (!activePlanId) return;
          const activePlan = plans.find(p => p.id === activePlanId);
          if (!activePlan) return;

          const dayKey = day.toLowerCase().replace(/\s/g, '_');
          const currentActivities = activePlan.schedule[dayKey] || [];
          const newSchedule = {
              ...activePlan.schedule,
              [dayKey]: currentActivities.map(activity =>
                  activity.instanceId === updatedActivity.instanceId ? updatedActivity : activity
              )
          };

          // Optimistically update local state immediately
          const optimisticPlans = plans.map(plan =>
              plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan
          );
          set({ plans: optimisticPlans });

          // Then sync with server
          updatePlan(activePlanId, { schedule: newSchedule });
      },

      reorderActivities: (day, activities) => {
          const { activePlanId, plans, updatePlan } = get();
          if (!activePlanId) return;
          const activePlan = plans.find(p => p.id === activePlanId);
          if (!activePlan) return;

          const dayKey = day.toLowerCase().replace(/\s/g, '_');
          const newSchedule = {
              ...activePlan.schedule,
              [dayKey]: activities
          };

          // Optimistically update local state immediately
          const optimisticPlans = plans.map(plan =>
              plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan
          );
          set({ plans: optimisticPlans });

          // Then sync with server
          updatePlan(activePlanId, { schedule: newSchedule });
      },

      moveActivityBetweenDays: (activityInstanceId, fromDay, toDay, toIndex) => {
          const { activePlanId, plans, updatePlan } = get();
          if (!activePlanId) return;
          const activePlan = plans.find(p => p.id === activePlanId);
          if (!activePlan) return;

          const fromDayKey = fromDay.toLowerCase().replace(/\s/g, '_');
          const toDayKey = toDay.toLowerCase().replace(/\s/g, '_');

          const fromActivities = activePlan.schedule[fromDayKey] || [];
          const toActivities = activePlan.schedule[toDayKey] || [];

          // Find the activity to move
          const activityToMove = fromActivities.find(activity => activity.instanceId === activityInstanceId);
          if (!activityToMove) return;

          // Remove the activity from the original day
          const newFromActivities = fromActivities.filter(activity => activity.instanceId !== activityInstanceId);

          // Add the activity to the target day
          let newToActivities;
          if (typeof toIndex === 'number' && toIndex >= 0 && toIndex <= toActivities.length) {
              // Insert at specific index
              newToActivities = [
                  ...toActivities.slice(0, toIndex),
                  activityToMove,
                  ...toActivities.slice(toIndex)
              ];
          } else {
              // Append to the end
              newToActivities = [...toActivities, activityToMove];
          }

          const newSchedule = {
              ...activePlan.schedule,
              [fromDayKey]: newFromActivities,
              [toDayKey]: newToActivities
          };

          // Optimistically update local state immediately
          const optimisticPlans = plans.map(plan =>
              plan.id === activePlanId ? { ...plan, schedule: newSchedule } : plan
          );
          set({ plans: optimisticPlans });

          // Then sync with server
          updatePlan(activePlanId, { schedule: newSchedule });
      },

      moveDay: (draggedDayKey, targetDayKey) => {
          const { activePlanId, plans, updatePlan } = get();
          if (!activePlanId) return;
          const activePlan = plans.find(p => p.id === activePlanId);
          if (!activePlan) return;

          const schedule = activePlan.schedule;
          const dayKeys = Object.keys(schedule);
          const draggedIndex = dayKeys.indexOf(draggedDayKey);
          const targetIndex = dayKeys.indexOf(targetDayKey);

          if (draggedIndex === -1 || targetIndex === -1) return;

          const newDayKeys = [...dayKeys];
          newDayKeys.splice(draggedIndex, 1);
          newDayKeys.splice(targetIndex, 0, draggedDayKey);

          const newSchedule: { [key: string]: ScheduledActivity[] } = {};
          newDayKeys.forEach(key => {
              newSchedule[key] = schedule[key];
          });

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

      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),
  })
);

// Listen to auth changes to sync data
auth.onAuthStateChanged((user) => {
    if (user) {
        useScheduleStore.getState().loadPlans();
    } else {
        // Clear state on logout
        const prevUnsubscribe = useScheduleStore.getState().unsubscribe;
        if (prevUnsubscribe) prevUnsubscribe();
        useScheduleStore.setState({
            plans: [],
            activePlanId: null,
            hydrated: false,
            unsubscribe: null,
            error: null,
            loading: false
        });
    }
});
