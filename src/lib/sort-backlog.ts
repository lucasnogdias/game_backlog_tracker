import type {
  BacklogGameDTO,
  BacklogSortField,
  SortDirection,
} from "@/types/backlog";

function compareNullable<T>(a: T | null, b: T | null): number | null {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // nulls sort last regardless of direction
  if (b === null) return -1;
  return null; // both present, caller compares values
}

export function sortBacklogGames(
  games: BacklogGameDTO[],
  field: BacklogSortField,
  direction: SortDirection
): BacklogGameDTO[] {
  const sorted = [...games].sort((a, b) => {
    // Nulls always sort last, independent of direction.
    const nullResult = nullableFieldComparison(a, b, field);
    if (nullResult !== null) return nullResult;

    let result: number;

    switch (field) {
      case "title":
        result = a.title.localeCompare(b.title);
        break;
      case "owned":
        result = Number(a.owned) - Number(b.owned);
        break;
      case "platforms":
        result = (a.platforms[0] ?? "").localeCompare(b.platforms[0] ?? "");
        break;
      case "estimatedHours":
        result = a.estimatedHours! - b.estimatedHours!;
        break;
      case "releaseDate":
        result =
          new Date(a.releaseDate!).getTime() - new Date(b.releaseDate!).getTime();
        break;
      case "hype":
        result = a.hype! - b.hype!;
        break;
      default:
        result = 0;
    }

    return direction === "asc" ? result : -result;
  });

  return sorted;
}

function nullableFieldComparison(
  a: BacklogGameDTO,
  b: BacklogGameDTO,
  field: BacklogSortField
): number | null {
  if (field !== "estimatedHours" && field !== "releaseDate" && field !== "hype") {
    return null; // field is never null, nothing to special-case
  }
  return compareNullable(a[field], b[field]);
}
