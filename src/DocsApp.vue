<script setup>
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Download,
  ExternalLink,
  Laptop,
  Menu,
  Monitor,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TriangleAlert,
  Wrench,
  X,
} from '@lucide/vue'
import { computed, ref } from 'vue'
import BrandLogo from './components/BrandLogo.vue'
import ThemeToggle from './components/ThemeToggle.vue'
import { useActiveSection } from './composables/useActiveSection'
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

const activeSection = useActiveSection(
  tableOfContents.map((item) => item.href.slice(1)),
)

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
    class="btn btn-primary fixed left-4 top-3 z-[100] -translate-y-20 focus:translate-y-0"
  >
    Skip to documentation
  </a>

  <div id="top" class="min-h-screen">
    <header class="sticky top-0 z-50 border-b border-line bg-canvas">
      <div class="site-container flex h-16 items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-3">
          <BrandLogo href="/" />
          <span class="hidden h-5 w-px bg-line-strong sm:block" aria-hidden="true" />
          <span class="hidden text-sm font-medium text-fg-muted sm:inline">Docs</span>
        </div>

        <nav class="hidden items-center gap-1 lg:flex" aria-label="Documentation navigation">
          <a href="#setup" class="rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors duration-150 hover:text-fg">Setup</a>
          <a href="#workflow" class="rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors duration-150 hover:text-fg">Workflow</a>
          <a href="#features" class="rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors duration-150 hover:text-fg">Features</a>
          <a href="#troubleshooting" class="rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors duration-150 hover:text-fg">Help</a>
        </nav>

        <div class="flex items-center gap-1.5">
          <ThemeToggle />
          <a href="/" class="btn btn-ghost hidden h-10 min-h-0 px-3 md:inline-flex">
            <ArrowLeft :size="16" aria-hidden="true" />
            Website
          </a>
          <a href="/#download" class="btn btn-primary hidden h-10 min-h-0 px-4 sm:inline-flex">
            <Download :size="16" aria-hidden="true" />
            Download
          </a>
          <button
            type="button"
            class="icon-button lg:hidden"
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
        class="border-t border-line bg-canvas lg:hidden"
        aria-label="Mobile documentation navigation"
      >
        <div class="site-container py-2">
          <a
            v-for="item in tableOfContents"
            :key="item.href"
            :href="item.href"
            class="flex min-h-12 items-center border-b border-line text-base font-medium text-fg"
            @click="closeMobileNav"
          >
            {{ item.label }}
          </a>
          <div class="grid grid-cols-2 gap-2 py-3">
            <a href="/" class="btn btn-secondary" @click="closeMobileNav">Website</a>
            <a href="/#download" class="btn btn-primary" @click="closeMobileNav">Download</a>
          </div>
        </div>
      </nav>
    </header>

    <main id="docs-content" tabindex="-1" class="focus:outline-none">
      <section id="start" class="docs-hero border-b border-line">
        <div class="site-container py-14 sm:py-20">
          <div class="max-w-3xl">
            <p class="eyebrow">GenXYZ Lab {{ siteConfig.version }} documentation</p>
            <h1 class="mt-3 text-4xl font-bold tracking-tight text-fg sm:text-5xl">
              Set up GenXYZ Lab and get the most out of it
            </h1>
            <p class="section-lead mt-5">
              Installation on Android and Windows, the best first-use workflow, every major
              feature in the current release, updates, backups, and common fixes.
            </p>
            <div class="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#setup" class="btn btn-primary btn-lg">
                Start setup
                <ArrowRight :size="17" aria-hidden="true" />
              </a>
              <a href="#features" class="btn btn-secondary btn-lg">
                Browse {{ featureCount }} capabilities
              </a>
            </div>
          </div>

          <dl class="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
            <div class="card px-4 py-3">
              <dt class="text-xs font-medium text-fg-subtle">Current release</dt>
              <dd class="mt-1 text-sm font-semibold text-fg">Version {{ siteConfig.version }}</dd>
            </div>
            <div class="card px-4 py-3">
              <dt class="text-xs font-medium text-fg-subtle">Platforms</dt>
              <dd class="mt-1 text-sm font-semibold text-fg">Android and Windows</dd>
            </div>
            <div class="card px-4 py-3">
              <dt class="text-xs font-medium text-fg-subtle">Account required</dt>
              <dd class="mt-1 text-sm font-semibold text-fg">None — no subscription</dd>
            </div>
          </dl>
        </div>
      </section>

      <div class="site-container grid gap-12 py-12 sm:py-16 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        <aside class="hidden lg:block">
          <nav class="sticky top-24" aria-label="On this page">
            <p class="text-xs font-semibold uppercase tracking-wide text-fg-subtle">On this page</p>
            <ul class="mt-3 border-l border-line">
              <li v-for="item in tableOfContents" :key="item.href">
                <a
                  :href="item.href"
                  class="-ml-px flex min-h-9 items-center border-l-2 pl-4 text-sm transition-colors duration-150"
                  :class="activeSection === item.href.slice(1)
                    ? 'border-brand font-medium text-fg'
                    : 'border-transparent text-fg-muted hover:border-line-strong hover:text-fg'"
                  :aria-current="activeSection === item.href.slice(1) ? 'location' : undefined"
                >
                  {{ item.label }}
                </a>
              </li>
            </ul>
            <div class="mt-8 rounded-lg border border-line bg-subtle p-4">
              <ShieldCheck :size="18" class="text-brand-text" aria-hidden="true" />
              <p class="mt-2 text-sm font-semibold text-fg">Official documentation</p>
              <p class="mt-1 text-xs leading-relaxed text-fg-muted">
                Written against the current GenXYZ Lab feature and tool registries.
              </p>
            </div>
          </nav>
        </aside>

        <div class="min-w-0 space-y-20">
          <section id="setup" aria-labelledby="setup-heading">
            <div class="docs-heading">
              <span class="icon-tile"><Wrench :size="20" aria-hidden="true" /></span>
              <div>
                <p class="eyebrow">Installation</p>
                <h2 id="setup-heading">Proper setup for each platform</h2>
              </div>
            </div>
            <p class="docs-intro">
              Courses and bundled content work without a compiler. Local code execution, terminals,
              framework servers, Flutter builds, and Arduino tools need the matching platform toolchain.
            </p>

            <div class="mt-8 grid gap-4 xl:grid-cols-2">
              <article v-for="platform in quickStart" :key="platform.platform" class="card p-5 sm:p-6">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <span class="icon-tile">
                      <Smartphone v-if="platform.platform === 'Android'" :size="20" aria-hidden="true" />
                      <Monitor v-else :size="20" aria-hidden="true" />
                    </span>
                    <h3 class="text-xl font-semibold text-fg">{{ platform.platform }}</h3>
                  </div>
                  <span class="badge">{{ platform.requirement }}</span>
                </div>
                <p class="mt-4 text-sm leading-relaxed text-fg-muted">{{ platform.summary }}</p>
                <ol class="mt-6 space-y-4">
                  <li v-for="(step, index) in platform.steps" :key="step" class="flex gap-3 text-sm leading-relaxed text-fg-muted">
                    <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-semibold text-fg">{{ index + 1 }}</span>
                    <span>{{ step }}</span>
                  </li>
                </ol>
                <a
                  v-if="platform.platform === 'Android'"
                  :href="siteConfig.termuxUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-link mt-5 inline-flex min-h-10 items-center gap-1.5 text-sm"
                >
                  Open the verified Termux source
                  <ExternalLink :size="14" aria-hidden="true" />
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              </article>
            </div>

            <div class="mt-4 flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
              <TriangleAlert :size="19" class="mt-0.5 shrink-0 text-warning-text" aria-hidden="true" />
              <div>
                <p class="font-semibold text-fg">Android install order matters for local tools.</p>
                <p class="mt-1 leading-relaxed text-fg-muted">Install and open Termux before configuring GenXYZ Lab’s compiler bridge. Use the current F-Droid build; the old Play Store release is obsolete.</p>
              </div>
            </div>
          </section>

          <section id="navigation" aria-labelledby="navigation-heading">
            <div class="docs-heading">
              <span class="icon-tile"><Laptop :size="20" aria-hidden="true" /></span>
              <div>
                <p class="eyebrow">First use</p>
                <h2 id="navigation-heading">Know the four main destinations</h2>
              </div>
            </div>
            <p class="docs-intro">
              Phones use bottom navigation. Wider Windows layouts use a side rail or labelled sidebar,
              but the same four destinations and data are available.
            </p>
            <div class="mt-8 grid gap-4 sm:grid-cols-2">
              <article v-for="(item, index) in mainNavigation" :key="item.name" class="card p-5">
                <span class="text-sm font-semibold text-brand-text">0{{ index + 1 }}</span>
                <h3 class="mt-2 text-base font-semibold text-fg">{{ item.name }}</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-fg-muted">{{ item.detail }}</p>
              </article>
            </div>
          </section>

          <section id="workflow" aria-labelledby="workflow-heading">
            <div class="docs-heading">
              <span class="icon-tile"><Code2 :size="20" aria-hidden="true" /></span>
              <div>
                <p class="eyebrow">Recommended workflow</p>
                <h2 id="workflow-heading">Learn → Practice → Build</h2>
              </div>
            </div>
            <p class="docs-intro">
              The app is most useful when a course concept becomes runnable code and then a project you can keep.
            </p>
            <ol class="mt-8 grid gap-4 xl:grid-cols-3">
              <li v-for="(step, index) in recommendedWorkflow" :key="step.label" class="card p-5">
                <div class="flex items-center gap-3">
                  <span class="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{{ index + 1 }}</span>
                  <span class="text-sm font-semibold text-brand-text">{{ step.label }}</span>
                </div>
                <h3 class="mt-4 text-base font-semibold text-fg">{{ step.title }}</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-fg-muted">{{ step.detail }}</p>
              </li>
            </ol>
          </section>

          <section id="features" aria-labelledby="features-heading">
            <div class="docs-heading">
              <span class="icon-tile"><Sparkles :size="20" aria-hidden="true" /></span>
              <div>
                <p class="eyebrow">Complete reference</p>
                <h2 id="features-heading">All current feature groups</h2>
              </div>
            </div>
            <p class="docs-intro">
              Templates and course titles are content inside these systems. This reference lists the capabilities,
              catalogs, tools, and workflows available in version {{ siteConfig.version }}.
            </p>

            <div class="sticky top-[4.5rem] z-10 -mx-1 mt-8 bg-canvas px-1 py-2">
              <label class="relative block">
                <span class="sr-only">Search documented features</span>
                <Search :size="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden="true" />
                <input
                  v-model="searchQuery"
                  type="search"
                  class="field-control min-h-12 pl-11 pr-11 text-base sm:text-sm"
                  placeholder="Search features, languages, frameworks, games, or tools…"
                />
                <button
                  v-if="searchQuery"
                  type="button"
                  class="icon-button absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2"
                  aria-label="Clear feature search"
                  @click="searchQuery = ''"
                >
                  <X :size="16" aria-hidden="true" />
                </button>
              </label>
            </div>

            <div v-if="filteredFeatureGroups.length" class="mt-6 space-y-6">
              <article
                v-for="group in filteredFeatureGroups"
                :id="group.id"
                :key="group.id"
                class="card overflow-hidden"
              >
                <div class="border-b border-line bg-subtle px-5 py-4 sm:px-6">
                  <h3 class="text-lg font-semibold text-fg">{{ group.title }}</h3>
                  <p class="mt-1 text-sm text-fg-muted">{{ group.summary }}</p>
                </div>
                <dl class="divide-y divide-line px-5 sm:px-6">
                  <div v-for="feature in group.features" :key="feature.name" class="grid gap-1.5 py-4 md:grid-cols-[200px_1fr] md:gap-6">
                    <dt class="flex items-start gap-2 text-sm font-semibold text-fg">
                      <Check :size="15" class="mt-0.5 shrink-0 text-success-text" aria-hidden="true" />
                      {{ feature.name }}
                    </dt>
                    <dd class="text-sm leading-relaxed text-fg-muted">{{ feature.detail }}</dd>
                  </div>
                </dl>
              </article>
            </div>
            <div v-else class="mt-6 rounded-xl border border-dashed border-line-strong p-8 text-center">
              <CircleHelp :size="26" class="mx-auto text-fg-subtle" aria-hidden="true" />
              <h3 class="mt-3 text-base font-semibold text-fg">No matching feature</h3>
              <p class="mt-1 text-sm text-fg-muted">Try a broader term such as “course,” “Python,” “database,” or “game.”</p>
            </div>
          </section>

          <section id="updates" aria-labelledby="updates-heading">
            <div class="docs-heading">
              <span class="icon-tile"><ShieldCheck :size="20" aria-hidden="true" /></span>
              <div>
                <p class="eyebrow">Keep your work safe</p>
                <h2 id="updates-heading">Updates and backups</h2>
              </div>
            </div>
            <div class="mt-8 grid gap-4 xl:grid-cols-2">
              <article class="card p-5">
                <h3 class="text-base font-semibold text-fg">Before a major update</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-fg-muted">Open Settings → Backup &amp; Restore → Create Backup. Choose the modules you need, optionally add a password, and save the resulting .qcs file somewhere you control.</p>
              </article>
              <article class="card p-5">
                <h3 class="text-base font-semibold text-fg">When a newer version is available</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-fg-muted">The app checks official release metadata after launch and shows an update banner. Android opens the official APK download; Windows opens the official ZIP download.</p>
              </article>
              <article class="card p-5">
                <h3 class="text-base font-semibold text-fg">Updating Android</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-fg-muted">Download the new APK and install it over the existing official build. Do not uninstall first unless Android requires it—and create a backup before removing an old or differently signed build.</p>
              </article>
              <article class="card p-5">
                <h3 class="text-base font-semibold text-fg">Updating Windows</h3>
                <p class="mt-1.5 text-sm leading-relaxed text-fg-muted">Close the app, download the new ZIP, and extract it to a complete folder. Keep a backup before replacing an older folder, especially if you deliberately stored project files beside the app.</p>
              </article>
            </div>
          </section>

          <section id="troubleshooting" aria-labelledby="troubleshooting-heading">
            <div class="docs-heading">
              <span class="icon-tile"><CircleHelp :size="20" aria-hidden="true" /></span>
              <div>
                <p class="eyebrow">Common fixes</p>
                <h2 id="troubleshooting-heading">Troubleshooting</h2>
              </div>
            </div>
            <div class="mt-8 divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              <details v-for="item in troubleshooting" :key="item.problem" class="docs-details group">
                <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 text-sm font-semibold text-fg hover:bg-subtle">
                  <span>{{ item.problem }}</span>
                  <ChevronDown :size="18" class="shrink-0 text-fg-subtle transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <ul class="space-y-2.5 px-5 pb-5 pt-1">
                  <li v-for="fix in item.fixes" :key="fix" class="flex gap-2.5 text-sm leading-relaxed text-fg-muted">
                    <Check :size="15" class="mt-1 shrink-0 text-success-text" aria-hidden="true" />
                    <span>{{ fix }}</span>
                  </li>
                </ul>
              </details>
            </div>
          </section>

          <section class="card p-6 sm:p-8">
            <h2 class="text-2xl font-semibold tracking-tight text-fg">Get the official Android or Windows release</h2>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
              The website always points to the current release manifest and shows both platform downloads in one place.
            </p>
            <div class="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href="/#download" class="btn btn-primary">
                <Download :size="17" aria-hidden="true" />
                Open downloads
              </a>
              <a href="/" class="btn btn-secondary">Return to the website</a>
            </div>
          </section>
        </div>
      </div>
    </main>

    <footer class="border-t border-line">
      <div class="site-container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <BrandLogo href="/" />
        <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted">
          <a href="/" class="hover:text-fg">Website</a>
          <a href="/#download" class="hover:text-fg">Download</a>
          <a href="/privacy" class="hover:text-fg">Privacy</a>
          <a :href="siteConfig.termuxDocsUrl" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 hover:text-fg">
            Termux notes <ExternalLink :size="12" aria-hidden="true" />
            <span class="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.docs-hero {
  background-image: radial-gradient(
    50rem 24rem at 90% -20%,
    rgb(var(--brand) / 0.08),
    transparent 70%
  );
}

.docs-heading {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}

.docs-heading h2 {
  margin-top: 0.25rem;
  color: rgb(var(--fg));
  font-size: clamp(1.5rem, 3vw, 1.875rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.25;
}

.docs-intro {
  max-width: 48rem;
  margin-top: 1rem;
  color: rgb(var(--fg-muted));
  font-size: 0.9375rem;
  line-height: 1.75;
}

.docs-details summary::-webkit-details-marker {
  display: none;
}
</style>
