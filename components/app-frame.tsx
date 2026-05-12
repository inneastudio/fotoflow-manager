"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  Settings,
  UsersRound,
  WalletCards
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projekti", icon: FolderKanban },
  { href: "/calendar", label: "Koledar", icon: CalendarDays },
  { href: "/finance", label: "Finance", icon: WalletCards },
  { href: "/clients", label: "Stranke", icon: UsersRound },
  { href: "/settings", label: "Nastavitve", icon: Settings }
];

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, demoMode } = useAuth();
  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!loading && !demoMode && !user && !isLogin) {
      router.replace("/login");
    }
  }, [demoMode, isLogin, loading, router, user]);

  if (isLogin) {
    return <main className="min-h-screen">{children}</main>;
  }

  if (loading || (!demoMode && !user)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="surface max-w-sm rounded-lg p-6 text-center">
          <p className="font-display text-3xl font-semibold">FotoFlow</p>
          <p className="mt-2 text-sm text-muted">Pripravljam tvoj studio pregled.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:flex lg:pb-0">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line/80 bg-white/90 px-5 py-6 backdrop-blur-xl lg:block">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-ink text-lg font-semibold text-paper">
            F
          </div>
          <div>
            <p className="font-display text-2xl font-semibold leading-none">FotoFlow</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
              Manager
            </p>
          </div>
        </Link>

        <nav className="mt-10 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition",
                  active
                    ? "bg-mist text-ink"
                    : "text-muted hover:bg-mist/70 hover:text-ink"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {active ? <ChevronRight className="h-4 w-4" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-line bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {demoMode ? "Demo način" : "Prijavljen račun"}
          </p>
          <p className="mt-2 truncate text-sm font-medium text-ink">
            {demoMode ? "Lokalni primeri" : user?.email}
          </p>
        </div>
      </aside>

      <div className="w-full lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 lg:hidden">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-paper">
                F
              </div>
              <div>
                <p className="font-display text-xl font-semibold leading-none">
                  FotoFlow
                </p>
                <p className="text-xs text-muted">Manager</p>
              </div>
            </Link>

            <div className="hidden lg:block">
              <p className="eyebrow">Interni studio CRM</p>
              <p className="mt-1 text-sm text-muted">
                Rezervacije, roki, galerije in plačila na enem mestu.
              </p>
            </div>

            <Link href="/projects" className="button-secondary">
              <BarChart3 className="h-4 w-4" />
              Pregled projektov
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-6 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center rounded-lg text-[11px] font-medium transition",
                  active ? "bg-clay text-white" : "text-muted hover:bg-mist"
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
