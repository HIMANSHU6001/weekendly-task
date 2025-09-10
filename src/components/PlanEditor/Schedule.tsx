import React, {useState} from "react";
import {Card} from "@/components/ui/card";
import {DayColumn} from "./DayColumn";
import {useScheduleStore} from "@/store/scheduleStore";
import {cn} from "@/lib/utils";
import {DayManager} from "./DayManager";
import {Waves} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {ActivityCard} from "./ActivityCard";
import type {ScheduledActivity} from "@/lib/types";

export function Schedule() {
  const {plans, activePlanId, draggingDayKey, moveDay, reorderActivities, moveActivityBetweenDays} = useScheduleStore();
  const activePlan = plans.find(p => p.id === activePlanId);
  const [draggedOverDay, setDraggedOverDay] = useState<string | null>(null);
  const [activeActivity, setActiveActivity] = useState<ScheduledActivity | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!activePlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <Waves className="h-16 w-16 mb-4 text-primary/50"/>
        <h2 className="text-2xl font-bold mb-2">No Weekend Plan Selected</h2>
        <p>Create or select a plan from the sidebar to get started.</p>
      </div>
    );
  }

  const schedule = activePlan.schedule;
  const days = Object.keys(schedule);

  // Get all activity IDs for the sortable context
  const allActivityIds = days.flatMap(day =>
    schedule[day].map(activity => activity.instanceId)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const {active} = event;
    const activityId = active.id as string;

    // Find the activity and its day
    let foundActivity: ScheduledActivity | null = null;

    for (const day of days) {
      const activity = schedule[day].find(a => a.instanceId === activityId);
      if (activity) {
        foundActivity = activity;
        break;
      }
    }

    setActiveActivity(foundActivity);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const {active, over} = event;

    if (!over || !active) {
      setDraggedOverDay(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the day that contains the active item
    const activeDay = days.find(day =>
      schedule[day].some(activity => activity.instanceId === activeId)
    );

    let targetDay: string | null;

    if (overId.startsWith('droppable-')) {
      targetDay = overId.replace('droppable-', '');
    } else {
      targetDay = days.find(day =>
        schedule[day].some(activity => activity.instanceId === overId)
      ) || null;
    }

    if (targetDay && activeDay && targetDay !== activeDay) {
      setDraggedOverDay(targetDay);
    } else {
      setDraggedOverDay(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, over} = event;

    setActiveActivity(null);
    setDraggedOverDay(null);

    if (!over || !active) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which day the active item belongs to
    const sourceDay = days.find(day =>
      schedule[day].some(activity => activity.instanceId === activeId)
    );

    if (!sourceDay) return;

    // Handle dropping on a day container (cross-day movement)
    if (overId.startsWith('droppable-')) {
      const targetDay = overId.replace('droppable-', '');
      if (sourceDay !== targetDay) {
        moveActivityBetweenDays(activeId, sourceDay, targetDay);
        return;
      }
    }

    // Handle dropping on another activity
    const targetDay = days.find(day =>
      schedule[day].some(activity => activity.instanceId === overId)
    );

    if (targetDay && sourceDay === targetDay) {
      // Reorder within the same day
      const activities = schedule[sourceDay];
      const oldIndex = activities.findIndex(activity => activity.instanceId === activeId);
      const newIndex = activities.findIndex(activity => activity.instanceId === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reorderedActivities = arrayMove(activities, oldIndex, newIndex);
        reorderActivities(sourceDay, reorderedActivities);
      }
    } else if (targetDay && sourceDay !== targetDay) {
      // Move between days
      moveActivityBetweenDays(activeId, sourceDay, targetDay);
    }
  };

  const handleDayDragOver = (e: React.DragEvent<HTMLDivElement>, dayKey: string) => {
    e.preventDefault();
    if (draggingDayKey) {
      setDraggedOverDay(dayKey);
    }
  };

  const handleDayDrop = (e: React.DragEvent<HTMLDivElement>, dayKey: string) => {
    e.preventDefault();
    if (draggingDayKey) {
      moveDay(draggingDayKey, dayKey);
    }
    setDraggedOverDay(null);
  };

  return (
    <section>
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-3xl font-bold">{activePlan.name}</h2>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allActivityIds} strategy={verticalListSortingStrategy}>
          <div className={cn(
            "grid grid-cols-1 gap-4 lg:gap-8 items-start",
            days.length === 1 && "lg:grid-cols-2",
            days.length === 2 && "lg:grid-cols-2",
            days.length === 3 && "lg:grid-cols-3",
            days.length >= 4 && "lg:grid-cols-4",
          )}>
            {days.map((day) => (
              <div
                key={day}
                onDragOver={(e) => handleDayDragOver(e, day)}
                onDrop={(e) => handleDayDrop(e, day)}
                className="flex flex-col h-full"
              >
                <DayColumn
                  day={day}
                  title={day}
                  isDraggedOver={draggedOverDay === day}
                />
              </div>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeActivity ? (
            <div className="transform rotate-5">
              <ActivityCard
                activity={activeActivity}
                day=""
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-8">
        <DayManager/>
      </div>
    </section>
  );
}