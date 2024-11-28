// Import the app's functions
const {
  playBackgroundSound,
  startBreathing,
  stopBreathing,
  playCueSound,
  resetBreathingState,
} = require("./script");

describe("Breathing App Functionality Tests", () => {
  let mockAudio;

  beforeEach(() => {
    // Mock the DOM structure
    document.body.innerHTML = `
        <div id="app-container">
          <h1 id="instruction">Press Start to begin.</h1>
          <div id="circle"></div>
          <button id="start"></button>
          <button id="stop"></button>
          <select id="technique">
            <option value="box">Box Breathing</option>
            <option value="478">4-7-8 Breathing</option>
            <option value="resonant">Resonant Breathing</option>
            <option value="2to1">2:1 Ratio Breathing</option>
          </select>
          <input type="checkbox" id="cue-toggle" />
          <input type="range" id="cue-volume" />
          <select id="background-sound">
            <option value="rain">Rain</option>
            <option value="river">River</option>
            <option value="fire">Fire</option>
          </select>
          <input type="range" id="background-volume" />
        </div>
      `;
  });

  beforeEach(() => {
    // Mock the Audio object
    mockAudio = {
      pause: jest.fn(),
      play: jest.fn(),
      currentTime: 0,
      volume: 1,
    };

    global.Audio = jest.fn().mockImplementation(() => mockAudio);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Default background image is set on load", () => {
    playBackgroundSound();
    expect(document.body.style.backgroundImage).toBe(
      "url('./images/snow.PNG')"
    );
  });

  test("Background image changes correctly with dropdown", () => {
    document.getElementById("background-sound").value = "river";
    playBackgroundSound();
    expect(document.body.style.backgroundImage).toBe(
      "url('./images/river.PNG')"
    );

    document.getElementById("background-sound").value = "fire";
    playBackgroundSound();
    expect(document.body.style.backgroundImage).toBe(
      "url('./images/fireplace.PNG')"
    );
  });

  test("Background sound starts and stops correctly", () => {
    startBreathing();
    expect(mockAudio.play).toHaveBeenCalled();

    stopBreathing();
    expect(mockAudio.pause).toHaveBeenCalled();
  });

  test("Cue sound plays only when toggle is enabled", () => {
    const cueToggle = document.getElementById("cue-toggle");
    cueToggle.checked = false;
    playCueSound(0);
    expect(mockAudio.play).not.toHaveBeenCalled();

    cueToggle.checked = true;
    playCueSound(0);
    expect(mockAudio.play).toHaveBeenCalled();
  });

  test("Breathing phases update correctly", () => {
    resetBreathingState();
    expect(mockAudio.pause).toHaveBeenCalled();
    expect(mockAudio.currentTime).toBe(0);
  });
});
