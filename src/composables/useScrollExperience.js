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
    const terminalGrid = hero?.querySelector('[data-terminal-grid]')
    const terminalCards = hero
      ? gsap.utils.toArray('[data-terminal-card]', hero)
      : []
    const heroCopy = hero?.querySelector('[data-hero-copy]')
    const heroGlow = hero?.querySelector('[data-hero-glow]')
    const heroElements = hero
      ? gsap.utils.toArray('[data-hero-element]', hero)
      : []

    if (!hero || !terminalGrid || !heroCopy) return

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

    heroTimeline
      .fromTo(
        terminalGrid,
        {
          yPercent: desktop ? -6 : -2,
          scale: desktop ? 0.965 : 0.985,
          rotationZ: desktop ? -0.6 : 0,
        },
        {
          yPercent: desktop ? 23 : 11,
          scale: desktop ? 1.13 : 1.06,
          rotationZ: desktop ? 1.5 : 0.25,
          ease: 'none',
        },
        0,
      )
      .to(
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

    terminalCards.forEach((card, index) => {
      const row = Math.floor(index / 3)
      const direction = (index + row) % 2 === 0 ? -1 : 1
      heroTimeline.to(
        card,
        {
          y: direction * (desktop ? 92 + row * 22 : 34),
          x: direction * (desktop ? 18 : 7),
          scale: desktop ? (direction > 0 ? 1.06 : 0.94) : 1.025,
          ease: 'none',
        },
        0,
      )
    })
  }

  onMounted(async () => {
    await nextTick()

    document.documentElement.classList.add('motion-running')
    cleanupLenis = setupLenis()

    motionContext = gsap.context(() => {
      setupHeroMotion()
      setupRevealMotion()
      setupParallaxMotion()

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
