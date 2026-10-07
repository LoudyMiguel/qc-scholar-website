<script setup>
import { computed } from 'vue'

const props = defineProps({
  downloadCount: {
    type: Number,
    default: 0,
  },
  countReady: {
    type: Boolean,
    default: false,
  },
})

const stats = computed(() => [
  { value: '70', label: 'Offline courses' },
  { value: '129', label: 'Working templates' },
  { value: '30+', label: 'Tools and studios' },
  props.countReady && props.downloadCount > 0
    ? { value: props.downloadCount.toLocaleString(), label: 'Downloads so far' }
    : { value: '10', label: 'Programming languages' },
])
</script>

<template>
  <section aria-label="GenXYZ Lab at a glance" class="border-b border-line bg-subtle">
    <dl class="site-container grid grid-cols-2 gap-y-8 py-10 sm:py-12 lg:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="px-2 text-center lg:border-l lg:border-line lg:first:border-l-0"
      >
        <dt class="text-sm text-fg-muted">{{ stat.label }}</dt>
        <dd class="text-3xl font-bold tracking-tight text-fg sm:text-4xl">{{ stat.value }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
/* Show the number above its label while keeping <dt> first in the markup. */
dl > div {
  display: flex;
  flex-direction: column-reverse;
  gap: 0.25rem;
}
</style>
