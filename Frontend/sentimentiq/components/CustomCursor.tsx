'use client'

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mx = -100, my = -100, rx = -100, ry = -100
    let hovering = false

    const onMove = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
    }

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      hovering = !!(t.closest('a, button, [data-hover], textarea, input, label'))
      ring.classList.toggle('hovering', hovering)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onOver)

    let raf: number
    const animate = () => {
      if (dot) {
        dot.style.left = `${mx}px`
        dot.style.top  = `${my}px`
      }
      if (ring) {
        rx += (mx - rx) * 0.12
        ry += (my - ry) * 0.12
        ring.style.left = `${rx}px`
        ring.style.top  = `${ry}px`
      }
      raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  />
      <div ref={ringRef} className="cursor-ring" />
    </>
  )
}
