import * as $mediapipe from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/+esm";
let drawingUtils = null;
let videoElement = null;
let canvas = null;
let ctx = null;

/**
 * A helper function to create video element
 * and embed it to document.
 */
function setupAndEmbedVideoElementToDocument() {
  videoElement = document.createElement("video");
  videoElement.autoplay = true;
  videoElement.muted = true;
  videoElement.playsInline = true;
  videoElement.style.width = "100%";
  videoElement.style.maxWidth = "500px";
  videoElement.style.height = "auto";
  videoElement.style.objectFit = "contain";
  document.body.appendChild(videoElement);
}

/**
 * A helper function to request for camera permission
 * and add camera stream to video element.
 */
async function requestCameraAndSetStreamToVideoElement() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
  } catch (error) {
    console.error("Error getting camera stream:", error);
    return;
  }
}

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

function drawLandmarks(result) {
  canvas.width = videoElement.clientWidth;
  canvas.height = videoElement.clientHeight;
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

function addButtons(start, stop) {
  const startButton = document.createElement("button");
  startButton.textContent = "Start";
  startButton.addEventListener("click", start);
  document.body.appendChild(startButton);

  const stopButton = document.createElement("button");
  stopButton.textContent = "Stop";
  stopButton.addEventListener("click", stop);
  document.body.appendChild(stopButton);
}

export {
  setupAndEmbedVideoElementToDocument,
  requestCameraAndSetStreamToVideoElement,
  setupDrawingTools,
  drawLandmarks,
  videoElement,
  addButtons,
};
