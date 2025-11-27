import * as $mediapipe from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/+esm";

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
async function loop(worker, video) {
  try {
    const image = await createImageBitmap(video);
    const result = await new Promise((resolve) => {
      worker.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === "detect") {
          resolve(payload.result);
        }
      };

      worker.postMessage({
        type: "detect",
        payload: { image },
      });
    });
    image.close();
    drawLandmarks(result, video);
  } catch (error) {
    console.error("Error detecting pose:", error);
  }

  requestAnimationFrame(() => loop(worker, video));
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

  const worker = new Worker("./poselandmarker.worker.js");

  try {
    await new Promise((resolve, reject) => {
      worker.onmessage = (event) => {
        const { type, payload } = event.data;
        if (
          type === "init" &&
          typeof payload === "object" &&
          payload &&
          payload.isSuccess
        ) {
          console.log("MediaPipe initialized");
          resolve("MediaPipe initialized");
        } else if (
          type === "init" &&
          typeof payload === "object" &&
          payload &&
          !payload.isSuccess
        ) {
          console.error("MediaPipe initialization failed:", payload.error);
          reject("MediaPipe initialization failed");
        }
      };
      worker.postMessage({ type: "init" });
    });
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

  loop(worker, video);
}

document
  .getElementById("start")
  .addEventListener("click", initializeVideoAndStartPoseDetection);
