import { useEffect, useRef, useState } from "react";
import { useVideoFadeLoop } from "./hooks/useVideoFadeLoop";
import { useMotionDisabledByDefault } from "./hooks/useMotionPreference";

const ERR_CYCLE_MS = 3600;
const HERO_POSTER = "/assets/hero-poster.webp";
const HERO_VIDEO_SOURCES = [
  {
    src: "/assets/hero-mobile.webm",
    type: "video/webm",
    media: "(max-width: 640px)",
  },
  {
    src: "/assets/hero-mobile.mp4",
    type: "video/mp4",
    media: "(max-width: 640px)",
  },
  { src: "/assets/hero.webm", type: "video/webm" },
  { src: "/assets/hero.mp4", type: "video/mp4" },
];

function PlayIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path d="M4 2.5v11l10-5.5-10-5.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3.5"
        y="2.5"
        width="3"
        height="11"
        rx="0.5"
        fill="currentColor"
      />
      <rect
        x="9.5"
        y="2.5"
        width="3"
        height="11"
        rx="0.5"
        fill="currentColor"
      />
    </svg>
  );
}

type LogEntry = {
  time: string;
  title: string;
  tag: string;
  tagColor?: string;
  tagBorder?: string;
  body?: string;
  diff?: { removed: string; added: string };
  status?: boolean;
};

const LOG_ENTRIES: LogEntry[] = [
  {
    time: "02:14:07",
    title: "着想",
    tag: "IDEATE",
    body: "X運用の手作業を自動化する、という仮説を立てた",
  },
  {
    time: "02:41:52",
    title: "実装",
    tag: "DEPLOY v0.1",
    body: "Claude Code で組んだ投稿スクリプトを本番に上げた",
  },
  {
    time: "03:02:11",
    title: "エラー発生",
    tag: "HTTP 402",
    tagColor: "oklch(0.78 0.06 68)",
    tagBorder: "oklch(0.62 0.08 68 / 0.5)",
    body: "連投がしきい値を超え、API がリクエストを拒否",
  },
  {
    time: "03:08:44",
    title: "原因特定",
    tag: "DIAGNOSE",
    body: "X API 無料枠の投稿上限に到達していた",
  },
  {
    time: "03:26:03",
    title: "再設計",
    tag: "PATCH",
    diff: {
      removed: "- interval = fixed(30s)",
      added: "+ interval = queue + exponential_backoff",
    },
  },
  {
    time: "03:57:20",
    title: "稼働中",
    tag: "OPERATIONAL",
    body: "以降、無停止で稼働。上限に触れず回している",
    status: true,
  },
];

const STACK = ["Claude Code", "Python", "SQLite", "Discord Webhook", "X API"];

const PROJECTS = [
  {
    name: "SNS 自動投稿システム",
    desc: "X API とキュー投稿。上限を避けてバックオフしながら回す運用基盤",
    status: "RUNNING" as const,
    meta: "last run 03:57",
  },
  {
    name: "YouTube Shorts → note 導線",
    desc: "短尺視聴から読み物へ橋渡しする、記事誘導のパイプライン",
    status: "RUNNING" as const,
    meta: "daily",
  },
  {
    name: "学園当日サイト",
    desc: "文化祭当日の案内・タイムテーブル。当日のアクセス集中に耐えて稼働",
    status: "SHIPPED" as const,
    meta: "当日稼働済み",
  },
];

function useRecoverOnScroll(motionEnabled: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const els = Array.from(
      container.querySelectorAll<HTMLElement>("[data-recover]"),
    );

    if (!motionEnabled) {
      els.forEach((el) => {
        el.style.animation = "none";
        el.style.filter = "none";
        el.style.opacity = "1";
      });
      return;
    }

    els.forEach((el) => {
      el.style.opacity = "0";
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.animation =
              "recover 1.15s cubic-bezier(.2,.6,.2,1) forwards";
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.14 },
    );
    els.forEach((el) => io.observe(el));

    const fallback = window.setTimeout(() => {
      els.forEach((el) => {
        if (getComputedStyle(el).opacity === "0") el.style.opacity = "1";
      });
    }, 4500);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [motionEnabled]);

  return containerRef;
}

function Panel({
  children,
  padding = "30px 34px",
}: {
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <div
      data-recover
      className="glass-edge"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        background: "rgba(255,255,255,0.022)",
        backdropFilter: "blur(9px)",
        WebkitBackdropFilter: "blur(9px)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.10)",
        padding,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({
  index,
  meta,
  label,
}: {
  index: string;
  meta: string;
  label: string;
}) {
  return (
    <div
      className="flex items-baseline gap-[18px] flex-wrap mb-[30px]"
      style={{ borderTop: "1px solid rgba(255,255,255,0.14)", paddingTop: 15 }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12,
          letterSpacing: "0.06em",
          color: "var(--text-dim)",
        }}
      >
        {index} · {meta}
      </span>
      <h2
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 400,
          letterSpacing: "0.2em",
          color: "rgba(255,255,255,0.55)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </h2>
    </div>
  );
}

export default function App() {
  const motionDisabledByDefault = useMotionDisabledByDefault();
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const motionEnabled = motionOverride ?? !motionDisabledByDefault;

  const videoRef = useVideoFadeLoop(motionEnabled);
  const recoverRef = useRecoverOnScroll(motionEnabled);
  const [errActive, setErrActive] = useState(true);

  useEffect(() => {
    if (!motionEnabled) return;
    const timer = window.setInterval(() => {
      setErrActive((v) => !v);
    }, ERR_CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [motionEnabled]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <header
        className="absolute z-[4] w-full flex justify-between items-center px-5 py-5 sm:px-10 sm:py-[26px]"
        style={{ top: 0 }}
      >
        <div style={{ fontSize: 19, letterSpacing: "0.02em", fontWeight: 400 }}>
          Leels
        </div>
        <div
          className="hidden sm:flex"
          style={{
            alignItems: "center",
            gap: 9,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "var(--text-on-video)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "oklch(0.74 0.05 150)",
              boxShadow: "0 0 8px oklch(0.74 0.07 150)",
              animation: motionEnabled
                ? "pulse 2.6s ease-in-out infinite"
                : "none",
            }}
          />
          ALL SYSTEMS OPERATIONAL
        </div>
      </header>

      <main>
        <section
          style={{
            position: "relative",
            height: "100vh",
            minHeight: 640,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <video
            ref={videoRef}
            poster={HERO_POSTER}
            muted
            playsInline
            preload={motionEnabled ? "auto" : "none"}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 22%",
              opacity: motionEnabled ? 0 : 1,
              zIndex: 0,
            }}
          >
            {motionEnabled &&
              HERO_VIDEO_SOURCES.map((source) => (
                <source
                  key={source.src}
                  src={source.src}
                  type={source.type}
                  media={source.media}
                />
              ))}
          </video>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg,rgba(6,6,6,0.55) 0%,rgba(6,6,6,0.42) 38%,rgba(6,6,6,0.62) 78%,rgba(6,6,6,0.96) 100%)",
              zIndex: 1,
            }}
          />

          <div className="relative z-[2] flex-1 flex flex-col justify-center px-5 sm:px-10">
            <h1
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: "clamp(40px,8.2vw,108px)",
                letterSpacing: "-0.015em",
                lineHeight: 0.98,
              }}
            >
              What do you want?
            </h1>
            <p
              style={{
                marginTop: 24,
                maxWidth: 460,
                fontSize: 15,
                lineHeight: 1.75,
                color: "var(--text-on-video)",
                fontWeight: 300,
              }}
            >
              生成物ではなく、壊して直した運用の痕跡を。
              <br />
              スクロールして、いま動いているものを見てほしい。
            </p>
          </div>

          <div className="relative z-[2] flex justify-center pb-8">
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                color: "var(--text-on-video-muted)",
                animation: motionEnabled
                  ? "scrollhint 2.2s ease-in-out infinite"
                  : "none",
              }}
            >
              SCROLL ↓
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMotionOverride(!motionEnabled)}
            aria-pressed={motionEnabled}
            aria-label={
              motionEnabled ? "背景の演出を停止する" : "背景の演出を再生する"
            }
            className="glass-edge"
            style={{
              position: "absolute",
              left: 20,
              bottom: 28,
              zIndex: 3,
              width: 38,
              height: 38,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.10)",
              border: "none",
              color: "rgba(255,255,255,0.85)",
              cursor: "pointer",
            }}
          >
            {motionEnabled ? <PauseIcon /> : <PlayIcon />}
          </button>
        </section>

        <div
          ref={recoverRef}
          style={{
            position: "relative",
            backgroundImage:
              "repeating-linear-gradient(to bottom,transparent 0,transparent 31px,rgba(255,255,255,0.08) 31px,rgba(255,255,255,0.08) 32px)",
          }}
        >
          <div
            className="mx-auto px-5 sm:px-10"
            style={{ maxWidth: 1060, paddingTop: 130 }}
          >
            {/* PANEL 01 : 稼働ログ */}
            <section className="glass-panel-lazy" style={{ marginBottom: 112 }}>
              <SectionLabel
                index="01"
                meta="2026-06-08"
                label="稼働ログ / incident"
              />
              <Panel>
                <ol style={{ listStyle: "none" }}>
                  {LOG_ENTRIES.map((entry, i) => (
                    <li
                      key={entry.time}
                      className="log-row"
                      style={{
                        borderBottom:
                          i < LOG_ENTRIES.length - 1
                            ? "1px solid rgba(255,255,255,0.06)"
                            : undefined,
                      }}
                    >
                      <time
                        dateTime={`2026-06-08T${entry.time}`}
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 12,
                          color: "var(--text-dim)",
                          paddingTop: 2,
                        }}
                      >
                        {entry.time}
                      </time>
                      <div style={{ minWidth: 0 }}>
                        <div className="flex items-center flex-wrap gap-[11px]">
                          <span style={{ fontSize: 16 }}>{entry.title}</span>
                          {entry.status ? (
                            <span
                              className="inline-flex items-center"
                              style={{
                                gap: 7,
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: 10,
                                letterSpacing: "0.1em",
                                color: "oklch(0.78 0.045 150)",
                                border: "1px solid oklch(0.6 0.06 150 / 0.45)",
                                borderRadius: 4,
                                padding: "2px 8px",
                              }}
                            >
                              <span
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: "50%",
                                  background: "oklch(0.74 0.06 150)",
                                }}
                              />
                              {entry.tag}
                            </span>
                          ) : (
                            <span
                              style={{
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: 10,
                                letterSpacing: "0.1em",
                                color: entry.tagColor ?? "var(--text-dim)",
                                border: `1px solid ${entry.tagBorder ?? "rgba(255,255,255,0.14)"}`,
                                borderRadius: 4,
                                padding: "2px 7px",
                              }}
                            >
                              {entry.tag}
                            </span>
                          )}
                        </div>
                        {entry.body && (
                          <div
                            style={{
                              fontSize: 13.5,
                              color: "rgba(255,255,255,0.52)",
                              marginTop: 5,
                              fontWeight: 300,
                            }}
                          >
                            {entry.body}
                          </div>
                        )}
                        {entry.diff && (
                          <div
                            style={{
                              marginTop: 9,
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: 12.5,
                              lineHeight: 1.75,
                              background: "rgba(255,255,255,0.02)",
                              borderRadius: 6,
                              padding: "10px 13px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            <div style={{ color: "oklch(0.64 0.08 25)" }}>
                              {entry.diff.removed}
                            </div>
                            <div style={{ color: "oklch(0.74 0.05 150)" }}>
                              {entry.diff.added}
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                <div
                  style={{
                    marginTop: 22,
                    paddingTop: 16,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.06em",
                    color: "var(--text-dim)",
                  }}
                >
                  TOTAL 1h 43m · 無停止復旧 · 1 incident resolved
                </div>
              </Panel>
            </section>

            {/* PANEL 02 : 使用スタック */}
            <section className="glass-panel-lazy" style={{ marginBottom: 112 }}>
              <SectionLabel
                index="02"
                meta="in production"
                label="使用スタック / stack"
              />
              <Panel padding="34px 34px 30px">
                <div className="flex flex-wrap gap-3">
                  {STACK.map((item) => (
                    <span
                      key={item}
                      className="glass-edge inline-flex items-center"
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        gap: 9,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.045)",
                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.10)",
                        padding: "11px 18px",
                        fontSize: 14.5,
                        fontWeight: 300,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "oklch(0.74 0.05 150)",
                          boxShadow: "0 0 7px oklch(0.74 0.07 150)",
                        }}
                      />
                      {item}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 24,
                    paddingTop: 18,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 13.5,
                    color: "rgba(255,255,255,0.48)",
                    fontWeight: 300,
                  }}
                >
                  習熟度は測っていない。
                  <span style={{ color: "rgba(255,255,255,0.72)" }}>
                    本番で動いているか
                  </span>
                  どうかだけを載せている。
                </div>
              </Panel>
            </section>

            {/* PANEL 03 : 稼働中プロジェクト */}
            <section className="glass-panel-lazy" style={{ marginBottom: 112 }}>
              <SectionLabel
                index="03"
                meta="live"
                label="稼働中プロジェクト / projects"
              />
              <Panel padding="12px 34px">
                <ul style={{ listStyle: "none" }}>
                  {PROJECTS.map((p, i) => (
                    <li
                      key={p.name}
                      className="flex justify-between items-start gap-6 flex-wrap"
                      style={{
                        padding: "26px 0",
                        borderBottom:
                          i < PROJECTS.length - 1
                            ? "1px solid rgba(255,255,255,0.06)"
                            : undefined,
                      }}
                    >
                      <div style={{ maxWidth: 560 }}>
                        <div style={{ fontSize: 18, fontWeight: 400 }}>
                          {p.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13.5,
                            color: "rgba(255,255,255,0.5)",
                            marginTop: 6,
                            fontWeight: 300,
                          }}
                        >
                          {p.desc}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span
                          className="inline-flex items-center"
                          style={{
                            gap: 7,
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10,
                            letterSpacing: "0.1em",
                            color:
                              p.status === "RUNNING"
                                ? "oklch(0.78 0.045 150)"
                                : "rgba(255,255,255,0.5)",
                          }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background:
                                p.status === "RUNNING"
                                  ? "oklch(0.74 0.06 150)"
                                  : "rgba(255,255,255,0.5)",
                              boxShadow:
                                p.status === "RUNNING"
                                  ? "0 0 7px oklch(0.74 0.07 150)"
                                  : undefined,
                            }}
                          />
                          {p.status}
                        </span>
                        <div
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10.5,
                            color: "var(--text-dim)",
                            marginTop: 6,
                          }}
                        >
                          {p.meta}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>

            {/* PANEL 04 : エラーコード状態遷移 */}
            <section className="glass-panel-lazy" style={{ marginBottom: 40 }}>
              <SectionLabel
                index="04"
                meta="state"
                label="状態遷移 / recovery"
              />
              <Panel padding="44px 40px">
                <div className="flex flex-col items-center text-center w-full">
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      color: "var(--text-dim)",
                    }}
                  >
                    ERR_STATE · 単一要素の2状態
                  </div>
                  <p className="sr-only">
                    HTTP 402
                    は検知後にキュー退避処理で無効化されます。稼働ログのPATCHで導入した再試行キューが、エラー検知後に自動でリクエストを退避させる仕組みをアニメーションで表現しています。
                  </p>
                  <div aria-hidden="true">
                    <div
                      style={{
                        margin: "26px 0 10px",
                        minHeight: 40,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 22,
                          letterSpacing: "0.02em",
                          color: errActive
                            ? "oklch(0.78 0.06 68)"
                            : "rgba(255,255,255,0.3)",
                          textDecoration: errActive ? "none" : "line-through",
                          opacity: errActive ? 1 : 0.65,
                          transition: motionEnabled
                            ? "color 700ms ease, opacity 700ms ease"
                            : "none",
                        }}
                      >
                        HTTP 402 PAYMENT REQUIRED
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        color: errActive
                          ? "oklch(0.78 0.06 68)"
                          : "oklch(0.78 0.045 150)",
                        border: `1px solid ${errActive ? "oklch(0.62 0.08 68 / 0.5)" : "oklch(0.6 0.06 150 / 0.45)"}`,
                        borderRadius: 999,
                        padding: "4px 12px",
                        transition: motionEnabled ? "all 700ms ease" : "none",
                      }}
                    >
                      {errActive ? "ACTIVE" : "VOID"}
                    </span>
                    <div
                      style={{
                        marginTop: 22,
                        fontSize: 13.5,
                        color: "rgba(255,255,255,0.48)",
                        fontWeight: 300,
                        transition: motionEnabled ? "color .6s ease" : "none",
                      }}
                    >
                      {errActive
                        ? "未処理 · awaiting handler"
                        : "402 → キュー退避で無効化 · handled"}
                    </div>
                  </div>
                </div>
              </Panel>
            </section>
          </div>
        </div>
      </main>

      <footer
        className="mx-auto px-5 sm:px-10 flex justify-between items-center flex-wrap gap-4"
        style={{
          maxWidth: 1060,
          marginTop: 96,
          paddingTop: 22,
          paddingBottom: 40,
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 400 }}>Leels</span>
      </footer>
    </div>
  );
}
