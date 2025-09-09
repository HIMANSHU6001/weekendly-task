"use client";

import React, {useState} from "react";
import {Card} from "@/components/ui/card";
import {DayColumn} from "./DayColumn";
import {useScheduleStore} from "@/store/scheduleStore";
import {cn} from "@/lib/utils";
import {DayManager} from "./DayManager";
import {Waves} from "lucide-react";

export function Schedule() {
  const {plans, activePlanId, draggingDayKey, moveDay} = useScheduleStore();
  const activePlan = plans.find(p => p.id === activePlanId);
  const [draggedOverDay, setDraggedOverDay] = useState<string | null>(null);

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dayKey: string) => {
    e.preventDefault();
    if (draggingDayKey) {
      setDraggedOverDay(dayKey);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dayKey: string) => {
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
            onDragOver={(e) => handleDragOver(e, day)}
            onDragLeave={() => setDraggedOverDay(null)}
            onDrop={(e) => handleDrop(e, day)}
            className={cn(
              "transition-all duration-300",
              draggingDayKey && draggedOverDay === day && "opacity-50"
            )}
          >
            <Card className="border-none shadow-none bg-transparent">
              <DayColumn day={day} title={day.replace(/_/g, " ")}/>
            </Card>
          </div>
        ))}
        {days.length < 4 && !draggingDayKey && (
          <Card className="border-none shadow-none bg-transparent">
            <DayManager/>
          </Card>
        )}
      </div>
    </section>
  );
}
