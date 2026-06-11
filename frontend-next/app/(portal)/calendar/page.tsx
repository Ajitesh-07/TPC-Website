import CalendarView from "@/components/calendar/CalendarView";
import { STUDENT_EVENTS } from "@/data/calendar";

const CalendarPage = () => {
  return (
    <>
      {/* Header */}
      <header className="h-20 px-gutter-mobile md:px-gutter-desktop flex items-center justify-between border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div>
          <h2 className="text-headline-md font-headline-md text-text-primary hidden md:block">
            Calendar
          </h2>
          <h2 className="text-title-lg font-title-lg text-text-primary md:hidden">Calendar</h2>
          <p className="text-body-md font-body-md text-text-secondary hidden md:block">
            Your PPTs, assessments, interviews, deadlines, and results.
          </p>
        </div>
      </header>

      <CalendarView initialEvents={STUDENT_EVENTS} />
    </>
  );
};

export default CalendarPage;
