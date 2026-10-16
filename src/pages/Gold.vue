<script setup>
import { computed, onMounted, ref, watch } from "vue";
import AppHeader from "../components/AppHeader.vue";
import PriceCard from "../components/PriceCard.vue";
import CompareTable from "../components/CompareTable.vue";
import TrendChart from "../components/TrendChart.vue";
import { fetchHistory, fetchLive } from "../services/goldApi";
import { addDays, todayMYT, toUnit } from "../utils/format";

const PERIODS = [
  { label: "Yesterday", days: 1 },
  { label: "1 week", days: 7 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
];

const UNIT_KEY = "gold-unit";
const readUnit = () => {
  try {
    return localStorage.getItem(UNIT_KEY) || "g";
  } catch {
    return "g";
  }
};

const unit = ref(readUnit());
const loading = ref(false);
const historyLoading = ref(false);
const error = ref("");
const live = ref(null); // { price (MYR/oz), updatedAt, source }
const history = ref([]); // [{ date, price (MYR/oz) }]

watch(unit, (u) => {
  try {
    localStorage.setItem(UNIT_KEY, u);
  } catch {}
});

const unitLabel = computed(() => (unit.value === "g" ? "MYR / gram" : "MYR / troy oz"));

// history + today's live price, converted to selected unit
const series = computed(() => {
  const today = todayMYT();
  const pts = history.value.filter((p) => p.date !== today);
  if (live.value) pts.push({ date: today, price: live.value.price });
  return pts.map((p) => ({ date: p.date, price: toUnit(p.price, unit.value) }));
});

// nearest available price on or before the target date
function priceOnOrBefore(date) {
  for (let i = series.value.length - 1; i >= 0; i--) {
    if (series.value[i].date <= date) return series.value[i];
  }
  return null;
}

const todayPrice = computed(() =>
  live.value ? toUnit(live.value.price, unit.value) : null
);

const rows = computed(() => {
  const today = todayMYT();
  const base = todayPrice.value;
  return [
    { label: "Today", date: today, price: base, isToday: true },
    ...PERIODS.map(({ label, days }) => {
      const p = priceOnOrBefore(addDays(today, -days));
      const change = p && base != null ? base - p.price : null;
      return {
        label,
        date: p?.date,
        price: p?.price ?? null,
        change,
        pct: change != null ? (change / p.price) * 100 : null,
      };
    }),
  ];
});

const markers = computed(() => rows.value.map((r) => r.date).filter(Boolean));

let refreshId = 0;

async function refresh() {
  const id = ++refreshId;
  loading.value = true;
  historyLoading.value = true;
  error.value = "";
  // start history now, but show the live price as soon as it arrives
  const histReq = fetchHistory(180);
  let liveOk = false;
  try {
    const res = await fetchLive();
    if (id !== refreshId) return;
    live.value = res;
    liveOk = true;
  } catch {}
  let histOk = false;
  try {
    const res = await histReq;
    if (id !== refreshId) return;
    history.value = res;
    histOk = true;
  } catch {}
  if (!liveOk && histOk && history.value.length) {
    // fall back to the latest daily rate
    const last = history.value[history.value.length - 1];
    live.value = {
      price: last.price,
      updatedAt: new Date(`${last.date}T00:00:00Z`),
      source: "daily",
    };
    error.value = "Live price unavailable — showing latest daily rate.";
  } else if (!liveOk && !live.value) {
    error.value = "Unable to load prices. Check your connection and try again.";
  } else if (!histOk && !history.value.length) {
    error.value = "Price history unavailable — comparison and trend may be incomplete.";
  }
  historyLoading.value = false;
  loading.value = false;
}

onMounted(refresh);
</script>

<template>
  <div class="page">
    <AppHeader title="Gold Price" :loading="loading" @refresh="refresh">
      <div class="segmented">
        <button :class="{ active: unit === 'g' }" @click="unit = 'g'">gram</button>
        <button :class="{ active: unit === 'oz' }" @click="unit = 'oz'">oz</button>
      </div>
    </AppHeader>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="live || history.length">
      <PriceCard
        :price="todayPrice"
        :yesterday="rows[1].price"
        :compare-date="rows[1].date"
        :unit-label="unitLabel"
        :updated-at="live?.updatedAt"
        :source="live?.source"
      />
      <CompareTable :rows="rows" :loading="historyLoading" />
      <TrendChart :series="series" :markers="markers" :loading="historyLoading" />
    </template>
    <p v-else-if="loading" class="muted loading">Loading prices…</p>

    <footer class="muted">
      Spot price, excludes dealer/bank spread. Sources: gold-api.com,
      fawazahmed0/currency-api.
    </footer>
  </div>
</template>
