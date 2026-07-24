const hourHand = document.getElementById('hour');
const minuteHand = document.getElementById('minute');
const secondHand = document.getElementById('second');
const faceOverlay = document.getElementById('clock-face-overlay');

/* -----------------------------
   localStorage の設定を読み込む
----------------------------- */
function loadSavedStyle() {
  const faceColor = localStorage.getItem("face-color");
  const hourColor = localStorage.getItem("hour-color");
  const minuteColor = localStorage.getItem("minute-color");
  const secondColor = localStorage.getItem("second-color");
  const faceImage = localStorage.getItem("face-image");

  if (faceColor) document.documentElement.style.setProperty("--face-color", faceColor);
  if (hourColor) document.documentElement.style.setProperty("--hour-color", hourColor);
  if (minuteColor) document.documentElement.style.setProperty("--minute-color", minuteColor);
  if (secondColor) document.documentElement.style.setProperty("--second-color", secondColor);

  // 修正箇所：.PNG を消去し、opacity を明示的に制御
  if (faceImage && faceImage !== "none") {
    faceOverlay.style.opacity = "1";
    faceOverlay.style.backgroundImage = `url('${faceImage}')`;
  } else {
    faceOverlay.style.opacity = "0";
    faceOverlay.style.backgroundImage = "none";
  }
}

loadSavedStyle();

/* -----------------------------
   時計の動作
----------------------------- */
function updateClock() {
  const now = new Date();
  hourHand.style.transform = `translateX(-50%) rotate(${(now.getHours()%12)*30 + now.getMinutes()*0.5}deg)`;
  minuteHand.style.transform = `translateX(-50%) rotate(${now.getMinutes()*6}deg)`;
  secondHand.style.transform = `translateX(-50%) rotate(${now.getSeconds()*6}deg)`;
  requestAnimationFrame(updateClock);
}

updateClock();

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
