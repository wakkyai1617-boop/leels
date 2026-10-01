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

type LabKey = 'ae' | 'bl'

/**
 * Study output. Omit until a real file exists — the tile then says
 * "PREVIEW PENDING" instead of implying a video/render is there.
 * Videos should always carry a poster so nothing heavy loads up front.
 */
export type LabMedia =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string; poster: string; label: string }

export type LabLog = {
  k: LabKey
  date: string
  title: string
  learned: string
  practice: string
  media?: LabMedia
  wip?: boolean
}

/** Newest first. All logs are listed. */
export const labLogs: LabLog[] = [
  { k: 'ae', date: '2026.09', title: 'Kinetic Type Study 03', learned: '文字単位のディレイで、読みやすさを保ったまま動きを付ける方法。', practice: 'キネティックタイポグラフィ', wip: true },
  { k: 'bl', date: '2026.08', title: 'Room Study 01', learned: 'ライトの位置と強さで、空間の奥行きが大きく変わること。', practice: '室内空間のモデリングとライティング', wip: true },
  { k: 'ae', date: '2026.07', title: 'Shape Loop Study 02', learned: '継ぎ目の見えないループの作り方。', practice: 'シェイプレイヤーのループ' },
  { k: 'bl', date: '2026.06', title: 'Material Study 02', learned: '質感の違いを光で見せる。', practice: 'マテリアル表現の基礎' },
]

export const labGroups: { k: LabKey; code: string; name: string; field: string; study: string }[] = [
  { k: 'ae', code: 'AE', name: 'After Effects', field: 'Motion Graphics', study: 'MOTION STUDY' },
  { k: 'bl', code: 'BL', name: 'Blender', field: '3D Modeling', study: '3D STUDY' },
]

export const webSkills = ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Git / GitHub', 'AI Workflow']

/** Work email, shown in full in Contact as a mailto: link. */
export const email = 'heike.walking.1617@gmail.com'

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
