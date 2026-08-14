<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const panels = [
  {
    command: 'pkg update && pkg install clang',
    label: 'TERMUX // PACKAGES',
    status: 'installing',
    tone: 'cyan',
    lines: [
      { tag: 'INIT', text: 'Selecting secure mirror...', tone: 'muted' },
      { tag: 'GET', text: 'packages.termux.dev stable', tone: 'cyan' },
      { tag: 'FETCH', text: 'clang 19.1.7 · 28.4 MB', tone: 'muted' },
      { tag: 'LINK', text: 'toolchain/bin/clang', tone: 'cyan' },
      { tag: 'OK', text: 'compiler ready', tone: 'success' },
    ],
  },
  {
    command: 'gl compiler sync --android',
    label: 'COMPILER MANAGER // SYNC',
    status: 'connected',
    tone: 'green',
    lines: [
      { tag: 'SCAN', text: 'ABI arm64-v8a detected', tone: 'cyan' },
      { tag: 'FOUND', text: 'OpenJDK 21.0.6', tone: 'muted' },
      { tag: 'FOUND', text: 'Node.js 22 · Python 3.12', tone: 'muted' },
      { tag: 'VERIFY', text: '10 workflows available', tone: 'cyan' },
      { tag: 'READY', text: 'local execution online', tone: 'success' },
    ],
  },
  {
    command: 'gl learn cache kotlin-foundations',
    label: 'LEARNING // OFFLINE CACHE',
    status: 'indexed',
    tone: 'violet',
    lines: [
      { tag: 'GET', text: '24 guided lessons', tone: 'muted' },
      { tag: 'GET', text: '18 checkpoints · 7 quizzes', tone: 'muted' },
      { tag: 'SAVE', text: 'examples and references', tone: 'violet' },
      { tag: 'INDEX', text: 'search map generated', tone: 'cyan' },
      { tag: 'OK', text: 'available without network', tone: 'success' },
    ],
  },
  {
    command: 'gl build ./hello-android',
    label: 'PROJECT STUDIO // BUILD',
    status: 'building',
    tone: 'cyan',
    lines: [
      { tag: 'TASK', text: 'compileKotlin', tone: 'cyan' },
      { tag: 'TASK', text: 'mergeDebugResources', tone: 'muted' },
      { tag: 'TASK', text: 'packageDebug', tone: 'muted' },
      { tag: 'APK', text: 'app-debug.apk · 18.7 MB', tone: 'violet' },
      { tag: 'DONE', text: 'BUILD SUCCESSFUL in 4.8s', tone: 'success' },
    ],
  },
  {
    command: 'gl ai diagnose --project current',
    label: 'ASSISTANT // DIAGNOSTICS',
    status: 'analyzing',
    tone: 'violet',
    lines: [
      { tag: 'READ', text: 'project context loaded', tone: 'muted' },
      { tag: 'TRACE', text: 'runtime path inspected', tone: 'cyan' },
      { tag: 'FIX', text: 'missing permission found', tone: 'violet' },
      { tag: 'PATCH', text: 'guided repair prepared', tone: 'cyan' },
      { tag: 'PASS', text: 'workspace healthy', tone: 'success' },
    ],
  },
  {
    command: 'termux-setup-storage --verify',
    label: 'ANDROID BRIDGE // ACCESS',
    status: 'watching',
    tone: 'amber',
    lines: [
      { tag: 'CHECK', text: 'shared storage mounted', tone: 'muted' },
      { tag: 'CHECK', text: 'command permission active', tone: 'cyan' },
      { tag: 'WARN', text: 'battery policy optimized', tone: 'warning' },
      { tag: 'GUIDE', text: 'unrestricted mode suggested', tone: 'amber' },
      { tag: 'OK', text: 'bridge responsive', tone: 'success' },
    ],
  },
  {
    command: 'gl test --course exercises',
    label: 'PRACTICE // TEST RUNNER',
    status: 'passing',
    tone: 'green',
    lines: [
      { tag: 'RUN', text: 'variables_test.kt', tone: 'muted' },
      { tag: 'PASS', text: '6 assertions · 31ms', tone: 'success' },
      { tag: 'RUN', text: 'functions_test.kt', tone: 'muted' },
      { tag: 'PASS', text: '9 assertions · 44ms', tone: 'success' },
      { tag: 'COV', text: 'lesson mastery 92%', tone: 'cyan' },
    ],
  },
  {
    command: 'gl release verify --latest',
    label: 'RELEASE // INTEGRITY',
    status: 'verified',
    tone: 'violet',
    lines: [
      { tag: 'GET', text: 'release manifest v2.4.0', tone: 'muted' },
      { tag: 'HASH', text: 'SHA-256 signature match', tone: 'cyan' },
      { tag: 'CHECK', text: 'Android package signed', tone: 'muted' },
      { tag: 'SAFE', text: 'official build confirmed', tone: 'success' },
      { tag: 'READY', text: 'APK can be installed', tone: 'violet' },
    ],
  },
  {
    command: 'gl progress export --certificate',
    label: 'PROGRESS // EVENT LOG',
    status: 'complete',
    tone: 'cyan',
    lines: [
      { tag: 'LOAD', text: 'learning path complete', tone: 'muted' },
      { tag: 'RENDER', text: 'verified milestones', tone: 'cyan' },
      { tag: 'SIGN', text: 'achievement record', tone: 'violet' },
      { tag: 'SAVE', text: 'shareable certificate', tone: 'muted' },
      { tag: 'DONE', text: 'progress made visible', tone: 'success' },
    ],
  },
]

const tick = ref(5)
const inView = ref(true)
let timer = 0
let observer = null

function panelPhase(panel, index) {
  const cycle = panel.lines.length + 6
  return (tick.value + index * 2) % cycle
}

function visibleLineCount(panel, index) {
  return Math.min(panel.lines.length, Math.max(0, panelPhase(panel, index) - 1))
}

function panelIsActive(panel, index) {
  const phase = panelPhase(panel, index)
  return phase > 0 && phase <= panel.lines.length + 1
}

function updateVisibility() {
  inView.value = !document.hidden
}

onMounted(() => {
  document.addEventListener('visibilitychange', updateVisibility)

  observer = new IntersectionObserver(
    ([entry]) => {
      inView.value = entry.isIntersecting && !document.hidden
    },
    { rootMargin: '180px 0px' },
  )
  const wall = document.querySelector('[data-terminal-grid]')
  if (wall) observer.observe(wall)

  timer = window.setInterval(() => {
    if (inView.value) tick.value += 1
  }, 520)
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
  observer?.disconnect()
  document.removeEventListener('visibilitychange', updateVisibility)
})
</script>

<template>
  <div class="terminal-wall" data-terminal-grid aria-hidden="true">
    <div class="terminal-stage">
      <article
        v-for="(panel, panelIndex) in panels"
        :key="panel.command"
        class="terminal-panel"
        :class="[`terminal-panel--${panel.tone}`, { 'is-active': panelIsActive(panel, panelIndex) }]"
        :data-terminal-card="panelIndex"
      >
        <div class="terminal-command">
          <span class="terminal-prompt">›</span>
          <span class="truncate">{{ panel.command }}</span>
          <span v-if="panelIsActive(panel, panelIndex)" class="terminal-caret">_</span>
        </div>

        <div class="terminal-output">
          <div
            v-for="(line, lineIndex) in panel.lines"
            :key="`${panel.command}-${lineIndex}`"
            class="terminal-line"
            :class="[
              `terminal-line--${line.tone}`,
              { 'is-printed': lineIndex < visibleLineCount(panel, panelIndex) },
            ]"
          >
            <span class="terminal-tag">[{{ line.tag }}]</span>
            <span class="truncate">{{ line.text }}</span>
          </div>
        </div>

        <div class="terminal-footer">
          <span>{{ panel.label }}</span>
          <span class="terminal-state">
            {{ panel.status }}
            <i />
          </span>
        </div>
      </article>
    </div>
    <div class="terminal-scan" />
  </div>
</template>

<style scoped>
/* Texture, not a panel. The wall fills its section as a backdrop and is masked
   away at every edge so it dissolves into the page instead of ending on a hard
   rectangle. Foreground copy always sits above it, so the opacity here is
   chosen to stay legible-as-atmosphere without competing for attention. */
.terminal-wall {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  perspective: 1700px;
  opacity: 0.3;
  mask-image:
    linear-gradient(to bottom, transparent, #000 18%, #000 76%, transparent),
    linear-gradient(to right, transparent, #000 14%, #000 86%, transparent);
  mask-composite: intersect;
  -webkit-mask-image:
    linear-gradient(to bottom, transparent, #000 18%, #000 76%, transparent),
    linear-gradient(to right, transparent, #000 14%, #000 86%, transparent);
  -webkit-mask-composite: source-in;
  will-change: transform;
}

.terminal-stage {
  display: grid;
  width: 100%;
  height: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  border-left: 1px solid rgba(148, 163, 184, 0.1);
  transform: rotateX(4deg) rotateZ(-0.4deg) scale(1.06);
  transform-origin: 50% 50%;
}

.terminal-panel {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-right: 1px solid rgba(148, 163, 184, 0.12);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  background:
    radial-gradient(circle at 88% 12%, rgba(34, 211, 238, 0.035), transparent 30%),
    rgba(0, 3, 8, 0.88);
  color: #64748b;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  transition: border-color 420ms ease, background-color 420ms ease, box-shadow 420ms ease;
  will-change: transform;
}

.terminal-panel::after {
  position: absolute;
  inset: 0;
  border: 1px solid transparent;
  content: "";
  pointer-events: none;
  transition: border-color 420ms ease, box-shadow 420ms ease;
}

.terminal-panel.is-active::after {
  border-color: rgba(34, 211, 238, 0.16);
  box-shadow: inset 0 0 36px rgba(34, 211, 238, 0.035);
}

.terminal-command {
  display: flex;
  height: 2.75rem;
  align-items: center;
  gap: 0.45rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.075);
  padding: 0 1rem;
  color: rgba(226, 232, 240, 0.82);
  font-size: 11px;
  letter-spacing: -0.015em;
  white-space: nowrap;
}

.terminal-prompt {
  color: #67e8f9;
  font-size: 15px;
  line-height: 1;
  text-shadow: 0 0 12px rgba(34, 211, 238, 0.65);
}

.terminal-caret {
  color: #a5f3fc;
  animation: caret-blink 800ms steps(1) infinite;
}

.terminal-output {
  display: grid;
  gap: 0.42rem;
  padding: 0.9rem 1rem 2.75rem;
}

.terminal-line {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  opacity: 0;
  filter: blur(2px);
  font-size: 10px;
  line-height: 1.35;
  transform: translateY(5px);
  transition:
    opacity 520ms ease,
    filter 620ms ease,
    transform 680ms cubic-bezier(0.16, 1, 0.3, 1);
}

.terminal-line.is-printed {
  opacity: 0.85;
  filter: blur(0);
  transform: translateY(0);
}

.terminal-tag {
  min-width: 3.25rem;
  color: #475569;
  font-weight: 700;
}

.terminal-line--cyan .terminal-tag {
  color: #22d3ee;
}

.terminal-line--violet .terminal-tag {
  color: #a78bfa;
}

.terminal-line--success .terminal-tag {
  color: #34d399;
}

.terminal-line--warning .terminal-tag,
.terminal-line--amber .terminal-tag {
  color: #fbbf24;
}

.terminal-footer {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  height: 2rem;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid rgba(148, 163, 184, 0.075);
  padding: 0 0.8rem;
  color: rgba(100, 116, 139, 0.72);
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.terminal-state {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.terminal-state i {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #22d3ee;
  box-shadow: 0 0 9px rgba(34, 211, 238, 0.75);
}

.terminal-panel--green .terminal-state i {
  background: #34d399;
  box-shadow: 0 0 9px rgba(52, 211, 153, 0.75);
}

.terminal-panel--violet .terminal-state i {
  background: #a78bfa;
  box-shadow: 0 0 9px rgba(167, 139, 250, 0.75);
}

.terminal-panel--amber .terminal-state i {
  background: #fbbf24;
  box-shadow: 0 0 9px rgba(251, 191, 36, 0.7);
}

.is-active .terminal-state i {
  animation: state-pulse 1.15s ease-in-out infinite;
}

.terminal-scan {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 54%;
  width: 18rem;
  opacity: 0.34;
  background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.09), transparent);
  filter: blur(30px);
  animation: scan-drift 9s ease-in-out infinite alternate;
}

@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}

@keyframes state-pulse {
  50% {
    opacity: 0.35;
    transform: scale(0.76);
  }
}

@keyframes scan-drift {
  to {
    transform: translateX(16rem);
  }
}

/* Fewer, larger cells as the width drops. Nine columns of monospace on a phone
   compresses into unreadable specks that read as dirt rather than texture. */
@media (max-width: 1023px) {
  .terminal-stage {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, minmax(0, 1fr));
  }

  .terminal-panel:nth-child(n + 7) {
    display: none;
  }
}

@media (max-width: 639px) {
  .terminal-wall {
    opacity: 0.2;
  }

  .terminal-stage {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: repeat(3, minmax(0, 1fr));
    transform: none;
  }

  .terminal-panel:nth-child(n + 4) {
    display: none;
  }

  .terminal-scan {
    left: 10%;
    opacity: 0.22;
  }
}

@media (prefers-reduced-motion: reduce) {
  .terminal-scan,
  .terminal-caret,
  .is-active .terminal-state i {
    animation: none;
  }

  /* The typewriter reveal is driven by a JS tick, so with motion reduced every
     line is simply shown at rest rather than animating in. */
  .terminal-line {
    opacity: 0.85;
    filter: none;
    transform: none;
    transition: none;
  }
}

</style>
