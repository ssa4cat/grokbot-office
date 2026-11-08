import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { Users, X } from "lucide-react";
import { useOfficeStore } from "@/store/office-store";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children?: ReactNode;
  isMobile?: boolean;
}

export function AppShell({ children, isMobile = false }: AppShellProps) {
  const { t } = useTranslation("layout");
  const sidebarCollapsed = useOfficeStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useOfficeStore((s) => s.setSidebarCollapsed);

  useEffect(() => {
    if (isMobile) setSidebarCollapsed(true);
  }, [isMobile, setSidebarCollapsed]);

  const content = children ?? <Outlet />;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-sky-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopBar isMobile={isMobile} />
      <div className="relative flex flex-1 overflow-hidden">
        <main className="relative flex flex-1 flex-col overflow-hidden">
          <div className="relative flex-1 overflow-hidden">{content}</div>
        </main>
        {isMobile ? (
          <>
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="fixed bottom-4 left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg"
              aria-label={sidebarCollapsed ? t("sidebar.expandSidebar") : t("sidebar.collapseSidebar")}
            >
              <Users className="h-5 w-5" />
            </button>
            {!sidebarCollapsed && (
              <>
                <div className="fixed inset-0 z-30 bg-black/40" onClick={() => setSidebarCollapsed(true)} />
                <aside className="fixed inset-x-0 bottom-0 top-12 z-40 overflow-hidden border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 dark:border-slate-800">
                    <span className="text-sm font-semibold">{t("sidebar.agents")}</span>
                    <button type="button" onClick={() => setSidebarCollapsed(true)} aria-label={t("sidebar.closeSidebar")}>
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="h-full overflow-auto pb-16">
                    <Sidebar />
                  </div>
                </aside>
              </>
            )}
          </>
        ) : (
          <Sidebar />
        )}
      </div>
    </div>
  );
}
