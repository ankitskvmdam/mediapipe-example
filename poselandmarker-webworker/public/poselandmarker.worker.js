importScripts("/mediapipe.js");

let poseLandmarker = null;
/**
 * This function does the following:
 * 1. Create MediaPipe PoseLandmarker detector using model path and assign it global poseLandmarker.
 * 2. Set running mode to VIDEO.
 */
async function initializeMediapipePoseLandmarker() {
  const vision = await $mediapipe.FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
  );

  poseLandmarker = await $mediapipe.PoseLandmarker.createFromModelPath(
    vision,
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  );

  await poseLandmarker.setOptions({
    runningMode: "VIDEO",
  });
}

/**
 * Detecting the pose.
 */
async function detectPose(bitmapImage) {
  if (!poseLandmarker) {
    throw new Error("PoseLandmarker is not initialized");
  }

  console.log("Worker data received", bitmapImage);

  const timestamp = performance.now();
  return new Promise((resolve) => {
    poseLandmarker.detectForVideo(bitmapImage, timestamp, (result) => {
      resolve(result);
    });
  });
}

let isProcessing = false;

self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (isProcessing) {
    return;
  }

  if (type === "init") {
    isProcessing = true;
    await initializeMediapipePoseLandmarker();
    self.postMessage({
      type: "init",
      payload: {
        isSuccess: true,
      },
    });
    isProcessing = false;
    return;
  }

  if (type === "detect" && !isProcessing) {
    isProcessing = true;

    const result = await detectPose(payload.image);
    self.postMessage({ type: "detect", payload: { result } });
    isProcessing = false;
  }
};
