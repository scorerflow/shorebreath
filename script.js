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
function updateCueVolume() {
  const volume = parseFloat(cueVolumeSlider.value);
  Object.values(cueSounds).forEach((sound) => {
    sound.volume = volume;
  });
}
cueVolumeSlider.addEventListener("input", updateCueVolume);

// Volume control for background sounds
function updateBackgroundVolume() {
  const volume = parseFloat(backgroundVolumeSlider.value);
  Object.values(backgroundSounds).forEach((sound) => {
    sound.volume = volume;
  });
}
backgroundVolumeSlider.addEventListener("input", updateBackgroundVolume);

// Handle cue mute toggle
function toggleCueSounds() {
  const isMuted = !cueToggle.checked;
  Object.values(cueSounds).forEach((sound) => {
    sound.muted = isMuted;
  });
}
cueToggle.addEventListener("change", toggleCueSounds);

let phaseDurations = appConfig.techniques[appConfig.defaultTechnique]; // Default technique
let isBreathing = false; // Track if the timer is running
let currentPhase = 0; // Track the current phase index
let activeTimer = null; // Store the current active timeout/interval

// Function to manage background sound playback
function manageBackgroundSound(play = false) {
  const selectedSoundKey = backgroundSoundDropdown.value;
  Object.values(backgroundSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0; // Reset sound
  });
  if (play && selectedSoundKey && backgroundSounds[selectedSoundKey]) {
    backgroundSounds[selectedSoundKey].play();
  }
}

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

// Handle dropdown technique change
techniqueDropdown.addEventListener("change", () => {
  resetBreathingState(); // Reset state on technique switch
  const selectedTechnique = techniqueDropdown.value;
  phaseDurations =
    appConfig.techniques[selectedTechnique] ||
    appConfig.techniques[appConfig.defaultTechnique]; // Default to Box if undefined
});

// Optimized function to play the correct cue sound
function playCueSound(phase) {
  const labels = appConfig.phaseLabels[phaseDurations.length];
  const phaseLabel = labels[phase];

  // Dynamically map phases to sounds
  const phaseToSound = {
    "Inhale...": cueSounds.inhale,
    "Exhale...": cueSounds.exhale,
  };

  // Pause all sounds first
  Object.values(cueSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });

  // Play the sound if the phase has a mapped sound
  if (phaseLabel in phaseToSound) {
    phaseToSound[phaseLabel].play();
  }
}

// Function to start the breathing timer
function startBreathing() {
  resetBreathingState(); // Reset any lingering states before starting
  isBreathing = true;
  startButton.disabled = true;
  stopButton.disabled = false;

  manageBackgroundSound(true); // Start background sound
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
  manageBackgroundSound(false); // Stop background sound
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

  // Determine the current phase label
  const labels = appConfig.phaseLabels[phaseDurations.length];
  const phaseLabel = labels[phase];

  // Map phase labels to scale values
  const phaseToScale = {
    "Inhale...": 1.5, // Expand on inhale
    "Exhale...": 1, // Contract on exhale
    "Hold...": circle.style.transform, // Maintain size on hold
  };

  // Set the transition and scale dynamically
  circle.style.transition = `transform ${duration / 1000}s ease-in-out`;
  if (phaseLabel in phaseToScale) {
    circle.style.transform = `scale(${phaseToScale[phaseLabel]})`;
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

// Handle dropdown change for background sound
backgroundSoundDropdown.addEventListener("change", () => {
  if (isBreathing) {
    manageBackgroundSound(true); // Play the new sound if session is active
  }
});

// Disable Stop button initially
stopButton.disabled = true;
