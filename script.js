const video = document.getElementById('videoElement');
const canvas = document.getElementById('canvas');
const resultDisplay = document.getElementById('result');
const accuracyDisplay = document.getElementById('accuracy');

const toggleSoundSwitch = document.getElementById('toggleSoundSwitch');
const toggleSoundLabelText = document.getElementById('toggleSoundLabelText');
const toggleSoundIcon = document.getElementById('toggleSoundIcon');

let model = null;
let detectionInterval = null;
let isSoundEnabled = false;
let cameraStream = null;

async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = cameraStream;
  } catch (err) {
    console.error("Tidak bisa mengakses kamera:", err);
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

  // Draw frame if confidence > 0.7
  ctx.lineWidth = 6;
  if (confidence > 0.7) {
    ctx.strokeStyle = '#00e676'; // green
    ctx.shadowColor = '#00e676';
    ctx.shadowBlur = 10;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  } else {
    // Clear frame (redraw image only)
    ctx.shadowBlur = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  if (isSoundEnabled) {
    const utter = new SpeechSynthesisUtterance(predictedLetter);
    speechSynthesis.speak(utter);
  }

  imageTensor.dispose();
  prediction.dispose();
}

function toggleSound() {
  isSoundEnabled = toggleSoundSwitch.checked;
  toggleSoundLabelText.textContent = isSoundEnabled ? 'ON' : 'OFF';
  toggleSoundIcon.textContent = isSoundEnabled ? '🔊' : '🔇';
}

toggleSoundSwitch.addEventListener('change', toggleSound);

window.onload = async () => {
  await startCamera();
  await loadModel();
  toggleSoundLabelText.textContent = 'OFF';
  toggleSoundIcon.textContent = '🔊';
  // Deteksi huruf SIBI langsung berjalan otomatis
  detectionInterval = setInterval(detectSign, 1000);
};
