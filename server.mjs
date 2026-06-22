import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const STATIONS = {
  "93": { code: "93", name: "북춘천", terrain: "호수 인접" },
  "100": { code: "100", name: "대관령", terrain: "산지" },
  "108": { code: "108", name: "서울", terrain: "수도권 내륙" },
  "112": { code: "112", name: "인천", terrain: "서해안" },
  "146": { code: "146", name: "전주", terrain: "내륙 평야" },
};

const FIELD_ORDER = [
  "TM", "STN", "WD", "WS", "GST_WD", "GST_WS", "GST_TM", "PA", "PS", "PT", "PR",
  "TA", "TD", "HM", "PV", "RN", "RN_DAY", "RN_INT", "SD_HR3", "SD_DAY", "SD_TOT",
  "WC", "WP", "WW", "CA_TOT", "CA_MID", "CH_MIN", "CT", "CT_TOP", "CT_MID", "CT_LOW",
  "VS", "SS", "SI", "ST_GD", "TS", "TE_005", "TE_01", "TE_02", "TE_03", "ST_SEA",
  "WH", "BF", "IR", "IX", "RN_JUN",
];

const WEATHER_NAMES = {
  "16": "안개",
  "17": "낮은안개",
  "18": "땅안개",
  "19": "얼음안개",
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map();

function loadEnvFile(fileName) {
  try {
    const source = readFileSync(resolve(fileName), "utf8");
    source.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const separator = trimmed.indexOf("=");
      if (separator < 1) return;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      value = value.replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

loadEnvFile(".env.server");
loadEnvFile(".env.local");

function decodeKmaResponse(buffer) {
  try {
    return new TextDecoder("euc-kr").decode(buffer);
  } catch (error) {
    return new TextDecoder("utf-8").decode(buffer);
  }
}

function parseFogCodes(rawCode) {
  if (!rawCode || /^-+$/.test(rawCode) || Number(rawCode) < 0) return [];
  const normalized = String(rawCode).replace(/[^0-9]/g, "");
  const pairs = normalized.match(/.{1,2}/g) || [];
  return pairs.filter((code) => WEATHER_NAMES[code]);
}

function parseCurrentObservation(rawText, stationCode) {
  const rows = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && /^\d{10,12}\s+\d+\s+/.test(line));

  const matchingRows = rows.filter((line) => String(Number(line.split(/\s+/)[1])) === String(Number(stationCode)));
  const row = matchingRows.at(-1);
  if (!row) throw new Error("KMA response did not contain the requested station");

  const values = row.split(/\s+/);
  const data = Object.fromEntries(FIELD_ORDER.map((field, index) => [field, values[index]]));
  const rawVisibility = Number(data.VS);
  const visibilityRaw = Number.isFinite(rawVisibility) && rawVisibility >= 0 ? rawVisibility : null;
  const visibilityMeters = visibilityRaw === null ? null : visibilityRaw * 10;
  const fogCodes = parseFogCodes(data.WW);

  return {
    station: STATIONS[stationCode],
    observedAt: data.TM,
    visibilityRaw,
    visibilityMeters,
    weatherCode: data.WW && Number(data.WW) >= 0 ? data.WW : null,
    weatherDescription: fogCodes.length ? fogCodes.map((code) => WEATHER_NAMES[code]).join(" · ") : "안개 현상 미확인",
    fogObserved: fogCodes.length > 0,
    sourceType: "KMA_ASOS",
    sourceLabel: "기상청 API허브 · ASOS 최신 시간자료",
  };
}

async function fetchCurrentObservation(stationCode) {
  const cached = cache.get(stationCode);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) return cached.data;

  const authKey = process.env.KMA_AUTH_KEY;
  if (!authKey) {
    const error = new Error("KMA_AUTH_KEY is not configured");
    error.statusCode = 503;
    error.publicCode = "KMA_KEY_NOT_CONFIGURED";
    throw error;
  }

  const apiUrl = new URL("https://apihub.kma.go.kr/api/typ01/url/kma_sfctm2.php");
  apiUrl.searchParams.set("stn", stationCode);
  apiUrl.searchParams.set("help", "1");
  apiUrl.searchParams.set("authKey", authKey);

  const response = await fetch(apiUrl, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error("KMA API request failed with " + response.status);
  const rawText = decodeKmaResponse(await response.arrayBuffer());
  const data = parseCurrentObservation(rawText, stationCode);
  cache.set(stationCode, { savedAt: Date.now(), data });
  return data;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Origin": "http://127.0.0.1:5173",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

const port = Number(process.env.API_PORT || 8080);
const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const requestUrl = new URL(request.url, "http://127.0.0.1:" + port);

  if (request.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(response, 200, { status: "ok", kmaConfigured: Boolean(process.env.KMA_AUTH_KEY) });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/v1/fog-observations/current") {
    const stationCode = String(Number(requestUrl.searchParams.get("station")));
    if (!STATIONS[stationCode]) {
      sendJson(response, 400, { code: "INVALID_STATION", message: "지원하는 대표지점이 아닙니다." });
      return;
    }

    try {
      sendJson(response, 200, await fetchCurrentObservation(stationCode));
    } catch (error) {
      sendJson(response, error.statusCode || 502, {
        code: error.publicCode || "KMA_API_ERROR",
        message: error.publicCode === "KMA_KEY_NOT_CONFIGURED"
          ? "기상청 인증키가 설정되지 않았습니다."
          : "기상청 관측자료를 불러오지 못했습니다.",
      });
    }
    return;
  }

  sendJson(response, 404, { code: "NOT_FOUND", message: "요청한 API를 찾을 수 없습니다." });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[fog-api] http://127.0.0.1:${port} · KMA key ${process.env.KMA_AUTH_KEY ? "configured" : "not configured"}`);
});

