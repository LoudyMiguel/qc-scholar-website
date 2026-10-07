<script setup>
import { Globe2, LockKeyhole, MapPin } from '@lucide/vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTheme } from '../composables/useTheme'

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

const { isDark } = useTheme()

const section = ref(null)
const mapElement = ref(null)
const status = ref('idle') // idle | loading | ready | failed
// The pre-rendered HTML cannot know the visitor's theme. Leaflet loads only
// after mount anyway, so the dark tile filter waits for hydration too.
const mounted = ref(false)

// The OpenStreetMap Foundation's standard tiles: free, no API key, open data.
// Their usage policy asks for visible attribution and a normal browser
// Referer, both of which this page provides. There is no dark tile style, so
// the dark theme is produced with a CSS filter on the tile layer only.
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

let L = null
let map = null
let markerLayer = null
let gateObserver = null
const markersById = new Map()

const locations = computed(() =>
  props.origins
    .filter(
      (origin) =>
        Number.isFinite(origin.lat) &&
        Number.isFinite(origin.lng) &&
        Number.isSafeInteger(origin.count) &&
        origin.count > 0,
    )
    .sort((a, b) => b.count - a.count),
)

const mappedDownloads = computed(() =>
  locations.value.reduce((sum, origin) => sum + origin.count, 0),
)

const topLocations = computed(() => locations.value.slice(0, 5))

function formatCoordinate(value, positive, negative) {
  return `${Math.abs(value).toFixed(2)}° ${value >= 0 ? positive : negative}`
}

function coordinateLabel(origin) {
  return `${formatCoordinate(origin.lat, 'N', 'S')}, ${formatCoordinate(origin.lng, 'E', 'W')}`
}

function plural(count, word) {
  return `${count.toLocaleString()} ${word}${count === 1 ? '' : 's'}`
}

// Built only from validated numbers, never from free text, because Leaflet
// renders tooltip strings as HTML.
function tooltipFor(origin) {
  const parts = []
  if (Number.isSafeInteger(origin.android) && origin.android > 0) parts.push(`Android ${origin.android.toLocaleString()}`)
  if (Number.isSafeInteger(origin.windows) && origin.windows > 0) parts.push(`Windows ${origin.windows.toLocaleString()}`)
  return `<strong>${plural(origin.count, 'download')}</strong>${parts.length ? `<br>${parts.join(' · ')}` : ''}`
}

function tokenColor(name, alpha = 1) {
  const channels = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim()
    .split(/\s+/)
    .join(', ')
  return alpha === 1 ? `rgb(${channels})` : `rgba(${channels}, ${alpha})`
}

// Every location gets the same dot. Download totals live in the tooltip and
// the list below, so a busy city never swallows its neighbours.
function markerStyle() {
  return {
    radius: 6,
    weight: 2,
    color: tokenColor('surface'),
    fillColor: tokenColor('brand-hover'),
    fillOpacity: 0.95,
  }
}

function drawMarkers() {
  if (!map) return
  markerLayer.clearLayers()
  markersById.clear()
  const style = markerStyle()
  locations.value.forEach((origin) => {
    const marker = L.circleMarker([origin.lat, origin.lng], style)
      .bindTooltip(tooltipFor(origin), { direction: 'top', offset: [0, -8] })
      .addTo(markerLayer)
    markersById.set(origin.id, marker)
  })
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function initialView() {
  if (locations.value.length) {
    map.fitBounds(
      locations.value.map((origin) => [origin.lat, origin.lng]),
      { padding: [48, 48], maxZoom: 4, animate: false },
    )
  } else {
    map.setView([20, 10], map.getMinZoom(), { animate: false })
  }
}

function focusLocation(origin) {
  const marker = markersById.get(origin.id)
  if (!map || !marker) return
  map.setView([origin.lat, origin.lng], Math.max(map.getZoom(), 8), {
    animate: !prefersReducedMotion(),
  })
  marker.openTooltip()
  mapElement.value?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

async function bootMap() {
  if (map || !mapElement.value) return
  status.value = 'loading'
  try {
    const [leaflet] = await Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ])
    L = leaflet.default || leaflet
    if (!mapElement.value) return

    const touch = L.Browser.mobile
    map = L.map(mapElement.value, {
      minZoom: mapElement.value.clientWidth < 640 ? 1 : 2,
      maxZoom: 12,
      // Whole zoom levels only: fractional zoom scales tiles and shows seams.
      zoomSnap: 1,
      worldCopyJump: true,
      preferCanvas: true,
      // Never hijack the page: the wheel zooms only after the map is clicked
      // or focused, and one-finger swipes keep scrolling the page on phones
      // (pinch still zooms and pans).
      scrollWheelZoom: false,
      dragging: !touch,
      // Stop vertical panning past the poles; longitude wraps freely.
      maxBounds: [[-85, -540], [85, 540]],
      maxBoundsViscosity: 1,
    })
    map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>')
    map.on('focus click', () => map.scrollWheelZoom.enable())
    map.on('blur mouseout', () => map.scrollWheelZoom.disable())

    L.tileLayer(TILE_URL, {
      attribution: ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map)
    markerLayer = L.layerGroup().addTo(map)

    drawMarkers()
    initialView()
    status.value = 'ready'
  } catch (error) {
    console.warn('The download map could not start.', error)
    status.value = 'failed'
  }
}

let hadLocations = false
watch(locations, (current) => {
  drawMarkers()
  // Frame the data the first time it arrives, but never move a map the
  // visitor is already exploring.
  if (map && !hadLocations && current.length) initialView()
  hadLocations = hadLocations || current.length > 0
})

watch(isDark, () => {
  markerLayer?.eachLayer((marker) => marker.setStyle(markerStyle()))
})

onMounted(() => {
  mounted.value = true
  gateObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      gateObserver?.disconnect()
      gateObserver = null
      bootMap()
    },
    { rootMargin: '400px 0px' },
  )
  if (section.value) gateObserver.observe(section.value)
})

onBeforeUnmount(() => {
  gateObserver?.disconnect()
  map?.remove()
  map = null
})
</script>

<template>
  <section id="download-map" ref="section" class="section border-y border-line bg-subtle">
    <div class="site-container">
      <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-2xl">
          <p class="eyebrow inline-flex items-center gap-2">
            <Globe2 :size="16" aria-hidden="true" />
            Around the world
          </p>
          <h2 class="section-title mt-3">Where learners download GenXYZ Lab</h2>
          <p class="section-lead mt-4">
            Every dot is a city-level area where the app has been downloaded. Zoom in to explore,
            and hover or tap a dot to see its total.
          </p>
        </div>

        <dl class="grid grid-cols-2 gap-4 sm:min-w-[22rem]">
          <div class="card p-4">
            <dt class="text-sm text-fg-muted">Total downloads</dt>
            <dd class="mt-1 text-2xl font-bold tracking-tight text-fg">
              {{ countReady ? downloadCount.toLocaleString() : '—' }}
            </dd>
          </div>
          <div class="card p-4">
            <dt class="text-sm text-fg-muted">Locations</dt>
            <dd class="mt-1 text-2xl font-bold tracking-tight text-fg">
              {{ locations.length.toLocaleString() }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="card relative z-0 mt-10 overflow-hidden">
        <div
          ref="mapElement"
          class="download-map h-[380px] w-full sm:h-[480px] lg:h-[560px]"
          :class="{ 'is-dark': mounted && isDark }"
          role="region"
          aria-label="Map of approximate download locations. Use the list below the map for the same data."
        />
        <div
          v-if="status !== 'ready'"
          class="absolute inset-0 grid place-items-center bg-muted text-sm text-fg-muted"
        >
          {{ status === 'failed' ? 'The map could not load. The locations list below is still available.' : 'Loading map…' }}
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div v-if="topLocations.length">
          <h3 class="text-sm font-semibold text-fg">Most active locations</h3>
          <ul class="mt-2 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
            <li v-for="origin in topLocations" :key="origin.id">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-muted"
                :disabled="status !== 'ready'"
                @click="focusLocation(origin)"
              >
                <span class="inline-flex items-center gap-2 text-fg-muted">
                  <MapPin :size="15" class="shrink-0 text-brand-text" aria-hidden="true" />
                  {{ coordinateLabel(origin) }}
                </span>
                <span class="font-semibold text-fg">{{ plural(origin.count, 'download') }}</span>
              </button>
            </li>
          </ul>
        </div>

        <p class="flex items-start gap-2.5 text-sm leading-relaxed text-fg-subtle lg:pt-7">
          <LockKeyhole :size="16" class="mt-0.5 shrink-0 text-success-text" aria-hidden="true" />
          <span>
            Locations come from Cloudflare's approximate network location and are rounded to a
            0.25° grid (about 25 km) before storage. Only an aggregate count is kept — no IP
            address, precise location, timestamp, account, or device identity.
            <template v-if="mappedDownloads">{{ ' ' + plural(mappedDownloads, 'download') }} mapped so far.</template>
            {{ ' ' }}<a href="/privacy" class="text-link font-medium">Privacy details</a>
          </span>
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Leaflet ships light-only chrome; map it onto the site tokens. */
.download-map {
  background: rgb(var(--surface-muted));
  font-family: inherit;
}

/* Calm the colourful standard style so the brand dots stand out, and derive a
   dark map from it. Only the tile layer is filtered, never the dots. */
.download-map :deep(.leaflet-tile-pane) {
  filter: saturate(0.35) brightness(1.02);
}

.download-map.is-dark :deep(.leaflet-tile-pane) {
  filter: invert(1) hue-rotate(180deg) saturate(0.3) brightness(0.85) contrast(0.95);
}

.download-map :deep(.leaflet-bar) {
  border: 1px solid rgb(var(--border-strong));
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: none;
}

.download-map :deep(.leaflet-bar a) {
  width: 2.25rem;
  height: 2.25rem;
  border-bottom-color: rgb(var(--border));
  background: rgb(var(--surface));
  color: rgb(var(--fg));
  line-height: 2.25rem;
}

.download-map :deep(.leaflet-bar a:hover) {
  background: rgb(var(--surface-muted));
}

.download-map :deep(.leaflet-bar a.leaflet-disabled) {
  background: rgb(var(--surface-muted));
  color: rgb(var(--fg-subtle));
}

.download-map :deep(.leaflet-control-attribution) {
  background: rgb(var(--surface) / 0.85);
  color: rgb(var(--fg-muted));
  font-size: 11px;
}

.download-map :deep(.leaflet-control-attribution a) {
  color: rgb(var(--brand-text));
}

.download-map :deep(.leaflet-tooltip) {
  border: 1px solid rgb(var(--border));
  border-radius: 0.5rem;
  background: rgb(var(--surface));
  color: rgb(var(--fg));
  font-size: 12px;
  line-height: 1.45;
  box-shadow: 0 6px 20px -8px rgb(var(--shadow) / 0.35);
}

.download-map :deep(.leaflet-tooltip-top::before) {
  border-top-color: rgb(var(--surface));
}
</style>
