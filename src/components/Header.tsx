"use client";

import { SharePlan } from "./SharePlan";
import { Waves, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useScheduleStore } from "@/store/scheduleStore";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
    const { plans, activePlanId } = useScheduleStore();
    const activePlan = plans.find((p) => p.id === activePlanId);
    const { user } = useAuth();

    const activeColor = activePlan?.color || "hsl(var(--primary))";

    const handleSignOut = async () => {
        await auth.signOut();
    };

    return (
        <header className="flex items-center justify-between p-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Waves
                    className="h-7 w-7"
                    style={{ color: activeColor }}
                />
                <h1
                    className="text-xl md:text-2xl font-bold"
                    style={{ color: activeColor }}
                >
                    Weekendly
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <SharePlan />
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? ""} />
                                    <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
