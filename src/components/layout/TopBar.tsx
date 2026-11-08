import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ViewMode } from "@/gateway/types";
import { isWebGLAvailable } from "@/lib/webgl-detect";
import { useOfficeStore } from "@/store/office-store";

interface TopBarProps {
  isMobile?: boolean;
}

export function TopBar({ isMobile = false }: TopBarProps) {
  const { t } = useTranslation("layout");
  const metrics = useOfficeStore((s) => s.globalMetrics);
  const viewMode = useOfficeStore((s) => s.viewMode);
  const setViewMode = useOfficeStore((s) => s.setViewMode);
  const theme = useOfficeStore((s) => s.theme);
  const setTheme = useOfficeStore((s) => s.setTheme);
  const dynamicDisplay = useOfficeStore((s) => s.dynamicDisplay);
  const setDynamicDisplay = useOfficeStore((s) => s.setDynamicDisplay);
  const webglAvailable = useMemo(() => isWebGLAvailable(), []);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-sky-100 bg-white/90 px-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <h1 className="text-base font-semibold tracking-tight text-sky-800 dark:text-sky-200">{t("topbar.brand")}</h1>
      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] text-sky-600 dark:bg-slate-800 dark:text-sky-300">
        v{__APP_VERSION__}
      </span>
      {!isMobile && <ViewModeSwitch viewMode={viewMode} setViewMode={setViewMode} webglAvailable={webglAvailable} />}
      <span className="hidden text-sm text-slate-500 sm:inline dark:text-slate-400">
        {t("topbar.teamCount", { count: metrics.totalAgents })}
      </span>
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={theme === "light" ? t("topbar.theme.switchToDark") : t("topbar.theme.switchToLight")}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <button
          type="button"
          onClick={() => setDynamicDisplay(!dynamicDisplay)}
          className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-pressed={dynamicDisplay}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${dynamicDisplay ? "bg-emerald-500" : "bg-slate-400"}`} />
          {dynamicDisplay ? t("common:status.dynamic") : t("common:status.static")}
        </button>
      </div>
    </header>
  );
}

function ViewModeSwitch({
  viewMode,
  setViewMode,
  webglAvailable,
}: {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  webglAvailable: boolean;
}) {
  const { t } = useTranslation("layout");
  const modes: { key: ViewMode; label: string }[] = [
    { key: "2d", label: "2D" },
    { key: "3d", label: "3D" },
  ];

  return (
    <div className="flex items-center rounded-md bg-slate-100 p-0.5 dark:bg-slate-800">
      {modes.map(({ key, label }) => {
        const disabled = key === "3d" && !webglAvailable;
        return (
          <button
            key={key}
            type="button"
            onClick={() => !disabled && setViewMode(key)}
            disabled={disabled}
            title={disabled ? t("topbar.viewMode.webglNotSupported") : t("topbar.viewMode.switchTo", { mode: label })}
            className={`rounded px-3 py-1 text-xs font-medium ${
              viewMode === key
                ? "bg-sky-600 text-white"
                : disabled
                  ? "cursor-not-allowed text-slate-300"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-300"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
