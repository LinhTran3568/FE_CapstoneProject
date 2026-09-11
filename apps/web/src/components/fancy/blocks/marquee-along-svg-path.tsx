import React, { RefObject, useCallback, useEffect, useRef } from "react"
import {
  motion,
  MotionValue,
  SpringOptions,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"

import { cn } from "@/lib/utils"

// Fast modulo wrap
const wrap = (min: number, max: number, value: number): number => {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

type PreserveAspectRatioAlign =
  | "none"
  | "xMinYMin"
  | "xMidYMin"
  | "xMaxYMin"
  | "xMinYMid"
  | "xMidYMid"
  | "xMaxYMid"
  | "xMinYMax"
  | "xMidYMax"
  | "xMaxYMax"

interface CSSVariableInterpolation {
  property: string
  from: number | string
  to: number | string
}

type PreserveAspectRatioMeetOrSlice = "meet" | "slice"

type PreserveAspectRatio =
  | PreserveAspectRatioAlign
  | `${Exclude<PreserveAspectRatioAlign, "none">} ${PreserveAspectRatioMeetOrSlice}`

export interface MarqueeAlongSvgPathProps {
  children: React.ReactNode
  className?: string

  // Path properties
  path: string
  pathId?: string
  preserveAspectRatio?: PreserveAspectRatio
  showPath?: boolean

  // SVG properties
  width?: string | number
  height?: string | number
  viewBox?: string

  // Marquee properties
  baseVelocity?: number
  direction?: "normal" | "reverse"
  easing?: (value: number) => number
  slowdownOnHover?: boolean
  slowDownFactor?: number
  slowDownSpringConfig?: SpringOptions

  // Scroll properties
  useScrollVelocity?: boolean
  scrollAwareDirection?: boolean
  scrollSpringConfig?: SpringOptions
  scrollContainer?: RefObject<HTMLElement | null> | HTMLElement | null

  // Item repetition
  repeat?: number

  // Drag properties
  draggable?: boolean
  dragSensitivity?: number
  dragVelocityDecay?: number
  dragAwareDirection?: boolean
  grabCursor?: boolean

  // Z-index properties
  enableRollingZIndex?: boolean
  zIndexBase?: number
  zIndexRange?: number

  cssVariableInterpolation?: CSSVariableInterpolation[]

  // Responsive properties
  responsive?: boolean
}

interface MarqueeItemProps {
  child: React.ReactNode
  itemIndex: number
  totalItems: number
  repeatIndex: number
  baseOffset: MotionValue<number>
  path: string
  enableRollingZIndex: boolean
  zIndexBase: number
  zIndexRange: number
  easing?: (value: number) => number
  draggable: boolean
  grabCursor: boolean
  cssVariableInterpolation?: CSSVariableInterpolation[]
  onMouseEnter: () => void
  onMouseLeave: () => void
}

const MarqueeItem: React.FC<MarqueeItemProps> = ({
  child,
  itemIndex,
  totalItems,
  repeatIndex,
  baseOffset,
  path,
  enableRollingZIndex,
  zIndexBase,
  zIndexRange,
  easing,
  draggable,
  grabCursor,
  cssVariableInterpolation = [],
  onMouseEnter,
  onMouseLeave,
}) => {
  // Pure math transformation - zero string regex, zero useEffect overhead!
  const progress = useTransform(baseOffset, (v) => {
    const position = (itemIndex * 100) / totalItems
    const wrappedValue = wrap(0, 100, v + position)
    return easing ? easing(wrappedValue / 100) * 100 : wrappedValue
  })

  const itemOffset = useTransform(progress, (p) => `${p}%`)

  const zIndex = useTransform(progress, (p) => {
    if (!enableRollingZIndex) return undefined
    return Math.floor(zIndexBase + (p / 100) * zIndexRange)
  })

  const cssVariables = Object.fromEntries(
    cssVariableInterpolation.map(({ property, from, to }) => [
      property,
      useTransform(progress, [0, 100], [from, to]),
    ])
  )

  return (
    <motion.div
      className={cn(
        "absolute top-0 left-0 will-change-transform",
        draggable && grabCursor && "cursor-grab"
      )}
      style={{
        offsetPath: `path('${path}')`,
        offsetDistance: itemOffset,
        zIndex: enableRollingZIndex ? zIndex : undefined,
        backfaceVisibility: "hidden",
        transform: "translate3d(0, 0, 0)",
        ...cssVariables,
      }}
      aria-hidden={repeatIndex > 0}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {child}
    </motion.div>
  )
}

export const MarqueeAlongSvgPath = ({
  children,
  className,

  // Path defaults
  path,
  pathId,
  preserveAspectRatio = "xMidYMid meet",
  showPath = false,

  // SVG defaults
  width = "100%",
  height = "100%",
  viewBox = "0 0 100 100",

  // Marquee defaults
  baseVelocity = 5,
  direction = "normal",
  easing,
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  slowDownSpringConfig = { damping: 50, stiffness: 400 },

  // Scroll defaults
  useScrollVelocity = false,
  scrollAwareDirection = false,
  scrollSpringConfig = { damping: 50, stiffness: 400 },
  scrollContainer,

  // Items repetition
  repeat = 2,

  // Drag defaults
  draggable = false,
  dragSensitivity = 0.2,
  dragVelocityDecay = 0.96,
  dragAwareDirection = false,
  grabCursor = false,

  // Z-index defaults
  enableRollingZIndex = true,
  zIndexBase = 1,
  zIndexRange = 10,

  cssVariableInterpolation = [],

  // Responsive defaults
  responsive = false,
}: MarqueeAlongSvgPathProps) => {
  const container = useRef<HTMLDivElement>(null)
  const marqueeContainerRef = useRef<HTMLDivElement>(null)
  const baseOffset = useMotionValue(0)

  // Responsive scaling using direct DOM manipulation (no React re-renders)
  useEffect(() => {
    if (!responsive) return

    const [, , vbWidth, vbHeight] = viewBox.split(" ").map(Number)
    const originalWidth = vbWidth || 100
    const originalHeight = vbHeight || 100

    let rafId: number
    const updateScale = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const wrapper = container.current
        const marqueeContainer = marqueeContainerRef.current
        if (!wrapper || !marqueeContainer) return

        const wrapperWidth = wrapper.clientWidth
        const wrapperHeight = wrapper.clientHeight

        const scaleX = wrapperWidth / originalWidth
        const scale = scaleX

        const scaledWidth = originalWidth * scale
        const scaledHeight = originalHeight * scale

        const offsetX = 0
        const offsetY = (wrapperHeight - scaledHeight) / 2

        marqueeContainer.style.width = `${originalWidth}px`
        marqueeContainer.style.height = `${originalHeight}px`
        marqueeContainer.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`
        marqueeContainer.style.transformOrigin = "top left"
      })
    }

    updateScale()
    window.addEventListener("resize", updateScale, { passive: true })
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", updateScale)
    }
  }, [responsive, viewBox])

  // Flatten items
  const items = React.useMemo(() => {
    const childrenArray = React.Children.toArray(children)

    return childrenArray.flatMap((child, childIndex) =>
      Array.from({ length: repeat }, (_, repeatIndex) => {
        const itemIndex = repeatIndex * childrenArray.length + childIndex
        const key = `${childIndex}-${repeatIndex}`
        return {
          child,
          childIndex,
          repeatIndex,
          itemIndex,
          key,
        }
      })
    )
  }, [children, repeat])

  // Generate ID
  const id = useRef(pathId || `marquee-path-${Math.random().toString(36).substring(7)}`).current

  // Optional Scroll tracking
  const { scrollY } = useScroll(
    useScrollVelocity
      ? { container: (scrollContainer as RefObject<HTMLDivElement | null>) || container }
      : {}
  )

  const scrollVelocity = useVelocity(scrollY)
  const smoothVelocity = useSpring(scrollVelocity, scrollSpringConfig)

  // Hover and drag state tracking
  const isHovered = useRef(false)
  const isDragging = useRef(false)
  const dragVelocity = useRef(0)
  const directionFactor = useRef(direction === "normal" ? 1 : -1)

  const hoverFactorValue = useMotionValue(1)
  const defaultVelocity = useMotionValue(1)
  const smoothHoverFactor = useSpring(hoverFactorValue, slowDownSpringConfig)

  const velocityFactor = useTransform(
    useScrollVelocity ? smoothVelocity : defaultVelocity,
    [0, 1000],
    [0, 5],
    { clamp: false }
  )

  // Animation frame handler
  useAnimationFrame((_, delta) => {
    if (isDragging.current && draggable) {
      baseOffset.set(baseOffset.get() + dragVelocity.current)
      dragVelocity.current *= 0.92

      if (Math.abs(dragVelocity.current) < 0.01) {
        dragVelocity.current = 0
      }
      return
    }

    if (isHovered.current) {
      hoverFactorValue.set(slowdownOnHover ? slowDownFactor : 1)
    } else {
      hoverFactorValue.set(1)
    }

    // Clamp delta to prevent huge jumps when tab is in background
    const clampedDelta = Math.min(delta, 64)
    let moveBy =
      directionFactor.current *
      baseVelocity *
      (clampedDelta / 1000) *
      smoothHoverFactor.get()

    if (useScrollVelocity && scrollAwareDirection && !isDragging.current) {
      const vf = velocityFactor.get()
      if (vf < 0) directionFactor.current = -1
      else if (vf > 0) directionFactor.current = 1
    }

    if (useScrollVelocity) {
      moveBy += directionFactor.current * moveBy * velocityFactor.get()
    }

    if (draggable) {
      moveBy += dragVelocity.current
      if (dragAwareDirection && Math.abs(dragVelocity.current) > 0.1) {
        directionFactor.current = Math.sign(dragVelocity.current)
      }
      if (!isDragging.current && Math.abs(dragVelocity.current) > 0.01) {
        dragVelocity.current *= dragVelocityDecay
      } else if (!isDragging.current) {
        dragVelocity.current = 0
      }
    }

    baseOffset.set(baseOffset.get() + moveBy)
  })

  // Pointer events
  const lastPointerPosition = useRef({ x: 0, y: 0 })

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!draggable) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    if (grabCursor) {
      ;(e.currentTarget as HTMLElement).style.cursor = "grabbing"
    }
    isDragging.current = true
    lastPointerPosition.current = { x: e.clientX, y: e.clientY }
    dragVelocity.current = 0
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggable || !isDragging.current) return
    const currentPosition = { x: e.clientX, y: e.clientY }
    const deltaX = currentPosition.x - lastPointerPosition.current.x
    const deltaY = currentPosition.y - lastPointerPosition.current.y
    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const projectedDelta = deltaX > 0 ? delta : -delta

    dragVelocity.current = projectedDelta * dragSensitivity
    lastPointerPosition.current = currentPosition
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggable) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
    isDragging.current = false
    if (grabCursor) {
      ;(e.currentTarget as HTMLElement).style.cursor = "grab"
    }
  }

  const handleItemMouseEnter = useCallback(() => {
    isHovered.current = true
  }, [])

  const handleItemMouseLeave = useCallback(() => {
    isHovered.current = false
  }, [])

  return (
    <div
      ref={container}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={cn("relative overflow-visible select-none", className)}
    >
      <div
        ref={marqueeContainerRef}
        className="relative overflow-visible"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={height}
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          className="w-full h-full pointer-events-none"
        >
          <path
            id={id}
            d={path}
            stroke={showPath ? "rgba(56, 189, 248, 0.25)" : "none"}
            strokeWidth={showPath ? 2 : 0}
            strokeDasharray={showPath ? "6 6" : undefined}
            fill="none"
          />
        </svg>

        {items.map(({ child, repeatIndex, itemIndex, key }) => (
          <MarqueeItem
            key={key}
            child={child}
            itemIndex={itemIndex}
            totalItems={items.length}
            repeatIndex={repeatIndex}
            baseOffset={baseOffset}
            path={path}
            enableRollingZIndex={enableRollingZIndex}
            zIndexBase={zIndexBase}
            zIndexRange={zIndexRange}
            easing={easing}
            draggable={draggable}
            grabCursor={grabCursor}
            cssVariableInterpolation={cssVariableInterpolation}
            onMouseEnter={handleItemMouseEnter}
            onMouseLeave={handleItemMouseLeave}
          />
        ))}
      </div>
    </div>
  )
}

export default MarqueeAlongSvgPath
