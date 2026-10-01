import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { contacts, email, heroIcon, labGroups, labLogs, webSkills, webWorks, type LabMedia, type WebWork } from './content'
import { useMotionDisabledByDefault } from './hooks/useMotionPreference'
import { useReveal } from './hooks/useReveal'

type Tab = 'web' | 'lab'

const pad = (n: number) => String(n).padStart(2, '0')
const MOBILE_MAX = 820
const SECTIONS = ['hero', 'works', 'about', 'skills', 'contact'] as const
const NAV = [
  { id: 'works', label: 'Works', no: '01' },
  { id: 'about', label: 'About', no: '02' },
  { id: 'skills', label: 'Skills', no: '03' },
  { id: 'contact', label: 'Contact', no: '04' },
]

const groupOf = Object.fromEntries(labGroups.map(g => [g.k, g]))
const logs = labLogs.map(l => ({ ...l, group: groupOf[l.k] }))
const webCount = pad(webWorks.length)
const labCount = pad(logs.length)

/** Coalesce scroll/resize bursts into one callback per frame. */
function rafThrottle(fn: () => void) {
  let id = 0
  const run = () => { if (!id) id = requestAnimationFrame(() => { id = 0; fn() }) }
  run.cancel = () => { cancelAnimationFrame(id); id = 0 }
  return run
}

/** "studio.example.com" from a full URL, for the card corner label. */
const hostOf = (href: string) => { try { return new URL(href).host.replace(/^www\./, '') } catch { return '' } }

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < MOBILE_MAX)
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < MOBILE_MAX)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

/** The last section whose top has crossed 40% of the viewport. */
function useActiveSection() {
  const [active, setActive] = useState<string>('hero')
  useEffect(() => {
    const tick = () => {
      let next = 'hero'
      SECTIONS.forEach(id => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) next = id
      })
      setActive(next)
    }
    const onScroll = rafThrottle(tick)
    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); onScroll.cancel() }
  }, [])
  return active
}

export default function App() {
  const mobile = useIsMobile()
  const active = useActiveSection()
  const reduce = useMotionDisabledByDefault()
  const [menu, setMenu] = useState(false)
  const [tab, setTab] = useState<Tab>('web')
  const menuOpen = mobile && menu

  useEffect(() => { setMenu(false) }, [mobile])

  useEffect(() => {
    if (!menuOpen) return
    // Lock both roots: iOS Safari ignores overflow on <body> alone.
    const root = document.documentElement
    root.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    const onEsc = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') setMenu(false) }
    window.addEventListener('keydown', onEsc)
    return () => {
      root.style.overflow = ''
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onEsc)
    }
  }, [menuOpen])

  useReveal(reduce, [tab])

  return (
    <div className="page">
      <Header mobile={mobile} active={active} menuOpen={menuOpen} onOpenMenu={() => setMenu(true)} />
      {menuOpen && <MobileMenu onClose={() => setMenu(false)} />}

      <main className="main">
        <Hero onSelect={setTab} />
        <Works mobile={mobile} tab={tab} onTab={setTab} reduce={reduce} />
        <About />
        <Skills />
        <Contact />
      </main>
    </div>
  )
}

function Header({ mobile, active, menuOpen, onOpenMenu }: { mobile: boolean; active: string; menuOpen: boolean; onOpenMenu: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  useEffect(() => {
    // Return focus to the trigger when the menu closes.
    if (wasOpen.current && !menuOpen) btnRef.current?.focus()
    wasOpen.current = menuOpen
  }, [menuOpen])

  return (
    <header className="header">
      <a href="#hero" aria-label="t — Web Creator, back to top" className="brand">
        <span className="brand-t">t</span>
        <span className="brand-sep" aria-hidden="true">/</span>
        <span className="brand-sub">Web Creator</span>
      </a>
      {mobile ? (
        <div className="header-actions">
          <a href={`mailto:${email}`} className="mail-btn hover-lime" aria-label={`ご連絡はこちら（メール: ${email}）`} title={email} style={{ '--mark-d': '300ms' } as CSSProperties}>
            <MailIcon />
          </a>
          <button ref={btnRef} type="button" className="menu-btn" onClick={onOpenMenu} aria-expanded={menuOpen} aria-label="Open menu">
            <span className="bars"><span /><span /></span>
            <span>Menu</span>
          </button>
        </div>
      ) : (
        <nav aria-label="Main" className="nav">
          {NAV.map(n => (
            <a key={n.id} href={`#${n.id}`} className="nav-link" aria-current={active === n.id ? 'true' : 'false'}>
              <span className="no">{n.no}</span>
              <span>{n.label}</span>
            </a>
          ))}
          <a href={`mailto:${email}`} className="nav-contact hover-lime" aria-label={`ご連絡はこちら（メール: ${email}）`} title={email} style={{ '--mark-d': '450ms' } as CSSProperties}>ご連絡はこちら <span className="nudge nudge-ur">↗</span></a>
        </nav>
      )}
    </header>
  )
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  useEffect(() => { closeRef.current?.focus() }, [])

  // Keep Tab / Shift+Tab cycling inside the dialog.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const items = [...dialogRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
    if (!items.length) return
    const first = items[0], last = items[items.length - 1]
    const inside = dialogRef.current.contains(document.activeElement)
    if (e.shiftKey && (document.activeElement === first || !inside)) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && (document.activeElement === last || !inside)) { e.preventDefault(); first.focus() }
  }

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Menu" className="menu" onKeyDown={onKeyDown}>
      <div className="menu-top">
        <span className="brand">
          <span className="brand-t">t</span>
          <span className="brand-sep" aria-hidden="true">/</span>
          <span className="brand-sub">Web Creator</span>
        </span>
        <button ref={closeRef} type="button" className="menu-close" onClick={onClose} aria-label="Close menu">Close ✕</button>
      </div>
      <nav aria-label="Mobile" className="menu-nav">
        {NAV.map(n => (
          <a key={n.id} href={`#${n.id}`} className="menu-link" onClick={onClose}>
            <span className="menu-link-l">
              <span className="no">{n.no}</span>
              <span className="label">{n.label}</span>
            </span>
            <span className="arrow">→</span>
          </a>
        ))}
      </nav>
      <div className="menu-contacts">
        {contacts.map(c => <a key={c.label} href={c.url} target="_blank" rel="noopener noreferrer">{c.label} ↗</a>)}
      </div>
    </div>
  )
}

function Hero({ onSelect }: { onSelect: (t: Tab) => void }) {
  return (
    <section id="hero" className="hero" data-section="hero">
      <div className="hero-top">
        <div className="hero-copy">
          <span className="mask hero-kicker"><span data-reveal="mask">PORTFOLIO — 2026 / t</span></span>
          <h1 className="hero-title">
            <span className="mask"><span data-reveal="mask" data-delay="60">Web</span></span>
            <span className="mask"><span data-reveal="mask" data-delay="130">Creator</span></span>
          </h1>
          <div className="hero-row">
            <a href="#works" className="hero-cta hover-lime" style={{ '--mark-d': '520ms' } as CSSProperties} onClick={() => onSelect('web')} data-reveal="fade" data-delay="380">
              <span className="box"><span className="nudge nudge-d">↓</span></span>
              <span className="text">View Web Works</span>
              <span className="count">({webCount})</span>
            </a>
          </div>
        </div>
        <div className="hero-icon" data-reveal="img">
          {heroIcon
            ? <img src={heroIcon} alt="" width={480} height={480} decoding="async" />
            : <div className="icon-empty"><span>Icon — 1:1</span></div>}
        </div>
      </div>
    </section>
  )
}

const TABS = [
  // *Short: swapped in visually at ≤360px; the full text stays in the accessible name.
  { k: 'web' as const, no: '01', label: 'Web site', badge: 'COMPLETED / PERSONAL PROJECTS', badgeShort: 'COMPLETED', count: `(${webCount} works)`, big: true },
  { k: 'lab' as const, no: '02', label: 'After Effects・Blender', labelShort: 'AE / Blender', badge: 'LEARNING LOG', badgeShort: 'LEARNING', count: `(${labCount} logs)`, big: false },
]

/** Full text normally; on ≤360px screens the short form is shown and the full one is kept for screen readers only. */
function Responsive({ full, short }: { full: string; short?: string }) {
  if (!short) return <Chunks text={full} />
  return <><span className="rs-full"><Chunks text={full} /></span><span className="rs-short" aria-hidden="true">{short}</span></>
}

/**
 * Lets a label wrap only between its parts ("COMPLETED /" | "PERSONAL PROJECTS",
 * "After Effects" | "・Blender"), so a separator never ends a line on its own.
 */
function Chunks({ text }: { text: string }) {
  const parts = text.split(/(?<=\/ )|(?=・)/)
  return <>{parts.map((p, i) => <Fragment key={i}>{i > 0 && <wbr />}<span className="nw">{p}</span></Fragment>)}</>
}

function Works({ mobile, tab, onTab, reduce }: { mobile: boolean; tab: Tab; onTab: (t: Tab) => void; reduce: boolean }) {
  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = tab === 'web' ? 'lab' : 'web'
    onTab(next)
    setTimeout(() => document.getElementById('tab-' + next)?.focus(), 0)
  }

  return (
    <section id="works" className="works" data-section="works">
      <div className="works-head">
        <div>
          <div className="eyebrow">
            <span>01 / WORKS</span>
            <span className="rule" />
            <span className="sub">WEB SITE + LEARNING LOG</span>
          </div>
          <h2 className="display-h2 works-title">
            <span className="mask"><span data-reveal="mask">Works</span></span>
          </h2>
        </div>
      </div>

      <div role="tablist" aria-label="Works category" className="tablist" onKeyDown={onTabKey}>
        {TABS.map(t => {
          const on = tab === t.k
          return (
            <button
              key={t.k}
              type="button"
              role="tab"
              id={`tab-${t.k}`}
              aria-selected={on}
              aria-controls={`panel-${t.k}`}
              tabIndex={on ? 0 : -1}
              className="tab"
              onClick={() => onTab(t.k)}
            >
              <span className="tab-meta">
                <span className="tab-mark" />
                <span className="tab-no">{t.no}</span>
                <span className={`tab-badge ${t.big ? 'solid' : 'dashed'}`}><Responsive full={t.badge} short={t.badgeShort} /></span>
              </span>
              <span className="tab-row">
                <span className={`tab-label ${t.big ? 'lg' : 'sm'}`}><Responsive full={t.label} short={t.labelShort} /></span>
                <span className="tab-count">{t.count}</span>
              </span>
              <span className="tab-bar" />
              <span className="tab-accent" />
            </button>
          )
        })}
      </div>

      {tab === 'web' ? <WebPanel mobile={mobile} reduce={reduce} /> : <LabPanel />}
    </section>
  )
}

type CarouselState = { i: number; barW: number; barL: number; atStart: boolean; atEnd: boolean }

/** Horizontal scroller: mouse drag-to-scroll, arrow keys, and counter/progress state. */
function useCarousel(reduce: boolean) {
  const [el, setEl] = useState<HTMLDivElement | null>(null)
  const [s, setS] = useState<CarouselState>({ i: 0, barW: 100 / webWorks.length, barL: 0, atStart: true, atEnd: false })

  const stepBy = useCallback((dir: number) => {
    if (!el) return
    const c = el.querySelectorAll<HTMLElement>('[data-card]'), n = c.length
    if (!n) return
    // Move one card from the current one. At the end the last card can't sit at
    // the left edge, so a plain scrollBy(-step) from there would skip a card.
    const max = el.scrollWidth - el.clientWidth
    const step = n > 1 ? c[1].offsetLeft - c[0].offsetLeft : el.clientWidth
    const cur = el.scrollLeft >= max - 2 ? n - 1 : Math.round(el.scrollLeft / step)
    const to = Math.max(0, Math.min(n - 1, cur + dir))
    el.scrollTo({ left: Math.min(max, c[to].offsetLeft - c[0].offsetLeft), behavior: reduce ? 'auto' : 'smooth' })
  }, [el, reduce])

  useLayoutEffect(() => {
    if (!el) return
    const upd = () => {
      const cards = el.querySelectorAll<HTMLElement>('[data-card]'), n = cards.length
      if (!n) return
      const max = el.scrollWidth - el.clientWidth
      const step = n > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1
      const i = max <= 2 ? 0 : el.scrollLeft >= max - 2 ? n - 1 : Math.round(el.scrollLeft / step)
      const vis = Math.max(1, (el.clientWidth + 20) / step)
      const barW = Math.min(100, vis / n * 100)
      const next = { i, barW, barL: (max > 0 ? el.scrollLeft / max : 0) * (100 - barW), atStart: el.scrollLeft <= 2, atEnd: el.scrollLeft >= max - 2 }
      setS(prev => (prev.i === next.i && prev.atStart === next.atStart && prev.atEnd === next.atEnd
        && Math.abs(prev.barW - next.barW) < 0.1 && Math.abs(prev.barL - next.barL) < 0.1) ? prev : next)
    }
    const onScroll = rafThrottle(upd)

    let down: { x: number; l: number } | null = null, moved = false
    const pd = (e: PointerEvent) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = { x: e.clientX, l: el.scrollLeft }; moved = false }
    const pm = (e: PointerEvent) => {
      if (!down) return
      const dx = e.clientX - down.x
      if (Math.abs(dx) > 6) { moved = true; el.style.scrollSnapType = 'none'; el.style.cursor = 'grabbing' }
      if (moved) el.scrollLeft = down.l - dx
    }
    const pu = () => {
      if (!down) return
      down = null
      el.style.cursor = ''
      if (moved) { const l = el.scrollLeft; el.style.scrollSnapType = ''; el.scrollLeft = l }
    }
    // Swallow the click that ends a drag so cards don't navigate.
    const clk = (e: MouseEvent) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false } }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.target !== el) return
      if (e.key === 'ArrowRight') { e.preventDefault(); stepBy(1) }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepBy(-1) }
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('pointerdown', pd)
    window.addEventListener('pointermove', pm)
    window.addEventListener('pointerup', pu)
    el.addEventListener('click', clk, true)
    el.addEventListener('keydown', onKey)
    window.addEventListener('resize', onScroll)
    upd()
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointerdown', pd)
      window.removeEventListener('pointermove', pm)
      window.removeEventListener('pointerup', pu)
      el.removeEventListener('click', clk, true)
      el.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onScroll)
      onScroll.cancel()
    }
  }, [el, stepBy])

  return { ref: setEl, state: s, stepBy }
}

function WebPanel({ mobile, reduce }: { mobile: boolean; reduce: boolean }) {
  const { ref, state, stepBy } = useCarousel(reduce)
  return (
    <div role="tabpanel" id="panel-web" aria-labelledby="tab-web" className="panel-web">
      <div className="carousel-head">
        <div className="panel-note">
          <span className="tag-solid">COMPLETED</span>
          <span className="sub"><span className="nw">公開中の自主制作Webサイト</span> <wbr /><span className="nw">— 企画 / デザイン / 実装</span></span>
        </div>
        <div className="carousel-ctl">
          <span className="counter" aria-live="polite">{pad(state.i + 1)} / {webCount}</span>
          <span className="track" aria-hidden="true">
            <span className="track-bar" style={{ width: `${state.barW}%`, left: `${state.barL}%` }} />
          </span>
          <button type="button" className="step-btn" onClick={() => stepBy(-1)} disabled={state.atStart} aria-label="前の作品">←</button>
          <button type="button" className="step-btn" onClick={() => stepBy(1)} disabled={state.atEnd} aria-label="次の作品">→</button>
        </div>
      </div>

      <div ref={ref} className="hscroll" tabIndex={0} aria-label="Web works — 横スクロール">
        {webWorks.map((w, idx) => <WorkCard key={w.name} w={w} no={pad(idx + 1)} />)}
        <div aria-hidden="true" className="hscroll-end" />
      </div>
      <div className="scroll-hint">
        <span><span className="rule" />{mobile ? 'SWIPE →' : 'SCROLL / DRAG / ← →'}</span>
      </div>
    </div>
  )
}

/** Thumbnail + case link only render when the work has a real URL. */
function WorkCard({ w, no }: { w: WebWork; no: string }) {
  const host = w.href ? hostOf(w.href) : ''
  const media = (
    <>
      {w.image
        ? <img src={w.image} alt="" draggable={false} loading="lazy" decoding="async" />
        : <div className="card-grid" />}
      <span className="card-tl">{no} — {w.year}</span>
      {host && <span className="card-tr">{host}</span>}
      {!w.image && <span className="card-cover">{w.cover}</span>}
    </>
  )
  return (
    <article className="card" data-card>
      {w.href
        ? <a href={w.href} draggable={false} aria-label={`${w.name} — 詳細を見る`} className={`card-media${w.image ? ' has-image' : ''}`}>{media}</a>
        : <div className={`card-media${w.image ? ' has-image' : ''}`}>{media}</div>}
      <div className="card-body">
        <span className="no-lime">{no}</span>
        <div className="card-main">
          <div className="card-titlerow">
            <h3 className="card-title">{w.name}</h3>
            <span className="card-meta">{w.year} — {w.cat}</span>
          </div>
          <p className="card-desc">{w.desc}</p>
          <dl className="card-dl">
            <div><dt>ROLE</dt><dd>{w.role}</dd></div>
            <div><dt>STACK</dt><dd>{w.stack}</dd></div>
          </dl>
          {w.href && (
            <a href={w.href} draggable={false} className="card-link hover-lime" style={{ '--mark-d': '420ms' } as CSSProperties}>
              <span className="u">View case</span><span className="nudge nudge-r">→</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

/** Real study output, or an honest "pending" label when there's none yet. */
function LabThumb({ media, study }: { media?: LabMedia; study: string }) {
  if (!media) return <span className="lab-kind">PREVIEW PENDING — {study}</span>
  if (media.type === 'image') return <img className="lab-file" src={media.src} alt={media.alt} loading="lazy" decoding="async" />
  // preload="none" + poster: only the poster image loads until the viewer presses play.
  return <video className="lab-file" src={media.src} poster={media.poster} aria-label={media.label} preload="none" controls muted loop playsInline />
}

function LabPanel() {
  return (
    <div role="tabpanel" id="panel-lab" aria-labelledby="tab-lab" className="panel-lab">
      <div className="lab-head">
        <div className="panel-note">
          <span className="tag-lime">IN PROGRESS</span>
          <span>LEARNING LOG</span>
          <span className="sub">— 完成作品ではなく、学習中の制作過程の記録</span>
        </div>
        <span className="lab-latest">{labCount} LOGS — NEWEST FIRST</span>
      </div>
      <ol className="lab-list">
        {logs.map(l => (
          <li key={l.title} className="lab-item">
            <div className="lab-media">
              <LabThumb media={l.media} study={l.group.study} />
              <span className="lab-code">{l.group.code}</span>
              <span className={`lab-status${l.wip ? ' wip' : ''}`}>{l.wip ? 'WIP' : 'STUDY'}</span>
            </div>
            <div className="lab-body">
              <div className="lab-meta">
                <span>{l.group.name}</span>
                <span className="date">{l.date}</span>
              </div>
              <h3 className="lab-title">{l.title}</h3>
              <dl className="lab-dl">
                <div><dt>THEME</dt><dd>{l.group.field}</dd></div>
                <div><dt>PRACTICING</dt><dd className="jp">{l.practice}</dd></div>
                <div><dt>LEARNED</dt><dd className="jp">{l.learned}</dd></div>
              </dl>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function About() {
  return (
    <section id="about" className="section about" data-section="about">
      <div className="about-side">
        <h2 className="eyebrow"><span>02</span><span className="rule" /><span className="sub">ABOUT</span></h2>
      </div>
      <div className="about-main">
        <p className="about-lead">
          <span className="mask keep"><span data-reveal="mask">Webサイトを、<wbr />企画から</span></span>
          <span className="mask"><span data-reveal="mask" data-delay="70">デザイン、実装まで。</span></span>
        </p>
        <div className="about-cols">
          <p data-reveal="fade">伝える内容の整理から、<wbr />デザイン、<wbr />コーディングまでを<wbr />一人で担当します。</p>
          <p data-reveal="fade" data-delay="80">現在はAfter Effectsと<wbr />Blenderを学習中。<wbr />モーションや3Dを<wbr />Webの表現に<wbr />取り入れることが目標です。</p>
        </div>
        <ol aria-label="Process" className="process">
          <li><span className="step">01 →</span><span className="name">Plan</span></li>
          <li><span className="step">02 →</span><span className="name">Design</span></li>
          <li><span className="step">03 →</span><span className="name">Code</span></li>
          <li className="next"><span className="step">+ NEXT — LEARNING</span><span className="name">Motion / 3D</span></li>
        </ol>
      </div>
    </section>
  )
}

const LEARNING = [
  { name: 'After Effects', chips: ['Motion Graphics', 'Animation'] },
  { name: 'Blender', chips: ['Modeling', '3D / CG'] },
]

function Skills() {
  return (
    <section id="skills" className="section skills" data-section="skills">
      <h2 className="eyebrow"><span>03</span><span className="rule" /><span className="sub">SKILLS</span></h2>
      <div className="skills-row">
        <div className="skills-web">
          <div className="skills-web-head">
            <h3>Web</h3>
            <span className="tag-solid">IN USE — PERSONAL PROJECTS</span>
          </div>
          <ul className="skills-list">
            {webSkills.map((name, i) => (
              <li key={name}><span className="no">{pad(i + 1)}</span><span className="name">{name}</span></li>
            ))}
          </ul>
        </div>
        <div className="learning">
          <div className="learning-head">
            <h3>Learning</h3>
            <span className="tag-lime">IN PROGRESS</span>
          </div>
          <div className="learning-items">
            {LEARNING.map(l => (
              <div key={l.name}>
                <div className="learning-title"><span>{l.name}</span><span className="since">SINCE 2026</span></div>
                <div className="chips">{l.chips.map(c => <span key={c}>{c}</span>)}</div>
              </div>
            ))}
          </div>
          <p className="learning-note">学習中のため、実案件での使用はまだありません。</p>
        </div>
      </div>
    </section>
  )
}

function MailIcon() {
  return (
    <svg className="mail-icon" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <rect x="2" y="4.5" width="16" height="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 5l7.5 6 7.5-6" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function Contact() {
  return (
    <section id="contact" className="contact" data-section="contact">
      <div className="eyebrow"><span>04</span><span className="rule" /><span className="sub">CONTACT</span></div>
      <h2 className="display-h2 contact-title">
        <span className="mask"><span data-reveal="mask">Let’s</span></span>
        <span className="mask indent"><span data-reveal="mask" data-delay="80"><span className="hl">connect</span>.</span></span>
      </h2>
      <div className="contact-grid">
        {contacts.map(c => (
          <a key={c.label} href={c.url} target="_blank" rel="noopener noreferrer" className="contact-card hover-lime" style={{ '--mark-d': '650ms' } as CSSProperties}>
            <span className="top"><span>{c.label}</span><span className="arrow nudge nudge-ur">↗</span></span>
            <span className="value"><img src={c.icon} alt="" width={20} height={20} className="sns-icon" /><span className="handle">{c.handle}</span></span>
          </a>
        ))}
      </div>
      <footer className="footer">
        <span>© 2026 t — Web Creator</span>
        <a href="#hero" className="hover-lime" style={{ '--mark-d': '420ms' } as CSSProperties}>Back to top <span className="nudge nudge-u">↑</span></a>
      </footer>
    </section>
  )
}
