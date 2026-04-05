const KEY = "happy-device-id";

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id || id.length < 8) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
