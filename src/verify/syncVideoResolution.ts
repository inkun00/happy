/**
 * TF/MediaPipe `getImageSize(video)`는 video.width·height(기본 300×150)를 씁니다.
 * `fromPixels(video)`는 videoWidth×videoHeight라 좌표가 어긋나 얼굴 검출이 항상 실패할 수 있음.
 */
export function syncVideoElementResolution(el: HTMLVideoElement) {
  const w = el.videoWidth;
  const h = el.videoHeight;
  if (w > 0 && h > 0) {
    el.width = w;
    el.height = h;
  }
}
