// World-class animations library
// Using Framer Motion variants and GSAP for complex effects

import { Variants, Transition } from 'framer-motion'

// ============================================
// SPRING PHYSICS PRESETS
// ============================================
export const springPhysics = {
  // Snappy - quick and responsive
  snappy: { type: 'spring', stiffness: 500, damping: 30 } as Transition,
  // Bouncy - playful with overshoot
  bouncy: { type: 'spring', stiffness: 400, damping: 15 } as Transition,
  // Smooth - gentle and elegant
  smooth: { type: 'spring', stiffness: 300, damping: 25 } as Transition,
  // Slow - deliberate and smooth
  slow: { type: 'spring', stiffness: 200, damping: 30 } as Transition,
  // Stiff - minimal bounce
  stiff: { type: 'spring', stiffness: 700, damping: 40 } as Transition,
}

// ============================================
// EASE PRESETS
// ============================================
export const easePresets = {
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  easeOutQuart: [0.25, 1, 0.5, 1] as const,
  easeInOutCubic: [0.65, 0, 0.35, 1] as const,
  easeOutBack: [0.34, 1.56, 0.64, 1] as const,
  easeInOutQuint: [0.83, 0, 0.17, 1] as const,
}

// ============================================
// STAGGER CONFIGURATIONS
// ============================================
export const staggerConfig = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.15,
  verySlow: 0.2,
}

// ============================================
// FADE VARIANTS
// ============================================
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: easePresets.easeOutQuart }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easePresets.easeOutExpo }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 }
  }
}

export const fadeSlideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: easePresets.easeOutExpo }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
}

// ============================================
// SCALE VARIANTS
// ============================================
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springPhysics.snappy
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.15 }
  }
}

export const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springPhysics.bouncy
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.2 }
  }
}

// ============================================
// STAGGER CONTAINER VARIANTS
// ============================================
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerConfig.normal,
      delayChildren: 0.1,
    }
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    }
  }
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springPhysics.smooth
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 }
  }
}

// ============================================
// CARD HOVER EFFECTS
// ============================================
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: '0 0 0 rgba(255, 107, 53, 0)'
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: '0 20px 40px rgba(255, 107, 53, 0.15)',
    transition: springPhysics.snappy
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
}

export const liftVariants: Variants = {
  rest: { y: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  hover: {
    y: -8,
    boxShadow: '0 20px 40px rgba(255, 107, 53, 0.2)',
    transition: springPhysics.smooth
  }
}

// ============================================
// SIDEBAR ANIMATIONS
// ============================================
export const sidebarItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: custom * staggerConfig.fast,
      ...springPhysics.snappy
    }
  }),
  exit: { opacity: 0, x: -10 }
}

export const slideIndicatorVariants: Variants = {
  initial: { scaleY: 0, opacity: 0 },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: springPhysics.bouncy
  },
  exit: {
    scaleY: 0,
    opacity: 0,
    transition: { duration: 0.15 }
  }
}

// ============================================
// GLITCH EFFECT (CSS KEYFRAMES)
// ============================================
export const glitchKeyframes = `
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}

@keyframes glitch-skew {
  0% { transform: skew(0deg); }
  10% { transform: skew(2deg); }
  20% { transform: skew(-2deg); }
  30% { transform: skew(1deg); }
  40% { transform: skew(-1deg); }
  50% { transform: skew(0deg); }
  100% { transform: skew(0deg); }
}
`

// ============================================
// PULSE & BREATHING ANIMATIONS
// ============================================
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
}

export const breathingAnimation = {
  scale: [1, 1.02, 1],
  opacity: [0.7, 1, 0.7],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut'
  }
}

export const glowAnimation = {
  boxShadow: [
    '0 0 0 rgba(255, 107, 53, 0)',
    '0 0 20px rgba(255, 107, 53, 0.4)',
    '0 0 0 rgba(255, 107, 53, 0)'
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
}

// ============================================
// BORDER ANIMATIONS
// ============================================
export const pulsingBorderVariants: Variants = {
  inactive: {
    borderColor: 'rgba(255, 107, 53, 0)',
    boxShadow: '0 0 0 rgba(255, 107, 53, 0)'
  },
  active: {
    borderColor: ['rgba(255, 107, 53, 0.3)', 'rgba(255, 107, 53, 0.8)', 'rgba(255, 107, 53, 0.3)'],
    boxShadow: [
      'inset 0 0 0 1px rgba(255, 107, 53, 0.2)',
      'inset 0 0 0 2px rgba(255, 107, 53, 0.5)',
      'inset 0 0 0 1px rgba(255, 107, 53, 0.2)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// ============================================
// COUNTER ANIMATION HOOK HELPER
// ============================================
export const counterConfig = {
  duration: 1.5,
  ease: [0.16, 1, 0.3, 1] as const,
}

// ============================================
// DRAW ON SCROLL VARIANTS
// ============================================
export const drawLineVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.5, ease: 'easeInOut' },
      opacity: { duration: 0.3 }
    }
  }
}

// ============================================
// TIMELINE ANIMATIONS
// ============================================
export const timelineItemVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: (custom: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: custom * 0.15,
      duration: 0.5,
      ease: easePresets.easeOutExpo
    }
  })
}

// ============================================
// ACCORDION VARIANTS
// ============================================
export const accordionVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: easePresets.easeInOutCubic }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.4, ease: easePresets.easeOutExpo }
  }
}

// ============================================
// DRAG AND DROP
// ============================================
export const dragItemVariants: Variants = {
  idle: { scale: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  dragging: {
    scale: 1.05,
    boxShadow: '0 20px 40px rgba(255, 107, 53, 0.3)',
    cursor: 'grabbing',
    transition: springPhysics.snappy
  }
}

// ============================================
// CHECKMARK ANIMATION
// ============================================
export const checkmarkVariants: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.4, ease: 'easeOut' },
      opacity: { duration: 0.1 }
    }
  }
}

// ============================================
// FLIP COUNTER ANIMATION
// ============================================
export const flipNumberVariants: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: easePresets.easeOutBack }
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

// ============================================
// SHIMMER SKELETON
// ============================================
export const shimmerKeyframes = `
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
`

// ============================================
// PARALLAX HELPERS
// ============================================
export const createParallaxStyle = (
  mouseX: number,
  mouseY: number,
  intensity: number = 10
) => ({
  transform: `translate(${mouseX * intensity}px, ${mouseY * intensity}px)`,
  transition: 'transform 0.2s ease-out'
})

// ============================================
// LIVE INDICATOR
// ============================================
export const liveIndicatorVariants: Variants = {
  pulse: {
    scale: [1, 1.5, 1],
    opacity: [1, 0.5, 1],
    boxShadow: [
      '0 0 0 0 rgba(255, 107, 53, 0.7)',
      '0 0 0 10px rgba(255, 107, 53, 0)',
      '0 0 0 0 rgba(255, 107, 53, 0)'
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// ============================================
// NUMBER COUNTER UTILITY
// ============================================
export const animateNumber = (
  start: number,
  end: number,
  duration: number,
  onUpdate: (value: number) => void
) => {
  const startTime = performance.now()

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Ease out expo
    const eased = 1 - Math.pow(2, -10 * progress)
    const current = Math.round(start + (end - start) * eased)

    onUpdate(current)

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}

// ============================================
// GSAP ANIMATION HELPERS
// ============================================
export const gsapConfig = {
  // Timeline draw animation
  drawTimeline: {
    ease: 'power3.out',
    duration: 1.5,
  },
  // Parallax
  parallax: {
    ease: 'power1.out',
    duration: 0.5,
  },
  // Glitch effect
  glitch: {
    duration: 0.3,
    repeat: 2,
    ease: 'steps(5)',
  }
}

// ============================================
// PROGRESS BAR SPRING
// ============================================
export const progressBarSpring: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 15,
  mass: 0.5,
}

// ============================================
// MODAL VARIANTS
// ============================================
export const modalOverlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, delay: 0.1 }
  }
}

export const modalContentVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springPhysics.snappy
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.2 }
  }
}

// ============================================
// NOTIFICATION VARIANTS
// ============================================
export const notificationVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springPhysics.bouncy
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
}

const animations = {
  springPhysics,
  easePresets,
  staggerConfig,
  fadeVariants,
  fadeUpVariants,
  fadeSlideLeftVariants,
  scaleVariants,
  popVariants,
  staggerContainerVariants,
  staggerItemVariants,
  cardHoverVariants,
  liftVariants,
  sidebarItemVariants,
  slideIndicatorVariants,
  pulseAnimation,
  breathingAnimation,
  glowAnimation,
  pulsingBorderVariants,
  drawLineVariants,
  timelineItemVariants,
  accordionVariants,
  dragItemVariants,
  checkmarkVariants,
  flipNumberVariants,
  liveIndicatorVariants,
  modalOverlayVariants,
  modalContentVariants,
  notificationVariants,
  progressBarSpring,
  counterConfig,
  gsapConfig,
  animateNumber,
  createParallaxStyle,
}

export default animations
