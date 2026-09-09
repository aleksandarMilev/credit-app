import { useEffect, useState } from 'react'
import { animate, useMotionValue, useReducedMotion } from 'framer-motion'
import { formatCurrency } from '@/lib/formatCurrency'

interface AnimatedCurrencyProps {
  value: number
}

const COUNT_UP_DURATION_SECONDS = 0.5
const COUNT_UP_EASE = [0.22, 1, 0.36, 1] as const

export const AnimatedCurrency = ({ value }: AnimatedCurrencyProps) => {
  const shouldReduceMotion = useReducedMotion()
  const count = useMotionValue(value)
  const [animatedValue, setAnimatedValue] = useState(value)

  useEffect(() => {
    if (shouldReduceMotion) {
      count.set(value)
      return
    }

    const controls = animate(count, value, {
      duration: COUNT_UP_DURATION_SECONDS,
      ease: COUNT_UP_EASE,
      onUpdate: setAnimatedValue,
    })

    return () => {
      controls.stop()
    }
  }, [value, shouldReduceMotion, count])

  const displayValue = shouldReduceMotion ? value : animatedValue

  return <span>{formatCurrency(displayValue)}</span>
}
