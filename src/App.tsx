import { lazy, Suspense, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { FloorPlan } from "@/components/office-2d/FloorPlan";
import { staticOffice } from "@/data/layout-office";
import { useResponsive } from "@/hooks/useResponsive";
import { useOfficeStore } from "@/store/office-store";

const Scene3D = lazy(() => import("@/components/office-3d/Scene3D"));

function Scene3DFallback() {
  const { t } = useTranslation("office");
  return (
    <div className="flex h-full w-full items-center justify-center bg-sky-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <span className="text-sm text-slate-500">{t("loading3D")}</span>
      </div>
    </div>
  );
}

function OfficeView() {
  const viewMode = useOfficeStore((s) => s.viewMode);
  const [fading, setFading] = useState(false);
  const [displayMode, setDisplayMode] = useState(viewMode);

  useEffect(() => {
    if (viewMode !== displayMode) {
      setFading(true);
      const timer = setTimeout(() => {
        setDisplayMode(viewMode);
        setFading(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [viewMode, displayMode]);

  return (
    <div className="h-full w-full transition-opacity duration-300" style={{ opacity: fading ? 0 : 1 }}>
      {displayMode === "2d" ? (
        <FloorPlan />
      ) : (
        <Suspense fallback={<Scene3DFallback />}>
          <Scene3D />
        </Suspense>
      )}
    </div>
  );
}

function ThemeSync() {
  const theme = useOfficeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}

function ConfigError({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-sky-50 p-6">
      <div className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-rose-700">工作室設定檔無法讀取</h1>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{message}</p>
        <p className="mt-3 text-xs text-slate-400">請修改 src/data/team.json 後重新整理。</p>
      </div>
    </div>
  );
}

export function App() {
  const { isMobile } = useResponsive();
  const setViewMode = useOfficeStore((s) => s.setViewMode);

  useEffect(() => {
    if (isMobile) setViewMode("2d");
  }, [isMobile, setViewMode]);

  if (staticOffice.error) {
    return <ConfigError message={staticOffice.error} />;
  }

  return (
    <>
      <ThemeSync />
      <Routes>
        <Route element={<AppShell isMobile={isMobile} />}>
          <Route path="/" element={<OfficeView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
