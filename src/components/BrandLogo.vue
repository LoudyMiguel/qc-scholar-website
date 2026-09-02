<script setup>
defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
  href: {
    type: String,
    default: '#top',
  },
})
</script>

<template>
  <a
    :href="href"
    class="group inline-flex min-h-11 items-center gap-3 rounded-xl"
    aria-label="GenXYZ Lab home"
  >
    <img
      src="/assets/logo.png"
      alt=""
      width="40"
      height="40"
      draggable="false"
      class="h-10 w-10 shrink-0 rounded-xl object-cover shadow-[0_12px_35px_rgba(79,70,229,.32)] ring-1 ring-white/10 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105"
    />
    <span v-if="!compact" class="leading-none">
      <span class="block font-display text-[15px] font-semibold text-white">
        GenXYZ Lab
      </span>
      <span class="mt-1.5 block text-[9px] font-bold uppercase tracking-[0.19em] text-slate-500">
        Learn · Create · Grow
      </span>
    </span>
  </a>
</template>
