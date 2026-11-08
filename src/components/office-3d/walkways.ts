import { staticOffice, type PlacedZone } from "@/data/layout-office";

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

/** Desk-side standing spot: in front of the desk, toward the camera (larger y). */
export function standPoint(zone: PlacedZone): Pt {
  if (zone.id === "slides") {
    return { x: zone.x + zone.width * 0.32, y: zone.y + zone.height * 0.34 };
  }
  return { x: zone.x + zone.width / 2, y: zone.y + zone.height * 0.74 };
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
  const ring = ringPoints();
  const segments: WalkSegment[] = [];
  const lane = 78;
  for (let i = 0; i < ring.length; i++) {
    segments.push({ a: ring[i], b: ring[(i + 1) % ring.length], width: lane });
  }
  for (const zone of layout.zones) {
    if (zone.id === "command") continue;
    const stand = standPoint(zone);
    const door = boundaryToward(zone, commandCenter());
    const gate = nearestRing(door, ring);
    segments.push({ a: stand, b: door, width: 54 });
    segments.push({ a: door, b: gate, width: lane });
  }
  return segments;
}

/** Seat → door → ring, then back. Stays on the zone approach plus the ring. */
export function shortWalk(home: Pt, zone: PlacedZone | undefined): Pt[] {
  if (!zone) return [home, home];
  const door = boundaryToward(zone, commandCenter());
  const gate = nearestRing(door);
  return [home, door, gate, door, { ...home }];
}

export function zoneByAgent(agentId: string): PlacedZone | undefined {
  const seat = layout.seats.find((item) => item.agentId === agentId);
  return layout.zones.find((zone) => zone.id === seat?.zoneId);
}

/** Handoff line follows the walkway: stand, door, ring arc, door, stand. */
export function handoffPoints(sourceId: string, targetId: string): Pt[] {
  const sourceZone = zoneByAgent(sourceId);
  const targetZone = zoneByAgent(targetId);
  const ring = ringPoints();
  if (!sourceZone || !targetZone) return [];
  const source = standPoint(sourceZone);
  const target = standPoint(targetZone);
  const sourceDoor = boundaryToward(sourceZone, commandCenter());
  const targetDoor = boundaryToward(targetZone, commandCenter());
  const sourceGate = nearestRing(sourceDoor, ring);
  const targetGate = nearestRing(targetDoor, ring);
  const start = ring.findIndex((point) => point === sourceGate);
  const end = ring.findIndex((point) => point === targetGate);
  const arc: Pt[] = [];
  if (start >= 0 && end >= 0) {
    const forward = (end - start + ring.length) % ring.length;
    const backward = (start - end + ring.length) % ring.length;
    const step = forward <= backward ? 1 : -1;
    const count = Math.min(forward, backward);
    for (let i = 0; i <= count; i++) {
      arc.push(ring[(start + step * i + ring.length) % ring.length]);
    }
  }
  return [source, sourceDoor, ...arc, targetDoor, target];
}
