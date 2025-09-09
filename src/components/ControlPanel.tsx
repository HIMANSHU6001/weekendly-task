"use client";

import {CategorySelector} from "@/components/CategorySelector";
import {ActivitySelector} from "@/components/ActivitySelector";
import {PlanManager} from "./PlanManager";
import {Separator} from "@/components/ui/separator";

export function ControlPanel() {
  return (
    <aside className="space-y-4 p-2">
      <PlanManager/>
      <Separator/>
      <CategorySelector/>
      <Separator/>
      <ActivitySelector/>
    </aside>
  );
}
