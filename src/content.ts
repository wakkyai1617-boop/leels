/** Site copy and data. Replace the placeholder works/contacts with real ones here. */

export type WebWork = {
  name: string
  /** Large word set on the placeholder cover when there's no screenshot. */
  cover: string
  year: string
  cat: string
  role: string
  stack: string
  desc: string
  /**
   * Public URL of the live site or case page. Leave unset until it exists:
   * the card then renders without links or "View case".
   */
  href?: string
  /** Screenshot (16:10). Falls back to the grid placeholder. */
  image?: string
}

export const webWorks: WebWork[] = [
  { name: 'KIRAMEKI ART UNIVERSITY', cover: 'Art Univ.', year: '2026', cat: 'University Site', role: 'Plan / Design / Dev', stack: 'Next.js · TypeScript · Tailwind CSS', desc: '架空の美術大学「綺羅目芸術大学」のサイト。「世界を、もっと派手に壊せ。」をコピーに、ビビッドな配色とコラージュ表現で学科・キャンパス・オープンキャンパス情報を構成。', href: 'https://kirameki-art-university.vercel.app/', image: '/assets/works/kirameki.webp' },
  { name: 'seven — Work Beyond Roles', cover: 'seven', year: '2026', cat: 'Corporate Site', role: 'Plan / Design / Dev', stack: 'Next.js', desc: '架空のクリエイティブチーム「seven」のコーポレートサイト。「役割を人に合わせる」という考え方を軸に、事業・実績・メンバー・採用までを落ち着いたトーンで設計。', href: 'https://seven-three-beta.vercel.app/', image: '/assets/works/seven.webp' },
  { name: 'NESTA WORKS', cover: 'Coworking', year: '2026', cat: 'Service Site', role: 'Plan / Design / Dev', stack: 'Next.js · TypeScript · Tailwind CSS', desc: '架空の都市型コワーキングスペース「NESTA WORKS」のサービスサイト。利用者の悩みから設備・空間・料金プラン・FAQへと、見学予約につながる流れで情報を整理。', href: 'https://nesta-works.vercel.app/', image: '/assets/works/nesta.webp' },
]

export const webSkills = ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Git / GitHub', 'AI Workflow']

/** Header "ご連絡はこちら": opens an Instagram DM thread (official ig.me short link). */
export const contactDm = 'https://ig.me/m/teel_0016'

/**
 * SNS links, shown as "@handle" (note: "/handle") in Contact and the mobile menu.
 * Change the handle and url together when an account changes.
 */
export type Social = { label: string; icon: string; handle: string; url: string }

export const contacts: Social[] = [
  { label: 'Instagram', icon: '/assets/sns/ig.webp', handle: '@teel_0016', url: 'https://www.instagram.com/teel_0016/' },
  { label: 'X', icon: '/assets/sns/x.webp', handle: '@twmjdjpjd', url: 'https://x.com/twmjdjpjd' },
  { label: 'note', icon: '/assets/sns/note.webp', handle: '/leal_maron0681', url: 'https://note.com/leal_maron0681' },
]

/** Hero icon (1:1). Set to e.g. '/assets/icon.png' once added to public/. */
export const heroIcon: string | null = '/assets/icon.webp'
