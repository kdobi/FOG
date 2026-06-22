import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const tabs = [
  { id: "compare", label: "구름과 안개" },
  { id: "lab", label: "안개 생성 실험실" },
  { id: "types", label: "안개 발생 예측" },
  { id: "visibility", label: "가시거리 위험 체험" },
];

const FOG_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const fogTypes = {
  radiation: {
    label: "복사안개",
    category: "cooling",
    categoryLabel: "냉각안개",
    station: { name: "전주", code: "146", terrain: "내륙 평야", x: 42, y: 58 },
    scene: "radiation",
    mode: "ground",
    wind: 0.18,
    description: "맑고 바람이 약한 밤, 지면이 식으며 지표 가까운 공기도 냉각되어 생깁니다.",
    conditions: ["밤 또는 새벽", "습도 높음", "바람 약함"],
    clears: ["해가 떠 지면이 데워짐", "바람 강해짐"],
    observationNote: "새벽으로 갈수록 기온과 이슬점의 차이가 좁아지고 시정이 짧아지는 흐름을 살펴보세요.",
    observations: [
      { time: "00:00", temp: 12.4, dewPoint: 10.1, humidity: 86, wind: 1.4, visibility: 4200, rain: 0, solar: 0, surfaceTemp: 9.8 },
      { time: "03:00", temp: 10.2, dewPoint: 9.4, humidity: 95, wind: 0.8, visibility: 1400, rain: 0, solar: 0, surfaceTemp: 7.6 },
      { time: "06:00", temp: 9.6, dewPoint: 9.3, humidity: 98, wind: 0.5, visibility: 480, rain: 0, solar: 0, surfaceTemp: 7.1 },
      { time: "09:00", temp: 13.1, dewPoint: 10.2, humidity: 82, wind: 1.6, visibility: 2600, rain: 0, solar: 0.72, surfaceTemp: 16.4 },
      { time: "12:00", temp: 18.3, dewPoint: 10.7, humidity: 61, wind: 2.4, visibility: 10000, rain: 0, solar: 2.11, surfaceTemp: 24.8 },
    ],
  },
  advection: {
    label: "이류안개",
    category: "cooling",
    categoryLabel: "냉각안개",
    station: { name: "인천", code: "112", terrain: "서해안", x: 29, y: 31 },
    scene: "advection",
    mode: "sea",
    wind: 0.55,
    description: "따뜻하고 습한 공기가 차가운 수면 위를 지나며 넓은 해무를 만듭니다.",
    conditions: ["따뜻하고 습한 공기", "차가운 바다나 호수", "수평 이동"],
    clears: ["공기 흐름 변화", "건조한 공기 유입"],
    observationNote: "해안에서는 바람이 있어도 습한 공기가 차가운 바다 위를 계속 지나면 낮은 시정이 오래 이어질 수 있습니다.",
    observations: [
      { time: "00:00", temp: 15.8, dewPoint: 14.9, humidity: 94, wind: 2.1, visibility: 2300, rain: 0, solar: 0, surfaceTemp: 14.1 },
      { time: "03:00", temp: 15.2, dewPoint: 14.8, humidity: 97, wind: 2.8, visibility: 850, rain: 0, solar: 0, surfaceTemp: 13.8 },
      { time: "06:00", temp: 15.1, dewPoint: 14.9, humidity: 99, wind: 3.2, visibility: 360, rain: 0, solar: 0.03, surfaceTemp: 13.6 },
      { time: "09:00", temp: 16.4, dewPoint: 15.6, humidity: 95, wind: 3.5, visibility: 620, rain: 0, solar: 0.24, surfaceTemp: 14.2 },
      { time: "12:00", temp: 18.2, dewPoint: 16.1, humidity: 87, wind: 4.1, visibility: 1800, rain: 0, solar: 0.61, surfaceTemp: 15.1 },
    ],
  },
  upslope: {
    label: "활승안개",
    category: "cooling",
    categoryLabel: "냉각안개",
    station: { name: "대관령", code: "100", terrain: "산지", x: 61, y: 28 },
    scene: "upslope",
    mode: "slope",
    wind: 0.7,
    description: "습한 공기가 산비탈을 타고 오르며 냉각되어 산 중턱에 안개가 생깁니다.",
    conditions: ["습한 공기", "산지 지형", "비탈을 오르는 바람"],
    clears: ["공기가 건조해짐", "상승 흐름 약화"],
    observationNote: "다른 안개와 달리 산비탈을 오르는 습한 바람이 이어지면 풍속이 다소 높아도 안개가 유지될 수 있습니다.",
    observations: [
      { time: "00:00", temp: 8.6, dewPoint: 7.8, humidity: 95, wind: 3.8, visibility: 1700, rain: 0, solar: 0, surfaceTemp: 8.1 },
      { time: "03:00", temp: 7.9, dewPoint: 7.5, humidity: 97, wind: 4.2, visibility: 720, rain: 0, solar: 0, surfaceTemp: 7.4 },
      { time: "06:00", temp: 7.4, dewPoint: 7.2, humidity: 99, wind: 4.6, visibility: 290, rain: 0.1, solar: 0, surfaceTemp: 7.0 },
      { time: "09:00", temp: 8.3, dewPoint: 8.0, humidity: 98, wind: 5.1, visibility: 410, rain: 0.2, solar: 0.08, surfaceTemp: 8.0 },
      { time: "12:00", temp: 10.7, dewPoint: 9.4, humidity: 91, wind: 4.3, visibility: 1300, rain: 0, solar: 0.42, surfaceTemp: 11.2 },
    ],
  },
  frontal: {
    label: "전선안개",
    category: "evaporation",
    categoryLabel: "증발안개",
    station: { name: "서울", code: "108", terrain: "수도권 내륙", x: 37, y: 28 },
    scene: "frontal",
    mode: "rain",
    wind: 0.38,
    description: "따뜻한 비가 찬 공기층으로 떨어지며 수증기를 늘려 안개를 만듭니다.",
    conditions: ["따뜻한 공기와 찬 공기의 경계", "약한 비", "찬 지표 공기층"],
    clears: ["전선 이동", "비 약화"],
    observationNote: "전선안개는 특정 지역보다 전선의 이동과 관련되므로, 서울에서 약한 비와 시정 저하가 함께 나타난 사례로 탐구합니다.",
    observations: [
      { time: "00:00", temp: 5.8, dewPoint: 3.7, humidity: 86, wind: 1.7, visibility: 3600, rain: 0, solar: 0, surfaceTemp: 5.1 },
      { time: "03:00", temp: 5.3, dewPoint: 4.6, humidity: 95, wind: 1.4, visibility: 1200, rain: 0.4, solar: 0, surfaceTemp: 4.9 },
      { time: "06:00", temp: 5.1, dewPoint: 4.9, humidity: 99, wind: 1.2, visibility: 540, rain: 1.2, solar: 0, surfaceTemp: 4.8 },
      { time: "09:00", temp: 6.4, dewPoint: 6.0, humidity: 97, wind: 1.9, visibility: 760, rain: 0.8, solar: 0.02, surfaceTemp: 6.0 },
      { time: "12:00", temp: 8.9, dewPoint: 7.4, humidity: 90, wind: 2.8, visibility: 2400, rain: 0.1, solar: 0.18, surfaceTemp: 8.7 },
    ],
  },
  steam: {
    label: "김안개",
    category: "evaporation",
    categoryLabel: "증발안개",
    station: { name: "북춘천", code: "093", terrain: "호수 인접", x: 49, y: 24 },
    scene: "steam",
    mode: "steam",
    wind: 0.28,
    description: "차가운 공기가 따뜻한 수면 위를 지나며 김처럼 오른 수증기가 바로 응결합니다.",
    conditions: ["차갑고 건조한 공기", "따뜻한 강이나 호수", "수면의 수증기 공급"],
    clears: ["수온과 기온 차이 감소", "바람 강해짐"],
    observationNote: "늦가을과 초겨울, 차가운 공기와 상대적으로 따뜻한 수면이 만날 때 수면 가까이 김처럼 피어오르는 모습을 살펴봅니다.",
    observations: [
      { time: "00:00", temp: 2.8, dewPoint: 0.4, humidity: 84, wind: 0.7, visibility: 3400, rain: 0, solar: 0, surfaceTemp: 3.1 },
      { time: "03:00", temp: 0.6, dewPoint: -0.2, humidity: 94, wind: 0.5, visibility: 1500, rain: 0, solar: 0, surfaceTemp: 1.2 },
      { time: "06:00", temp: -0.8, dewPoint: -1.1, humidity: 98, wind: 0.4, visibility: 680, rain: 0, solar: 0, surfaceTemp: 0.3 },
      { time: "09:00", temp: 1.9, dewPoint: 0.8, humidity: 92, wind: 0.8, visibility: 1300, rain: 0, solar: 0.34, surfaceTemp: 3.5 },
      { time: "12:00", temp: 6.8, dewPoint: 1.5, humidity: 69, wind: 1.6, visibility: 7600, rain: 0, solar: 1.38, surfaceTemp: 9.1 },
    ],
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function FogCanvas({ density, mode = "ground", wind = 0.35 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frameId;
    let particles = [];

    function createParticle(width, height) {
      const sizeBase = mode === "cloud" ? 80 : mode === "steam" ? 34 : 54;
      const radius = sizeBase + Math.random() * sizeBase * 1.8;
      let y = Math.random() * height;

      if (mode === "cloud") y = height * (0.08 + Math.random() * 0.34);
      if (mode === "ground" || mode === "sea") y = height * (0.56 + Math.random() * 0.36);
      if (mode === "slope") y = height * (0.28 + Math.random() * 0.42);
      if (mode === "steam") y = height * (0.55 + Math.random() * 0.3);
      if (mode === "rain") y = height * (0.38 + Math.random() * 0.45);

      return {
        x: Math.random() * width,
        y,
        radius,
        alpha: 0.25 + Math.random() * 0.55,
        drift: 0.12 + Math.random() * 0.38,
        lift: mode === "steam" ? -0.28 - Math.random() * 0.38 : (Math.random() - 0.5) * 0.06,
        wobble: Math.random() * Math.PI * 2,
      };
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(18 + density * 120);
      particles = Array.from({ length: count }, () => createParticle(rect.width, rect.height));
    }

    function draw() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.filter = "blur(13px)";

      particles.forEach((particle) => {
        particle.wobble += 0.008;
        particle.x += particle.drift * (0.24 + wind) + Math.sin(particle.wobble) * 0.08;
        particle.y += particle.lift;

        if (particle.x - particle.radius > width) particle.x = -particle.radius;
        if (particle.y + particle.radius < 0) particle.y = height + particle.radius * 0.4;
        if (particle.y - particle.radius > height) particle.y = -particle.radius;

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius,
        );
        const alpha = clamp((0.045 + density * 0.17) * particle.alpha, 0.02, 0.22);
        gradient.addColorStop(0, `rgba(238, 251, 255, ${alpha})`);
        gradient.addColorStop(0.62, `rgba(205, 232, 240, ${alpha * 0.62})`);
        gradient.addColorStop(1, "rgba(205, 232, 240, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(
          particle.x,
          particle.y,
          particle.radius * 1.55,
          particle.radius * 0.64,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      });

      ctx.restore();
      frameId = window.requestAnimationFrame(draw);
    }

    resize();
    draw();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [density, mode, wind]);

  return <canvas className="fog-canvas" ref={canvasRef} aria-hidden="true" />;
}

function RangeControl({ label, value, min, max, step = 1, unit = "", onChange }) {
  const precision = String(step).includes(".") ? String(step).split(".")[1].length : 0;
  const updateBy = (direction) => {
    const nextValue = clamp(Number(value) + direction * Number(step), min, max);
    onChange(Number(nextValue.toFixed(precision)));
  };

  return (
    <label className="range-control">
      <span className="control-label">{label}</span>
      <strong>
        {value}
        {unit}
      </strong>
      <div className="range-row">
        <button aria-label={`${label} 낮추기`} type="button" onClick={() => updateBy(-1)}>
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          onInput={(event) => onChange(Number(event.currentTarget.value))}
        />
        <button aria-label={`${label} 높이기`} type="button" onClick={() => updateBy(1)}>
          +
        </button>
      </div>
    </label>
  );
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div className="segmented-group">
      <span className="control-label">{label}</span>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            className={value === option.value ? "active" : ""}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Readout({ label, value, tone = "cyan" }) {
  return (
    <div className={`readout ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CompareTab() {
  const [observerHeight, setObserverHeight] = useState(24);
  const isFog = observerHeight < 48;
  const density = isFog
    ? clamp(0.2 + (48 - observerHeight) / 46, 0.16, 0.92)
    : clamp(0.16 + (observerHeight - 48) / 105, 0.14, 0.64);

  const message = isFog
    ? "지표 근처에 떠 있는 구름처럼 보입니다. 이것이 안개입니다."
    : "높이 떠 있으면 같은 물방울도 구름으로 관찰됩니다.";

  return (
    <section className="workspace two-column">
      <div className="simulation-stage compare-stage">
        <div className="sky-gradient" />
        <div className="sun" />
        <div className="high-cloud one" />
        <div className="high-cloud two" />
        <div className="mountain ridge-back" />
        <div className="mountain ridge-front" />
        <div className="ground-plane" />
        <div className="height-track">
          <span>하늘</span>
          <i style={{ bottom: `${observerHeight}%` }} />
          <span>지표</span>
        </div>
        <FogCanvas density={density} mode={isFog ? "ground" : "cloud"} wind={0.22} />
      </div>

      <aside className="control-panel">
        <div className="panel-title">
          <span>관찰 위치</span>
          <strong>{isFog ? "안개" : "구름"}</strong>
        </div>
        <RangeControl
          label="높이"
          min={0}
          max={100}
          value={observerHeight}
          unit="%"
          onChange={setObserverHeight}
        />
        <div className="statement">
          <strong>{message}</strong>
          <p>둘 다 작은 물방울이나 얼음 방울이 떠서 보이는 현상이며, 차이는 위치에 있습니다.</p>
        </div>
        <div className="fact-strip">
          <span>가시거리 기준</span>
          <strong>1 km 미만이면 안개</strong>
        </div>
      </aside>
    </section>
  );
}

function getLabState({ airTemp, surfaceTemp, humidity, wind, timeOfDay, vapor }) {
  const dewGap = clamp((100 - humidity) / 5, 0, 8);
  const tempGap = Math.abs(airTemp - surfaceTemp);
  const coldSurface = airTemp > surfaceTemp;
  const humidityScore = clamp((humidity - 58) / 42, 0, 1);
  const dewScore = clamp((5.5 - dewGap) / 5.5, 0, 1);
  const tempGapScore = clamp(tempGap / 16, 0, 1);
  const windPenalty = clamp((wind - 2.6) / 5.4, 0, 0.82);
  const nightBoost = timeOfDay === "night" ? 0.17 : timeOfDay === "morning" ? 0.07 : -0.22;
  const vaporBoost = vapor === "high" ? 0.12 : -0.03;
  const coldSurfaceBoost = coldSurface ? 0.07 : 0.03;

  const density = clamp(
    humidityScore * 0.34 +
      dewScore * 0.24 +
      tempGapScore * 0.2 +
      nightBoost +
      vaporBoost +
      coldSurfaceBoost -
      windPenalty,
    0,
    1,
  );

  let status = "조건이 아직 충분하지 않아 안개가 옅게만 나타납니다.";
  if (wind >= 6) {
    status = "바람이 강해 하층과 상층 공기가 섞이며 안개가 흩어집니다.";
  } else if (timeOfDay === "day" && density < 0.46) {
    status = "해가 뜨며 지면이 데워져 안개가 약해지고 있습니다.";
  } else if (humidity >= 86 && coldSurface) {
    status = "습도가 높고 지면이 차가워 공기가 포화 상태에 가까워졌습니다.";
  } else if (humidity >= 84 && !coldSurface) {
    status = "따뜻한 수면에서 수증기가 공급되어 낮은 층에 물방울이 늘어납니다.";
  } else if (density >= 0.62) {
    status = "공기가 이슬점에 가까워져 작은 물방울이 빠르게 늘고 있습니다.";
  } else if (humidity < 64) {
    status = "습도가 낮아 응결할 수증기가 부족합니다.";
  }

  return { density, dewGap, tempGap, status };
}

function LabTab() {
  const [airTemp, setAirTemp] = useState(14);
  const [surfaceTemp, setSurfaceTemp] = useState(7);
  const [humidity, setHumidity] = useState(88);
  const [wind, setWind] = useState(1.4);
  const [timeOfDay, setTimeOfDay] = useState("night");
  const [vapor, setVapor] = useState("high");

  const labState = useMemo(
    () => getLabState({ airTemp, surfaceTemp, humidity, wind, timeOfDay, vapor }),
    [airTemp, surfaceTemp, humidity, wind, timeOfDay, vapor],
  );
  const candyFog = Math.round(labState.density * 100);
  const sugarLevel = humidity >= 82 ? "설탕 많음" : humidity >= 62 ? "설탕 보통" : "설탕 적음";
  const windLevel = wind >= 5 ? "강한 바람" : wind >= 2.4 ? "살짝 흔들림" : "차분함";
  const candyStep =
    wind >= 5
      ? "솜이 흩어지는 중"
      : labState.density >= 0.68
        ? "막대에 감는 중"
        : humidity >= 66
          ? "하얀 실이 나오는 중"
          : "설탕을 넣는 중";
  const candyStory =
    wind >= 5
      ? "선풍기 바람이 강해서 하얀 솜이 흩어지는 장면입니다."
      : humidity >= 82
        ? "설탕이 많아 하얀 솜이 빠르게 모이는 장면입니다."
        : "재료가 적어 하얀 솜이 천천히 생기는 장면입니다.";

  return (
    <section className="workspace two-column">
      <div className={`simulation-stage lab-stage ${timeOfDay}`}>
        <div className="lab-horizon" />
        <div className="surface-water" />
        <div className="cool-ground" style={{ opacity: clamp((airTemp - surfaceTemp) / 16, 0.15, 0.78) }} />
        <div className="sensor air">
          <span>공기</span>
          <strong>{airTemp}°C</strong>
        </div>
        <div className="sensor surface">
          <span>지면/수면</span>
          <strong>{surfaceTemp}°C</strong>
        </div>
        <div
          className="cotton-machine"
          style={{
            "--candy-opacity": 0.22 + labState.density * 0.68,
            "--candy-scale": 0.72 + labState.density * 0.45,
            "--sugar-fill": `${humidity}%`,
            "--spin-speed": `${clamp(4.4 - labState.density * 2.4, 1.4, 4.4)}s`,
            "--wind-lean": `${clamp(wind * 2.1, 0, 17)}deg`,
          }}
        >
          <div className="machine-label">
            <span>솜사탕 만들기</span>
            <strong>{candyStep}</strong>
          </div>
          <div className="sugar-hopper">
            <span>설탕</span>
            <i />
          </div>
          <div className="machine-bowl">
            <div className="bowl-rim" />
            <div className="spinner-head">
              <span />
              <span />
              <span />
            </div>
            <div className="sugar-sprinkles">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <i />
            <i />
            <i />
          </div>
          <div className="paper-stick" />
          <div className="cotton-floss">
            <span />
            <span />
            <span />
          </div>
          <div className="floss-stream">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="vapor-streams" data-level={vapor} />
        <FogCanvas density={labState.density} mode="ground" wind={wind / 7} />
        <div className="stage-caption">{labState.status}</div>
      </div>

      <aside className="control-panel lab-controls">
        <div className="readout-grid">
          <Readout label="안개 농도" value={`${Math.round(labState.density * 100)}%`} />
          <Readout label="이슬점차" value={`${labState.dewGap.toFixed(1)}°C`} tone="blue" />
        </div>
        <div className="candy-panel">
          <div className="mini-title">
            <span>솜사탕 기계로 이해하기</span>
            <strong>{candyFog}%</strong>
          </div>
          <p>{candyStory}</p>
          <div className="making-readouts">
            <div>
              <span>현재 재료</span>
              <strong>{sugarLevel}</strong>
            </div>
            <div>
              <span>기계 상태</span>
              <strong>{candyStep}</strong>
            </div>
          </div>
          <div className="mapping-grid">
            <div>
              <span>대기</span>
              <strong>기계 안</strong>
            </div>
            <div>
              <span>수증기</span>
              <strong>설탕</strong>
            </div>
            <div>
              <span>습도</span>
              <strong>설탕 양</strong>
            </div>
            <div>
              <span>응결</span>
              <strong>하얀 실</strong>
            </div>
            <div>
              <span>안개 농도</span>
              <strong>솜의 양</strong>
            </div>
            <div>
              <span>바람</span>
              <strong>{windLevel}</strong>
            </div>
          </div>
        </div>
        <RangeControl label="공기 온도" min={-5} max={30} value={airTemp} unit="°C" onChange={setAirTemp} />
        <RangeControl
          label="지면/수면 온도"
          min={-5}
          max={30}
          value={surfaceTemp}
          unit="°C"
          onChange={setSurfaceTemp}
        />
        <RangeControl label="습도" min={30} max={100} value={humidity} unit="%" onChange={setHumidity} />
        <RangeControl
          label="바람 세기"
          min={0}
          max={9}
          step={0.1}
          value={wind}
          unit=" m/s"
          onChange={setWind}
        />
        <SegmentedControl
          label="시간대"
          value={timeOfDay}
          onChange={setTimeOfDay}
          options={[
            { value: "night", label: "밤" },
            { value: "morning", label: "아침" },
            { value: "day", label: "낮" },
          ]}
        />
        <SegmentedControl
          label="수증기 공급"
          value={vapor}
          onChange={setVapor}
          options={[
            { value: "low", label: "낮음" },
            { value: "high", label: "높음" },
          ]}
        />
        <div className="activity-strip">
          <span>체험 순서</span>
          <strong>설탕 양 조절 → 하얀 실 관찰 → 바람으로 흩어보기</strong>
        </div>
      </aside>
    </section>
  );
}

function formatVisibility(visibility) {
  if (visibility >= 1000) return `${(visibility / 1000).toFixed(1)} km`;
  return `${Math.round(visibility)} m`;
}

function normalizeObservation(item) {
  const observedAt = item.observedAt || item.time || item.tm || "";
  const time = String(observedAt).includes(" ") ? String(observedAt).split(" ")[1].slice(0, 5) : String(observedAt).slice(0, 5);
  return {
    time,
    temp: Number(item.airTemperature ?? item.temp ?? item.ta),
    dewPoint: Number(item.dewPoint ?? item.td),
    humidity: Number(item.relativeHumidity ?? item.humidity ?? item.hm),
    wind: Number(item.windSpeed ?? item.wind ?? item.ws),
    visibility: Number(item.visibility),
    rain: Number(item.rainfall ?? item.rain ?? item.rn ?? 0),
    solar: Number(item.solarRadiation ?? item.solar ?? item.si ?? 0),
    surfaceTemp: Number(item.surfaceTemperature ?? item.surfaceTemp ?? item.ts ?? 0),
  };
}

function displayObservedAt(value) {
  if (!value) return "관측 시각 확인 중";
  const compact = String(value).replace(/\D/g, "");
  if (compact.length >= 12 && !String(value).includes("학습용")) {
    return `${compact.slice(0, 4)}.${compact.slice(4, 6)}.${compact.slice(6, 8)} ${compact.slice(8, 10)}:${compact.slice(10, 12)} KST`;
  }
  return String(value).replace("T", " ");
}

function createLocalDemoChallenge(typeId, round) {
  const type = fogTypes[typeId];
  const fogIndex = Math.min(2, type.observations.length - 1);
  const clearIndex = type.observations.length - 1;
  const observation = type.observations[round % 2 === 0 ? fogIndex : clearIndex];
  const actualFog = observation.visibility < 1000;
  const challengeId = `local-${typeId}-${round}-${Date.now()}`;

  return {
    question: {
      challengeId,
      station: {
        code: type.station.code,
        name: type.station.name,
        terrain: type.station.terrain,
      },
      observedAt: `학습용 예시 · ${observation.time}`,
      clues: {
        temperature: observation.temp,
        dewPoint: observation.dewPoint,
        humidity: observation.humidity,
        windSpeed: observation.wind,
        dewPointGap: Math.max(0, observation.temp - observation.dewPoint),
      },
      sourceType: "DEMO_SAMPLE",
      sourceLabel: "학습용 데모 · 백엔드 연결 전",
    },
    answer: {
      correct: false,
      actualFog,
      visibilityRaw: Math.round(observation.visibility / 10),
      visibilityMeters: observation.visibility,
      weatherDescription: actualFog ? "안개 관측 코드" : "안개 관측 코드 없음",
      explanation: actualFog
        ? `시정이 ${formatVisibility(observation.visibility)}로 1 km 미만입니다. 이슬점차는 ${Math.max(0, observation.temp - observation.dewPoint).toFixed(1)}°C, 습도는 ${observation.humidity}%입니다.`
        : `시정이 ${formatVisibility(observation.visibility)}로 1 km 이상이어서 기상청 기준의 안개가 아닙니다.`,
      sourceType: "DEMO_SAMPLE",
    },
  };
}

function StationMapSelection({ onSelect, score }) {
  return (
    <section className="workspace station-map-workspace" data-testid="station-map-selection">
      <div className="station-map-stage">
        <div className="station-map-atmosphere" aria-hidden="true" />
        <div className="station-map-heading">
          <span>ASOS FOG CHALLENGE</span>
          <strong>관측지점을 지도에서 선택하세요</strong>
          <p>마커를 누르면 해당 지역의 기온·이슬점·습도·풍속 문제가 시작됩니다.</p>
        </div>

        <div className="station-map-score" aria-label={`현재 점수 ${score.correct} / ${score.total}`}>
          <span>MY SCORE</span>
          <strong>{score.correct} / {score.total}</strong>
        </div>

        <div className="station-map-board">
          <svg viewBox="0 0 260 390" aria-hidden="true">
            <path
              className="station-map-land"
              d="M136 17 C164 31 176 57 169 83 C194 108 189 142 173 163 C185 193 178 224 157 245 C170 276 154 305 128 322 C118 343 94 344 82 324 C66 304 73 278 91 260 C75 235 71 204 85 178 C66 150 71 118 94 98 C87 68 105 34 136 17 Z"
            />
            <ellipse className="station-map-land" cx="86" cy="357" rx="30" ry="11" transform="rotate(-8 86 357)" />
            <path className="station-map-grid" d="M93 101 C118 119 145 120 178 111 M82 181 C112 188 145 187 178 172 M83 260 C109 251 139 260 163 276" />
          </svg>

          {Object.entries(fogTypes).map(([id, item]) => (
            <div
              className="station-map-point"
              data-station={item.station.code}
              key={id}
              style={{ left: `${item.station.x}%`, top: `${item.station.y}%` }}
            >
              <i aria-hidden="true" />
              <button
                data-testid={`map-station-${item.station.code}`}
                type="button"
                onClick={() => onSelect(id)}
              >
                <span>{item.station.name}</span>
                <small>ASOS {item.station.code} · {item.station.terrain}</small>
              </button>
            </div>
          ))}
        </div>

        <div className="station-map-guide">
          <span><i />클릭 가능한 ASOS 관측지점</span>
          <p>현재 인증키가 없으면 학습용 예시로, KMA_API_KEY 연결 시 기상청 실관측으로 전환됩니다.</p>
        </div>
      </div>
    </section>
  );
}

function TypeQuizStage({ type, challenge, result, loading }) {
  if (loading || !challenge) {
    return (
      <div className={`simulation-stage data-type-stage ${type.scene}`} data-testid="fog-data-stage">
        <div className="quiz-loading"><i />관측 문제를 불러오는 중입니다.</div>
      </div>
    );
  }

  const clues = challenge.clues;
  const visibility = result?.visibilityMeters ?? 2000;
  const fogDensity = result
    ? clamp((1500 - visibility) / 1350, result.actualFog ? 0.18 : 0.02, 0.92)
    : 0.02;
  const markerPosition = clamp((visibility / 2000) * 100, 1, 99);

  return (
    <div className={`simulation-stage data-type-stage ${type.scene}`} data-testid="fog-data-stage">
      <div className="data-atmosphere" aria-hidden="true" />
      <div className="data-landform" aria-hidden="true" />

      <div className="type-stage-heading">
        <span>ASOS 관측 퀴즈</span>
        <strong>이 지역에 안개가 생겼을까요?</strong>
      </div>

      <div className="location-map">
        <div className="location-map-title">
          <span>선택 관측지점</span>
          <strong>ASOS {challenge.station.code}</strong>
        </div>
        <svg viewBox="0 0 260 390" aria-hidden="true">
          <path
            className="korea-land"
            d="M136 17 C164 31 176 57 169 83 C194 108 189 142 173 163 C185 193 178 224 157 245 C170 276 154 305 128 322 C118 343 94 344 82 324 C66 304 73 278 91 260 C75 235 71 204 85 178 C66 150 71 118 94 98 C87 68 105 34 136 17 Z"
          />
          <ellipse className="korea-island" cx="86" cy="357" rx="30" ry="11" transform="rotate(-8 86 357)" />
        </svg>
        <div
          className="station-marker"
          style={{ left: `${type.station.x}%`, top: `${type.station.y}%` }}
          aria-label={`${challenge.station.name} 관측지점`}
        >
          <i />
          <strong>{challenge.station.name}</strong>
          <span>{challenge.station.terrain}</span>
        </div>
      </div>

      <div className="data-snapshot quiz-snapshot">
        <div className="snapshot-head">
          <div>
            <span>{displayObservedAt(challenge.observedAt)}</span>
            <strong>{result ? (result.actualFog ? "안개 발생" : "안개 미발생") : "4가지 단서만 공개"}</strong>
          </div>
          <em className={result ? (result.actualFog ? "fog-now" : "clear-now") : "locked-now"}>
            {result ? formatVisibility(visibility) : "VS 비공개"}
          </em>
        </div>
        <div className="snapshot-grid">
          <Readout label="기온 TA" value={`${Number(clues.temperature).toFixed(1)}°C`} />
          <Readout label="이슬점 TD" value={`${Number(clues.dewPoint).toFixed(1)}°C`} tone="blue" />
          <Readout label="습도 HM" value={`${Math.round(clues.humidity)}%`} />
          <Readout label="풍속 WS" value={`${Number(clues.windSpeed).toFixed(1)}m/s`} tone="blue" />
        </div>
        <p>이슬점차 TA−TD <strong>{Number(clues.dewPointGap).toFixed(1)}°C</strong> · 시정(VS)과 현재일기(WW)는 예측 후 공개</p>
      </div>

      <FogCanvas density={fogDensity} mode={type.mode} wind={result ? type.wind : 0.1} />

      <div className={`observation-chart-card quiz-reveal-card ${result ? "revealed" : "locked"}`}>
        {!result ? (
          <div className="quiz-lock-message">
            <span>VS · WW LOCKED</span>
            <strong>시정과 현재일기는 정답입니다</strong>
            <p>기온·이슬점·습도·풍속만 보고 먼저 판단해보세요.</p>
          </div>
        ) : (
          <>
            <div className="chart-card-head">
              <div>
                <span>실제 관측 결과</span>
                <strong>{result.weatherDescription}</strong>
              </div>
              <em>{formatVisibility(visibility)}</em>
            </div>
            <div className="visibility-ruler" aria-label={`실제 시정 ${visibility}m`}>
              <div className="fog-range"><span>안개 구간</span></div>
              <div className="clear-range"><span>1 km 이상</span></div>
              <i style={{ left: `${markerPosition}%` }}><b>{visibility}m</b></i>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TypesTab() {
  const [selected, setSelected] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const challengeOriginRef = useRef("local");
  const localAnswerRef = useRef(null);
  const requestSequenceRef = useRef(0);
  const type = selected ? fogTypes[selected] : null;

  async function loadChallenge(typeId, roundNumber) {
    const sequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = sequence;
    setLoading(true);
    setPrediction(null);
    setResult(null);

    if (FOG_API_BASE_URL) {
      try {
        const stationCode = fogTypes[typeId].station.code;
        const response = await fetch(`${FOG_API_BASE_URL}/api/v1/fog-challenges?station=${stationCode}`);
        if (!response.ok) throw new Error("문제 API 응답 오류");
        const payload = await response.json();
        if (!payload.challengeId || !payload.clues) throw new Error("문제 API 형식 오류");
        if (requestSequenceRef.current !== sequence) return;
        challengeOriginRef.current = "backend";
        localAnswerRef.current = null;
        setChallenge(payload);
        setLoading(false);
        return;
      } catch (error) {
        if (requestSequenceRef.current !== sequence) return;
      }
    }

    const demo = createLocalDemoChallenge(typeId, roundNumber);
    challengeOriginRef.current = "local";
    localAnswerRef.current = demo.answer;
    setChallenge(demo.question);
    setLoading(false);
  }

  useEffect(() => {
    if (!selected) return undefined;
    setRound(0);
    loadChallenge(selected, 0);
  }, [selected]);

  async function submitPrediction() {
    if (!prediction || !challenge || submitting) return;
    setSubmitting(true);

    try {
      let answer;
      if (challengeOriginRef.current === "backend") {
        const response = await fetch(
          `${FOG_API_BASE_URL}/api/v1/fog-challenges/${challenge.challengeId}/answers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prediction }),
          },
        );
        if (!response.ok) throw new Error("정답 API 응답 오류");
        answer = await response.json();
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 320));
        answer = {
          ...localAnswerRef.current,
          correct: (prediction === "FOG") === localAnswerRef.current.actualFog,
        };
      }
      setResult(answer);
      setScore((current) => ({
        correct: current.correct + (answer.correct ? 1 : 0),
        total: current.total + 1,
      }));
    } catch (error) {
      const demo = createLocalDemoChallenge(selected, round);
      challengeOriginRef.current = "local";
      localAnswerRef.current = demo.answer;
      setChallenge(demo.question);
      setPrediction(null);
    } finally {
      setSubmitting(false);
    }
  }

  function nextChallenge() {
    const nextRound = round + 1;
    setRound(nextRound);
    loadChallenge(selected, nextRound);
  }

  function returnToMap() {
    requestSequenceRef.current += 1;
    setSelected(null);
    setChallenge(null);
    setPrediction(null);
    setResult(null);
    setLoading(false);
  }

  if (!selected) {
    return <StationMapSelection onSelect={setSelected} score={score} />;
  }

  return (
    <section className="workspace two-column">
      <TypeQuizStage type={type} challenge={challenge} result={result} loading={loading} />
      <aside className="control-panel type-panel quiz-panel">
        <button className="back-to-map" type="button" onClick={returnToMap}>
          <span aria-hidden="true">←</span> 지도에서 다른 지역 선택
        </button>

        <div className="type-family-guide quiz-scoreboard">
          <div><span>풀 데이터</span><strong>TA · TD · HM · WS</strong></div>
          <div><span>나의 정답</span><strong>{score.correct} / {score.total}</strong></div>
        </div>

        <div className="type-copy quiz-copy">
          <span>{type.station.terrain} · 관측값 해석</span>
          <strong>안개 발생을 예측해보세요</strong>
          <p>기온과 이슬점의 거리, 습도, 풍속을 함께 보고 판단합니다.</p>
        </div>

        <div className="quiz-clue-guide">
          <span>판단 힌트</span>
          <div><i>01</i><p><strong>TA−TD</strong>가 작을수록 포화에 가깝습니다.</p></div>
          <div><i>02</i><p><strong>HM</strong>이 높으면 공기 속 수증기가 많습니다.</p></div>
          <div><i>03</i><p><strong>WS</strong>는 안개를 유지하거나 흩어지게 합니다.</p></div>
        </div>

        {!result ? (
          <div className="quiz-prediction-card">
            <span>나의 예측</span>
            <strong>이 시각에 안개가 있었을까요?</strong>
            <div className="quiz-choice-buttons">
              <button
                className={prediction === "FOG" ? "selected fog-choice" : ""}
                type="button"
                onClick={() => setPrediction("FOG")}
              >안개 발생</button>
              <button
                className={prediction === "NO_FOG" ? "selected clear-choice" : ""}
                type="button"
                onClick={() => setPrediction("NO_FOG")}
              >안개 미발생</button>
            </div>
            <button
              className="quiz-submit"
              disabled={!prediction || submitting || loading}
              type="button"
              onClick={submitPrediction}
            >
              {submitting ? "관측 결과 확인 중…" : "정답 확인하기"}
            </button>
          </div>
        ) : (
          <div className={`quiz-feedback ${result.correct ? "correct" : "incorrect"}`}>
            <span>{result.correct ? "CORRECT" : "TRY AGAIN"}</span>
            <strong>{result.correct ? "예측이 맞았습니다!" : "관측 결과와 달랐습니다"}</strong>
            <p>{result.explanation}</p>
            <div><span>시정 VS</span><b>{result.visibilityRaw} × 10m = {result.visibilityMeters}m</b></div>
            <div><span>현재일기 WW</span><b>{result.weatherDescription}</b></div>
            <button type="button" onClick={nextChallenge}>다음 관측 문제</button>
          </div>
        )}

        <div className={`data-source-note ${challenge?.sourceType === "KMA_ASOS" ? "live-source" : "demo-source"}`}>
          <span>{challenge?.sourceLabel || "데이터 소스 확인 중"}</span>
          <p>{challenge?.sourceType === "KMA_ASOS"
            ? "기상청 API허브 종관기상관측(ASOS) 실관측자료"
            : "현재 값은 실관측이 아닌 학습용 예시입니다. KMA_API_KEY를 연결하면 실제 ASOS로 전환됩니다."}</p>
        </div>
      </aside>
    </section>
  );
}

function getRiskInfo(visibility) {
  if (visibility < 100) {
    return {
      label: "매우 위험",
      color: "#ef4444",
      message: "속도를 줄이고 차간거리를 충분히 확보해야 합니다.",
    };
  }
  if (visibility < 200) {
    return {
      label: "위험",
      color: "#f97316",
      message: "전방 표지판 식별이 어려워지는 위험한 상황입니다.",
    };
  }
  if (visibility < 500) {
    return {
      label: "주의",
      color: "#facc15",
      message: "가까운 차량과 도로 경계가 늦게 보이기 시작합니다.",
    };
  }
  if (visibility < 1000) {
    return {
      label: "안개",
      color: "#38bdf8",
      message: "가시거리가 1km 미만으로 줄어 안개 상태입니다.",
    };
  }
  return {
    label: "비교적 안전",
    color: "#22c55e",
    message: "전방의 표지판과 도로 윤곽을 비교적 안정적으로 확인할 수 있습니다.",
  };
}

function VisibilityTab() {
  const [visibility, setVisibility] = useState(650);
  const [lane, setLane] = useState(1);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [hits, setHits] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const [obstacles, setObstacles] = useState([
    { id: 1, lane: 0, y: 18, type: "cone" },
    { id: 2, lane: 2, y: 44, type: "barrier" },
  ]);
  const [eventText, setEventText] = useState("가시거리를 정하고 출발해 보세요.");
  const obstacleIdRef = useRef(3);
  const spawnTickRef = useRef(0);
  const shakeTimerRef = useRef(null);

  const risk = getRiskInfo(visibility);
  const fogLevel = clamp((1500 - visibility) / 1450, 0, 1);
  const visibilityFactor = clamp((visibility - 80) / 1320, 0, 1);
  const revealLine = 74 - visibilityFactor * 52;
  const riskLevel = Math.round(fogLevel * 100);
  const lanePositions = [24, 50, 76];
  const speed = 2.35 + fogLevel * 0.95;

  const obstacleOpacity = (y) => {
    if (y < revealLine) return 0;
    return clamp((y - revealLine) / 12, 0, 1);
  };
  const obstacleBlur = (y) => {
    if (y < revealLine) return 10;
    return clamp(8 - (y - revealLine) * 0.7, 0, 8);
  };
  const steer = (direction) => setLane((current) => clamp(current + direction, 0, 2));
  const resetGame = () => {
    obstacleIdRef.current = 3;
    spawnTickRef.current = 0;
    setLane(1);
    setScore(0);
    setHits(0);
    setShakeKey(0);
    setRunning(false);
    setObstacles([
      { id: 1, lane: 0, y: 18, type: "cone" },
      { id: 2, lane: 2, y: 44, type: "barrier" },
    ]);
    setEventText("가시거리를 정하고 출발해 보세요.");
  };

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") steer(-1);
      if (event.key === "ArrowRight") steer(1);
      if (event.key === " ") {
        event.preventDefault();
        setRunning((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!running) return undefined;

    const timer = window.setInterval(() => {
      setScore((current) => current + 1);
      setObstacles((current) => {
        let didHit = false;
        const next = current
          .map((obstacle) => {
            const y = obstacle.y + speed;
            if (!obstacle.hit && obstacle.lane === lane && y > 86.5 && y < 89.2) {
              didHit = true;
              return { ...obstacle, y, hit: true };
            }
            return { ...obstacle, y };
          })
          .filter((obstacle) => obstacle.y < 112);

        spawnTickRef.current += 1;
        if (spawnTickRef.current > 18 - fogLevel * 5) {
          spawnTickRef.current = 0;
          const types = ["cone", "barrier", "sign"];
          next.push({
            id: obstacleIdRef.current,
            lane: Math.floor(Math.random() * 3),
            y: -8,
            type: types[obstacleIdRef.current % types.length],
          });
          obstacleIdRef.current += 1;
        }

        if (didHit) {
          setHits((currentHits) => currentHits + 1);
          setShakeKey((current) => (current === 1 ? 2 : 1));
          if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
          shakeTimerRef.current = window.setTimeout(() => setShakeKey(0), 420);
          setEventText("장애물을 너무 늦게 발견했습니다. 가시거리가 낮으면 반응 시간이 줄어듭니다.");
        }

        return next;
      });
    }, 90);

    return () => window.clearInterval(timer);
  }, [fogLevel, lane, running, speed]);

  useEffect(() => {
    if (visibility < 500) {
      setEventText("낮은 가시거리에서는 장애물이 가까이 와야 보입니다.");
    } else if (visibility < 1000) {
      setEventText("안개 구간입니다. 앞차와 장애물을 더 늦게 발견할 수 있습니다.");
    } else {
      setEventText("가시거리가 길어 장애물을 미리 보고 피하기 쉽습니다.");
    }
  }, [visibility]);

  return (
    <section className="workspace two-column">
      <div
        className={`simulation-stage road-stage game-stage ${shakeKey ? "screen-shake" : ""}`}
        style={{ animationName: shakeKey === 1 ? "impactShakeA" : shakeKey === 2 ? "impactShakeB" : undefined }}
      >
        <div className="road-sky" />
        <div className="road-horizon game-horizon" style={{ opacity: clamp(1 - fogLevel * 0.65, 0.18, 1) }} />
        <div className="game-hud">
          <span>{running ? "주행 중" : "대기"}</span>
          <strong>{score}점</strong>
        </div>
        <div className="game-road-track">
          <span className="game-lane-line left" />
          <span className="game-lane-line right" />
          <div
            className="hidden-fog-zone"
            style={{
              height: `${revealLine}%`,
              opacity: 0.62 + fogLevel * 0.34,
            }}
          />
          <div className="visibility-line" style={{ top: `${revealLine}%` }}>
            <span>이 아래부터 잘 보임</span>
          </div>
          {obstacles.map((obstacle) => (
            <div
              className={`game-obstacle ${obstacle.type} ${obstacle.hit ? "hit" : ""}`}
              key={obstacle.id}
              style={{
                left: `${lanePositions[obstacle.lane]}%`,
                top: `${obstacle.y}%`,
                opacity: obstacleOpacity(obstacle.y),
                filter: `blur(${obstacleBlur(obstacle.y)}px)`,
                transform: `translate(-50%, -50%) scale(${0.58 + obstacle.y / 150})`,
              }}
            >
              <span>{obstacle.type === "sign" ? "!" : ""}</span>
            </div>
          ))}
          <div className="game-car" style={{ left: `${lanePositions[lane]}%` }}>
            <span />
          </div>
        </div>
        <div className="steer-pad">
          <button type="button" onClick={() => steer(-1)}>←</button>
          <button type="button" onClick={() => steer(1)}>→</button>
        </div>
        <FogCanvas density={fogLevel} mode="road" wind={0.22} />
        <div className="whiteout game-whiteout" style={{ opacity: fogLevel * 0.58 }} />
        <div
          className="impact-flash"
          style={{ animationName: shakeKey === 1 ? "impactFlashA" : shakeKey === 2 ? "impactFlashB" : undefined }}
        />
        <div className="stage-caption">{eventText}</div>
      </div>

      <aside className="control-panel visibility-panel">
        <div className="panel-title">
          <span>가시거리 설정</span>
          <strong>{visibility}m</strong>
        </div>
        <RangeControl
          label="가시거리"
          min={80}
          max={1400}
          step={20}
          value={visibility}
          unit="m"
          onChange={setVisibility}
        />
        <div className="game-buttons">
          <button type="button" onClick={() => setRunning((current) => !current)}>
            {running ? "일시정지" : "출발"}
          </button>
          <button type="button" onClick={resetGame}>다시하기</button>
        </div>
        <div className="game-stats">
          <Readout label="피한 거리" value={`${score}점`} />
          <Readout label="충돌" value={`${hits}회`} tone="blue" />
        </div>
        <div className="risk-meter">
          <div className="risk-track">
            <span style={{ width: `${riskLevel}%`, background: risk.color }} />
          </div>
          <strong style={{ color: risk.color }}>{risk.label}</strong>
          <p>{risk.message}</p>
        </div>
        <div className="drive-tip">
          <span>조작</span>
          <strong>← / → 버튼 또는 키보드 방향키로 차선을 바꿉니다.</strong>
        </div>
        <div className="visibility-scale">
          <p><span>1200m 이상</span><strong>비교적 안전</strong></p>
          <p><span>1000m 미만</span><strong>안개</strong></p>
          <p><span>500m 미만</span><strong>주의</strong></p>
          <p><span>200m 미만</span><strong>위험</strong></p>
          <p><span>100m 미만</span><strong>매우 위험</strong></p>
        </div>
      </aside>
    </section>
  );
}

function ActiveTab({ activeTab }) {
  if (activeTab === "lab") return <LabTab />;
  if (activeTab === "types") return <TypesTab />;
  if (activeTab === "visibility") return <VisibilityTab />;
  return <CompareTab />;
}

function App() {
  const [activeTab, setActiveTab] = useState("compare");

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p>Fog Lab</p>
          <h1>안개 생성 시뮬레이터</h1>
        </div>
        <div className="header-readout">
          <span>교육용 MVP</span>
          <strong>Cloud · Fog · Visibility</strong>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Fog Lab 탭">
        {tabs.map((tab) => (
          <button
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <ActiveTab activeTab={activeTab} />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
