import type { LucideIcon } from "lucide-react";

export type Activity = {
    id: string;
    name: string;
    icon: LucideIcon;
};

export type Vibe = {
    id: "happy" | "relaxed" | "energetic";
    name: string;
    icon: LucideIcon;
    color: string;
};

export type ScheduledActivity = Activity & {
    instanceId: string;
    time: string;
    vibe: Vibe;
    location?: string;
};

export type Day = string;

export type Theme = "lazy" | "adventurous" | "family" | "default";

export type ThemeInfo = {
    value: Theme;
    label: string;
};

export type Plan = {
    id:string;
    name: string;
    color: string;
    schedule: Record<Day, ScheduledActivity[]>;
    theme: Theme;
};
