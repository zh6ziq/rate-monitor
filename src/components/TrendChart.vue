<script setup>
import { computed, ref } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
} from "chart.js";
import { formatRM, formatPct, formatDate } from "../utils/format";

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

const props = defineProps({
  series: Array, // [{ date, price }] asc
  markers: Array, // dates to highlight
  loading: Boolean,
});

const RANGES = [
  { key: "1W", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "6M", days: 180 },
];
const range = ref("6M");

const visible = computed(() => {
  const days = RANGES.find((r) => r.key === range.value).days;
  return props.series.slice(-(days + 1));
});

const rangeChange = computed(() => {
  const v = visible.value;
  if (v.length < 2) return null;
  return ((v[v.length - 1].price - v[0].price) / v[0].price) * 100;
});

const chartData = computed(() => {
  const markerSet = new Set(props.markers);
  const pts = visible.value;
  return {
    labels: pts.map((p) => p.date),
    datasets: [
      {
        data: pts.map((p) => p.price),
        borderColor: "#e6b450",
        borderWidth: 2,
        tension: 0.25,
        fill: true,
        backgroundColor: (ctx) => {
          const { chart } = ctx;
          if (!chart.chartArea) return "rgba(230,180,80,0.1)";
          const g = chart.ctx.createLinearGradient(
            0,
            chart.chartArea.top,
            0,
            chart.chartArea.bottom
          );
          g.addColorStop(0, "rgba(230,180,80,0.28)");
          g.addColorStop(1, "rgba(230,180,80,0)");
          return g;
        },
        pointRadius: pts.map((p) => (markerSet.has(p.date) ? 4 : 0)),
        pointBackgroundColor: "#e6b450",
        pointBorderColor: "#0f1115",
        pointBorderWidth: 2,
        pointHoverRadius: 5,
      },
    ],
  };
});

const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 300 },
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#1f232c",
      borderColor: "#2a2f3a",
      borderWidth: 1,
      titleColor: "#9aa0ab",
      bodyColor: "#e8e9ec",
      displayColors: false,
      callbacks: {
        title: (items) => formatDate(items[0].label),
        label: (item) => formatRM(item.parsed.y),
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: "#9aa0ab",
        maxTicksLimit: 5,
        maxRotation: 0,
        callback(value) {
          const d = this.getLabelForValue(value);
          return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-MY", {
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          });
        },
      },
    },
    y: {
      grid: { color: "rgba(255,255,255,0.06)" },
      border: { display: false },
      ticks: {
        color: "#9aa0ab",
        maxTicksLimit: 5,
        callback: (v) => `RM${Math.round(v).toLocaleString("en-MY")}`,
      },
    },
  },
};
</script>

<template>
  <section class="card">
    <div class="head">
      <div>
        <h2>Trend</h2>
        <div
          class="num"
          :class="rangeChange > 0 ? 'up' : rangeChange < 0 ? 'down' : 'muted'"
        >
          {{ formatPct(rangeChange) }} <span class="muted">in {{ range }}</span>
        </div>
      </div>
      <div class="segmented">
        <button
          v-for="r in RANGES"
          :key="r.key"
          :class="{ active: range === r.key }"
          @click="range = r.key"
        >
          {{ r.key }}
        </button>
      </div>
    </div>
    <div class="chart">
      <Line v-if="visible.length > 1" :data="chartData" :options="options" />
      <p v-else class="muted empty">
        {{ loading ? "Loading history…" : "Not enough data" }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
h2 {
  font-size: 16px;
  margin: 0 0 2px;
}
.head .num {
  font-size: 13px;
}
.chart {
  position: relative;
  height: 240px;
}
.empty {
  text-align: center;
  padding-top: 100px;
  margin: 0;
}
</style>
