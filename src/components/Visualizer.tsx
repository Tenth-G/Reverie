import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { usePlayerStore } from '../store/playerStore'

const MODES = ['disc', 'spectrum', 'particles', 'wave'] as const
const MODE_LABEL: Record<string, string> = {
  disc: '封面',
  spectrum: '频谱',
  particles: '粒子',
  wave: '波形',
}

const BG = 0x0a0a12

function makeFallbackTexture(): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 256, 256)
  g.addColorStop(0, '#ec4141')
  g.addColorStop(0.5, '#7c3aed')
  g.addColorStop(1, '#0ea5e9')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.beginPath()
  ctx.arc(128, 128, 34, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1a1a2a'
  ctx.font = 'bold 40px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('♪', 128, 130)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  shape.moveTo(x, y + r)
  shape.lineTo(x, y + h - r)
  shape.quadraticCurveTo(x, y + h, x + r, y + h)
  shape.lineTo(x + w - r, y + h)
  shape.quadraticCurveTo(x + w, y + h, x + w, y + h - r)
  shape.lineTo(x + w, y + r)
  shape.quadraticCurveTo(x + w, y, x + w - r, y)
  shape.lineTo(x + r, y)
  shape.quadraticCurveTo(x, y, x, y + r)
  return shape
}

export default function Visualizer() {
  const containerRef = useRef<HTMLDivElement>(null)
  const visualizerMode = usePlayerStore((s) => s.visualizerMode)
  const setVisualizerMode = usePlayerStore((s) => s.setVisualizerMode)
  const modeRef = useRef(visualizerMode)
  modeRef.current = visualizerMode

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let raf = 0
    let disposed = false

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(BG, 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(BG, 0.028)

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    )
    camera.position.set(0, 0, 7.6)
    camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.7))
    const dir = new THREE.DirectionalLight(0xffffff, 2)
    dir.position.set(3, 4, 5)
    scene.add(dir)
    const rim = new THREE.PointLight(0xec4141, 70, 30)
    rim.position.set(-4, -1, -3)
    scene.add(rim)
    const rim2 = new THREE.PointLight(0x22d3ee, 70, 30)
    rim2.position.set(4, -1, 3)
    scene.add(rim2)

    const world = new THREE.Group()
    scene.add(world)

    /* ---------------- album cover (faces the screen) ---------------- */
    const coverGroup = new THREE.Group()

    // glow backplate
    const backMat = new THREE.MeshBasicMaterial({
      color: 0xec4141,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const back = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(3.9, 3.9, 0.34)), backMat)
    back.position.z = -0.06
    coverGroup.add(back)

    // the album cover itself, facing +Z (straight at the screen)
    const coverTex = makeFallbackTexture()
    const coverMat = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.35, metalness: 0.1 })
    const cover = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(3.4, 3.4, 0.28)), coverMat)
    cover.position.z = 0.02
    coverGroup.add(cover)

    // thin emissive frame
    const frameMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
    const frame = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(3.5, 3.5, 0.3)), frameMat)
    frame.position.z = 0.03
    coverGroup.add(frame)

    world.add(coverGroup)

    /* ---------------- spectrum ring (accent around cover) ---------------- */
    const spectrum = new THREE.Group()
    const BAR_COUNT = 72
    const bars: THREE.Mesh[] = []
    const barGeo = new THREE.BoxGeometry(0.06, 0.3, 0.06)
    const barMats: THREE.MeshBasicMaterial[] = []
    for (let i = 0; i < BAR_COUNT; i++) {
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color() })
      const mesh = new THREE.Mesh(barGeo, m)
      const a = (i / BAR_COUNT) * Math.PI * 2
      const r = 3.0
      mesh.position.set(Math.cos(a) * r, Math.sin(a) * r, 0)
      bars.push(mesh)
      barMats.push(m)
      spectrum.add(mesh)
    }
    world.add(spectrum)

    /* ---------------- particle halo ---------------- */
    const PARTICLE_COUNT = 1400
    const pGeo = new THREE.BufferGeometry()
    const pPos = new Float32Array(PARTICLE_COUNT * 3)
    const pBase = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const r = 2.4 + Math.random() * 2.8
      const theta = Math.random() * Math.PI * 2
      const z = (Math.random() - 0.5) * 3
      pBase[i * 3] = r * Math.cos(theta)
      pBase[i * 3 + 1] = r * Math.sin(theta)
      pBase[i * 3 + 2] = z
      pPos[i * 3] = pBase[i * 3]
      pPos[i * 3 + 1] = pBase[i * 3 + 1]
      pPos[i * 3 + 2] = pBase[i * 3 + 2]
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.045,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
    const particles = new THREE.Points(pGeo, pMat)
    world.add(particles)

    /* ---------------- wave ring ---------------- */
    const WAVE_COUNT = 220
    const wGeo = new THREE.BufferGeometry()
    const wPos = new Float32Array(WAVE_COUNT * 3)
    wGeo.setAttribute('position', new THREE.BufferAttribute(wPos, 3))
    const wMat = new THREE.PointsMaterial({
      color: 0x22d3ee,
      size: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    })
    const waveRing = new THREE.Points(wGeo, wMat)
    world.add(waveRing)

    /* ---------------- bloom ---------------- */
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      0.85,
      0.5,
      0.18,
    )
    composer.addPass(bloomPass)

    const freqData = new Uint8Array(256)
    const timeData = new Uint8Array(512)
    const getAnalyser = () => usePlayerStore.getState().analyser

    const textureLoader = new THREE.TextureLoader()
    textureLoader.crossOrigin = 'anonymous'
    let lastCoverId = -1
    const unsub = usePlayerStore.subscribe((state) => {
      const song = state.currentSong
      if (song && song.id !== lastCoverId && song.picUrl) {
        lastCoverId = song.id
        textureLoader.load(
          song.picUrl,
          (t) => {
            if (disposed) return
            t.colorSpace = THREE.SRGBColorSpace
            coverMat.map = t
            coverMat.needsUpdate = true
          },
          undefined,
          () => {
            if (!disposed) {
              coverMat.map = makeFallbackTexture()
              coverMat.needsUpdate = true
            }
          },
        )
      } else if (!song) {
        lastCoverId = -1
        coverMat.map = makeFallbackTexture()
        coverMat.needsUpdate = true
      }
    })
    const initialSong = usePlayerStore.getState().currentSong
    if (initialSong?.picUrl) {
      lastCoverId = initialSong.id
      textureLoader.load(
        initialSong.picUrl,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace
          coverMat.map = t
          coverMat.needsUpdate = true
        },
        undefined,
        () => undefined,
      )
    }

    const colorA = new THREE.Color(0xec4141)
    const colorB = new THREE.Color(0x22d3ee)

    function applyMode() {
      const mode = modeRef.current
      spectrum.visible = mode === 'spectrum'
      particles.visible = mode === 'particles'
      waveRing.visible = mode === 'wave'
    }

    let t = 0
    function animate() {
      if (disposed) return
      raf = requestAnimationFrame(animate)
      t += 0.016

      const analyser = getAnalyser()
      let energy = 0
      let bass = 0.15
      let treble = 0.15
      if (analyser) {
        try {
          analyser.getByteFrequencyData(freqData as unknown as Uint8Array<ArrayBuffer>)
          analyser.getByteTimeDomainData(timeData as unknown as Uint8Array<ArrayBuffer>)
          let sum = 0
          for (let i = 0; i < 64; i++) sum += freqData[i]
          energy = sum / (64 * 255)
          bass = freqData[2] / 255
          treble = freqData[140] / 255
        } catch {
          energy = 0
        }
      }

      const pulse = analyser ? energy : 0.12 + 0.08 * Math.sin(t * 2.2)
      const mode = modeRef.current

      // the cover faces the screen and gently sways / floats
      coverGroup.rotation.y = Math.sin(t * 0.4) * 0.12
      coverGroup.rotation.x = Math.sin(t * 0.3) * 0.04
      coverGroup.position.y = Math.sin(t * 0.7) * 0.16
      const coverPulse = 1 + pulse * 0.05
      coverGroup.scale.setScalar(coverPulse)
      backMat.opacity = 0.35 + pulse * 0.5

      world.rotation.z = Math.sin(t * 0.4) * 0.02

      if (mode === 'spectrum') {
        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.floor((i / BAR_COUNT) * 160)
          const v = analyser ? freqData[idx] / 255 : 0.3 + 0.3 * Math.sin(t * 3 + i * 0.4)
          const h = 0.15 + v * 2.0
          bars[i].scale.y = h / 0.3
          barMats[i].color.copy(colorA).lerp(colorB, i / BAR_COUNT).multiplyScalar(0.6 + v * 0.8)
        }
      } else if (mode === 'particles') {
        const pos = pGeo.getAttribute('position') as THREE.BufferAttribute
        const scale = 0.85 + bass * 0.9
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          pos.setXYZ(
            i,
            pBase[i * 3] * scale + Math.sin(t * 2 + i) * 0.05,
            pBase[i * 3 + 1] * scale + Math.cos(t * 1.7 + i) * 0.05,
            pBase[i * 3 + 2],
          )
        }
        pos.needsUpdate = true
        pMat.color.setHSL(0.55 + treble * 0.4, 0.9, 0.6)
      } else if (mode === 'wave') {
        const pos = wGeo.getAttribute('position') as THREE.BufferAttribute
        const baseR = 3.0
        for (let i = 0; i < WAVE_COUNT; i++) {
          const a = (i / WAVE_COUNT) * Math.PI * 2
          const s = analyser ? (timeData[Math.floor((i / WAVE_COUNT) * 512)] - 128) / 128 : 0.2
          const r = baseR + s * 1.1 + pulse * 0.25
          pos.setXYZ(i, Math.cos(a) * r, Math.sin(a) * r, 0)
        }
        pos.needsUpdate = true
      }

      // keep camera nearly fixed so the cover stays facing the screen
      camera.position.set(Math.sin(t * 0.1) * 0.4, 0, 7.6)
      camera.lookAt(0, 0, 0)

      bloomPass.strength = 0.7 + pulse * 0.8
      applyMode()
      composer.render()
    }

    const onResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      composer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    animate()
    onResize()

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      unsub()
      scene.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        const mat = (m as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose())
        else if (mat) mat.dispose()
      })
      renderer.dispose()
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="visualizer-stage" ref={containerRef}>
      <div className="stage-overlay">
        {MODES.map((m) => (
          <button
            key={m}
            className={`mode-chip ${visualizerMode === m ? 'active' : ''}`}
            onClick={() => setVisualizerMode(m)}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
    </div>
  )
}
