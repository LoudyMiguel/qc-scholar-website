<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const chapters = [
  { id: 'top', label: 'Start' },
  { id: 'experience', label: 'Experience' },
  { id: 'inside', label: 'Inside' },
  { id: 'features', label: 'Features' },
  { id: 'download', label: 'Download' },
  { id: 'download-map', label: 'Map' },
  { id: 'setup', label: 'Setup' },
  { id: 'community', label: 'Community' },
]

const activeIndex = ref(0)
const chapterProgress = ref(0)
const activeChapter = computed(() => chapters[activeIndex.value])
let frame = 0

function formatIndex(index) {
  return String(index + 1).padStart(2, '0')
}

function requestUpdate() {
  if (frame) return
  frame = window.requestAnimationFrame(updateScrollSpy)
}

function updateScrollSpy() {
  frame = 0
  const elements = chapters
    .map((chapter) => document.getElementById(chapter.id))
    .filter(Boolean)
  if (!elements.length) return

  const scrollTop = window.scrollY
  const marker = scrollTop + Math.max(120, window.innerHeight * 0.38)
  const pageBottom = scrollTop + window.innerHeight >= document.documentElement.scrollHeight - 4
  const tops = elements.map(
    (element) => element.getBoundingClientRect().top + scrollTop,
  )

  let nextActive = 0
  tops.forEach((top, index) => {
    if (marker >= top) nextActive = index
  })
  if (pageBottom) nextActive = elements.length - 1

  const currentTop = tops[nextActive]
  const nextTop = tops[nextActive + 1] ?? document.documentElement.scrollHeight
  activeIndex.value = nextActive
  chapterProgress.value = Math.min(
    1,
    Math.max(0, (marker - currentTop) / Math.max(1, nextTop - currentTop)),
  )
}

onMounted(() => {
  window.addEventListener('scroll', requestUpdate, { passive: true })
  window.addEventListener('resize', requestUpdate, { passive: true })
  requestUpdate()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', requestUpdate)
  window.removeEventListener('resize', requestUpdate)
  window.cancelAnimationFrame(frame)
})
</script>

<template>
  <nav
    class="scrollspy-desktop"
    :style="{ '--chapter-progress': chapterProgress }"
    aria-label="Page chapters"
  >
    <div class="scrollspy-heading" aria-hidden="true">
      <span>Journey index</span>
      <span>{{ formatIndex(activeIndex) }}/{{ formatIndex(chapters.length - 1) }}</span>
    </div>

    <div class="scrollspy-rail">
      <span class="scrollspy-beam" aria-hidden="true" />
      <a
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        :href="`#${chapter.id}`"
        class="scrollspy-link"
        :class="{ 'is-active': activeIndex === index, 'is-passed': activeIndex > index }"
        :aria-current="activeIndex === index ? 'location' : undefined"
      >
        <span class="scrollspy-index" aria-hidden="true">{{ formatIndex(index) }}</span>
        <span class="scrollspy-node" aria-hidden="true"><i /></span>
        <span class="scrollspy-label">{{ chapter.label }}</span>
      </a>
    </div>

    <div class="scrollspy-status" aria-hidden="true">
      <span>{{ activeChapter.label }}</span>
      <span>{{ Math.round(chapterProgress * 100) }}%</span>
    </div>
  </nav>

  <nav class="scrollspy-mobile" aria-label="Page chapters">
    <div class="mobile-chapter-readout" aria-hidden="true">
      <span>{{ formatIndex(activeIndex) }}</span>
      <b>{{ activeChapter.label }}</b>
    </div>
    <div class="mobile-chapter-track">
      <a
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        :href="`#${chapter.id}`"
        :class="{ 'is-active': activeIndex === index, 'is-passed': activeIndex > index }"
        :aria-current="activeIndex === index ? 'location' : undefined"
        :aria-label="`Go to ${chapter.label}`"
      >
        <span class="sr-only">{{ chapter.label }}</span>
      </a>
    </div>
  </nav>
</template>

<style scoped>
.scrollspy-desktop {
  --rail-color: rgb(71 85 105 / 0.55);
  position: fixed;
  z-index: 45;
  top: 50%;
  right: clamp(0.75rem, 1.8vw, 2rem);
  display: none;
  width: 3.25rem;
  transform: translateY(-50%);
  border: 1px solid rgb(129 140 248 / 0.13);
  border-radius: 1.25rem;
  background: linear-gradient(145deg, rgb(2 6 23 / 0.82), rgb(15 23 42 / 0.66));
  padding: 0.6rem 0.4rem;
  box-shadow: 0 24px 70px rgb(2 6 23 / 0.38), inset 0 1px rgb(255 255 255 / 0.04);
  backdrop-filter: blur(18px);
  overflow: hidden;
  transition: width 320ms cubic-bezier(0.16, 1, 0.3, 1), padding 320ms cubic-bezier(0.16, 1, 0.3, 1), border-color 220ms ease, box-shadow 220ms ease;
}

.scrollspy-desktop:hover,
.scrollspy-desktop:focus-within {
  width: 9.75rem;
  padding: 0.85rem 0.75rem 0.75rem;
  border-color: rgb(129 140 248 / 0.26);
  box-shadow: 0 28px 80px rgb(2 6 23 / 0.48), inset 0 1px rgb(255 255 255 / 0.05);
}

.scrollspy-heading,
.scrollspy-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 8.25rem;
  max-height: 0;
  overflow: hidden;
  color: rgb(100 116 139);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.5rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  opacity: 0;
  text-transform: uppercase;
  visibility: hidden;
  transition: max-height 220ms ease, padding 220ms ease, opacity 160ms ease, visibility 160ms ease;
}

.scrollspy-heading {
  padding: 0 0.25rem;
}

.scrollspy-desktop:hover .scrollspy-heading,
.scrollspy-desktop:focus-within .scrollspy-heading {
  max-height: 2rem;
  padding: 0 0.25rem 0.65rem;
  border-bottom: 1px solid rgb(148 163 184 / 0.08);
  opacity: 1;
  visibility: visible;
}

.scrollspy-rail {
  position: relative;
  padding: 0.15rem 0;
}

.scrollspy-beam {
  position: absolute;
  top: 1.15rem;
  bottom: 1.15rem;
  left: 50%;
  width: 1px;
  background: linear-gradient(to bottom, transparent, var(--rail-color) 10%, var(--rail-color) 90%, transparent);
  transition: left 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.scrollspy-desktop:hover .scrollspy-beam,
.scrollspy-desktop:focus-within .scrollspy-beam {
  left: 2.38rem;
}

.scrollspy-link {
  position: relative;
  display: grid;
  min-height: 2.35rem;
  width: 8.25rem;
  grid-template-columns: 0 1.65rem 0;
  justify-items: center;
  align-items: center;
  gap: 0.35rem;
  border-radius: 0.65rem;
  color: rgb(100 116 139);
  transition: color 220ms ease, background-color 220ms ease, transform 220ms ease, grid-template-columns 320ms cubic-bezier(0.16, 1, 0.3, 1), gap 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.scrollspy-desktop:hover .scrollspy-link,
.scrollspy-desktop:focus-within .scrollspy-link {
  grid-template-columns: 1.4rem 1rem 1fr;
  justify-items: stretch;
  gap: 0.35rem;
}

.scrollspy-link:hover,
.scrollspy-link:focus-visible {
  color: rgb(203 213 225);
  background: rgb(255 255 255 / 0.035);
}

.scrollspy-index {
  display: block;
  overflow: hidden;
  text-align: right;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.48rem;
  letter-spacing: 0.04em;
  opacity: 0;
  transition: color 220ms ease;
}

.scrollspy-desktop:hover .scrollspy-index,
.scrollspy-desktop:focus-within .scrollspy-index {
  opacity: 1;
}

.scrollspy-node {
  position: relative;
  z-index: 1;
  display: grid;
  width: 1rem;
  height: 1rem;
  place-items: center;
}

.scrollspy-node::before {
  width: 0.34rem;
  height: 0.34rem;
  border: 1px solid rgb(100 116 139 / 0.72);
  background: #0f172a;
  content: '';
  transform: rotate(45deg);
  transition: width 220ms ease, height 220ms ease, border-color 220ms ease, background 220ms ease, box-shadow 220ms ease;
}

.scrollspy-node i {
  position: absolute;
  inset: -0.25rem;
  border: 1px solid transparent;
  border-radius: 999px;
  transform: scale(0.55);
  transition: border-color 220ms ease, transform 300ms ease;
}

.scrollspy-label {
  width: 100%;
  overflow: hidden;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  opacity: 0;
  transition: opacity 180ms ease;
  white-space: nowrap;
}

.scrollspy-desktop:hover .scrollspy-label,
.scrollspy-desktop:focus-within .scrollspy-label {
  opacity: 1;
}

.scrollspy-link.is-passed .scrollspy-node::before {
  border-color: rgb(99 102 241 / 0.7);
  background: rgb(79 70 229 / 0.68);
}

.scrollspy-link.is-active {
  color: white;
  background: linear-gradient(90deg, rgb(79 70 229 / 0.13), transparent);
}

.scrollspy-link.is-active .scrollspy-index {
  color: rgb(165 180 252);
}

.scrollspy-link.is-active .scrollspy-node::before {
  width: 0.55rem;
  height: 0.55rem;
  border-color: rgb(165 180 252);
  background: linear-gradient(135deg, #818cf8, #22d3ee);
  box-shadow: 0 0 14px rgb(34 211 238 / 0.72);
}

.scrollspy-link.is-active .scrollspy-node i {
  border-color: rgb(34 211 238 / 0.28);
  transform: scale(calc(0.72 + var(--chapter-progress) * 0.28));
}

.scrollspy-status {
  margin-top: 0.2rem;
  padding: 0 0.25rem;
  color: rgb(129 140 248);
}

.scrollspy-desktop:hover .scrollspy-status,
.scrollspy-desktop:focus-within .scrollspy-status {
  max-height: 2rem;
  padding: 0.65rem 0.25rem 0.05rem;
  border-top: 1px solid rgb(148 163 184 / 0.08);
  opacity: 1;
  visibility: visible;
}

.scrollspy-mobile {
  position: fixed;
  z-index: 44;
  top: calc(var(--header-height) + 0.5rem);
  left: 50%;
  display: flex;
  width: min(calc(100% - 1.5rem), 27rem);
  min-height: 2.25rem;
  align-items: center;
  gap: 0.75rem;
  transform: translateX(-50%);
  border: 1px solid rgb(129 140 248 / 0.13);
  border-radius: 999px;
  background: rgb(2 6 23 / 0.78);
  padding: 0.3rem 0.45rem 0.3rem 0.7rem;
  box-shadow: 0 12px 40px rgb(2 6 23 / 0.32);
  backdrop-filter: blur(16px);
}

.mobile-chapter-readout {
  display: flex;
  min-width: 6.9rem;
  align-items: center;
  gap: 0.45rem;
  color: rgb(129 140 248);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.56rem;
}

.mobile-chapter-readout b {
  overflow: hidden;
  color: rgb(226 232 240);
  font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  font-size: 0.63rem;
  letter-spacing: 0.02em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.mobile-chapter-track {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 0.2rem;
}

.mobile-chapter-track a {
  position: relative;
  display: grid;
  min-width: 1rem;
  min-height: 1.5rem;
  place-items: center;
  border-radius: 999px;
}

.mobile-chapter-track a::before {
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background: rgb(71 85 105 / 0.7);
  content: '';
  transition: height 220ms ease, background 220ms ease, box-shadow 220ms ease;
}

.mobile-chapter-track a.is-passed::before {
  background: rgb(99 102 241 / 0.75);
}

.mobile-chapter-track a.is-active::before {
  height: 4px;
  background: linear-gradient(90deg, #818cf8, #22d3ee);
  box-shadow: 0 0 9px rgb(34 211 238 / 0.6);
}

@media (min-width: 1280px) {
  .scrollspy-desktop {
    display: block;
  }

  .scrollspy-mobile {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scrollspy-link,
  .scrollspy-node::before,
  .scrollspy-node i,
  .mobile-chapter-track a::before {
    transition: none;
  }
}
</style>
