<script setup>
import {
  Award,
  BookOpen,
  BrainCircuit,
  CodeXml,
  LayoutTemplate,
  Play,
  Wrench,
} from '@lucide/vue'

// A static, theme-aware illustration of the app built from HTML rather than a
// bitmap: it stays sharp at any size, follows light and dark mode, and costs a
// few hundred bytes instead of a large image download.
const navigation = [
  { label: 'Courses', icon: BookOpen },
  { label: 'Code Practice', icon: CodeXml, active: true },
  { label: 'Templates', icon: LayoutTemplate },
  { label: 'Tools', icon: Wrench },
  { label: 'AI Studio', icon: BrainCircuit },
]

// Each line is a list of [token type, text] pairs.
const code = [
  [['comment', '# Lesson 4 · Lists and functions']],
  [['keyword', 'def '], ['function', 'average'], ['plain', '(scores):']],
  [['plain', '    '], ['keyword', 'return '], ['function', 'sum'], ['plain', '(scores) / '], ['function', 'len'], ['plain', '(scores)']],
  [],
  [['plain', 'grades = ['], ['number', '92'], ['plain', ', '], ['number', '85'], ['plain', ', '], ['number', '78'], ['plain', ', '], ['number', '96'], ['plain', ']']],
  [['function', 'print'], ['plain', '('], ['string', 'f"Average: {average(grades):.1f}"'], ['plain', ')']],
]
</script>

<template>
  <div class="relative min-w-0">
    <figure
      class="card overflow-hidden shadow-lift"
      role="img"
      aria-label="The GenXYZ Lab code editor running a Python lesson and showing its output"
    >
      <div class="flex h-10 items-center gap-3 border-b border-line bg-subtle px-4">
        <div class="flex gap-1.5">
          <span class="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span class="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span class="h-2.5 w-2.5 rounded-full bg-line-strong" />
        </div>
        <span class="truncate text-xs font-medium text-fg-subtle">GenXYZ Lab — Code Practice</span>
      </div>

      <div class="grid sm:grid-cols-[10.5rem_minmax(0,1fr)]">
        <aside class="hidden flex-col gap-0.5 border-r border-line bg-subtle p-2.5 sm:flex">
          <span
            v-for="item in navigation"
            :key="item.label"
            class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium"
            :class="item.active ? 'bg-surface text-fg shadow-card' : 'text-fg-muted'"
          >
            <component :is="item.icon" :size="15" :class="item.active ? 'text-brand-text' : ''" />
            {{ item.label }}
          </span>

          <div class="mt-auto rounded-lg border border-line bg-surface p-3">
            <p class="text-[11px] font-semibold text-fg">Python Basics</p>
            <p class="mt-0.5 text-[10px] text-fg-subtle">Lesson 4 of 12</p>
            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div class="h-full w-1/3 rounded-full bg-brand" />
            </div>
          </div>
        </aside>

        <div class="min-w-0">
          <div class="flex h-9 items-end gap-1 border-b border-line px-3">
            <span class="rounded-t-md border border-b-0 border-line bg-surface px-3 py-1.5 font-mono text-[11px] text-fg">main.py</span>
            <span class="px-3 py-1.5 font-mono text-[11px] text-fg-subtle">notes.md</span>
          </div>

          <pre class="code overflow-hidden px-3 py-4 font-mono text-[11.5px] leading-6 sm:text-xs sm:leading-6"><code><span
            v-for="(line, index) in code"
            :key="index"
            class="flex"
          ><span class="line-number">{{ index + 1 }}</span><span class="min-w-0 whitespace-pre"><span
            v-for="(token, tokenIndex) in line"
            :key="tokenIndex"
            :class="`token-${token[0]}`"
          >{{ token[1] }}</span></span></span></code></pre>

          <div class="border-t border-line bg-subtle">
            <div class="flex items-center justify-between px-3 py-2">
              <span class="text-[11px] font-semibold uppercase tracking-wide text-fg-subtle">Output</span>
              <span class="inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
                <Play :size="11" fill="currentColor" />
                Run
              </span>
            </div>
            <div class="px-3 pb-3 font-mono text-[11.5px] leading-6 sm:text-xs">
              <p class="text-fg">Average: 87.8</p>
              <p class="text-success-text">✓ Finished in 0.12s</p>
            </div>
          </div>
        </div>
      </div>
    </figure>

    <div class="card absolute -bottom-6 right-5 hidden items-center gap-3 px-4 py-3 shadow-lift sm:flex" aria-hidden="true">
      <span class="icon-tile h-9 w-9 bg-warning/15 text-warning-text">
        <Award :size="18" />
      </span>
      <span>
        <span class="block text-xs font-semibold text-fg">Certificate earned</span>
        <span class="block text-[11px] text-fg-subtle">Python Basics · 100%</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.line-number {
  width: 1.75rem;
  flex: none;
  padding-right: 0.75rem;
  color: rgb(var(--fg-subtle) / 0.6);
  text-align: right;
  user-select: none;
}

.code {
  color: rgb(var(--fg));
}

.token-comment { color: rgb(var(--code-comment)); font-style: italic; }
.token-keyword { color: rgb(var(--code-keyword)); }
.token-function { color: rgb(var(--code-function)); }
.token-string { color: rgb(var(--code-string)); }
.token-number { color: rgb(var(--code-number)); }
</style>
