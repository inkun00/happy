import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import type { Mission } from "@/data/missions";
import { haversineM } from "@/ml/geo";
import { SMILE_SCORE_THRESHOLD, smileScore } from "@/ml/faceSmile";
import { ML_MODEL_ARTIFACTS } from "@/ml/modelRegistry";
import { handHoldScore, hugScore, type SimplePose } from "@/ml/poseProximity";
import { VOICE_KEYWORDS } from "@/verify/constants";
import { syncVideoElementResolution } from "@/verify/syncVideoResolution";

export type VerifyVisualInput = "stream" | "photo" | "placeholder";

type CompleteFn = (
  id: string,
) => Promise<{ ok: boolean; message?: string }>;

export function useVerifyFlow(
  mission: Mission | undefined,
  completedIds: string[],
  completeMission: CompleteFn,
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const detectorsRef = useRef<{ face: unknown; pose: unknown }>({
    face: null,
    pose: null,
  });

  const goodMsRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const finishedRef = useRef(false);
  /** 스트림 프레임 또는 네이티브 촬영 사진이 ML에 넘길 준비가 됨 */
  const hasRenderableFramesRef = useRef(false);

  const [progress, setProgress] = useState(0);
  const [hud, setHud] = useState("준비 중…");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [geoInfo, setGeoInfo] = useState<string | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [cameraFramesReady, setCameraFramesReady] = useState(false);
  const [visualInput, setVisualInput] =
    useState<VerifyVisualInput>("placeholder");
  const [streamFailed, setStreamFailed] = useState(false);

  const needVideo =
    mission?.verifyType === "smile" || mission?.verifyType === "pose";

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const disposeDetectors = useCallback(() => {
    const f = detectorsRef.current.face as { dispose?: () => void } | null;
    const p = detectorsRef.current.pose as { dispose?: () => void } | null;
    f?.dispose?.();
    p?.dispose?.();
    detectorsRef.current = { face: null, pose: null };
  }, []);

  const syncComplete = useCallback(async (): Promise<boolean> => {
    if (!mission) return true;
    if (finishedRef.current) return true;
    if (completedIds.includes(mission.id)) return true;
    finishedRef.current = true;
    const res = await completeMission(mission.id);
    if (!res.ok) {
      finishedRef.current = false;
      setHud(res.message ?? "서버 저장에 실패했어요.");
      return false;
    }
    setProgress(100);
    setHud("인증 완료!");
    return true;
  }, [mission, completedIds, completeMission]);

  const takeNativePhoto = useCallback(async () => {
    if (!needVideo) return;
    try {
      const photo = await Camera.getPhoto({
        quality: 86,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });
      const path = photo.webPath;
      if (!path) throw new Error("no webPath");
      const src = Capacitor.convertFileSrc(path);
      const img = imageRef.current;
      if (!img) return;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("image load"));
        img.src = src;
      });
      hasRenderableFramesRef.current = true;
      setVisualInput("photo");
      setCameraFramesReady(true);
      setPermissionError(null);
      setHud("프레임 분석을 시작했어요.");
    } catch {
      setPermissionError(
        "사진을 촬영하지 못했어요. 카메라 권한을 확인해 주세요.",
      );
    }
  }, [needVideo]);

  const retakeNativePhoto = useCallback(() => {
    const img = imageRef.current;
    if (img) {
      img.removeAttribute("src");
    }
    hasRenderableFramesRef.current = false;
    setVisualInput("placeholder");
    setCameraFramesReady(false);
    goodMsRef.current = 0;
    lastTsRef.current = null;
    setProgress(0);
    finishedRef.current = false;
    setHud(
      Capacitor.isNativePlatform()
        ? "앱 카메라로 다시 촬영해 주세요."
        : "카메라를 준비하는 중…",
    );
  }, []);

  useEffect(() => {
    if (!mission || !needVideo) return;
    setCameraFramesReady(false);
    setVisualInput("placeholder");
    setStreamFailed(false);
    hasRenderableFramesRef.current = false;
    const img = imageRef.current;
    if (img) img.removeAttribute("src");
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          const markReady = () => {
            syncVideoElementResolution(el);
            if (!cancelled) {
              hasRenderableFramesRef.current = true;
              setCameraFramesReady(true);
            }
          };
          el.addEventListener("loadedmetadata", markReady, { once: true });
          el.addEventListener("loadeddata", markReady, { once: true });
          await el.play().catch(() => {});
          syncVideoElementResolution(el);
          if (el.readyState >= 2) markReady();
        }
        if (!cancelled) {
          setStreamFailed(false);
          setVisualInput("stream");
          setPermissionError(null);
          setHud("모델을 불러오는 중…");
        }
      } catch {
        if (!cancelled) {
          hasRenderableFramesRef.current = false;
          setStreamFailed(true);
          setVisualInput("placeholder");
          setPermissionError(
            Capacitor.isNativePlatform()
              ? "실시간 카메라를 사용할 수 없어요. 아래에서 앱 카메라로 촬영해 주세요."
              : "카메라 권한이 필요합니다. 브라우저 설정을 확인해 주세요.",
          );
          setHud("카메라를 사용할 수 없어요.");
        }
      }
    })();
    return () => {
      cancelled = true;
      stopStream();
      setCameraFramesReady(false);
    };
  }, [mission, needVideo, stopStream]);

  useEffect(() => {
    if (!mission || !needVideo) return;
    let cancelled = false;
    (async () => {
      try {
        const tf = await import("@tensorflow/tfjs");
        try {
          await tf.setBackend("webgl");
        } catch {
          await tf.setBackend("cpu");
        }
        await tf.ready();

        if (mission.verifyType === "smile") {
          const faceLandmarksDetection = await import(
            "@tensorflow-models/face-landmarks-detection"
          );
          const det = await faceLandmarksDetection.createDetector(
            faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
            {
              runtime: "tfjs",
              maxFaces: 2,
              refineLandmarks: true,
              detectorModelUrl: ML_MODEL_ARTIFACTS.face.detectorShort,
              landmarkModelUrl: ML_MODEL_ARTIFACTS.face.landmarkAttention,
            },
          );
          if (cancelled) {
            det.dispose();
            return;
          }
          detectorsRef.current.face = det;
        }

        if (mission.verifyType === "pose") {
          const poseDetection = await import("@tensorflow-models/pose-detection");
          const det = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            {
              modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
              modelUrl: ML_MODEL_ARTIFACTS.pose.moveNetMultiLightning,
              enableTracking: true,
              minPoseScore: 0.05,
              multiPoseMaxDimension: 512,
            },
          );
          if (cancelled) {
            det.dispose();
            return;
          }
          detectorsRef.current.pose = det;
        }

        if (!cancelled) {
          setModelsReady(true);
          if (hasRenderableFramesRef.current) {
            setHud("프레임 분석을 시작했어요.");
          }
        }
      } catch (e) {
        console.error(e);
        setHud("ML 모델 로드에 실패했습니다. 네트워크를 확인해 주세요.");
      }
    })();
    return () => {
      cancelled = true;
      void disposeDetectors();
      setModelsReady(false);
    };
  }, [mission, needVideo, disposeDetectors]);

  useEffect(() => {
    if (!mission || !needVideo || !modelsReady || !cameraFramesReady)
      return;

    const goal = mission.poseGoal;
    const isSmile = mission.verifyType === "smile";
    const targetMs = isSmile ? 2800 : 2200;

    const staticImage = visualInput === "photo";

    const tick = async (ts: number) => {
      const video = videoRef.current;
      const photo = imageRef.current;
      if (finishedRef.current || completedIds.includes(mission.id)) {
        setProgress(100);
        return;
      }

      let input: HTMLVideoElement | HTMLImageElement | null = null;
      if (visualInput === "stream") input = video;
      else if (visualInput === "photo") input = photo;

      if (!input) {
        setHud("카메라 입력 대기 중…");
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (visualInput === "stream" && video && video.readyState < 2) {
        setHud("카메라 프레임 대기 중…");
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (
        visualInput === "photo" &&
        photo &&
        (!photo.complete || photo.naturalWidth === 0)
      ) {
        setHud("사진 로드 대기 중…");
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(120, ts - lastTsRef.current);
      lastTsRef.current = ts;

      try {
        if (isSmile && detectorsRef.current.face) {
          const faceDet = detectorsRef.current.face as {
            estimateFaces: (
              input: HTMLVideoElement | HTMLImageElement,
              cfg?: {
                flipHorizontal?: boolean;
                staticImageMode?: boolean;
              },
            ) => Promise<Array<{ keypoints?: { x: number; y: number; name?: string }[] }>>;
          };
          const faces = await faceDet.estimateFaces(input, {
            flipHorizontal: true,
            staticImageMode: staticImage,
          });
          if (!faces.length) {
            setHud("얼굴이 보이지 않아요 — 조명과 거리를 조정해 주세요");
          } else {
            const score = smileScore(faces[0]?.keypoints);
            const smile = score != null && score >= SMILE_SCORE_THRESHOLD;
            setHud(
              smile
                ? `미소 감지 (${(score ?? 0).toFixed(2)}) — 유지해 주세요`
                : score != null
                  ? `입 형태 분석 중 (${score.toFixed(2)}) — 더 크게 웃어 보세요`
                  : "얼굴을 프레임 안에 두고 웃어 보세요",
            );
            if (smile) goodMsRef.current += dt;
            else goodMsRef.current = Math.max(0, goodMsRef.current - dt * 1.5);
          }
        }

        if (mission.verifyType === "pose" && detectorsRef.current.pose) {
          const poseDet = detectorsRef.current.pose as {
            estimatePoses: (
              input: HTMLVideoElement | HTMLImageElement,
              cfg?: { maxPoses?: number; flipHorizontal?: boolean },
            ) => Promise<SimplePose[]>;
          };
          const posesRaw = await poseDet.estimatePoses(input, {
            maxPoses: 6,
            flipHorizontal: true,
          });
          const poses = posesRaw as SimplePose[];
          const hs =
            goal === "hug"
              ? hugScore(poses)
              : goal === "hold-hands"
                ? handHoldScore(poses)
                : 0;
          const ok = hs >= 0.28;
          const people = poses.length;
          setHud(
            ok
              ? goal === "hug"
                ? "두 사람이 가까워요 — 조금만 유지해 주세요"
                : "손이 가까워요 — 유지해 주세요"
              : goal === "hug"
                ? people < 2
                  ? `사람 ${people}명 감지 — 두 명이 나오게 해 주세요`
                  : `두 사람 감지 — 조금 더 껴안듯 가까이 (신뢰 ${Math.round(hs * 100)}%)`
                : people < 2
                  ? `사람 ${people}명 감지 — 손잡기는 두 명이 필요해요`
                  : "두 사람의 손이 맞닿도록 프레임을 맞춰 주세요",
          );
          if (ok) goodMsRef.current += dt;
          else goodMsRef.current = Math.max(0, goodMsRef.current - dt * 1.2);
        }

        const p = Math.min(100, (goodMsRef.current / targetMs) * 100);
        setProgress(p);
        if (p >= 100) {
          const ok = await syncComplete();
          if (ok) return;
          goodMsRef.current = 0;
          setProgress(0);
        }
      } catch (e) {
        console.warn(e);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    goodMsRef.current = 0;
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [
    mission,
    needVideo,
    modelsReady,
    cameraFramesReady,
    visualInput,
    completedIds,
    syncComplete,
  ]);

  useEffect(() => {
    if (!mission || mission.verifyType !== "voice") return;
    const Ctor = window.webkitSpeechRecognition ?? window.SpeechRecognition;
    if (!Ctor) {
      setPermissionError("이 브라우저는 음성 인식을 지원하지 않습니다.");
      setHud("Chrome/Edge 사용을 권장합니다.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    setHud("마이크로 한마디 해 보세요.");

    rec.onresult = (ev) => {
      let text = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        text += ev.results[i][0].transcript;
      }
      setTranscript(text.trim());
      const hit = VOICE_KEYWORDS.some((k) => text.includes(k));
      if (hit) {
        setProgress(100);
        void (async () => {
          const ok = await syncComplete();
          if (!ok) setProgress(0);
        })();
        rec.stop();
      }
    };
    rec.onerror = () => {
      setHud("음성 인식 오류 — 권한·마이크를 확인해 주세요.");
    };

    try {
      rec.start();
    } catch {
      setHud("음성 인식을 시작할 수 없습니다.");
    }
    return () => {
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, [mission, syncComplete]);

  const checkLocation = useCallback(() => {
    if (!mission?.geo) return;
    setHud("위치를 확인하는 중…");
    if (!navigator.geolocation) {
      setGeoInfo("이 환경에서는 위치를 사용할 수 없습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = haversineM(
          pos.coords.latitude,
          pos.coords.longitude,
          mission.geo!.lat,
          mission.geo!.lng,
        );
        setGeoInfo(
          `${mission.geo!.label}까지 약 ${Math.round(d)}m (허용 ${mission.geo!.radiusM}m)`,
        );
        if (d <= mission.geo!.radiusM) {
          setProgress(100);
          void (async () => {
            const ok = await syncComplete();
            if (ok) setHud("지역 미션 인증 완료!");
            else setProgress(0);
          })();
        } else {
          setHud("아직 허용 반경 밖이에요. 조금 더 가까이 이동해 주세요.");
        }
      },
      () => {
        setGeoInfo("위치 권한이 거절되었거나 측정에 실패했습니다.");
        setHud("위치 권한을 허용한 뒤 다시 시도해 주세요.");
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }, [mission, syncComplete]);

  useEffect(() => {
    if (!mission) return;
    if (completedIds.includes(mission.id)) {
      setProgress(100);
      finishedRef.current = true;
    }
  }, [mission, completedIds]);

  const done = mission
    ? completedIds.includes(mission.id) || progress >= 100
    : false;

  return {
    videoRef,
    imageRef,
    visualInput,
    hud,
    progress,
    permissionError,
    transcript,
    geoInfo,
    modelsReady,
    needVideo: !!needVideo,
    canOfferNativeCamera:
      !!needVideo && streamFailed && Capacitor.isNativePlatform(),
    takeNativePhoto,
    retakeNativePhoto,
    checkLocation,
    done,
  };
}
