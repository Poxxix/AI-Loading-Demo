import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AsciiReveal, AsciiSkeleton } from 'ascii-reveal'
import './styles.css'

const prompt = 'Soft architectural study of a sculptural chair, deep cobalt resin, gallery light, fine grain'

const images = [
  '/generated-cobalt.svg',
  '/generated-vermilion.svg',
  '/generated-violet.svg',
]

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {}).finally(resolve)
      } else {
        resolve()
      }
    }
    img.onerror = () => resolve()
    img.src = src
  })
}

function App() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRevealing, setIsRevealing] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const [hasResult, setHasResult] = useState(true)
  const [isQueued, setIsQueued] = useState(false)

  const imageIndexRef = useRef(0)
  const busyRef = useRef(false)
  const queuedRef = useRef(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    images.forEach((src) => {
      void preloadImage(src)
    })
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  function startGeneration() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
    }

    busyRef.current = true
    setHasResult(false)
    setIsRevealing(false)
    setIsGenerating(true)

    const nextIndex = (imageIndexRef.current + 1) % images.length
    const preloadPromise = preloadImage(images[nextIndex])

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      void preloadPromise.then(() => {
        imageIndexRef.current = nextIndex
        setImageIndex(nextIndex)
        setHasResult(true)
        setIsGenerating(false)
        setIsRevealing(true)
      })
    }, 2200)
  }

  function handleRevealComplete() {
    setIsRevealing(false)

    // Preserve the user's choice to generate again, but let the current
    // cinematic reveal complete before replacing its image cell. The exact
    // handoff comes from AsciiReveal rather than a guessed timeout.
    if (queuedRef.current) {
      queuedRef.current = false
      setIsQueued(false)
      startGeneration()
      return
    }

    busyRef.current = false
  }

  function generate() {
    if (busyRef.current || isGenerating || isRevealing) {
      queuedRef.current = true
      setIsQueued(true)
      return
    }
    startGeneration()
  }

  const isBusy = isGenerating || isRevealing

  return (
    <main className="page-shell">
      <section className="intro">
        <div className="brand-mark" aria-hidden="true"><i /> <i /> <i /></div>
        <p className="eyebrow">Prism / interaction handoff</p>
        <h1>One image.<br /><em>One loading moment.</em></h1>
        <p className="lede">A realistic handoff prototype for an AI image-generation flow. The ASCII layer lives only inside the image cell; every other control remains available.</p>
        <div className="principles" aria-label="Experience decisions">
          <span>01 / dither</span><span>02 / cinematic</span><span>03 / image-only</span>
        </div>
      </section>

      <section className="studio" aria-label="AI image generation demo">
        <div className="studio-frame">
          <div className="studio-bar">
            <div>
              <span className={`status-dot ${isBusy ? 'is-live' : ''}`} />
              {isGenerating ? 'Generating' : isRevealing ? 'Revealing' : 'Ready'}
            </div>
            <span>1024 × 1280</span>
          </div>

          <div className="canvas-panel">
            <AsciiReveal
              loading={isGenerating}
              preset="dither"
              duration="cinematic"
              revealOnMount={false}
              onRevealComplete={handleRevealComplete}
              className="image-reveal"
              style={{
                '--ascii-accent': '#2563eb',
                '--ascii-skeleton': '#64748b',
                '--ascii-glyph': '#0f172a',
                '--ascii-flash': '#2563eb',
                '--ascii-surface': '#f8fafc',
              } as React.CSSProperties}
            >
              {hasResult ? (
                <img
                  className="generated-image"
                  src={images[imageIndex]}
                  alt={`Generated sculptural chair concept ${imageIndex + 1}`}
                />
              ) : (
                <AsciiSkeleton
                  className="image-skeleton"
                  variant="dither"
                  rows={72}
                  width="100%"
                  height="100%"
                  style={{ width: '100%', height: '100%', fontSize: '12px' }}
                  animate
                />
              )}
            </AsciiReveal>
            {isGenerating && <div className="generating-label" aria-live="polite">Imagining form &amp; light<span>···</span></div>}
          </div>

          <div className="prompt-strip">
            <p>{prompt}</p>
            <button className="generate-button" type="button" onClick={generate}>
              <span>{isQueued ? 'Next queued' : isBusy ? 'Queue next' : 'Generate again'}</span><b aria-hidden="true">↗</b>
            </button>
          </div>
        </div>
      </section>

      <aside className="handoff-note">
        <p className="eyebrow">For development</p>
        <h2>Implementation intent</h2>
        <ol>
          <li><b>Trigger</b><span>The user presses Generate. Set <code>isGenerating</code> to true.</span></li>
          <li><b>Waiting state</b><span>Swap only the image for <code>AsciiSkeleton</code>. Keep prompt and actions interactive.</span></li>
          <li><b>Result state</b><span>When the image arrives, set it as the child and turn <code>loading</code> false to reveal it.</span></li>
          <li><b>Repeated generate</b><span>Queue it; <code>onRevealComplete</code> starts the next image state only after the current reveal finishes.</span></li>
        </ol>
        <div className="token-card">
          <span>Preline token proposal</span>
          <div><i className="swatch ink" />Slate 900 <code>#0f172a</code></div>
          <div><i className="swatch accent" />Blue 600 <code>#2563eb</code></div>
          <div><i className="swatch canvas" />Slate 50 <code>#f8fafc</code></div>
        </div>
        <p className="motion-note">Reduced motion: let the component fall back to its built-in short fade. Off-screen cells should not animate.</p>
      </aside>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
