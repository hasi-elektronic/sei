import { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'

export function useFastingTimer() {
  const { fastingActive, fastingStart, toggleFasting } = useAppStore()
  const [elapsed, setElapsed] = useState(0) // seconds

  useEffect(() => {
    if (!fastingActive || !fastingStart) {
      setElapsed(0)
      return
    }
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(fastingStart).getTime()) / 1000)
      setElapsed(diff)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [fastingActive, fastingStart])

  const FAST_GOAL = 20 * 3600 // 20 hours in seconds

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const remaining = Math.max(0, FAST_GOAL - elapsed)
  const progress = Math.min(100, (elapsed / FAST_GOAL) * 100)
  const isComplete = elapsed >= FAST_GOAL

  return {
    fastingActive,
    elapsed,
    remaining,
    progress,
    isComplete,
    elapsedFormatted: formatTime(elapsed),
    remainingFormatted: formatTime(remaining),
    toggleFasting,
  }
}
