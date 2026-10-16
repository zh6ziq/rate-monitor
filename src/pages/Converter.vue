<script setup>
import { computed, onMounted, ref, watch } from "vue";
import AppHeader from "../components/AppHeader.vue";
import { fetchRates } from "../services/fxApi";
import { formatDate, formatDateTime } from "../utils/format";

const PREF_KEY = "fx-pref";
const POPULAR = [
  "MYR",
  "USD",
  "SGD",
  "EUR",
  "GBP",
  "AUD",
  "JPY",
  "CNY",
  "HKD",
  "THB",
  "IDR",
  "SAR",
];

function readPref() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY)) || {};
  } catch {
    return {};
  }
}
const pref = readPref();

const amountInput = ref(pref.amount ?? "1000");
const from = ref(pref.from || "MYR");
const to = ref(pref.to || "USD");
const data = ref(null);
const loading = ref(false);
const error = ref("");

watch([amountInput, from, to], () => {
  try {
    localStorage.setItem(
      PREF_KEY,
      JSON.stringify({ amount: amountInput.value, from: from.value, to: to.value })
    );
  } catch {}
});

const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });
const nameOf = (code) => {
  try {
    return displayNames.of(code);
  } catch {
    return code;
  }
};

// only real currencies Intl recognises (drops crypto/obscure codes)
const currencies = computed(() => {
  if (!data.value) return [];
  const codes = Object.keys(data.value.rates).filter(
    (c) => /^[A-Z]{3}$/.test(c) && nameOf(c) !== c
  );
  const popular = POPULAR.filter((c) => codes.includes(c));
  const rest = codes.filter((c) => !POPULAR.includes(c)).sort();
  return { popular, rest };
});

const amount = computed(() => {
  const n = parseFloat(String(amountInput.value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
});

const rate = computed(() => {
  const r = data.value?.rates;
  if (!r?.[from.value] || !r?.[to.value]) return null;
  return r[from.value] / r[to.value];
});

const result = computed(() =>
  amount.value != null && rate.value != null ? amount.value * rate.value : null
);

const pairSource = computed(() => {
  const s = data.value?.sources;
  if (!s) return null;
  return s[from.value] === "bnm" && s[to.value] === "bnm" ? "bnm" : "fallback";
});

const sourceText = computed(() => {
  const d = data.value;
  if (!d) return "";
  if (pairSource.value === "bnm" && d.bnm) {
    const session = d.bnm.session
      ? ` · ${d.bnm.session.slice(0, 2)}:${d.bnm.session.slice(2)} session`
      : "";
    const when = d.bnm.updatedAt ? ` · ${formatBnmTime(d.bnm.updatedAt)}` : "";
    return `Bank Negara Malaysia${session}${when}`;
  }
  return `currency-api (daily)${
    d.fallback?.updatedAt ? ` · ${formatDate(d.fallback.updatedAt)}` : ""
  }`;
});

// BNM timestamps are MYT without an offset, e.g. "2026-10-16 12:05:00"
function formatBnmTime(s) {
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)
    ? `${s.replace(" ", "T")}+08:00`
    : s;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? s : formatDateTime(d);
}

function fmtMoney(v, code) {
  if (v == null) return "—";
  const digits = Math.abs(v) >= 1 ? 2 : 6;
  try {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: code,
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: digits,
    }).format(v);
  } catch {
    return `${code} ${v.toFixed(digits)}`;
  }
}

const fmtRate = (v) =>
  v == null ? "—" : v.toLocaleString("en-MY", { maximumSignificantDigits: 6 });

function swap() {
  [from.value, to.value] = [to.value, from.value];
}

async function refresh() {
  loading.value = true;
  error.value = "";
  try {
    data.value = await fetchRates();
    if (data.value.offline) error.value = "Offline — showing last saved rates.";
    else if (!data.value.bnm)
      error.value = "BNM rates unavailable — using currency-api daily rates.";
  } catch (e) {
    error.value = "Unable to load exchange rates. Check your connection and try again.";
  }
  loading.value = false;
}

onMounted(refresh);
</script>

<template>
  <div class="page">
    <AppHeader title="Converter" :loading="loading" @refresh="refresh" />

    <p v-if="error" :class="data ? 'warn' : 'error'">{{ error }}</p>

    <section class="card converter" v-if="data">
      <label class="field">
        <span class="muted">Amount</span>
        <input
          v-model="amountInput"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0.00"
        />
      </label>

      <div class="pair">
        <label class="field">
          <span class="muted">From</span>
          <select v-model="from">
            <optgroup label="Popular">
              <option v-for="c in currencies.popular" :key="c" :value="c">
                {{ c }} — {{ nameOf(c) }}
              </option>
            </optgroup>
            <optgroup label="All currencies">
              <option v-for="c in currencies.rest" :key="c" :value="c">
                {{ c }} — {{ nameOf(c) }}
              </option>
            </optgroup>
          </select>
        </label>
        <button class="swap" @click="swap" aria-label="Swap currencies">⇅</button>
        <label class="field">
          <span class="muted">To</span>
          <select v-model="to">
            <optgroup label="Popular">
              <option v-for="c in currencies.popular" :key="c" :value="c">
                {{ c }} — {{ nameOf(c) }}
              </option>
            </optgroup>
            <optgroup label="All currencies">
              <option v-for="c in currencies.rest" :key="c" :value="c">
                {{ c }} — {{ nameOf(c) }}
              </option>
            </optgroup>
          </select>
        </label>
      </div>

      <div class="result">
        <div class="muted small">{{ fmtMoney(amount, from) }} =</div>
        <div class="value num">{{ fmtMoney(result, to) }}</div>
        <div class="rates num muted small">
          <div>1 {{ from }} = {{ fmtRate(rate) }} {{ to }}</div>
          <div>1 {{ to }} = {{ fmtRate(rate ? 1 / rate : null) }} {{ from }}</div>
        </div>
      </div>
    </section>
    <p v-else-if="loading" class="muted loading">Loading rates…</p>

    <footer class="muted" v-if="data">
      Source: {{ sourceText }}<br />
      Mid-market reference rate. Banks and money changers apply their own spread.
    </footer>
  </div>
</template>

<style scoped>
.converter {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.field > span {
  font-size: 12px;
}
input,
select {
  width: 100%;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-size: 16px;
  font-family: inherit;
}
input {
  font-size: 22px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
input:focus,
select:focus {
  outline: none;
  border-color: var(--gold);
}
.pair {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}
.swap {
  align-self: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--gold);
  font-size: 18px;
}
.result {
  text-align: center;
  padding: 12px 0 4px;
  border-top: 1px solid var(--border);
}
.value {
  font-size: clamp(28px, 8vw, 38px);
  font-weight: 700;
  color: var(--gold);
  margin: 4px 0 10px;
  word-break: break-all;
}
.small {
  font-size: 13px;
}
.rates div + div {
  margin-top: 2px;
}
</style>
