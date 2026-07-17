type CalendarSectionSkeletonProps = {
  rows?: number;
};

export function CalendarSectionSkeleton({
  rows = 2,
}: CalendarSectionSkeletonProps) {
  return (
    <div className="calendar-section-skeleton" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="calendar-section-skeleton-row" key={index} />
      ))}
    </div>
  );
}
