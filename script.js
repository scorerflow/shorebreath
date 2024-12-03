// Get references to DOM elements
const bauble = document.getElementById("bauble");
const toggleButton = document.getElementById("toggle-button");
const toggleIcon = document.getElementById("toggle-icon");
const techniqueButtons = document.querySelectorAll(".technique-btn");
const cueToggleButton = document.getElementById("cue-toggle-button");
const circleText = document.getElementById("circle-text");
const backgroundSoundButtons = document.querySelectorAll(
  ".background-sound-button"
);

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
  rain: "images/snow.PNG",
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

function enableAudioPlaybackOnMobile() {
  const enablePlayback = () => {
    // Play only the sound for the first phase (Inhale)
    const initialPhaseSound = cueSounds.inhale;
    if (initialPhaseSound) {
      initialPhaseSound.play().catch(() => initialPhaseSound.pause());
    }

    // Preload background sounds without playing them
    Object.values(backgroundSounds).forEach((sound) => {
      sound.load();
    });

    // Remove event listeners after initialization
    document.body.removeEventListener("click", enablePlayback);
    document.body.removeEventListener("touchstart", enablePlayback);
  };

  document.body.addEventListener("click", enablePlayback);
  document.body.addEventListener("touchstart", enablePlayback);
}

function manageBackgroundSound(play = false) {
  const activeButton = document.querySelector(
    ".background-sound-button.active"
  );

  if (!activeButton) return;

  const selectedSound = activeButton.getAttribute("data-sound");

  // Stop all background sounds
  Object.values(backgroundSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0; // Reset to the beginning
  });

  // Play the selected background sound only if breathing is active
  if (play && isBreathing && backgroundSounds[selectedSound]) {
    backgroundSounds[selectedSound].play().catch((err) => {
      console.warn(`Error playing background sound: ${err}`);
    });
  }
}

const cueSounds = preloadAudio(appConfig.audioFiles);
const backgroundSounds = preloadAudio(appConfig.backgroundSounds);

// Function to reset the active technique button
function resetActiveButton() {
  techniqueButtons.forEach((button) => button.classList.remove("active"));
}

// Attach event listeners to breathing technique buttons
if (techniqueButtons.length > 0) {
  techniqueButtons.forEach((button) => {
    button.addEventListener("click", () => {
      console.log(`Technique button clicked: ${button.dataset.technique}`);

      // Reset active class
      techniqueButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to the clicked button
      button.classList.add("active");

      // Update phase durations based on the technique
      const selectedTechnique = button.dataset.technique;
      phaseDurations =
        appConfig.techniques[selectedTechnique] ||
        appConfig.techniques[appConfig.defaultTechnique];

      // Reset breathing session
      resetBreathingState();
    });
  });
} else {
  console.warn("No technique buttons found.");
}

// Reset active background sound button
function resetActiveBackgroundButton() {
  backgroundSoundButtons.forEach((button) => button.classList.remove("active"));
}

// Handle background sound button clicks
backgroundSoundButtons.forEach((button) => {
  button.addEventListener("click", () => {
    resetActiveBackgroundButton();
    button.classList.add("active"); // Highlight the clicked button

    const selectedSound = button.getAttribute("data-sound");
    updateBackgroundSound(selectedSound); // Update background image

    // Ensure sound doesn't play unless the session is active
    if (isBreathing) {
      manageBackgroundSound(true); // Play the sound only if breathing is active
    } else {
      manageBackgroundSound(false); // Stop all sounds if breathing is inactive
    }
  });
});

// Function to update and play the selected background sound
function updateBackgroundSound(selectedSound) {
  // Stop all background sounds
  Object.values(backgroundSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0; // Reset playback position
  });

  // Update background image
  if (backgroundMapping[selectedSound]) {
    document.body.style.backgroundImage = `url(${backgroundMapping[selectedSound]})`;
  }
}

// Set default background sound on load
function setDefaultBackgroundSound() {
  const defaultSoundButton = document.querySelector(
    '.background-sound-button[data-sound="rain"]'
  );
  if (defaultSoundButton) {
    defaultSoundButton.classList.add("active");
    updateBackgroundSound("rain");
  }
}

// Sync bauble animation with breathing phase
function syncCircleAnimation(phase, duration) {
  const labels = appConfig.phaseLabels[phaseDurations.length];
  const phaseLabel = labels[phase];

  const scaleValues = {
    Inhale: 1.5, // Expand
    Exhale: 1, // Contract
  };

  if (phaseLabel === "Hold") {
    bauble.style.transition = "none";
    circleText.style.transition = "none";
    return;
  }

  bauble.style.transition = `transform ${duration / 1000}s ease-in-out`;
  bauble.style.transform = `scale(${scaleValues[phaseLabel] || 1})`;

  circleText.style.transition = `transform ${duration / 1000}s ease-in-out`;
  circleText.style.transform = `translate(-50%, -50%) scale(${
    scaleValues[phaseLabel] || 1
  })`;
}

// Reset bauble animation
function resetCircleAnimation() {
  bauble.style.transition = "none";
  bauble.style.transform = "scale(1)";
  circleText.style.transition = "none";
  circleText.style.transform = "translate(-50%, -50%) scale(1)";
  circleText.textContent = "Inhale"; // Reset to default text
}

// Reset breathing state
function resetBreathingState() {
  clearTimeout(activeTimer);
  isBreathing = false;
  toggleIcon.classList.remove("fa-pause");
  toggleIcon.classList.add("fa-play");
  toggleButton.classList.remove("active");
  pauseAllSounds();
  resetCircleAnimation();
  currentPhase = 0;
}

// Pause all sounds
function pauseAllSounds() {
  Object.values(cueSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
  Object.values(backgroundSounds).forEach((sound) => {
    sound.pause();
    sound.currentTime = 0;
  });
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
    phaseToSound[phaseLabel].play().catch(() => {});
  }
}

// Run breathing phases in sequence
function runPhase() {
  if (!isBreathing) return;

  updatePhaseText(currentPhase);
  syncCircleAnimation(currentPhase, phaseDurations[currentPhase]);
  playCueSound(currentPhase);

  activeTimer = setTimeout(() => {
    currentPhase = (currentPhase + 1) % phaseDurations.length;
    runPhase();
  }, phaseDurations[currentPhase]);
}

// Update text for the current breathing phase
function updatePhaseText(phase) {
  const labels = appConfig.phaseLabels[phaseDurations.length];
  circleText.textContent = labels[phase] || "Exhale";
}

// Toggle breathing session
function toggleBreathing() {
  if (!isBreathing) {
    startBreathing();
    toggleIcon.classList.remove("fa-play");
    toggleIcon.classList.add("fa-pause");
  } else {
    resetBreathingState();
    toggleIcon.classList.remove("fa-pause");
    toggleIcon.classList.add("fa-play");
  }
}

// Start breathing session
function startBreathing() {
  resetBreathingState();
  isBreathing = true;
  toggleButton.classList.add("active");
  manageBackgroundSound(true);
  runPhase();
}

// Toggle Cue Sounds Button Logic
function toggleCueSounds() {
  const isActive = cueToggleButton.classList.contains("active");

  if (isActive) {
    cueToggleButton.classList.remove("active");
    cueToggleButton.classList.add("inactive");
    cueToggleButton.textContent = "Off";
  } else {
    cueToggleButton.classList.remove("inactive");
    cueToggleButton.classList.add("active");
    cueToggleButton.textContent = "On";
  }

  const isMuted = !cueToggleButton.classList.contains("active");
  Object.values(cueSounds).forEach((sound) => {
    sound.muted = isMuted;
  });
}

// Attach event listener to Cue Sounds button
cueToggleButton.addEventListener("click", toggleCueSounds);

// **Add the Carousel Scrolling Code Below This Section**
const carousel = document.getElementById("technique-carousel");
const carouselLeftArrow = document.getElementById("carousel-left");
const carouselRightArrow = document.getElementById("carousel-right");

carouselLeftArrow.addEventListener("click", () => {
  carousel.scrollBy({
    left: -150,
    behavior: "smooth",
  });
});

carouselRightArrow.addEventListener("click", () => {
  carousel.scrollBy({
    left: 150,
    behavior: "smooth",
  });
});

// Ensure no sounds are playing on load
function initializeApp() {
  setDefaultBackgroundSound();
  toggleIcon.classList.add("fa-play");
  pauseAllSounds();
  // Highlight the default breathing technique button
  const defaultTechniqueButton = document.querySelector(
    `.technique-btn[data-technique="${appConfig.defaultTechnique}"]`
  );
  if (defaultTechniqueButton) {
    defaultTechniqueButton.classList.add("active");
  }
}

// Attach event listeners
toggleButton.addEventListener("click", toggleBreathing);

if (isMobileDevice()) {
  enableAudioPlaybackOnMobile();
}

// Ensure proper initialization of the app
initializeApp();
