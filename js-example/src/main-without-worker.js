import * as $mediapipe from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/+esm";

import {
  setupAndEmbedVideoElementToDocument,
  requestCameraAndSetStreamToVideoElement,
  setupDrawingTools,
  addButtons,
  drawLandmarks,
  videoElement,
} from "./setup.js";

let poseLandmarker = null;
let shouldRunLoop = false;

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
 * Detect the pose.
 */
async function detectPose(imageOrVideoElement) {
  if (!poseLandmarker) {
    throw new Error("PoseLandmarker is not initialized");
  }

  const timestamp = performance.now();
  return new Promise((resolve) => {
    poseLandmarker.detectForVideo(imageOrVideoElement, timestamp, (result) => {
      resolve(result);
    });
  });
}

async function loop() {
  const result = await detectPose(videoElement);
  drawLandmarks(result);

  if (shouldRunLoop) {
    requestAnimationFrame(loop);
  }
}

function stopDetection() {
  shouldRunLoop = false;
}

function startDetection() {
  shouldRunLoop = true;
  loop();
}

async function init() {
  const loadingParagraph = document.createElement("p");
  loadingParagraph.textContent = "Loading...";
  document.body.appendChild(loadingParagraph);

  try {
    setupAndEmbedVideoElementToDocument();
    await requestCameraAndSetStreamToVideoElement();
    await initializeMediapipePoseLandmarker();
    setupDrawingTools();
    loadingParagraph.remove();
    addButtons(startDetection, stopDetection);
  } catch (error) {
    loadingParagraph.textContent =
      "Failed to initialize, see browser's console for details";
    console.error(error);
  }
}

init();
