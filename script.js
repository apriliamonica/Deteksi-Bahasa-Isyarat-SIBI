const video = document.getElementById('videoElement');
const canvas = document.getElementById('canvas');
const resultDisplay = document.getElementById('result');
const accuracyDisplay = document.getElementById('accuracy');

const toggleDetectionBtn = document.getElementById('toggleDetectionBtn');
const toggleLabelText = document.getElementById('toggleLabelText');
const toggleSoundSwitch = document.getElementById('toggleSoundSwitch');
const toggleSoundLabelText = document.getElementById('toggleSoundLabelText');
const toggleSoundIcon = document.getElementById('toggleSoundIcon');
const toggleCameraSwitch = document.getElementById('toggleCameraSwitch');
const toggleCameraLabelText = document.getElementById('toggleCameraLabelText');

let model = null;
let detectionInterval = null;
let isSoundEnabled = false;
let isDetecting = false;
let cameraStream = null;

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = cameraStream;
  } catch (err) {
    console.error("Tidak bisa mengakses kamera:", err);
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraStream = null;
    video.srcObject = null;
    // Tampilkan layar hitam
    video.style.background = '#222';
  }
}

async function loadModel() {
  try {
    model = await tf.loadLayersModel('model/model.json');
    console.log("Model berhasil dimuat.");
  } catch (err) {
    console.error("Gagal memuat model:", err);
  }
}

async function detectSign() {
  if (!model) return;
  if (video.videoWidth === 0 || video.videoHeight === 0) return;

  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  let imageTensor = tf.browser.fromPixels(canvas)
    .resizeBilinear([64, 64])
    .toFloat()
    .div(255.0)
    .expandDims();

  const prediction = model.predict(imageTensor);
  const predictionData = await prediction.data();

  const predictedIndex = predictionData.indexOf(Math.max(...predictionData));
  const confidence = predictionData[predictedIndex];

  const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const predictedLetter = labels[predictedIndex];

  resultDisplay.textContent = predictedLetter;
  accuracyDisplay.textContent = (confidence * 100).toFixed(2) + "%";

  if (isSoundEnabled) {
    const utter = new SpeechSynthesisUtterance(predictedLetter);
    speechSynthesis.speak(utter);
  }

  imageTensor.dispose();
  prediction.dispose();
}

function toggleDetection() {
  isDetecting = toggleDetectionBtn.checked;
  toggleLabelText.textContent = isDetecting ? 'ON' : 'OFF';
  
  if (isDetecting) {
    detectionInterval = setInterval(detectSign, 1000);
  } else {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
}

function toggleSound() {
  isSoundEnabled = toggleSoundSwitch.checked;
  toggleSoundLabelText.textContent = isSoundEnabled ? 'ON' : 'OFF';
  toggleSoundIcon.textContent = isSoundEnabled ? '🔊' : '🔇';
}

function toggleCamera() {
  const isOn = toggleCameraSwitch.checked;
  toggleCameraLabelText.textContent = isOn ? 'ON' : 'OFF';
  if (isOn) {
    startCamera();
    video.style.background = '#000';
  } else {
    stopCamera();
  }
}

toggleSoundSwitch.addEventListener('change', toggleSound);
toggleDetectionBtn.addEventListener('change', toggleDetection);
toggleCameraSwitch.addEventListener('change', toggleCamera);

window.onload = async () => {
  await startCamera();
  await loadModel();
  toggleLabelText.textContent = 'OFF';
  toggleSoundLabelText.textContent = 'OFF';
  toggleSoundIcon.textContent = '🔊';
  toggleCameraLabelText.textContent = 'ON';
};
