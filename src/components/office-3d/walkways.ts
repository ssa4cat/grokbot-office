import { routeCenter, walkOutAndBack } from "@/data/corridors";
import { staticOffice, svgToWorld, type PlacedZone } from "@/data/layout-office";

export interface Pt {
  x: number;
  y: number;
}

export interface WalkSegment {
  a: Pt;
  b: Pt;
  width: number;
}

const layout = staticOffice.layout;

/** Floor that hugs the rooms plus a short lounge, not the empty SVG header or a deep front strip. */
export function occupiedFloor() {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const zone of [...layout.zones, ...layout.reserved]) {
    minX = Math.min(minX, zone.x);
    minY = Math.min(minY, zone.y);
    maxX = Math.max(maxX, zone.x + zone.width);
    maxY = Math.max(maxY, zone.y + zone.height);
  }
  const padX = 40;
  const padBack = 28;
  const lounge = 108;
  const x = minX - padX;
  const y = minY - padBack;
  const width = maxX - minX + padX * 2;
  const height = maxY - y + lounge;
  const corners = [
    svgToWorld({ x, y }),
    svgToWorld({ x: x + width, y }),
    svgToWorld({ x, y: y + height }),
    svgToWorld({ x: x + width, y: y + height }),
  ];
  const xs = corners.map((corner) => corner[0]);
  const zs = corners.map((corner) => corner[2]);
  const minWX = Math.min(...xs);
  const maxWX = Math.max(...xs);
  const minWZ = Math.min(...zs);
  const maxWZ = Math.max(...zs);
  return {
    svg: { x, y, width, height, maxZoneY: maxY },
    minWX,
    maxWX,
    minWZ,
    maxWZ,
    floorW: maxWX - minWX,
    floorD: maxWZ - minWZ,
    centerX: (minWX + maxWX) / 2,
    centerZ: (minWZ + maxWZ) / 2,
  };
}

function zoneCenter(zone: PlacedZone): Pt {
  return { x: zone.x + zone.width / 2, y: zone.y + zone.height / 2 };
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Where a ray from inside a zone toward `toward` leaves the rectangle. */
export function boundaryToward(zone: PlacedZone, toward: Pt): Pt {
  const origin = zoneCenter(zone);
  const dx = toward.x - origin.x;
  const dy = toward.y - origin.y;
  if (dx === 0 && dy === 0) return { x: origin.x, y: zone.y + zone.height };
  let t = Number.POSITIVE_INFINITY;
  if (dx > 0) t = Math.min(t, (zone.x + zone.width - origin.x) / dx);
  if (dx < 0) t = Math.min(t, (zone.x - origin.x) / dx);
  if (dy > 0) t = Math.min(t, (zone.y + zone.height - origin.y) / dy);
  if (dy < 0) t = Math.min(t, (zone.y - origin.y) / dy);
  const clamped = Number.isFinite(t) ? Math.max(0, t) : 0;
  return { x: origin.x + dx * clamped, y: origin.y + dy * clamped };
}

function commandZone(): PlacedZone | undefined {
  return layout.zones.find((zone) => zone.id === "command");
}

export function commandCenter(): Pt {
  const zone = commandZone();
  if (!zone) return { x: layout.width / 2, y: layout.height / 2 };
  return zoneCenter(zone);
}

/** Where this zone's robot sits. Walks leave from here and come back. */
export function standPoint(zone: PlacedZone): Pt {
  const seat = layout.seats.find((item) => item.zoneId === zone.id);
  if (seat) return { x: seat.x, y: seat.y };
  return { x: zone.x + zone.width / 2, y: zone.y + zone.height * 0.7 };
}

export function ringPoints(): Pt[] {
  const center = commandCenter();
  const zone = commandZone();
  const rx = (zone?.width ?? 280) * 0.78;
  const ry = (zone?.height ?? 180) * 0.92;
  const points: Pt[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    points.push({ x: center.x + Math.cos(angle) * rx, y: center.y + Math.sin(angle) * ry });
  }
  return points;
}

export function nearestRing(point: Pt, ring = ringPoints()): Pt {
  return ring.reduce((best, candidate) => (dist(candidate, point) < dist(best, point) ? candidate : best));
}

export function walkSegments(): WalkSegment[] {
  const segments: WalkSegment[] = [];
  for (const band of layout.corridors.horizontals) {
    const y = band.y + band.height / 2;
    segments.push({ a: { x: band.x, y }, b: { x: band.x + band.width, y }, width: band.height });
  }
  const spine = layout.corridors.vertical;
  if (spine) {
    const x = spine.x + spine.width / 2;
    segments.push({ a: { x, y: spine.y }, b: { x, y: spine.y + spine.height }, width: spine.width });
  }
  return segments;
}

/** Seat → door → spine, then back along the same corridor. */
export function shortWalk(home: Pt, zone: PlacedZone | undefined): Pt[] {
  if (!zone) return [home, home];
  return walkOutAndBack(layout, home, zone);
}

export function zoneByAgent(agentId: string): PlacedZone | undefined {
  const seat = layout.seats.find((item) => item.agentId === agentId);
  return layout.zones.find((zone) => zone.id === seat?.zoneId);
}

/** Handoff line follows the corridor: desk, door, hall, door, desk. */
export function handoffPoints(sourceId: string, targetId: string): Pt[] {
  return routeCenter(layout, sourceId, targetId);
}
