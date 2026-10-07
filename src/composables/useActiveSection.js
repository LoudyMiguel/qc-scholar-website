import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * Reports which of the given sections currently crosses the middle of the
 * viewport. One IntersectionObserver replaces a scroll listener that measured
 * every section on every frame, so highlighting the current nav link costs
 * nothing while scrolling.
 */
export function useActiveSection(ids) {
  const active = ref('')
  let observer = null

  onMounted(() => {
    if (!('IntersectionObserver' in window)) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) active.value = entry.target.id
          else if (active.value === entry.target.id) active.value = ''
        })
      },
      { rootMargin: '-45% 0px -55% 0px' },
    )

    ids.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
  })

  onBeforeUnmount(() => observer?.disconnect())

  return active
}
