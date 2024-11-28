// Get references to DOM elements
const instruction = document.getElementById("instruction");
const circle = document.getElementById("circle");
const toggleButton = document.getElementById("toggle-button");
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
    2: ["Inhale", "Exhale"],
    3: ["Inhale", "Hold", "Exhale"],
    4: ["Inhale", "Hold", "Exhale", "Hold"],
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

// Preload audio files with looping and default volume
function preloadAudio(audioPaths) {
  return Object.entries(audioPaths).reduce((acc, [key, path]) => {
    const audio = new Audio(path);
    audio.loop = true;
    audio.volume = 0.5; // Default volume
    acc[key] = audio;
    return acc;
  }, {});
}

const cueSounds = preloadAudio(appConfig.audioFiles);
const backgroundSounds = preloadAudio(appConfig.backgroundSounds);

// General helper to update settings for an audio group
function updateSoundSettings(slider, audioGroup, key = null) {
  const volume = parseFloat(slider.value);
  Object.entries(audioGroup).forEach(([soundKey, sound]) => {
    if (!key || soundKey === key) {
      sound.volume = volume;
    }
  });
  console.log(`Updated ${key || "all"} sounds to volume: ${volume}`);
}

// Reset circle animation
function resetCircleAnimation() {
  circle.style.transition = "none";
  circle.style.transform = "scale(1)";
}

// Reset breathing state
function resetBreathingState() {
  clearTimeout(activeTimer); // Clear active timer
  isBreathing = false;
  toggleButton.textContent = "Start"; // Update button text
  toggleButton.classList.remove("active"); // Remove active state for green color
  pauseAllSounds(); // Stop any sounds playing
  resetCircleAnimation(); // Reset circle to default state
  if (instruction) instruction.style.display = "block"; // Show instruction text again
  currentPhase = 0; // Reset breathing phase
  document.getElementById("circle-text").textContent = "Inhale"; // Reset circle text
}

// Pause all sounds
function pauseAllSounds() {
  Object.values(cueSounds).forEach((sound) => sound.pause());
  Object.values(backgroundSounds).forEach((sound) => sound.pause());
}

// Sync circle animation with breathing phase
function syncCircleAnimation(phase, duration) {
  if (!isBreathing) {
    resetCircleAnimation();
    return;
  }
  const labels = appConfig.phaseLabels[phaseDurations.length];
  const phaseLabel = labels[phase];
  const phaseToScale = {
    Inhale: 1.5,
    Exhale: 1,
    Hold: circle.style.transform,
  };
  circle.style.transition = `transform ${duration / 1000}s ease-in-out`;
  circle.style.transform = `scale(${phaseToScale[phaseLabel] || 1})`;
}

// Update text for the current breathing phase
function updatePhaseText(phase) {
  const labels = appConfig.phaseLabels[phaseDurations.length];
  const phaseText = labels[phase] || "Exhale";
  document.getElementById("circle-text").textContent = phaseText;
}

// Start breathing session
function startBreathing() {
  resetBreathingState(); // Ensure no lingering states
  isBreathing = true;
  toggleButton.textContent = "Stop"; // Update button text
  toggleButton.classList.add("active"); // Add active state for red color
  if (instruction) instruction.style.display = "none"; // Hide instruction text
  manageBackgroundSound(true);
  runPhase();
}

// Run breathing phases in sequence
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

// Play cue sound for the current phase
function playCueSound(phase) {
  const labels = appConfig.phaseLabels[phaseDurations.length];
  const phaseLabel = labels[phase];
  const phaseToSound = {
    Inhale: cueSounds.inhale,
    Exhale: cueSounds.exhale,
  };
  Object.values(cueSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
  if (phaseToSound[phaseLabel]) {
    phaseToSound[phaseLabel]
      .play()
      .catch((err) => console.warn(`Cue sound error: ${err}`));
  }
}

// Manage background sound playback
function manageBackgroundSound(play = false) {
  const selectedSoundKey = backgroundSoundDropdown.value;
  Object.values(backgroundSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
  if (play && backgroundSounds[selectedSoundKey]) {
    backgroundSounds[selectedSoundKey].play().catch((err) => console.warn(err));
  }
}

// Toggle breathing session
function toggleBreathing() {
  if (!isBreathing) {
    startBreathing();
  } else {
    resetBreathingState();
  }
}

// Populate dropdowns and set defaults
function populateBackgroundSoundDropdown() {
  backgroundSoundDropdown.innerHTML = "";
  Object.keys(appConfig.backgroundSounds).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    backgroundSoundDropdown.appendChild(option);
  });
}

// Add event listeners
function setupEventListeners() {
  backgroundSoundDropdown.addEventListener("change", () => {
    if (isBreathing) manageBackgroundSound(true);
    document.body.style.backgroundImage = `url(${
      backgroundMapping[backgroundSoundDropdown.value]
    })`;
  });

  techniqueDropdown.addEventListener("change", () => {
    resetBreathingState();
    phaseDurations =
      appConfig.techniques[techniqueDropdown.value] ||
      appConfig.techniques[appConfig.defaultTechnique];
  });

  cueVolumeSlider.addEventListener("input", () =>
    updateSoundSettings(cueVolumeSlider, cueSounds)
  );
  backgroundVolumeSlider.addEventListener("input", () =>
    updateSoundSettings(backgroundVolumeSlider, backgroundSounds)
  );

  cueToggle.addEventListener("change", () => {
    const isMuted = !cueToggle.checked;
    Object.values(cueSounds).forEach((sound) => (sound.muted = isMuted));
    console.log("Cue sounds muted:", isMuted);
  });

  toggleButton.addEventListener("click", toggleBreathing); // Add toggle button listener
}

// Initialize the app
function initializeApp() {
  populateBackgroundSoundDropdown();
  document.body.style.backgroundImage = `url(${
    backgroundMapping[backgroundSoundDropdown.value]
  })`;
  setupEventListeners();
  Object.values(cueSounds).forEach(
    (sound) => (sound.muted = !cueToggle.checked)
  );
  toggleButton.textContent = "Start"; // Initialize button state
  if (instruction) instruction.style.display = "block"; // Ensure instruction is visible on load
}

initializeApp();
