<script setup>
import {
  Award,
  BookOpen,
  Boxes,
  Code2,
  Gamepad2,
  Sparkles,
  WifiOff,
  Wrench,
} from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import heroLearningStudio from '../assets/hero-learning-studio-v2.webp'

const stage = ref(null)
const revealing = ref(false)
let hoverTarget = null

const tiles = [
  { icon: BookOpen, label: '70 courses', detail: 'Learn offline', tone: 'indigo' },
  { icon: Boxes, label: '129 templates', detail: 'Start with structure', tone: 'violet' },
  { icon: Gamepad2, label: '3D game lab', detail: 'Play the source', tone: 'cyan' },
  { icon: Wrench, label: '7 tools', detail: 'Build on device', tone: 'emerald' },
  { icon: Code2, label: 'Real projects', detail: 'Run what you make', tone: 'cyan' },
  { icon: WifiOff, label: 'Offline first', detail: 'Keep learning', tone: 'indigo' },
  { icon: Award, label: 'Certificates', detail: 'Mark progress', tone: 'amber' },
  { icon: Sparkles, label: 'AI assistance', detail: 'Unblock ideas', tone: 'violet' },
]

function updateReveal(event) {
  if (event.pointerType === 'touch' || !stage.value) return
  const bounds = stage.value.getBoundingClientRect()
  const x = event.clientX - bounds.left
  const y = event.clientY - bounds.top
  if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) {
    revealing.value = false
    return
  }
  stage.value.style.setProperty('--reveal-x', `${x}px`)
  stage.value.style.setProperty('--reveal-y', `${y}px`)
  revealing.value = true
}

function hideReveal(event) {
  if (event.pointerType !== 'touch') revealing.value = false
}

onMounted(() => {
  // Track the SECTION rather than only this layer. The headline and CTA sit
  // above the art for readability, but pointer events still bubble through the
  // hero and can therefore drive the reveal wherever artwork is visible.
  hoverTarget = stage.value?.closest('section') || stage.value
  hoverTarget?.addEventListener('pointermove', updateReveal, { passive: true })
  hoverTarget?.addEventListener('pointerleave', hideReveal, { passive: true })
})

onBeforeUnmount(() => {
  hoverTarget?.removeEventListener('pointermove', updateReveal)
  hoverTarget?.removeEventListener('pointerleave', hideReveal)
  hoverTarget = null
})
</script>

<template>
  <div
    ref="stage"
    class="hero-reveal"
    :class="{ 'is-revealing': revealing }"
    data-hero-scene
    aria-hidden="true"
  >
    <div class="feature-matrix">
      <article
        v-for="(tile, index) in tiles"
        :key="tile.label"
        class="feature-tile"
        :class="`feature-tile--${tile.tone}`"
        :style="{ '--tile-delay': `${index * 55}ms` }"
      >
        <span class="feature-icon"><component :is="tile.icon" :size="17" /></span>
        <span class="feature-label">{{ tile.label }}</span>
        <span class="feature-detail">{{ tile.detail }}</span>
      </article>
    </div>

    <img
      class="hero-art"
      :src="heroLearningStudio"
      alt=""
      width="1600"
      height="914"
      decoding="async"
      fetchpriority="high"
    />

    <div class="reveal-lens" :class="{ 'is-visible': revealing }">
      <span>Explore</span>
    </div>

    <div class="reveal-hint">
      <span class="reveal-hint-dot" />
      Move to reveal what is inside
    </div>
  </div>
</template>

<style scoped>
.hero-reveal {
  --reveal-x: 78%;
  --reveal-y: 48%;
  --reveal-radius: 8.5rem;
  position: absolute;
  z-index: 1;
  inset: 4.5rem -3rem 1.5rem 35%;
  overflow: hidden;
  border-radius: 2.25rem 0 0 2.25rem;
  isolation: isolate;
  pointer-events: auto;
}

.hero-reveal::after {
  position: absolute;
  z-index: 4;
  inset: 0;
  content: '';
  pointer-events: none;
  background:
    linear-gradient(90deg, #020617 0%, rgba(2, 6, 23, 0.82) 9%, transparent 32%),
    linear-gradient(to bottom, rgba(2, 6, 23, 0.74), transparent 18%, transparent 80%, #020617);
}

.feature-matrix {
  position: absolute;
  z-index: 0;
  top: 15%;
  right: 8%;
  display: grid;
  width: min(40rem, 71%);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  padding: 1rem;
  border: 1px solid rgba(129, 140, 248, 0.14);
  border-radius: 1.6rem;
  background:
    linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px),
    rgba(2, 6, 23, 0.88);
  background-size: 24px 24px;
  box-shadow: 0 30px 100px rgba(2, 6, 23, 0.72);
  transform: perspective(900px) rotateY(-5deg) rotateX(2deg);
}

.feature-tile {
  display: flex;
  min-height: 7.75rem;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0.85rem;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.68));
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.04);
}

.feature-icon {
  display: grid;
  width: 2.15rem;
  height: 2.15rem;
  margin-bottom: auto;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 0.7rem;
  color: #a5b4fc;
  background: rgba(99, 102, 241, 0.1);
}

.feature-tile--violet .feature-icon { color: #c4b5fd; background: rgba(139, 92, 246, 0.1); }
.feature-tile--cyan .feature-icon { color: #67e8f9; background: rgba(34, 211, 238, 0.08); }
.feature-tile--emerald .feature-icon { color: #6ee7b7; background: rgba(52, 211, 153, 0.08); }
.feature-tile--amber .feature-icon { color: #fde68a; background: rgba(251, 191, 36, 0.08); }

.feature-label {
  margin-top: 0.7rem;
  color: #f8fafc;
  font-family: 'Sora', sans-serif;
  font-size: 0.71rem;
  font-weight: 600;
}

.feature-detail {
  margin-top: 0.25rem;
  color: #64748b;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.53rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.hero-art {
  position: absolute;
  z-index: 2;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: saturate(0.92) contrast(1.04);
  transition: filter 260ms ease;
  -webkit-mask-image: linear-gradient(#000, #000);
  mask-image: linear-gradient(#000, #000);
}

.hero-reveal.is-revealing .hero-art {
  filter: saturate(0.76) contrast(1.02) brightness(0.88);
  -webkit-mask-image: radial-gradient(
    circle var(--reveal-radius) at var(--reveal-x) var(--reveal-y),
    transparent 0%,
    transparent 58%,
    rgba(0, 0, 0, 0.16) 70%,
    #000 100%
  );
  mask-image: radial-gradient(
    circle var(--reveal-radius) at var(--reveal-x) var(--reveal-y),
    transparent 0%,
    transparent 58%,
    rgba(0, 0, 0, 0.16) 70%,
    #000 100%
  );
}

.reveal-lens {
  position: absolute;
  z-index: 5;
  top: var(--reveal-y);
  left: var(--reveal-x);
  display: grid;
  width: calc(var(--reveal-radius) * 2);
  height: calc(var(--reveal-radius) * 2);
  place-items: end center;
  border: 1px solid rgba(103, 232, 249, 0.3);
  border-radius: 50%;
  opacity: 0;
  pointer-events: none;
  box-shadow: inset 0 0 40px rgba(34, 211, 238, 0.05), 0 0 28px rgba(99, 102, 241, 0.12);
  transform: translate(-50%, -50%) scale(0.86);
  transition: opacity 160ms ease, transform 220ms ease;
}

.reveal-lens::before,
.reveal-lens::after {
  position: absolute;
  content: '';
  background: rgba(103, 232, 249, 0.55);
}

.reveal-lens::before { top: -3px; width: 1px; height: 9px; }
.reveal-lens::after { left: -3px; width: 9px; height: 1px; }

.reveal-lens span {
  margin-bottom: 0.8rem;
  color: rgba(165, 243, 252, 0.68);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.reveal-lens.is-visible { opacity: 1; transform: translate(-50%, -50%) scale(1); }

.reveal-hint {
  position: absolute;
  z-index: 6;
  right: 10%;
  bottom: 11%;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: rgba(148, 163, 184, 0.66);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.54rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  transition: opacity 180ms ease;
}

.is-revealing .reveal-hint { opacity: 0; }
.reveal-hint-dot { width: 0.4rem; height: 0.4rem; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 14px #22d3ee; }

@media (max-width: 1023px) {
  .hero-reveal { inset: 8rem -14rem 0 27%; opacity: 0.86; }
  .feature-matrix { right: 16%; width: 34rem; grid-template-columns: repeat(3, 1fr); }
  .feature-tile:nth-child(n + 7) { display: none; }
}

@media (max-width: 767px), (pointer: coarse) {
  .hero-reveal { inset: 23rem -11rem 0 -4rem; border-radius: 0; opacity: 0.62; pointer-events: none; }
  .hero-art {
    opacity: 0.7;
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 36%, transparent 88%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 36%, transparent 88%);
  }
  .feature-matrix { top: 23%; right: 13%; width: 28rem; grid-template-columns: repeat(3, 1fr); transform: none; }
  .feature-tile { min-height: 6.5rem; }
  .reveal-hint, .reveal-lens { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-art, .reveal-lens, .reveal-hint { transition: none; }
}
</style>
