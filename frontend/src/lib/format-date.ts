export function formatOrderId(id: string): string {
  return `..${id.slice(-6)}`;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleString();
}
