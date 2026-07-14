import { useEffect, useState } from 'react'

type NetworkInformation = { saveData?: boolean }

function getSaveData(): boolean {
  const nav = navigator as Navigator & { connection?: NetworkInformation }
  return nav.connection?.saveData === true
}

function getPrefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Whether motion should be off by default: OS reduced-motion or a Save-Data hint. */
export function useMotionDisabledByDefault(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(getPrefersReducedMotion)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return prefersReduced || getSaveData()
}
