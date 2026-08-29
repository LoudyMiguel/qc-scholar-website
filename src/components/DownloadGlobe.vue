<script setup>
import { Crosshair, Globe2, LockKeyhole, MapPin, MousePointer2 } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  origins: {
    type: Array,
    default: () => [],
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  countReady: {
    type: Boolean,
    default: false,
  },
})

const host = ref(null)
const canvas = ref(null)
const ready = ref(false)
const unavailable = ref(false)
const dragging = ref(false)

let globe = null
let gateObserver = null
let resizeObserver = null
let animationFrame = 0
let phi = 0.55
let pointerStart = 0
let pointerOffset = 0
let lastPointerOffset = 0
let reducedMotion = false

const mappedDownloads = computed(() =>
  props.origins.reduce((sum, origin) => sum + (Number(origin.count) || 0), 0),
)

const visibleOrigins = computed(() =>
  [...props.origins]
    .filter((origin) => Number.isFinite(origin.lat) && Number.isFinite(origin.lng))
    .sort((a, b) => (b.count || 0) - (a.count || 0))
    .slice(0, 6),
)

const markerData = computed(() =>
  visibleOrigins.value.map((origin, index) => ({
    location: [origin.lat, origin.lng],
    size: Math.min(0.11, 0.035 + Math.log2((origin.count || 0) + 1) * 0.012),
    color: index === 0 ? [0.13, 0.83, 0.93] : [0.51, 0.55, 0.97],
    id: `origin-${index}`,
  })),
)

const arcData = computed(() => {
  if (visibleOrigins.value.length < 2) return []
  const hub = visibleOrigins.value[0]
  return visibleOrigins.value.slice(1, 5).map((origin) => ({
    from: [hub.lat, hub.lng],
    to: [origin.lat, origin.lng],
    color: [0.38, 0.4, 0.95],
  }))
})

function formatCoordinate(value, positive, negative) {
  const number = Number(value)
  return `${Math.abs(number).toFixed(0)}° ${number >= 0 ? positive : negative}`
}

function coordinateLabel(origin) {
  return `${formatCoordinate(origin.lat, 'N', 'S')} · ${formatCoordinate(origin.lng, 'E', 'W')}`
}

function globeSize() {
  const width = host.value?.clientWidth || 520
  return Math.max(320, Math.min(width, 620))
}

function updateGlobe() {
  if (!globe) return
  const size = globeSize()
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  globe.update({
    width: Math.round(size * ratio),
    height: Math.round(size * ratio),
    phi: phi + pointerOffset,
    markers: markerData.value,
    arcs: arcData.value,
  })
}

function animate() {
  if (!globe) return
  if (!reducedMotion && !dragging.value) phi += 0.0018
  updateGlobe()
  animationFrame = window.requestAnimationFrame(animate)
}

async function bootGlobe() {
  if (!canvas.value || globe) return
  try {
    const { default: createGlobe } = await import('cobe')
    if (!canvas.value) return
    const size = globeSize()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    globe = createGlobe(canvas.value, {
      devicePixelRatio: ratio,
      width: Math.round(size * ratio),
      height: Math.round(size * ratio),
      phi,
      theta: 0.18,
      dark: 1,
      diffuse: 1.35,
      scale: 0.94,
      mapSamples: 18000,
      mapBrightness: 5.2,
      mapBaseBrightness: 0.08,
      baseColor: [0.05, 0.08, 0.2],
      markerColor: [0.13, 0.83, 0.93],
      glowColor: [0.09, 0.08, 0.24],
      opacity: 0.92,
      offset: [0, 8],
      markers: markerData.value,
      arcs: arcData.value,
      arcColor: [0.38, 0.4, 0.95],
      arcWidth: 0.45,
      arcHeight: 0.18,
      markerElevation: 0.035,
    })
    ready.value = true
    resizeObserver = new ResizeObserver(updateGlobe)
    resizeObserver.observe(host.value)
    animate()
  } catch (error) {
    console.warn('The download globe could not start.', error)
    unavailable.value = true
  }
}

function startDrag(event) {
  if (!ready.value || (event.pointerType === 'touch' && event.isPrimary === false)) return
  dragging.value = true
  pointerStart = event.clientX
  lastPointerOffset = pointerOffset
  canvas.value?.setPointerCapture(event.pointerId)
}

function drag(event) {
  if (!dragging.value) return
  pointerOffset = lastPointerOffset + (event.clientX - pointerStart) / 180
}

function endDrag(event) {
  if (!dragging.value) return
  dragging.value = false
  phi += pointerOffset
  pointerOffset = 0
  lastPointerOffset = 0
  if (canvas.value?.hasPointerCapture(event.pointerId)) {
    canvas.value.releasePointerCapture(event.pointerId)
  }
}

watch([markerData, arcData], () => updateGlobe())

onMounted(async () => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  await nextTick()
  gateObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      gateObserver?.disconnect()
      gateObserver = null
      bootGlobe()
    },
    { rootMargin: '220px 0px' },
  )
  if (host.value) gateObserver.observe(host.value)
})

onBeforeUnmount(() => {
  gateObserver?.disconnect()
  resizeObserver?.disconnect()
  window.cancelAnimationFrame(animationFrame)
  globe?.destroy()
  globe = null
})
</script>

<template>
  <section id="download-map" class="download-map relative overflow-hidden py-24 sm:py-28">
    <div class="map-grid pointer-events-none absolute inset-0" aria-hidden="true" />
    <div class="map-orbit map-orbit--one" aria-hidden="true" />
    <div class="map-orbit map-orbit--two" aria-hidden="true" />

    <div class="site-container relative grid items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-10">
      <div data-reveal>
        <div class="eyebrow">
          <Globe2 :size="14" aria-hidden="true" />
          The learning map
        </div>
        <h2 class="section-heading mt-6">Every download leaves a light on the map.</h2>
        <p class="section-copy mt-5 max-w-xl">
          See GenXYZ Lab travel from one learning setup to the next. Each pulse is
          an approximate, aggregated download origin—not a person or a device.
        </p>

        <div class="mt-8 grid gap-3 sm:grid-cols-2">
          <div class="map-stat">
            <span class="map-stat-icon"><MapPin :size="16" /></span>
            <span>
              <b>{{ mappedDownloads.toLocaleString() }}</b>
              mapped after launch
            </span>
          </div>
          <div class="map-stat">
            <span class="map-stat-icon"><Crosshair :size="16" /></span>
            <span>
              <b>{{ countReady ? downloadCount.toLocaleString() : '—' }}</b>
              total downloads
            </span>
          </div>
        </div>

        <div class="mt-8 border-l border-indigo-400/20 pl-5">
          <div class="flex items-start gap-3 text-xs leading-6 text-slate-500">
            <LockKeyhole :size="16" class="mt-1 shrink-0 text-emerald-400" aria-hidden="true" />
            <p>
              Coordinates are snapped to a 5° grid before storage. No IP address,
              precise location, account, or device identity is saved.
            </p>
          </div>
        </div>
      </div>

      <div ref="host" class="globe-stage" data-reveal>
        <div class="globe-hud globe-hud--top">
          <span class="inline-flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
            Live download origins
          </span>
          <span>{{ visibleOrigins.length }} active cells</span>
        </div>

        <div class="globe-shell" :class="{ 'is-ready': ready }">
          <canvas
            ref="canvas"
            class="globe-canvas"
            :class="{ 'is-dragging': dragging }"
            aria-label="Interactive globe showing approximate download-origin coordinates"
            role="img"
            @pointerdown="startDrag"
            @pointermove="drag"
            @pointerup="endDrag"
            @pointercancel="endDrag"
          />
          <div v-if="!ready" class="globe-fallback" aria-hidden="true">
            <span class="fallback-latitude fallback-latitude--one" />
            <span class="fallback-latitude fallback-latitude--two" />
            <span class="fallback-longitude" />
          </div>
        </div>

        <div class="coordinate-feed" aria-live="polite">
          <template v-if="visibleOrigins.length">
            <div v-for="origin in visibleOrigins.slice(0, 4)" :key="origin.id" class="coordinate-row">
              <span class="coordinate-pulse" />
              <span>{{ coordinateLabel(origin) }}</span>
              <b>{{ origin.count }}×</b>
            </div>
          </template>
          <div v-else class="coordinate-empty">
            First mapped download will illuminate this globe.
          </div>
        </div>

        <div v-if="ready" class="drag-hint">
          <MousePointer2 :size="13" aria-hidden="true" />
          Drag to rotate
        </div>
        <p v-else-if="unavailable" class="drag-hint">Coordinate list remains available</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.download-map {
  background:
    radial-gradient(circle at 78% 50%, rgba(79, 70, 229, 0.16), transparent 31rem),
    linear-gradient(180deg, #020617, #06091a 48%, #020617);
}

.map-grid {
  opacity: 0.46;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.045) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(circle at 72% 50%, #000, transparent 62%);
}

.map-orbit {
  position: absolute;
  top: 50%;
  left: 73%;
  width: 45rem;
  height: 15rem;
  border: 1px solid rgba(99, 102, 241, 0.1);
  border-radius: 50%;
  pointer-events: none;
}

.map-orbit--one { transform: translate(-50%, -50%) rotate(-18deg); }
.map-orbit--two { border-color: rgba(34, 211, 238, 0.08); transform: translate(-50%, -50%) rotate(24deg) scale(0.8); }

.map-stat {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.48);
  color: #64748b;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.57rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
}

.map-stat b { display: block; color: #e2e8f0; font-family: 'Sora', sans-serif; font-size: 1rem; letter-spacing: -0.02em; }
.map-stat-icon { display: grid; width: 2.25rem; height: 2.25rem; flex: none; place-items: center; border-radius: 0.7rem; color: #67e8f9; background: rgba(34, 211, 238, 0.08); }

.globe-stage {
  position: relative;
  min-height: 39rem;
  overflow: visible;
}

.globe-hud {
  position: absolute;
  z-index: 5;
  top: 1.25rem;
  right: 1.25rem;
  left: 1.25rem;
  display: flex;
  justify-content: space-between;
  color: #64748b;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.53rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.13em;
}

.globe-shell { position: absolute; top: 2.5rem; left: 50%; width: min(100%, 38rem); aspect-ratio: 1; transform: translateX(-50%); }
.globe-canvas { width: 100%; height: 100%; cursor: grab; opacity: 0; touch-action: none; transition: opacity 800ms ease; }
.globe-canvas.is-dragging { cursor: grabbing; }
.globe-shell.is-ready .globe-canvas { opacity: 1; }

.globe-fallback {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 76%;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid rgba(129, 140, 248, 0.3);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(99, 102, 241, 0.24), rgba(15, 23, 42, 0.2) 58%, rgba(2, 6, 23, 0.9));
  box-shadow: 0 0 80px rgba(99, 102, 241, 0.14);
  transform: translate(-50%, -50%);
  transition: opacity 500ms ease;
}

.is-ready .globe-fallback { opacity: 0; }
.fallback-latitude, .fallback-longitude { position: absolute; inset: 18% 0; border: 1px solid rgba(34, 211, 238, 0.14); border-radius: 50%; }
.fallback-latitude--one { transform: scaleY(0.35); }
.fallback-latitude--two { transform: rotate(90deg) scaleY(0.35); }
.fallback-longitude { inset: 0 34%; }

.coordinate-feed {
  position: absolute;
  z-index: 5;
  right: 1.25rem;
  bottom: 1.25rem;
  left: 1.25rem;
  display: grid;
  gap: 0.35rem;
  max-width: 22rem;
}

.coordinate-row,
.coordinate-empty {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.7rem;
  border-left: 1px solid rgba(34, 211, 238, 0.24);
  background: linear-gradient(90deg, rgba(15, 23, 42, 0.92), transparent);
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.56rem;
  letter-spacing: 0.08em;
}

.coordinate-row b { color: #67e8f9; }
.coordinate-pulse { width: 0.35rem; height: 0.35rem; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 10px #22d3ee; }
.coordinate-empty { display: block; color: #64748b; }

.drag-hint {
  position: absolute;
  z-index: 5;
  right: 1.35rem;
  bottom: 1.35rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: #475569;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

@media (max-width: 639px) {
  .globe-stage { min-height: 32rem; }
  .globe-shell { top: 3.25rem; width: 32rem; }
  .coordinate-feed { right: 0.9rem; bottom: 0.9rem; left: 0.9rem; max-width: none; }
  .coordinate-row:nth-child(n + 4) { display: none; }
  .drag-hint { display: none; }
  .map-orbit { left: 50%; width: 34rem; }
}

@media (prefers-reduced-motion: reduce) {
  .globe-canvas, .globe-fallback { transition: none; }
}
</style>
