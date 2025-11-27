import * as $mediapipe from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/+esm";

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

/**
 * Canvas for drawing pose landmark. This will
 * be present on top of the video.
 */
let canvas;
let ctx;
let drawingUtils;

/**
 * A function to create a canvas, style it,
 * and then append it in the document.
 *
 * It will also initialize mediapipe drawing utils.
 * Visit {@link https://ai.google.dev/edge/api/mediapipe/js/tasks-vision.drawingutils} to initializeVideoAndStartPoseDetection
 * more about drawing utils.
 */
function setupDrawingTools() {
  canvas = document.createElement("canvas");

  canvas.style.position = "absolute";
  canvas.style.zIndex = 100;
  canvas.style.top = "0";
  canvas.style.left = "0";
  ctx = canvas.getContext("2d");
  document.body.appendChild(canvas);
  drawingUtils = new $mediapipe.DrawingUtils(ctx);
}

/**
 * Draw pose landmarks on the canvas.
 */
function drawLandmarks(result, video) {
  canvas.width = video.clientWidth;
  canvas.height = video.clientHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw pose landmarks.
  for (const landmark of result.landmarks) {
    drawingUtils.drawLandmarks(landmark, {
      radius: (data) =>
        $mediapipe.DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
    });
    drawingUtils.drawConnectors(
      landmark,
      $mediapipe.PoseLandmarker.POSE_CONNECTIONS,
    );
  }
}

/**
 * A function to run detect pose in loop.
 */
async function loop(video) {
  try {
    const result = await detectPose(video);
    drawLandmarks(result, video);
  } catch (error) {
    console.error("Error detecting pose:", error);
  }

  requestAnimationFrame(() => loop(video));
}

/**
 * Initialize video and start pose detection.
 */
async function initializeVideoAndStartPoseDetection() {
  let stream;
  let video = document.getElementById("video");

  // Requesting camera and passing stream to video element
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (error) {
    console.error("Error getting camera stream:", error);
    return;
  }

  try {
    await initializeMediapipePoseLandmarker();
  } catch (error) {
    console.error("Error initializing mediapipe pose landmarker:", error);
    return;
  }

  setupDrawingTools();

  if (video.readyState < 2) {
    /**
     * If video is not ready then wait for it to be ready.
     */
    await new Promise((resolve) => {
      video.addEventListener("canplay", resolve);

      // A fallback, in case we is ready but didn't fire canplay event
      setTimeout(resolve, 5_000);
    });
  }

  loop(video);
}

document
  .getElementById("start")
  .addEventListener("click", initializeVideoAndStartPoseDetection);
