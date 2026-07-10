"use client";

// Generic card-grid view shared by any feature that renders a collection of
// items as cards with cover art (or an "add cover image" placeholder) plus a
// fully custom actions row (currently used by the Backlog and History pages).

import styles from "./CardGrid.module.css";

interface CardItem {
  id: string;
  title: string;
  coverImageUrl: string | null;
}

interface CardGridProps<T extends CardItem> {
  items: T[];
  onSetCoverImage: (item: T, url: string) => void;
  /** Renders the meta lines shown below the title (e.g. platform, hype, status). */
  renderMeta: (item: T) => React.ReactNode;
  emptyMessage: string;
  /** Renders the card's action row content (e.g. buttons, an actions menu). */
  renderActions: (item: T) => React.ReactNode;
}

export function CardGrid<T extends CardItem>({
  items,
  onSetCoverImage,
  renderMeta,
  emptyMessage,
  renderActions,
}: CardGridProps<T>) {
  if (items.length === 0) {
    return <p className={styles.emptyMessage}>{emptyMessage}</p>;
  }

  function handlePlaceholderClick(item: T) {
    const url = window.prompt("Cover image URL for " + item.title);
    if (url && url.trim()) {
      onSetCoverImage(item, url.trim());
    }
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <div key={item.id} className={styles.card}>
          {item.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, arbitrary user-provided URLs
            <img
              src={item.coverImageUrl}
              alt={`${item.title} cover art`}
              className={styles.coverImage}
            />
          ) : (
            <button
              type="button"
              onClick={() => handlePlaceholderClick(item)}
              className={styles.coverPlaceholder}
            >
              <span className={styles.coverPlaceholderIcon}>🎮</span>
              Add cover image
            </button>
          )}
          <div className={styles.cardBody}>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            {renderMeta(item)}
            <div className={styles.cardActions}>{renderActions(item)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
