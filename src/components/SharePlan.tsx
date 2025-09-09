"use client";

import React from "react";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {useScheduleStore} from "@/store/scheduleStore";
import {Share2, Waves, MapPin} from "lucide-react";
import {cn} from "@/lib/utils";
import {useAuth} from "@/hooks/use-auth";
import {ACTIVITIES, VIBES} from "@/lib/data";

export function SharePlan() {
  const {plans, activePlanId} = useScheduleStore();
  const activePlan = plans.find(p => p.id === activePlanId);
  const {user} = useAuth();

  if (!activePlan || !user) {
    return (
      <Button disabled>
        <Share2 className="mr-2 h-4 w-4"/>
        Share Plan
      </Button>
    )
  }

  const {schedule, name} = activePlan;
  const days = Object.keys(schedule);

  const DayPoster = ({title, day}: { title: string; day: string }) => {
    const activities = schedule[day] || [];
    return (
      <div>
        <h3 className="text-2xl font-bold mb-3 text-center text-gray-700 capitalize">{title.replace(/_/g, ' ')}</h3>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const activityData = ACTIVITIES.find(a => a.id === activity.id);
              const ActivityIcon = activityData?.icon || activity.icon || (() => null);

              const vibeData = VIBES.find(v => v.id === activity.vibe.id);
              const VibeIcon = vibeData?.icon || activity.vibe.icon || (() => null);

              return (
                <div key={activity.instanceId} className="bg-white/70 p-3 rounded-lg shadow-sm flex items-center gap-3">
                  <div className="w-1.5 h-10 rounded-full" style={{backgroundColor: activity.vibe.color}}/>
                  <ActivityIcon className="h-6 w-6 text-gray-600 flex-shrink-0"/>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{activity.name}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                    {activity.location && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="h-3 w-3"/>
                        <span>{activity.location}</span>
                      </div>
                    )}
                  </div>
                  <VibeIcon className={`h-5 w-5 text-[${activity.vibe.color}] flex-shrink-0`}/>
                </div>
              )
            })
          ) : (
            <div className="text-center text-gray-500 py-8">No activities planned.</div>
          )}
        </div>
      </div>
    )
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Share2 className="mr-2 h-4 w-4"/>
          Share Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Your Weekend Plan</DialogTitle>
          <DialogDescription>
            Here&#39;s your shareable weekend plan. Right-click or long-press the image to save and share!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div id="poster" className="p-8 rounded-xl shadow-2xl poster-bg">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2">
                <Waves className="h-8 w-8 text-gray-700"/>
                <h2 className="text-4xl font-bold text-gray-800">{name}</h2>
              </div>
            </div>
            <div className={cn(
              "grid grid-cols-1 gap-8",
              days.length === 2 && "md:grid-cols-2",
              days.length === 3 && "md:grid-cols-3",
              days.length >= 4 && "md:grid-cols-4",
            )}>
              {days.map(day => (
                <DayPoster key={day} title={day} day={day}/>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
