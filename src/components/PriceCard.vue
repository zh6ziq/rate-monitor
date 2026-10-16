<script setup>
import { computed } from "vue";
import {
  formatRM,
  formatChange,
  formatPct,
  formatDate,
  formatDateTime,
  addDays,
  todayMYT,
} from "../utils/format";

const props = defineProps({
  price: Number,
  yesterday: Number,
  compareDate: String,
  unitLabel: String,
  updatedAt: Date,
  source: String,
});

const change = computed(() =>
  props.price != null && props.yesterday != null ? props.price - props.yesterday : null
);
const pct = computed(() =>
  change.value != null ? (change.value / props.yesterday) * 100 : null
);
const trend = computed(() => (change.value > 0 ? "up" : change.value < 0 ? "down" : ""));
// history may lack yesterday, in which case the comparison is against an older day
const compareLabel = computed(() =>
  !props.compareDate || props.compareDate === addDays(todayMYT(), -1)
    ? "vs yesterday"
    : `vs ${formatDate(props.compareDate)}`
);
</script>

<template>
  <section class="card price-card">
    <div class="label muted">Gold spot · {{ unitLabel }}</div>
    <div class="price num">{{ formatRM(price) }}</div>
    <div class="change num" :class="trend">
      {{ trend === "up" ? "▲" : trend === "down" ? "▼" : "" }}
      {{ formatChange(change) }} ({{ formatPct(pct) }})
      <span class="muted">{{ compareLabel }}</span>
    </div>
    <div class="meta muted" v-if="updatedAt">
      <template v-if="source === 'live'">Live · {{ formatDateTime(updatedAt) }}</template>
      <template v-else
        >Daily rate · {{ formatDate(updatedAt.toISOString().slice(0, 10)) }}</template
      >
    </div>
  </section>
</template>

<style scoped>
.price-card {
  text-align: center;
  padding: 24px 16px;
}
.label {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.price {
  font-size: clamp(34px, 9vw, 48px);
  font-weight: 700;
  color: var(--gold);
  margin: 6px 0;
}
.change {
  font-size: 15px;
  font-weight: 500;
}
.meta {
  font-size: 12px;
  margin-top: 10px;
}
</style>
