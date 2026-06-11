import CalendarView, { type CalendarEvent } from '@/components/calendar/CalendarView';

/* Student-visible events. The calendar UI is shared across roles —
   only this event set differs per user (filtered server-side later). */
const STUDENT_EVENTS: CalendarEvent[] = [
  { id: 'google-oa', type: 'OA', title: 'Google — Online Assessment', date: '2024-11-15', start: '14:00', end: '15:30', location: 'HackerEarth (online)', detail: 'Ensure webcam and microphone are working.' },
  { id: 'microsoft-ppt', type: 'PPT', title: 'Microsoft — Pre-Placement Talk', date: '2024-11-16', start: '10:00', end: '11:00', location: 'Senate Hall, Main Building' },
  { id: 'atlassian-interview', type: 'Interview', title: 'Atlassian — Technical Interview', date: '2024-11-18', start: '09:00', location: 'Check email for exact slot timings.' },
  { id: 'oracle-deadline', type: 'Deadline', title: 'Oracle — Application Deadline', date: '2024-11-20', detail: 'Applications close 11:59 PM. Update your resume first.' },
  { id: 'goldman-result', type: 'Result', title: 'Goldman Sachs — Shortlist Announcement', date: '2024-11-22' },
  { id: 'deshaw-oa', type: 'OA', title: 'DE Shaw — Online Assessment', date: '2024-11-25', start: '16:00', end: '17:30', location: 'Online' },
];

const CalendarPage = () => {
  return (
    <>
      {/* Header */}
      <header className="h-20 px-gutter-mobile md:px-gutter-desktop flex items-center justify-between border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div>
          <h2 className="text-headline-md font-headline-md text-text-primary hidden md:block">Calendar</h2>
          <h2 className="text-title-lg font-title-lg text-text-primary md:hidden">Calendar</h2>
          <p className="text-body-md font-body-md text-text-secondary hidden md:block">Your PPTs, assessments, interviews, deadlines, and results.</p>
        </div>
      </header>

      <CalendarView initialEvents={STUDENT_EVENTS} />
    </>
  );
};

export default CalendarPage;
