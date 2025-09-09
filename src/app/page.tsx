"use client";

import {Header} from "@/components/Header";
import {Schedule} from "@/components/PlanEditor/Schedule";
import {ControlPanel} from "@/components/ControlPanel/ControlPanel";
import {Skeleton} from "@/components/ui/skeleton";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import {useAuth} from "@/hooks/use-auth";
import {Login} from "@/components/Login";

export default function Home() {
  const {user, loading} = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between p-4 border-b">
          <Skeleton className="h-8 w-48"/>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-32"/>
            <Skeleton className="h-10 w-24"/>
          </div>
        </header>
        <main className="flex-1 grid md:grid-cols-[300px_1fr] lg:grid-cols-[350px_1fr] gap-4 p-4 md:p-6 lg:p-8">
          <aside className="space-y-6">
            <Skeleton className="h-32 w-full mb-4"/>
            <Skeleton className="h-12 w-full mb-4"/>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full"/>
              ))}
            </div>
          </aside>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
            <div>
              <Skeleton className="h-10 w-1/2 mb-4"/>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full"/>
                <Skeleton className="h-24 w-full"/>
              </div>
            </div>
            <div>
              <Skeleton className="h-10 w-1/2 mb-4"/>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full"/>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <Login/>;
  }

  return (
    <div className={`min-h-screen bg-background`}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader/>
          <SidebarContent>
            <ControlPanel/>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <Header/>
          <main className="p-4 md:p-6 lg:p-8">
            <Schedule/>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
