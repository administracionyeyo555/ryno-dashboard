'use client'

import { useEffect, useRef, createContext, useContext, ReactNode } from 'react'
import Lenis from '@studio-freight/lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

// ============================================
// LENIS CONTEXT
// ============================================
interface LenisContextType {
  lenis: Lenis | null
  scrollTo: (target: string | number | HTMLElement, options?: {
    offset?: number
    duration?: number
    immediate?: boolean
  }) => void
}

const LenisContext = createContext<LenisContextType>({
  lenis: null,
  scrollTo: () => {}
})

export const useLenis = () => useContext(LenisContext)

// ============================================
// ANIMATION PROVIDER
// ============================================
interface AnimationProviderProps {
  children: ReactNode
}

export function AnimationProvider({ children }: AnimationProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    lenisRef.current = lenis

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })

    gsap.ticker.lagSmoothing(0)

    // Animation frame loop
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    // Cleanup
    return () => {
      lenis.destroy()
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000)
      })
    }
  }, [])

  const scrollTo = (
    target: string | number | HTMLElement,
    options?: {
      offset?: number
      duration?: number
      immediate?: boolean
    }
  ) => {
    lenisRef.current?.scrollTo(target, options)
  }

  return (
    <LenisContext.Provider value={{ lenis: lenisRef.current, scrollTo }}>
      {children}
    </LenisContext.Provider>
  )
}

// ============================================
// SCROLL ANIMATIONS HOOK
// ============================================
export function useScrollAnimation(
  ref: React.RefObject<HTMLElement>,
  animation: gsap.TweenVars,
  options?: {
    trigger?: string | HTMLElement
    start?: string
    end?: string
    scrub?: boolean | number
    markers?: boolean
    once?: boolean
  }
) {
  useEffect(() => {
    if (!ref.current) return

    const tween = gsap.from(ref.current, {
      ...animation,
      scrollTrigger: {
        trigger: options?.trigger || ref.current,
        start: options?.start || 'top 80%',
        end: options?.end || 'bottom 20%',
        scrub: options?.scrub ?? false,
        markers: options?.markers ?? false,
        once: options?.once ?? true,
      }
    })

    return () => {
      tween.kill()
    }
  }, [ref, animation, options])
}

// ============================================
// PARALLAX HOOK
// ============================================
export function useParallax(
  ref: React.RefObject<HTMLElement>,
  speed: number = 0.5
) {
  useEffect(() => {
    if (!ref.current) return

    const element = ref.current

    gsap.to(element, {
      y: () => window.innerHeight * speed * -1,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      }
    })

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [ref, speed])
}

// ============================================
// DRAW ON SCROLL HOOK
// ============================================
export function useDrawOnScroll(
  svgRef: React.RefObject<SVGPathElement>,
  options?: {
    start?: string
    end?: string
    scrub?: boolean | number
  }
) {
  useEffect(() => {
    if (!svgRef.current) return

    const path = svgRef.current
    const length = path.getTotalLength()

    // Set initial state
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length,
    })

    // Animate on scroll
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: path,
        start: options?.start || 'top 80%',
        end: options?.end || 'bottom 20%',
        scrub: options?.scrub ?? 1,
      }
    })

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [svgRef, options])
}

// ============================================
// STAGGER REVEAL HOOK
// ============================================
export function useStaggerReveal(
  containerRef: React.RefObject<HTMLElement>,
  itemSelector: string,
  options?: {
    start?: string
    stagger?: number
    y?: number
    duration?: number
  }
) {
  useEffect(() => {
    if (!containerRef.current) return

    const items = containerRef.current.querySelectorAll(itemSelector)

    gsap.from(items, {
      opacity: 0,
      y: options?.y ?? 30,
      duration: options?.duration ?? 0.6,
      stagger: options?.stagger ?? 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: containerRef.current,
        start: options?.start || 'top 80%',
        once: true,
      }
    })

    return () => {
      ScrollTrigger.getAll().forEach(st => st.kill())
    }
  }, [containerRef, itemSelector, options])
}

export default AnimationProvider
