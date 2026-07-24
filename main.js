const faceRadios = document.querySelectorAll('input[name="clock-face"]');
const colorPickers = {
  face: document.getElementById('face-color-picker'),
  hour: document.getElementById('hour-color-picker'),
  minute: document.getElementById('minute-color-picker'),
  second: document.getElementById('second-color-picker')
};

const resetButton = document.getElementById('reset-style');
const openClockButton = document.getElementById('open-clock');

const hourHand = document.getElementById('hour');
const minuteHand = document.getElementById('minute');
const secondHand = document.getElementById('second');
const faceOverlay = document.getElementById('clock-face-overlay');

const STORAGE_KEYS = {
  faceImage: 'face-image',
  faceColor: 'face-color',
  hourColor: 'hour-color',
  minuteColor: 'minute-color',
  secondColor: 'second-color'
};

const COLOR_STORAGE_KEYS = {
  face: 'face-color',
  hour: 'hour-color',
  minute: 'minute-color',
  second: 'second-color'
};

/* -----------------------------
   設定を localStorage に保存
----------------------------- */
function getStoredValue(key, fallback) {
  return localStorage.getItem(key) || fallback;
}

function applyColor(name, color) {
  localStorage.setItem(COLOR_STORAGE_KEYS[name], color);
}

function setFace(faceName) {
  localStorage.setItem(STORAGE_KEYS.faceImage, faceName);
}

function getFaceImageUrl(faceName) {
  if (!faceName || faceName === 'none') return '';
  return faceName;
}

function applyFaceImageToPreview(faceName) {
  const faceImageUrl = getFaceImageUrl(faceName);

  const targets = [
    faceOverlay,
    document.querySelector('.clock-face-overlay'),
    document.querySelector('[data-preview-face]')
  ].filter(Boolean);

  targets.forEach((el) => {
    if (faceImageUrl) {
      el.style.backgroundImage = `url("${faceImageUrl}")`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.opacity = '1'; // ← 追加：透明度を解除して表示させる
    } else {
      el.style.backgroundImage = 'none';
      el.style.opacity = '0'; // ← 追加：なしの時は透明にする
    }
  });

  const faceImageElement = document.getElementById('clock-face-image');
  if (faceImageElement) {
    if (faceImageUrl) {
      faceImageElement.src = faceImageUrl;
      faceImageElement.style.display = 'block';
    } else {
      faceImageElement.style.display = 'none';
    }
  }

  document.documentElement.style.setProperty(
    '--clock-face-image',
    faceImageUrl ? `url("${faceImageUrl}")` : 'none'
  );
}

function applyPreviewStyle() {
  const faceName = getStoredValue(STORAGE_KEYS.faceImage, 'none');
  const faceColor = getStoredValue(STORAGE_KEYS.faceColor, '#ffffff');
  const hourColor = getStoredValue(STORAGE_KEYS.hourColor, '#ff6b6b');
  const minuteColor = getStoredValue(STORAGE_KEYS.minuteColor, '#4ecdc4');
  const secondColor = getStoredValue(STORAGE_KEYS.secondColor, '#ffe66d');

  faceRadios.forEach(radio => {
    radio.checked = (radio.value === faceName);
  });

  if (colorPickers.face) colorPickers.face.value = faceColor;
  if (colorPickers.hour) colorPickers.hour.value = hourColor;
  if (colorPickers.minute) colorPickers.minute.value = minuteColor;
  if (colorPickers.second) colorPickers.second.value = secondColor;

  if (faceOverlay) {
    faceOverlay.style.backgroundColor = faceColor;
  }

  applyFaceImageToPreview(faceName);

  if (hourHand) hourHand.style.backgroundColor = hourColor;
  if (minuteHand) minuteHand.style.backgroundColor = minuteColor;
  if (secondHand) secondHand.style.backgroundColor = secondColor;
}
/* -----------------------------
   イベント
----------------------------- */
faceRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    setFace(radio.value);
    applyPreviewStyle();
  });
});

Object.entries(colorPickers).forEach(([name, picker]) => {
  if (!picker) return;
  picker.addEventListener("input", () => {
    applyColor(name, picker.value);
    applyPreviewStyle();
  });
});

if (resetButton) {
  resetButton.addEventListener("click", () => {
    localStorage.setItem(STORAGE_KEYS.faceImage, "none");
    localStorage.setItem(STORAGE_KEYS.faceColor, "#ffffff");
    localStorage.setItem(STORAGE_KEYS.hourColor, "#ff6b6b");
    localStorage.setItem(STORAGE_KEYS.minuteColor, "#4ecdc4");
    localStorage.setItem(STORAGE_KEYS.secondColor, "#ffe66d");

    applyPreviewStyle();
  });
}

function updateClock() {
  const now = new Date();
  hourHand.style.transform = `translateX(-50%) rotate(${(now.getHours()%12)*30 + now.getMinutes()*0.5}deg)`;
  minuteHand.style.transform = `translateX(-50%) rotate(${now.getMinutes()*6}deg)`;
  secondHand.style.transform = `translateX(-50%) rotate(${now.getSeconds()*6}deg)`;
  requestAnimationFrame(updateClock);
}

updateClock();
applyPreviewStyle();

/* -----------------------------
   背景画像（Open-Meteo）
----------------------------- */
const WEATHER_STORAGE_KEY = 'weather-data-cache';
const WEATHER_BACKGROUND_KEY = 'weather-background-image';

function readCachedWeather() {
  try {
    const cached = localStorage.getItem(WEATHER_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    return null;
  }
}

function writeCachedWeather(data) {
  try {
    localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('天気情報のキャッシュ保存に失敗しました:', error);
  }
}

function readCachedBackgroundImage() {
  try {
    return localStorage.getItem(WEATHER_BACKGROUND_KEY);
  } catch (error) {
    return null;
  }
}

function writeCachedBackgroundImage(bgImage) {
  try {
    localStorage.setItem(WEATHER_BACKGROUND_KEY, bgImage);
  } catch (error) {
    console.error('背景画像のキャッシュ保存に失敗しました:', error);
  }
}

function getWeatherBackgroundFromData(data) {
  const index = getClosestHourIndex(data.hourly.time);
  const cloudNow = data.hourly.cloud_cover[index];
  const rainNow = data.hourly.rain[index];
  return getBackgroundImage(cloudNow, rainNow);
}

function applyWeatherBackground(bgImage) {
  document.body.style.backgroundImage = bgImage;
}

async function loadWeather() {
  const cachedBgImage = readCachedBackgroundImage();
  if (cachedBgImage) {
    applyWeatherBackground(cachedBgImage);
  }

  const cachedWeather = readCachedWeather();
  if (cachedWeather) {
    const bgImage = getWeatherBackgroundFromData(cachedWeather);
    writeCachedBackgroundImage(bgImage);
    applyWeatherBackground(bgImage);
  }

  try {
    const params = new URLSearchParams({
      latitude: 34.71,
      longitude: 137.73,
      hourly: 'rain,cloud_cover',
      models: 'jma_seamless'
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json();

    writeCachedWeather(data);
    const bgImage = getWeatherBackgroundFromData(data);
    writeCachedBackgroundImage(bgImage);
    applyWeatherBackground(bgImage);
  } catch (error) {
    console.error('天気情報の取得に失敗しました:', error);
  }
}

window.addEventListener('storage', (event) => {
  if (event.key === WEATHER_BACKGROUND_KEY && event.newValue) {
    applyWeatherBackground(event.newValue);
  }
});

function getClosestHourIndex(times) {
  const now = new Date();
  let closestIndex = 0;
  let minDiff = Infinity;

  times.forEach((t, i) => {
    const time = new Date(t);
    const diff = Math.abs(time - now);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  });

  return closestIndex;
}

function getTimeCategory(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 18 || hour < 6) return 'night';
  if (hour >= 16) return 'evening';
  return 'day';
}

function getBackgroundImage(cloud, rain) {
  const timeCategory = getTimeCategory();
  const isClear = cloud <= 0.1;

  if (rain > 0.5) {
    if (timeCategory === 'evening') return "url('eveningrainy.jpg')";
    if (timeCategory === 'night') return "url('nightrainy.jpg')";
    return "url('rainy.jpg')";
  } else if (isClear) {
    if (timeCategory === 'evening') return "url('clearevening.jpg')";
    if (timeCategory === 'night') return "url('clearnight.jpg')";
    return "url('clearsunny.jpg')";
  } else {
    if (timeCategory === 'evening') return "url('eveningcloudy.jpg')";
    if (timeCategory === 'night') return "url('nightcloudy.jpg')";
    return "url('cloudy.jpg')";
  }
}

loadWeather();

/* -----------------------------
   時計タブを開く
----------------------------- */
if (openClockButton) {
  openClockButton.addEventListener("click", () => {
    window.open("clock.html", "_blank", "width=320,height=320");
  });
}