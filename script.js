// Get references to DOM elements
const instruction = document.getElementById("instruction");
const circle = document.getElementById("circle"); // Circle element
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
    rain: "audio/rain.mp3",
    river: "audio/river.mp3",
    fire: "audio/fire.mp3",
  },
  techniques: {
    box: [4000, 4000, 4000, 4000], // Box Breathing
    478: [4000, 7000, 8000], // 4-7-8 Breathing
    resonant: [6000, 6000], // Resonant Breathing
    "2to1": [4000, 8000], // 2:1 Ratio Breathing
  },
  phaseLabels: {
    2: ["Inhale...", "Exhale..."],
    3: ["Inhale...", "Hold...", "Exhale..."],
    4: ["Inhale...", "Hold...", "Exhale...", "Hold..."],
  },
};

// Initialize audio objects dynamically from appConfig
const cueSounds = {};
Object.entries(appConfig.audioFiles).forEach(([key, path]) => {
  cueSounds[key] = new Audio(path);
});

// Initialize background sound elements
const backgroundSounds = {};
Object.entries(appConfig.backgroundSounds).forEach(([key, path]) => {
  backgroundSounds[key] = new Audio(path);
  backgroundSounds[key].loop = true; // Ensure seamless looping
});

// Dynamically populate background sound dropdown
function populateBackgroundSoundDropdown() {
  backgroundSoundDropdown.innerHTML = ""; // Clear existing options to avoid duplicates

  Object.keys(appConfig.backgroundSounds).forEach((key) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key.charAt(0).toUpperCase() + key.slice(1); // Capitalize first letter
    backgroundSoundDropdown.appendChild(option);
  });
}

// Populate dropdown on page load
populateBackgroundSoundDropdown();

// Volume control for cue sounds
cueVolumeSlider.addEventListener("input", () => {
  const volume = parseFloat(cueVolumeSlider.value);
  Object.values(cueSounds).forEach((sound) => {
    sound.volume = volume;
  });
});

// Volume control for background sounds
backgroundVolumeSlider.addEventListener("input", () => {
  const volume = parseFloat(backgroundVolumeSlider.value);
  Object.values(backgroundSounds).forEach((sound) => {
    sound.volume = volume;
  });
});

// Handle cue mute toggle
cueToggle.addEventListener("change", () => {
  const isMuted = !cueToggle.checked;
  Object.values(cueSounds).forEach((sound) => {
    sound.muted = isMuted;
  });
});

let phaseDurations = appConfig.techniques[appConfig.defaultTechnique]; // Default technique
let isBreathing = false; // Track if the timer is running
let currentPhase = 0; // Track the current phase index
let activeTimer = null; // Store the current active timeout/interval

// Function to reset breathing state
function resetBreathingState() {
  clearTimeout(activeTimer); // Clear any running timer
  isBreathing = false; // Set breathing to inactive
  currentPhase = 0; // Reset phase
  Object.values(cueSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0; // Reset playback position
  });
  instruction.textContent = "Press Start to begin.";
  resetCircleAnimation();
  startButton.disabled = false;
  stopButton.disabled = true;
}

// Function to play selected background sound
function playBackgroundSound() {
  const selectedSoundKey = backgroundSoundDropdown.value;
  Object.values(backgroundSounds).forEach((sound) => {
    sound.pause(); // Pause all sounds first
  });
  if (selectedSoundKey && backgroundSounds[selectedSoundKey]) {
    backgroundSounds[selectedSoundKey].play();
  }
}

// Stop all background sounds
function stopBackgroundSounds() {
  Object.values(backgroundSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0; // Reset to the start
  });
}

// Update background sound on dropdown change
backgroundSoundDropdown.addEventListener("change", playBackgroundSound);

// Handle dropdown technique change
techniqueDropdown.addEventListener("change", () => {
  resetBreathingState(); // Reset state on technique switch
  const selectedTechnique = techniqueDropdown.value;
  phaseDurations =
    appConfig.techniques[selectedTechnique] ||
    appConfig.techniques[appConfig.defaultTechnique]; // Default to Box if undefined
});

// Function to play the correct cue sound
function playCueSound(phase) {
  // Stop all cue sounds
  Object.values(cueSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0; // Reset playback position
  });

  // Play the corresponding sound for the current phase
  if (!cueToggle.checked) return; // Skip if cue sounds are muted

  const isExhalePhase =
    (phaseDurations.length === 2 && phase === 1) ||
    (phaseDurations.length > 2 && phase === 2);
  if (phase === 0) {
    cueSounds.inhale.play(); // Play "Inhale" sound
  } else if (isExhalePhase) {
    cueSounds.exhale.play(); // Play "Exhale" sound
  }
}

// Function to start the breathing timer
function startBreathing() {
  resetBreathingState(); // Reset any lingering states before starting
  isBreathing = true;
  startButton.disabled = true;
  stopButton.disabled = false;

  playBackgroundSound(); // Start background sound
  runPhase();
}

// Function to run a single breathing phase
function runPhase() {
  if (!isBreathing) return; // Stop if breathing is inactive

  // Update the instruction text and start animation for the current phase
  updatePhaseText(currentPhase);
  playCueSound(currentPhase);
  syncCircleAnimation(currentPhase, phaseDurations[currentPhase]);

  // Set a timeout for the current phase duration
  activeTimer = setTimeout(() => {
    // Move to the next phase
    currentPhase = (currentPhase + 1) % phaseDurations.length;

    // Run the next phase
    runPhase();
  }, phaseDurations[currentPhase]);
}

// Function to stop the breathing timer
function stopBreathing() {
  resetBreathingState();
  stopBackgroundSounds(); // Stop background sound
}

// Function to update the instruction text dynamically
function updatePhaseText(phase) {
  const labels = appConfig.phaseLabels[phaseDurations.length];
  instruction.textContent = labels[phase] || "Exhale...";
}

// Function to sync the circle animation with the timer
function syncCircleAnimation(phase, duration) {
  if (!isBreathing) {
    resetCircleAnimation(); // Ensure no animation if timer is not running
    return;
  }

  // Adjust animation for phases
  const isExhalePhase =
    (phaseDurations.length === 2 && phase === 1) ||
    (phaseDurations.length > 2 && phase === 2);
  circle.style.transition = `transform ${duration / 1000}s ease-in-out`;

  if (phase === 0) {
    circle.style.transform = "scale(1.5)"; // Expand on Inhale
  } else if (isExhalePhase) {
    circle.style.transform = "scale(1)"; // Contract on Exhale
  }
}

// Function to reset the circle animation
function resetCircleAnimation() {
  circle.style.transition = "none"; // Ensure no lingering transitions
  circle.style.transform = "scale(1)"; // Reset to contracted state
}

// Attach event listeners to Start and Stop buttons
startButton.addEventListener("click", startBreathing);
stopButton.addEventListener("click", stopBreathing);

// Disable Stop button initially
stopButton.disabled = true;
