"use client";

import React, {useState} from "react";
import {useScheduleStore} from "@/store/scheduleStore";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Plus} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

export function DayManager() {
  const {addDay, plans, activePlanId} = useScheduleStore();
  const activePlan = plans.find(p => p.id === activePlanId);
  const schedule = activePlan?.schedule || {};

  const [newDayName, setNewDayName] = useState("");
  const {toast} = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlanId) {
      toast({
        title: "No Active Plan",
        description: "Please select or create a plan first.",
        variant: "destructive",
      });
      return;
    }
    if (newDayName.trim() === "") {
      toast({
        title: "Invalid Day Name",
        description: "Please enter a name for the day.",
        variant: "destructive",
      });
      return;
    }
    const dayKey = newDayName.trim().toLowerCase().replace(/\s/g, '_');
    if (schedule[dayKey]) {
      toast({
        title: "Day Exists",
        description: `A day named "${newDayName}" already exists.`,
        variant: "destructive",
      });
      return;
    }
    if (Object.keys(schedule).length >= 4) {
      toast({
        title: "Maximum Days Reached",
        description: "You can have a maximum of 4 days in your schedule.",
        variant: "destructive",
      });
      return;
    }
    addDay(newDayName.trim());
    setNewDayName("");
    setIsOpen(false);
  };

  const dayCount = Object.keys(schedule).length;

  if (dayCount >= 4 || !activePlanId) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-center p-4">
        <Button
          variant="outline"
          className="w-full border-dashed border-2 h-auto py-8 text-muted-foreground hover:text-primary hover:border-primary"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2"/>
          Extend your weekend
        </Button>
      </div>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend Your Weekend</DialogTitle>
          <DialogDescription>
            Add another day to your schedule. You can have up to 4 days in total.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddDay}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="day-name" className="text-right">
                Day Name
              </Label>
              <Input
                id="day-name"
                placeholder="e.g., Friday"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Day</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
