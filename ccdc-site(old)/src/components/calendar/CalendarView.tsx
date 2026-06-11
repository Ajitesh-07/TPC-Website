'use client';

import { useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Shared, role-agnostic calendar. Pass in whichever events the        */
/* current user should see; the UI is identical across roles.          */
/* ------------------------------------------------------------------ */

export type EventType = 'PPT' | 'OA' | 'Interview' | 'Deadline' | 'Result';

export interface CalendarEvent {
  id: string;
  type: EventType;
  title: string;
  date: string; // ISO 'YYYY-MM-DD'
  start?: string; // 'HH:MM' (omit for all-day, e.g. deadlines/results)
  end?: string; // 'HH:MM'
  location?: string;
  detail?: string;
}

export const EVENT_CONFIG: Record<EventType, { label: string; dot: string; badge: string }> = {
  PPT: { label: 'Pre-Placement Talk', dot: 'bg-navy-vibrant', badge: 'bg-navy-vibrant/10 text-navy-vibrant' },
  OA: { label: 'Online Assessment', dot: 'bg-status-warning', badge: 'bg-status-warning/10 text-status-warning' },
  Interview: { label: 'Interview', dot: 'bg-status-success', badge: 'bg-status-success/10 text-status-success' },
  Deadline: { label: 'Deadline', dot: 'bg-status-error', badge: 'bg-status-error/10 text-status-error' },
  Result: { label: 'Result / Announcement', dot: 'bg-primary', badge: 'bg-primary-fixed text-on-primary-fixed' },
};

const EVENT_TYPES = Object.keys(EVENT_CONFIG) as EventType[];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ---------- date + export helpers ---------- */

// 'YYYY-MM-DD' (+ optional 'HH:MM') -> ICS-style stamp.
const icsStamp = (date: string, time?: string) => {
  const d = date.replace(/-/g, '');
  return time ? `${d}T${time.replace(':', '')}00` : d;
};

const formatTimeRange = (ev: CalendarEvent) => {
  if (!ev.start) return 'All day';
  return ev.end ? `${ev.start} – ${ev.end}` : ev.start;
};

const prettyDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}, ${y}`;
};

const googleCalUrl = (ev: CalendarEvent) => {
  const start = icsStamp(ev.date, ev.start);
  const end = icsStamp(ev.date, ev.end ?? ev.start);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    details: ev.detail ?? '',
    location: ev.location ?? '',
    dates: ev.start ? `${start}/${end}` : `${start}/${start}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const buildICS = (events: CalendarEvent[]) => {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//IIT Patna TPC//Calendar//EN', 'CALSCALE:GREGORIAN'];
  for (const ev of events) {
    lines.push('BEGIN:VEVENT', `UID:${ev.id}@tpc.iitp.ac.in`, `DTSTAMP:${stamp}`);
    if (ev.start) {
      lines.push(`DTSTART:${icsStamp(ev.date, ev.start)}`, `DTEND:${icsStamp(ev.date, ev.end ?? ev.start)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icsStamp(ev.date)}`);
    }
    lines.push(`SUMMARY:${ev.title}`);
    if (ev.location) lines.push(`LOCATION:${ev.location}`);
    if (ev.detail) lines.push(`DESCRIPTION:${ev.detail}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

/* ------------------------------------------------------------------ */

const inputClass =
  'w-full bg-surface-container-lowest border border-surface-border rounded-lg px-3 py-2 text-body-md font-body-md text-text-primary focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all';

interface CalendarViewProps {
  initialEvents: CalendarEvent[];
  /** Initial month shown (defaults to month of the first event, else Jan). */
  defaultMonth?: { year: number; month: number };
}

const CalendarView = ({ initialEvents, defaultMonth }: CalendarViewProps) => {
  const seed = defaultMonth ??
    (initialEvents[0]
      ? { year: Number(initialEvents[0].date.slice(0, 4)), month: Number(initialEvents[0].date.slice(5, 7)) - 1 }
      : { year: 2024, month: 10 });

  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [year, setYear] = useState(seed.year);
  const [month, setMonth] = useState(seed.month);
  const [hidden, setHidden] = useState<Set<EventType>>(new Set());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const visibleEvents = useMemo(
    () => events.filter((e) => !hidden.has(e.type)),
    [events, hidden]
  );

  // Events for the currently-viewed month, keyed by day-of-month.
  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const e of visibleEvents) {
      const [ey, em, ed] = e.date.split('-').map(Number);
      if (ey === year && em - 1 === month) {
        const list = map.get(ed) ?? [];
        list.push(e);
        map.set(ed, list);
      }
    }
    return map;
  }, [visibleEvents, year, month]);

  // Month grid cells (Monday-first), null = leading blanks.
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const offset = (firstDay + 6) % 7; // Mon=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (number | null)[] = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(d);
    return out;
  }, [year, month]);

  // Upcoming list: filtered by type, optionally narrowed to the selected day, sorted.
  const listedEvents = useMemo(() => {
    return [...visibleEvents]
      .filter((e) => {
        if (selectedDay === null) return true;
        const [ey, em, ed] = e.date.split('-').map(Number);
        return ey === year && em - 1 === month && ed === selectedDay;
      })
      .sort((a, b) => (a.date + (a.start ?? '')).localeCompare(b.date + (b.start ?? '')));
  }, [visibleEvents, selectedDay, year, month]);

  const changeMonth = (delta: number) => {
    setSelectedDay(null);
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const toggleType = (type: EventType) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const downloadICS = () => {
    const blob = new Blob([buildICS(visibleEvents)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tpc-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const date = String(form.get('date') || '');
    if (!date) return;
    const start = String(form.get('start') || '');
    const ev: CalendarEvent = {
      id: `custom-${date}-${start || 'allday'}-${events.length}`,
      type: (form.get('type') as EventType) || 'Deadline',
      title: String(form.get('title') || 'Untitled Event'),
      date,
      start: start || undefined,
      end: String(form.get('end') || '') || undefined,
      location: String(form.get('location') || '') || undefined,
    };
    setEvents((prev) => [...prev, ev]);
    // Jump the view to the new event's month.
    setYear(Number(date.slice(0, 4)));
    setMonth(Number(date.slice(5, 7)) - 1);
    setShowAdd(false);
  };

  return (
    <div className="p-gutter-mobile md:p-gutter-desktop flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar grid */}
        <section className="lg:col-span-7 xl:col-span-8 bg-surface-container-lowest rounded-xl soft-shadow border border-surface-border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-lg font-title-lg text-text-primary">{MONTH_NAMES[month]} {year}</h3>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-1 rounded hover:bg-surface-container text-text-secondary" aria-label="Previous month">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button onClick={() => changeMonth(1)} className="p-1 rounded hover:bg-surface-container text-text-secondary" aria-label="Next month">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-label-sm font-label-sm text-text-secondary uppercase">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} className="aspect-square" />;
              const dayEvents = eventsByDay.get(day) ?? [];
              const isSelected = selectedDay === day;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`aspect-square rounded-lg border p-1.5 flex flex-col items-start transition-colors text-left ${
                    isSelected ? 'border-primary bg-primary-fixed/30' : 'border-transparent hover:bg-surface-container'
                  }`}
                >
                  <span className={`text-body-md font-body-md ${isSelected ? 'text-primary font-bold' : 'text-text-primary'}`}>{day}</span>
                  <div className="flex flex-wrap gap-1 mt-auto">
                    {dayEvents.slice(0, 3).map((e) => (
                      <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${EVENT_CONFIG[e.type].dot}`} title={e.title}></span>
                    ))}
                    {dayEvents.length > 3 && <span className="text-[9px] text-text-secondary leading-none">+{dayEvents.length - 3}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend / type filters */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-surface-border">
            {EVENT_TYPES.map((type) => {
              const off = hidden.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-label-sm font-label-sm transition-colors ${
                    off ? 'border-surface-border text-text-secondary opacity-50' : 'border-surface-border text-text-primary'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${EVENT_CONFIG[type].dot}`}></span>
                  {EVENT_CONFIG[type].label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Upcoming events list */}
        <section className="lg:col-span-5 xl:col-span-4 bg-surface-container-lowest rounded-xl soft-shadow border border-surface-border flex flex-col overflow-hidden">
          <div className="p-5 border-b border-surface-border flex justify-between items-center bg-surface/50 backdrop-blur-sm">
            <h3 className="text-title-md font-title-md text-text-primary">
              {selectedDay ? `Events on ${MONTH_NAMES[month].slice(0, 3)} ${selectedDay}` : 'Upcoming Events'}
            </h3>
            {selectedDay && (
              <button onClick={() => setSelectedDay(null)} className="text-label-sm font-label-sm text-primary hover:text-navy-vibrant">Clear</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar max-h-[60vh]">
            {listedEvents.length === 0 ? (
              <p className="text-body-md font-body-md text-text-secondary text-center py-8">No events to show.</p>
            ) : (
              listedEvents.map((ev) => (
                <div key={ev.id} className="p-4 rounded-lg border border-surface-border bg-surface-container-low hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className={`px-2 py-0.5 rounded text-label-sm font-label-sm ${EVENT_CONFIG[ev.type].badge}`}>{EVENT_CONFIG[ev.type].label}</span>
                    <span className="text-label-sm font-label-sm text-text-secondary whitespace-nowrap">{prettyDate(ev.date)}</span>
                  </div>
                  <h4 className="text-title-md font-title-md text-primary mt-1">{ev.title}</h4>
                  <p className="text-body-md font-body-md text-text-secondary mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span> {formatTimeRange(ev)}
                  </p>
                  {ev.location && (
                    <p className="text-body-md font-body-md text-text-secondary mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span> {ev.location}
                    </p>
                  )}
                  <a
                    href={googleCalUrl(ev)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-label-md font-label-md text-primary hover:text-navy-vibrant transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
                    Add to Google Calendar
                  </a>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Add Event Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAdd(false)}></div>
          <form onSubmit={handleAdd} className="relative z-10 bg-surface-container-lowest rounded-xl border border-surface-border w-full max-w-md elevation-2 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-title-lg font-title-lg text-text-primary">Add Personal Event</h3>
              <button type="button" onClick={() => setShowAdd(false)} className="w-9 h-9 rounded-full hover:bg-surface-variant flex items-center justify-center text-text-secondary" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div>
              <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="title">Title</label>
              <input id="title" name="title" className={inputClass} placeholder="e.g. Mock interview prep" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="type">Type</label>
                <select id="type" name="type" className={inputClass} defaultValue="Deadline">
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{EVENT_CONFIG[t].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="date">Date</label>
                <input id="date" name="date" type="date" className={inputClass} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="start">Start (optional)</label>
                <input id="start" name="start" type="time" className={inputClass} />
              </div>
              <div>
                <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="end">End (optional)</label>
                <input id="end" name="end" type="time" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-label-sm font-label-sm text-text-secondary mb-1" htmlFor="location">Location / Link (optional)</label>
              <input id="location" name="location" className={inputClass} placeholder="Venue or meeting link" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-surface-border text-label-md font-label-md text-text-secondary hover:bg-surface-variant transition-colors">
                Cancel
              </button>
              <button type="submit" className="bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary px-5 py-2 rounded-lg text-label-md font-label-md shadow-sm hover:opacity-90 transition-opacity">
                Add Event
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Self-contained action bar so any host page gets Add + Export for free. */}
      <CalendarActions onAdd={() => setShowAdd(true)} onExport={downloadICS} />
    </div>
  );
};

/* Small inline action bar so any host page gets Add + Export without wiring state. */
const CalendarActions = ({ onAdd, onExport }: { onAdd: () => void; onExport: () => void }) => (
  <div className="fixed bottom-6 right-6 z-40 flex gap-3">
    <button
      onClick={onExport}
      className="flex items-center gap-2 px-4 py-3 rounded-full bg-surface-container-lowest border border-surface-border soft-shadow text-label-md font-label-md text-text-primary hover:bg-surface-variant transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]">download</span>
      <span className="hidden sm:inline">Export .ics</span>
    </button>
    <button
      onClick={onAdd}
      className="flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-b from-primary to-navy-deep border-t border-white/10 text-on-primary soft-shadow text-label-md font-label-md hover:opacity-90 transition-opacity"
    >
      <span className="material-symbols-outlined text-[20px]">add</span>
      Add Event
    </button>
  </div>
);

export default CalendarView;
