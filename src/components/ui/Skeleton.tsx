type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
  "aria-label"?: string;
};

export function Skeleton({
  className = "",
  width,
  height,
  rounded = false,
  "aria-label": ariaLabel = "Chargement",
}: SkeletonProps) {
  return (
    <div
      className={`ds-skeleton${rounded ? " ds-skeleton-rounded" : ""}${className ? ` ${className}` : ""}`}
      style={{ width, height }}
      aria-hidden={ariaLabel ? undefined : true}
      aria-label={ariaLabel}
      role="status"
    />
  );
}

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

export function SkeletonText({ lines = 3, className = "" }: SkeletonTextProps) {
  return (
    <div className={`ds-skeleton-text${className ? ` ${className}` : ""}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={14}
          width={index === lines - 1 ? "70%" : "100%"}
          className="ds-skeleton-line"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`ds-skeleton-card${className ? ` ${className}` : ""}`} aria-hidden="true">
      <Skeleton height={20} width="45%" className="ds-skeleton-line" />
      <SkeletonText lines={2} />
      <Skeleton height={40} width="100%" rounded className="ds-skeleton-line" />
    </div>
  );
}
