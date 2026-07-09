"use client";

// Generic card-grid view shared by any feature that renders a collection of
// items as cards with cover art (or an "add cover image" placeholder) plus
// Edit/Delete actions (currently used by the Backlog and History pages).

interface CardItem {
  id: string;
  title: string;
  coverImageUrl: string | null;
}

interface CardGridProps<T extends CardItem> {
  items: T[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onSetCoverImage: (item: T, url: string) => void;
  /** Renders the meta lines shown below the title (e.g. platform, hype, status). */
  renderMeta: (item: T) => React.ReactNode;
  emptyMessage: string;
  /** Optional extra actions rendered before Edit/Delete (e.g. "Move to History"). */
  renderExtraActions?: (item: T) => React.ReactNode;
}

export function CardGrid<T extends CardItem>({
  items,
  onEdit,
  onDelete,
  onSetCoverImage,
  renderMeta,
  emptyMessage,
  renderExtraActions,
}: CardGridProps<T>) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-neutral-500">{emptyMessage}</p>;
  }

  function handlePlaceholderClick(item: T) {
    const url = window.prompt("Cover image URL for " + item.title);
    if (url && url.trim()) {
      onSetCoverImage(item, url.trim());
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex flex-col overflow-hidden rounded border border-neutral-200 dark:border-neutral-800"
        >
          {item.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, arbitrary user-provided URLs
            <img
              src={item.coverImageUrl}
              alt={`${item.title} cover art`}
              className="h-40 w-full object-cover"
            />
          ) : (
            <button
              type="button"
              onClick={() => handlePlaceholderClick(item)}
              className="flex h-40 w-full flex-col items-center justify-center bg-neutral-200 text-xs text-neutral-500 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <span className="text-2xl">🎮</span>
              Add cover image
            </button>
          )}
          <div className="flex flex-1 flex-col gap-1 p-3">
            <h3 className="text-sm font-semibold">{item.title}</h3>
            {renderMeta(item)}
            <div className="mt-auto flex justify-between pt-2 text-xs">
              {renderExtraActions?.(item)}
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="text-neutral-600 hover:underline dark:text-neutral-300"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
