import { describe, expect, it } from "vitest";
import { corridorViolations, routeLinks, segmentsOf } from "./corridors";
import { layoutTeam, parseTeam, staticOffice } from "./layout-office";
import rawTeam from "./team.json";

describe("corridor routing", () => {
  it("keeps the live office on orthogonal corridors outside other rooms and reserved pods", () => {
    const slides = staticOffice.layout.zones.find((zone) => zone.id === "slides");
    expect(slides?.colSpan).toBe(2);
    expect(staticOffice.layout.reserved.map((slot) => [slot.col, slot.row])).toEqual([
      [2, 2],
      [3, 2],
    ]);
    expect(corridorViolations(staticOffice.layout, staticOffice.links)).toEqual([]);
  });

  it("offsets parallel lines that share a corridor run", () => {
    const layout = layoutTeam(parseTeam(rawTeam));
    const routed = routeLinks(layout, staticOffice.links);
    const article = routed.filter((link) => (link.pipeline ?? "article") === "article");
    const shared = article.filter((link) => link.sourceId === "writer" || link.targetId === "writer");
    const ys = new Set<number>();
    for (const link of shared) {
      for (const segment of segmentsOf(link.points)) {
        if (Math.abs(segment.a.y - segment.b.y) < 0.5 && Math.abs(segment.a.x - segment.b.x) > 40) {
          ys.add(Math.round(segment.a.y));
        }
      }
    }
    expect(ys.size).toBeGreaterThan(1);
  });
});
