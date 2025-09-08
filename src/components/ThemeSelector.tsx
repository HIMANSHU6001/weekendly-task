"use client";

import { useScheduleStore } from "@/store/scheduleStore";
import type { Theme } from "@/lib/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { THEMES } from "@/lib/data";

export function ThemeSelector() {
    const { activePlanId, plans, setTheme } = useScheduleStore();
    const activePlan = plans.find((p) => p.id === activePlanId);
    const theme = activePlan?.theme || "default";

    if (!activePlanId) {
        return (
            <div className="space-y-2 px-2">
                <Label htmlFor="theme-selector">Personalize Your Plan</Label>
                <Select disabled>
                    <SelectTrigger id="theme-selector" className="w-full">
                        <SelectValue placeholder="Select a plan first" />
                    </SelectTrigger>
                </Select>
            </div>
        );
    }

    return (
        <div className="space-y-2 px-2">
            <Label htmlFor="theme-selector">Personalize Your Plan</Label>
            <Select value={theme} onValueChange={(value: Theme) => setTheme(value)}>
                <SelectTrigger id="theme-selector" className="w-full">
                    <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                    {THEMES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                            {t.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
