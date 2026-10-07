<script setup>
defineProps({
  href: {
    type: String,
    default: '#top',
  },
})
</script>

<template>
  <a
    :href="href"
    class="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg"
    aria-label="GenXYZ Lab home"
  >
    <img
      src="/assets/logo.png"
      alt=""
      width="32"
      height="32"
      draggable="false"
      class="h-8 w-8 rounded-lg"
    />
    <span class="text-[15px] font-semibold tracking-tight text-fg">GenXYZ Lab</span>
  </a>
</template>
