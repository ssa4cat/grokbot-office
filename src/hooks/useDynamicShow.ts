import { useEffect, useRef } from "react";
import { getProfile } from "@/data/layout-office";
import { useOfficeStore } from "@/store/office-store";
import { shortWalk, zoneByAgent } from "@/components/office-3d/walkways";

const LINES: Record<string, string[]> = {
  researcher: ["找到三篇可以引用的來源。", "這則背景先收進資料室。"],
  writer: ["初稿寫到第二段了。", "這段交給總編之前我再看一眼。"],
  editor: ["這段邏輯還要再收緊。", "錯字清完了，送去畫。"],
  illustrator: ["這張想用暖色。", "簡報的圖跟文章分開畫。"],
  artdirector: ["構圖可以，色彩再壓一點。", "這張退回重畫。"],
  chief: ["文章線先走，簡報線並行。", "兩條都到齊再交付。"],
  slides: ["大綱八頁，圖表放第四頁。", "版型系統先定下來。"],
  lumi: ["我先把雜事排進今天。", "這件不屬於產線，我來。"],
  eggbot: ["新機器人的外殼還差一隻手。", "實驗室今天只做零件。"],
};

const ARTICLE: Array<[string, string]> = [
  ["researcher", "writer"],
  ["writer", "editor"],
  ["editor", "illustrator"],
  ["illustrator", "artdirector"],
  ["artdirector", "chief"],
];

const SLIDES: Array<[string, string]> = [
  ["writer", "slides"],
  ["slides", "illustrator"],
];

const homes = new Map<string, { x: number; y: number }>();

function rememberHomes(): void {
  if (homes.size > 0) return;
  for (const agent of useOfficeStore.getState().agents.values()) {
    if (!agent.isPlaceholder) homes.set(agent.id, { ...agent.position });
  }
}

export function useDynamicShow(): void {
  const enabled = useOfficeStore((state) => state.dynamicDisplay);
  const step = useRef(0);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (query.matches) useOfficeStore.getState().setDynamicDisplay(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let last = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      const store = useOfficeStore.getState();
      for (const agent of store.agents.values()) {
        if (agent.movement) store.tickMovement(agent.id, delta);
      }
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    rememberHomes();
    const timer = window.setInterval(() => {
      step.current += 1;
      const now = Date.now();
      const store = useOfficeStore.getState();
      for (const agent of store.agents.values()) {
        if (agent.speechBubble && now - agent.speechBubble.timestamp > 3800 && !agent.movement) {
          store.updateAgent(agent.id, { speechBubble: null, status: "idle", currentTool: null });
        }
      }
      const fresh = useOfficeStore.getState();
      const people = Array.from(fresh.agents.values()).filter((agent) => !agent.isPlaceholder);
      const busy = people.filter((agent) => agent.status !== "idle" || agent.movement).length;
      if (busy < 2 && people.length > 0) {
        const idle = people.filter((agent) => agent.status === "idle" && !agent.movement);
        const pick = idle[step.current % Math.max(idle.length, 1)] ?? people[step.current % people.length];
        const script = LINES[pick.id] ?? [`${getProfile(pick.id)?.role ?? pick.name} 處理中。`];
        const text = script[step.current % script.length];
        fresh.updateAgent(pick.id, {
          status: "speaking",
          speechBubble: { text, timestamp: now },
        });
      }
      if (step.current % 4 === 0) {
        const walker = people.find((agent) => !agent.movement && agent.status === "idle");
        if (walker) {
          const home = homes.get(walker.id) ?? walker.position;
          fresh.followPath(walker.id, shortWalk(home, zoneByAgent(walker.id)), 3.2);
        }
      }
      if (step.current % 7 === 0) {
        const sequence = step.current % 14 === 0 ? SLIDES : ARTICLE;
        const pair = sequence[Math.floor(step.current / 7) % sequence.length];
        fresh.setActiveHandoff({ sourceId: pair[0], targetId: pair[1] });
        window.setTimeout(() => {
          if (useOfficeStore.getState().dynamicDisplay) useOfficeStore.getState().setActiveHandoff(null);
        }, 3200);
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [enabled]);
}
