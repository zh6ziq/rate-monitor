<script setup>
import { formatRM, formatChange, formatPct, formatDate } from "../utils/format";

defineProps({ rows: Array, loading: Boolean });

const trend = (v) => (v > 0 ? "up" : v < 0 ? "down" : "");
</script>

<template>
  <section class="card">
    <h2>Compare with today</h2>
    <table>
      <thead>
        <tr>
          <th>Period</th>
          <th class="r">Price</th>
          <th class="r">Change</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <td>
            <div class="period">{{ row.label }}</div>
            <div class="date muted">
              {{ row.date ? formatDate(row.date) : loading ? "Loading…" : "No data" }}
            </div>
          </td>
          <td class="r num">{{ formatRM(row.price) }}</td>
          <td class="r num" :class="trend(row.change)">
            <template v-if="row.isToday"><span class="muted">—</span></template>
            <template v-else>
              <div>{{ formatPct(row.pct) }}</div>
              <div class="sub">{{ formatChange(row.change) }}</div>
            </template>
          </td>
        </tr>
      </tbody>
    </table>
    <p class="note muted">Change = today's price minus the price in that period.</p>
  </section>
</template>

<style scoped>
h2 {
  font-size: 16px;
  margin: 0 0 8px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  text-align: left;
  padding: 8px 4px;
  border-bottom: 1px solid var(--border);
}
td {
  padding: 10px 4px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
  font-size: 15px;
}
tr:last-child td {
  border-bottom: 0;
}
.r {
  text-align: right;
}
.period {
  font-weight: 600;
}
.date,
.sub {
  font-size: 12px;
}
.sub {
  opacity: 0.85;
}
.note {
  font-size: 12px;
  margin: 10px 0 0;
}
</style>
