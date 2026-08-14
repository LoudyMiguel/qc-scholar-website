<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const canvas = ref(null)
const stage = ref(null)
const active = ref(false)

let scene = null
let disposed = false
let idleHandle = 0
let gateObserver = null

/**
 * Three.js costs ~180 KB gzipped. This product is Android-first, so a large
 * share of visitors arrive on a phone over mobile data — and on a narrow
 * viewport the scene is cropped to a sliver anyway. Those visitors get the CSS
 * fallback, which is a finished visual in its own right, and never pay for the
 * library. Explicit Save-Data is honoured on every screen size.
 */
function shouldRenderWebGl() {
  const connection = navigator.connection
  if (connection?.saveData) return false
  return window.matchMedia('(min-width: 768px)').matches
}

onMounted(() => {
  if (!shouldRenderWebGl()) return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarsePointer = !window.matchMedia('(pointer: fine)').matches

  // Two gates before Three.js is even fetched: the section has to be near the
  // viewport, and the main thread has to be idle. The hero is above the fold so
  // the first gate opens immediately, but this keeps the chunk off the critical
  // path for the text and the download button, which are what the visitor
  // actually came for.
  gateObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      gateObserver?.disconnect()
      gateObserver = null

      const boot = () => {
        if (disposed || !canvas.value) return
        import('../three/labScene')
          .then(({ createLabScene }) =>
            createLabScene(canvas.value, {
              reducedMotion,
              allowPointer: !coarsePointer,
              // The stage itself is pointer-events:none so it can never eat a
              // click meant for the hero copy or the download button. Hover is
              // therefore tracked on the hero SECTION, which is also the more
              // natural zone: moving anywhere over the hero engages the scene.
              interactionTarget: stage.value?.closest('section') || null,
            }),
          )
          .then((instance) => {
            if (disposed) {
              instance?.destroy()
              return
            }
            scene = instance
            // Only reveal the canvas once WebGL actually succeeded, so a device
            // without it never fades in an empty black rectangle over the CSS
            // fallback.
            active.value = Boolean(instance)
          })
          .catch(() => {
            active.value = false
          })
      }

      if ('requestIdleCallback' in window) {
        idleHandle = window.requestIdleCallback(boot, { timeout: 1400 })
      } else {
        idleHandle = window.setTimeout(boot, 220)
      }
    },
    { rootMargin: '260px 0px' },
  )

  if (stage.value) gateObserver.observe(stage.value)
})

onBeforeUnmount(() => {
  disposed = true
  gateObserver?.disconnect()
  if ('cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle)
  else window.clearTimeout(idleHandle)
  scene?.destroy()
  scene = null
})
</script>

<template>
  <div ref="stage" class="lab-stage" aria-hidden="true">
    <!-- Drawn behind the canvas at all times. It is the entire visual on a
         device without WebGL, and the warm-up state everywhere else. -->
    <div class="lab-fallback" :class="{ 'is-dimmed': active }">
      <span class="fallback-ring fallback-ring--a" />
      <span class="fallback-ring fallback-ring--b" />
      <span class="fallback-ring fallback-ring--c" />
      <span class="fallback-core" />
    </div>
    <canvas ref="canvas" class="lab-canvas" :class="{ 'is-active': active }" />
  </div>
</template>

<style scoped>
.lab-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  /* The composition is right-weighted so the hero copy on the left keeps a
     quiet field to sit on. */
  transform: translateX(18%) translateY(-3%);
}

.lab-canvas {
  display: block;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 1.4s ease;
}

.lab-canvas.is-active {
  opacity: 1;
}

.lab-fallback {
  position: absolute;
  top: 50%;
  left: 50%;
  display: grid;
  width: min(46rem, 92%);
  aspect-ratio: 1;
  place-items: center;
  transform: translate(-50%, -50%);
  transition: opacity 1.2s ease;
}

.lab-fallback.is-dimmed {
  opacity: 0;
}

.fallback-ring,
.fallback-core {
  position: absolute;
  border-radius: 50%;
}

.fallback-ring {
  border: 1px solid rgba(129, 140, 248, 0.16);
}

.fallback-ring--a {
  width: 44%;
  height: 44%;
  border-color: rgba(129, 140, 248, 0.22);
  transform: rotate(24deg) scaleY(0.42);
}

.fallback-ring--b {
  width: 62%;
  height: 62%;
  border-color: rgba(167, 139, 250, 0.18);
  transform: rotate(-38deg) scaleY(0.38);
}

.fallback-ring--c {
  width: 82%;
  height: 82%;
  border-color: rgba(34, 211, 238, 0.14);
  transform: rotate(66deg) scaleY(0.34);
}

.fallback-core {
  width: 21%;
  height: 21%;
  background: radial-gradient(
    circle at 38% 32%,
    rgba(99, 102, 241, 0.34),
    rgba(15, 23, 42, 0.06) 68%
  );
  box-shadow: 0 0 90px rgba(99, 102, 241, 0.22);
}

@media (prefers-reduced-motion: no-preference) {
  .fallback-core {
    animation: fallback-breathe 5.5s ease-in-out infinite;
  }
}

@keyframes fallback-breathe {
  50% {
    transform: scale(1.08);
    opacity: 0.78;
  }
}

@media (max-width: 1023px) {
  .lab-stage {
    transform: translateX(6%) translateY(6%);
  }
}

@media (max-width: 639px) {
  .lab-stage {
    transform: translateX(0) translateY(16%);
    opacity: 0.72;
  }
}
</style>
