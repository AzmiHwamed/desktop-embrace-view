// components/AppSidebar.tsx
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
  LifeBuoy,
  Languages,
  WalletCards,
  Coins,
  Compass,
  CircleHelp,
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
import { useAppSelector, useTranslations } from "@/app/hooks";
import { isRtlLanguage } from "@/lib/rtl";
import sidebarStrings from "@/locales/en/sidebar.json";
import travelSmartLogo from "@/assets/travel-smart-logo.png";
import travelSmartMark from "@/assets/travel-smart-mark.png";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (path: string) =>
    path === "/" ? currentPath === "/" : currentPath.startsWith(path);

  const t = useTranslations("sidebar", sidebarStrings);
  const profile = useAppSelector((s) => s.account.profile);
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const isRtl = isRtlLanguage(profile?.language?.code);

  // Keys stay stable/English for routing and `key` props, since a link's
  // destination shouldn't shift with translation — only the visible label
  // (item.title) is swapped for its translated string.
  const mainItems = [
    { key: "dashboard", title: t.dashboard, url: "/", icon: LayoutDashboard },
    { key: "scan", title: t.scan, url: "/scan", icon: ScanLine },
    { key: "convert", title: t.convert, url: "/convert", icon: ArrowLeftRight },
    { key: "interpreter", title: t.interpreter, url: "/interpreter", icon: Languages },
    { key: "translate", title: t.translate, url: "/translate", icon: Languages },
    { key: "explore", title: t.explore, url: "/explore", icon: Compass },
    { key: "faq", title: t.faqs, url: "/faq", icon: CircleHelp },
    { key: "history", title: t.history, url: "/history", icon: History },
    { key: "expenses", title: t.expenses, url: "/expenses", icon: PieChart },
    { key: "budgets", title: t.budgets, url: "/budgets", icon: WalletCards },
  ].filter(
    (item) =>
      !isGuest ||
      ["scan", "convert", "interpreter", "translate", "explore", "faq"].includes(item.key),
  );

  const accountItems = [
    { key: "token-deals", title: t.tokenDeals, url: "/tokens", icon: Coins },
    { key: "notifications", title: t.notifications, url: "/notifications", icon: Bell },
    { key: "account", title: t.myAccount, url: "/account", icon: UserRound },
    { key: "settings", title: t.settings, url: "/settings", icon: Settings },
  ];

  return (
    // The sidebar library's `side` prop physically moves the whole panel
    // (and its collapse-toggle animation) to the other edge of the screen —
    // `dir` alone mirrors content inside a fixed-position panel, not the
    // panel's own anchor edge, so this needs to be set explicitly.
    <Sidebar collapsible="icon" side={isRtl ? "right" : "left"} className="border-r">
      <SidebarHeader className="p-3">
        <div className="flex min-w-0 items-center px-1 py-1">
          <img
            src={collapsed ? travelSmartMark : travelSmartLogo}
            alt="TravelSmart"
            className={
              collapsed
                ? "h-9 w-9 object-contain"
                : "h-auto w-full max-w-[210px] object-contain object-left"
            }
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.overview}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.key}>
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

        {!isGuest && (
          <SidebarGroup>
            <SidebarGroupLabel>{t.account}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {accountItems.map((item) => (
                  <SidebarMenuItem key={item.key}>
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
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed ? (
          <div className="bg-night rounded-2xl p-4 text-sidebar-primary-foreground">
            {isGuest ? (
              <UserRound className="h-5 w-5 opacity-80" />
            ) : (
              <LifeBuoy className="h-5 w-5 opacity-80" />
            )}
            <p className="mt-2 text-sm font-semibold">{isGuest ? t.guestMode : t.needAHand}</p>
            <p className="mt-1 text-xs opacity-70">
              {isGuest ? t.guestSignInHint : t.supportBlurb}
            </p>
            <Link
              to={isGuest ? "/login" : "/settings"}
              className="mt-3 inline-flex rounded-lg bg-sidebar/15 px-3 py-1.5 text-xs font-semibold backdrop-blur"
            >
              {isGuest ? t.signInToUnlock : t.helpCenter}
            </Link>
          </div>
        ) : (
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
            {isGuest ? <UserRound className="h-4 w-4" /> : <LifeBuoy className="h-4 w-4" />}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
