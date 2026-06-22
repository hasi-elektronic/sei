import { useEffect, useRef, useState } from 'react'
import { useStepsStore } from '../store/stepsStore'

// Accelerometer-based step detection
export function usePedometer() {
  const { addSteps, isTracking, startTracking, stopTracking } = useStepsStore()
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown')
  const lastAcc = useRef({ x: 0, y: 0, z: 0 })
  const lastStep = useRef(0)
  const buffer = useRef<number[]>([])
  const THRESHOLD = 1.8  // acceleration delta threshold
  const COOLDOWN = 300   // ms between steps

  useEffect(() => {
    setSupported(typeof DeviceMotionEvent !== 'undefined')
  }, [])

  const handleMotion = (e: DeviceMotionEvent) => {
    const acc = e.accelerationIncludingGravity
    if (!acc?.x || !acc?.y || !acc?.z) return

    const delta = Math.sqrt(
      Math.pow(acc.x - lastAcc.current.x, 2) +
      Math.pow(acc.y - lastAcc.current.y, 2) +
      Math.pow(acc.z - lastAcc.current.z, 2)
    )

    lastAcc.current = { x: acc.x, y: acc.y, z: acc.z }

    // Simple peak detection
    buffer.current.push(delta)
    if (buffer.current.length > 5) buffer.current.shift()
    const avg = buffer.current.reduce((a, b) => a + b, 0) / buffer.current.length

    const now = Date.now()
    if (avg > THRESHOLD && now - lastStep.current > COOLDOWN) {
      lastStep.current = now
      addSteps(1)
    }
  }

  const requestPermission = async () => {
    // iOS 13+ requires explicit permission
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const result = await (DeviceMotionEvent as any).requestPermission()
        setPermission(result === 'granted' ? 'granted' : 'denied')
        return result === 'granted'
      } catch {
        setPermission('denied')
        return false
      }
    }
    // Android — no permission needed
    setPermission('granted')
    return true
  }

  const start = async () => {
    const ok = await requestPermission()
    if (!ok) return false
    window.addEventListener('devicemotion', handleMotion)
    startTracking()
    return true
  }

  const stop = () => {
    window.removeEventListener('devicemotion', handleMotion)
    stopTracking()
  }

  useEffect(() => {
    return () => { window.removeEventListener('devicemotion', handleMotion) }
  }, [])

  return { supported, permission, isTracking, start, stop }
}
