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
  return words.map((word) => word[0]?.toUpperCase()).join('') || 'AB'
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
  <article class="rounded-lg border border-line bg-surface p-4 sm:p-5">
    <header class="flex items-center gap-3">
      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand-text" aria-hidden="true">
        {{ initials }}
      </span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-fg">{{ comment.authorName }}</p>
        <time :datetime="createdIso" :title="absoluteDate" class="block text-xs text-fg-subtle">
          {{ createdLabel }}
        </time>
      </div>
    </header>

    <p class="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg-muted">{{ comment.body }}</p>

    <footer class="mt-4 flex flex-wrap gap-2" aria-label="Comment reactions">
      <button
        v-for="reaction in reactionButtons"
        :key="reaction.key"
        type="button"
        class="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-150 disabled:cursor-wait disabled:opacity-60"
        :class="
          comment.reactions[reaction.key].active
            ? 'border-brand/40 bg-brand/10 text-brand-text'
            : 'border-line text-fg-muted hover:border-line-strong hover:text-fg'
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
        <span class="tabular-nums opacity-80">{{ comment.reactions[reaction.key].count }}</span>
      </button>
    </footer>
  </article>
</template>
