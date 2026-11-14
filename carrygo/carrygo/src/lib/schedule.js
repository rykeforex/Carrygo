export const MIN_LEAD_MINUTES = 30;
export const MAX_DAYS = 30;
const pad = (n) => String(n).padStart(2, "0");

export function toLocalInputValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function scheduleBounds(now = new Date()) {
  return {
    min: toLocalInputValue(new Date(now.getTime() + MIN_LEAD_MINUTES * 60000)),
    max: toLocalInputValue(new Date(now.getTime() + MAX_DAYS * 86400000)),
  };
}

// datetime-local has minute resolution, so allow ~1 minute of rounding slack at the lower bound.
export function parseSchedule(value, now = new Date()) {
  if (!value) return { ok: false, error: "Choose a date and time." };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { ok: false, error: "That date and time isn't valid." };
  if (d.getTime() < now.getTime() + MIN_LEAD_MINUTES * 60000 - 59000)
    return { ok: false, error: `Pick a time at least ${MIN_LEAD_MINUTES} minutes from now.` };
  if (d.getTime() > now.getTime() + MAX_DAYS * 86400000)
    return { ok: false, error: `Pick a time within the next ${MAX_DAYS} days.` };
  return { ok: true, iso: d.toISOString() };
}
