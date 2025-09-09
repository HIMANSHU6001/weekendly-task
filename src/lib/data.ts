import type {Activity, CategoryInfo, Vibe} from "@/lib/types";
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
    { id: "1", category:'family', name: "Brunch", icon: Coffee },
    { id: "2", category:'adventurous', name: "Hike", icon: Mountain },
    { id: "3", category:'lazy', name: "Movie Night", icon: Film },
    { id: "4", category:'lazy', name: "Read a Book", icon: BookOpen },
    { id: "5", category:'adventurous', name: "Workout", icon: Dumbbell },
    { id: "6", category:'family', name: "Visit a Museum", icon: Landmark },
    { id: "7", category:'lazy', name: "Gardening", icon: Sprout },
    { id: "8", category:'family', name: "Beach Day", icon: Waves },
];

export const VIBES: Vibe[] = [
    { id: "happy", name: "Happy", icon: Smile, color: "#FBBF24" },
    { id: "relaxed", name: "Relaxed", icon: Wind, color: "#34D399" },
    { id: "energetic", name: "Energetic", icon: Zap, color: "#60A5FA" },
];

export const CATEGORIES: CategoryInfo[] = [
    { value: "all", label: "All" },
    { value: "lazy", label: "Lazy Weekend" },
    { value: "adventurous", label: "Adventurous" },
    { value: "family", label: "Family Fun" },
];
