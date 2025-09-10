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
  Music,
  UtensilsCrossed,
  Gamepad2,
  Plane,
  Palette,
  Bike,
  Camera,
  Trees,
  PartyPopper,
  ShoppingBag,
  Users,
} from "lucide-react";

export const CATEGORIES = {
  all: {value: "all", label: "All", color: "#FBBF24"},
  lazy: {value: "lazy", label: "Lazy Weekend", color: "#34D399"},
  adventurous: {value: "adventurous", label: "Adventurous", color: "#60A5FA"},
  family: {value: "family", label: "Family Fun", color: "#DD1AE8"},
  foodie: {value: "foodie", label: "Foodie", color: "#F97316"},
  creative: {value: "creative", label: "Creative", color: "#EC4899"},
  travel: {value: "travel", label: "Travel & Explore", color: "#10B981"},
  social: {value: "social", label: "Social", color: "#3B82F6"},
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
  {id: "concert", category: CATEGORIES.social, name: "Live Concert", icon: Music},
  {id: "dining", category: CATEGORIES.foodie, name: "Fine Dining", icon: UtensilsCrossed},
  {id: "gaming", category: CATEGORIES.lazy, name: "Video Games", icon: Gamepad2},
  {id: "roadtrip", category: CATEGORIES.travel, name: "Road Trip", icon: Plane},
  {id: "painting", category: CATEGORIES.creative, name: "Painting Session", icon: Palette},
  {id: "cycling", category: CATEGORIES.adventurous, name: "Cycling", icon: Bike},
  {id: "photography", category: CATEGORIES.creative, name: "Photography Walk", icon: Camera},
  {id: "picnic", category: CATEGORIES.family, name: "Picnic in the Park", icon: Trees},
  {id: "party", category: CATEGORIES.social, name: "House Party", icon: PartyPopper},
  {id: "shopping", category: CATEGORIES.social, name: "Shopping Spree", icon: ShoppingBag},
];

export const VIBES: Vibe[] = [
  {id: "happy", name: "Happy", icon: Smile},
  {id: "relaxed", name: "Relaxed", icon: Wind},
  {id: "energetic", name: "Energetic", icon: Zap},
  {id: "friends", name: "Friends", icon: Users},
];
