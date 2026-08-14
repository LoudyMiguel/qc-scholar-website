<script setup>
import { ArrowBigUp, Heart, ThumbsUp } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps({
  comment: {
    type: Object,
    required: true,
  },
  pending: {
    type: Function,
    required: true,
  },
})

defineEmits(['react'])

const initials = computed(() => {
  const words = String(props.comment.authorName || 'Anonymous builder')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
  return words.map((word) => word[0]?.toUpperCase()).join('') || 'QS'
})

const createdLabel = computed(() => {
  const timestamp = Number(props.comment.createdAt)
  if (!timestamp) return 'Just now'

  const elapsedSeconds = Math.round((timestamp - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  if (Math.abs(elapsedSeconds) < 60) return formatter.format(elapsedSeconds, 'second')
  const minutes = Math.round(elapsedSeconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour')
  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return formatter.format(days, 'day')
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(timestamp)
})

const absoluteDate = computed(() => {
  const timestamp = Number(props.comment.createdAt)
  return timestamp ? new Date(timestamp).toLocaleString() : ''
})

const createdIso = computed(() => {
  const timestamp = Number(props.comment.createdAt)
  return timestamp ? new Date(timestamp).toISOString() : ''
})

const reactionButtons = [
  { key: 'upvote', label: 'Upvote', icon: ArrowBigUp },
  { key: 'like', label: 'Helpful', icon: ThumbsUp },
  { key: 'heart', label: 'Heart', icon: Heart },
]
</script>

<template>
  <article class="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-slate-700 sm:p-5">
    <header class="flex items-center gap-3">
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-400/20 to-violet-400/20 text-xs font-bold text-indigo-200 ring-1 ring-inset ring-indigo-300/10">
        {{ initials }}
      </span>
      <div class="min-w-0">
        <p class="truncate text-sm font-bold text-slate-100">{{ comment.authorName }}</p>
        <time :datetime="createdIso" :title="absoluteDate" class="mt-1 block text-[11px] font-semibold text-slate-400">
          {{ createdLabel }}
        </time>
      </div>
      <span class="ml-auto rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        Community
      </span>
    </header>

    <p class="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-300">{{ comment.body }}</p>

    <footer class="mt-5 flex flex-wrap gap-2 border-t border-slate-800/80 pt-4" aria-label="Comment reactions">
      <button
        v-for="reaction in reactionButtons"
        :key="reaction.key"
        type="button"
        class="inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-[11px] font-bold transition disabled:cursor-wait disabled:opacity-60"
        :class="
          comment.reactions[reaction.key].active
            ? 'border-indigo-400/30 bg-indigo-400/10 text-indigo-200'
            : 'border-slate-800 bg-slate-900/60 text-slate-500 hover:border-slate-700 hover:text-slate-300'
        "
        :aria-pressed="comment.reactions[reaction.key].active"
        :aria-label="`${reaction.label}: ${comment.reactions[reaction.key].count}`"
        :disabled="pending(reaction.key)"
        @click="$emit('react', reaction.key)"
      >
        <component
          :is="reaction.icon"
          :size="14"
          :fill="reaction.key === 'heart' && comment.reactions[reaction.key].active ? 'currentColor' : 'none'"
          aria-hidden="true"
        />
        {{ reaction.label }}
        <span class="text-[10px] opacity-70">{{ comment.reactions[reaction.key].count }}</span>
      </button>
    </footer>
  </article>
</template>
