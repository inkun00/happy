/** VITE_API_URL 끝 슬래시 제거 — `${base}/api/...` 이중 슬래시로 인한 404 방지 */
export function viteApiBase(): string {
  const v = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
  return v.replace(/\/+$/, "");
}
