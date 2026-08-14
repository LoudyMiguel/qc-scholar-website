/**
 * "Lab core" — the procedural hero scene.
 *
 * The shape is not decoration for its own sake: a faceted core (the workspace)
 * sits inside three tilted orbits carrying toolchain nodes, each tethered back
 * to the centre by a line that brightens as the node passes the front of its
 * orbit. That reads as "many tools, one workspace", which is the product claim
 * the hero copy makes in words.
 *
 * Everything is built from core Three.js primitives with unlit materials. No
 * loaders, no post-processing, no lights: the whole scene tree-shakes down to a
 * small slice of the library and costs no shadow or lighting passes, which is
 * what makes it affordable on the mid-range Android hardware this product
 * targets.
 */

const BRAND = {
  indigo: 0x6366f1,
  violet: 0x8b5cf6,
  cyan: 0x22d3ee,
  pale: 0xc7d2fe,
}

const NODE_COUNT = 14
const PARTICLE_COUNT = 620

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   reducedMotion?: boolean,
 *   allowPointer?: boolean,
 *   interactionTarget?: HTMLElement | null,
 * }} options
 * @returns {Promise<{ destroy: () => void } | null>} null when WebGL is unavailable.
 */
export async function createLabScene(canvas, options = {}) {
  const {
    reducedMotion = false,
    allowPointer = true,
    interactionTarget = null,
  } = options
  const THREE = await import('three')

  const host = canvas.parentElement
  if (!host) return null

  let renderer
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: window.devicePixelRatio < 1.5,
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: true,
    })
  } catch {
    // Software rasterisers and blocked contexts both land here. The hero has a
    // CSS-only fallback, so returning null is a complete answer.
    return null
  }

  // Above ~1.75 the extra pixels are invisible on a scene made of thin lines but
  // the fill cost keeps rising, which is exactly the wrong trade on a phone.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(0, 0.35, 9.2)

  const root = new THREE.Group()
  scene.add(root)

  // Track every disposable so teardown never depends on walking the scene graph
  // in the right order.
  const disposables = []
  function track(resource) {
    disposables.push(resource)
    return resource
  }

  // ── Core ──────────────────────────────────────────────────────────────────
  const coreGeometry = track(new THREE.IcosahedronGeometry(1.75, 1))
  const coreEdges = track(new THREE.EdgesGeometry(coreGeometry))
  const coreMaterial = track(
    new THREE.LineBasicMaterial({
      color: BRAND.indigo,
      transparent: true,
      opacity: 0.55,
    }),
  )
  const core = new THREE.LineSegments(coreEdges, coreMaterial)
  root.add(core)

  const shellGeometry = track(new THREE.IcosahedronGeometry(1.72, 1))
  const shellMaterial = track(
    new THREE.MeshBasicMaterial({
      color: 0x0b1120,
      transparent: true,
      opacity: 0.82,
      // Without this the wireframe behind the core shows through and the shape
      // stops reading as a solid object.
      depthWrite: true,
    }),
  )
  const shell = new THREE.Mesh(shellGeometry, shellMaterial)
  root.add(shell)

  const innerGeometry = track(new THREE.IcosahedronGeometry(0.92, 0))
  const innerEdges = track(new THREE.EdgesGeometry(innerGeometry))
  const innerMaterial = track(
    new THREE.LineBasicMaterial({
      color: BRAND.cyan,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
    }),
  )
  const innerCore = new THREE.LineSegments(innerEdges, innerMaterial)
  root.add(innerCore)

  // ── Orbits ────────────────────────────────────────────────────────────────
  const orbitSpecs = [
    { radius: 3.1, tilt: 0.42, spin: 0.16, color: BRAND.indigo },
    { radius: 3.9, tilt: -0.62, spin: -0.11, color: BRAND.violet },
    { radius: 4.7, tilt: 1.15, spin: 0.08, color: BRAND.cyan },
  ]

  const orbits = orbitSpecs.map((spec) => {
    const geometry = track(new THREE.TorusGeometry(spec.radius, 0.006, 3, 128))
    const material = track(
      new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: 0.28,
      }),
    )
    const ring = new THREE.Mesh(geometry, material)
    ring.rotation.x = Math.PI / 2 + spec.tilt
    ring.rotation.y = spec.tilt * 0.5
    root.add(ring)
    return { ring, spec }
  })

  // ── Toolchain nodes ───────────────────────────────────────────────────────
  const nodeGeometry = track(new THREE.OctahedronGeometry(0.1, 0))
  const nodeMaterial = track(
    new THREE.MeshBasicMaterial({
      color: BRAND.pale,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  const nodes = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, NODE_COUNT)
  nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  root.add(nodes)

  const nodeState = Array.from({ length: NODE_COUNT }, (_, index) => {
    const orbit = orbitSpecs[index % orbitSpecs.length]
    return {
      orbit,
      phase: (index / NODE_COUNT) * Math.PI * 2 + index * 0.7,
      speed: 0.22 + (index % 5) * 0.045,
      scale: 0.75 + ((index * 37) % 10) / 14,
    }
  })

  // ── Tethers ───────────────────────────────────────────────────────────────
  // One LineSegments whose vertex buffer is rewritten each frame. Rebuilding the
  // buffer beats creating 14 Line objects: it is a single draw call either way,
  // but this version allocates nothing per frame.
  const tetherPositions = new Float32Array(NODE_COUNT * 6)
  const tetherGeometry = track(new THREE.BufferGeometry())
  tetherGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(tetherPositions, 3),
  )
  const tetherMaterial = track(
    new THREE.LineBasicMaterial({
      color: BRAND.violet,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  root.add(new THREE.LineSegments(tetherGeometry, tetherMaterial))

  // ── Ambient particle shell ────────────────────────────────────────────────
  const particlePositions = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    // Even distribution on a sphere; a naive random per-axis clusters at the poles.
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const radius = 5.4 + Math.random() * 4.6
    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6
    particlePositions[i * 3 + 2] = radius * Math.cos(phi)
  }
  const particleGeometry = track(new THREE.BufferGeometry())
  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(particlePositions, 3),
  )
  const particleMaterial = track(
    new THREE.PointsMaterial({
      color: BRAND.pale,
      size: 0.028,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  )
  const particles = new THREE.Points(particleGeometry, particleMaterial)
  root.add(particles)

  // ── Scan pulse ────────────────────────────────────────────────────────────
  const pulseGeometry = track(new THREE.RingGeometry(1, 1.015, 96))
  const pulseMaterial = track(
    new THREE.MeshBasicMaterial({
      color: BRAND.cyan,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  )
  const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial)
  pulse.rotation.x = Math.PI / 2.35
  root.add(pulse)

  // ── Frame loop ────────────────────────────────────────────────────────────
  const matrix = new THREE.Matrix4()
  const position = new THREE.Vector3()
  const quaternion = new THREE.Quaternion()
  const scaleVector = new THREE.Vector3()
  const axisX = new THREE.Vector3(1, 0, 0)

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
  let frame = 0
  let running = false
  let lastTime = 0
  let elapsed = 0

  // Hover engagement, eased rather than switched. `energy` drives every
  // interactive response at once (tracking strength, orbit speed, glow, camera
  // dolly) so entering and leaving reads as one continuous reaction instead of
  // four unrelated properties popping.
  let energy = 0
  let energyTarget = 0
  // Own accumulator so a click can restart the sweep mid-cycle.
  let pulseTime = 0
  let baseCameraZ = 9.2

  function resize() {
    const width = host.clientWidth || 1
    const height = host.clientHeight || 1
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // Pull the camera back on narrow viewports so the orbits stay inside frame
    // instead of being cropped into unreadable arcs.
    baseCameraZ = width < 720 ? 12.4 : 9.2
    camera.position.z = baseCameraZ - energy * 0.65
    camera.updateProjectionMatrix()
  }

  function updateScene(delta) {
    // Ease toward the hover target. The rise is quicker than the fall so the
    // scene feels eager on enter and settles calmly on leave.
    const ease = energyTarget > energy ? 3.2 : 1.8
    energy += (energyTarget - energy) * Math.min(1, delta * ease)

    const spin = 1 + energy * 1.5
    elapsed += delta * (1 + energy * 0.35)

    core.rotation.y += delta * 0.075 * spin
    core.rotation.x = Math.sin(elapsed * 0.16) * 0.09
    shell.rotation.copy(core.rotation)
    innerCore.rotation.y -= delta * 0.22 * spin
    innerCore.rotation.z += delta * 0.1 * spin

    const breathe = 1 + Math.sin(elapsed * 0.9) * 0.035 + energy * 0.06
    innerCore.scale.setScalar(breathe)
    innerMaterial.opacity = 0.52 + Math.sin(elapsed * 0.9) * 0.2 + energy * 0.24
    coreMaterial.opacity = 0.55 + energy * 0.3
    tetherMaterial.opacity = 0.16 + energy * 0.34
    particleMaterial.opacity = 0.5 + energy * 0.22

    camera.position.z = baseCameraZ - energy * 0.65

    orbits.forEach(({ ring, spec }) => {
      ring.rotation.z += delta * spec.spin * spin
      ring.material.opacity = 0.28 + energy * 0.22
    })

    for (let i = 0; i < NODE_COUNT; i += 1) {
      const state = nodeState[i]
      const angle = state.phase + elapsed * state.speed
      const { radius, tilt } = state.orbit

      position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
      position.applyAxisAngle(axisX, tilt)

      quaternion.setFromAxisAngle(axisX, angle * 1.6)
      scaleVector.setScalar(state.scale)
      matrix.compose(position, quaternion, scaleVector)
      nodes.setMatrixAt(i, matrix)

      tetherPositions[i * 6] = 0
      tetherPositions[i * 6 + 1] = 0
      tetherPositions[i * 6 + 2] = 0
      tetherPositions[i * 6 + 3] = position.x
      tetherPositions[i * 6 + 4] = position.y
      tetherPositions[i * 6 + 5] = position.z
    }
    nodes.instanceMatrix.needsUpdate = true
    tetherGeometry.attributes.position.needsUpdate = true

    particles.rotation.y += delta * 0.014
    particles.rotation.x = Math.sin(elapsed * 0.08) * 0.05

    // Every ~6.5s a ring sweeps outward from the core and fades. A periodic
    // event gives the scene a sense of "something is running" that continuous
    // rotation alone never conveys. A click restarts this clock, which is what
    // makes a tap feel like it did something.
    pulseTime = (pulseTime + delta) % 6.5
    const pulseCycle = pulseTime / 6.5
    pulse.scale.setScalar(1.8 + pulseCycle * 5.2)
    pulseMaterial.opacity = Math.max(0, (0.34 + energy * 0.2) * (1 - pulseCycle) ** 1.6)

    // Tracking gets noticeably stronger while engaged, and the easing speeds up
    // too — a hovering cursor should feel followed, not merely acknowledged.
    const follow = 0.045 + energy * 0.055
    pointer.x += (pointer.targetX - pointer.x) * follow
    pointer.y += (pointer.targetY - pointer.y) * follow
    root.rotation.y = pointer.x * (0.26 + energy * 0.34)
    root.rotation.x = pointer.y * (0.18 + energy * 0.24)
  }

  function renderFrame(time) {
    if (!running) return
    frame = window.requestAnimationFrame(renderFrame)

    // Clamp the step so a backgrounded tab does not resume with one enormous
    // delta that teleports every node to a new position.
    const delta = Math.min((time - lastTime) / 1000, 0.05)
    lastTime = time
    updateScene(delta)
    renderer.render(scene, camera)
  }

  function start() {
    if (running || reducedMotion) return
    running = true
    lastTime = performance.now()
    frame = window.requestAnimationFrame(renderFrame)
  }

  function pause() {
    running = false
    window.cancelAnimationFrame(frame)
  }

  // Measured against the interaction element when there is one, so the centre
  // of the hero is the neutral pose. Using the whole window instead means the
  // scene sits permanently off-centre whenever the hero is not full height.
  function handlePointerMove(event) {
    const box = interactionTarget?.getBoundingClientRect()
    if (box && box.width > 0 && box.height > 0) {
      pointer.targetX = ((event.clientX - box.left) / box.width) * 2 - 1
      pointer.targetY = ((event.clientY - box.top) / box.height) * 2 - 1
      return
    }
    pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1
    pointer.targetY = (event.clientY / window.innerHeight) * 2 - 1
  }

  function handlePointerEnter() {
    energyTarget = 1
  }

  function handlePointerLeave() {
    energyTarget = 0
    // Drift back to the neutral pose rather than freezing wherever the cursor
    // happened to exit.
    pointer.targetX = 0
    pointer.targetY = 0
  }

  function handlePointerDown() {
    pulseTime = 0
  }

  let observedVisible = true

  function handleVisibility() {
    if (document.hidden) pause()
    else if (observedVisible) start()
  }

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      observedVisible = entry.isIntersecting
      if (observedVisible && !document.hidden) start()
      else pause()
    },
    { rootMargin: '120px 0px' },
  )
  intersectionObserver.observe(host)

  const resizeObserver = new ResizeObserver(() => {
    resize()
    if (reducedMotion) renderer.render(scene, camera)
  })
  resizeObserver.observe(host)

  resize()

  if (reducedMotion) {
    // Draw a single composed frame. The scene still looks deliberate and
    // finished; it simply never moves. Seed the clock first so the pose is a
    // settled mid-orbit moment rather than the raw t=0 arrangement, where every
    // node sits on its starting phase in a suspiciously even ring.
    elapsed = 2.4
    updateScene(0)
    renderer.render(scene, camera)
  } else {
    document.addEventListener('visibilitychange', handleVisibility)
    if (allowPointer) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true })

      const zone = interactionTarget
      if (zone) {
        zone.addEventListener('pointerenter', handlePointerEnter)
        zone.addEventListener('pointerleave', handlePointerLeave)
        zone.addEventListener('pointerdown', handlePointerDown, { passive: true })
      } else {
        // No zone to hover: keep the scene mildly engaged so the pointer
        // tracking still reads as intentional rather than dead.
        energyTarget = 0.35
      }
    }
    start()
  }

  return {
    destroy() {
      pause()
      intersectionObserver.disconnect()
      resizeObserver.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pointermove', handlePointerMove)
      interactionTarget?.removeEventListener('pointerenter', handlePointerEnter)
      interactionTarget?.removeEventListener('pointerleave', handlePointerLeave)
      interactionTarget?.removeEventListener('pointerdown', handlePointerDown)

      disposables.forEach((resource) => resource.dispose?.())
      nodes.dispose()
      renderer.dispose()
      // Without an explicit context loss the browser can keep the GPU context
      // alive well past teardown, and there is a hard per-page context limit.
      renderer.forceContextLoss?.()
    },
  }
}
