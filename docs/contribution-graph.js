"use strict";

/* ============================================================
   365-DAY CONTRIBUTION ACTIVITY GRAPH
   Vanilla JavaScript + SVG. No build step required.
   ============================================================ */

const WINDOW_SIZE = 30;
const STEP_SIZE = 30;
const SVG_WIDTH = 1000;
const SVG_HEIGHT = 390;
const LEFT = 48;
const RIGHT = 22;
const TOP = 28;
const BOTTOM = 42;

const viewport = document.getElementById("graphViewport");
const graph = document.getElementById("graph");
const total = document.getElementById("total");
const windowLabel = document.getElementById("windowLabel");
const dateRange = document.getElementById("dateRange");
const position = document.getElementById("position");
const progressValue = document.getElementById("progressValue");
const progressBar = document.querySelector('[role="progressbar"]');
const olderButton = document.getElementById("olderButton");
const newerButton = document.getElementById("newerButton");
const oldestButton = document.getElementById("oldestButton");
const latestButton = document.getElementById("latestButton");

let allData = [];
let startIndex = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartScroll = 0;

function parseUTC(dateString) {
  return new Date(`${dateString}T00:00:00Z`);
}

function formatLongDate(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(parseUTC(dateString));
}

function formatRange(start, end) {
  const a = parseUTC(start);
  const b = parseUTC(end);
  const ay = a.getUTCFullYear();
  const by = b.getUTCFullYear();
  const am = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(a);
  const bm = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(b);

  if (ay === by && am === bm) {
    return `${am} ${a.getUTCDate()} – ${b.getUTCDate()}, ${by}`;
  }
  return `${am} ${a.getUTCDate()}, ${ay} – ${bm} ${b.getUTCDate()}, ${by}`;
}

function maxStartIndex() {
  return Math.max(0, allData.length - WINDOW_SIZE);
}

function visibleData() {
  return allData.slice(startIndex, startIndex + WINDOW_SIZE);
}

function getPageInfo() {
  const starts = [];
  for (let i = 0; i < allData.length; i += STEP_SIZE) {
    if (i <= maxStartIndex()) starts.push(i);
  }
  if (starts.length === 0 || starts[starts.length - 1] !== maxStartIndex()) {
    starts.push(maxStartIndex());
  }
  const page = Math.max(1, starts.indexOf(startIndex) + 1);
  return { page, totalPages: starts.length };
}

function clampStart(index) {
  return Math.max(0, Math.min(maxStartIndex(), index));
}

function setStartIndex(index, behavior = "smooth") {
  const next = clampStart(index);
  if (next === startIndex) {
    updateControls();
    return;
  }

  startIndex = next;
  renderViewport();

  if (behavior === "smooth") {
    graph.animate(
      [
        { opacity: 0.35, transform: "translateX(10px)" },
        { opacity: 1, transform: "translateX(0)" }
      ],
      { duration: 180, easing: "ease-out" }
    );
  }
}

function navigate(direction) {
  if (direction === "older") {
    setStartIndex(startIndex - STEP_SIZE);
  } else {
    setStartIndex(startIndex + STEP_SIZE);
  }
}

function updateControls() {
  const max = maxStartIndex();
  const canOlder = startIndex > 0;
  const canNewer = startIndex < max;
  const shown = visibleData();
  const first = shown[0];
  const last = shown[shown.length - 1];
  const pageInfo = getPageInfo();

  olderButton.disabled = !canOlder;
  newerButton.disabled = !canNewer;
  oldestButton.disabled = !canOlder;
  latestButton.disabled = !canNewer;

  if (first && last) {
    dateRange.textContent = formatRange(first.date, last.date);
  }

  windowLabel.innerHTML = `<strong>${shown.length}</strong> day window`;

  position.innerHTML = `
    <span>Days <strong>${startIndex + 1}</strong> – <strong>${Math.min(startIndex + WINDOW_SIZE, allData.length)}</strong> of <strong>${allData.length}</strong></span>
    <span>Page ${pageInfo.page} / ${pageInfo.totalPages}</span>
  `;

  const percent = max === 0 ? 100 : (startIndex / max) * 100;
  progressValue.style.width = `${percent}%`;
  progressBar.setAttribute("aria-valuenow", String(Math.round(percent)));
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function xFor(index, count) {
  const width = SVG_WIDTH - LEFT - RIGHT;
  return LEFT + (count <= 1 ? width / 2 : (index / (count - 1)) * width);
}

function createChartSvg(items) {
  const chartHeight = SVG_HEIGHT - TOP - BOTTOM;
  const maxCount = Math.max(48, ...items.map(item => item.count));
  const points = items.map((item, index) => {
    const x = xFor(index, items.length);
    const y = TOP + chartHeight - (item.count / maxCount) * chartHeight;
    return { ...item, x, y };
  });

  const yTicks = [0, 12, 24, 36, 48];
  const grid = yTicks.map(value => {
    const y = TOP + chartHeight - (value / maxCount) * chartHeight;
    return `
      <line class="grid" x1="${LEFT}" x2="${SVG_WIDTH - RIGHT}" y1="${y}" y2="${y}" />
      <text class="y-label" x="${LEFT - 12}" y="${y + 4}" text-anchor="end">${value}</text>
    `;
  }).join("");

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const bottom = TOP + chartHeight;
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${bottom} L ${points[0].x.toFixed(2)} ${bottom} Z`
    : "";

  const labelEvery = items.length <= 10 ? 1 : items.length <= 15 ? 2 : 4;
  const labels = points.map((p, i) => {
    if (i % labelEvery !== 0 && i !== points.length - 1) return "";
    const d = parseUTC(p.date);
    return `<text class="x-label" x="${p.x}" y="${SVG_HEIGHT - 12}" text-anchor="middle">${d.getUTCDate()}</text>`;
  }).join("");

  const circles = points.map(p => `
    <circle class="point" cx="${p.x}" cy="${p.y}" r="5">
      <title>${escapeXml(formatLongDate(p.date))}: ${p.count} contribution${p.count === 1 ? "" : "s"}</title>
    </circle>
  `).join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" role="img" aria-label="30-day contribution activity">
      <defs>
        <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f5a623" stop-opacity="0.34" />
          <stop offset="100%" stop-color="#f5a623" stop-opacity="0.015" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="12" fill="#0d0b08" />
      <g>${grid}</g>
      <path class="area" d="${areaPath}" />
      <path class="line" d="${linePath}" />
      <g>${circles}</g>
      <g>${labels}</g>
    </svg>
  `;
}

function renderViewport() {
  const items = visibleData();
  graph.innerHTML = createChartSvg(items);
  updateControls();
}

async function loadContributionData() {
  try {
    const response = await fetch("./contributions.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    const contributions = Array.isArray(payload.contributions) ? payload.contributions : [];

    if (!contributions.length) throw new Error("No contribution data found.");

    allData = contributions
      .filter(item => item && /^\d{4}-\d{2}-\d{2}$/.test(item.date))
      .map(item => ({ date: item.date, count: Number(item.count) || 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    if (!allData.length) throw new Error("Contribution dataset is empty.");

    /* Initial viewport = latest 30 days. */
    startIndex = maxStartIndex();
    total.textContent = `${Number(payload.totalContributions || 0).toLocaleString()} contributions`;
    renderViewport();
  } catch (error) {
    console.error("Failed to load contribution data:", error);
    graph.innerHTML = `<div class="error">Failed to load contribution data: ${escapeXml(error.message)}</div>`;
  }
}

olderButton.addEventListener("click", () => navigate("older"));
newerButton.addEventListener("click", () => navigate("newer"));
oldestButton.addEventListener("click", () => setStartIndex(0));
latestButton.addEventListener("click", () => setStartIndex(maxStartIndex()));

viewport.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    navigate("older");
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    navigate("newer");
  } else if (event.key === "Home") {
    event.preventDefault();
    setStartIndex(0);
  } else if (event.key === "End") {
    event.preventDefault();
    setStartIndex(maxStartIndex());
  }
});

viewport.addEventListener("pointerdown", event => {
  isDragging = true;
  dragStartX = event.clientX;
  dragStartScroll = startIndex;
  viewport.classList.add("dragging");
  viewport.setPointerCapture?.(event.pointerId);
});

viewport.addEventListener("pointerup", event => {
  if (!isDragging) return;
  isDragging = false;
  viewport.classList.remove("dragging");

  const delta = event.clientX - dragStartX;
  if (Math.abs(delta) >= 50) {
    setStartIndex(dragStartScroll + (delta < 0 ? STEP_SIZE : -STEP_SIZE));
  }
});

viewport.addEventListener("pointercancel", () => {
  isDragging = false;
  viewport.classList.remove("dragging");
});

/* Wheel gestures navigate by 30-day chunks without losing the 30-day viewport. */
viewport.addEventListener("wheel", event => {
  if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.preventDefault();
  if (event.deltaY > 0) navigate("newer");
  else navigate("older");
}, { passive: false });

loadContributionData();
