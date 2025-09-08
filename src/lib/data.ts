import type { Activity, Vibe, ThemeInfo } from "@/lib/types";
import {
    Coffee,
    Mountain,
    Film,
    BookOpen,
    Dumbbell,
    Landmark,
    Sprout,
    Waves,
    Smile,
    Wind,
    Zap,
} from "lucide-react";

export const ACTIVITIES: Activity[] = [
    { id: "1", name: "Brunch", icon: Coffee },
    { id: "2", name: "Hike", icon: Mountain },
    { id: "3", name: "Movie Night", icon: Film },
    { id: "4", name: "Read a Book", icon: BookOpen },
    { id: "5", name: "Workout", icon: Dumbbell },
    { id: "6", name: "Visit a Museum", icon: Landmark },
    { id: "7", name: "Gardening", icon: Sprout },
    { id: "8", name: "Beach Day", icon: Waves },
];

export const VIBES: Vibe[] = [
    { id: "happy", name: "Happy", icon: Smile, color: "#FBBF24" },
    { id: "relaxed", name: "Relaxed", icon: Wind, color: "#34D399" },
    { id: "energetic", name: "Energetic", icon: Zap, color: "#60A5FA" },
];

export const THEMES: ThemeInfo[] = [
    { value: "default", label: "Default" },
    { value: "lazy", label: "Lazy Weekend" },
    { value: "adventurous", label: "Adventurous" },
    { value: "family", label: "Family Fun" },
];
