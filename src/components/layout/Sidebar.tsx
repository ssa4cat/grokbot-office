import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AgentDetailPanel } from "@/components/panels/AgentDetailPanel";
import { getProfile, linkAppearance, staticOffice } from "@/data/layout-office";
import type { AgentVisualStatus } from "@/gateway/types";
import { STATUS_COLORS } from "@/lib/constants";
import { useOfficeStore } from "@/store/office-store";

export function Sidebar() {
  const { t } = useTranslation("layout");
  const agents = useOfficeStore((s) => s.agents);
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const collapsed = useOfficeStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useOfficeStore((s) => s.setSidebarCollapsed);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "idle" | "error">("all");

  const agentList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Array.from(agents.values()).filter((agent) => {
      if (agent.isPlaceholder) return false;
      if (filter === "active" && (agent.status === "idle" || agent.status === "offline")) return false;
      if (filter === "idle" && agent.status !== "idle") return false;
      if (filter === "error" && agent.status !== "error") return false;
      const profile = getProfile(agent.id);
      const name = profile?.name ?? agent.name;
      const role = profile?.role ?? "";
      const zoneName = profile?.zoneName ?? "";
      if (!q) return true;
      return [name, role, zoneName, agent.id].some((value) => value.toLowerCase().includes(q));
    });
  }, [agents, search, filter]);

  const nameOf = (id: string) => getProfile(id)?.name ?? id;
  const pipelineTitle = (pipeline: string) => {
    if (pipeline === "slides") return t("sidebar.pipelineSlides");
    if (pipeline === "article") return t("sidebar.pipelineArticle");
    return pipeline;
  };
  const pipelineOrder = ["article", "slides"];
  const pipelines = Array.from(new Set(staticOffice.links.map((link) => linkAppearance(link).pipeline))).sort((a, b) => {
    const ai = pipelineOrder.indexOf(a);
    const bi = pipelineOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  if (collapsed) {
    return (
      <aside className="flex w-12 flex-col items-center border-l border-sky-100 bg-white py-3 dark:border-slate-800 dark:bg-slate-900">
        <button type="button" onClick={() => setSidebarCollapsed(false)} className="text-slate-400" title={t("sidebar.expand")}>
          ◀
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-sky-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-100 px-3 dark:border-slate-800">
        <span className="text-xs font-semibold tracking-wide text-slate-500">{t("sidebar.agents")}</span>
        <button type="button" onClick={() => setSidebarCollapsed(true)} className="text-slate-400" title={t("sidebar.collapse")}>
          ▶
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <section className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
          <h2 className="text-xs font-semibold text-sky-700 dark:text-sky-300">{t("sidebar.pipeline")}</h2>
          {pipelines.map((pipeline) => {
            const items = staticOffice.links.filter((link) => linkAppearance(link).pipeline === pipeline);
            const slides = pipeline === "slides";
            return (
              <div key={pipeline} className="mt-2">
                <h3 className={`text-[11px] font-semibold ${slides ? "text-violet-700 dark:text-violet-300" : "text-cyan-700 dark:text-cyan-300"}`}>
                  {pipelineTitle(pipeline)}
                </h3>
                <ol className="mt-1 space-y-1">
                  {items.map((link) => {
                    const returning = link.kind === "return";
                    return (
                      <li key={`${pipeline}-${link.sourceId}-${link.targetId}-${link.kind}`} className="text-xs leading-5 text-slate-600 dark:text-slate-300">
                        <span
                          className={`mr-1 rounded px-1 text-[10px] ${
                            returning
                              ? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-200"
                              : slides
                                ? "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-200"
                                : "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-200"
                          }`}
                        >
                          {returning ? t("sidebar.return") : t("sidebar.flow")}
                        </span>
                        {nameOf(link.sourceId)} → {nameOf(link.targetId)}
                        {link.label ? <span className="text-slate-400"> · {link.label}</span> : null}
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}
        </section>

        <section className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
          <h2 className="mb-2 text-xs font-semibold text-slate-500">{t("sidebar.agentDetail")}</h2>
          {selectedAgentId ? <AgentDetailPanel /> : <p className="text-xs leading-5 text-slate-400">{t("sidebar.staticHint")}</p>}
        </section>

        <div className="px-3 py-2">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("sidebar.searchPlaceholder")}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm outline-none focus:border-sky-400 dark:border-slate-700 dark:bg-slate-800"
          />
          <div className="mt-1.5 flex gap-1">
            {(["all", "active", "idle", "error"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded px-2 py-0.5 text-xs ${
                  filter === key ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                }`}
              >
                {t(`sidebar.filters.${key}`)}
              </button>
            ))}
          </div>
        </div>

        <ul>
          {agentList.map((agent) => {
            const profile = getProfile(agent.id);
            const status = agent.status as AgentVisualStatus;
            const selected = selectedAgentId === agent.id;
            const zoneName = profile?.zoneName;
            return (
              <li key={agent.id}>
                <button
                  type="button"
                  onClick={() => selectAgent(agent.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-sky-50 dark:hover:bg-slate-800 ${
                    selected ? "bg-sky-50 dark:bg-slate-800" : ""
                  }`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{profile?.name ?? agent.name}</span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {zoneName ? `${zoneName} · ` : ""}
                      {t(`common:agent.statusLabels.${status}`)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {agentList.length === 0 && (
            <li className="px-3 py-4 text-center text-xs text-slate-400">{t("common:empty.noMatchingAgents")}</li>
          )}
        </ul>

      </div>
    </aside>
  );
}
