import { describe, expect, it } from "vitest";
import { demoCalendarEvents } from "@/features/campo-calendar/data/mocks";
import {
  agendaGroups,
  eventTouchesCalendarDay,
  getCalendarPeriod,
  moveCalendarDate,
} from "@/features/campo-calendar/domain/calendar-layout";

describe("calendar temporal layout", () => {
  it("builds month and week periods", () => {
    expect(getCalendarPeriod(new Date(2026, 5, 23), "month").days).toHaveLength(35);
    expect(getCalendarPeriod(new Date(2026, 5, 23), "week").days).toHaveLength(7);
  });

  it("moves according to the selected view", () => {
    expect(moveCalendarDate(new Date(2026, 5, 23), "month", 1).getMonth()).toBe(6);
    expect(moveCalendarDate(new Date(2026, 5, 23), "week", -1).getDate()).toBe(16);
  });

  it("places a multi-day event on every covered day", () => {
    const harvest = demoCalendarEvents.find(
      (event) => event.id === "calendar-demo-colheita-junho",
    )!;
    expect(eventTouchesCalendarDay(harvest, new Date(2026, 5, 28))).toBe(true);
    expect(eventTouchesCalendarDay(harvest, new Date(2026, 5, 30))).toBe(true);
    expect(eventTouchesCalendarDay(harvest, new Date(2026, 6, 2))).toBe(true);
    expect(eventTouchesCalendarDay(harvest, new Date(2026, 6, 3))).toBe(false);
  });

  it("groups agenda events by day", () => {
    const period = getCalendarPeriod(new Date(2026, 5, 23), "agenda");
    const groups = agendaGroups(demoCalendarEvents, period);
    expect(groups.some((group) => group.day.getDate() === 23)).toBe(true);
    expect(groups.flatMap((group) => group.events).length).toBeGreaterThan(3);
  });
});
