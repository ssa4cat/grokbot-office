import { describe, expect, it } from "vitest";
import { buildRuntime, layoutTeam, parseTeam, stationsFor } from "./layout-office";

const baseOffice = { title: "GROK BOT", subtitle: "測試", columns: 4 };

describe("team config layout", () => {
  it("places a new zone and bot when they are only added to the config", () => {
    const config = parseTeam({
      office: baseOffice,
      zones: [{ id: "writing", name: "寫作區", furnishing: "writing" }],
      agents: [
        { id: "writer", name: "筆桿", zone: "writing", summary: "寫稿" },
        { id: "newbie", name: "新人", zone: "archive", role: "檔案", summary: "整理檔案" },
      ],
      links: [{ from: "writer", to: "newbie", kind: "flow", label: "交接" }],
    });

    expect(config.zones.map((zone) => zone.id)).toEqual(["writing", "archive"]);
    const layout = layoutTeam(config);
    const archive = layout.zones.find((zone) => zone.id === "archive");
    expect(archive).toBeTruthy();
    expect(archive?.col).toBe(1);
    expect(archive?.row).toBe(0);
    expect(layout.seats.map((seat) => seat.agentId).sort()).toEqual(["newbie", "writer"]);

    const runtime = buildRuntime(config, layout);
    expect(runtime.links).toHaveLength(1);
    expect(runtime.links[0]?.kind).toBe("flow");
    expect(runtime.links[0]?.pipeline).toBe("article");
    expect(runtime.profiles.find((profile) => profile.id === "newbie")?.zoneName).toBe("archive");
  });

  it("rejects overlapping explicit zone positions", () => {
    expect(() =>
      layoutTeam(
        parseTeam({
          office: baseOffice,
          zones: [
            { id: "a", name: "甲", col: 0, row: 0 },
            { id: "b", name: "乙", col: 0, row: 0 },
          ],
          agents: [],
          links: [],
        }),
      ),
    ).toThrow(/放不進去/);
  });

  it("fills the next reserved cell when a zone omits col and row", () => {
    const before = layoutTeam(
      parseTeam({
        office: { ...baseOffice, reserveSlots: 2 },
        zones: [{ id: "writing", name: "寫作區", col: 0, row: 0, furnishing: "writing" }],
        agents: [{ id: "writer", name: "筆桿", zone: "writing", summary: "寫稿" }],
        links: [],
      }),
    );
    expect(before.reserved.map((slot) => [slot.col, slot.row])).toEqual([
      [1, 0],
      [2, 0],
    ]);

    const after = layoutTeam(
      parseTeam({
        office: { ...baseOffice, reserveSlots: 2 },
        zones: [
          { id: "writing", name: "寫作區", col: 0, row: 0, furnishing: "writing" },
          { id: "archive", name: "檔案室", furnishing: "desk" },
        ],
        agents: [
          { id: "writer", name: "筆桿", zone: "writing", summary: "寫稿" },
          { id: "newbie", name: "新人", zone: "archive", summary: "整理檔案" },
        ],
        links: [],
      }),
    );
    const archive = after.zones.find((zone) => zone.id === "archive");
    expect(archive?.col).toBe(before.reserved[0]?.col);
    expect(archive?.row).toBe(before.reserved[0]?.row);
    expect(after.reserved.map((slot) => [slot.col, slot.row])).toEqual([
      [2, 0],
      [3, 0],
    ]);
    const seat = after.seats.find((item) => item.agentId === "newbie");
    const spot = stationsFor(archive!, 1)[0];
    expect(seat).toEqual({ agentId: "newbie", zoneId: "archive", x: spot.seat.x, y: spot.seat.y });
    expect(spot.seat.y).toBeGreaterThan(spot.desk.y);
    expect(spot.seat.x).toBeGreaterThan(archive!.x);
    expect(spot.seat.x).toBeLessThan(archive!.x + archive!.width);
  });

  it("rejects a collaboration line that names an unknown bot", () => {
    expect(() =>
      parseTeam({
        office: baseOffice,
        zones: [],
        agents: [{ id: "writer", name: "筆桿", zone: "writing", summary: "寫稿" }],
        links: [{ from: "writer", to: "missing", kind: "return" }],
      }),
    ).toThrow(/不存在的機器人/);
  });
});
