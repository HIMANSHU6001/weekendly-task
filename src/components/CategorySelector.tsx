"use client";

import { useScheduleStore } from "@/store/scheduleStore";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {Category} from "@/lib/types";
import {CATEGORIES} from "@/lib/data";

export function CategorySelector() {
    const { activePlanId, plans, setCategory } = useScheduleStore();
    const activePlan = plans.find((p) => p.id === activePlanId);
    const category = activePlan?.category || "all";

    if (!activePlanId) {
        return (
            <div className="space-y-2 px-2">
                <Label htmlFor="category-selector">Select a category</Label>
                <Select disabled>
                    <SelectTrigger id="category-selector" className="w-full">
                        <SelectValue placeholder="Select a plan first" />
                    </SelectTrigger>
                </Select>
            </div>
        );
    }

    return (
        <div className="space-y-2 px-2">
            <Label htmlFor="category-selector">Select a category</Label>
            <Select value={category} onValueChange={(value: Category) => setCategory(value)}>
                <SelectTrigger id="category-selector" className="w-full">
                    <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORIES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                            {t.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
