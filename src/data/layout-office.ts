import rawTeam from "./team.json";
import type { AgentVisualStatus, CollaborationLink, VisualAgent } from "@/gateway/types";

export const WORLD_WIDTH = 18;

const STATUSES: AgentVisualStatus[] = [
  "idle",
  "thinking",
  "tool_calling",
  "speaking",
  "spawning",
  "error",
  "offline",
];

const FURNISHINGS = [
  "desk",
  "research",
  "writing",
  "editing",
  "studio",
  "review",
  "command",
  "workstation",
  "lab",
  "slides",
] as const;

export type Furnishing = (typeof FURNISHINGS)[number];

const ACCESSORIES = ["cape", "headset", "pencil", "glasses", "beret", "cap", "badge", "goggles", "pointer"] as const;

export type Accessory = (typeof ACCESSORIES)[number];

export type LinkKind = "flow" | "return";

export interface ZoneInput {
  id: string;
  name: string;
  summary?: string;
  accent?: string;
  furnishing?: Furnishing;
  col?: number;
  row?: number;
  colSpan?: number;
  rowSpan?: number;
}

export interface AgentInput {
  id: string;
  name: string;
  role?: string;
  zone: string;
  status?: AgentVisualStatus;
  summary: string;
  accent?: string;
  accessory?: Accessory;
}

export interface LinkInput {
  from: string;
  to: string;
  kind?: LinkKind;
  label?: string;
  /** article is the purple line; slides is the teal line. Both follow the corridors. */
  pipeline?: string;
}

export interface TeamConfig {
  office: {
    title: string;
    subtitle: string;
    columns: number;
    /** Empty cells drawn after the packed zones. A new zone with no col/row takes the first of these. */
    reserveSlots: number;
  };
  zones: ZoneInput[];
  agents: AgentInput[];
  links: LinkInput[];
}

export interface Station {
  desk: { x: number; y: number };
  seat: { x: number; y: number };
}

/** Desk, and the chair just in front of it (larger y, toward the camera). The robot's home is the seat. */
export function stationsFor(zone: PlacedZone, count: number): Station[] {
  const n = Math.max(1, count);
  const deskY =
    zone.furnishing === "slides"
      ? zone.y + zone.height * 0.5
      : zone.furnishing === "command"
        ? zone.y + zone.height * 0.46
        : zone.y + zone.height * 0.4;
  return Array.from({ length: n }, (_, index) => {
    const x =
      zone.furnishing === "slides"
        ? zone.x + zone.width * (0.22 + (0.16 * (index + 1)) / (n + 1))
        : zone.x + (zone.width * (index + 1)) / (n + 1);
    return { desk: { x, y: deskY }, seat: { x, y: deskY + 56 } };
  });
}

export interface PlacedZone {
  id: string;
  name: string;
  summary: string;
  accent: string;
  furnishing: Furnishing;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReservedSlot {
  col: number;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CorridorBand {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OfficeCorridors {
  rowGap: number;
  spine: number;
  horizontals: CorridorBand[];
  vertical: CorridorBand | null;
}

export interface OfficeLayout {
  width: number;
  height: number;
  worldDepth: number;
  title: string;
  subtitle: string;
  padding: number;
  headerHeight: number;
  gridTop: number;
  cellWidth: number;
  amenity: { x: number; y: number; width: number; height: number };
  zones: PlacedZone[];
  reserved: ReservedSlot[];
  seats: Array<{ agentId: string; zoneId: string; x: number; y: number }>;
  corridors: OfficeCorridors;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  summary: string;
  accent: string;
  accessory: Accessory | null;
  zoneId: string;
  zoneName: string;
  status: AgentVisualStatus;
}

export interface StaticOffice {
  error: string | null;
  layout: OfficeLayout;
  agents: VisualAgent[];
  links: CollaborationLink[];
  profiles: AgentProfile[];
}

const DEFAULT_ACCENTS = ["#38bdf8", "#818cf8", "#f59e0b", "#f472b6", "#a78bfa", "#22d3ee", "#34d399", "#fb7185"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringList(values: readonly string[], value: string): boolean {
  return values.includes(value);
}

function reqString(obj: Record<string, unknown>, key: string, label: string): string {
  const value = obj[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} 缺少文字欄位「${key}」。`);
  }
  return value.trim();
}

function optString(obj: Record<string, unknown>, key: string): string | undefined {
  const value = obj[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`欄位「${key}」必須是文字。`);
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function optInt(obj: Record<string, unknown>, key: string): number | undefined {
  const value = obj[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`欄位「${key}」必須是整數。`);
  }
  return value;
}

export function parseTeam(input: unknown): TeamConfig {
  if (!isRecord(input)) throw new Error("team.json 的最外層必須是物件。");

  const officeRaw = isRecord(input.office) ? input.office : {};
  const title = typeof officeRaw.title === "string" && officeRaw.title.trim() ? officeRaw.title.trim() : "GROK BOT";
  const subtitle =
    typeof officeRaw.subtitle === "string" && officeRaw.subtitle.trim()
      ? officeRaw.subtitle.trim()
      : "Grok Bot 工作室";
  const columns = officeRaw.columns === undefined ? 4 : officeRaw.columns;
  if (typeof columns !== "number" || !Number.isInteger(columns) || columns < 1 || columns > 8) {
    throw new Error("office.columns 必須是 1 到 8 的整數。");
  }
  const reserveRaw = officeRaw.reserveSlots;
  const reserveSlots = reserveRaw === undefined ? 2 : reserveRaw;
  if (typeof reserveSlots !== "number" || !Number.isInteger(reserveSlots) || reserveSlots < 0 || reserveSlots > 8) {
    throw new Error("office.reserveSlots 必須是 0 到 8 的整數。");
  }

  if (!Array.isArray(input.zones)) throw new Error("zones 必須是陣列。");
  if (!Array.isArray(input.agents)) throw new Error("agents 必須是陣列。");
  if (input.links !== undefined && !Array.isArray(input.links)) throw new Error("links 必須是陣列。");

  const zones: ZoneInput[] = input.zones.map((item, index) => {
    if (!isRecord(item)) throw new Error(`zones[${index}] 必須是物件。`);
    const id = reqString(item, "id", `zones[${index}]`);
    const name = reqString(item, "name", `區域 ${id}`);
    const furnishingRaw = optString(item, "furnishing") ?? "desk";
    if (!asStringList(FURNISHINGS, furnishingRaw)) {
      throw new Error(
        `區域「${name}」的 furnishing「${furnishingRaw}」無法識別。可用：${FURNISHINGS.join("、")}。`,
      );
    }
    const colSpan = optInt(item, "colSpan") ?? 1;
    const rowSpan = optInt(item, "rowSpan") ?? 1;
    if (colSpan < 1 || rowSpan < 1) throw new Error(`區域「${name}」的 colSpan / rowSpan 必須大於 0。`);
    if (colSpan > columns) throw new Error(`區域「${name}」的 colSpan 超過欄數 ${columns}。`);
    return {
      id,
      name,
      summary: optString(item, "summary") ?? "",
      accent: optString(item, "accent") ?? DEFAULT_ACCENTS[index % DEFAULT_ACCENTS.length],
      furnishing: furnishingRaw as Furnishing,
      col: optInt(item, "col"),
      row: optInt(item, "row"),
      colSpan,
      rowSpan,
    };
  });

  const zoneIds = new Set<string>();
  for (const zone of zones) {
    if (zoneIds.has(zone.id)) throw new Error(`區域 id「${zone.id}」重複。`);
    zoneIds.add(zone.id);
  }

  const agents: AgentInput[] = input.agents.map((item, index) => {
    if (!isRecord(item)) throw new Error(`agents[${index}] 必須是物件。`);
    const id = reqString(item, "id", `agents[${index}]`);
    const name = reqString(item, "name", `機器人 ${id}`);
    const zone = reqString(item, "zone", `機器人 ${name}`);
    const summary = reqString(item, "summary", `機器人 ${name}`);
    const status = (optString(item, "status") ?? "idle") as AgentVisualStatus;
    if (!STATUSES.includes(status)) {
      throw new Error(`機器人「${name}」的 status「${status}」不正確。可用：${STATUSES.join("、")}。`);
    }
    const accessoryRaw = optString(item, "accessory");
    if (accessoryRaw && !asStringList(ACCESSORIES, accessoryRaw)) {
      throw new Error(
        `機器人「${name}」的 accessory「${accessoryRaw}」無法識別。可用：${ACCESSORIES.join("、")}。`,
      );
    }
    return {
      id,
      name,
      role: optString(item, "role") ?? "",
      zone,
      status,
      summary,
      accent: optString(item, "accent") ?? DEFAULT_ACCENTS[index % DEFAULT_ACCENTS.length],
      accessory: accessoryRaw as Accessory | undefined,
    };
  });

  const agentIds = new Set<string>();
  for (const agent of agents) {
    if (agentIds.has(agent.id)) throw new Error(`機器人 id「${agent.id}」重複。`);
    agentIds.add(agent.id);
    if (!zoneIds.has(agent.zone)) {
      zones.push({
        id: agent.zone,
        name: agent.zone,
        summary: "",
        accent: agent.accent,
        furnishing: "desk",
        colSpan: 1,
        rowSpan: 1,
      });
      zoneIds.add(agent.zone);
    }
  }

  const linkItems = Array.isArray(input.links) ? input.links : [];
  const seenLinks = new Set<string>();
  const links: LinkInput[] = linkItems.map((item, index) => {
    if (!isRecord(item)) throw new Error(`links[${index}] 必須是物件。`);
    const from = reqString(item, "from", `links[${index}]`);
    const to = reqString(item, "to", `links[${index}]`);
    if (!agentIds.has(from) || !agentIds.has(to)) {
      throw new Error(`協作線 ${from} → ${to} 指向不存在的機器人。請先在 agents 加入對應 id。`);
    }
    if (from === to) throw new Error(`協作線不能從「${from}」連到自己。`);
    const kindRaw = optString(item, "kind") ?? "flow";
    if (kindRaw !== "flow" && kindRaw !== "return") {
      throw new Error(`協作線 ${from} → ${to} 的 kind 只能是 flow 或 return。`);
    }
    const pipeline = optString(item, "pipeline") ?? "article";
    if (!/^[a-z][a-z0-9-]{0,24}$/.test(pipeline)) {
      throw new Error(`協作線 ${from} → ${to} 的 pipeline「${pipeline}」請用小寫英文，例如 article 或 slides。`);
    }
    const key = `${from}->${to}:${kindRaw}:${pipeline}`;
    if (seenLinks.has(key)) throw new Error(`協作線 ${from} → ${to}（${pipeline}／${kindRaw}）重複。`);
    seenLinks.add(key);
    return { from, to, kind: kindRaw, pipeline, label: optString(item, "label") ?? "" };
  });

  return { office: { title, subtitle, columns, reserveSlots }, zones, agents, links };
}

export function layoutTeam(config: TeamConfig): OfficeLayout {
  const columns = config.office.columns;
  const padding = 18;
  const headerHeight = 78;
  const rowGap = 24;
  const colGap = 8;
  const spine = 24;
  const amenityGap = 16;
  const amenityH = 124;
  const centerSplit = Math.floor(columns / 2);
  const gapAfterCol = (col: number) => (col + 1 === centerSplit ? spine : colGap);
  const originX = (col: number) => {
    let x = padding;
    for (let i = 0; i < col; i++) x += cellW + gapAfterCol(i);
    return x;
  };
  const spanW = (col: number, colSpan: number) => {
    let width = 0;
    for (let i = 0; i < colSpan; i++) {
      width += cellW;
      if (i < colSpan - 1) width += gapAfterCol(col + i);
    }
    return width;
  };
  const targetWidth = 1440;
  const minCellW = 220;
  const maxCellW = 340;
  const gapCount = Math.max(0, columns - 1);
  const spineCount = centerSplit > 0 && centerSplit < columns ? 1 : 0;
  const totalColGap = colGap * (gapCount - spineCount) + spine * spineCount;
  const natural = (targetWidth - padding * 2 - totalColGap) / columns;
  const cellW = Math.max(minCellW, Math.min(maxCellW, Math.floor(natural)));

  const occupied = new Set<string>();
  const cellKey = (col: number, row: number) => `${col},${row}`;

  const canPlace = (col: number, row: number, colSpan: number, rowSpan: number) => {
    if (col < 0 || row < 0 || col + colSpan > columns) return false;
    for (let y = row; y < row + rowSpan; y++) {
      for (let x = col; x < col + colSpan; x++) {
        if (occupied.has(cellKey(x, y))) return false;
      }
    }
    return true;
  };

  const occupy = (col: number, row: number, colSpan: number, rowSpan: number) => {
    for (let y = row; y < row + rowSpan; y++) {
      for (let x = col; x < col + colSpan; x++) occupied.add(cellKey(x, y));
    }
  };

  type Draft = ZoneInput & { col: number; row: number; colSpan: number; rowSpan: number };
  const drafts = new Map<string, Draft>();
  const explicit = config.zones.filter((zone) => zone.col !== undefined || zone.row !== undefined);
  const automatic = config.zones.filter((zone) => zone.col === undefined && zone.row === undefined);

  for (const zone of explicit) {
    const col = zone.col ?? 0;
    const row = zone.row ?? 0;
    const colSpan = zone.colSpan ?? 1;
    const rowSpan = zone.rowSpan ?? 1;
    if (!canPlace(col, row, colSpan, rowSpan)) {
      throw new Error(
        `區域「${zone.name}」放不進去（col: ${col}, row: ${row}, colSpan: ${colSpan}）。請換位置，或拿掉 col / row 讓系統自動排。`,
      );
    }
    occupy(col, row, colSpan, rowSpan);
    drafts.set(zone.id, { ...zone, col, row, colSpan, rowSpan });
  }

  for (const zone of automatic) {
    const colSpan = zone.colSpan ?? 1;
    const rowSpan = zone.rowSpan ?? 1;
    let placed = false;
    for (let row = 0; row < 40 && !placed; row++) {
      for (let col = 0; col <= columns - colSpan; col++) {
        if (!canPlace(col, row, colSpan, rowSpan)) continue;
        occupy(col, row, colSpan, rowSpan);
        drafts.set(zone.id, { ...zone, col, row, colSpan, rowSpan });
        placed = true;
        break;
      }
    }
    if (!placed) throw new Error(`區域「${zone.name}」沒有空位可放。`);
  }

  const reservedDrafts: Array<{ col: number; row: number }> = [];
  for (let index = 0; index < config.office.reserveSlots; index++) {
    let placed = false;
    for (let row = 0; row < 40 && !placed; row++) {
      for (let col = 0; col < columns; col++) {
        if (!canPlace(col, row, 1, 1)) continue;
        occupy(col, row, 1, 1);
        reservedDrafts.push({ col, row });
        placed = true;
        break;
      }
    }
  }

  let rowCount = 1;
  for (const draft of drafts.values()) {
    rowCount = Math.max(rowCount, draft.row + draft.rowSpan);
  }
  for (const slot of reservedDrafts) {
    rowCount = Math.max(rowCount, slot.row + 1);
  }
  const cellH = rowCount > 2 ? 210 : 248;

  const gridTop = padding + headerHeight;
  const originY = (row: number) => gridTop + row * (cellH + rowGap);
  const spanH = (rowSpan: number) => rowSpan * cellH + Math.max(0, rowSpan - 1) * rowGap;
  const gridWidth = originX(columns) - padding;
  const width = padding * 2 + gridWidth;
  const gridHeight = rowCount * cellH + Math.max(0, rowCount - 1) * rowGap;
  const amenityY = gridTop + gridHeight + amenityGap;
  const height = amenityY + amenityH + padding;

  const zones: PlacedZone[] = config.zones.map((zone) => {
    const draft = drafts.get(zone.id);
    if (!draft) throw new Error(`區域「${zone.name}」沒有排到位置。`);
    return {
      id: draft.id,
      name: draft.name,
      summary: draft.summary ?? "",
      accent: draft.accent ?? "#38bdf8",
      furnishing: draft.furnishing ?? "desk",
      col: draft.col,
      row: draft.row,
      colSpan: draft.colSpan,
      rowSpan: draft.rowSpan,
      x: originX(draft.col),
      y: originY(draft.row),
      width: spanW(draft.col, draft.colSpan),
      height: spanH(draft.rowSpan),
    };
  });

  const members = new Map<string, AgentInput[]>();
  for (const agent of config.agents) {
    const list = members.get(agent.zone) ?? [];
    list.push(agent);
    members.set(agent.zone, list);
  }

  const reserved: ReservedSlot[] = reservedDrafts.map((slot) => ({
    col: slot.col,
    row: slot.row,
    x: originX(slot.col),
    y: originY(slot.row),
    width: cellW,
    height: cellH,
  }));

  const seats = zones.flatMap((zone) => {
    const group = members.get(zone.id) ?? [];
    const spots = stationsFor(zone, group.length);
    return group.map((agent, index) => ({
      agentId: agent.id,
      zoneId: zone.id,
      x: spots[index]?.seat.x ?? zone.x + zone.width / 2,
      y: spots[index]?.seat.y ?? zone.y + zone.height * 0.7,
    }));
  });

  const horizontals: CorridorBand[] = [];
  for (let row = 0; row < rowCount - 1; row++) {
    horizontals.push({
      x: padding,
      y: gridTop + (row + 1) * cellH + row * rowGap,
      width: gridWidth,
      height: rowGap,
    });
  }
  const vertical: CorridorBand | null =
    spineCount > 0
      ? { x: originX(centerSplit) - spine, y: gridTop, width: spine, height: gridHeight }
      : null;

  return {
    width,
    height,
    worldDepth: WORLD_WIDTH * (height / width),
    title: config.office.title,
    subtitle: config.office.subtitle,
    padding,
    headerHeight,
    gridTop,
    cellWidth: cellW,
    amenity: { x: padding, y: amenityY, width: gridWidth, height: amenityH },
    zones,
    reserved,
    seats,
    corridors: { rowGap, spine, horizontals, vertical },
  };
}

function toVisualAgent(agent: AgentInput, position: { x: number; y: number }): VisualAgent {
  return {
    id: agent.id,
    name: agent.name,
    status: agent.status ?? "idle",
    position,
    currentTool: null,
    speechBubble: null,
    lastActiveAt: 0,
    toolCallCount: 0,
    toolCallHistory: [],
    runId: null,
    isSubAgent: false,
    isPlaceholder: false,
    parentAgentId: null,
    childAgentIds: [],
    zone: agent.zone,
    originalPosition: null,
    movement: null,
    confirmed: true,
  };
}

export function buildRuntime(config: TeamConfig, layout: OfficeLayout): {
  agents: VisualAgent[];
  links: CollaborationLink[];
  profiles: AgentProfile[];
} {
  const zoneName = new Map(layout.zones.map((zone) => [zone.id, zone.name]));
  const seatOf = new Map(layout.seats.map((seat) => [seat.agentId, seat]));
  const agents = config.agents.map((agent) => {
    const seat = seatOf.get(agent.id);
    return toVisualAgent(agent, seat ? { x: seat.x, y: seat.y } : { x: layout.width / 2, y: layout.height / 2 });
  });
  const profiles: AgentProfile[] = config.agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    role: agent.role ?? "",
    summary: agent.summary,
    accent: agent.accent ?? "#38bdf8",
    accessory: agent.accessory ?? null,
    zoneId: agent.zone,
    zoneName: zoneName.get(agent.zone) ?? agent.zone,
    status: agent.status ?? "idle",
  }));
  const links: CollaborationLink[] = config.links.map((link) => ({
    sourceId: link.from,
    targetId: link.to,
    sessionKey: `${link.kind ?? "flow"}:${link.from}:${link.to}`,
    strength: link.kind === "return" ? 0.8 : 1,
    lastActivityAt: 0,
    kind: link.kind ?? "flow",
    label: link.label ?? "",
    pipeline: link.pipeline ?? "article",
  }));
  return { agents, links, profiles };
}

export function linkAppearance(link: { kind?: string; pipeline?: string }): {
  pipeline: string;
  color: string;
  dashed: boolean;
  curve: number;
  corridor: boolean;
} {
  const pipeline = link.pipeline && link.pipeline.length > 0 ? link.pipeline : "article";
  const returning = link.kind === "return";
  if (pipeline === "slides") {
    return { pipeline, color: "#6FB7C8", dashed: returning, curve: 1, corridor: true };
  }
  return {
    pipeline,
    color: "#A78BFA",
    dashed: returning,
    curve: 1,
    corridor: true,
  };
}

function emptyLayout(): OfficeLayout {
  return {
    width: 800,
    height: 480,
    worldDepth: WORLD_WIDTH * (480 / 800),
    title: "GROK BOT",
    subtitle: "Grok Bot 工作室",
    padding: 18,
    headerHeight: 78,
    gridTop: 96,
    cellWidth: 320,
    amenity: { x: 18, y: 340, width: 764, height: 112 },
    zones: [],
    reserved: [],
    seats: [],
    corridors: { rowGap: 24, spine: 24, horizontals: [], vertical: null },
  };
}

function loadStatic(): StaticOffice {
  try {
    const config = parseTeam(rawTeam);
    const layout = layoutTeam(config);
    return { error: null, layout, ...buildRuntime(config, layout) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: message, layout: emptyLayout(), agents: [], links: [], profiles: [] };
  }
}

export const staticOffice = loadStatic();

const profileMap = new Map(staticOffice.profiles.map((profile) => [profile.id, profile]));

export function getProfile(agentId: string): AgentProfile | undefined {
  return profileMap.get(agentId);
}

export function svgToWorld(
  pos: { x: number; y: number },
  layout: OfficeLayout = staticOffice.layout,
): [number, number, number] {
  const width = layout.width || 1;
  const height = layout.height || 1;
  const depth = layout.worldDepth || WORLD_WIDTH * (height / width);
  return [(pos.x / width) * WORLD_WIDTH, 0, (pos.y / height) * depth];
}
