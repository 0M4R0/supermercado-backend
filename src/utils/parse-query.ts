const VALID_SORT_COLUMNS = ["nombre", "precio", "created_at"] as const;

export type SortColumn = (typeof VALID_SORT_COLUMNS)[number];

export type SortParams = {
  column: SortColumn;
  ascending: boolean;
};

export function parseCategoryIds(
  raw: unknown,
): { ids: number[] } | { error: string } | null {
  if (raw === undefined || raw === null || raw === "") return null;

  const parts = Array.isArray(raw)
    ? raw.flatMap((value) => String(value).split(","))
    : String(raw).split(",");

  const ids: number[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const id = parseInt(trimmed, 10);
    if (isNaN(id)) {
      return { error: `categoria_id inválido: "${trimmed}"` };
    }
    ids.push(id);
  }

  return ids.length ? { ids: [...new Set(ids)] } : null;
}

export function parseSortParams(
  orderRaw: unknown,
  dirRaw: unknown,
): SortParams {
  const column = VALID_SORT_COLUMNS.includes(orderRaw as SortColumn)
    ? (orderRaw as SortColumn)
    : "nombre";

  return {
    column,
    ascending: String(dirRaw ?? "asc").toLowerCase() !== "desc",
  };
}
