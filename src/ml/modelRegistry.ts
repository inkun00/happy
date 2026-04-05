/**
 * 브라우저 TF.js 파이프라인 식별자(문서·디버그·Capacitor/TFLite 이전 시 대조용).
 *
 * `ML_MODEL_ARTIFACTS`: 현재 설치된 `@tensorflow-models/*` 기본값과 동일한 TF Hub URL을
 * 코드에 명시해 두어, 라이브러리 내부 default 변경 없이도 재현 가능한 로드를 유지합니다.
 * face-landmarks / pose-detection 메이저 업그레이드 시 패키지의 constants와 대조해 갱신하세요.
 */
export const ML_MODEL_ARTIFACTS = {
  face: {
    /** MediaPipe Face Detector short (face-landmarks tfjs 파이프라인) */
    detectorShort:
      "https://tfhub.dev/mediapipe/tfjs-model/face_detection/short/1" as const,
    landmarkBase:
      "https://tfhub.dev/mediapipe/tfjs-model/face_landmarks_detection/face_mesh/1" as const,
    landmarkAttention:
      "https://tfhub.dev/mediapipe/tfjs-model/face_landmarks_detection/attention_mesh/1" as const,
  },
  pose: {
    moveNetMultiLightning:
      "https://tfhub.dev/google/tfjs-model/movenet/multipose/lightning/1" as const,
  },
} as const;

export const ML_PIPELINE = {
  face: {
    model: "MediaPipeFaceMesh" as const,
    runtime: "tfjs" as const,
  },
  pose: {
    model: "MoveNet" as const,
    multiPoseVariant: "MULTIPOSE_LIGHTNING" as const,
  },
  speech: {
    api: "WebSpeechRecognition" as const,
  },
  geo: {
    strategy: "Geolocation+haversine" as const,
  },
} as const;

/**
 * 네이티브 TFLite / MediaPipe 브리지 연동 여부.
 * `integrated: true`가 되면 `useVerifyFlow` 등에서 플랫폼 분기로 교체할 수 있도록 표시만 유지합니다.
 */
export const NATIVE_ML = {
  integrated: false as const,
  bridgeId: "capacitor-tflite-mediapipe" as const,
} as const;
