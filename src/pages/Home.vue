<script setup>
const version = __APP_VERSION__;
</script>

<template>
  <div class="page home">
    <main class="content">
      <header>
        <h1>Rate Monitor</h1>
      </header>

      <RouterLink to="/gold" class="card tile">
        <div class="icon">
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M8.5 5h7l1.5 5H7z" />
            <path d="M4.5 12h7l1.5 6H3z" />
            <path d="M12.5 12h7l1.5 6h-10z" />
          </svg>
        </div>
        <div>
          <div class="title">Gold Price</div>
          <div class="muted desc">Spot price in MYR, compare up to 6 months</div>
        </div>
        <span class="chev muted">›</span>
      </RouterLink>

      <RouterLink to="/converter" class="card tile">
        <div class="icon">⇄</div>
        <div>
          <div class="title">Currency Converter</div>
          <div class="muted desc">Exchange rates for 150+ currencies</div>
        </div>
        <span class="chev muted">›</span>
      </RouterLink>
    </main>

    <footer class="muted">Version {{ version }}</footer>
  </div>
</template>

<style scoped>
.home {
  min-height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom));
}
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
}
header {
  padding: 0 0 10px;
}
h1 {
  font-size: 22px;
  margin: 0;
  text-align: center;
}
.tile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 16px;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s;
}
.tile:hover,
.tile:active {
  border-color: var(--gold);
}
.icon {
  width: 48px;
  height: 48px;
  flex: none;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--gold);
  font-size: 22px;
}
.title {
  font-size: 17px;
  font-weight: 600;
}
.desc {
  font-size: 13px;
  margin-top: 2px;
}
.chev {
  margin-left: auto;
  font-size: 26px;
}
.content > *,
.page > footer {
  animation: rise 0.4s ease-out both;
}
.content > :nth-child(2) {
  animation-delay: 0.06s;
}
.content > :nth-child(3) {
  animation-delay: 0.12s;
}
.page > footer {
  animation-delay: 0.18s;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .content > *,
  .page > footer {
    animation: none;
  }
}
</style>
