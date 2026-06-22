const canvas = document.querySelector("#fogCanvas");
const ctx = canvas.getContext("2d");

const hours = [0, 3, 6, 9, 12, 15, 18, 21];

const stations = [
  {
    id: "seoul",
    name: "서울",
    area: "도심 복사안개",
    x: 0.47,
    y: 0.28,
    windDir: 300,
    base: { temp: 15.1, rh: 94, dewGap: 1.0, wind: 1.2, vis: 1.3, solar: 0, rain: 1.0 },
  },
  {
    id: "incheon",
    name: "인천",
    area: "해안 안개",
    x: 0.36,
    y: 0.31,
    windDir: 280,
    base: { temp: 14.4, rh: 97, dewGap: 0.5, wind: 1.8, vis: 0.8, solar: 0, rain: 0.5 },
  },
  {
    id: "daegwallyeong",
    name: "대관령",
    area: "산지 안개",
    x: 0.62,
    y: 0.26,
    windDir: 250,
    base: { temp: 10.2, rh: 98, dewGap: 0.4, wind: 1.0, vis: 0.6, solar: 0, rain: 2.5 },
  },
  {
    id: "gangneung",
    name: "강릉",
    area: "동해안 해무",
    x: 0.69,
    y: 0.33,
    windDir: 70,
    base: { temp: 13.8, rh: 95, dewGap: 0.9, wind: 2.2, vis: 1.8, solar: 0, rain: 0.2 },
  },
  {
    id: "jeonju",
    name: "전주",
    area: "내륙 분지",
    x: 0.48,
    y: 0.59,
    windDir: 320,
    base: { temp: 16.8, rh: 92, dewGap: 1.4, wind: 0.8, vis: 2.0, solar: 0, rain: 3.2 },
  },
  {
    id: "busan",
    name: "부산",
    area: "남해안 해무",
    x: 0.68,
    y: 0.77,
    windDir: 110,
    base: { temp: 17.6, rh: 90, dewGap: 1.8, wind: 2.6, vis: 3.0, solar: 0, rain: 0.3 },
  },
  {
    id: "jeju",
    name: "제주",
    area: "해양성 안개",
    x: 0.39,
    y: 0.89,
    windDir: 60,
    base: { temp: 18.3, rh: 93, dewGap: 1.3, wind: 3.0, vis: 2.4, solar: 0, rain: 1.5 },
  },
];

const elements = {
  stationList: document.querySelector("#stationList"),
  stationName: document.querySelector("#stationName"),
  timeLabel: document.querySelector("#timeLabel"),
  hourReadout: document.querySelector("#hourReadout"),
  phaseText: document.querySelector("#phaseText"),
  phasePill: document.querySelector("#phasePill"),
  riskLabel: document.querySelector("#riskLabel"),
  windLabel: document.querySelector("#windLabel"),
  windArrow: document.querySelector("#windArrow"),
  tempValue: document.querySelector("#tempValue"),
  rhValue: document.querySelector("#rhValue"),
  dewGapValue: document.querySelector("#dewGapValue"),
  visibilityValue: document.querySelector("#visibilityValue"),
  aiNarrative: document.querySelector("#aiNarrative"),
  hourSlider: document.querySelector("#hourSlider"),
  humiditySlider: document.querySelector("#humiditySlider"),
  windSlider: document.querySelector("#windSlider"),
  solarSlider: document.querySelector("#solarSlider"),
  rainSlider: document.querySelector("#rainSlider"),
  humidityReadout: document.querySelector("#humidityReadout"),
  windReadout: document.querySelector("#windReadout"),
  solarReadout: document.querySelector("#solarReadout"),
  rainReadout: document.querySelector("#rainReadout"),
  formationBar: document.querySelector("#formationBar"),
  spreadBar: document.querySelector("#spreadBar"),
  dissipationBar: document.querySelector("#dissipationBar"),
};

let selectedStationId = "seoul";
let animationFrame = 0;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatHour(hour) {
  return String(hour).padStart(2, "0") + ":00";
}

function getSelectedStation() {
  return stations.find((station) => station.id === selectedStationId);
}

function getScenario() {
  return {
    hourIndex: Number(elements.hourSlider.value),
    humidity: Number(elements.humiditySlider.value),
    wind: Number(elements.windSlider.value),
    solar: Number(elements.solarSlider.value),
    rain: Number(elements.rainSlider.value),
  };
}

function timeModifier(hour) {
  if (hour === 0) return { cooling: -0.9, rh: 2, solar: 0, vis: -0.1 };
  if (hour === 3) return { cooling: -1.4, rh: 4, solar: 0, vis: -0.3 };
  if (hour === 6) return { cooling: -1.1, rh: 3, solar: 20, vis: -0.4 };
  if (hour === 9) return { cooling: 0.7, rh: -6, solar: 280, vis: 1.4 };
  if (hour === 12) return { cooling: 2.4, rh: -14, solar: 520, vis: 3.1 };
  if (hour === 15) return { cooling: 2.8, rh: -16, solar: 420, vis: 3.8 };
  if (hour === 18) return { cooling: 1.1, rh: -7, solar: 80, vis: 2.0 };
  return { cooling: -0.3, rh: 1, solar: 0, vis: 0.6 };
}

function deriveWeather(station, scenario) {
  const hour = hours[scenario.hourIndex];
  const mod = timeModifier(hour);
  const temp = station.base.temp + mod.cooling;
  const rh = clamp(station.base.rh + mod.rh + scenario.humidity, 45, 100);
  const solar = clamp(station.base.solar + mod.solar + scenario.solar, 0, 850);
  const wind = clamp(station.base.wind + scenario.wind + (hour >= 12 && hour <= 18 ? 0.8 : 0), 0.1, 10);
  const rain = scenario.rain;
  const dewGap = clamp(station.base.dewGap - scenario.humidity * 0.035 + mod.cooling * -0.22 + solar / 820, 0.1, 9);
  const vis = clamp(station.base.vis + mod.vis + wind * 0.35 + solar / 190 - rain * 0.04 - scenario.humidity * 0.08, 0.1, 15);

  return { hour, temp, rh, solar, wind, rain, dewGap, vis };
}

function scoreWeather(weather) {
  const humidityScore = clamp((weather.rh - 78) / 22, 0, 1);
  const dewScore = clamp((4.2 - weather.dewGap) / 4.2, 0, 1);
  const windStayScore = clamp((4.5 - weather.wind) / 4.5, 0, 1);
  const visScore = clamp((6 - weather.vis) / 6, 0, 1);
  const nightScore = weather.hour <= 7 || weather.hour >= 21 ? 1 : weather.hour === 9 ? 0.5 : 0.12;
  const rainScore = clamp(weather.rain / 8, 0, 1);
  const solarPenalty = clamp(weather.solar / 640, 0, 1);
  const formation = clamp(
    humidityScore * 0.32 +
      dewScore * 0.3 +
      windStayScore * 0.14 +
      visScore * 0.12 +
      nightScore * 0.08 +
      rainScore * 0.08 -
      solarPenalty * 0.22,
    0,
    1,
  );
  const spread = clamp(formation * 0.7 + clamp(weather.wind / 4, 0, 1) * 0.35 - solarPenalty * 0.12, 0, 1);
  const dissipation = clamp(solarPenalty * 0.5 + clamp(weather.wind / 6, 0, 1) * 0.34 + clamp((weather.dewGap - 2) / 5, 0, 1) * 0.24, 0, 1);
  const risk = clamp(formation * 0.78 + spread * 0.14 - dissipation * 0.28, 0, 1);

  let phase = "formation";
  if (risk > 0.48 && spread > formation * 0.86 && weather.wind > 1.7) phase = "spread";
  if (dissipation > formation && (weather.solar > 180 || weather.wind > 4)) phase = "dissipation";

  return { risk, formation, spread, dissipation, phase };
}

function phaseName(phase) {
  if (phase === "formation") return "생성 단계";
  if (phase === "spread") return "확산 단계";
  return "소산 단계";
}

function windDirectionName(deg) {
  const names = ["북풍", "북동풍", "동풍", "남동풍", "남풍", "남서풍", "서풍", "북서풍"];
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return names[index];
}

function narrative(station, weather, score) {
  if (score.phase === "dissipation") {
    return `${station.name}은 일사 ${Math.round(weather.solar)} W/m²와 풍속 ${weather.wind.toFixed(1)} m/s 영향으로 안개층이 약해지는 조건입니다. 이슬점차가 ${weather.dewGap.toFixed(1)}°C까지 벌어지면 시정이 빠르게 회복됩니다.`;
  }
  if (score.phase === "spread") {
    return `${station.name}은 안개 위험도가 높고 ${windDirectionName(station.windDir)}이 ${weather.wind.toFixed(1)} m/s로 불어 안개 영역이 이동하기 쉽습니다. 바람이 너무 강해지면 확산보다 소산이 우세해집니다.`;
  }
  return `${station.name}은 상대습도 ${Math.round(weather.rh)}%, 이슬점차 ${weather.dewGap.toFixed(1)}°C로 공기가 포화에 가깝습니다. 약한 바람과 최근 강수가 겹쳐 지표 부근 물방울이 만들어지는 조건입니다.`;
}

function buildStationButtons() {
  elements.stationList.innerHTML = "";
  stations.forEach((station) => {
    const button = document.createElement("button");
    button.className = "station-button";
    button.type = "button";
    button.dataset.stationId = station.id;
    button.innerHTML = `<strong>${station.name}</strong><span>${station.area}</span>`;
    button.addEventListener("click", () => {
      selectedStationId = station.id;
      update();
    });
    elements.stationList.appendChild(button);
  });
}

function drawMap(station, weather, score) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#d8eaf5";
  ctx.fillRect(0, 0, width, height);

  drawSeaPattern(width, height);
  drawLandShape(width, height);
  drawRiskField(width, height);
  drawWindParticles(width, height, station, weather, score);
  drawStations(width, height);
  drawFogPlume(width, height, station, score);
}

function drawSeaPattern(width, height) {
  ctx.save();
  ctx.strokeStyle = "rgba(67, 139, 90, 0.09)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i += 1) {
    ctx.beginPath();
    const y = 42 + i * 54;
    ctx.moveTo(0, y);
    for (let x = 0; x <= width; x += 48) {
      ctx.lineTo(x, y + Math.sin(x / 110 + i) * 8);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawLandShape(width, height) {
  const points = [
    [0.56, 0.08],
    [0.68, 0.18],
    [0.71, 0.34],
    [0.66, 0.48],
    [0.73, 0.66],
    [0.65, 0.82],
    [0.53, 0.76],
    [0.44, 0.65],
    [0.39, 0.48],
    [0.35, 0.34],
    [0.42, 0.18],
  ];

  ctx.save();
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    const px = x * width;
    const py = y * height;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = "#edf4ec";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(67, 139, 90, 0.36)";
  ctx.stroke();

  ctx.strokeStyle = "rgba(67, 139, 90, 0.16)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.ellipse(width * (0.5 + i * 0.025), height * (0.22 + i * 0.07), 70 - i * 3, 22 + i * 2, 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.ellipse(width * 0.39, height * 0.89, width * 0.09, height * 0.035, -0.05, 0, Math.PI * 2);
  ctx.fillStyle = "#edf4ec";
  ctx.fill();
  ctx.strokeStyle = "rgba(67, 139, 90, 0.36)";
  ctx.stroke();
  ctx.restore();
}

function drawRiskField(width, height) {
  const scenario = getScenario();
  stations.forEach((s) => {
    const weather = deriveWeather(s, scenario);
    const score = scoreWeather(weather);
    const cx = s.x * width;
    const cy = s.y * height;
    const radius = 110 + score.risk * 155;
    const gradient = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius);
    gradient.addColorStop(0, `rgba(211, 95, 111, ${0.18 + score.risk * 0.36})`);
    gradient.addColorStop(0.45, `rgba(85, 156, 210, ${score.risk * 0.22})`);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawWindParticles(width, height, station, weather, score) {
  const rad = ((station.windDir - 90) * Math.PI) / 180;
  const vx = Math.cos(rad);
  const vy = Math.sin(rad);
  const opacity = clamp(score.spread + weather.wind / 8, 0.14, 0.78);
  ctx.save();
  ctx.strokeStyle = `rgba(21, 32, 51, ${opacity})`;
  ctx.lineWidth = 2;
  for (let i = 0; i < 26; i += 1) {
    const seedX = ((i * 83 + animationFrame * (1.2 + weather.wind * 0.16)) % (width + 160)) - 80;
    const seedY = 70 + ((i * 59) % (height - 130));
    const x = seedX;
    const y = seedY + Math.sin(animationFrame / 22 + i) * 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + vx * (22 + weather.wind * 3), y + vy * (22 + weather.wind * 3));
    ctx.stroke();
  }
  ctx.restore();
}

function drawStations(width, height) {
  const scenario = getScenario();
  stations.forEach((s) => {
    const weather = deriveWeather(s, scenario);
    const score = scoreWeather(weather);
    const x = s.x * width;
    const y = s.y * height;
    const selected = s.id === selectedStationId;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, selected ? 13 : 9, 0, Math.PI * 2);
    ctx.fillStyle = score.risk > 0.66 ? "#d35f6f" : score.risk > 0.38 ? "#d99a2b" : "#438b5a";
    ctx.fill();
    ctx.lineWidth = selected ? 5 : 3;
    ctx.strokeStyle = selected ? "rgba(21, 32, 51, 0.32)" : "rgba(255,255,255,0.82)";
    ctx.stroke();

    ctx.font = selected ? "800 19px system-ui" : "800 15px system-ui";
    ctx.fillStyle = "#152033";
    ctx.fillText(s.name, x + 15, y - 13);
    ctx.font = "700 13px system-ui";
    ctx.fillStyle = "#69758a";
    ctx.fillText(`${Math.round(score.risk * 100)}%`, x + 15, y + 8);
    ctx.restore();
  });
}

function drawFogPlume(width, height, station, score) {
  const x = station.x * width;
  const y = station.y * height;
  const rad = ((station.windDir - 90) * Math.PI) / 180;
  const dx = Math.cos(rad) * 80 * score.spread;
  const dy = Math.sin(rad) * 80 * score.spread;
  ctx.save();
  ctx.translate(x + dx, y + dy);
  ctx.rotate(rad);
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(i * 28, Math.sin(animationFrame / 18 + i) * 8, 96 + score.risk * 140 - i * 10, 34 + score.risk * 54, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(246, 250, 252, ${0.2 + score.risk * 0.26})`;
    ctx.fill();
  }
  ctx.restore();
}

function update() {
  const station = getSelectedStation();
  const scenario = getScenario();
  const weather = deriveWeather(station, scenario);
  const score = scoreWeather(weather);
  const riskPercent = Math.round(score.risk * 100);

  elements.stationName.textContent = station.name;
  elements.timeLabel.textContent = formatHour(weather.hour);
  elements.hourReadout.textContent = formatHour(weather.hour);
  elements.phaseText.textContent = phaseName(score.phase);
  elements.riskLabel.textContent = `${riskPercent}%`;
  elements.tempValue.textContent = `${weather.temp.toFixed(1)}°C`;
  elements.rhValue.textContent = `${Math.round(weather.rh)}%`;
  elements.dewGapValue.textContent = `${weather.dewGap.toFixed(1)}°C`;
  elements.visibilityValue.textContent = `${weather.vis.toFixed(1)} km`;
  elements.windLabel.textContent = `${windDirectionName(station.windDir)} ${weather.wind.toFixed(1)} m/s`;
  elements.windArrow.style.transform = `rotate(${station.windDir}deg)`;
  elements.aiNarrative.textContent = narrative(station, weather, score);
  elements.humidityReadout.textContent = `${scenario.humidity >= 0 ? "+" : ""}${scenario.humidity}%`;
  elements.windReadout.textContent = `${scenario.wind >= 0 ? "+" : ""}${scenario.wind.toFixed(1)} m/s`;
  elements.solarReadout.textContent = `${scenario.solar >= 0 ? "+" : ""}${scenario.solar} W/m²`;
  elements.rainReadout.textContent = `${scenario.rain.toFixed(1)} mm`;
  elements.formationBar.style.width = `${Math.round(score.formation * 100)}%`;
  elements.spreadBar.style.width = `${Math.round(score.spread * 100)}%`;
  elements.dissipationBar.style.width = `${Math.round(score.dissipation * 100)}%`;

  document.querySelectorAll(".station-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.stationId === selectedStationId);
  });

  document.querySelectorAll("[data-phase-card]").forEach((card) => {
    card.classList.toggle("active", card.dataset.phaseCard === score.phase);
  });

  drawMap(station, weather, score);
}

function animate() {
  animationFrame += 1;
  update();
  requestAnimationFrame(animate);
}

Object.values(elements)
  .filter((element) => element instanceof HTMLInputElement)
  .forEach((element) => element.addEventListener("input", update));

buildStationButtons();
animate();
