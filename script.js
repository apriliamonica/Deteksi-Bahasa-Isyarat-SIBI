const video = document.getElementById('videoElement');
const canvas = document.getElementById('canvas');
const resultDisplay = document.getElementById('result');
const accuracyDisplay = document.getElementById('accuracy');

const toggleDetectionBtn = document.getElementById('toggleDetectionBtn');
const toggleLabelText = document.getElementById('toggleLabelText');
const toggleSoundBtn = document.getElementById('toggleSoundBtn');

let model = null;
let detectionInterval = null;
let isSoundEnabled = false;
let isDetecting = false;

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
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

toggleSoundBtn.addEventListener('click', () => {
  isSoundEnabled = !isSoundEnabled;
  toggleSoundBtn.querySelector('.btn-text').textContent = isSoundEnabled ? 'Nonaktifkan Suara' : 'Aktifkan Suara';
  toggleSoundBtn.querySelector('.btn-icon').textContent = isSoundEnabled ? '🔇' : '🔊';
});

toggleDetectionBtn.addEventListener('change', toggleDetection);

window.onload = async () => {
  await startCamera();
  await loadModel();
  toggleLabelText.textContent = 'OFF';
};
