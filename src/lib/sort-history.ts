import type {
  HistoryEntryDTO,
  HistorySortField,
  SortDirection,
} from "@/types/history";

function compareNullable<T>(a: T | null, b: T | null): number | null {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // nulls sort last regardless of direction
  if (b === null) return -1;
  return null; // both present, caller compares values
}

const NULLABLE_FIELDS = new Set<HistorySortField>([
  "playtimeMinutes",
  "finishedOn",
  "platform",
  "releaseDate",
]);

export function sortHistoryEntries(
  entries: HistoryEntryDTO[],
  field: HistorySortField,
  direction: SortDirection
): HistoryEntryDTO[] {
  const sorted = [...entries].sort((a, b) => {
    // Nulls always sort last, independent of direction.
    if (NULLABLE_FIELDS.has(field) && field !== "addedAt") {
      const nullResult = compareNullable(
        a[field as keyof HistoryEntryDTO] as string | number | null,
        b[field as keyof HistoryEntryDTO] as string | number | null
      );
      if (nullResult !== null) return nullResult;
    }

    let result: number;

    switch (field) {
      case "title":
        result = a.title.localeCompare(b.title);
        break;
      case "status":
        result = a.status.localeCompare(b.status);
        break;
      case "playtimeMinutes":
        result = a.playtimeMinutes! - b.playtimeMinutes!;
        break;
      case "finishedOn":
        result =
          new Date(a.finishedOn!).getTime() - new Date(b.finishedOn!).getTime();
        break;
      case "platform":
        result = a.platform!.localeCompare(b.platform!);
        break;
      case "releaseDate":
        result =
          new Date(a.releaseDate!).getTime() - new Date(b.releaseDate!).getTime();
        break;
      case "addedAt":
        result =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        result = 0;
    }

    return direction === "asc" ? result : -result;
  });

  return sorted;
}
