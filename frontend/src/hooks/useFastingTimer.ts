import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'

export function useFastingTimer() {
  const { fastingActive, fastingStart, toggleFasting } = useAppStore()
  const [elapsed, setElapsed] = useState(0)
  const GOAL = 20 * 3600

  useEffect(() => {
    if (!fastingActive || !fastingStart) { setElapsed(0); return }
    const update = () => {
      setElapsed(Math.floor((Date.now() - new Date(fastingStart).getTime()) / 1000))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [fastingActive, fastingStart])

  // Browser notification when goal reached
  useEffect(() => {
    if (fastingActive && elapsed === GOAL) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('清 SEI — Ziel erreicht! 🎉', {
          body: '20 Stunden Fasten geschafft! Du kannst jetzt essen.',
          icon: '/favicon.svg',
        })
      }
    }
  }, [elapsed, fastingActive])

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const remaining = Math.max(0, GOAL - elapsed)
  const progress = Math.min(100, (elapsed / GOAL) * 100)

  return {
    fastingActive,
    elapsed,
    remaining,
    progress,
    isComplete: elapsed >= GOAL,
    elapsedFormatted: fmt(elapsed),
    remainingFormatted: fmt(remaining),
    toggleFasting,
  }
}
