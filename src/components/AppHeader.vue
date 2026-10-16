<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { formatTime } from "../utils/format";

const props = defineProps({
  title: String,
  loading: Boolean,
  back: { type: Boolean, default: true },
});
const emit = defineEmits(["refresh"]);

const MIN_SPIN_MS = 700;
const spinning = ref(false);
const updatedAt = ref(null);
let spinStart = 0;
let spinTimer;
let toastTimer;
let userRefresh = false; // only toast for manual refreshes, not the initial load

function onRefresh() {
  userRefresh = true;
  emit("refresh");
}

// spin for at least MIN_SPIN_MS so a fast (cached) refresh is still visible
watch(
  () => props.loading,
  (now, before) => {
    if (now) {
      clearTimeout(spinTimer);
      spinStart = Date.now();
      spinning.value = true;
    } else if (before) {
      spinTimer = setTimeout(() => {
        spinning.value = false;
        if (!userRefresh) return;
        userRefresh = false;
        updatedAt.value = new Date();
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          updatedAt.value = null;
        }, 2000);
      }, Math.max(0, MIN_SPIN_MS - (Date.now() - spinStart)));
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearTimeout(spinTimer);
  clearTimeout(toastTimer);
});
</script>

<template>
  <header>
    <div class="left">
      <RouterLink v-if="back" to="/" class="icon-btn" aria-label="Home">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </RouterLink>
      <h1>{{ title }}</h1>
    </div>
    <div class="actions">
      <slot />
      <button
        class="icon-btn"
        :disabled="spinning"
        @click="onRefresh"
        aria-label="Refresh"
      >
        <svg
          :class="{ spin: spinning }"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 12a8 8 0 1 1-2.34-5.66" />
          <path d="M20 4v4.5h-4.5" />
        </svg>
      </button>
    </div>
    <Transition name="toast">
      <div v-if="updatedAt" class="toast" role="status">
        Updated · {{ formatTime(updatedAt) }}
      </div>
    </Transition>
  </header>
</template>

<style scoped>
header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
h1 {
  font-size: 20px;
  margin: 0;
  white-space: nowrap;
}
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.icon-btn {
  width: 36px;
  height: 36px;
  flex: none;
  display: grid;
  place-items: center;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  text-decoration: none;
}
.icon-btn svg {
  display: block;
}
.icon-btn:disabled {
  opacity: 0.6;
}
.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.toast {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  white-space: nowrap;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--muted);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -4px);
}
</style>
