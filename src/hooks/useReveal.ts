import { useLayoutEffect, type DependencyList } from 'react'

/**
 * One-shot entrance animations for `[data-reveal]` elements:
 * - `mask`: slide up from inside its overflow-hidden parent
 * - `img`:  clip-path wipe from the top
 * - `fade`: opacity
 * `data-delay` (ms) staggers them. Re-scans on `deps` change so newly mounted
 * elements (e.g. a switched tab panel) get picked up; played ones are skipped.
 */
export function useReveal(disabled: boolean, deps: DependencyList) {
  useLayoutEffect(() => {
    if (disabled) return
    // A hidden tab (background tab, prerender, link-preview/screenshot renderer)
    // pauses animations, so hiding content there would leave the Hero blank until
    // someone looks. Keep everything visible and only arm the reveal once shown.
    if (document.hidden) {
      let cleanup: (() => void) | undefined
      const onShow = () => {
        if (document.hidden) return
        document.removeEventListener('visibilitychange', onShow)
        cleanup = setup()
      }
      document.addEventListener('visibilitychange', onShow)
      return () => { document.removeEventListener('visibilitychange', onShow); cleanup?.() }
    }
    return setup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, ...deps])
}

/** Hides the not-yet-played elements and plays them as they come into view. */
function setup() {
  const els = [...document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-played])')]
  const targetOf = (el: HTMLElement) =>
    (el.dataset.reveal === 'mask' || el.dataset.reveal === 'img') ? el.parentElement ?? el : el
  const map = new Map<Element, HTMLElement[]>()

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return
    io.unobserve(e.target)
    ;(map.get(e.target) || []).forEach(play)
  }), { threshold: 0.05, rootMargin: '0px 0px -4% 0px' })

  els.forEach(el => {
    const t = el.dataset.reveal
    if (t === 'mask') el.style.transform = 'translateY(105%)'
    else if (t === 'img') el.style.clipPath = 'inset(0 0 100% 0)'
    else el.style.opacity = '0'
    const tg = targetOf(el)
    if (!map.has(tg)) { map.set(tg, []); io.observe(tg) }
    map.get(tg)!.push(el)
  })

  const inView = (el: HTMLElement) => {
    const r = targetOf(el).getBoundingClientRect()
    return r.top < window.innerHeight && r.bottom > 0
  }
  els.forEach(el => { if (inView(el)) play(el) })
  // Fallback in case the observer misses something already on screen.
  const safety = window.setTimeout(() => {
    document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-played])').forEach(el => { if (inView(el)) play(el) })
  }, 1500)

  return () => {
    io.disconnect()
    clearTimeout(safety)
  }
}

function play(el: HTMLElement) {
  if (el.dataset.played) return
  el.setAttribute('data-played', '1')
  const t = el.dataset.reveal, delay = +(el.dataset.delay || 0)
  let kf: Keyframe[], o: KeyframeAnimationOptions
  if (t === 'mask') { kf = [{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }]; o = { duration: 800, easing: 'cubic-bezier(.2,.7,0,1)' } }
  else if (t === 'img') { kf = [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }]; o = { duration: 1000, easing: 'cubic-bezier(.76,0,.24,1)' } }
  else { kf = [{ opacity: 0 }, { opacity: 1 }]; o = { duration: 600, easing: 'ease-out' } }
  const a = el.animate(kf, { ...o, delay, fill: 'forwards' })
  a.onfinish = () => { el.style.transform = ''; el.style.clipPath = ''; el.style.opacity = ''; a.cancel() }
}
