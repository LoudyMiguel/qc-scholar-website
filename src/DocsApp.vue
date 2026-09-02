<script setup>
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Download,
  ExternalLink,
  FileText,
  Laptop,
  Menu,
  Monitor,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
  X,
} from '@lucide/vue'
import { computed, ref } from 'vue'
import BrandLogo from './components/BrandLogo.vue'
import { siteConfig } from './config/site'
import {
  featureGroups,
  mainNavigation,
  quickStart,
  recommendedWorkflow,
  troubleshooting,
} from './docs-content'

const searchQuery = ref('')
const mobileNavOpen = ref(false)

const tableOfContents = [
  { label: 'Start here', href: '#start' },
  { label: 'Install & setup', href: '#setup' },
  { label: 'App navigation', href: '#navigation' },
  { label: 'Recommended workflow', href: '#workflow' },
  { label: 'All features', href: '#features' },
  { label: 'Updates & backups', href: '#updates' },
  { label: 'Troubleshooting', href: '#troubleshooting' },
]

const featureCount = featureGroups.reduce(
  (total, group) => total + group.features.length,
  0,
)

const filteredFeatureGroups = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return featureGroups

  return featureGroups
    .map((group) => {
      const groupMatches = `${group.title} ${group.summary}`
        .toLowerCase()
        .includes(query)
      const features = groupMatches
        ? group.features
        : group.features.filter((feature) =>
            `${feature.name} ${feature.detail}`.toLowerCase().includes(query),
          )
      return { ...group, features }
    })
    .filter((group) => group.features.length)
})

function closeMobileNav() {
  mobileNavOpen.value = false
}
</script>

<template>
  <a
    href="#docs-content"
    class="fixed left-4 top-3 z-[80] -translate-y-24 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 focus:translate-y-0"
  >
    Skip to documentation
  </a>

  <div id="top" class="min-h-screen bg-ink text-slate-300">
    <header class="sticky top-0 z-50 border-b border-white/[0.07] bg-slate-950/90 backdrop-blur-xl">
      <div class="site-container flex min-h-[76px] items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <BrandLogo href="/" />
          <span class="hidden h-7 w-px bg-slate-800 sm:block" aria-hidden="true" />
          <span class="hidden items-center gap-2 text-xs font-bold text-slate-400 sm:inline-flex">
            <FileText :size="15" class="text-indigo-300" aria-hidden="true" />
            Documentation
          </span>
        </div>

        <nav class="hidden items-center gap-1 lg:flex" aria-label="Documentation navigation">
          <a href="#setup" class="doc-header-link">Setup</a>
          <a href="#workflow" class="doc-header-link">Workflow</a>
          <a href="#features" class="doc-header-link">Features</a>
          <a href="#troubleshooting" class="doc-header-link">Help</a>
        </nav>

        <div class="flex items-center gap-2">
          <a href="/" class="button-secondary hidden min-h-11 px-4 py-2 md:inline-flex">
            <ArrowLeft :size="16" aria-hidden="true" />
            Website
          </a>
          <a href="/#download" class="button-primary hidden min-h-11 px-4 py-2 sm:inline-flex">
            <Download :size="16" aria-hidden="true" />
            Download
          </a>
          <button
            type="button"
            class="grid h-11 w-11 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-slate-200 lg:hidden"
            :aria-expanded="mobileNavOpen"
            aria-controls="docs-mobile-navigation"
            :aria-label="mobileNavOpen ? 'Close documentation navigation' : 'Open documentation navigation'"
            @click="mobileNavOpen = !mobileNavOpen"
          >
            <X v-if="mobileNavOpen" :size="20" aria-hidden="true" />
            <Menu v-else :size="20" aria-hidden="true" />
          </button>
        </div>
      </div>

      <nav
        v-if="mobileNavOpen"
        id="docs-mobile-navigation"
        class="border-t border-white/[0.06] bg-slate-950 px-5 pb-5 pt-3 lg:hidden"
        aria-label="Mobile documentation navigation"
      >
        <a
          v-for="item in tableOfContents"
          :key="item.href"
          :href="item.href"
          class="flex min-h-11 items-center justify-between border-b border-slate-800/70 text-sm font-semibold text-slate-300"
          @click="closeMobileNav"
        >
          {{ item.label }}
          <ChevronRight :size="15" aria-hidden="true" />
        </a>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <a href="/" class="button-secondary min-h-11 px-3 py-2" @click="closeMobileNav">Website</a>
          <a href="/#download" class="button-primary min-h-11 px-3 py-2" @click="closeMobileNav">Download</a>
        </div>
      </nav>
    </header>

    <main id="docs-content">
      <section id="start" class="docs-hero relative overflow-hidden border-b border-white/[0.06] py-20 sm:py-24">
        <div class="pointer-events-none absolute inset-0 bg-hero-radial opacity-80" aria-hidden="true" />
        <div class="site-container relative">
          <div class="max-w-4xl">
            <span class="eyebrow">
              <BookOpenCheck :size="14" aria-hidden="true" />
              GenXYZ Lab {{ siteConfig.version }}
            </span>
            <h1 class="mt-7 max-w-4xl font-display text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              Learn, practice, and build with the app set up correctly.
            </h1>
            <p class="mt-6 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
              This guide covers installation on Android and Windows, the best first-use workflow,
              every major feature in the current release, updates, backups, and common fixes.
            </p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#setup" class="button-primary">
                Start setup
                <ArrowRight :size="17" aria-hidden="true" />
              </a>
              <a href="#features" class="button-secondary">
                Browse {{ featureCount }} documented capabilities
              </a>
            </div>
          </div>

          <dl class="mt-12 grid max-w-4xl gap-3 sm:grid-cols-3">
            <div class="docs-stat">
              <dt>Current release</dt>
              <dd>Version {{ siteConfig.version }}</dd>
            </div>
            <div class="docs-stat">
              <dt>Supported platforms</dt>
              <dd>Android + Windows</dd>
            </div>
            <div class="docs-stat">
              <dt>Account required</dt>
              <dd>No account or subscription</dd>
            </div>
          </dl>
        </div>
      </section>

      <div class="site-container grid gap-12 py-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16">
        <aside class="hidden lg:block">
          <nav class="sticky top-28" aria-label="On this page">
            <p class="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">On this page</p>
            <div class="mt-4 border-l border-slate-800">
              <a
                v-for="item in tableOfContents"
                :key="item.href"
                :href="item.href"
                class="docs-toc-link"
              >
                {{ item.label }}
              </a>
            </div>
            <div class="mt-8 rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.06] p-4">
              <ShieldCheck :size="20" class="text-indigo-300" aria-hidden="true" />
              <p class="mt-3 text-xs font-bold text-white">Official documentation</p>
              <p class="mt-2 text-[11px] leading-5 text-slate-500">
                Written against the current GenXYZ Lab feature and tool registries.
              </p>
            </div>
          </nav>
        </aside>

        <div class="min-w-0 space-y-20">
          <section id="setup" aria-labelledby="setup-heading">
            <div class="docs-section-heading">
              <span class="docs-section-icon"><Wrench :size="21" aria-hidden="true" /></span>
              <div>
                <p class="docs-kicker">Installation</p>
                <h2 id="setup-heading">Proper setup for each platform</h2>
              </div>
            </div>
            <p class="docs-intro">
              Courses and bundled content work without a compiler. Local code execution, terminals,
              framework servers, Flutter builds, and Arduino tools need the matching platform toolchain.
            </p>

            <div class="mt-8 grid gap-5 xl:grid-cols-2">
              <article
                v-for="platform in quickStart"
                :key="platform.platform"
                class="docs-platform-card"
              >
                <div class="flex items-start justify-between gap-4">
                  <span class="docs-platform-icon">
                    <Smartphone v-if="platform.platform === 'Android'" :size="22" aria-hidden="true" />
                    <Monitor v-else :size="22" aria-hidden="true" />
                  </span>
                  <span class="rounded-full border border-slate-700 bg-slate-950/50 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">
                    {{ platform.requirement }}
                  </span>
                </div>
                <h3 class="mt-5 font-display text-2xl font-semibold text-white">{{ platform.platform }}</h3>
                <p class="mt-3 text-sm leading-7 text-slate-400">{{ platform.summary }}</p>
                <ol class="mt-6 space-y-4">
                  <li v-for="(step, index) in platform.steps" :key="step" class="flex gap-3 text-sm leading-7 text-slate-300">
                    <span class="docs-step-number">{{ index + 1 }}</span>
                    <span>{{ step }}</span>
                  </li>
                </ol>
                <a
                  v-if="platform.platform === 'Android'"
                  :href="siteConfig.termuxUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-6 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-cyan-300 hover:text-cyan-200"
                >
                  Open the verified Termux source
                  <ExternalLink :size="14" aria-hidden="true" />
                </a>
              </article>
            </div>

            <div class="docs-note mt-5">
              <AlertTriangle :size="20" class="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
              <div>
                <strong>Android install order matters for local tools.</strong>
                <p>Install and open Termux before configuring GenXYZ Lab’s compiler bridge. Use the current F-Droid build; the old Play Store release is obsolete.</p>
              </div>
            </div>
          </section>

          <section id="navigation" aria-labelledby="navigation-heading">
            <div class="docs-section-heading">
              <span class="docs-section-icon"><Laptop :size="21" aria-hidden="true" /></span>
              <div>
                <p class="docs-kicker">First use</p>
                <h2 id="navigation-heading">Know the four main destinations</h2>
              </div>
            </div>
            <p class="docs-intro">
              Phones use bottom navigation. Wider Windows layouts use a side rail or labelled sidebar,
              but the same four destinations and data are available.
            </p>
            <div class="mt-8 grid gap-4 sm:grid-cols-2">
              <article v-for="(item, index) in mainNavigation" :key="item.name" class="docs-simple-card">
                <span class="font-mono text-xs font-bold text-cyan-300">0{{ index + 1 }}</span>
                <h3>{{ item.name }}</h3>
                <p>{{ item.detail }}</p>
              </article>
            </div>
          </section>

          <section id="workflow" aria-labelledby="workflow-heading">
            <div class="docs-section-heading">
              <span class="docs-section-icon"><Code2 :size="21" aria-hidden="true" /></span>
              <div>
                <p class="docs-kicker">Recommended workflow</p>
                <h2 id="workflow-heading">Learn → Practice → Build</h2>
              </div>
            </div>
            <p class="docs-intro">
              The app is most useful when a course concept becomes runnable code and then a project you can keep.
            </p>
            <ol class="mt-8 grid gap-4 xl:grid-cols-3">
              <li v-for="(step, index) in recommendedWorkflow" :key="step.label" class="docs-workflow-card">
                <div class="flex items-center justify-between gap-3">
                  <span class="docs-workflow-label">{{ step.label }}</span>
                  <span class="font-mono text-xs text-slate-600">0{{ index + 1 }}</span>
                </div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.detail }}</p>
              </li>
            </ol>
          </section>

          <section id="features" aria-labelledby="features-heading">
            <div class="docs-section-heading">
              <span class="docs-section-icon"><Sparkles :size="21" aria-hidden="true" /></span>
              <div>
                <p class="docs-kicker">Complete reference</p>
                <h2 id="features-heading">All current feature groups</h2>
              </div>
            </div>
            <p class="docs-intro">
              Templates and course titles are content inside these systems. This reference lists the capabilities,
              catalogs, tools, and workflows available in version {{ siteConfig.version }}.
            </p>

            <label class="docs-search mt-8">
              <Search :size="19" aria-hidden="true" />
              <span class="sr-only">Search documented features</span>
              <input v-model="searchQuery" type="search" placeholder="Search features, languages, frameworks, games, or tools…" />
              <button v-if="searchQuery" type="button" aria-label="Clear feature search" @click="searchQuery = ''">
                <X :size="17" aria-hidden="true" />
              </button>
            </label>

            <div v-if="filteredFeatureGroups.length" class="mt-8 space-y-8">
              <article
                v-for="group in filteredFeatureGroups"
                :id="group.id"
                :key="group.id"
                class="docs-feature-group"
              >
                <div class="border-b border-slate-800/80 p-5 sm:p-6">
                  <h3 class="font-display text-xl font-semibold text-white">{{ group.title }}</h3>
                  <p class="mt-2 text-sm leading-7 text-slate-500">{{ group.summary }}</p>
                </div>
                <div class="divide-y divide-slate-800/70 px-5 sm:px-6">
                  <div v-for="feature in group.features" :key="feature.name" class="grid gap-2 py-5 md:grid-cols-[210px_1fr] md:gap-7">
                    <div class="flex items-start gap-2.5">
                      <Check :size="15" class="mt-1 shrink-0 text-emerald-300" aria-hidden="true" />
                      <h4 class="text-sm font-bold leading-6 text-slate-100">{{ feature.name }}</h4>
                    </div>
                    <p class="text-sm leading-7 text-slate-400">{{ feature.detail }}</p>
                  </div>
                </div>
              </article>
            </div>
            <div v-else class="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
              <CircleHelp :size="28" class="mx-auto text-slate-600" aria-hidden="true" />
              <h3 class="mt-4 font-display text-lg font-semibold text-white">No matching feature</h3>
              <p class="mt-2 text-sm text-slate-500">Try a broader term such as “course,” “Python,” “database,” or “game.”</p>
            </div>
          </section>

          <section id="updates" aria-labelledby="updates-heading">
            <div class="docs-section-heading">
              <span class="docs-section-icon"><ShieldCheck :size="21" aria-hidden="true" /></span>
              <div>
                <p class="docs-kicker">Keep your work safe</p>
                <h2 id="updates-heading">Updates and backups</h2>
              </div>
            </div>
            <div class="mt-8 grid gap-5 xl:grid-cols-2">
              <article class="docs-simple-card">
                <h3>Before a major update</h3>
                <p>Open Settings → Backup & Restore → Create Backup. Choose the modules you need, optionally add a password, and save the resulting .qcs file somewhere you control.</p>
              </article>
              <article class="docs-simple-card">
                <h3>When a newer version is available</h3>
                <p>The app checks official release metadata after launch and shows an update banner. Android opens the official APK download; Windows opens the official ZIP download.</p>
              </article>
              <article class="docs-simple-card">
                <h3>Updating Android</h3>
                <p>Download the new APK and install it over the existing official build. Do not uninstall first unless Android requires it—and create a backup before removing an old or differently signed build.</p>
              </article>
              <article class="docs-simple-card">
                <h3>Updating Windows</h3>
                <p>Close the app, download the new ZIP, and extract it to a complete folder. Keep a backup before replacing an older folder, especially if you deliberately stored project files beside the app.</p>
              </article>
            </div>
          </section>

          <section id="troubleshooting" aria-labelledby="troubleshooting-heading">
            <div class="docs-section-heading">
              <span class="docs-section-icon"><CircleHelp :size="21" aria-hidden="true" /></span>
              <div>
                <p class="docs-kicker">Common fixes</p>
                <h2 id="troubleshooting-heading">Troubleshooting</h2>
              </div>
            </div>
            <div class="mt-8 space-y-3">
              <details v-for="item in troubleshooting" :key="item.problem" class="docs-details">
                <summary>
                  <span>{{ item.problem }}</span>
                  <ChevronRight :size="18" aria-hidden="true" />
                </summary>
                <ul>
                  <li v-for="fix in item.fixes" :key="fix">
                    <Check :size="15" aria-hidden="true" />
                    <span>{{ fix }}</span>
                  </li>
                </ul>
              </details>
            </div>
          </section>

          <section class="rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-slate-900/70 to-cyan-500/10 p-7 sm:p-10">
            <p class="docs-kicker">Ready to begin</p>
            <h2 class="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">Get the official Android or Windows release.</h2>
            <p class="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              The website always points to the current release manifest and shows both platform downloads in one place.
            </p>
            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href="/#download" class="button-primary">
                <Download :size="17" aria-hidden="true" />
                Open downloads
              </a>
              <a href="/" class="button-secondary">Return to the website</a>
            </div>
          </section>
        </div>
      </div>
    </main>

    <footer class="border-t border-white/[0.06] bg-slate-950/60 py-10">
      <div class="site-container flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <BrandLogo href="/" />
        <div class="flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-500">
          <a href="/" class="hover:text-white">Website</a>
          <a href="/#download" class="hover:text-white">Download</a>
          <a href="/privacy.html" class="hover:text-white">Privacy</a>
          <a :href="siteConfig.termuxDocsUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 hover:text-white">
            Termux notes <ExternalLink :size="11" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.doc-header-link {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  border-radius: 0.6rem;
  padding: 0 0.8rem;
  color: rgb(148 163 184);
  font-size: 0.82rem;
  font-weight: 700;
}

.doc-header-link:hover {
  background: rgb(255 255 255 / 0.04);
  color: white;
}

.docs-hero {
  background:
    linear-gradient(180deg, rgb(15 23 42 / 0.24), rgb(2 6 23)),
    radial-gradient(circle at 82% 35%, rgb(34 211 238 / 0.07), transparent 28%);
}

.docs-stat {
  border: 1px solid rgb(148 163 184 / 0.13);
  border-radius: 1rem;
  background: rgb(15 23 42 / 0.52);
  padding: 1rem 1.1rem;
}

.docs-stat dt {
  color: rgb(100 116 139);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.docs-stat dd {
  margin-top: 0.55rem;
  color: rgb(241 245 249);
  font-size: 0.82rem;
  font-weight: 700;
}

.docs-toc-link {
  display: flex;
  min-height: 2.5rem;
  align-items: center;
  border-left: 2px solid transparent;
  margin-left: -1px;
  padding: 0 0.85rem;
  color: rgb(100 116 139);
  font-size: 0.76rem;
  font-weight: 700;
}

.docs-toc-link:hover,
.docs-toc-link:focus-visible {
  border-left-color: rgb(34 211 238);
  color: rgb(226 232 240);
}

.docs-section-heading {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.docs-section-heading h2 {
  margin-top: 0.35rem;
  color: white;
  font-family: Sora, sans-serif;
  font-size: clamp(1.65rem, 3vw, 2.2rem);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.2;
}

.docs-section-icon {
  display: grid;
  height: 2.8rem;
  width: 2.8rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(129 140 248 / 0.22);
  border-radius: 0.9rem;
  background: rgb(99 102 241 / 0.09);
  color: rgb(165 180 252);
}

.docs-kicker {
  color: rgb(34 211 238);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.17em;
  text-transform: uppercase;
}

.docs-intro {
  max-width: 48rem;
  margin-top: 1rem;
  color: rgb(148 163 184);
  font-size: 0.94rem;
  line-height: 1.85;
}

.docs-platform-card,
.docs-feature-group {
  overflow: hidden;
  border: 1px solid rgb(148 163 184 / 0.14);
  border-radius: 1.35rem;
  background: linear-gradient(150deg, rgb(15 23 42 / 0.82), rgb(15 23 42 / 0.42));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.035);
}

.docs-platform-card {
  padding: 1.5rem;
}

.docs-platform-icon {
  display: grid;
  height: 3rem;
  width: 3rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.06);
  border-radius: 0.9rem;
  background: rgb(2 6 23 / 0.55);
  color: rgb(103 232 249);
}

.docs-step-number {
  display: grid;
  height: 1.65rem;
  width: 1.65rem;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 50%;
  background: rgb(99 102 241 / 0.13);
  color: rgb(165 180 252);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.66rem;
  font-weight: 700;
}

.docs-note {
  display: flex;
  gap: 0.85rem;
  border: 1px solid rgb(251 191 36 / 0.18);
  border-radius: 1rem;
  background: rgb(251 191 36 / 0.055);
  padding: 1rem 1.1rem;
  color: rgb(254 243 199);
  font-size: 0.8rem;
  line-height: 1.65;
}

.docs-note p {
  margin-top: 0.25rem;
  color: rgb(253 230 138 / 0.65);
}

.docs-simple-card,
.docs-workflow-card {
  border: 1px solid rgb(148 163 184 / 0.13);
  border-radius: 1.15rem;
  background: rgb(15 23 42 / 0.5);
  padding: 1.35rem;
}

.docs-simple-card h3,
.docs-workflow-card h3 {
  margin-top: 0.75rem;
  color: white;
  font-family: Sora, sans-serif;
  font-size: 1rem;
  font-weight: 600;
}

.docs-simple-card p,
.docs-workflow-card p {
  margin-top: 0.7rem;
  color: rgb(148 163 184);
  font-size: 0.8rem;
  line-height: 1.75;
}

.docs-workflow-label {
  border: 1px solid rgb(34 211 238 / 0.18);
  border-radius: 999px;
  background: rgb(34 211 238 / 0.07);
  padding: 0.35rem 0.65rem;
  color: rgb(103 232 249);
  font-family: "JetBrains Mono", monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.docs-search {
  display: flex;
  min-height: 3.3rem;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid rgb(148 163 184 / 0.18);
  border-radius: 1rem;
  background: rgb(15 23 42 / 0.65);
  padding: 0 1rem;
  color: rgb(100 116 139);
}

.docs-search:focus-within {
  border-color: rgb(129 140 248 / 0.55);
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.09);
}

.docs-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: white;
  font-size: 0.85rem;
}

.docs-search input::placeholder {
  color: rgb(71 85 105);
}

.docs-search button {
  display: grid;
  height: 2rem;
  width: 2rem;
  place-items: center;
  border-radius: 0.5rem;
  color: rgb(148 163 184);
}

.docs-search button:hover {
  background: rgb(255 255 255 / 0.05);
  color: white;
}

.docs-details {
  overflow: hidden;
  border: 1px solid rgb(148 163 184 / 0.13);
  border-radius: 1rem;
  background: rgb(15 23 42 / 0.44);
}

.docs-details summary {
  display: flex;
  min-height: 4rem;
  cursor: pointer;
  list-style: none;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 1.2rem;
  color: rgb(241 245 249);
  font-size: 0.86rem;
  font-weight: 700;
}

.docs-details summary::-webkit-details-marker {
  display: none;
}

.docs-details summary svg {
  flex: 0 0 auto;
  color: rgb(100 116 139);
}

.docs-details[open] summary {
  border-bottom: 1px solid rgb(51 65 85 / 0.75);
}

.docs-details[open] summary svg {
  transform: rotate(90deg);
}

.docs-details ul {
  display: grid;
  gap: 0.75rem;
  padding: 1.1rem 1.2rem 1.25rem;
}

.docs-details li {
  display: flex;
  gap: 0.65rem;
  color: rgb(148 163 184);
  font-size: 0.78rem;
  line-height: 1.65;
}

.docs-details li svg {
  margin-top: 0.25rem;
  flex: 0 0 auto;
  color: rgb(110 231 183);
}

@media (max-width: 639px) {
  .docs-platform-card {
    padding: 1.2rem;
  }

  .docs-section-heading {
    gap: 0.8rem;
  }

  .docs-section-icon {
    height: 2.5rem;
    width: 2.5rem;
  }
}
</style>
