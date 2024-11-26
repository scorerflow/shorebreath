// Get references to DOM elements
const instruction = document.getElementById("instruction");
const circle = document.getElementById("circle"); // Circle element
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const techniqueDropdown = document.getElementById("technique");
const audioToggle = document.getElementById("audio-toggle"); // Mute/unmute toggle

// Load audio files
const audioCues = {
  inhale: new Audio("audio/inhale.mp3"),
  exhale: new Audio("audio/exhale.mp3"),
  hold: new Audio("audio/hold.mp3"),
};

// Preload audio files
Object.values(audioCues).forEach((audio) => {
  audio.load();
});

// Mute/Unmute handling
audioToggle.addEventListener("change", () => {
  const muted = !audioToggle.checked;
  Object.values(audioCues).forEach((audio) => {
    audio.muted = muted;
  });
});

// Function to play audio
function playAudio(audio) {
  if (!audioToggle.checked) return; // Skip if audio is disabled
  audio.currentTime = 0; // Reset playback position
  audio.play();
}

// Define preset breathing techniques
const techniques = {
  box: [4000, 4000, 4000, 4000], // Box Breathing
  478: [4000, 7000, 8000], // 4-7-8 Breathing
  resonant: [6000, 6000], // Resonant Breathing
  wimHof: "wimHof", // Wim Hof Breathing
  "2to1": [4000, 8000], // 2:1 Ratio Breathing
};

let phaseDurations = techniques["box"]; // Default technique
let isBreathing = false; // Track if the timer is running
let currentPhase = 0; // Track the current phase index
let activeTimer = null; // Store the current active timeout/interval

// Function to start the breathing timer
function startBreathing() {
  if (techniqueDropdown.value === "wimHof") {
    performWimHofBreathing();
    return;
  }

  isBreathing = true; // Set breathing to active
  startButton.disabled = true;
  stopButton.disabled = false;

  // Begin the breathing cycle
  runPhase();
}

// Function to run a single breathing phase
function runPhase() {
  if (!isBreathing) return; // Stop if breathing is inactive

  // Update the instruction text and start animation for the current phase
  updatePhaseText(currentPhase);
  playAudioCue(currentPhase);
  syncCircleAnimation(phaseDurations[currentPhase]);

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
  clearTimeout(activeTimer); // Clear any running timer
  isBreathing = false; // Set breathing to inactive
  currentPhase = 0; // Reset the phase to the beginning

  instruction.textContent = "Press Start to begin.";
  resetCircleAnimation();
  startButton.disabled = false;
  stopButton.disabled = true;
}

// Function to update the instruction text dynamically
function updatePhaseText(phase) {
  if (phaseDurations.length === 4) {
    instruction.textContent = ["Inhale...", "Hold...", "Exhale...", "Hold..."][
      phase
    ];
  } else if (phaseDurations.length === 3) {
    instruction.textContent = ["Inhale...", "Hold...", "Exhale..."][phase];
  } else if (phaseDurations.length === 2) {
    instruction.textContent = phase === 0 ? "Inhale..." : "Exhale...";
  }
}

// Function to play the correct audio cue
function playAudioCue(phase) {
  if (phaseDurations.length === 4) {
    playAudio(
      [audioCues.inhale, audioCues.hold, audioCues.exhale, audioCues.hold][
        phase
      ]
    );
  } else if (phaseDurations.length === 3) {
    playAudio([audioCues.inhale, audioCues.hold, audioCues.exhale][phase]);
  } else if (phaseDurations.length === 2) {
    playAudio(phase === 0 ? audioCues.inhale : audioCues.exhale);
  }
}

// Function to sync the circle animation with the timer
function syncCircleAnimation(duration) {
  if (!isBreathing) {
    resetCircleAnimation(); // Ensure no animation if timer is not running
    return;
  }

  if (
    instruction.textContent.includes("Inhale") ||
    instruction.textContent.includes("Exhale")
  ) {
    circle.style.transition = `transform ${duration / 1000}s ease-in-out`;
    circle.style.transform = instruction.textContent.includes("Inhale")
      ? "scale(1.5)" // Expand on Inhale
      : "scale(1)"; // Contract on Exhale
  } else {
    circle.style.transition = ""; // No animation during Hold
  }
}

// Function to reset the circle animation
function resetCircleAnimation() {
  circle.style.transition = "none"; // Ensure no lingering transitions
  circle.style.transform = "scale(1)"; // Reset to contracted state
}

// Function to perform Wim Hof Breathing
function performWimHofBreathing() {
  let rapidBreaths = 30;
  let isInhale = true;

  const rapidBreathInterval = setInterval(() => {
    if (!isBreathing) {
      clearInterval(rapidBreathInterval);
      resetCircleAnimation();
      return;
    }

    instruction.textContent = isInhale ? "Inhale (2s)..." : "Exhale (2s)...";
    syncCircleAnimation(2000); // 2 seconds for Wim Hof breathing
    if (isInhale) playAudio(audioCues.inhale);
    else playAudio(audioCues.exhale);
    isInhale = !isInhale;

    rapidBreaths--;

    if (rapidBreaths === 0) {
      clearInterval(rapidBreathInterval);
      if (isBreathing) {
        instruction.textContent = "Hold Breath...";
        playAudio(audioCues.hold);
        resetCircleAnimation(); // Stop animation during Hold
        activeTimer = setTimeout(() => {
          instruction.textContent = "Resume Breathing.";
          stopBreathing();
        }, 15000); // 15-second hold
      }
    }
  }, 2000); // 2-second intervals for inhale and exhale

  isBreathing = true;
  startButton.disabled = true;
  stopButton.disabled = false;
}

// Listen for dropdown changes to reset the timer
techniqueDropdown.addEventListener("change", () => {
  stopBreathing(); // Stop any running timers
  const selectedTechnique = techniqueDropdown.value;

  if (selectedTechnique === "wimHof") {
    instruction.textContent =
      "Wim Hof: 30 rapid breaths (2s In/Out), then Hold.";
    phaseDurations = []; // Wim Hof has its own logic
  } else {
    phaseDurations = techniques[selectedTechnique];
    instruction.textContent = "Press Start to begin.";
    resetCircleAnimation();
  }
});

// Attach event listeners to Start and Stop buttons
startButton.addEventListener("click", startBreathing);
stopButton.addEventListener("click", stopBreathing);

// Disable Stop button initially
stopButton.disabled = true;
