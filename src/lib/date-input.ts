export function toMonthInputValue(isoDate: string | null): string {
  return isoDate ? isoDate.slice(0, 7) : "";
}
