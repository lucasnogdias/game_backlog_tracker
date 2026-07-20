"use client";

import { useCallback, useEffect, useState } from "react";

type SortDirection = "asc" | "desc";

function isSortDirection(value: string | null): value is SortDirection {
  return value === "asc" || value === "desc";
}

function isSortField<TField extends string>(
  value: string | null,
  fields: readonly TField[]
): value is TField {
  return value !== null && fields.includes(value as TField);
}

export function useSortPreference<TField extends string>(
  storageKey: string,
  defaultField: TField,
  defaultDirection: SortDirection,
  fields: readonly TField[]
): [TField, SortDirection, (field: TField, direction: SortDirection) => void] {
  const [sortField, setSortField] = useState<TField>(defaultField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection);

  useEffect(() => {
    const savedField = window.localStorage.getItem(`${storageKey}:field`);
    const savedDirection = window.localStorage.getItem(`${storageKey}:direction`);

    if (isSortField(savedField, fields)) {
      setSortField(savedField);
    }
    if (isSortDirection(savedDirection)) {
      setSortDirection(savedDirection);
    }
  }, [fields, storageKey]);

  const setPreferredSort = useCallback(
    (field: TField, direction: SortDirection) => {
      setSortField(field);
      setSortDirection(direction);
      window.localStorage.setItem(`${storageKey}:field`, field);
      window.localStorage.setItem(`${storageKey}:direction`, direction);
    },
    [storageKey]
  );

  return [sortField, sortDirection, setPreferredSort];
}
