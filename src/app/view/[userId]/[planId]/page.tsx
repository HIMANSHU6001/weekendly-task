"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Waves, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACTIVITIES, VIBES } from "@/lib/data";
import type { Plan } from "@/lib/types";
import { planService } from "@/lib/planService";
import Link from "next/link";
import Logo from "../../../../../public/icons/Logo";

export default function ViewPlanPage() {
  const params = useParams();
  const userId = params.userId as string;
  const planId = params.planId as string;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!userId || !planId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch the plan using the plan service with userId and planId
        const fetchedPlan = await planService.getPublicPlan(userId, planId);
        setPlan(fetchedPlan);
      } catch (err) {
        console.error("Error fetching plan:", err);
        setError("Plan not found or is not publicly accessible.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [userId, planId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Waves className="h-12 w-12 animate-pulse text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading weekend plan...</p>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Waves className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Plan Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { schedule, name } = plan;
  const days = Object.keys(schedule);

  const DaySection = ({ title, day }: { title: string; day: string }) => {
    const activities = schedule[day] || [];

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold mb-4 text-center text-gray-700 capitalize">
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
                  className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center gap-4"
                >
                  <div
                    className="w-2 h-12 rounded-full flex-shrink-0"
                    style={{ backgroundColor: activity.category.color }}
                  />
                  <div className="flex-shrink-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${activity.category.color}20` }}
                    >
                      <ActivityIcon className="h-5 w-5" style={{ color: activity.category.color }} />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-semibold text-gray-800">{activity.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded border">
                        {activity.time}
                      </span>
                      <div className="flex items-center gap-1">
                        <VibeIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-500 capitalize">{activity.vibe.name}</span>
                      </div>
                    </div>
                    {activity.location && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                        <MapPin className="h-3 w-3 text-red-500" />
                        <span>{activity.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No activities planned for this day.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br" style={{backgroundColor: plan.color + '44' || 'hsl(var(--primary))'}}>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Logo className='h-8 w-8'/>
            <h1 className="text-4xl font-bold text-gray-800">{name}</h1>
          </div>
          <p className="text-gray-600">Shared Weekend Plan</p>
        </div>

        <div className="mx-auto">
          <div
            className={cn(
              "grid grid-cols-1 gap-6 md:grid-cols-2",
              days.length === 2 && "lg:grid-cols-2",
              days.length === 3 && "lg:grid-cols-3",
              days.length >= 4 && "lg:grid-cols-2 xl:grid-cols-4"
            )}
          >
            {days.map((day) => (
              <DaySection key={day} title={day} day={day} />
            ))}
          </div>
        </div>

        <div className="text-center mt-12 pb-8">
          <p className="text-gray-500 text-sm mb-4">
            Want to create your own weekend plan?
          </p>
          <Link href="/">
            <Button>
              <Waves className="mr-2 h-4 w-4" />
              Create Your Plan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
