// Get references to DOM elements
const instruction = document.getElementById("instruction");
const circle = document.getElementById("circle");
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const techniqueDropdown = document.getElementById("technique");
const cueToggle = document.getElementById("cue-toggle");
const cueVolumeSlider = document.getElementById("cue-volume");
const backgroundSoundDropdown = document.getElementById("background-sound");
const backgroundVolumeSlider = document.getElementById("background-volume");

// Configuration object for the app
const appConfig = {
  defaultTechnique: "box",
  audioFiles: {
    inhale: "audio/bowl.mp3",
    exhale: "audio/windchime.mp3",
  },
  backgroundSounds: {
    snow: "audio/rain.mp3",
    river: "audio/river.mp3",
    fire: "audio/fire.mp3",
  },
  techniques: {
    box: [4000, 4000, 4000, 4000],
    478: [4000, 7000, 8000],
    resonant: [6000, 6000],
    "2to1": [4000, 8000],
  },
  phaseLabels: {
    2: ["Inhale...", "Exhale..."],
    3: ["Inhale...", "Hold...", "Exhale..."],
    4: ["Inhale...", "Hold...", "Exhale...", "Hold..."],
  },
};

// Map background sounds to corresponding images
const backgroundMapping = {
  snow: "images/snow.PNG",
  river: "images/river.PNG",
  fire: "images/fire.PNG",
};

// Declare global variables
let activeTimer = null;
let isBreathing = false;
let currentPhase = 0;
let phaseDurations = appConfig.techniques[appConfig.defaultTechnique];

// Preload audio files
const preloadAudio = (audioPaths) => {
  return Object.entries(audioPaths).reduce((acc, [key, path]) => {
    const audio = new Audio(path);
    acc[key] = audio;
    return acc;
  }, {});
};

// Initialize cue and background sounds
const cueSounds = preloadAudio(appConfig.audioFiles);
const backgroundSounds = preloadAudio(appConfig.backgroundSounds);

// Populate background sound dropdown
function populateBackgroundSoundDropdown() {
  backgroundSoundDropdown.innerHTML = "";
  Object.keys(appConfig.backgroundSounds).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    backgroundSoundDropdown.appendChild(option);
  });
}

// Set default background image on page load
function setDefaultBackgroundImage() {
  const defaultSoundKey =
    backgroundSoundDropdown.value || Object.keys(backgroundMapping)[0];
  const defaultImagePath = backgroundMapping[defaultSoundKey];
  if (defaultImagePath) {
    document.body.style.backgroundImage = `url(${defaultImagePath})`;
  }
}

// Manage background sound playback
function manageBackgroundSound(play = false) {
  const selectedSoundKey = backgroundSoundDropdown.value;
  Object.values(backgroundSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
  if (play && selectedSoundKey && backgroundSounds[selectedSoundKey]) {
    backgroundSounds[selectedSoundKey].play();
  }
}

// Update background image dynamically
function updateBackgroundImage() {
  const selectedSoundKey = backgroundSoundDropdown.value;
  const imagePath = backgroundMapping[selectedSoundKey];
  if (imagePath) {
    document.body.style.backgroundImage = `url(${imagePath})`;
  }
}

// Function to reset the circle animation
function resetCircleAnimation() {
  circle.style.transition = "none";
  circle.style.transform = "scale(1)";
}

// Reset breathing state
function resetBreathingState() {
  clearTimeout(activeTimer);
  isBreathing = false;
  currentPhase = 0;
  Object.values(cueSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
  instruction.textContent = "Press Start to begin.";
  resetCircleAnimation();
  startButton.disabled = false;
  stopButton.disabled = true;
}

// Sync circle animation with the timer
function syncCircleAnimation(phase, duration) {
  if (!isBreathing) {
    resetCircleAnimation();
    return;
  }
  const labels = appConfig.phaseLabels[phaseDurations.length];
  const phaseLabel = labels[phase];
  const phaseToScale = {
    "Inhale...": 1.5,
    "Exhale...": 1,
    "Hold...": circle.style.transform,
  };
  circle.style.transition = `transform ${duration / 1000}s ease-in-out`;
  if (phaseLabel in phaseToScale) {
    circle.style.transform = `scale(${phaseToScale[phaseLabel]})`;
  }
}

// Update breathing instructions dynamically
function updatePhaseText(phase) {
  const labels = appConfig.phaseLabels[phaseDurations.length];
  instruction.textContent = labels[phase] || "Exhale...";
}

// Play cue sound
function playCueSound(phase) {
  const labels = appConfig.phaseLabels[phaseDurations.length];
  const phaseLabel = labels[phase];
  const phaseToSound = {
    "Inhale...": cueSounds.inhale,
    "Exhale...": cueSounds.exhale,
  };
  Object.values(cueSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
  if (phaseLabel in phaseToSound) {
    const sound = phaseToSound[phaseLabel];
    if (sound) {
      sound.play().catch((err) => console.error("Audio playback failed:", err));
    }
  }
}

// Start breathing session
function startBreathing() {
  resetBreathingState();
  isBreathing = true;
  startButton.disabled = true;
  stopButton.disabled = false;
  manageBackgroundSound(true);
  runPhase();
}

// Run breathing phases
function runPhase() {
  if (!isBreathing) return;
  updatePhaseText(currentPhase);
  playCueSound(currentPhase);
  syncCircleAnimation(currentPhase, phaseDurations[currentPhase]);
  activeTimer = setTimeout(() => {
    currentPhase = (currentPhase + 1) % phaseDurations.length;
    runPhase();
  }, phaseDurations[currentPhase]);
}

// Stop breathing session
function stopBreathing() {
  resetBreathingState();
  manageBackgroundSound(false);
}

// Add event listeners
backgroundSoundDropdown.addEventListener("change", () => {
  if (isBreathing) manageBackgroundSound(true);
  updateBackgroundImage();
});
techniqueDropdown.addEventListener("change", () => {
  resetBreathingState();
  const selectedTechnique = techniqueDropdown.value;
  phaseDurations =
    appConfig.techniques[selectedTechnique] ||
    appConfig.techniques[appConfig.defaultTechnique];
});
cueVolumeSlider.addEventListener("input", () => {
  const volume = parseFloat(cueVolumeSlider.value);
  Object.values(cueSounds).forEach((sound) => {
    sound.volume = volume;
  });
});
backgroundVolumeSlider.addEventListener("input", () => {
  const volume = parseFloat(backgroundVolumeSlider.value);
  Object.values(backgroundSounds).forEach((sound) => {
    sound.volume = volume;
  });
});
cueToggle.addEventListener("change", () => {
  const isMuted = !cueToggle.checked;
  Object.values(cueSounds).forEach((sound) => {
    sound.muted = isMuted;
  });
});
startButton.addEventListener("click", startBreathing);
stopButton.addEventListener("click", stopBreathing);

// Disable Stop button initially
stopButton.disabled = true;

// Populate dropdowns and set defaults on page load
populateBackgroundSoundDropdown();
setDefaultBackgroundImage();
