import { useTranslation } from "react-i18next";
import { getProfile, staticOffice } from "@/data/layout-office";
import { STATUS_COLORS } from "@/lib/constants";
import { useOfficeStore } from "@/store/office-store";

export function AgentDetailPanel() {
  const { t } = useTranslation("layout");
  const { t: tPanel } = useTranslation("panels");
  const selectedId = useOfficeStore((s) => s.selectedAgentId);
  const agents = useOfficeStore((s) => s.agents);
  const selectAgent = useOfficeStore((s) => s.selectAgent);

  if (!selectedId) return null;
  const agent = agents.get(selectedId);
  const profile = getProfile(selectedId);
  if (!agent || !profile) return null;

  const related = staticOffice.links.filter((link) => link.sourceId === profile.id || link.targetId === profile.id);

  return (
    <div>
      <div className="mb-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.name}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[agent.status] }} />
            {t(`common:agent.statusLabels.${agent.status}`)}
            {profile.role ? ` · ${profile.role}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => selectAgent(null)}
          className="text-xs text-slate-400 hover:text-slate-600"
          title={tPanel("agentDetail.deselect")}
        >
          ✕
        </button>
      </div>
      <dl className="space-y-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t("sidebar.zone")}</dt>
          <dd>{profile.zoneName}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t("sidebar.summary")}</dt>
          <dd>{profile.summary}</dd>
        </div>
        {related.length > 0 && (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t("sidebar.links")}</dt>
            <dd className="mt-1 space-y-1">
              {related.map((link) => {
                const outgoing = link.sourceId === profile.id;
                const other = getProfile(outgoing ? link.targetId : link.sourceId)?.name ?? (outgoing ? link.targetId : link.sourceId);
                const verb = link.kind === "return" ? t("sidebar.return") : t("sidebar.flow");
                return (
                  <div key={`${link.sourceId}-${link.targetId}-${link.kind}`}>
                    {verb}
                    {outgoing ? ` → ${other}` : ` ← ${other}`}
                    {link.label ? `（${link.label}）` : ""}
                  </div>
                );
              })}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
