import assert from "node:assert/strict";
import test from "node:test";
import { buildStudioTaskReminder, studioTaskDate } from "../lib/studio-task-reminders.ts";

const now = new Date("2026-09-29T06:00:00Z");
const task = (overrides = {}) => ({
  id: "test", user_id: "owner", assignee: "Teja",
  task_date: "2026-09-29", title: "Prepare gallery", description: "",
  status: "Odprto", priority: "Normalna",
  created_at: "2026-09-28T10:00:00Z", updated_at: "2026-09-28T10:00:00Z",
  ...overrides
});

test("only unfinished tasks scheduled today are included", () => {
  const summary = buildStudioTaskReminder([
    task(), task({ title: "Done", status: "Opravljeno" }),
    task({ title: "Tomorrow", task_date: "2026-09-30" }),
    task({ title: "Yesterday", task_date: "2026-09-28" })
  ], now);
  assert.equal(summary.title, "FotoFlow: opravila danes (1)");
  assert.equal(summary.body, "Teja: Prepare gallery");
  assert.equal(summary.url, "/tasks");
});

test("no empty notifications", () => {
  assert.equal(buildStudioTaskReminder([], now), null);
  assert.equal(buildStudioTaskReminder([task({ status: "Opravljeno" })], now), null);
});

test("dates follow Ljubljana across UTC midnight and winter", () => {
  assert.equal(studioTaskDate(new Date("2026-09-28T22:30:00Z")), "2026-09-29");
  assert.equal(studioTaskDate(new Date("2026-12-28T23:30:00Z")), "2026-12-29");
});

test("priority, missing assignee and bounded message size", () => {
  const tasks = Array.from({ length: 5 }, (_, index) => task({
    id: String(index), title: "a".repeat(200),
    assignee: index === 4 ? null : "Teja", priority: index === 4 ? "Visoka" : "Nizka"
  }));
  const summary = buildStudioTaskReminder(tasks, now);
  assert.match(summary.body, /^Nedodeljeno:/);
  assert.match(summary.body, /\+2$/);
  assert.ok(summary.body.length < 300);
  assert.equal(tasks[0].id, "0");
});
