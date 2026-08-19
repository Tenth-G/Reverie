import { usePlayerStore } from '../store/playerStore'

export default function Toasts() {
  const toasts = usePlayerStore((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
}
