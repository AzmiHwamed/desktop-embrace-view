import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScanLine,
  History,
  ArrowLeftRight,
  PieChart,
  Bell,
  UserRound,
  Settings,
  Plane,
  LifeBuoy,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Scan", url: "/scan", icon: ScanLine },
  { title: "Convert", url: "/convert", icon: ArrowLeftRight },
  { title: "History", url: "/history", icon: History },
  { title: "Expenses", url: "/expenses", icon: PieChart },
];

const accountItems = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Account", url: "/account", icon: UserRound },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="p-3">
        <div className="flex min-w-0 items-center gap-3 px-1 py-1">
          <span className="bg-brand grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-brand">
            <Plane className="h-4 w-4" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-extrabold tracking-tight">
                SmartTravel
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Travel money workspace
              </span>
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed ? (
          <div className="bg-night rounded-2xl p-4 text-sidebar-primary-foreground">
            <LifeBuoy className="h-5 w-5 opacity-80" />
            <p className="mt-2 text-sm font-semibold">Need a hand?</p>
            <p className="mt-1 text-xs opacity-70">
              Our travel support team replies in under 5 minutes.
            </p>
            <Link
              to="/settings"
              className="mt-3 inline-flex rounded-lg bg-sidebar/15 px-3 py-1.5 text-xs font-semibold backdrop-blur"
            >
              Help center
            </Link>
          </div>
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
            <LifeBuoy className="h-4 w-4" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
