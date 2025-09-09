"use client";

import React, {useRef} from "react";
import html2canvas from "html2canvas-pro";
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
import {Waves, MapPin, Download, Share, Share2} from "lucide-react";
import {cn} from "@/lib/utils";
import {useAuth} from "@/hooks/use-auth";
import {ACTIVITIES, VIBES} from "@/lib/data";
import Logo from "@/public/icons/Logo";

export function SharePlan() {
  const {plans, activePlanId} = useScheduleStore();
  const activePlan = plans.find((p) => p.id === activePlanId);
  const {user} = useAuth();
  const posterRef = useRef<HTMLDivElement>(null);

  if (!activePlan || !user) {
    return (
      <Button disabled>
        <Share className="mr-2 h-4 w-4"/>
      </Button>
    );
  }

  const {schedule, name} = activePlan;
  const days = Object.keys(schedule);

  const handleCapture = async () => {
    if (!posterRef.current) return;

    const canvas = await html2canvas(posterRef.current, {
      useCORS: true,
      backgroundColor: null,
    });

    const dataUrl = canvas.toDataURL("image/png");

    // download
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${name}-weekend-plan.png`;
    link.click();
  };


  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/view/${user.uid}/${activePlan.id}`;

      if (navigator.share) {
        await navigator.share({
          title: `${activePlan.name} - Weekend Plan`,
          text: `Check out my weekend plan: ${activePlan.name}`,
          url: shareUrl,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback to copying to clipboard
      try {
        const shareUrl = `${window.location.origin}/view/${user.uid}/${activePlan.id}`;
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
        alert("Unable to share. Please copy the URL manually.");
      }
    }
  };

  const DayPoster = ({title, day}: { title: string; day: string }) => {
    const activities = schedule[day] || [];
    return (
      <div>
        <h3 className="text-2xl font-bold mb-3 text-center text-gray-700 capitalize">
          {title.replace(/_/g, " ")}
        </h3>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const activityData = ACTIVITIES.find((a) => a.id === activity.id);
              const ActivityIcon = activityData?.icon || activity.icon || (() => null);

              const vibeData = VIBES.find((v) => v.id === activity.vibe.id);
              const VibeIcon = vibeData?.icon || activity.vibe.icon || (() => null);

              return (
                <div
                  key={activity.instanceId}
                  className="bg-white/70 p-3 rounded-lg shadow-sm flex items-center gap-3"
                >
                  <div
                    className="w-1.5 h-10 rounded-full"
                    style={{backgroundColor: activity.category.color}}
                  />
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
                  <VibeIcon
                    className={`h-5 w-5 text-[${activity.category.color}] flex-shrink-0`}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">No activities planned.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size='icon'>
          <Share className="mx-auto h-6 w-6"/>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-scroll min-w-[95vw] lg:min-w-[90vw] invisible-scrollbar p-2 lg:p-4">
        <DialogHeader className='p-3'>
          <DialogTitle>Your Weekend Plan</DialogTitle>
          <DialogDescription>
            Here&#39;s your shareable weekend plan. You can save it as an image and share!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div
            ref={posterRef}
            id="poster"
            className="p-8 rounded-xl shadow-2xl"
            style={{backgroundColor: activePlan.color + "55"}}
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2">
                <Logo className='h-8 w-8'/>
                <h2 className="text-4xl font-bold text-gray-800">{name}</h2>
              </div>
            </div>
            <div
              className={cn(
                "grid grid-cols-1 gap-8 md:grid-cols-2 ",
                days.length === 2 && "lg:grid-cols-2",
                days.length === 3 && "lg:grid-cols-3",
                days.length >= 4 && "lg:grid-cols-4"
              )}
            >
              {days.map((day) => (
                <DayPoster key={day} title={day} day={day}/>
              ))}
            </div>
          </div>

          <div className="mt-6 justify-center gap-3 flex flex-col lg:flex-row">
            <Button onClick={handleCapture} variant="outline">
              <Download className="mr-2 h-4 w-4"/>
              Download as Image
            </Button>
            <Button onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4"/>
              Share Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
