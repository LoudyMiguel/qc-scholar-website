import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { nextTick, onBeforeUnmount, onMounted } from 'vue'

gsap.registerPlugin(ScrollTrigger)

export function useScrollExperience() {
  let motionContext = null
  let lenis = null
  let ticker = null
  let modalObserver = null
  let fontsReady = true
  let cleanupLenis = null

  function setupLenis() {
    if (!window.matchMedia('(pointer: fine)').matches) return

    lenis = new Lenis({
      lerp: 0.065,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.86,
      touchMultiplier: 1,
      anchors: {
        offset: -96,
        duration: 1.15,
      },
      prevent: (node) => Boolean(node.closest?.('[role="dialog"]')),
    })

    const syncTrigger = () => ScrollTrigger.update()
    ticker = (seconds) => lenis?.raf(seconds * 1000)

    lenis.on('scroll', syncTrigger)
    gsap.ticker.add(ticker)
    gsap.ticker.lagSmoothing(0)

    modalObserver = new MutationObserver(() => {
      if (!lenis) return
      if (document.body.classList.contains('modal-open')) lenis.stop()
      else lenis.start()
    })
    modalObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      modalObserver?.disconnect()
      modalObserver = null
      lenis?.off('scroll', syncTrigger)
      if (ticker) gsap.ticker.remove(ticker)
      ticker = null
      lenis?.destroy()
      lenis = null
      gsap.ticker.lagSmoothing(500, 33)
    }
  }

  function setupRevealMotion() {
    gsap.utils.toArray('[data-reveal]').forEach((element) => {
      const direction = element.dataset.reveal
      const directional = direction === 'left' || direction === 'right'
      const startX = direction === 'left' ? -96 : direction === 'right' ? 96 : 0
      const startY = directional ? 18 : 82
      const cssDelay = Number.parseFloat(
        window.getComputedStyle(element).getPropertyValue('--reveal-delay'),
      )
      const delay = Number.isFinite(cssDelay) ? Math.min(cssDelay / 1000, 0.42) : 0

      gsap.fromTo(
        element,
        {
          autoAlpha: 0,
          x: startX,
          y: startY,
          scale: directional ? 0.94 : 0.9,
          rotationX: directional ? 0 : 4,
          transformOrigin: '50% 50%',
          willChange: 'transform, opacity',
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotationX: 0,
          delay,
          duration: 1.48,
          ease: 'power2.out',
          overwrite: 'auto',
          scrollTrigger: {
            trigger: element,
            start: 'top 86%',
            toggleActions: 'play none none reverse',
          },
          onComplete: () => gsap.set(element, { clearProps: 'willChange' }),
        },
      )
    })
  }

  function setupParallaxMotion() {
    const desktop = window.matchMedia('(min-width: 768px)').matches

    gsap.utils.toArray('[data-scroll-depth]').forEach((element, index) => {
      const requestedDepth = Number(element.dataset.scrollDepth || 10)
      const distance = desktop
        ? Math.max(54, Math.min(108, requestedDepth * 6.5))
        : Math.max(28, Math.min(52, requestedDepth * 3.6))
      const tilt = desktop ? (index % 2 === 0 ? -0.7 : 0.7) : 0

      gsap
        .timeline({
          scrollTrigger: {
            trigger: element,
            start: 'top 96%',
            end: 'bottom 4%',
            scrub: desktop ? 1.15 : 0.72,
            invalidateOnRefresh: true,
          },
        })
        .fromTo(
          element,
          {
            y: distance,
            scale: 0.92,
            rotationZ: tilt,
            transformOrigin: '50% 50%',
          },
          {
            y: 0,
            scale: 1.04,
            rotationZ: 0,
            duration: 0.52,
            ease: 'none',
          },
        )
        .to(element, {
          y: -distance,
          scale: 0.965,
          rotationZ: -tilt * 0.5,
          duration: 0.48,
          ease: 'none',
        })
    })
  }

  function setupHeroMotion() {
    const hero = document.querySelector('#top')
    // The WebGL stage is optional: it mounts lazily and never exists at all on
    // a device without WebGL, so the hero's own entrance and parallax must not
    // depend on finding it.
    const heroScene = hero?.querySelector('[data-hero-scene]')
    const heroCopy = hero?.querySelector('[data-hero-copy]')
    const heroGlow = hero?.querySelector('[data-hero-glow]')
    const heroElements = hero
      ? gsap.utils.toArray('[data-hero-element]', hero)
      : []

    if (!hero || !heroCopy) return

    gsap.fromTo(
      heroElements,
      {
        autoAlpha: 0,
        y: 58,
        scale: 0.9,
        transformOrigin: '0% 50%',
      },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 1.45,
        delay: 0.16,
        stagger: 0.13,
        ease: 'power2.out',
      },
    )

    const desktop = window.matchMedia('(min-width: 768px)').matches
    const heroTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: desktop ? 1.35 : 0.82,
        invalidateOnRefresh: true,
      },
    })

    heroTimeline.to(
      heroCopy,
      {
        y: desktop ? -118 : -52,
        scale: desktop ? 0.9 : 0.94,
        autoAlpha: desktop ? 0.16 : 0.38,
        transformOrigin: '0% 30%',
        ease: 'none',
      },
      0,
    )

    if (heroScene) {
      // Only y/scale are animated here. The scene element already carries a
      // translateX from its own stylesheet for the right-weighted composition,
      // and animating x from GSAP would overwrite it.
      heroTimeline.to(
        heroScene,
        {
          yPercent: desktop ? 14 : 7,
          scale: desktop ? 1.1 : 1.04,
          ease: 'none',
        },
        0,
      )
    }

    if (heroGlow) {
      heroTimeline.to(
        heroGlow,
        {
          scale: desktop ? 1.3 : 1.14,
          opacity: 0.34,
          xPercent: desktop ? 8 : 3,
          ease: 'none',
        },
        0,
      )
    }

  }

  /**
   * The console wall is decorative texture behind the capabilities section, and
   * scroll is what makes it feel alive rather than pasted on: the whole wall
   * drifts while individual panels counter-drift against it, so the grid
   * gently shears as the section passes. Alternating direction by row is what
   * produces the shear — moving every panel the same way would just look like
   * a second parallax layer.
   */
  function setupConsoleBackdrop() {
    const wall = document.querySelector('[data-terminal-grid]')
    if (!wall) return

    const section = wall.closest('section') || wall
    const cards = gsap.utils.toArray('[data-terminal-card]', wall)
    const desktop = window.matchMedia('(min-width: 768px)').matches

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: desktop ? 1.1 : 0.7,
        invalidateOnRefresh: true,
      },
    })

    timeline.fromTo(
      wall,
      { yPercent: desktop ? -5 : -2 },
      { yPercent: desktop ? 5 : 2, ease: 'none' },
      0,
    )

    cards.forEach((card, index) => {
      const row = Math.floor(index / 3)
      const direction = (index + row) % 2 === 0 ? -1 : 1
      const distance = desktop ? 22 + row * 6 : 8
      timeline.fromTo(
        card,
        { y: direction * distance },
        { y: direction * -distance, ease: 'none' },
        0,
      )
    })
  }

  /**
   * `.js-motion [data-reveal]` starts every section at `visibility: hidden`, so
   * GSAP is the only thing that can show it. That means a single runtime error
   * in ANY setup step used to blank the whole page below the hero — which is
   * exactly what happened when a stale element reference threw before the
   * reveal triggers were built.
   *
   * Two defences: each step is isolated so one failure cannot cascade, and the
   * initial-hide class is dropped once setup is over. Elements GSAP really is
   * animating already carry their own inline `visibility`, so lifting the class
   * changes nothing for them and un-hides anything that was missed.
   */
  function safely(label, fn) {
    try {
      fn()
    } catch (error) {
      console.error(`[motion] ${label} failed; content stays visible.`, error)
    }
  }

  onMounted(async () => {
    await nextTick()

    document.documentElement.classList.add('motion-running')
    cleanupLenis = setupLenis()

    motionContext = gsap.context(() => {
      safely('hero', setupHeroMotion)
      safely('reveal', setupRevealMotion)
      safely('parallax', setupParallaxMotion)
      safely('console', setupConsoleBackdrop)

      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: ({ progress }) => {
          document.documentElement.style.setProperty(
            '--page-progress',
            String(progress),
          )
        },
      })
    }, document.body)

    // Setup is done: nothing else needs the blanket hide. Anything GSAP is
    // genuinely driving keeps its own inline visibility from here on.
    document.documentElement.classList.remove('js-motion')

    fontsReady = true
    Promise.resolve(document.fonts?.ready).then(() => {
      if (fontsReady) ScrollTrigger.refresh()
    })
    window.requestAnimationFrame(() => ScrollTrigger.refresh())
  })

  onBeforeUnmount(() => {
    fontsReady = false
    cleanupLenis?.()
    cleanupLenis = null
    motionContext?.revert()
    document.documentElement.classList.remove('motion-running')
    document.documentElement.style.removeProperty('--page-progress')
  })
}
