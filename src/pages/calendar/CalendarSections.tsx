import type { ReactNode } from "react";

import { CalendarSectionSkeleton } from "../../components/calendar/CalendarSectionSkeleton";

type CalendarDayItemsSectionProps = {
  title: string;
  isBootstrapping: boolean;
  isRefreshing: boolean;
  error: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: ReactNode;
};

export function CalendarDayItemsSection({
  title,
  isBootstrapping,
  isRefreshing,
  error,
  isEmpty,
  emptyMessage,
  children,
}: CalendarDayItemsSectionProps) {
  const showSkeleton = isBootstrapping && isEmpty;

  return (
    <section className="planning-section calendar-stable-section">
      <div className="calendar-section-heading">
        <h2>{title}</h2>
        {isRefreshing && !showSkeleton && (
          <span className="calendar-refresh-badge">Mise à jour…</span>
        )}
      </div>

      {error && <div className="message message-error">{error}</div>}

      {showSkeleton ? (
        <CalendarSectionSkeleton rows={2} />
      ) : isEmpty ? (
        <p className="calendar-empty-message">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}

export function CalendarPeriodsSection({
  isBootstrapping,
  isRefreshing,
  error,
  isEmpty,
  emptyMessage,
  children,
}: Omit<CalendarDayItemsSectionProps, "title">) {
  const showSkeleton = isBootstrapping && isEmpty;

  return (
    <section className="planning-section calendar-stable-section">
      <div className="calendar-section-heading">
        <h2>Périodes de contexte actives</h2>
        {isRefreshing && !showSkeleton && (
          <span className="calendar-refresh-badge">Mise à jour…</span>
        )}
      </div>

      {error && <div className="message message-error">{error}</div>}

      {showSkeleton ? (
        <CalendarSectionSkeleton rows={1} />
      ) : isEmpty ? (
        <p className="calendar-empty-message">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}
