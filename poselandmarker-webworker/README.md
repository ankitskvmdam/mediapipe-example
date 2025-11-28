# PoseLandmarker WebWorker

Example implementation of MediaPipe Pose Landmarker running in a web worker.

This example uses a local copy of MediaPipe with some modifications to enable it to work in a classic web worker. The implementation is based on this article: https://ankdev.me/blog/how-to-run-mediapipe-task-vision-in-a-web-worker#running-mediapipe-in-a-web-worker

## How to Run

This project uses Vite. To run the development server:

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Open your browser and navigate to `http://localhost:3001`
