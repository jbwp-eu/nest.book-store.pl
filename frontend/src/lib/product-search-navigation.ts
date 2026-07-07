export function buildCatalogSearchUrl(search: string): string {
  const params = new URLSearchParams();
  const trimmed = search.trim();

  if (trimmed) {
    params.set("search", trimmed);
  }

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function isCatalogPath(pathname: string): boolean {
  return pathname === "/" || /^\/page\/\d+$/.test(pathname);
}
