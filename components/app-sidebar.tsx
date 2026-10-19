"use client";

import { usePathname } from "next/navigation";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarFooter,
    SidebarSeparator,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "./ui/sidebar";
import Link from "next/link";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { LayoutDashboard, ListTodo, CalendarRange, BarChart3 } from "lucide-react";

export default function AppSidebar() {
    const navItems = [
        { id: "dashboard", title: "Dashboard", path: "/", icon: LayoutDashboard },
        { id: "task-management", title: "Task Management", path: "/task-management", icon: ListTodo },
        { id: "gantt-chart", title: "Gantt Chart", path: "/gantt-chart", icon: CalendarRange },
    ];

    const pathname = usePathname();

    const isActive = (path: string) =>
        path === "/"
            ? pathname === path
            : pathname === path || pathname.startsWith(path + "/");

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-13 flex items-center px-4 dark:bg-sidebar bg-background">
                <div className="flex gap-2.5 items-center w-full group-data-[collapsible=icon]:justify-center">
                    <div className="bg-primary text-primary-foreground rounded-lg size-8 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        <BarChart3 className="size-4" />
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
                        <span className="text-sm font-semibold truncate leading-tight tracking-tight">
                            Gantt Tracker
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                            Project Task Manager
                        </span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarSeparator className="m-0" />
            <SidebarContent className="pt-4 dark:bg-sidebar bg-background">
                <SidebarGroup>
                    <SidebarMenu className="gap-1">
                        {navItems.map((item) => (
                            <SidebarMenuItem
                                key={item.id}
                                className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-medium"
                            >
                                <SidebarMenuButton
                                    isActive={isActive(item.path)}
                                    tooltip={item.title}
                                    asChild
                                    className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                                >
                                    <Link href={item.path} className="flex items-center gap-2 w-full">
                                        <item.icon className="size-4" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator className="m-0" />
            <SidebarFooter className="dark:bg-sidebar bg-background">
                <div className="flex gap-3 items-center">
                    <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                            AU
                        </AvatarFallback>
                    </Avatar>
                    <div className="group-data-[collapsible=icon]:hidden">
                        <p className="text-xs font-semibold leading-none">Admin User</p>
                        <p className="text-[10px] text-muted-foreground font-light mt-1">Admin</p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
