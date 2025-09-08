"use client";

import React, {useState} from "react";
import {useScheduleStore} from "@/store/scheduleStore";
import {ACTIVITIES, VIBES} from "@/lib/data";
import type {Activity} from "@/lib/types";
import {Button} from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {Input} from "@/components/ui/input";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Plus} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import {useForm} from "react-hook-form";

export function ActivitySelector() {
    const {addActivity, activePlanId, plans} = useScheduleStore();
    const activePlan = plans.find((p) => p.id === activePlanId);
    const schedule = activePlan?.schedule || {};

    const {toast} = useToast();
    const [openPopover, setOpenPopover] = useState("");
    const form = useForm({
        defaultValues: {
            time: "10:00 AM",
            vibe: "happy",
            location: "",
        },
    });

    const handleAddActivity = (
        activity: Activity,
        values: { time: string; vibe: string; location: string }
    ) => {
        const {time, vibe: vibeId, location} = values;

        if (!activePlanId) {
            toast({
                title: "No Active Plan",
                description: "Please select or create a plan first.",
                variant: "destructive",
            });
            return;
        }

        if (!time || !vibeId) {
            toast({
                title: "Missing Details",
                description: "Please set a time and vibe for your activity.",
                variant: "destructive",
            });
            return;
        }

        const firstDay = Object.keys(schedule)[0];
        if (!firstDay) {
            toast({
                title: "No Days in Schedule",
                description: "Please add a day to your schedule first.",
                variant: "destructive",
            });
            return;
        }

        const vibe = VIBES.find((v) => v.id === vibeId);
        if (vibe) {
            addActivity(firstDay, {
                ...activity,
                instanceId: crypto.randomUUID(),
                time,
                vibe,
                location,
            });
            toast({
                title: `Added "${activity.name}"`,
                description: `It's been added to ${firstDay}. You can drag it to other days!`,
            });
            setOpenPopover("");
            form.reset();
        }
    };

    return (
        <div className="space-y-2">
            <h3 className="font-bold text-lg px-2">Choose Activities</h3>
            <ScrollArea className="h-[calc(100vh-450px)] px-2">
                <div className="space-y-2 pr-2">
                    {ACTIVITIES.map((activity) => {
                        const ActivityIcon = activity.icon;
                        return (
                            <Popover
                                key={activity.id}
                                open={openPopover === activity.id}
                                onOpenChange={(isOpen) =>
                                    setOpenPopover(isOpen ? activity.id : "")
                                }
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-4"
                                        disabled={!activePlanId}
                                    >
                                        <ActivityIcon className="h-5 w-5 text-primary/80"/>
                                        <span className="flex-1 text-left">{activity.name}</span>
                                        <Plus className="h-4 w-4"/>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <Form {...form}>
                                        <form
                                            onSubmit={form.handleSubmit(
                                                (values) => handleAddActivity(activity, values)
                                            )}
                                            className="grid gap-4"
                                        >
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">
                                                    Add {activity.name}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Set a time and vibe for this activity.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="time"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel>Time</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="location"
                                                    render={({field}) => (
                                                        <FormItem>
                                                            <FormLabel>Location</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    {...field}
                                                                    placeholder="e.g. Central Park"
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="vibe"
                                                render={({field}) => (
                                                    <FormItem className="space-y-3">
                                                        <FormLabel>Vibe</FormLabel>
                                                        <FormControl>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                defaultValue={field.value}
                                                                className="flex items-center gap-4"
                                                            >
                                                                {VIBES.map((vibe) => {
                                                                    const VibeIcon = vibe.icon;
                                                                    return (
                                                                        <FormItem
                                                                            key={vibe.id}
                                                                            className="flex items-center space-x-2 space-y-0"
                                                                        >
                                                                            <FormControl>
                                                                                <RadioGroupItem
                                                                                    value={vibe.id}
                                                                                    id={`vibe-popover-${activity.id}-${vibe.id}`}
                                                                                />
                                                                            </FormControl>
                                                                            <FormLabel
                                                                                htmlFor={`vibe-popover-${activity.id}-${vibe.id}`}
                                                                                className="font-normal flex items-center gap-2 cursor-pointer"
                                                                            >
                                                                                <VibeIcon
                                                                                    className={`h-5 w-5 text-[${vibe.color}]`}/>
                                                                                {vibe.name}
                                                                            </FormLabel>
                                                                        </FormItem>
                                                                    );
                                                                })}
                                                            </RadioGroup>
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button type="submit">Add to Schedule</Button>
                                        </form>
                                    </Form>
                                </PopoverContent>
                            </Popover>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
