const video = document.getElementById("video");
const preview = document.getElementById("preview");
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

// Replace this later with your real backend URL
const BACKEND_URL = "YOUR_BACKEND_URL_HERE";

openCamBtn.addEventListener("click", startCamera);
captureBtn.addEventListener("click", capturePhoto);
retakeBtn.addEventListener("click", retakePhoto);
scanBtn.addEventListener("click", scanNow);

async function startCamera() {
  try {
    statusText.textContent = "Opening front camera...";

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      statusText.textContent = "Camera is not supported on this browser.";
      return;
    }

    if (stream) {
      stopCamera();
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

    video.classList.remove("hidden");
    preview.classList.add("hidden");

    statusText.textContent = "Camera ready.";
  } catch (error) {
    console.error("Camera error:", error);
    statusText.textContent = "Camera could not be opened. Check permission.";
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

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  // Mirror selfie effect
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);
  ctx.restore();

  capturedImageBase64 = canvas.toDataURL("image/jpeg", 0.92);

  preview.src = capturedImageBase64;
  preview.classList.remove("hidden");
  video.classList.add("hidden");

  resultBox.classList.add("hidden");
  statusText.textContent = "Selfie captured.";
}

function retakePhoto() {
  capturedImageBase64 = "";
  preview.src = "";
  preview.classList.add("hidden");
  video.classList.remove("hidden");
  resultBox.classList.add("hidden");
  clearResults();
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

  // DEMO MODE
  // Remove this block later if real backend is ready
  if (BACKEND_URL === "YOUR_BACKEND_URL_HERE") {
    setTimeout(() => {
      const fakeData = generateFakeResult();
      showResults(fakeData);
      scanLine.classList.add("hidden");
      statusText.textContent = "Demo scan completed.";
    }, 2200);
    return;
  }

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
    showResults(data);
    statusText.textContent = "Scan completed.";
  } catch (error) {
    console.error("Scan error:", error);
    statusText.textContent = "Scan failed. Check backend connection.";
  } finally {
    scanLine.classList.add("hidden");
  }
}

function showResults(data) {
  acneVal.textContent = formatValue(data.acne);
  poresVal.textContent = formatValue(data.pores);
  wrinklesVal.textContent = formatValue(data.wrinkles);
  rednessVal.textContent = formatValue(data.redness);
  spotsVal.textContent = formatValue(data.dark_spots);
  skinAgeVal.textContent = data.skin_age ?? "-";
  summaryText.textContent = data.summary || "Scan completed.";

  resultBox.classList.remove("hidden");
}

function clearResults() {
  acneVal.textContent = "-";
  poresVal.textContent = "-";
  wrinklesVal.textContent = "-";
  rednessVal.textContent = "-";
  spotsVal.textContent = "-";
  skinAgeVal.textContent = "-";
  summaryText.textContent = "-";
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${value}`;
}

function randomScore(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFakeResult() {
  const acne = randomScore(10, 65);
  const pores = randomScore(15, 70);
  const wrinkles = randomScore(5, 45);
  const redness = randomScore(8, 50);
  const darkSpots = randomScore(6, 55);
  const skinAge = randomScore(19, 38);

  let summary = "Skin looks generally balanced.";

  if (acne >= 50) {
    summary = "Visible acne activity detected. Focus on oil control and gentle cleansing.";
  } else if (pores >= 50) {
    summary = "Noticeable pores detected. Hydration and pore-care products may help.";
  } else if (redness >= 40) {
    summary = "Some redness is visible. A soothing skincare routine may help calm the skin.";
  } else if (wrinkles >= 35) {
    summary = "Fine lines are slightly visible. Hydration and barrier support may help improve texture.";
  }

  return {
    acne,
    pores,
    wrinkles,
    redness,
    dark_spots: darkSpots,
    skin_age: skinAge,
    summary
  };
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
}

window.addEventListener("beforeunload", () => {
  stopCamera();
});
