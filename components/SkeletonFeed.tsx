import React from 'react';

/**
 * Skeleton placeholder for list view article row.
 */
export const SkeletonListRow: React.FC = () => (
  <div className="skeleton-row">
    <div className="skeleton-image-square" />
    <div className="skeleton-text-container">
      <div className="skeleton-text-line title-line" />
      <div className="skeleton-text-line snippet-line" />
    </div>
  </div>
);

/**
 * Skeleton placeholder for grid view article card.
 */
export const SkeletonGridCard: React.FC = () => (
  <div className="skeleton-card">
    <div className="skeleton-image-full" />
    <div className="skeleton-text-container">
      <div className="skeleton-text-line title-line" />
      <div className="skeleton-text-line snippet-line" />
    </div>
  </div>
);

/**
 * Skeleton placeholder for featured view article card.
 */
export const SkeletonFeaturedCard: React.FC = () => (
  <div className="skeleton-featured">
    <div className="skeleton-image-full featured-height" />
    <div className="skeleton-featured-overlay">
      <div className="skeleton-text-line title-line" />
      <div className="skeleton-text-line snippet-line" />
    </div>
  </div>
);

interface SkeletonFeedListProps {
  count?: number;
  view: 'list' | 'grid' | 'featured';
}

/**
 * Renders n of the appropriate skeleton variant.
 */
export const SkeletonFeedList: React.FC<SkeletonFeedListProps> = ({ count = 6, view }) => {
  const skeletons = Array.from({ length: count });

  return (
    <div className={`skeleton-feed-container ${view}-view`}>
      {skeletons.map((_, i) => {
        if (view === 'list') return <SkeletonListRow key={i} />;
        if (view === 'grid') return <SkeletonGridCard key={i} />;
        if (view === 'featured') return <SkeletonFeaturedCard key={i} />;
        return null;
      })}

      <style>{`
        .skeleton-feed-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-feed-container.grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          padding: 16px;
        }

        .skeleton-feed-container.featured-view {
          padding: 16px;
        }

        .skeleton-row {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--c-border);
        }

        .skeleton-card {
          background: var(--c-elevated);
          border: 1px solid var(--c-border);
          border-radius: var(--r-card);
          overflow: hidden;
        }

        .skeleton-featured {
          position: relative;
          border-radius: var(--r-card);
          overflow: hidden;
          margin-bottom: 16px;
        }

        .skeleton-image-square {
          width: 56px;
          height: 56px;
          border-radius: 6px;
          background: var(--c-elevated);
          position: relative;
          overflow: hidden;
        }

        .skeleton-image-full {
          width: 100%;
          height: 160px;
          background: var(--c-elevated);
          position: relative;
          overflow: hidden;
        }

        .featured-height {
          height: 280px;
        }

        .skeleton-text-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
        }

        .skeleton-row .skeleton-text-container {
          padding: 0;
          justify-content: center;
        }

        .skeleton-text-line {
          height: 12px;
          background: var(--c-elevated);
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }

        .title-line { width: 70%; height: 14px; }
        .snippet-line { width: 45%; }

        .skeleton-featured-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        /* Shimmer Animation */
        .skeleton-image-square::after,
        .skeleton-image-full::after,
        .skeleton-text-line::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            var(--c-border) 50%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }

        @keyframes shimmer {
          from { background-position: -200% 0; }
          to { background-position: 200% 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-image-square::after,
          .skeleton-image-full::after,
          .skeleton-text-line::after {
            animation: none;
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
