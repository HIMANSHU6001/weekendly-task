"use client";

import React, {useState, useMemo} from "react";
import {useScheduleStore} from "@/store/scheduleStore";
import {ACTIVITIES, VIBES} from "@/lib/data";
import type {Activity, LocationData} from "@/lib/types";
import {Button} from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {Input} from "@/components/ui/input";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Plus, Search} from "lucide-react";
import {useToast} from "@/hooks/use-toast";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import Fuse from "fuse.js";
import {LocationPicker} from "@/components/ui/location-picker";

export function ActivitySelector() {
  const {addActivity, activePlanId, plans} = useScheduleStore();
  const activePlan = plans.find((p) => p.id === activePlanId);
  const schedule = activePlan?.schedule || {};
  const selectedCategory = activePlan?.category || "all";

  const {error, success} = useToast();
  const [openPopover, setOpenPopover] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const form = useForm({
    defaultValues: {
      time: "10:00",
      vibe: "happy",
      location: "",
    },
  });


  const fuse = useMemo(() => {
    const categoryFilteredActivities = selectedCategory === "all"
      ? ACTIVITIES
      : ACTIVITIES.filter(activity => activity.category.value === selectedCategory);

    return new Fuse(categoryFilteredActivities, {
      keys: ['name'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [selectedCategory]);

  const filteredActivities = useMemo(() => {
    const categoryFilteredActivities = selectedCategory === "all"
      ? ACTIVITIES
      : ACTIVITIES.filter(activity => activity.category.value === selectedCategory);

    if (!searchQuery.trim()) {
      return categoryFilteredActivities;
    }

    const searchResults = fuse.search(searchQuery);
    return searchResults.map(result => result.item);
  }, [selectedCategory, searchQuery, fuse]);

  const addActivityToSchedule = (activity: Activity, values: any) => {
    const {time, vibe: vibeId, location} = values;

    if (!activePlanId) {
      error("Please select or create a plan first.");
      return;
    }

    if (!time || !vibeId) {
      error("Please set a time and vibe for your activity.");
      return;
    }

    const firstDay = Object.keys(schedule)[0];
    if (!firstDay) {
      error("Please add a day to your schedule first.");
      return;
    }

    const vibe = VIBES.find((v) => v.id === vibeId);

    if (vibe) {
      addActivity(firstDay, {
        ...activity,
        instanceId: crypto.randomUUID(),
        time,
        vibe,
        location,
        locationData: locationData || undefined,
        category: activity.category,
      });
      success(
        location
          ? `Added "${activity.name}" to ${firstDay} at ${location}. You can drag it to other days!`
          : `Added "${activity.name}" to ${firstDay}. You can drag it to other days!`
      );
      setOpenPopover("");
      form.reset();
      setLocationData(null);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-lg px-2">Choose Activities</h3>
      <div className="px-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
          <Input
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      <ScrollArea className="px-2">
        <div className="space-y-2 pr-2">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No activities found</p>
              <p className="text-sm">Try adjusting your search or category</p>
            </div>
          ) : (
            filteredActivities.map((activity) => {
              const ActivityIcon = activity.icon;
              return (
                <Popover
                  key={activity.id}
                  open={openPopover === activity.id}
                  onOpenChange={(isOpen) =>
                    setOpenPopover(isOpen ? activity.id : "")
                  }
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-4 rounded-none border-l-3 bg-gray-100`}
                      style={{borderColor: activity.category.color}}
                      disabled={!activePlanId}
                    >
                      <ActivityIcon className="h-5 w-5 text-primary/80" style={{color: activity.category.color}}/>
                      <span className="flex-1 text-left">{activity.name}</span>
                      <Plus className="h-4 w-4"/>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(
                          (values) => addActivityToSchedule(activity, values)
                        )}
                        className="grid gap-4"
                      >
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">
                            Add {activity.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Set a time, vibe and location for this activity.
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="time"
                          render={({field}) => (
                            <FormItem>
                              <FormLabel>Time</FormLabel>
                              <FormControl>
                                <Input type="time" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location"
                          render={({field}) => (
                            <FormItem>
                              <FormLabel>Location (Optional)</FormLabel>
                              <FormControl>
                                <LocationPicker
                                  value={field.value}
                                  onChange={(location, placeDetails) => {
                                    field.onChange(location);
                                    if (placeDetails && placeDetails.lat && placeDetails.lon) {
                                      setLocationData({
                                        name: location,
                                        coordinates: {
                                          lat: parseFloat(placeDetails.lat),
                                          lon: parseFloat(placeDetails.lon)
                                        }
                                      });
                                    } else {
                                      setLocationData(location ? { name: location } : null);
                                    }
                                  }}
                                  placeholder="Search for a location..."
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vibe"
                          render={({field}) => (
                            <FormItem>
                              <FormLabel>Vibe</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  className="flex flex-wrap gap-2"
                                >
                                  {VIBES.map((vibe) => {
                                    const VibeIcon = vibe.icon;
                                    return (
                                      <div key={vibe.id} className="flex items-center space-x-2">
                                        <RadioGroupItem value={vibe.id} id={vibe.id}/>
                                        <div className="flex items-center gap-1">
                                          <VibeIcon className="h-4 w-4"/>
                                          <span className="text-sm">{vibe.name}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </RadioGroup>
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full">
                          Add Activity
                        </Button>
                      </form>
                    </Form>
                  </PopoverContent>
                </Popover>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
