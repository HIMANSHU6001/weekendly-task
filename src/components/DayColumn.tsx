"use client";

import React, {useState} from "react";
import type {Day} from "@/lib/types";
import {useScheduleStore} from "@/store/scheduleStore";
import {DropIndicator} from "./DropIndicator";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {GripVertical, Trash2} from "lucide-react";
import {ActivityCard} from "./ActivityCard";

type DayColumnProps = {
  day: Day;
  title: string;
};

export function DayColumn({day, title}: DayColumnProps) {
  const {plans, activePlanId, draggingActivityId, moveActivity, removeDay, setDraggingDayKey} = useScheduleStore();
  const activePlan = plans.find(p => p.id === activePlanId);
  const activities = activePlan?.schedule[day] || [];
  const schedule = activePlan?.schedule || {};

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('application/day-key')) {
      return;
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.types.includes('application/day-key')) {
      return;
    }

    if (activities.length === 0) {
      const activityId = e.dataTransfer.getData("text/plain");
      moveActivity(activityId, day, 0);
    }
  };

  const days = Object.keys(schedule);
  const canDelete = days.length > 1;

  const handleDayDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("application/day-key", day);
    e.dataTransfer.effectAllowed = "move";
    setDraggingDayKey(day);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "p-4 rounded-lg border-2 border-dashed transition-colors duration-300 h-full min-h-[200px]",
        isDragOver ? "border-primary bg-primary/10" : "border-transparent"
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
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 cursor-pointer"
                  onClick={() => removeDay(day)}>
            <Trash2 className="h-4 w-4 text-destructive"/>
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <React.Fragment key={activity.instanceId}>
              <DropIndicator day={day} index={index}/>
              <ActivityCard activity={activity} day={day}/>
            </React.Fragment>
          ))
        ) : (
          draggingActivityId && (
            <DropIndicator day={day} index={0} fullWidth={true}/>
          )
        )}
        {activities.length > 0 && (
          <DropIndicator day={day} index={activities.length}/>
        )}

        {!draggingActivityId && activities.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            <p>Drag activities here</p>
          </div>
        )}
      </div>
    </div>
  );
}
