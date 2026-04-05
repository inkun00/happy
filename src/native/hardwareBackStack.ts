/**
 * Capacitor `backButton`과 SPA 라우팅 사이 우선순위 큐.
 * 후입선출: 가장 최근에 등록한 핸들러가 먼저 호출됩니다.
 * `true`를 반환하면 이벤트를 소비하고 라우터 `navigate(-1)` / `exitApp`은 실행하지 않습니다.
 */
const handlers: Array<() => boolean> = [];

export function registerHardwareBackHandler(handler: () => boolean): () => void {
  handlers.push(handler);
  return () => {
    const i = handlers.lastIndexOf(handler);
    if (i !== -1) handlers.splice(i, 1);
  };
}

export function dispatchHardwareBack(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) {
    if (handlers[i]()) return true;
  }
  return false;
}

/** Vitest 등에서 스택을 비울 때만 사용 */
export function clearHardwareBackHandlersForTest(): void {
  handlers.length = 0;
}
