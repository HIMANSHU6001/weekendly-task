"use client";

import React from "react";
import type {Day} from "@/lib/types";
import {useScheduleStore} from "@/store/scheduleStore";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {GripVertical, Trash2} from "lucide-react";
import {ActivityCard} from "./ActivityCard";
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {useDroppable} from '@dnd-kit/core';

type DayColumnProps = {
  day: Day;
  title: string;
  isDraggedOver?: boolean;
};

export function DayColumn({day, title, isDraggedOver = false}: DayColumnProps) {
  const {
    plans,
    activePlanId,
    removeDay,
    setDraggingDayKey,
  } = useScheduleStore();

  const activePlan = plans.find(p => p.id === activePlanId);
  const activities = activePlan?.schedule[day] || [];
  const schedule = activePlan?.schedule || {};

  const {isOver, setNodeRef} = useDroppable({
    id: `droppable-${day}`,
  });

  const days = Object.keys(schedule);
  const canDelete = days.length > 1;

  const handleDayDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/day-key", day);
    e.dataTransfer.effectAllowed = "move";
    setDraggingDayKey(day);
  };

  const activeColor = activePlan?.color || "hsl(var(--primary))";

  return (
    <div
      ref={setNodeRef}
      style={{backgroundColor: activeColor + '55'}}
      className={cn(
        "p-4 rounded-lg border-2 h-full min-h-[200px] transition-all duration-300",
        (isDraggedOver || isOver) ? "border-primary bg-primary/10 border-dashed" : "border-transparent"
      )}
    >
      <div
        className="flex justify-between items-center mb-4 cursor-grab"
        draggable
        onDragStart={handleDayDragStart}
        onDragEnd={() => setDraggingDayKey(null)}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground"/>
          <h2 className="text-2xl font-bold text-center capitalize">{title}</h2>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-destructive/10 cursor-pointer"
            onClick={() => removeDay(day)}
          >
            <Trash2 className="h-4 w-4 text-destructive"/>
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-[100px]">
        {activities.length > 0 ? (
          <SortableContext
            items={activities.map(a => a.instanceId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityCard
                  key={activity.instanceId}
                  activity={activity}
                  day={day}
                />
              ))}
            </div>
          </SortableContext>
        ) : (
          <div className={cn(
            "text-center text-muted-foreground py-10 rounded-lg transition-all duration-300",
            (isDraggedOver || isOver) && "bg-primary/5 border-2 border-dashed border-primary/30"
          )}>
            {isDraggedOver || isOver ? (
              <div className="space-y-2">
                <p className="text-primary font-medium">Drop activity here</p>
                <p className="text-sm text-primary/70">Release to add to {title}</p>
              </div>
            ) : (
              <>
                <p>No activities yet</p>
                <p className="text-sm">Add activities from the sidebar or drag from other days</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}