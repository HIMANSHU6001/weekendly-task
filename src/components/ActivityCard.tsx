"use client";

import React, { useState } from "react";
import type { ScheduledActivity, Day } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Pencil, MapPin } from "lucide-react";
import { useScheduleStore } from "@/store/scheduleStore";
import { VIBES } from "@/lib/data";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type ActivityCardProps = {
    activity: ScheduledActivity;
    day: Day;
};

export function ActivityCard({ activity, day }: ActivityCardProps) {
    const { removeActivity, updateActivity, setDraggingActivityId } = useScheduleStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editedTime, setEditedTime] = useState(activity.time);
    const [editedLocation, setEditedLocation] = useState(activity.location || "");
    const [editedVibeId, setEditedVibeId] = useState(activity.vibe.id);

    const ActivityIcon = activity.icon;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("text/plain", activity.instanceId);
        e.dataTransfer.effectAllowed = "move";
        setDraggingActivityId(activity.instanceId);
    };

    const handleDragEnd = () => {
        setDraggingActivityId(null);
    };

    const handleUpdate = () => {
        const newVibe = VIBES.find((v) => v.id === editedVibeId);
        if (newVibe) {
            updateActivity(day, {
                ...activity,
                time: editedTime,
                location: editedLocation,
                vibe: newVibe,
            });
        }
        setIsEditing(false);
    };

    return (
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <Card
                className="activity-card relative group transition-shadow duration-300 hover:shadow-xl"
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <CardContent className="p-4 flex items-start gap-4">
                    <div
                        className="absolute top-0 left-0 h-full w-2 rounded-l-lg"
                        style={{ backgroundColor: activity.vibe.color }}
                    />

                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-1" />

                    <div className="flex-1 flex items-center gap-4">
                        <ActivityIcon className="h-8 w-8 text-primary" />
                        <div className="flex-1">
                            <h3 className="font-bold">{activity.name}</h3>
                            <p className="text-sm text-muted-foreground">{activity.time}</p>
                            {activity.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{activity.location}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10"
                            onClick={() => removeActivity(day, activity.instanceId)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Activity: {activity.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">Time</Label>
                        <Input id="time" value={editedTime} onChange={(e) => setEditedTime(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">Location</Label>
                        <Input id="location" placeholder="e.g. Central Park" value={editedLocation} onChange={(e) => setEditedLocation(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4 pt-2">
                        <Label className="text-right pt-2">Vibe</Label>
                        <RadioGroup value={editedVibeId} onValueChange={(val: "happy" | "relaxed" | "energetic") => setEditedVibeId(val)} className="col-span-3">
                            <div className="flex items-center gap-4">
                                {VIBES.map(vibe => {
                                    const VibeRadioIcon = vibe.icon;
                                    return (
                                        <Label key={vibe.id} htmlFor={`vibe-${vibe.id}`} className="flex items-center gap-2 cursor-pointer font-normal">
                                            <RadioGroupItem value={vibe.id} id={`vibe-${vibe.id}`} />
                                            <VibeRadioIcon className={`h-5 w-5 text-[${vibe.color}]`} />
                                            {vibe.name}
                                        </Label>
                                    )
                                })}
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <Button onClick={handleUpdate}>Save Changes</Button>
            </DialogContent>
        </Dialog>
    );
}
