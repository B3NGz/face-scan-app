
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");
const previewWrap = document.getElementById("previewWrap");
const scanLine = document.getElementById("scanLine");
const resultBox = document.getElementById("resultBox");
const statusText = document.getElementById("statusText");

const acneVal = document.getElementById("acneVal");
const poresVal = document.getElementById("poresVal");
const wrinklesVal = document.getElementById("wrinklesVal");
const rednessVal = document.getElementById("rednessVal");
const spotsVal = document.getElementById("spotsVal");
const skinAgeVal = document.getElementById("skinAgeVal");
const summaryText = document.getElementById("summaryText");

const openCamBtn = document.getElementById("openCamBtn");
const captureBtn = document.getElementById("captureBtn");
const retakeBtn = document.getElementById("retakeBtn");
const scanBtn = document.getElementById("scanBtn");

let stream = null;
let capturedImageBase64 = "";

const BACKEND_URL = "YOUR_BACKEND_URL_HERE";

openCamBtn.addEventListener("click", startCamera);
captureBtn.addEventListener("click", capturePhoto);
retakeBtn.addEventListener("click", retakePhoto);
scanBtn.addEventListener("click", scanNow);

async function startCamera() {
  try {
    statusText.textContent = "Opening front camera...";

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 720 },
        height: { ideal: 1280 }
      },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    statusText.textContent = "Camera ready.";
  } catch (error) {
    console.error(error);
    statusText.textContent = "Camera could not be opened. Check browser permission.";
  }
}

function capturePhoto() {
  if (!stream) {
    statusText.textContent = "Open the front camera first.";
    return;
  }

  const width = video.videoWidth;
  const height = video.videoHeight;

  if (!width || !height) {
    statusText.textContent = "Camera is still loading.";
    return;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  // Mirror selfie
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);
  ctx.restore();

  capturedImageBase64 = canvas.toDataURL("image/jpeg", 0.92);
  preview.src = capturedImageBase64;
  previewWrap.classList.remove("hidden");
  resultBox.classList.add("hidden");

  statusText.textContent = "Selfie captured.";
}

function retakePhoto() {
  capturedImageBase64 = "";
  preview.src = "";
  previewWrap.classList.add("hidden");
  resultBox.classList.add("hidden");
  statusText.textContent = "Retake ready.";
}

async function scanNow() {
  const name = document.getElementById("name").value.trim();

  if (!capturedImageBase64) {
    statusText.textContent = "Take a photo first.";
    return;
  }

  scanLine.classList.remove("hidden");
  resultBox.classList.add("hidden");
  statusText.textContent = "Scanning face...";

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        imageBase64: capturedImageBase64
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // expected response shape from your backend
    // {
    //   acne: 31,
    //   pores: 47,
    //   wrinkles: 15,
    //   redness: 22,
    //   dark_spots: 18,
    //   skin_age: 27,
    //   summary: "..."
    // }

    acneVal.textContent = formatValue(data.acne);
    poresVal.textContent = formatValue(data.pores);
    wrinklesVal.textContent = formatValue(data.wrinkles);
    rednessVal.textContent = formatValue(data.redness);
    spotsVal.textContent = formatValue(data.dark_spots);
    skinAgeVal.textContent = data.skin_age ?? "-";
    summaryText.textContent = data.summary || "Scan completed.";

    resultBox.classList.remove("hidden");
    statusText.textContent = "Scan completed.";
  } catch (error) {
    console.error(error);
    statusText.textContent = "Scan failed. Check backend URL or API connection.";
  } finally {
    scanLine.classList.add("hidden");
  }
}

function formatValue(value) {
  if (value === null || value === undefined) return "-";
  return `${value}`;
}

window.addEventListener("beforeunload", () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
});
