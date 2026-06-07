/** Normalize expo-router dynamic segment params (string | string[] | undefined). */
export function resolveRouteParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
