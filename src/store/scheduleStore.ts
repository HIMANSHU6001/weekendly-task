"use client";

import { create } from "zustand";
import type { ScheduledActivity, Day, Category, Plan } from "@/lib/types";
import { planService } from "@/lib/planService";
import { auth } from "@/lib/firebase";

type ScheduleState = {
    plans: Plan[];
    activePlanId: string | null;
    draggingActivityId: string | null;
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
      draggingActivityId: null,
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
              const plans = await planService.getPlans(currentUser.uid);
              set({ plans, hydrated: true });

              const state = get();
              if (!state.activePlanId && plans.length > 0) {
                  set({ activePlanId: plans[0].id });
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
              const newPlan = await planService.createPlan(currentUser.uid, name, color);

              const updatedState = get();
              const updatedPlans = updatedState.plans.map(plan =>
                  plan.id === optimisticPlanId ? newPlan : plan
              );

              set({
                  plans: updatedPlans,
                  activePlanId: newPlan.id
              });
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
              // Make the actual API call
              await planService.deletePlan(currentUser.uid, planId);
              // Success - optimistic update was correct, no need to change anything
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
              // Make the actual API call
              await planService.updatePlan(currentUser.uid, planId, updates);
              // Success - optimistic update was correct, no need to change anything
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

      moveActivity: (activityId, targetDay, targetIndex) => {
          const { activePlanId, plans, updatePlan } = get();
          if (!activePlanId) return;
          const activePlan = plans.find(p => p.id === activePlanId);
          if (!activePlan) return;

          let activityToMove: ScheduledActivity | null = null;
          let sourceDayKey = '';

          // Find and remove the activity from its current location
          const updatedSchedule = { ...activePlan.schedule };
          for (const [dayKey, activities] of Object.entries(updatedSchedule)) {
              const activityIndex = activities.findIndex(a => a.instanceId === activityId);
              if (activityIndex !== -1) {
                  activityToMove = activities[activityIndex];
                  sourceDayKey = dayKey;
                  updatedSchedule[dayKey] = activities.filter(a => a.instanceId !== activityId);
                  break;
              }
          }

          if (!activityToMove) return;

          // Add the activity to the target day at the specified index
          const targetDayKey = targetDay.toLowerCase().replace(/\s/g, '_');
          if (!updatedSchedule[targetDayKey]) {
              updatedSchedule[targetDayKey] = [];
          }

          updatedSchedule[targetDayKey].splice(targetIndex, 0, activityToMove);
          updatePlan(activePlanId, { schedule: updatedSchedule });
      },

      setDraggingActivityId: (id) => set({ draggingActivityId: id }),

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
