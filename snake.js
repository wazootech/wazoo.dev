/**
 * Wazoo Snake Mini Game Easter Egg
 * Triggered by:
 * 1. Typing 'snake' anywhere on the page
 * 2. Konami Code (Up Up Down Down Left Right Left Right B A)
 * 3. Clicking the Wazoo logo title 5 times in succession
 * 4. Pressing Ctrl+Shift+S or ~
 */

(function () {
  "use strict";

  // Prevent double-initialization
  if (window.__WAZOO_SNAKE_INIT__) return;
  window.__WAZOO_SNAKE_INIT__ = true;

  // Grid Configuration
  const GRID_SIZE = 20; // 20x20 grid
  const CANVAS_SIZE = 400; // 400x400 px internal canvas resolution
  const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
  const INITIAL_SPEED = 120; // ms per tick
  const MIN_SPEED = 60; // max speed limit

  // Memory node labels for food items (referencing Wazoo & Worlds concepts)
  const NODE_LABELS = [
    "SPARQL",
    "Vector",
    "Triple",
    "Graph",
    "Knowledge",
    "Hippocampus",
    "Memory",
    "WorldModel",
    "NeuroSymbolic",
    "RDF",
  ];

  // Game State
  let modalEl = null;
  let canvasEl = null;
  let ctx = null;
  let scoreEl = null;
  let highScoreEl = null;
  let soundToggleEl = null;

  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 0, y: 0, label: "Vector" };
  let score = 0;
  let highScore = parseInt(
    localStorage.getItem("wazoo_snake_highscore") || "0",
    10,
  );
  let isMuted = localStorage.getItem("wazoo_snake_muted") === "true";
  let gameLoopTimer = null;
  let gameState = "STOPPED"; // 'START', 'RUNNING', 'PAUSED', 'GAMEOVER'
  let floatingTexts = [];

  // Audio Context (Synthesized 8-bit sound effects)
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playSound(type) {
    if (isMuted) return;
    const actx = getAudioContext();
    if (!actx) return;

    try {
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.connect(gain);
      gain.connect(actx.destination);

      const now = actx.currentTime;

      if (type === "eat") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "turn") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(300, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } else if (type === "gameover") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === "start") {
        osc.type = "square";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (_e) {
      // Ignore audio errors if blocked by browser policy
    }
  }

  // Inject CSS styles for modal & mobile controls
  function injectStyles() {
    if (document.getElementById("wazoo-snake-styles")) return;
    const style = document.createElement("style");
    style.id = "wazoo-snake-styles";
    style.textContent = `
      .snake-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(4, 4, 4, 0.88);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        opacity: 0;
        animation: snakeFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        font-family: "IBM Plex Mono", monospace;
        color: #b0b0b1;
      }

      @keyframes snakeFadeIn {
        to { opacity: 1; }
      }

      .snake-card {
        background: #0f0f0f;
        border: 1px solid #ff8c00;
        border-radius: 8px;
        box-shadow: 0 0 32px rgba(255, 140, 0, 0.2), 0 0 4px rgba(255, 140, 0, 0.4);
        width: 100%;
        max-width: 440px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
        transform: scale(0.95);
        animation: snakePopIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      @keyframes snakePopIn {
        to { transform: scale(1); }
      }

      .snake-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        background: #040404;
        border-bottom: 1px solid #1a1a1a;
      }

      .snake-title {
        font-weight: 600;
        font-size: 0.875rem;
        color: #ffffff;
        letter-spacing: -0.02em;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .snake-title-badge {
        background: #ff8c00;
        color: #000000;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
        text-transform: uppercase;
      }

      .snake-controls-top {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .snake-icon-btn {
        background: transparent;
        border: 1px solid #333333;
        color: #b0b0b1;
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.2s ease;
        line-height: 1;
      }

      .snake-icon-btn:hover {
        border-color: #ff8c00;
        color: #ff8c00;
        background: rgba(255, 140, 0, 0.1);
      }

      .snake-scores-bar {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 1rem;
        background: #090909;
        border-bottom: 1px solid #1a1a1a;
        font-size: 0.8rem;
        color: #7c7c7c;
      }

      .snake-score-val {
        color: #ffaa00;
        font-weight: 600;
      }

      .snake-canvas-wrapper {
        position: relative;
        width: 100%;
        background: #040404;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0.75rem;
      }

      canvas#wazoo-snake-canvas {
        background: #040404;
        border: 1px solid #1f1f1f;
        border-radius: 4px;
        max-width: 100%;
        height: auto;
        display: block;
        touch-action: none;
      }

      .snake-footer {
        padding: 0.6rem 1rem;
        background: #040404;
        border-top: 1px solid #1a1a1a;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.75rem;
        color: #7c7c7c;
      }

      .snake-dpad {
        display: none;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 6px;
        padding: 0.75rem;
        background: #090909;
        border-top: 1px solid #1a1a1a;
      }

      @media (max-width: 600px), (pointer: coarse) {
        .snake-dpad {
          display: grid;
        }
      }

      .dpad-btn {
        background: #151515;
        border: 1px solid #333;
        color: #ffffff;
        border-radius: 6px;
        padding: 0.75rem 0;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
      }

      .dpad-btn:active {
        background: #ff8c00;
        color: #000;
      }

      .dpad-up { grid-column: 2; grid-row: 1; }
      .dpad-left { grid-column: 1; grid-row: 2; }
      .dpad-down { grid-column: 2; grid-row: 2; }
      .dpad-right { grid-column: 3; grid-row: 2; }
    `;
    document.head.appendChild(style);
  }

  // Create & mount modal DOM
  function createModal() {
    injectStyles();

    modalEl = document.createElement("div");
    modalEl.className = "snake-modal-backdrop";
    modalEl.setAttribute("role", "dialog");
    modalEl.setAttribute("aria-label", "Wazoo Snake Mini Game Easter Egg");
    modalEl.tabIndex = -1;

    modalEl.innerHTML = `
      <div class="snake-card" id="wazoo-snake-card">
        <div class="snake-header">
          <div class="snake-title">
            <span class="snake-title-badge">Wazoo</span>
            <span>MEMORY_SNAKE v1.0</span>
          </div>
          <div class="snake-controls-top">
            <button class="snake-icon-btn" id="snake-sound-toggle" title="Toggle Sound" aria-label="Toggle Sound">
              ${isMuted ? "🔇" : "🔊"}
            </button>
            <button class="snake-icon-btn" id="snake-close-btn" title="Close (ESC)" aria-label="Close Easter Egg">
              ✕
            </button>
          </div>
        </div>

        <div class="snake-scores-bar">
          <div>SCORE: <span class="snake-score-val" id="snake-score-text">000</span></div>
          <div>HIGH: <span class="snake-score-val" id="snake-highscore-text">${
      String(highScore).padStart(3, "0")
    }</span></div>
        </div>

        <div class="snake-canvas-wrapper">
          <canvas id="wazoo-snake-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
        </div>

        <div class="snake-footer">
          <span>CONTROLS: WASD / ARROWS / ESC</span>
          <span style="color:#ffaa00;">[ WAZOO.DEV ]</span>
        </div>

        <div class="snake-dpad">
          <button class="dpad-btn dpad-up" id="dpad-up" aria-label="Move Up">▲</button>
          <button class="dpad-btn dpad-left" id="dpad-left" aria-label="Move Left">◄</button>
          <button class="dpad-btn dpad-down" id="dpad-down" aria-label="Move Down">▼</button>
          <button class="dpad-btn dpad-right" id="dpad-right" aria-label="Move Right">►</button>
        </div>
      </div>
    `;

    document.body.appendChild(modalEl);

    canvasEl = modalEl.querySelector("#wazoo-snake-canvas");
    ctx = canvasEl.getContext("2d");
    scoreEl = modalEl.querySelector("#snake-score-text");
    highScoreEl = modalEl.querySelector("#snake-highscore-text");
    soundToggleEl = modalEl.querySelector("#snake-sound-toggle");

    // Listeners inside modal
    modalEl.querySelector("#snake-close-btn").addEventListener(
      "click",
      closeGame,
    );
    soundToggleEl.addEventListener("click", toggleSound);

    modalEl.addEventListener("click", (e) => {
      if (e.target === modalEl) closeGame();
    });

    // Touch D-Pad
    modalEl.querySelector("#dpad-up").addEventListener(
      "click",
      () => handleInput("UP"),
    );
    modalEl.querySelector("#dpad-left").addEventListener(
      "click",
      () => handleInput("LEFT"),
    );
    modalEl.querySelector("#dpad-down").addEventListener(
      "click",
      () => handleInput("DOWN"),
    );
    modalEl.querySelector("#dpad-right").addEventListener(
      "click",
      () => handleInput("RIGHT"),
    );

    // Canvas Touch Swipe
    let touchStartX = 0;
    let touchStartY = 0;
    canvasEl.addEventListener("touchstart", (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvasEl.addEventListener("touchend", (e) => {
      if (e.changedTouches.length > 0) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (Math.abs(dx) > 20) handleInput(dx > 0 ? "RIGHT" : "LEFT");
        } else {
          if (Math.abs(dy) > 20) handleInput(dy > 0 ? "DOWN" : "UP");
        }
      }
    }, { passive: true });

    modalEl.focus();
  }

  function toggleSound() {
    isMuted = !isMuted;
    localStorage.setItem("wazoo_snake_muted", isMuted ? "true" : "false");
    if (soundToggleEl) soundToggleEl.textContent = isMuted ? "🔇" : "🔊";
  }

  function openGame() {
    if (!modalEl) {
      createModal();
    } else {
      modalEl.style.display = "flex";
    }
    resetGame();
    gameState = "START";
    draw();
    playSound("start");
  }

  function closeGame() {
    if (gameLoopTimer) clearInterval(gameLoopTimer);
    gameState = "STOPPED";
    if (modalEl) {
      modalEl.style.display = "none";
    }
  }

  function resetGame() {
    if (gameLoopTimer) clearInterval(gameLoopTimer);
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    floatingTexts = [];
    if (scoreEl) scoreEl.textContent = "000";
    spawnFood();
  }

  function spawnFood() {
    let valid = false;
    while (!valid) {
      const fx = Math.floor(Math.random() * GRID_SIZE);
      const fy = Math.floor(Math.random() * GRID_SIZE);
      valid = !snake.some((seg) => seg.x === fx && seg.y === fy);
      if (valid) {
        const label =
          NODE_LABELS[Math.floor(Math.random() * NODE_LABELS.length)];
        food = { x: fx, y: fy, label: label };
      }
    }
  }

  function startGame() {
    if (gameState === "RUNNING") return;
    gameState = "RUNNING";
    const speed = Math.max(
      MIN_SPEED,
      INITIAL_SPEED - Math.floor(score / 3) * 5,
    );
    gameLoopTimer = setInterval(tick, speed);
  }

  function pauseGame() {
    if (gameState === "RUNNING") {
      gameState = "PAUSED";
      clearInterval(gameLoopTimer);
      draw();
    } else if (gameState === "PAUSED") {
      startGame();
    }
  }

  function handleInput(action) {
    if (gameState === "START" || gameState === "GAMEOVER") {
      if (gameState === "GAMEOVER") resetGame();
      startGame();
    }

    if (action === "UP" && dir.y !== 1) {
      nextDir = { x: 0, y: -1 };
      playSound("turn");
    } else if (action === "DOWN" && dir.y !== -1) {
      nextDir = { x: 0, y: 1 };
      playSound("turn");
    } else if (action === "LEFT" && dir.x !== 1) {
      nextDir = { x: -1, y: 0 };
      playSound("turn");
    } else if (action === "RIGHT" && dir.x !== -1) {
      nextDir = { x: 1, y: 0 };
      playSound("turn");
    }
  }

  function tick() {
    dir = { ...nextDir };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      return triggerGameOver();
    }

    // Self collision
    if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
      return triggerGameOver();
    }

    snake.unshift(head);

    // Eat food
    if (head.x === food.x && head.y === food.y) {
      score += 1;
      if (scoreEl) scoreEl.textContent = String(score).padStart(3, "0");
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("wazoo_snake_highscore", String(highScore));
        if (highScoreEl) {
          highScoreEl.textContent = String(highScore).padStart(3, "0");
        }
      }

      floatingTexts.push({
        text: `+1 ${food.label}`,
        x: food.x * CELL_SIZE + CELL_SIZE / 2,
        y: food.y * CELL_SIZE,
        alpha: 1.0,
      });

      playSound("eat");
      spawnFood();

      // Recalculate dynamic speed
      clearInterval(gameLoopTimer);
      const speed = Math.max(
        MIN_SPEED,
        INITIAL_SPEED - Math.floor(score / 3) * 5,
      );
      gameLoopTimer = setInterval(tick, speed);
    } else {
      snake.pop();
    }

    draw();
  }

  function triggerGameOver() {
    clearInterval(gameLoopTimer);
    gameState = "GAMEOVER";
    playSound("gameover");
    draw();
  }

  function draw() {
    if (!ctx) return;

    // 1. Clear background
    ctx.fillStyle = "#040404";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2. Draw subtle grid
    ctx.strokeStyle = "#121212";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // 3. Draw Food (Neuro-symbolic memory node)
    const fx = food.x * CELL_SIZE;
    const fy = food.y * CELL_SIZE;
    const pulse = (Math.sin(Date.now() / 150) + 1) / 2;

    // Glowing aura
    ctx.fillStyle = `rgba(132, 108, 228, ${0.2 + pulse * 0.3})`;
    ctx.fillRect(fx - 2, fy - 2, CELL_SIZE + 4, CELL_SIZE + 4);

    // Inner core
    ctx.fillStyle = "#846ce4";
    ctx.fillRect(fx + 3, fy + 3, CELL_SIZE - 6, CELL_SIZE - 6);

    ctx.fillStyle = "#ffaa00";
    ctx.fillRect(fx + 6, fy + 6, CELL_SIZE - 12, CELL_SIZE - 12);

    // 4. Draw Snake
    snake.forEach((seg, index) => {
      const sx = seg.x * CELL_SIZE;
      const sy = seg.y * CELL_SIZE;

      if (index === 0) {
        // Head (Sunset Orange #FF8C00)
        ctx.fillStyle = "#ff8c00";
        ctx.beginPath();
        ctx.roundRect(sx + 1, sy + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#040404";
        const eyeOffset = 4;
        if (dir.x === 1) {
          ctx.fillRect(sx + CELL_SIZE - 5, sy + eyeOffset, 3, 3);
          ctx.fillRect(
            sx + CELL_SIZE - 5,
            sy + CELL_SIZE - eyeOffset - 3,
            3,
            3,
          );
        } else if (dir.x === -1) {
          ctx.fillRect(sx + 3, sy + eyeOffset, 3, 3);
          ctx.fillRect(sx + 3, sy + CELL_SIZE - eyeOffset - 3, 3, 3);
        } else if (dir.y === -1) {
          ctx.fillRect(sx + eyeOffset, sy + 3, 3, 3);
          ctx.fillRect(sx + CELL_SIZE - eyeOffset - 3, sy + 3, 3, 3);
        } else {
          ctx.fillRect(sx + eyeOffset, sy + CELL_SIZE - 5, 3, 3);
          ctx.fillRect(
            sx + CELL_SIZE - eyeOffset - 3,
            sy + CELL_SIZE - 5,
            3,
            3,
          );
        }
      } else {
        // Body (Highlight Yellow gradient #FFAA00 -> #FF8C00)
        const ratio = 1 - index / snake.length;
        ctx.fillStyle = ratio > 0.5 ? "#ffaa00" : "#e07c00";
        ctx.beginPath();
        ctx.roundRect(sx + 2, sy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 3);
        ctx.fill();
      }
    });

    // 5. Draw Floating +1 Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ctx.font = "11px 'IBM Plex Mono', monospace";
      ctx.fillStyle = `rgba(255, 170, 0, ${ft.alpha})`;
      ctx.textAlign = "center";
      ctx.fillText(ft.text, ft.x, ft.y);

      ft.y -= 0.8;
      ft.alpha -= 0.025;
      if (ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    // 6. Draw Overlay Messages (Start / Pause / Game Over)
    if (gameState === "START") {
      drawBanner(
        "WAZOO // MEMORY SNAKE",
        "PRESS ARROW KEYS OR WASD TO PLAY",
        "#ff8c00",
      );
    } else if (gameState === "PAUSED") {
      drawBanner("PAUSED", "PRESS SPACE OR ARROW TO RESUME", "#ffaa00");
    } else if (gameState === "GAMEOVER") {
      drawBanner(
        "GAME OVER",
        `SCORE: ${score}  |  PRESS 'R' TO RESTART`,
        "#ff0055",
      );
    }
  }

  function drawBanner(title, subtitle, accentColor) {
    ctx.fillStyle = "rgba(4, 4, 4, 0.82)";
    ctx.fillRect(0, CANVAS_SIZE / 2 - 45, CANVAS_SIZE, 90);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, CANVAS_SIZE / 2 - 45, CANVAS_SIZE, 90);

    ctx.font = "bold 16px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(title, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);

    ctx.font = "12px 'IBM Plex Mono', monospace";
    ctx.fillStyle = accentColor;
    ctx.fillText(subtitle, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 18);
  }

  // Window Event Listeners for Controls
  window.addEventListener("keydown", (e) => {
    if (!modalEl || modalEl.style.display === "none") return;

    if (e.key === "Escape") {
      closeGame();
      return;
    }

    if (e.key === "p" || e.key === "P" || e.code === "Space") {
      e.preventDefault();
      pauseGame();
      return;
    }

    if (e.key === "r" || e.key === "R") {
      if (gameState === "GAMEOVER" || gameState === "PAUSED") {
        resetGame();
        startGame();
        return;
      }
    }

    const keyMap = {
      ArrowUp: "UP",
      w: "UP",
      W: "UP",
      ArrowDown: "DOWN",
      s: "DOWN",
      S: "DOWN",
      ArrowLeft: "LEFT",
      a: "LEFT",
      A: "LEFT",
      ArrowRight: "RIGHT",
      d: "RIGHT",
      D: "RIGHT",
    };

    if (keyMap[e.key]) {
      e.preventDefault();
      handleInput(keyMap[e.key]);
    }
  });

  // Easter Egg Triggers setup
  // Trigger 1: Secret string 'snake' typing
  let typeBuffer = "";
  window.addEventListener("keydown", (e) => {
    if (modalEl && modalEl.style.display !== "none") return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    // Quick shortcut Ctrl+Shift+S or ~
    if (
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") ||
      e.key === "`" || e.key === "~"
    ) {
      e.preventDefault();
      openGame();
      return;
    }

    typeBuffer += e.key.toLowerCase();
    if (typeBuffer.length > 10) typeBuffer = typeBuffer.slice(-10);
    if (typeBuffer.endsWith("snake")) {
      typeBuffer = "";
      openGame();
    }
  });

  // Trigger 2: Konami Code (Up Up Down Down Left Right Left Right B A)
  const KONAMI_CODE = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];
  let konamiIndex = 0;
  window.addEventListener("keydown", (e) => {
    if (modalEl && modalEl.style.display !== "none") return;
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const expected = KONAMI_CODE[konamiIndex];

    if (key === expected || key === expected.toLowerCase()) {
      konamiIndex++;
      if (konamiIndex === KONAMI_CODE.length) {
        konamiIndex = 0;
        openGame();
      }
    } else {
      konamiIndex = 0;
    }
  });

  // Trigger 3: Header title multi-click (5 clicks on .quirk-highlight)
  document.addEventListener("DOMContentLoaded", () => {
    attachHeaderClickTrigger();
  });
  if (
    document.readyState === "interactive" || document.readyState === "complete"
  ) {
    attachHeaderClickTrigger();
  }

  function attachHeaderClickTrigger() {
    const titleEl = document.querySelector(".quirk-highlight");
    if (!titleEl) return;

    let clickCount = 0;
    let clickTimer = null;

    titleEl.addEventListener("click", () => {
      clickCount++;
      if (clickTimer) clearTimeout(clickTimer);

      if (clickCount >= 5) {
        clickCount = 0;
        openGame();
      } else {
        clickTimer = setTimeout(() => {
          clickCount = 0;
        }, 3000);
      }
    });
  }

  // Public API to trigger programmatically if desired
  window.WazooSnake = {
    open: openGame,
    close: closeGame,
  };
})();
