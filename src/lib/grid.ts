export function autoGridCols(count: number): string {
  if (count <= 3) return "grid-cols-3";
  if (count <= 4) return "grid-cols-3 sm:grid-cols-4";
  if (count <= 6) return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6";
  if (count <= 8) return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8";
  return "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8";
}
