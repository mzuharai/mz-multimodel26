// ========================================================
// CONFIGURATION: Replace with your Teachable Machine Links
// ========================================================
const imageModelURL = "https://teachablemachine.withgoogle.com/models/YOUR_IMAGE_MODEL_ID/"; //
const audioModelURL = "https://teachablemachine.withgoogle.com/models/YOUR_AUDIO_MODEL_ID/"; //

let video;
let imageClassifier;
let audioClassifier;

let imageLabel = "Analyzing Image...";
let imageConfidence = 0.0;

let audioLabel = "Listening...";
let audioConfidence = 0.0;

// Keywords you set in Teachable Machine classes
const DISTRESS_IMAGE_CLASS = "Distress"; // Change to your visual class name
const DISTRESS_AUDIO_CLASS = "Help";     // Change to your audio class name

function setup() {
  createCanvas(640, 520);

  // Initialize Webcam
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  // Load Models
  loadModels();
}

async function loadModels() {
  // Load Image Model
  imageClassifier = await tmImage.load(
    imageModelURL + "model.json",
    imageModelURL + "metadata.json"
  );

  // Load Audio Model
  const options = { probabilityThreshold: 0.75 };
  audioClassifier = speechCommands.create(
    "BROWSER_FFT",
    undefined,
    audioModelURL + "model.json",
    audioModelURL + "metadata.json"
  );

  await audioClassifier.ensureModelLoaded();
  
  // Start Audio Listening
  audioClassifier.listen(result => {
    let scores = result.scores;
    let labels = audioClassifier.wordLabels();
    let maxScore = 0;
    let bestLabel = "";

    for (let i = 0; i < labels.length; i++) {
      if (scores[i] > maxScore) {
        maxScore = scores[i];
        bestLabel = labels[i];
      }
    }
    audioLabel = bestLabel;
    audioConfidence = maxScore;
  }, options);

  // Start Visual Prediction Loop
  classifyVideo();
  
  select('#status').html('Models Loaded & Active');
}

async function classifyVideo() {
  if (imageClassifier) {
    const predictions = await imageClassifier.predict(video.elt);
    let maxScore = 0;
    let bestLabel = "";

    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i].probability > maxScore) {
        maxScore = predictions[i].probability;
        bestLabel = predictions[i].className;
      }
    }
    imageLabel = bestLabel;
    imageConfidence = maxScore;
  }
  
  // Continuous classification loop
  requestAnimationFrame(classifyVideo);
}

function draw() {
  background(20);

  // 1. Draw Camera Feed
  image(video, 0, 0, width, 360);

  // 2. Multimodal Logic Evaluation
  let visualAlert = (imageLabel === DISTRESS_IMAGE_CLASS && imageConfidence > 0.7);
  let audioAlert = (audioLabel === DISTRESS_AUDIO_CLASS && audioConfidence > 0.7);

  let systemState = "NORMAL";
  let statusColor = color(0, 200, 100); // Green

  if (visualAlert && audioAlert) {
    systemState = "CRITICAL EMERGENCY DETECTED!";
    statusColor = color(255, 0, 50); // Red
  } else if (visualAlert || audioAlert) {
    systemState = "WARNING: UNVERIFIED ANOMALY";
    statusColor = color(255, 180, 0); // Amber
  }

  // 3. Draw Overlay Panel
  fill(30);
  noStroke();
  rect(0, 360, width, 160);

  // Display System State Banner
  fill(statusColor);
  rect(0, 360, width, 35);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(18);
  textStyle(BOLD);
  text(`SYSTEM STATUS: ${systemState}`, width / 2, 377);

  // Display Sensor Feeds Info
  textAlign(LEFT, TOP);
  textSize(14);
  textStyle(NORMAL);
  fill(220);

  // Visual Feed Info
  text(`Visual Class: ${imageLabel} (${(imageConfidence * 100).toFixed(1)}%)`, 20, 415);
  drawBar(20, 440, imageConfidence, visualAlert ? color(255, 100, 100) : color(100, 200, 255));

  // Audio Feed Info
  text(`Audio Class: ${audioLabel} (${(audioConfidence * 100).toFixed(1)}%)`, 340, 415);
  drawBar(340, 440, audioConfidence, audioAlert ? color(255, 100, 100) : color(100, 255, 150));
}

function drawBar(x, y, value, c) {
  fill(50);
  rect(x, y, 280, 15, 4);
  fill(c);
  rect(x, y, 280 * value, 15, 4);
}