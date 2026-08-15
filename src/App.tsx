import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Mood = 'bright' | 'steady' | 'heavy' | 'restless'

interface Entry {
  date: string
  mood: Mood
  note: string
}

const STORAGE_KEY = 'lumen-entries-v1'

const MOODS: { id: Mood; label: string; hint: string }[] = [
  { id: 'bright', label: 'Bright', hint: 'Light and open' },
  { id: 'steady', label: 'Steady', hint: 'Grounded enough' },
  { id: 'heavy', label: 'Heavy', hint: 'Carrying a lot' },
  { id: 'restless', label: 'Restless', hint: 'Mind won’t sit still' },
]

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Entry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatLongDate(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function toKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function streakFrom(entries: Entry[], today: string) {
  const set = new Set(entries.map((e) => e.date))
  let count = 0
  const cursor = new Date(`${today}T12:00:00`)
  while (set.has(toKey(cursor))) {
    count += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export default function App() {
  const today = todayKey()
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries())
  const [mood, setMood] = useState<Mood>('steady')
  const [note, setNote] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)

  const todayEntry = useMemo(
    () => entries.find((e) => e.date === today),
    [entries, today],
  )

  useEffect(() => {
    if (todayEntry) {
      setMood(todayEntry.mood)
      setNote(todayEntry.note)
    }
  }, [todayEntry])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const streak = streakFrom(entries, today)
  const history = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12),
    [entries],
  )

  const save = () => {
    const next: Entry = { date: today, mood, note: note.trim() }
    setEntries((prev) => {
      const without = prev.filter((e) => e.date !== today)
      return [...without, next]
    })
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden="true">
        <div className="glow glow-a" />
        <div className="glow glow-b" />
        <div className="horizon" />
      </div>

      <header className="top">
        <p className="brand">Lumen</p>
        <p className="date">{formatLongDate(today)}</p>
      </header>

      <main className="stage">
        <section className="today">
          <h1>How is today landing?</h1>
          <p className="lede">Pick a mood, leave one note. That’s enough.</p>

          <div className="moods" role="radiogroup" aria-label="Mood">
            {MOODS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mood === m.id}
                className={`mood mood--${m.id} ${mood === m.id ? 'is-active' : ''}`}
                onClick={() => setMood(m.id)}
              >
                <span className="mood-label">{m.label}</span>
                <span className="mood-hint">{m.hint}</span>
              </button>
            ))}
          </div>

          <label className="note-label" htmlFor="note">
            Today’s note
          </label>
          <textarea
            id="note"
            className="note"
            rows={5}
            maxLength={600}
            placeholder="What stayed with you?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <div className="actions">
            <button type="button" className="save" onClick={save}>
              {todayEntry ? 'Update today' : 'Save today'}
            </button>
            <span className={`flash ${savedFlash ? 'is-on' : ''}`} aria-live="polite">
              Saved locally
            </span>
          </div>
        </section>

        <aside className="side">
          <div className="stat">
            <span className="stat-value">{streak}</span>
            <span className="stat-label">day streak</span>
          </div>

          <div className="history">
            <h2>Recent</h2>
            {history.length === 0 ? (
              <p className="empty">No entries yet. Today can be the first.</p>
            ) : (
              <ul>
                {history.map((entry) => (
                  <li key={entry.date}>
                    <div className="hist-top">
                      <span className="hist-date">{formatLongDate(entry.date)}</span>
                      <span className={`pill pill--${entry.mood}`}>
                        {MOODS.find((m) => m.id === entry.mood)?.label}
                      </span>
                    </div>
                    <p>{entry.note || '—'}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  )
}
