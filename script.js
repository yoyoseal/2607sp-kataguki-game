(() => {
  "use strict";

  const LEVELS = {
    easy: { name: "簡單", candy: "images/easy_candy.png", mask: "images/easy_mask.png" },
    hard: { name: "困難", candy: "images/hard_candy.png", mask: "images/hard_mask.png" },
    god: { name: "神之試煉", candy: "images/god_candy.png", mask: "images/god_mask.png" }
  };

  const RESULT_IMAGES = {
    success: "images/success.png",
    gameover: "images/gameover.png"
  };

  const START_COLOR = { r: 255, g: 0, b: 0 };
  const END_COLOR = { r: 0, g: 80, b: 255 };
  const COLOR_TOLERANCE = 80;
  const STORAGE_PREFIX = "kataguki-best-v6:";

  const $ = (id) => document.getElementById(id);
  const menuScreen = $("menuScreen");
  const playScreen = $("playScreen");
  const resultScreen = $("resultScreen");
  const canvas = $("gameCanvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const levelName = $("levelName");
  const timer = $("timer");
  const statusText = $("statusText");
  const backBtn = $("backBtn");
  const returnMenuBtn = $("returnMenuBtn");
  const resultImage = $("resultImage");
  const resultTitle = $("resultTitle");
  const resultText = $("resultText");
  const bestTimeEls = document.querySelectorAll("[data-best]");

  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

  let currentLevel = null;
  let candyImage = null;
  let maskImage = null;
  let isReady = false;
  let isArmed = false;
  let isDrawing = false;
  let isPointerDown = false;
  let timerId = null;
  let startTime = 0;
  let lastPoint = null;

  function showScreen(screen) {
    [menuScreen, playScreen, resultScreen].forEach((el) => el.classList.remove("active"));
    screen.classList.add("active");
  }

  function setStatus(text) {
    statusText.textContent = text;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`圖片載入失敗：${src}`));
      img.src = src + `?v=${Date.now()}`;
    });
  }

  async function loadLevel(levelKey) {
    const level = LEVELS[levelKey];
    if (!level) return;
    currentLevel = { ...level, key: levelKey };

    resetGameState();
    levelName.textContent = currentLevel.name;
    timer.textContent = "00.00";
    setStatus("糖片準備中……");
    showScreen(playScreen);

    try {
      [candyImage, maskImage] = await Promise.all([
        loadImage(currentLevel.candy),
        loadImage(currentLevel.mask)
      ]);

      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      maskCtx.clearRect(0, 0, canvas.width, canvas.height);
      maskCtx.drawImage(maskImage, 0, 0, canvas.width, canvas.height);

      drawCandy();
      isReady = true;
		isArmed = true;

		setStatus("按住紅點開始雕刻，持續拖曳線條至藍點位置");
    } catch (error) {
      drawText("圖片載入失敗，請確認 images 資料夾與檔名。", 14);
      setStatus(error.message);
    }
  }

  function resetGameState() {
    stopTimer();
    isReady = false;
    isArmed = false;
    isDrawing = false;
    isPointerDown = false;
    lastPoint = null;
  }

  function drawCandy() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(candyImage, 0, 0, canvas.width, canvas.height);
  }

  function drawText(text, size = 16) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff0000";
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }



  function startTimer() {
    stopTimer();
    startTime = performance.now();
    timerId = requestAnimationFrame(updateTimer);
  }

  function updateTimer() {
    const elapsed = (performance.now() - startTime) / 1000;
    timer.textContent = elapsed.toFixed(2).padStart(5, "0");
    timerId = requestAnimationFrame(updateTimer);
  }

  function stopTimer() {
    if (timerId !== null) {
      cancelAnimationFrame(timerId);
      timerId = null;
    }
  }

  function eventPoint(event) {
    const source = event.touches && event.touches.length ? event.touches[0]
      : event.changedTouches && event.changedTouches.length ? event.changedTouches[0]
      : event;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((source.clientX - rect.left) * (canvas.width / rect.width)),
      y: Math.round((source.clientY - rect.top) * (canvas.height / rect.height))
    };
  }

  function getMaskPixel(point) {
    if (point.x < 0 || point.y < 0 || point.x >= canvas.width || point.y >= canvas.height) {
      return { r: 0, g: 0, b: 0, a: 255 };
    }
    const data = maskCtx.getImageData(point.x, point.y, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  }

  function near(pixel, target) {
    return Math.abs(pixel.r - target.r) <= COLOR_TOLERANCE &&
      Math.abs(pixel.g - target.g) <= COLOR_TOLERANCE &&
      Math.abs(pixel.b - target.b) <= COLOR_TOLERANCE;
  }

  function classify(point) {
    const p = getMaskPixel(point);
    if (p.a < 10) return "fail";
    if (near(p, END_COLOR)) return "end";
    if (near(p, START_COLOR)) return "start";
    if (p.r > 165 && p.g > 165 && p.b > 165) return "safe";
    return "fail";
  }

  function startStroke(event) {
    if (event.cancelable) event.preventDefault();
    if (isDrawing) return;
    if (!isArmed) {
      return;
    }

    const point = eventPoint(event);
    isPointerDown = true;

    const zone = classify(point);
    if (zone !== "start") {
      isPointerDown = false;
      setStatus("只能從紅點出發。請按住紅點開始雕刻。");
      return;
    }

    isDrawing = true;
    lastPoint = point;
    startTimer();
    drawPoint(point);
    setStatus("雕刻中...");
  }

  function moveStroke(event) {
    if (!isPointerDown || !isDrawing) return;
    if (event.cancelable) event.preventDefault();

    const point = eventPoint(event);
    const points = interpolate(lastPoint, point, 2);

    for (const p of points) {
      const zone = classify(p);
      if (zone === "fail") {
        endGame(false, "糖片裂開了！");
        return;
      }
      if (zone === "end") {
        drawLine(lastPoint, p);
        endGame(true, "雕刻成功！");
        return;
      }
    }

    drawLine(lastPoint, point);
    lastPoint = point;
  }

  function endStroke(event) {
    if (event && event.cancelable) event.preventDefault();
    if (!isPointerDown) return;
    isPointerDown = false;
    if (isDrawing) {
      endGame(false, "手離開糖片，挑戰失敗。");
    }
  }

  function interpolate(from, to, step) {
    const points = [];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const count = Math.max(1, Math.ceil(distance / step));
    for (let i = 1; i <= count; i += 1) {
      points.push({
        x: Math.round(from.x + dx * i / count),
        y: Math.round(from.y + dy * i / count)
      });
    }
    return points;
  }

  function drawPoint(point) {
    ctx.fillStyle = "rgba(255,0,0,0.9)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLine(from, to) {
    ctx.strokeStyle = "rgba(255,0,0,0.9)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  function endGame(success, message) {
    const finalTime = timer.textContent;
    stopTimer();
    isArmed = false;
    isDrawing = false;
    isPointerDown = false;

    if (success && currentLevel) {
      saveBestTime(currentLevel.key, Number(finalTime));
      updateBestTimeDisplay();
    }

    resultImage.src = success ? RESULT_IMAGES.success : RESULT_IMAGES.gameover;
    resultTitle.textContent = success ? "雕刻成功" : "挑戰失敗";
    resultText.textContent = success ? `${message} 使用時間：${finalTime} 秒` : message;
    showScreen(resultScreen);
  }

  function returnToMenu() {
    resetGameState();
    showScreen(menuScreen);
  }


  function bestStorageKey(levelKey) {
    return STORAGE_PREFIX + levelKey;
  }

  function saveBestTime(levelKey, seconds) {
    if (!Number.isFinite(seconds)) return;
    try {
      const key = bestStorageKey(levelKey);
      const oldValue = Number(localStorage.getItem(key));
      if (!Number.isFinite(oldValue) || oldValue <= 0 || seconds < oldValue) {
        localStorage.setItem(key, seconds.toFixed(2));
      }
    } catch (error) {
      // localStorage 若被瀏覽器或 iframe 擋住，不影響遊戲本體。
    }
  }

  function updateBestTimeDisplay() {
    bestTimeEls.forEach((el) => {
      const levelKey = el.dataset.best;
      let value = null;
      try {
        value = localStorage.getItem(bestStorageKey(levelKey));
      } catch (error) {
        value = null;
      }
      el.textContent = value ? `最佳時間：${Number(value).toFixed(2)} 秒` : "最佳時間：--";
    });
  }

  document.querySelectorAll(".level-btn").forEach((button) => {
    button.addEventListener("click", () => loadLevel(button.dataset.level));
  });


  backBtn.addEventListener("click", returnToMenu);
  returnMenuBtn.addEventListener("click", returnToMenu);

  updateBestTimeDisplay();

  canvas.addEventListener("pointerdown", startStroke, { passive: false });
  document.addEventListener("pointermove", moveStroke, { passive: false });
  document.addEventListener("pointerup", endStroke, { passive: false });
  document.addEventListener("pointercancel", endStroke, { passive: false });

  canvas.addEventListener("mousedown", startStroke, { passive: false });
  document.addEventListener("mousemove", moveStroke, { passive: false });
  document.addEventListener("mouseup", endStroke, { passive: false });

  canvas.addEventListener("touchstart", startStroke, { passive: false });
  document.addEventListener("touchmove", moveStroke, { passive: false });
  document.addEventListener("touchend", endStroke, { passive: false });
  document.addEventListener("touchcancel", endStroke, { passive: false });
})();
