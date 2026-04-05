import { describe, expect, it } from "vitest";
import { ML_MODEL_ARTIFACTS, ML_PIPELINE, NATIVE_ML } from "./modelRegistry";

describe("modelRegistry", () => {
  it("고정한 ML 가중치 URL이 tfhub 기대 경로를 포함한다", () => {
    expect(ML_MODEL_ARTIFACTS.face.detectorShort).toContain("tfhub.dev");
    expect(ML_MODEL_ARTIFACTS.face.landmarkAttention).toContain("attention_mesh");
    expect(ML_MODEL_ARTIFACTS.pose.moveNetMultiLightning).toContain(
      "movenet/multipose/lightning",
    );
  });

  it("파이프라인 식별자가 프로필 표시용으로 안정적이다", () => {
    expect(ML_PIPELINE.face.model).toBe("MediaPipeFaceMesh");
    expect(ML_PIPELINE.pose.model).toBe("MoveNet");
    expect(ML_PIPELINE.speech.api).toBe("WebSpeechRecognition");
  });

  it("네이티브 ML 브리지는 아직 꺼져 있다", () => {
    expect(NATIVE_ML.integrated).toBe(false);
    expect(NATIVE_ML.bridgeId).toBe("capacitor-tflite-mediapipe");
  });
});
