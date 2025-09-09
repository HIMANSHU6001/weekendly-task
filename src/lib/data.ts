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

export const CATEGORIES = {
  all: {value: "all", label: "All", color: "#FBBF24"},
  lazy: {value: "lazy", label: "Lazy Weekend", color: "#34D399"},
  adventurous: {value: "adventurous", label: "Adventurous", color: "#60A5FA"},
  family: {value: "family", label: "Family Fun", color: "#dd1ae8"},
} as const;

export const CATEGORY_LIST: CategoryInfo[] = Object.values(CATEGORIES);

export const ACTIVITIES: Activity[] = [
  {id: "brunch", category: CATEGORIES.family, name: "Brunch", icon: Coffee},
  {id: "hike", category: CATEGORIES.adventurous, name: "Hike", icon: Mountain},
  {id: "movie", category: CATEGORIES.lazy, name: "Movie Night", icon: Film},
  {id: "book", category: CATEGORIES.lazy, name: "Read a Book", icon: BookOpen},
  {id: "workout", category: CATEGORIES.adventurous, name: "Workout", icon: Dumbbell},
  {id: "museum", category: CATEGORIES.family, name: "Visit a Museum", icon: Landmark},
  {id: "gardening", category: CATEGORIES.lazy, name: "Gardening", icon: Sprout},
  {id: "beach", category: CATEGORIES.family, name: "Beach Day", icon: Waves},
];

export const VIBES: Vibe[] = [
  {id: "happy", name: "Happy", icon: Smile},
  {id: "relaxed", name: "Relaxed", icon: Wind},
  {id: "energetic", name: "Energetic", icon: Zap},
];
