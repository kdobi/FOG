import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./mission.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const STEPS = [
  { id: "observe", number: "01", role: "관찰자", title: "안개의 정체", action: "관찰" },
  { id: "experiment", number: "02", role: "연구원", title: "안개 만들기", action: "실험" },
  { id: "forecast", number: "03", role: "기상 분석가", title: "안개 유형", action: "조합" },
  { id: "safety", number: "04", role: "안전관리자", title: "위험 대응", action: "대응" },
];

const STATIONS = [
  {
    id: "jeonju",
    name: "전주",
    code: "146",
    terrain: "내륙 평야",
    fogType: "복사안개",
    family: "냉각안개",
    mechanism: "맑고 바람이 약한 밤에 지면이 빠르게 식으면서 지표 부근 공기가 이슬점까지 냉각되어 만들어집니다.",
    process: ["밤사이 지면이 복사냉각", "지표 부근 공기가 이슬점 도달", "얕은 안개층 형성"],
    favorable: "눈·비가 온 뒤, 강 주변, 수증기가 풍부한 도심 외곽",
    clears: "해가 떠 지면이 데워지거나 바람이 강해져 상·하층 공기가 섞이면 소산",
    x: 42,
    y: 58,
    primary: true,
    cases: [
      { time: "학습용 사례 A · 06:00", ta: 9.6, td: 9.3, hm: 98, ws: 0.5, vs: 480, fog: true, ww: "안개 관측 코드" },
      { time: "학습용 사례 B · 12:00", ta: 18.3, td: 10.7, hm: 61, ws: 2.4, vs: 10000, fog: false, ww: "안개 관측 코드 없음" },
    ],
  },
  {
    id: "incheon",
    name: "인천",
    code: "112",
    terrain: "서해안",
    fogType: "이류안개",
    family: "냉각안개",
    mechanism: "따뜻하고 습한 공기가 차가운 수면 위로 이동할 때 공기 아랫부분이 냉각되어 응결하며 만들어집니다.",
    process: ["따뜻하고 습한 공기 이동", "차가운 수면에서 하층 냉각", "포화·응결하여 넓은 해무 형성"],
    favorable: "차가운 바다 위로 습한 공기가 지속해서 이동하는 해안",
    clears: "공기 흐름이 바뀌거나 건조한 공기가 유입되면 약화",
    x: 29,
    y: 31,
    primary: true,
    cases: [
      { time: "학습용 사례 A · 03:00", ta: 15.2, td: 14.8, hm: 97, ws: 2.8, vs: 850, fog: true, ww: "안개 관측 코드" },
      { time: "학습용 사례 B · 12:00", ta: 18.2, td: 16.1, hm: 87, ws: 4.1, vs: 1800, fog: false, ww: "박무 가능 구간" },
    ],
  },
  {
    id: "daegwallyeong",
    name: "대관령",
    code: "100",
    terrain: "산지",
    fogType: "활승안개",
    family: "냉각안개",
    mechanism: "습한 공기가 높은 지형을 따라 강제로 상승하면서 팽창·냉각되어 응결하는 산안개입니다.",
    process: ["습한 공기가 산비탈로 이동", "지형을 따라 상승하며 냉각", "산 중턱에서 응결"],
    favorable: "습한 바람이 산비탈을 향해 지속해서 부는 산지",
    clears: "공기가 건조해지거나 산을 오르는 상승 흐름이 약해지면 소산",
    x: 61,
    y: 28,
    primary: true,
    cases: [
      { time: "학습용 사례 A · 06:00", ta: 7.4, td: 7.2, hm: 99, ws: 4.6, vs: 290, fog: true, ww: "안개 관측 코드" },
      { time: "학습용 사례 B · 12:00", ta: 10.7, td: 9.4, hm: 91, ws: 4.3, vs: 1300, fog: false, ww: "안개 관측 코드 없음" },
    ],
  },
  {
    id: "seoul",
    name: "서울",
    code: "108",
    terrain: "수도권 내륙",
    fogType: "전선안개",
    family: "증발안개",
    mechanism: "전선 부근의 따뜻한 비가 찬 공기층에서 증발해 수증기를 늘리고, 차가운 지표 부근 공기를 포화시켜 만듭니다.",
    process: ["따뜻한 공기와 찬 공기가 만남", "따뜻한 비가 찬 공기층에서 증발", "수증기가 증가해 이슬비·안개 형성"],
    favorable: "온난전선 부근에서 약한 비와 찬 지표 공기층이 함께 나타나는 때",
    clears: "전선이 이동하거나 비가 약해지고 공기층이 섞이면 소산",
    x: 37,
    y: 28,
    primary: false,
    cases: [
      { time: "학습용 심화 · 06:00", ta: 5.1, td: 4.9, hm: 99, ws: 1.2, vs: 540, fog: true, ww: "안개 관측 코드" },
      { time: "학습용 심화 · 00:00", ta: 5.8, td: 3.7, hm: 86, ws: 1.7, vs: 3600, fog: false, ww: "약한 비" },
    ],
  },
  {
    id: "chuncheon",
    name: "북춘천",
    code: "093",
    terrain: "호수 인접",
    fogType: "김안개",
    family: "증발안개",
    mechanism: "차가운 공기가 따뜻한 수면 위로 이동할 때 수면에서 공급된 수증기가 곧바로 찬 공기와 섞여 응결합니다.",
    process: ["찬 공기가 따뜻한 수면으로 이동", "수면에서 수증기 공급", "차가운 공기와 섞이며 김처럼 응결"],
    favorable: "늦가을부터 초겨울의 따뜻한 강·호수 주변",
    clears: "수온과 기온의 차이가 줄거나 바람이 강해지면 약화",
    x: 49,
    y: 24,
    primary: false,
    cases: [
      { time: "학습용 심화 · 06:00", ta: -0.8, td: -1.1, hm: 98, ws: 0.4, vs: 680, fog: true, ww: "안개 관측 코드" },
      { time: "학습용 심화 · 12:00", ta: 6.8, td: 1.5, hm: 69, ws: 1.6, vs: 7600, fog: false, ww: "안개 관측 코드 없음" },
    ],
  },
];

const FOG_RECIPES = [
  {
    id: "radiation",
    stationId: "jeonju",
    family: "냉각안개",
    name: "복사안개",
    subtitle: "밤사이 지면이 식어 만드는 얕은 안개",
    initial: { darkness: 20, cooling: 28, calm: 65 },
    controls: [
      { key: "darkness", label: "해를 내려 밤으로", hint: "밤이 깊을수록 복사냉각이 활발해집니다.", goal: "high", target: 75 },
      { key: "cooling", label: "지면 냉각", hint: "차가운 지면이 지표 부근 공기를 식힙니다.", goal: "high", target: 70 },
      { key: "calm", label: "바람 세기", hint: "강한 바람은 상·하층 공기를 섞습니다.", goal: "low", target: 25 },
    ],
  },
  {
    id: "advection",
    stationId: "incheon",
    family: "냉각안개",
    name: "이류안개",
    subtitle: "따뜻하고 습한 공기가 찬 수면 위를 이동",
    initial: { moisture: 35, coldWater: 30, transport: 15 },
    controls: [
      { key: "moisture", label: "따뜻하고 습한 공기", hint: "수증기가 풍부한 공기덩어리를 준비합니다.", goal: "high", target: 70 },
      { key: "coldWater", label: "차가운 수면", hint: "공기 아랫부분을 이슬점까지 냉각합니다.", goal: "high", target: 70 },
      { key: "transport", label: "수평 이동", hint: "공기덩어리를 찬 수면 위로 이동시킵니다.", goal: "high", target: 72 },
    ],
  },
  {
    id: "upslope",
    stationId: "daegwallyeong",
    family: "냉각안개",
    name: "활승안개",
    subtitle: "습한 공기가 산비탈을 오르며 냉각",
    initial: { moisture: 35, ascent: 18, slopeWind: 20 },
    controls: [
      { key: "moisture", label: "습한 공기", hint: "산을 오를 수증기 많은 공기를 준비합니다.", goal: "high", target: 70 },
      { key: "ascent", label: "산비탈 상승", hint: "고도가 높아질수록 공기가 팽창·냉각됩니다.", goal: "high", target: 75 },
      { key: "slopeWind", label: "산을 향한 바람", hint: "활승안개는 상승풍이 있으면 유지될 수 있습니다.", goal: "high", target: 60 },
    ],
  },
  {
    id: "frontal",
    stationId: "seoul",
    family: "증발안개",
    name: "전선안개",
    subtitle: "따뜻한 비가 찬 공기층에서 증발",
    initial: { meeting: 20, warmRain: 15, coldGround: 30 },
    controls: [
      { key: "meeting", label: "따뜻한·찬 공기 만나기", hint: "서로 다른 공기덩어리가 전선을 만듭니다.", goal: "high", target: 75 },
      { key: "warmRain", label: "따뜻한 비", hint: "비가 찬 공기층에서 증발해 수증기를 공급합니다.", goal: "high", target: 65 },
      { key: "coldGround", label: "찬 지표 공기층", hint: "지표 부근 공기를 포화시키는 조건입니다.", goal: "high", target: 65 },
    ],
  },
  {
    id: "steam",
    stationId: "chuncheon",
    family: "증발안개",
    name: "김안개",
    subtitle: "찬 공기가 따뜻한 수면 위를 지날 때 생성",
    initial: { coldAir: 25, warmWater: 25, wind: 65 },
    controls: [
      { key: "coldAir", label: "차가운 공기", hint: "늦가을·초겨울의 찬 공기를 준비합니다.", goal: "high", target: 70 },
      { key: "warmWater", label: "따뜻한 수면", hint: "강이나 호수에서 수증기를 공급합니다.", goal: "high", target: 75 },
      { key: "wind", label: "바람 세기", hint: "너무 강한 바람은 김안개를 흩어지게 합니다.", goal: "low", target: 35 },
    ],
  },
];

const REGION_DEMO_OBSERVATIONS = {
  146: { visibilityMeters: 480, weatherCode: "16", weatherDescription: "안개", observedAt: "학습용 예시 · 06:00" },
  112: { visibilityMeters: 850, weatherCode: "16", weatherDescription: "안개", observedAt: "학습용 예시 · 03:00" },
  100: { visibilityMeters: 290, weatherCode: "17", weatherDescription: "낮은안개", observedAt: "학습용 예시 · 06:00" },
  108: { visibilityMeters: 540, weatherCode: "16", weatherDescription: "안개", observedAt: "학습용 예시 · 06:00" },
  93: { visibilityMeters: 680, weatherCode: "18", weatherDescription: "땅안개", observedAt: "학습용 예시 · 06:00" },
};

// 실제 지역 사진을 추가할 때 public/regions에 파일을 넣고 아래 경로만 지정하면 됩니다.
const REGION_PHOTOS = {
  jeonju: "",
  incheon: "",
  daegwallyeong: "",
  seoul: "",
  chuncheon: "",
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatVisibility(value) {
  if (value >= 1000) return (value / 1000).toFixed(1) + " km";
  return Math.round(value) + " m";
}

function calculateHumidity(temperature, dewPoint) {
  const saturation = Math.exp((17.625 * temperature) / (243.04 + temperature));
  const actual = Math.exp((17.625 * dewPoint) / (243.04 + dewPoint));
  return clamp(Math.round((actual / saturation) * 100), 1, 100);
}

const VISIBILITY_THRESHOLDS = [
  { value: 200, label: "200m", caption: "매우 짙음" },
  { value: 500, label: "500m", caption: "짙은 안개" },
  { value: 1000, label: "1km", caption: "안개 경계" },
  { value: 10000, label: "10km", caption: "박무 경계" },
];

function formatAltitude(altitude) {
  return Math.round(160 + altitude * 7.6) + "m";
}

function formatAltitudeDifference(altitudeDifference) {
  return Math.round(altitudeDifference * 7.6) + "m";
}

function getVisibilityScalePosition(value) {
  const min = Math.log10(50);
  const max = Math.log10(12000);
  return clamp(((Math.log10(value) - min) / (max - min)) * 100, 0, 100);
}

function getVisibilityStage(visibility) {
  if (visibility >= 10000) return { key: "clear", label: "시야 양호", range: "10km 이상" };
  if (visibility >= 1000) return { key: "mist", label: "박무", range: "1km 이상 ~ 10km 미만" };
  if (visibility >= 500) return { key: "fog", label: "안개", range: "500m 이상 ~ 1km 미만" };
  if (visibility >= 200) return { key: "dense", label: "짙은 안개", range: "200m 이상 ~ 500m 미만" };
  return { key: "very-dense", label: "매우 짙은 안개", range: "50m 이상 ~ 200m 미만" };
}

function getObservationStatus(observerAltitude, cloudAltitude, visibility) {
  const distance = Math.abs(observerAltitude - cloudAltitude);
  const insideCloudLayer = distance <= 12;
  const nearCloudLayer = distance <= 25;

  if (insideCloudLayer && visibility < 200) {
    return {
      key: "very-dense-fog",
      tone: "red",
      status: "매우 짙은 안개",
      description: "관측자가 구름층 안에 있고 수평시정이 200m 미만으로 줄어 매우 짙은 안개 상태입니다.",
    };
  }

  if (insideCloudLayer && visibility < 500) {
    return {
      key: "dense-fog",
      tone: "orange",
      status: "짙은 안개",
      description: "관측자가 구름층 안에 있고 수평시정이 500m 미만이라 짙은 안개 상태입니다.",
    };
  }

  if (insideCloudLayer && visibility < 1000) {
    return {
      key: "fog",
      tone: "amber",
      status: "안개",
      description: "관측자가 구름층 안에 있으며 수평시정이 1km 미만이므로 안개 상태입니다.",
    };
  }

  if (insideCloudLayer && visibility < 10000) {
    return {
      key: "mist",
      tone: "cyan",
      status: "박무",
      description: "관측자가 구름층 안에 있지만 수평시정이 1km 이상 10km 미만이므로 안개보다 약한 박무 상태입니다.",
    };
  }

  if (insideCloudLayer && visibility >= 10000) {
    return {
      key: "inside-cloud",
      tone: "blue",
      status: "구름 속",
      description: "관측자가 구름층 안에 있지만 수평시정이 길어 시야 흐림은 약합니다.",
    };
  }

  if (nearCloudLayer) {
    return {
      key: "cloud-edge",
      tone: "cyan",
      status: "구름 가장자리",
      description: "관측자가 구름층 가까이에 있어 주변이 조금 흐려지기 시작합니다.",
    };
  }

  if (observerAltitude < cloudAltitude) {
    return {
      key: "cloud",
      tone: "blue",
      status: "구름",
      description: "관측자가 구름층 아래에 있어 하늘의 구름으로 관찰합니다.",
    };
  }

  return {
    key: "above-cloud",
    tone: "green",
    status: "구름 위",
    description: "관측자가 구름층보다 높은 곳에 있어 구름을 아래쪽으로 내려다봅니다.",
  };
}

function getSceneVisuals(statusKey, visibility) {
  const lowVisibilityPressure = clamp((1000 - visibility) / 950, 0, 1);
  const profiles = {
    cloud: { veil: 0.04, frontVeil: 0, fogDensity: 0.1, farOpacity: 0.95, farBlur: "0px", cloudOpacity: 0.78 },
    "cloud-edge": { veil: 0.13, frontVeil: 0.02, fogDensity: 0.24, farOpacity: 0.82, farBlur: "1px", cloudOpacity: 0.9 },
    mist: { veil: 0.21, frontVeil: 0.03, fogDensity: 0.36, farOpacity: 0.68, farBlur: "1.6px", cloudOpacity: 0.92 },
    fog: { veil: 0.36 + lowVisibilityPressure * 0.08, frontVeil: 0.08, fogDensity: 0.58, farOpacity: 0.42, farBlur: "3px", cloudOpacity: 0.94 },
    "dense-fog": { veil: 0.56, frontVeil: 0.16, fogDensity: 0.78, farOpacity: 0.18, farBlur: "6px", cloudOpacity: 0.98 },
    "very-dense-fog": { veil: 0.78, frontVeil: 0.34, fogDensity: 0.96, farOpacity: 0.05, farBlur: "9px", cloudOpacity: 1 },
    "inside-cloud": { veil: 0.14, frontVeil: 0.02, fogDensity: 0.26, farOpacity: 0.78, farBlur: "1px", cloudOpacity: 0.9 },
    "above-cloud": { veil: 0.05, frontVeil: 0, fogDensity: 0.12, farOpacity: 0.9, farBlur: "0.4px", cloudOpacity: 0.86 },
  };

  return profiles[statusKey] || profiles.cloud;
}

function FogField({ density = 0.25, drift = 1 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, index) => ({
        left: ((index * 37) % 112) - 6,
        top: 35 + ((index * 23) % 58),
        size: 110 + ((index * 41) % 190),
        delay: -((index * 0.37) % 7),
        duration: 9 + ((index * 1.7) % 8),
        alpha: 0.12 + (((index * 17) % 40) / 100),
      })),
    [],
  );

  return (
    <div className="fog-field" aria-hidden="true" style={{ opacity: density }}>
      {particles.map((particle, index) => (
        <i
          key={index}
          style={{
            left: particle.left + "%",
            top: particle.top + "%",
            width: particle.size + "px",
            height: Math.round(particle.size * 0.42) + "px",
            opacity: particle.alpha,
            animationDelay: particle.delay + "s",
            animationDuration: particle.duration / drift + "s",
          }}
        />
      ))}
    </div>
  );
}

function MissionHeading({ step, eyebrow, title, description }) {
  return (
    <div className="mission-heading">
      <div className="mission-role">
        <span>{step.number}</span>
        <div>
          <small>{step.role} 임무</small>
          <strong>{eyebrow}</strong>
        </div>
      </div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ContinueButton({ children, onClick, disabled = false, testId }) {
  return (
    <button className="continue-button" data-testid={testId} disabled={disabled} type="button" onClick={onClick}>
      <span>{children}</span>
      <b aria-hidden="true">→</b>
    </button>
  );
}

function ObserveMission({ onComplete }) {
  const [observerPosition, setObserverPosition] = useState(24);
  const [cloudHeight, setCloudHeight] = useState(68);
  const [visibility, setVisibility] = useState(12000);

  const observerAltitude = observerPosition;
  const cloudAltitude = cloudHeight;
  const altitudeDifference = Math.abs(observerAltitude - cloudAltitude);
  const observation = getObservationStatus(observerAltitude, cloudAltitude, visibility);
  const visibilityStage = getVisibilityStage(visibility);
  const visual = getSceneVisuals(observation.key, visibility);
  const observerX = 9 + observerPosition * 0.78;
  const observerY = 14 + observerAltitude * 0.6;
  const cloudCenter = 14 + cloudAltitude * 0.6;
  const visibilityPointer = getVisibilityScalePosition(visibility);
  const sightDistance = clamp(16 + visibilityPointer * 0.58, 13, 72);

  function applyPreset(nextObserver, nextCloud, nextVisibility) {
    setObserverPosition(nextObserver);
    setCloudHeight(nextCloud);
    setVisibility(nextVisibility);
  }

  return (
    <section className="mission-page fog-identity-page">
      <MissionHeading
        step={STEPS[0]}
        eyebrow="관측 위치와 수평시정으로 구분하기"
        title="안개의 정체"
        description="구름과 안개는 서로 다른 물질이 아니라, 관측자가 어디에서 보느냐에 따라 다르게 느껴지는 같은 현상입니다. 산을 오르며 구름층 안으로 들어가고 수평시정이 1km 미만으로 줄어들면 우리는 그것을 안개로 분류합니다."
      />

      <div className="observe-layout fog-identity-layout">
        <div
          className={"observe-scene fog-identity-scene is-" + observation.key}
          style={{
            "--observer-x": observerX + "%",
            "--observer-y": observerY + "%",
            "--cloud-center": cloudCenter + "%",
            "--sight-distance": sightDistance + "%",
            "--veil-opacity": visual.veil,
            "--front-veil-opacity": visual.frontVeil,
            "--far-opacity": visual.farOpacity,
            "--far-blur": visual.farBlur,
            "--cloud-opacity": visual.cloudOpacity,
          }}
        >
          <div className="identity-sky" />
          <div className="identity-sun" />

          <div className="identity-ridge ridge-far fog-sensitive" />
          <div className="identity-ridge ridge-mid fog-sensitive" />

          <div className="identity-cloud-layer">
            <i />
            <i />
            <i />
            <span>작은 물방울·얼음 방울이 떠 있는 구름층</span>
          </div>

          <div className="identity-mountain">
            <div className="identity-slope-fill" />
            <div className="identity-trail" />
            <div className="tree-row tree-row-back fog-sensitive">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="tree-row tree-row-front">
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="trail-sign">
              <b>1km</b>
              <span>안개 경계</span>
            </div>
          </div>

          <div className="altitude-ruler" aria-hidden="true">
            <span>고도</span>
            <i className="cloud-marker" />
            <i className="observer-marker" />
          </div>

          <div className="sight-beam" aria-hidden="true">
            <i />
            <span>{formatVisibility(visibility)}</span>
          </div>

          <div className="observer-hiker">
            <i className="hiker-shadow" />
            <i className="hiker-body" />
            <i className="hiker-pack" />
            <i className="hiker-head" />
            <strong>관측자</strong>
          </div>

          <FogField density={visual.fogDensity} drift={0.82} />
          <div className="visibility-veil" />
          <div className="front-whiteout" />

          <div className={"scene-result status-" + observation.tone}>
            <small>현재 상태</small>
            <strong>{observation.status}</strong>
            <span>{observation.description}</span>
          </div>

          <div className="scene-metrics" aria-label="현재 장면 수치">
            <div><span>관측자 고도</span><strong>{formatAltitude(observerAltitude)}</strong></div>
            <div><span>구름층 고도</span><strong>{formatAltitude(cloudAltitude)}</strong></div>
            <div><span>고도 차이</span><strong>{formatAltitudeDifference(altitudeDifference)}</strong></div>
            <div><span>수평시정</span><strong>{formatVisibility(visibility)}</strong></div>
            <div><span>현재 상태</span><strong>{observation.status}</strong></div>
          </div>
        </div>

        <aside className="mission-controls observe-controls">
          <div className="control-intro">
            <span>직접 조작</span>
            <strong>산길·구름층·시정</strong>
            <p>관측자를 산길 위로 올리고 구름층 높이와 수평시정을 바꾸며 같은 물방울층이 구름, 박무, 안개로 달라지는 순간을 확인하세요.</p>
          </div>

          <label className="sim-slider">
            <div><span>관측자 등산 위치</span><strong>{formatAltitude(observerAltitude)}</strong></div>
            <input
              aria-label="관측자 등산 위치"
              max="100"
              min="0"
              step="1"
              type="range"
              value={observerPosition}
              onChange={(event) => setObserverPosition(Number(event.target.value))}
            />
            <div className="slider-endpoints"><span>산 아래</span><span>산 위</span></div>
          </label>

          <label className="sim-slider">
            <div><span>구름층 높이</span><strong>{formatAltitude(cloudAltitude)}</strong></div>
            <input
              aria-label="구름층 높이"
              max="100"
              min="0"
              step="1"
              type="range"
              value={cloudHeight}
              onChange={(event) => setCloudHeight(Number(event.target.value))}
            />
            <div className="slider-endpoints"><span>지표 가까이</span><span>하늘 위쪽</span></div>
          </label>

          <label className="sim-slider visibility-slider">
            <div><span>수평시정</span><strong>{formatVisibility(visibility)}</strong></div>
            <input
              aria-label="수평시정"
              max="12000"
              min="50"
              step="50"
              type="range"
              value={visibility}
              onChange={(event) => setVisibility(Number(event.target.value))}
            />
            <div className="visibility-scale">
              <i className="visibility-current" style={{ left: visibilityPointer + "%" }} />
              {VISIBILITY_THRESHOLDS.map((threshold) => (
                <span
                  className={"visibility-threshold threshold-" + threshold.value}
                  key={threshold.value}
                  style={{ left: getVisibilityScalePosition(threshold.value) + "%" }}
                >
                  <b>{threshold.label}</b>
                  <em>{threshold.caption}</em>
                </span>
              ))}
            </div>
            <div className={"visibility-stage stage-" + visibilityStage.key}>
              <span>수평시정 단계</span>
              <strong>{visibilityStage.label}</strong>
              <small>{visibilityStage.range}</small>
            </div>
          </label>

          <div className="preset-row fog-preset-row">
            <button type="button" onClick={() => applyPreset(24, 68, 12000)}>구름</button>
            <button type="button" onClick={() => applyPreset(44, 66, 7600)}>가장자리</button>
            <button type="button" onClick={() => applyPreset(54, 52, 11000)}>구름 속</button>
            <button type="button" onClick={() => applyPreset(54, 52, 4200)}>박무</button>
            <button type="button" onClick={() => applyPreset(54, 52, 800)}>안개</button>
            <button type="button" onClick={() => applyPreset(54, 52, 320)}>짙은 안개</button>
            <button type="button" onClick={() => applyPreset(54, 52, 120)}>매우 짙은</button>
            <button type="button" onClick={() => applyPreset(76, 45, 9000)}>구름 위</button>
          </div>

          <div className={"status-explanation status-" + observation.tone}>
            <span>상태 판정</span>
            <strong>{observation.status}</strong>
            <p>{observation.description}</p>
          </div>

          <div className="mist-note">
            <span>박무 기준</span>
            <p>박무는 안개보다 옅은 시야 흐림입니다. 보통 수평시정이 1km 이상 10km 미만일 때 박무로 분류하고, 1km 미만이면 안개로 분류합니다.</p>
          </div>

          <ContinueButton onClick={onComplete} testId="complete-observe">
            원리를 확인했어요 · 실험실로
          </ContinueButton>
        </aside>
      </div>
    </section>
  );
}

function ExperimentMission({ onComplete }) {
  const [cooling, setCooling] = useState(28);
  const [moisture, setMoisture] = useState(42);
  const [wind, setWind] = useState(3.2);
  const temperature = Number((24 - cooling * 0.16).toFixed(1));
  const rawDewPoint = 3 + moisture * 0.16;
  const dewPoint = Number(Math.min(rawDewPoint, temperature - 0.1).toFixed(1));
  const humidity = calculateHumidity(temperature, dewPoint);
  const gap = Number(Math.max(0, temperature - dewPoint).toFixed(1));
  const saturationScore = clamp((5 - gap) / 5, 0, 1);
  const windScore = clamp((5 - wind) / 5, 0, 1);
  const fogScore = Math.round((saturationScore * 0.62 + humidity / 100 * 0.26 + windScore * 0.12) * 100);
  const formed = gap <= 1.5 && humidity >= 90 && wind <= 3.5;

  function makeFog() {
    setCooling(82);
    setMoisture(62);
    setWind(1.2);
  }

  function clearAir() {
    setCooling(24);
    setMoisture(34);
    setWind(5.2);
  }

  return (
    <section className="mission-page">
      <MissionHeading
        step={STEPS[1]}
        eyebrow="공기 냉각·수증기·바람 조절하기"
        title="안개가 만들어지는 조건을 직접 설계하세요"
        description="사용자는 원인이 되는 세 가지 조건만 조절합니다. 기온·이슬점·습도·풍속은 서로 연결된 관측 결과로 자동 계산됩니다."
      />

      <div className="experiment-layout">
        <div className={"lab-chamber " + (formed ? "fog-success" : "")}>
          <div className="chamber-top">
            <div>
              <span>FOG CHAMBER 01</span>
              <strong>{formed ? "안개 생성 성공" : "공기 상태 관찰 중"}</strong>
            </div>
            <div className="fog-score">
              <small>안개 가능성</small>
              <strong>{fogScore}%</strong>
            </div>
          </div>
          <div className="air-column">
            <div className="temperature-stream cold"><span>냉각된 공기</span></div>
            <div className="temperature-stream vapor"><span>수증기 공급</span></div>
            <div className="ground-surface" />
            <FogField density={clamp(fogScore / 100, 0.08, 0.95)} drift={clamp(wind / 3, 0.5, 2.2)} />
            <div className="chamber-message">
              <span>{formed ? "CONDENSATION" : "AIR SAMPLE"}</span>
              <strong>{formed ? "기온이 이슬점에 가까워져 응결이 시작됐습니다" : "TA−TD를 1.5℃ 이하로 좁혀보세요"}</strong>
            </div>
          </div>
          <div className="sensor-grid">
            <div><span>기온 TA</span><strong>{temperature.toFixed(1)}℃</strong></div>
            <div><span>이슬점 TD</span><strong>{dewPoint.toFixed(1)}℃</strong></div>
            <div className={gap <= 1.5 ? "good" : ""}><span>이슬점차</span><strong>{gap.toFixed(1)}℃</strong></div>
            <div className={humidity >= 90 ? "good" : ""}><span>습도 HM</span><strong>{humidity}%</strong></div>
            <div><span>풍속 WS</span><strong>{wind.toFixed(1)}m/s</strong></div>
          </div>
        </div>

        <aside className="mission-controls experiment-controls">
          <div className="control-intro">
            <span>실험 목표</span>
            <strong>안개 가능성 80% 이상 만들기</strong>
            <p>TA−TD를 좁히고 높은 습도를 만든 다음, 안개가 유지될 바람 조건을 찾아보세요.</p>
          </div>

          <label className="effect-control">
            <div><span>01 · 공기 식히기</span><strong>{cooling}%</strong></div>
            <input aria-label="공기 식히기" max="100" min="0" type="range" value={cooling} onChange={(e) => setCooling(Number(e.target.value))} />
            <small>올리면 TA가 낮아집니다</small>
          </label>

          <label className="effect-control">
            <div><span>02 · 수증기 공급</span><strong>{moisture}%</strong></div>
            <input aria-label="수증기 공급" max="100" min="0" type="range" value={moisture} onChange={(e) => setMoisture(Number(e.target.value))} />
            <small>올리면 TD와 HM이 높아집니다</small>
          </label>

          <label className="effect-control">
            <div><span>03 · 바람 조절</span><strong>{wind.toFixed(1)}m/s</strong></div>
            <input aria-label="바람 조절" max="7" min="0" step="0.1" type="range" value={wind} onChange={(e) => setWind(Number(e.target.value))} />
            <small>강하면 공기가 섞여 안개가 흩어질 수 있습니다</small>
          </label>

          <div className="preset-row two">
            <button type="button" onClick={makeFog}>안개 조건 만들기</button>
            <button type="button" onClick={clearAir}>맑게 만들기</button>
          </div>

          <div className={"experiment-result " + (formed ? "success" : "")}>
            <span>{formed ? "실험 성공" : "필요 조건"}</span>
            <strong>{formed ? "포화에 가까운 공기 + 약한 바람" : "TA−TD ≤ 1.5℃ · HM ≥ 90%"}</strong>
            <p>{formed ? "직접 만든 규칙을 실제 ASOS 관측자료에 적용할 준비가 됐습니다." : "각 조절값이 관측값에 어떤 영향을 주는지 확인하세요."}</p>
          </div>

          <ContinueButton disabled={!formed} onClick={onComplete} testId="complete-experiment">
            실험 완료 · 실제 데이터 판정하기
          </ContinueButton>
        </aside>
      </div>
    </section>
  );
}

function buildDemoChallenge(station, round) {
  const sample = station.cases[round % station.cases.length];
  return {
    question: {
      challengeId: "demo-" + station.id + "-" + round + "-" + Date.now(),
      station: { code: station.code, name: station.name, terrain: station.terrain },
      observedAt: sample.time,
      clues: {
        temperature: sample.ta,
        dewPoint: sample.td,
        humidity: sample.hm,
        windSpeed: sample.ws,
        dewPointGap: Math.max(0, Number((sample.ta - sample.td).toFixed(1))),
      },
      sourceType: "DEMO_SAMPLE",
      sourceLabel: "학습용 데모 · 기상청 인증키 연결 전",
    },
    answer: {
      actualFog: sample.fog,
      visibilityRaw: Math.round(sample.vs / 10),
      visibilityMeters: sample.vs,
      weatherDescription: sample.ww,
      sourceType: "DEMO_SAMPLE",
      explanation: sample.fog
        ? "시정이 " + formatVisibility(sample.vs) + "로 1 km 미만이고 안개 현상 코드가 함께 기록된 사례입니다."
        : "시정이 " + formatVisibility(sample.vs) + "이며 안개 현상 코드가 확인되지 않은 사례입니다.",
    },
  };
}

function KoreaMap({ visited, onSelect }) {
  return (
    <div className="mission-map">
      <div className="map-caption">
        <span>다섯 안개 유형 지도</span>
        <strong>생성 원리가 다른 지점을 선택하세요</strong>
        <p>냉각안개 3종과 증발안개 2종을 대표 지역의 관측 사건과 연결해 탐구합니다.</p>
      </div>
      <div className="map-board">
        <svg viewBox="0 0 260 390" aria-hidden="true">
          <path className="map-land" d="M136 17 C164 31 176 57 169 83 C194 108 189 142 173 163 C185 193 178 224 157 245 C170 276 154 305 128 322 C118 343 94 344 82 324 C66 304 73 278 91 260 C75 235 71 204 85 178 C66 150 71 118 94 98 C87 68 105 34 136 17 Z" />
          <ellipse className="map-land" cx="86" cy="357" rx="30" ry="11" transform="rotate(-8 86 357)" />
          <path className="map-lines" d="M93 101 C118 119 145 120 178 111 M82 181 C112 188 145 187 178 172 M83 260 C109 251 139 260 163 276" />
        </svg>
        {STATIONS.map((station) => (
          <div
            className={"map-point " + (station.primary ? "primary" : "advanced") + (visited.has(station.id) ? " visited" : "")}
            data-station={station.code}
            key={station.id}
            style={{ left: station.x + "%", top: station.y + "%" }}
          >
            <i />
            <button data-testid={"map-case-" + station.code} type="button" onClick={() => onSelect(station)}>
              <span>{visited.has(station.id) ? "✓ " : ""}{station.name}</span>
              <small>{station.fogType} · {station.terrain}</small>
            </button>
          </div>
        ))}
      </div>
      <div className="map-legend">
        <span><i className="core" /> 냉각안개 대표지점</span>
        <span><i className="advanced" /> 증발안개 대표지점</span>
        <span><i className="done" /> 판정 완료</span>
      </div>
    </div>
  );
}

function ForecastMission({ visited, score, onAttempt, onComplete }) {
  const [station, setStation] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(0);
  const originRef = useRef("local");
  const localAnswerRef = useRef(null);

  async function selectStation(nextStation, nextRound = 0) {
    setStation(nextStation);
    setChallenge(null);
    setPrediction(null);
    setResult(null);
    setLoading(true);
    setRound(nextRound);

    if (API_BASE) {
      try {
        const response = await fetch(API_BASE + "/api/v1/fog-challenges?station=" + nextStation.code);
        if (!response.ok) throw new Error("challenge api error");
        const payload = await response.json();
        if (!payload.challengeId || !payload.clues) throw new Error("challenge format error");
        originRef.current = "backend";
        localAnswerRef.current = null;
        setChallenge(payload);
        setLoading(false);
        return;
      } catch (error) {
        // 데모 전환 상태는 화면의 데이터 출처 배지로 명확히 알린다.
      }
    }

    const demo = buildDemoChallenge(nextStation, nextRound);
    originRef.current = "local";
    localAnswerRef.current = demo.answer;
    setChallenge(demo.question);
    setLoading(false);
  }

  async function submitPrediction() {
    if (!prediction || !challenge || result) return;
    setLoading(true);
    let answer;

    try {
      if (originRef.current === "backend") {
        const response = await fetch(API_BASE + "/api/v1/fog-challenges/" + challenge.challengeId + "/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prediction }),
        });
        if (!response.ok) throw new Error("answer api error");
        answer = await response.json();
      } else {
        answer = {
          ...localAnswerRef.current,
          correct: (prediction === "FOG") === localAnswerRef.current.actualFog,
        };
      }
      setResult(answer);
      onAttempt(station.id, answer.correct);
    } finally {
      setLoading(false);
    }
  }

  function returnToMap() {
    setStation(null);
    setChallenge(null);
    setPrediction(null);
    setResult(null);
  }

  function nextCase() {
    selectStation(station, round + 1);
  }

  if (!station) {
    return (
      <section className="mission-page">
        <MissionHeading
          step={STEPS[2]}
          eyebrow="실제 ASOS 형식 데이터로 의사결정하기"
          title="안개의 다섯 생성 유형을 지역 사례로 탐구하세요"
          description="대표 지역에서 생성 원리를 학습한 뒤 TA·TD·HM·WS로 발생 여부를 판단합니다. 안개 종류는 지역의 대표 탐구 유형이며, 실제 판정 정답인 VS와 WW는 제출 후 공개됩니다."
        />
        <div className="forecast-map-layout">
          <KoreaMap visited={visited} onSelect={selectStation} />
          <aside className="map-sidecard">
            <span>안개 유형 가이드</span>
            <strong>{score.correct} / {score.total}</strong>
            <p>정답 / 전체 판정</p>
            <div className="family-card cooling">
              <small>냉각안개</small>
              <b>복사 · 이류 · 활승</b>
              <p>공기가 이슬점까지 냉각되어 응결</p>
            </div>
            <div className="family-card evaporation">
              <small>증발안개</small>
              <b>전선 · 김</b>
              <p>수증기 공급으로 공기가 포화되어 응결</p>
            </div>
            <p className="source-warning">실 API 키가 없을 때는 결과를 조작하지 않고 ‘학습용 데모’로 표시합니다.</p>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="mission-page">
      <div className="case-topline">
        <button type="button" onClick={returnToMap}>← 사건 지도</button>
        <div><span>{station.name}</span><strong>ASOS {station.code} · {station.terrain}</strong></div>
        <em className={challenge?.sourceType === "KMA_ASOS" ? "live" : "demo"}>
          {challenge?.sourceType === "KMA_ASOS" ? "KMA 실관측" : "학습용 데모"}
        </em>
      </div>

      <div className="case-layout">
        <div className="case-data-panel">
          <div className="case-title">
            <div>
              <span>OBSERVATION CASE</span>
              <h2>이 시각에 안개가 발생했을까요?</h2>
              <p>{challenge?.observedAt || "관측자료를 불러오는 중"}</p>
            </div>
            <div className="locked-label"><span>LOCKED</span><strong>VS · WW</strong></div>
          </div>

          {loading || !challenge ? (
            <div className="data-loading"><i /> 관측자료 준비 중</div>
          ) : (
            <>
              <div className="clue-grid">
                <div><span>기온</span><small>TA</small><strong>{Number(challenge.clues.temperature).toFixed(1)}℃</strong></div>
                <div><span>이슬점</span><small>TD</small><strong>{Number(challenge.clues.dewPoint).toFixed(1)}℃</strong></div>
                <div><span>상대습도</span><small>HM</small><strong>{Math.round(challenge.clues.humidity)}%</strong></div>
                <div><span>풍속</span><small>WS</small><strong>{Number(challenge.clues.windSpeed).toFixed(1)}m/s</strong></div>
              </div>
              <div className="dew-gap">
                <span>가장 먼저 볼 값</span>
                <strong>TA−TD = {Number(challenge.clues.dewPointGap).toFixed(1)}℃</strong>
                <p>0에 가까울수록 공기가 포화되어 응결하기 쉽습니다.</p>
              </div>
              <div className="fog-type-lesson">
                <div className="type-lesson-title">
                  <span>{station.family} · 대표 탐구 유형</span>
                  <strong>{station.fogType}</strong>
                </div>
                <p>{station.mechanism}</p>
                <ol>
                  {station.process.map((item, index) => <li key={item}><b>{index + 1}</b>{item}</li>)}
                </ol>
                <div className="type-conditions">
                  <div><span>잘 생기는 조건</span><p>{station.favorable}</p></div>
                  <div><span>사라지는 조건</span><p>{station.clears}</p></div>
                </div>
                <small>※ 유형은 교육용 대표 시나리오이며 TA·TD·HM·WS만으로 실제 안개 종류를 확정하지 않습니다.</small>
              </div>
            </>
          )}

          {result && (
            <div className={"case-answer " + (result.actualFog ? "fog" : "clear")}>
              <div>
                <span>실제 관측 결과</span>
                <strong>{result.actualFog ? "안개 발생" : "안개 미발생"}</strong>
              </div>
              <em>{formatVisibility(result.visibilityMeters)}</em>
              <p>{result.explanation}</p>
              <div className="answer-fields">
                <span>VS {result.visibilityRaw} × 10m = {result.visibilityMeters}m</span>
                <span>WW {result.weatherDescription}</span>
              </div>
            </div>
          )}
        </div>

        <aside className="prediction-panel">
          <div className="prediction-guide">
            <span>판단 순서</span>
            <ol>
              <li><b>1</b> TA와 TD의 차이를 본다</li>
              <li><b>2</b> HM으로 포화 정도를 본다</li>
              <li><b>3</b> WS로 유지 조건을 본다</li>
            </ol>
          </div>

          {!result ? (
            <div className="prediction-action">
              <span>나의 판정</span>
              <strong>둘 중 하나를 선택하세요</strong>
              <button className={prediction === "FOG" ? "selected fog" : ""} type="button" onClick={() => setPrediction("FOG")}>
                <i>●</i><span>안개 발생</span><small>시정 1 km 미만 예상</small>
              </button>
              <button className={prediction === "NO_FOG" ? "selected clear" : ""} type="button" onClick={() => setPrediction("NO_FOG")}>
                <i>○</i><span>안개 미발생</span><small>시정 1 km 이상 예상</small>
              </button>
              <ContinueButton disabled={!prediction || loading} onClick={submitPrediction} testId="submit-forecast">
                판정 제출 · 정답 공개
              </ContinueButton>
            </div>
          ) : (
            <div className={"prediction-feedback " + (result.correct ? "correct" : "incorrect")}>
              <span>{result.correct ? "CORRECT" : "REVIEW"}</span>
              <strong>{result.correct ? "예보관 판단이 맞았습니다" : "관측 결과와 달랐습니다"}</strong>
              <p>정답보다 중요한 것은 TA−TD·HM·WS를 함께 해석하는 과정입니다.</p>
              <button type="button" onClick={nextCase}>같은 지역 다른 사례</button>
              <ContinueButton onClick={() => onComplete(result.visibilityMeters)}>
                이 시정으로 위험 체험하기
              </ContinueButton>
            </div>
          )}

          <div className="source-card">
            <span>DATA SOURCE</span>
            <p>{challenge?.sourceLabel || "데이터 출처 확인 중"}</p>
            <small>기상청 ASOS 요소: TM·STN·TA·TD·HM·WS·VS·WW</small>
          </div>
        </aside>
      </div>
    </section>
  );
}

function recipeControlProgress(control, value) {
  if (control.goal === "low") {
    return clamp((100 - value) / Math.max(1, 100 - control.target), 0, 1);
  }
  return clamp(value / control.target, 0, 1);
}

function deriveRecipeSensors(recipe, values) {
  let ta = 12;
  let td = 8;
  let ws = 1.5;
  let extraLabel = "환경 단서";
  let extraValue = "-";

  if (recipe.id === "radiation") {
    ta = 20 - values.cooling * 0.14;
    td = 9;
    ws = 0.3 + values.calm * 0.06;
    extraLabel = "지면온도 TS";
    extraValue = (16 - values.cooling * 0.14).toFixed(1) + "℃";
  }
  if (recipe.id === "advection") {
    ta = 18 - values.coldWater * 0.05;
    td = 7 + values.moisture * 0.1;
    ws = 0.8 + values.transport * 0.035;
    extraLabel = "수면온도";
    extraValue = (18 - values.coldWater * 0.09).toFixed(1) + "℃";
  }
  if (recipe.id === "upslope") {
    ta = 18 - values.ascent * 0.1;
    td = 4 + values.moisture * 0.085;
    ws = 0.5 + values.slopeWind * 0.05;
    extraLabel = "상승 고도";
    extraValue = Math.round(values.ascent * 12) + "m";
  }
  if (recipe.id === "frontal") {
    ta = 12 - values.coldGround * 0.06;
    td = 2 + values.warmRain * 0.09;
    ws = 1 + values.meeting * 0.018;
    extraLabel = "강수 RN";
    extraValue = (values.warmRain * 0.015).toFixed(1) + "mm";
  }
  if (recipe.id === "steam") {
    ta = 10 - values.coldAir * 0.12;
    td = -4 + values.warmWater * 0.075;
    ws = 0.2 + values.wind * 0.05;
    extraLabel = "수면온도";
    extraValue = (4 + values.warmWater * 0.12).toFixed(1) + "℃";
  }

  td = Math.min(td, ta - 0.1);
  ta = Number(ta.toFixed(1));
  td = Number(td.toFixed(1));

  return {
    ta,
    td,
    hm: calculateHumidity(ta, td),
    ws: Number(ws.toFixed(1)),
    gap: Number(Math.max(0, ta - td).toFixed(1)),
    extraLabel,
    extraValue,
  };
}

function FogRecipeScene({ recipe, values, score, success }) {
  const movement = values.transport ?? values.ascent ?? values.meeting ?? values.coldAir ?? 0;
  const waterState = values.coldWater ?? values.warmWater ?? 0;

  return (
    <div
      className={"recipe-scene " + recipe.id + (success ? " success" : "")}
      style={{
        "--movement": 10 + movement * 0.65 + "%",
        "--lift": 18 + movement * 0.55 + "%",
        "--warm-front-left": 5 + movement * 0.28 + "%",
        "--cold-front-right": 5 + movement * 0.28 + "%",
        "--water-value": waterState / 100,
        "--darkness-value": (values.darkness ?? 0) / 100,
        "--cooling-value": (values.cooling ?? values.coldGround ?? 0) / 100,
        "--rain-value": (values.warmRain ?? 0) / 100,
      }}
    >
      <div className="recipe-sky" />
      {recipe.id === "radiation" && (
        <>
          <div className="recipe-sun" />
          <div className="recipe-moon">☾</div>
          <div className="recipe-ground"><span>냉각되는 지면</span></div>
        </>
      )}
      {recipe.id === "advection" && (
        <>
          <div className="recipe-water cold"><span>차가운 수면</span></div>
          <div className="recipe-air warm"><i /><span>따뜻하고 습한 공기</span></div>
          <div className="flow-arrow">→</div>
        </>
      )}
      {recipe.id === "upslope" && (
        <>
          <div className="recipe-mountain" />
          <div className="recipe-air slope"><i /><span>습한 공기</span></div>
          <div className="slope-arrow">↗</div>
        </>
      )}
      {recipe.id === "frontal" && (
        <>
          <div className="front-air warm-front"><span>따뜻한 공기</span></div>
          <div className="front-air cold-front"><span>찬 공기</span></div>
          <div className="front-rain">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
          <div className="recipe-ground front-ground"><span>찬 지표 공기층</span></div>
        </>
      )}
      {recipe.id === "steam" && (
        <>
          <div className="recipe-water warm"><span>따뜻한 수면</span></div>
          <div className="recipe-air cold"><i /><span>차가운 공기</span></div>
          <div className="steam-columns">{Array.from({ length: 7 }, (_, index) => <i key={index} />)}</div>
        </>
      )}
      <FogField density={success ? 0.9 : clamp(score / 180, 0.05, 0.48)} drift={0.8} />
      <div className="recipe-scene-status">
        <span>{recipe.family}</span>
        <strong>{success ? recipe.name + " 생성 성공" : recipe.name + " 조건 조합 중"}</strong>
        <p>{success ? "조건이 맞아 공기가 포화·응결했습니다." : "오른쪽 조건을 움직여 장면의 변화를 확인하세요."}</p>
      </div>
      <div className="recipe-score-ring" style={{ "--score": score * 3.6 + "deg" }}>
        <div><span>완성도</span><strong>{score}%</strong></div>
      </div>
    </div>
  );
}

function RepresentativeRegionPanel({ recipe, station }) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState("observed");
  const [loadingStation, setLoadingStation] = useState(null);
  const [observations, setObservations] = useState({});
  const observation = observations[station.code] || null;

  useEffect(() => {
    setOpen(false);
    setViewMode("observed");
  }, [recipe.id]);

  function buildDemoObservation() {
    const demo = REGION_DEMO_OBSERVATIONS[Number(station.code)];
    return {
      ...demo,
      station: { code: station.code, name: station.name, terrain: station.terrain },
      visibilityRaw: Math.round(demo.visibilityMeters / 10),
      fogObserved: true,
      sourceType: "DEMO_SAMPLE",
      sourceLabel: "학습용 예시 · 기상청 인증키 연결 전",
    };
  }

  async function loadObservation(force = false) {
    if (!force && observations[station.code]) return;
    setLoadingStation(station.code);

    try {
      const response = await fetch(API_BASE + "/api/v1/fog-observations/current?station=" + station.code);
      if (!response.ok) throw new Error("observation api error");
      const payload = await response.json();
      if (!payload.observedAt || !payload.station) throw new Error("observation format error");
      setObservations((current) => ({ ...current, [station.code]: payload }));
      setLoadingStation(null);
      return;
    } catch (error) {
      // 실관측 연결 실패 시 화면에서 출처를 명시한 학습용 예시로 전환한다.
    }

    setObservations((current) => ({ ...current, [station.code]: buildDemoObservation() }));
    setLoadingStation(null);
  }

  async function togglePanel() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) await loadObservation();
  }

  const visibilityMeters = Number(observation?.visibilityMeters);
  const hasVisibility = Number.isFinite(visibilityMeters) && visibilityMeters > 0;
  const lowVisibility = hasVisibility && visibilityMeters < 1000;
  const confirmedFog = Boolean(observation?.fogObserved) && lowVisibility;
  const visualDensity = viewMode === "original" || !hasVisibility
    ? 0
    : confirmedFog
      ? clamp((1300 - visibilityMeters) / 1150, 0.28, 0.92)
      : lowVisibility
        ? 0.22
        : 0.03;
  const statusClass = !observation || !hasVisibility ? "missing" : confirmedFog ? "fog" : lowVisibility ? "low" : "clear";
  const statusText = !observation || !hasVisibility
    ? "자료 확인 중"
    : confirmedFog
      ? "현재 안개 관측"
      : lowVisibility
        ? "저시정 · 안개 미확인"
        : "현재 안개 없음";

  return (
    <section className={"region-observation " + (open ? "open" : "")}>
      <button
        aria-expanded={open}
        className="region-observation-trigger"
        data-testid={"region-observation-" + station.code}
        type="button"
        onClick={togglePanel}
      >
        <div>
          <span>실제 관측으로 연결</span>
          <strong>{recipe.name} 학습 대표지역 · {station.name}</strong>
          <small>TM · STN · VS · WW로 현재 관측상태를 확인합니다.</small>
        </div>
        <b>{open ? "접기 ↑" : "현재 관측 보기 ↓"}</b>
      </button>

      {open && (
        <div className="region-observation-body">
          <div className={"region-photo " + recipe.id}>
            {REGION_PHOTOS[station.id] ? (
              <img className="region-photo-image" src={REGION_PHOTOS[station.id]} alt={station.name + " 대표지역"} />
            ) : (
              <div className="region-photo-placeholder">
                <span>REGION PHOTO</span>
                <strong>{station.name} 지역 사진 영역</strong>
                <p>나중에 실제 사진으로 교체할 수 있습니다.</p>
              </div>
            )}
            <div className="region-silhouette"><i /><i /><i /></div>
            <FogField density={visualDensity} drift={0.72} />
            <div className="region-photo-caption">
              <span>{viewMode === "original" ? "원본 사진" : "현재 관측 시정 적용"}</span>
              <strong>{hasVisibility ? formatVisibility(visibilityMeters) : "자료 없음"}</strong>
            </div>
            <div className="region-photo-mode" aria-label="사진 비교 방식">
              <button className={viewMode === "original" ? "active" : ""} type="button" onClick={() => setViewMode("original")}>원본</button>
              <button className={viewMode === "observed" ? "active" : ""} type="button" onClick={() => setViewMode("observed")}>관측값 적용</button>
            </div>
          </div>

          <aside className="region-observation-data">
            <div className="region-data-heading">
              <div>
                <span>{recipe.name} 학습 대표지역</span>
                <strong>{station.name} · STN {station.code}</strong>
              </div>
              <em className={statusClass}><i />{statusText}</em>
            </div>

            {loadingStation === station.code ? (
              <div className="region-loading"><i /> 최신 ASOS 관측자료를 불러오는 중…</div>
            ) : observation && (
              <>
                <div className="region-data-grid">
                  <div><span>관측시각 TM</span><strong>{observation.observedAt}</strong></div>
                  <div><span>관측지점 STN</span><strong>{observation.station.code}</strong></div>
                  <div><span>시정 VS</span><strong>{hasVisibility ? formatVisibility(visibilityMeters) : "결측"}</strong><small>원자료 {observation.visibilityRaw ?? "-"} × 10m</small></div>
                  <div><span>현재일기 WW</span><strong>{observation.weatherDescription || "관측정보 없음"}</strong><small>코드 {observation.weatherCode || "-"}</small></div>
                </div>

                <div className={"region-interpretation " + statusClass}>
                  <span>관측 해석</span>
                  <strong>{confirmedFog
                    ? "시정이 1 km 미만이고 WW에서 안개 현상이 확인됐습니다."
                    : lowVisibility
                      ? "시정은 1 km 미만이지만 WW에서 안개 현상을 확인하지 못했습니다."
                      : "현재 관측 시정은 안개 기준인 1 km 이상입니다."}</strong>
                </div>

                <div className="region-data-actions">
                  <div>
                    <span className={observation.sourceType === "KMA_ASOS" ? "live" : "demo"}>
                      {observation.sourceType === "KMA_ASOS" ? "KMA ASOS 실관측" : "학습용 예시"}
                    </span>
                    <small>{observation.sourceLabel}</small>
                  </div>
                  <button disabled={loadingStation === station.code} type="button" onClick={() => loadObservation(true)}>새로고침</button>
                </div>
              </>
            )}

            <p className="region-disclaimer">실제 관측값을 지역 사진에 적용한 교육용 시각화입니다. 현재 관측된 안개의 생성 유형을 판별하지는 않습니다.</p>
          </aside>
        </div>
      )}
    </section>
  );
}

function FogRecipeMission({ completedIds, onProgress, onComplete }) {
  const [selectedId, setSelectedId] = useState("radiation");
  const [valuesByType, setValuesByType] = useState(() =>
    Object.fromEntries(FOG_RECIPES.map((recipe) => {
      if (!completedIds.includes(recipe.id)) return [recipe.id, { ...recipe.initial }];
      return [recipe.id, Object.fromEntries(recipe.controls.map((control) => [
        control.key,
        control.goal === "low" ? Math.max(0, control.target - 10) : Math.min(100, control.target + 10),
      ]))];
    })),
  );
  const [completedTypes, setCompletedTypes] = useState(() => new Set(completedIds));
  const recipe = FOG_RECIPES.find((item) => item.id === selectedId);
  const content = STATIONS.find((station) => station.id === recipe.stationId);
  const values = valuesByType[selectedId];
  const progressValues = recipe.controls.map((control) => recipeControlProgress(control, values[control.key]));
  const score = Math.round((progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) * 100);
  const success = recipe.controls.every((control) =>
    control.goal === "low" ? values[control.key] <= control.target : values[control.key] >= control.target,
  );
  const sensors = deriveRecipeSensors(recipe, values);
  const estimatedVisibility = Math.round(clamp(1500 - score * 12, 280, 1300));

  useEffect(() => {
    if (!success || completedTypes.has(recipe.id)) return;
    const next = new Set([...completedTypes, recipe.id]);
    setCompletedTypes(next);
    onProgress([...next]);
  }, [success, recipe.id, completedTypes, onProgress]);

  function updateControl(key, value) {
    setValuesByType((current) => ({
      ...current,
      [selectedId]: { ...current[selectedId], [key]: value },
    }));
  }

  function completeConditions() {
    const nextValues = {};
    recipe.controls.forEach((control) => {
      nextValues[control.key] = control.goal === "low" ? Math.max(0, control.target - 10) : Math.min(100, control.target + 10);
    });
    setValuesByType((current) => ({ ...current, [selectedId]: nextValues }));
  }

  function resetConditions() {
    setValuesByType((current) => ({ ...current, [selectedId]: { ...recipe.initial } }));
  }

  function selectRecipe(id) {
    setSelectedId(id);
  }

  return (
    <section className="mission-page">
      <MissionHeading
        step={STEPS[2]}
        eyebrow="조건을 움직여 다섯 안개 직접 만들기"
        title="상황에 따른 안개의 5가지 종류"
        description="지역을 외우는 대신 공기 이동·지면과 수면 상태·수증기 공급을 직접 조절합니다. 2페이지의 공통 응결 원리가 다섯 가지 생성 방식으로 어떻게 달라지는지 확인하세요."
      />

      <div className="recipe-tabs" aria-label="안개 제작 미션">
        {FOG_RECIPES.map((item) => (
          <button
            aria-pressed={item.id === selectedId}
            className={(item.id === selectedId ? "active " : "") + (completedTypes.has(item.id) ? "complete" : "")}
            key={item.id}
            type="button"
            onClick={() => selectRecipe(item.id)}
          >
            <span>{completedTypes.has(item.id) ? "✓" : item.family === "냉각안개" ? "C" : "E"}</span>
            <div><small>{item.family}</small><strong>{item.name}</strong></div>
          </button>
        ))}
        <div className="recipe-total"><span>완성</span><strong>{completedTypes.size} / 5</strong></div>
      </div>

      <div className="recipe-layout">
        <div>
          <FogRecipeScene recipe={recipe} values={values} score={score} success={success} />
          <div className="recipe-sensors">
            <div><span>기온 TA</span><strong>{sensors.ta.toFixed(1)}℃</strong></div>
            <div><span>이슬점 TD</span><strong>{sensors.td.toFixed(1)}℃</strong></div>
            <div><span>습도 HM</span><strong>{sensors.hm}%</strong></div>
            <div><span>풍속 WS</span><strong>{sensors.ws.toFixed(1)}m/s</strong></div>
            <div><span>{sensors.extraLabel}</span><strong>{sensors.extraValue}</strong></div>
          </div>
        </div>

        <aside className="mission-controls recipe-controls">
          <div className="control-intro">
            <span>{recipe.family} · 제작 미션</span>
            <strong>{recipe.name}</strong>
            <p>{recipe.subtitle}</p>
          </div>

          <div className="recipe-process">
            {content.process.map((item, index) => <div key={item}><b>{index + 1}</b><span>{item}</span></div>)}
          </div>

          {recipe.controls.map((control) => (
            <label className={"effect-control recipe-control " + (recipeControlProgress(control, values[control.key]) >= 1 ? "ready" : "")} key={control.key}>
              <div><span>{control.label}</span><strong>{values[control.key]}%</strong></div>
              <input
                aria-label={control.label}
                max="100"
                min="0"
                type="range"
                value={values[control.key]}
                onChange={(event) => updateControl(control.key, Number(event.target.value))}
              />
              <small>{control.hint}</small>
            </label>
          ))}

          <div className="preset-row two">
            <button type="button" onClick={completeConditions}>조건 완성하기</button>
            <button type="button" onClick={resetConditions}>초기화</button>
          </div>

          <div className={"recipe-result " + (success ? "success" : "")}>
            <span>{success ? "생성 성공" : "조건 조합 중"}</span>
            <strong>{success ? content.mechanism : "세 조건의 완성도를 모두 채워보세요."}</strong>
            {success && <p>예상 시정 {formatVisibility(estimatedVisibility)} · {content.clears}</p>}
          </div>

          <ContinueButton
            disabled={!success}
            onClick={() => onComplete(estimatedVisibility, [...new Set([...completedTypes, recipe.id])])}
            testId="complete-recipes"
          >
            현재 안개로 도로 게임 체험하기
          </ContinueButton>
        </aside>
      </div>

      <RepresentativeRegionPanel recipe={recipe} station={content} />
    </section>
  );
}

function SafetyMission({ visibility, finished, typeCount, safetyScore, onFinish, onRestart }) {
  const activeVisibility = visibility || 480;
  const [lane, setLane] = useState(1);
  const [running, setRunning] = useState(false);
  const [distance, setDistance] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const [lives, setLives] = useState(3);
  const [won, setWon] = useState(false);
  const [impact, setImpact] = useState(false);
  const [steering, setSteering] = useState("");
  const [viewMode, setViewMode] = useState("first");
  const [eventText, setEventText] = useState("시작 버튼을 누르면 안개 구간 주행이 시작됩니다.");
  const laneRef = useRef(1);
  const livesRef = useRef(3);
  const tickRef = useRef(0);
  const obstacleIdRef = useRef(0);
  const hitIdsRef = useRef(new Set());
  const passedIdsRef = useRef(new Set());
  const impactTimerRef = useRef(null);
  const steeringTimerRef = useRef(null);
  const targetDistance = 500;
  const lanePositions = ["22%", "50%", "78%"];
  const visibilityPressure = clamp((1600 - activeVisibility) / 1250, 0, 1);
  const fogOpacity = clamp((1900 - activeVisibility) / 1250, 0.28, 0.98);
  const thirdPersonFogOpacity = clamp((1700 - activeVisibility) / 1500, 0.16, 0.94);
  const revealStart = activeVisibility < 200 ? 76 : activeVisibility < 500 ? 64 : activeVisibility < 1000 ? 45 : 16;
  const firstPersonRevealStart = Math.max(8, revealStart - 23);
  const recommendedSpeed = activeVisibility < 500 ? 30 : activeVisibility < 1000 ? 40 : 60;
  const reactionLabel = activeVisibility < 500 ? "매우 짧음" : activeVisibility < 1000 ? "짧음" : "보통";
  const riskLabel = activeVisibility < 500 ? "위험" : activeVisibility < 1000 ? "주의" : "보통";
  const laneShift = (1 - lane) * 14;
  const wheelTurn = (lane - 1) * 18;
  const laneOpacity = clamp(0.72 - visibilityPressure * 0.52, 0.18, 0.72);
  const laneBlur = 0.4 + visibilityPressure * 1.8;
  const fogBlur = 10 + visibilityPressure * 18;
  const farFogOpacity = clamp(0.42 + visibilityPressure * 0.38, 0.42, 0.8);
  const nearFogOpacity = clamp(0.34 + visibilityPressure * 0.36, 0.34, 0.7);
  const roadFogOpacity = clamp(0.3 + visibilityPressure * 0.34, 0.3, 0.64);
  const gameScore = Math.round((lives / 3) * 100);

  function getLanePosition(laneIndex, y) {
    const depth = clamp((y + 12) / 112, 0.08, 1);
    const spread = 7 + Math.pow(depth, 0.74) * 22;
    return 50 + (laneIndex - 1) * spread;
  }

  function getObstacleVisual(obstacle) {
    const depth = clamp((obstacle.y + 12) / 112, 0, 1);
    const opacity = clamp(((obstacle.y - firstPersonRevealStart) / (100 - firstPersonRevealStart)) * 1.55, 0.01, 1);
    const blur = clamp((1 - depth) * 15 * visibilityPressure, 0, 14);
    const scale = clamp(0.18 + depth * 1.38, 0.18, 1.48);
    const brightness = clamp(0.46 + depth * 0.7, 0.46, 1.12);
    const contrast = clamp(0.58 + depth * 0.42, 0.58, 1);

    return {
      left: getLanePosition(obstacle.lane, obstacle.y) + "%",
      top: clamp(23 + obstacle.y * 0.72, 13, 96) + "%",
      opacity,
      filter: "blur(" + blur.toFixed(2) + "px) brightness(" + brightness.toFixed(2) + ") contrast(" + contrast.toFixed(2) + ")",
      transform: "translate(-50%, -50%) scale(" + scale.toFixed(2) + ")",
    };
  }

  function getThirdPersonObstacleVisual(obstacle) {
    return {
      left: lanePositions[obstacle.lane],
      top: obstacle.y + "%",
      opacity: clamp(((obstacle.y - revealStart) / (100 - revealStart)) * 1.35, 0.02, 1),
      transform: "translate(-50%, -50%) scale(" + clamp(0.38 + obstacle.y / 135, 0.35, 1.08) + ")",
    };
  }

  useEffect(() => {
    laneRef.current = lane;
  }, [lane]);

  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);

  useEffect(() => () => {
    if (impactTimerRef.current) window.clearTimeout(impactTimerRef.current);
    if (steeringTimerRef.current) window.clearTimeout(steeringTimerRef.current);
  }, []);

  function triggerImpact() {
    if (impactTimerRef.current) window.clearTimeout(impactTimerRef.current);
    setImpact(true);
    impactTimerRef.current = window.setTimeout(() => {
      setImpact(false);
      impactTimerRef.current = null;
    }, 360);
  }

  function triggerSteering(direction) {
    if (steeringTimerRef.current) window.clearTimeout(steeringTimerRef.current);
    setSteering(direction < 0 ? "left" : "right");
    steeringTimerRef.current = window.setTimeout(() => {
      setSteering("");
      steeringTimerRef.current = null;
    }, 260);
  }

  function changeLane(direction) {
    if (!running) return;
    setLane((current) => {
      const next = clamp(current + direction, 0, 2);
      if (next !== current) {
        triggerSteering(direction);
        setEventText(direction < 0 ? "왼쪽 차선으로 이동했습니다. 전방 시야를 다시 확인하세요." : "오른쪽 차선으로 이동했습니다. 전방 시야를 다시 확인하세요.");
      }
      return next;
    });
  }

  useEffect(() => {
    if (!running) return undefined;
    const distanceStep = viewMode === "third" ? 4 : 1.33;
    const obstacleSpawnEvery = viewMode === "third" ? 18 : 24;
    const obstacleStep = viewMode === "third" ? 3.6 : 3.4;

    const timer = window.setInterval(() => {
      tickRef.current += 1;

      setDistance((current) => {
        const next = Math.min(targetDistance, current + distanceStep);
        if (next >= targetDistance) {
          setRunning(false);
          setWon(true);
          setEventText("안개 구간 500m를 완주했습니다!");
        }
        return next;
      });

      if (tickRef.current % obstacleSpawnEvery === 0) {
        const nextId = obstacleIdRef.current + 1;
        obstacleIdRef.current = nextId;
        setObstacles((current) => [
          ...current,
          { id: nextId, lane: (nextId * 2 + Math.floor(nextId / 2)) % 3, y: -8, type: nextId % 2 ? "barrier" : "vehicle" },
        ]);
      }

      setObstacles((current) => {
        let collisionId = null;
        const moved = current
          .map((item) => ({ ...item, y: item.y + obstacleStep }))
          .filter((item) => item.y < 112);

        moved.forEach((item) => {
          if (
            item.lane === laneRef.current
            && item.y >= 76
            && item.y <= 89
            && !hitIdsRef.current.has(item.id)
          ) {
            collisionId = item.id;
          }

          if (
            item.lane !== laneRef.current
            && item.y >= 88
            && item.y <= 96
            && !passedIdsRef.current.has(item.id)
          ) {
            passedIdsRef.current.add(item.id);
            setEventText("위험 회피! 안개 구간에서는 여유 있는 판단이 중요합니다.");
          }
        });

        if (collisionId !== null) {
          hitIdsRef.current.add(collisionId);
          triggerImpact();
          setEventText("충돌! 안개에서는 장애물을 더 늦게 발견할 수 있습니다.");
          setLives((currentLives) => {
            const nextLives = Math.max(0, currentLives - 1);
            if (nextLives === 0) {
              setRunning(false);
              setEventText("주행 실패. 속도를 줄이고 더 빠르게 차선을 판단해보세요.");
            }
            return nextLives;
          });
        }

        return moved.filter((item) => item.id !== collisionId);
      });
    }, 60);

    return () => window.clearInterval(timer);
  }, [running, viewMode]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (!running) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeLane(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        changeLane(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [running]);

  function startGame() {
    setLane(1);
    laneRef.current = 1;
    setDistance(0);
    setObstacles([]);
    setLives(3);
    livesRef.current = 3;
    setWon(false);
    setSteering("");
    tickRef.current = 0;
    obstacleIdRef.current = 0;
    hitIdsRef.current = new Set();
    passedIdsRef.current = new Set();
    setImpact(false);
    if (impactTimerRef.current) {
      window.clearTimeout(impactTimerRef.current);
      impactTimerRef.current = null;
    }
    if (steeringTimerRef.current) {
      window.clearTimeout(steeringTimerRef.current);
      steeringTimerRef.current = null;
    }
    setEventText("주행 중입니다. 가까워지는 장애물을 피해 차선을 바꾸세요.");
    setRunning(true);
  }

  function moveLane(direction) {
    changeLane(direction);
  }

  if (finished) {
    return (
      <section className="mission-page">
        <div className="final-report">
          <div className="report-badge">MISSION COMPLETE</div>
          <span>FOG LAB 탐구 결과</span>
          <h2>안개 연구 임무를 완료했습니다</h2>
          <p>현상 관찰부터 안개 유형 제작, 시정 저하 도로 체험까지 하나의 과정으로 탐구했습니다.</p>
          <div className="report-score">
            <div><span>완성한 안개</span><strong>{typeCount} / 5</strong></div>
            <div><span>체험 시정</span><strong>{formatVisibility(activeVisibility)}</strong></div>
            <div><span>주행 점수</span><strong>{safetyScore}점</strong></div>
          </div>
          <div className="learning-results">
            <div><b>✓</b><span>구름과 안개의 차이를 높이와 시정으로 설명할 수 있습니다.</span></div>
            <div><b>✓</b><span>기온·이슬점·습도·풍속의 연결 관계를 설명할 수 있습니다.</span></div>
            <div><b>✓</b><span>냉각·증발 방식에 따른 다섯 안개의 생성 조건을 구분할 수 있습니다.</span></div>
            <div><b>✓</b><span>낮은 시정에서 필요한 안전행동을 선택할 수 있습니다.</span></div>
          </div>
          <button className="restart-button" type="button" onClick={onRestart}>처음부터 다시 탐구하기</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mission-page">
      <MissionHeading
        step={STEPS[3]}
        eyebrow="도로 주행하기"
        title={"안개구간!  가시거리의 위험도를 직접 체험하기"}
         description={visibility ? "" : "가시거리가 줄어들고 시야가 제한됩니다"}
      />

      <div className="safety-layout">
        {viewMode === "first" ? (
          <div
            className={"road-simulator game-road first-person-game lane-" + lane + " " + (running ? "running " : "") + (impact ? "impact " : "") + (steering ? "steering steering-" + steering : "")}
            style={{
              "--fog-pressure": visibilityPressure,
              "--fog-opacity": fogOpacity,
              "--driver-shift": laneShift + "%",
              "--wheel-turn": wheelTurn + "deg",
              "--lane-opacity": laneOpacity,
              "--lane-blur": laneBlur.toFixed(2) + "px",
              "--fog-blur": fogBlur.toFixed(2) + "px",
              "--far-fog-opacity": farFogOpacity,
              "--near-fog-opacity": nearFogOpacity,
              "--road-fog-opacity": roadFogOpacity,
            }}
          >
            <div className="road-sky">
              <div className="road-mountain one" />
              <div className="road-mountain two" />
            </div>
            <div className="road-horizon">
              <span>FOG ZONE</span>
            </div>
            <div className="road-surface game-surface first-person-road">
              <div className="road-depth-shade" />
              <i className="lane-line left" />
              <i className="lane-line right" />
              <div className="driver-lane-focus" style={{ left: getLanePosition(lane, 92) + "%" }}>
                <span />
              </div>
              {obstacles.map((obstacle) => (
                <div
                  className={"road-obstacle " + obstacle.type}
                  key={obstacle.id}
                  style={getObstacleVisual(obstacle)}
                ><i /><i /></div>
              ))}
            </div>
            <div className="fog-bank fog-bank-far" aria-hidden="true" />
            <div className="fog-bank fog-bank-near" aria-hidden="true" />
            <div className="fog-depth-veil" style={{ opacity: clamp(fogOpacity * 0.98, 0.3, 0.9) }} />
            <div className="windshield-frame" aria-hidden="true" />
            <div className="dashboard-cockpit" aria-hidden="true">
              <div className="dashboard-glow" />
              <div className="dashboard-gauge">
                <span>VIS</span>
                <strong>{formatVisibility(activeVisibility)}</strong>
              </div>
              <div className="driver-wheel" />
            </div>
            <div className="impact-flash" aria-hidden="true" />
            <FogField density={clamp(fogOpacity * 0.95 + visibilityPressure * 0.08, 0.35, 0.9)} drift={0.7} />
            <div className="road-hud driver-hud">
              <div><span>시정</span><strong>{formatVisibility(activeVisibility)}</strong></div>
              <div><span>권장속도</span><strong>{recommendedSpeed}km/h</strong></div>
              <div><span>현재 차선</span><strong>{lane + 1}차선</strong></div>
              <div><span>반응 여유</span><strong>{reactionLabel}</strong></div>
              <div><span>남은 기회</span><strong>{"♥".repeat(lives)}{"♡".repeat(3 - lives)}</strong></div>
            </div>
            <div className="lane-presence" aria-hidden="true">
              {[0, 1, 2].map((laneIndex) => (
                <span className={lane === laneIndex ? "active" : ""} key={laneIndex}>{laneIndex + 1}차선</span>
              ))}
            </div>
            {!running && distance === 0 && (
              <div className="game-ready">
                <span>FOG ROAD MISSION</span>
                <strong>운전석 시야로 안개구간 500m 완주</strong>
                <p>장애물은 안개 속에서 가까워질수록 선명해집니다. 차선을 미리 판단해보세요.</p>
              </div>
            )}
            <div className={"safety-status " + (won ? "safe" : lives === 0 ? "danger" : "")}>
              <span>{won ? "CLEAR" : running ? "DRIVING" : lives === 0 ? "FAILED" : "READY"}</span>
              <strong>{eventText}</strong>
            </div>
          </div>
        ) : (
          <div
            className={"road-simulator game-road third-person-game " + (running ? "running " : "") + (impact ? "impact" : "")}
            style={{
              "--third-fog-pressure": visibilityPressure,
              "--third-fog-wash": clamp(thirdPersonFogOpacity * 0.72 + visibilityPressure * 0.1, 0.16, 0.82),
            }}
          >
            <div className="road-sky">
              <div className="road-mountain one" />
              <div className="road-mountain two" />
            </div>
            <div className="road-surface game-surface third-person-road">
              <i className="lane-line left" />
              <i className="lane-line right" />
              {obstacles.map((obstacle) => (
                <div
                  className={"road-obstacle " + obstacle.type}
                  key={obstacle.id}
                  style={getThirdPersonObstacleVisual(obstacle)}
                ><i /><i /></div>
              ))}
              <div className="game-car" style={{ left: lanePositions[lane] }}>
                <i /><i /><span />
              </div>
            </div>
            <div className="impact-flash" aria-hidden="true" />
            <div className="third-person-fog-wash" aria-hidden="true" />
            <FogField density={thirdPersonFogOpacity} drift={0.7} />
            <div className="road-hud">
              <div><span>관측 시정</span><strong>{formatVisibility(activeVisibility)}</strong></div>
              <div><span>주행 거리</span><strong>{distance} / {targetDistance}m</strong></div>
              <div><span>남은 기회</span><strong>{"♥".repeat(lives)}{"♡".repeat(3 - lives)}</strong></div>
            </div>
            {!running && distance === 0 && (
              <div className="game-ready">
                <span>FOG ROAD MISSION</span>
                <strong>장애물을 피하며 500m 완주</strong>
                <p>시정이 짧을수록 장애물이 가까워져야 선명하게 보입니다.</p>
              </div>
            )}
            <div className={"safety-status " + (won ? "safe" : lives === 0 ? "danger" : "")}>
              <span>{won ? "CLEAR" : running ? "DRIVING" : lives === 0 ? "FAILED" : "READY"}</span>
              <strong>{eventText}</strong>
            </div>
          </div>
        )}

        <aside className="mission-controls safety-controls game-controls">
          <div className="control-intro">
            <span>주행 임무</span>
            <strong>{viewMode === "first" ? "운전석 시야로 500m 완주" : "장애물을 피해 500m 완주"}</strong>
            <p>화면 버튼 또는 키보드 ← → 키로 차선을 바꾸세요.</p>
          </div>

          <div className="view-mode-toggle" aria-label="주행 시점 선택">
            <span>시점 선택</span>
            <div>
              <button
                className={viewMode === "first" ? "active" : ""}
                type="button"
                aria-pressed={viewMode === "first"}
                onClick={() => setViewMode("first")}
              >
                1인칭
                <small>운전석 시야</small>
              </button>
              <button
                className={viewMode === "third" ? "active" : ""}
                type="button"
                aria-pressed={viewMode === "third"}
                onClick={() => setViewMode("third")}
              >
                3인칭
                <small>기존 차량 화면</small>
              </button>
            </div>
          </div>

          <div className="visibility-game-info">
            <span>현재 시정</span>
            <strong>{formatVisibility(activeVisibility)}</strong>
            <p>{riskLabel}: {activeVisibility < 500 ? "장애물이 매우 가까워진 뒤 선명해집니다." : activeVisibility < 1000 ? "안개 기준 1 km 미만으로 반응 여유가 짧습니다." : "시정은 비교적 양호하지만 전방 주시가 필요합니다."}</p>
          </div>

          <div className="lane-controls" aria-label="차선 이동">
            <button aria-label="왼쪽 차선으로 이동" disabled={!running || lane === 0} type="button" onClick={() => moveLane(-1)}>←<span>왼쪽</span></button>
            <div><span>현재 차선</span><strong>{lane + 1}</strong></div>
            <button aria-label="오른쪽 차선으로 이동" disabled={!running || lane === 2} type="button" onClick={() => moveLane(1)}><span>오른쪽</span>→</button>
          </div>

          <div className="game-progress">
            <div><span>완주 진행률</span><strong>{Math.round((distance / targetDistance) * 100)}%</strong></div>
            <i><b style={{ width: (distance / targetDistance) * 100 + "%" }} /></i>
          </div>

          {!running && !won && (
            <button className="game-start" data-testid="start-fog-game" type="button" onClick={startGame}>
              {distance > 0 || lives === 0 ? "다시 도전하기" : "안개 도로 주행 시작"}
            </button>
          )}

          {running && <div className="game-live">주행 중 · 방향키로 차선 변경</div>}

          {won && (
            <div className="game-success-card">
              <span>MISSION CLEAR</span>
              <strong>남은 기회 {lives}개 · 주행 점수 {gameScore}점</strong>
              <p>낮은 시정에서는 속도를 줄이고 차간거리를 늘려야 장애물에 대응할 시간이 확보됩니다.</p>
            </div>
          )}

          {won && (
            <button className="game-retry" type="button" onClick={startGame}>
              다시하기
            </button>
          )}

          <div className="game-safety-tips">
            <span>안개 도로 안전수칙</span>
            <p><b>01</b> 감속하고 앞차와 충분한 거리를 둡니다.</p>
            <p><b>02</b> 전조등을 켜고 급제동·급차선 변경을 피합니다.</p>
          </div>

          <ContinueButton disabled={!won} onClick={() => onFinish(gameScore)} testId="complete-safety">
            주행 완료 · 탐구 결과 보기
          </ContinueButton>
        </aside>
      </div>
    </section>
  );
}

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const [completedFogTypes, setCompletedFogTypes] = useState([]);
  const [caseVisibility, setCaseVisibility] = useState(null);
  const [finished, setFinished] = useState(false);
  const [safetyScore, setSafetyScore] = useState(0);

  function completeStep(stepId, nextIndex) {
    setCompleted((current) => new Set([...current, stepId]));
    setActiveStep(nextIndex);
  }

  function completeRecipes(visibility, completedIds) {
    setCaseVisibility(visibility);
    setCompletedFogTypes(completedIds);
    completeStep("forecast", 3);
  }

  function finishMission(nextSafetyScore) {
    setSafetyScore(nextSafetyScore);
    setCompleted((current) => new Set([...current, "safety"]));
    setFinished(true);
  }

  function restart() {
    setActiveStep(0);
    setCompleted(new Set());
    setCompletedFogTypes([]);
    setCaseVisibility(null);
    setFinished(false);
    setSafetyScore(0);
  }

  const progress = Math.round((completed.size / STEPS.length) * 100);

  return (
    <main className="mission-app">
      <header className="app-topbar">
        <div className="brand">
          <div className="brand-mark"><i /><i /><i /></div>
          <div>
            <span>WEATHER DATA LEARNING LAB</span>
            <strong>FOG LAB</strong>
          </div>
        </div>
        <div className="top-progress">
          <div><span>탐구 진행률</span><strong>{progress}%</strong></div>
          <i><b style={{ width: progress + "%" }} /></i>
        </div>
        <div className="data-chip"><i /> KMA ASOS 기반</div>
      </header>

      <nav className="journey-nav" aria-label="안개 탐구 단계">
        {STEPS.map((step, index) => (
          <button
            aria-current={activeStep === index ? "step" : undefined}
            className={(activeStep === index ? "active " : "") + (completed.has(step.id) ? "complete" : "")}
            key={step.id}
            type="button"
            onClick={() => setActiveStep(index)}
          >
            <span>{completed.has(step.id) ? "✓" : step.number}</span>
            <div><small>{step.role}</small><strong>{step.title}</strong></div>
            <em>{step.action}</em>
          </button>
        ))}
      </nav>

      <div className="journey-line" aria-hidden="true"><i style={{ width: progress + "%" }} /></div>

      {activeStep === 0 && <ObserveMission onComplete={() => completeStep("observe", 1)} />}
      {activeStep === 1 && <ExperimentMission onComplete={() => completeStep("experiment", 2)} />}
      {activeStep === 2 && (
        <FogRecipeMission
          completedIds={completedFogTypes}
          onProgress={setCompletedFogTypes}
          onComplete={completeRecipes}
        />
      )}
      {activeStep === 3 && (
        <SafetyMission
          finished={finished}
          typeCount={completedFogTypes.length}
          safetyScore={safetyScore}
          visibility={caseVisibility}
          onFinish={finishMission}
          onRestart={restart}
        />
      )}

      <footer className="app-footer">
        <div><span>기상데이터</span><strong>TM · STN · TA · TD · HM · WS · VS · WW</strong></div>
        <p>기상청 ASOS 자료를 활용한 체험·참여형 교육 콘텐츠</p>
        <div><span>AI 활용</span><strong>개발 보조 · 테스트 생성 · 데이터 검증</strong></div>
      </footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
