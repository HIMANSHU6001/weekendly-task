"use client";

import React, {useState} from "react";
import {useScheduleStore} from "@/store/scheduleStore";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Plus, MoreVertical, Trash2} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {cn} from "@/lib/utils";

const colors = ["blue", "green", "red", "yellow", "purple", "pink"];

export function PlanManager() {
  const {plans, activePlanId, setActivePlanId, addPlan, removePlan} =
    useScheduleStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const {toast} = useToast();

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlanName.trim() === "") {
      toast({
        title: "Invalid Plan Name",
        description: "Please enter a name for your weekend plan.",
        variant: "destructive",
      });
      return;
    }
    await addPlan(newPlanName, selectedColor);
    setNewPlanName("");
    setSelectedColor(colors[0]);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-2">
        <h3 className="font-bold text-lg">Your Weekends</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-5 w-5"/>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Weekend Plan</DialogTitle>
              <DialogDescription>
                Give your new plan a name and give a theme color to it.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPlan}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="plan-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="plan-name"
                    placeholder="e.g., Emily's Birthday"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Theme</Label>
                  <div className="col-span-3 flex gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          "h-8 w-8 rounded-full border-2",
                          selectedColor === color
                            ? "border-primary"
                            : "border-transparent"
                        )}
                        style={{backgroundColor: color}}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Plan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-1">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setActivePlanId(plan.id)}
            className={cn(
              "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
              activePlanId === plan.id
                ? "bg-primary/10 text-primary font-semibold"
                : "hover:bg-accent/50"
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{backgroundColor: plan.color}}
            />
            <span className="flex-1 truncate">{plan.name}</span>
            {plans.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-4 w-4"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await removePlan(plan.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
