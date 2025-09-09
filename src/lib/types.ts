import type {LucideIcon} from "lucide-react";

export type Activity = {
  id: string;
  name: string;
  icon: LucideIcon;
  category: CategoryInfo;
};

export type Vibe = {
  id: "happy" | "relaxed" | "energetic";
  name: string;
  icon: LucideIcon;
};

export type ScheduledActivity = Activity & {
  instanceId: string;
  time: string;
  vibe: Vibe;
  location?: string;
};

export type Day = string;

export type Category = "lazy" | "adventurous" | "family" | "all";

export type CategoryInfo = {
  value: Category;
  label: string;
  color: string;
};

export type Plan = {
  id: string;
  name: string;
  color: string;
  schedule: Record<Day, ScheduledActivity[]>;
  category: Category;
};
