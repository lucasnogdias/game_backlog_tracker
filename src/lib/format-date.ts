const DATE_LOCALE = "en-GB";
const DATE_TIME_ZONE = "UTC";

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    timeZone: DATE_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

export function formatMonthYear(isoDate: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    timeZone: DATE_TIME_ZONE,
    year: "numeric",
    month: "short",
  }).format(new Date(isoDate));
}

export function formatDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    timeZone: DATE_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}
