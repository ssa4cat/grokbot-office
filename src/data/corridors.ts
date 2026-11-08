import type { OfficeLayout, PlacedZone, ReservedSlot } from "@/data/layout-office";

export interface Pt {
  x: number;
  y: number;
}

export interface Segment {
  a: Pt;
  b: Pt;
}

const LANE = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function dedupe(points: Pt[]): Pt[] {
  const result: Pt[] = [];
  for (const point of points) {
    const prev = result[result.length - 1];
    if (!prev || Math.hypot(prev.x - point.x, prev.y - point.y) > 0.4) result.push(point);
  }
  return result;
}

function bandFor(zone: PlacedZone, layout: OfficeLayout) {
  const below = layout.corridors.horizontals.find((band) => Math.abs(band.y - (zone.y + zone.height)) < 1.5);
  const above = layout.corridors.horizontals.find((band) => Math.abs(band.y + band.height - zone.y) < 1.5);
  return below ?? above ?? null;
}

export function doorEdge(zone: PlacedZone, layout: OfficeLayout): "top" | "bottom" | null {
  const band = bandFor(zone, layout);
  if (!band) return null;
  return band.y + band.height <= zone.y + 1 ? "top" : "bottom";
}

function centerline(
  layout: OfficeLayout,
  source: Pt,
  target: Pt,
  sourceZone: PlacedZone,
  targetZone: PlacedZone,
  delta = 0,
): Pt[] {
  const sourceBand = bandFor(sourceZone, layout);
  const targetBand = bandFor(targetZone, layout);
  const spine = layout.corridors.vertical;
  if (!sourceBand || !targetBand || !spine) {
    return dedupe([source, { x: target.x, y: source.y }, target]);
  }
  const sourceY = sourceBand.y + sourceBand.height / 2 + delta;
  const targetY = targetBand.y + targetBand.height / 2 + delta;
  const spineX = spine.x + spine.width / 2 + delta;
  const sourceDoorX = clamp(source.x, sourceZone.x + 20, sourceZone.x + sourceZone.width - 20);
  const targetDoorX = clamp(target.x, targetZone.x + 20, targetZone.x + targetZone.width - 20);
  const points: Pt[] = [source, { x: sourceDoorX, y: source.y }, { x: sourceDoorX, y: sourceY }];
  if (Math.abs(sourceY - targetY) < 0.5) {
    points.push({ x: targetDoorX, y: targetY });
  } else {
    points.push({ x: spineX, y: sourceY }, { x: spineX, y: targetY }, { x: targetDoorX, y: targetY });
  }
  points.push({ x: targetDoorX, y: target.y }, target);
  return dedupe(points);
}

function rangesOverlap(a0: number, a1: number, b0: number, b1: number): boolean {
  return Math.min(a1, b1) - Math.max(a0, b0) > 8;
}

/** Lane index so lines that share a corridor run sit 4px apart. */
function laneOf(index: number, routes: Array<{ points: Pt[] }>): number {
  let lane = 0;
  const taken = new Set<number>();
  for (let other = 0; other < index; other++) {
    if (sharesRun(routes[index].points, routes[other].points)) taken.add(laneOf(other, routes));
  }
  while (taken.has(lane)) lane += 1;
  return lane;
}

function sharesRun(a: Pt[], b: Pt[]): boolean {
  const aSegs = segmentsOf(a);
  const bSegs = segmentsOf(b);
  for (const left of aSegs) {
    for (const right of bSegs) {
      const horizontal = Math.abs(left.a.y - left.b.y) < 0.5 && Math.abs(right.a.y - right.b.y) < 0.5;
      const vertical = Math.abs(left.a.x - left.b.x) < 0.5 && Math.abs(right.a.x - right.b.x) < 0.5;
      if (horizontal && Math.abs(left.a.y - right.a.y) < 1) {
        if (rangesOverlap(Math.min(left.a.x, left.b.x), Math.max(left.a.x, left.b.x), Math.min(right.a.x, right.b.x), Math.max(right.a.x, right.b.x))) {
          return true;
        }
      }
      if (vertical && Math.abs(left.a.x - right.a.x) < 1) {
        if (rangesOverlap(Math.min(left.a.y, left.b.y), Math.max(left.a.y, left.b.y), Math.min(right.a.y, right.b.y), Math.max(right.a.y, right.b.y))) {
          return true;
        }
      }
    }
  }
  return false;
}

export function segmentsOf(points: Pt[]): Segment[] {
  const segments: Segment[] = [];
  for (let index = 0; index < points.length - 1; index++) {
    const a = points[index];
    const b = points[index + 1];
    if (Math.hypot(a.x - b.x, a.y - b.y) < 0.4) continue;
    segments.push({ a, b });
  }
  return segments;
}

export function segmentHitsRect(segment: Segment, rect: { x: number; y: number; width: number; height: number }): boolean {
  const left = rect.x + 0.8;
  const right = rect.x + rect.width - 0.8;
  const top = rect.y + 0.8;
  const bottom = rect.y + rect.height - 0.8;
  if (Math.abs(segment.a.y - segment.b.y) < 0.5) {
    const y = segment.a.y;
    if (y <= top || y >= bottom) return false;
    const x0 = Math.min(segment.a.x, segment.b.x);
    const x1 = Math.max(segment.a.x, segment.b.x);
    return Math.min(x1, right) - Math.max(x0, left) > 0.5;
  }
  if (Math.abs(segment.a.x - segment.b.x) < 0.5) {
    const x = segment.a.x;
    if (x <= left || x >= right) return false;
    const y0 = Math.min(segment.a.y, segment.b.y);
    const y1 = Math.max(segment.a.y, segment.b.y);
    return Math.min(y1, bottom) - Math.max(y0, top) > 0.5;
  }
  return true;
}

function seatOf(layout: OfficeLayout, agentId: string): { seat: Pt; zone: PlacedZone } | null {
  const seat = layout.seats.find((item) => item.agentId === agentId);
  if (!seat) return null;
  const zone = layout.zones.find((item) => item.id === seat.zoneId);
  if (!zone) return null;
  return { seat: { x: seat.x, y: seat.y }, zone };
}

export interface RoutedLink {
  sourceId: string;
  targetId: string;
  kind?: string;
  pipeline?: string;
  points: Pt[];
  lane: number;
}

export function routeLinks(
  layout: OfficeLayout,
  links: Array<{ sourceId: string; targetId: string; kind?: string; pipeline?: string }>,
): RoutedLink[] {
  const drafts = links.map((link) => {
    const source = seatOf(layout, link.sourceId);
    const target = seatOf(layout, link.targetId);
    const points =
      source && target ? centerline(layout, source.seat, target.seat, source.zone, target.zone) : [];
    return { ...link, points, lane: 0 };
  });
  const lanes = drafts.map((_, index) => laneOf(index, drafts));
  const maxLane = Math.max(0, ...lanes);
  const limit = Math.max(0, Math.floor((layout.corridors.rowGap / 2 - 4) / LANE));
  return drafts.map((link, index) => {
    const source = seatOf(layout, link.sourceId);
    const target = seatOf(layout, link.targetId);
    const lane = lanes[index] ?? 0;
    const centered = lane - maxLane / 2;
    const delta = Math.round(clamp(centered, -limit, limit)) * LANE;
    const points =
      source && target
        ? centerline(layout, source.seat, target.seat, source.zone, target.zone, delta)
        : link.points;
    return { ...link, lane, points };
  });
}

export function routeCenter(layout: OfficeLayout, sourceId: string, targetId: string): Pt[] {
  const source = seatOf(layout, sourceId);
  const target = seatOf(layout, targetId);
  if (!source || !target) return [];
  return centerline(layout, source.seat, target.seat, source.zone, target.zone);
}

export function walkOutAndBack(layout: OfficeLayout, home: Pt, zone: PlacedZone): Pt[] {
  const band = bandFor(zone, layout);
  const spine = layout.corridors.vertical;
  if (!band || !spine) return [home, home];
  const doorX = clamp(home.x, zone.x + 20, zone.x + zone.width - 20);
  const hallY = band.y + band.height / 2;
  const spineX = spine.x + spine.width / 2;
  return dedupe([
    home,
    { x: doorX, y: home.y },
    { x: doorX, y: hallY },
    { x: spineX, y: hallY },
    { x: doorX, y: hallY },
    { x: doorX, y: home.y },
    home,
  ]);
}

export function corridorViolations(
  layout: OfficeLayout,
  links: Array<{ sourceId: string; targetId: string; kind?: string; pipeline?: string }>,
): string[] {
  const problems: string[] = [];
  const routed = routeLinks(layout, links);
  routed.forEach((link) => {
    const source = layout.zones.find((zone) => zone.id === layout.seats.find((seat) => seat.agentId === link.sourceId)?.zoneId);
    const target = layout.zones.find((zone) => zone.id === layout.seats.find((seat) => seat.agentId === link.targetId)?.zoneId);
    for (const segment of segmentsOf(link.points)) {
      if (Math.abs(segment.a.x - segment.b.x) > 0.5 && Math.abs(segment.a.y - segment.b.y) > 0.5) {
        problems.push(`${link.sourceId}->${link.targetId} is diagonal`);
      }
      for (const zone of layout.zones) {
        if (zone.id === source?.id || zone.id === target?.id) continue;
        if (segmentHitsRect(segment, zone)) problems.push(`${link.sourceId}->${link.targetId} crosses ${zone.id}`);
      }
      for (const slot of layout.reserved) {
        if (segmentHitsRect(segment, slot as ReservedSlot)) {
          problems.push(`${link.sourceId}->${link.targetId} crosses reserved ${slot.col},${slot.row}`);
        }
      }
    }
  });
  return problems;
}
