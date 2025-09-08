"use client";

import React, { useState } from "react";
import { useScheduleStore } from "@/store/scheduleStore";
import type { Day } from "@/lib/types";
import { cn } from "@/lib/utils";

type DropIndicatorProps = {
    day: Day;
    index: number;
    fullWidth?: boolean;
};

export function DropIndicator({ day, index, fullWidth }: DropIndicatorProps) {
    const { moveActivity, draggingActivityId } = useScheduleStore();
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const activityId = e.dataTransfer.getData("text/plain");
        setIsDragOver(false);
        moveActivity(activityId, day, index);
    };

    if (!draggingActivityId) {
        return null;
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "h-2 my-1.5 w-full rounded-md transition-colors",
                isDragOver ? "bg-primary" : "bg-primary/20",
                fullWidth ? "h-24" : "h-2"
            )}
        />
    );
}
