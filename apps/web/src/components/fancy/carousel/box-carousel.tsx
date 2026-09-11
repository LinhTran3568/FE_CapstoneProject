"use client"

import React, {
  forwardRef,
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react"

import { cn } from "@/lib/utils"

export interface CarouselItem {
  id: string
  type: "image" | "video" | "custom"
  src?: string
  alt?: string
  poster?: string
  content?: ReactNode
}

interface FaceProps {
  transform: string
  width: number
  height: number
  className?: string
  children?: ReactNode
}

const CubeFace = memo(
  ({ transform, width, height, className, children }: FaceProps) => (
    <div
      className={cn(
        "absolute top-0 left-0 overflow-hidden [backface-visibility:hidden] [transform-style:preserve-3d]",
        className
      )}
      style={{
        transform,
        width,
        height,
      }}
    >
      {children}
    </div>
  )
)

CubeFace.displayName = "CubeFace"

const MediaRenderer = memo(({ item }: { item?: CarouselItem }) => {
  if (!item) return null

  if (item.content) {
    return <div className="w-full h-full select-none">{item.content}</div>
  }

  if (item.type === "video" && item.src) {
    return (
      <video
        src={item.src}
        poster={item.poster}
        className="w-full h-full object-cover select-none"
        muted
        loop
        autoPlay
      />
    )
  }

  if (item.src) {
    return (
      <img
        src={item.src}
        alt={item.alt || ""}
        draggable={false}
        className="w-full h-full object-cover select-none"
      />
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center border text-2xl font-mono text-white select-none">
      {item.id}
    </div>
  )
})

MediaRenderer.displayName = "MediaRenderer"

export interface BoxCarouselRef {
  next: () => void
  prev: () => void
  rotateToStep1: (onHalfway?: () => void) => void
  trigger360Spin: (onHalfway?: () => void) => void
  getCurrentItemIndex: () => number
}

export interface BoxCarouselProps extends React.HTMLProps<HTMLDivElement> {
  items: CarouselItem[]
  width: number
  height: number
  className?: string
  perspective?: number
  onIndexChange?: (index: number) => void
  enableDrag?: boolean
  dragSensitivity?: number
}

const BoxCarousel = forwardRef<BoxCarouselRef, BoxCarouselProps>(
  (
    {
      items,
      width,
      height,
      className,
      perspective = 1100,
      onIndexChange,
      enableDrag = true,
      dragSensitivity = 0.5,
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion()
    const isRotating = useRef(false)
    const isDragging = useRef(false)
    const startPosition = useRef({ x: 0, y: 0 })
    const startRotation = useRef(0)

    const baseRotateY = useMotionValue(0)
    const springRotateY = useSpring(baseRotateY, { stiffness: 220, damping: 28 })

    const [currentRotation, setCurrentRotation] = useState(0)

    // Compute active step (0, 1, 2, 3) from rotation angle
    const getStepFromRotation = useCallback((rot: number) => {
      const stepIndex = ((-Math.round(rot / 90) % 4) + 4) % 4
      return stepIndex
    }, [])

    // Animate rotation to target value
    const rotateTo = useCallback(
      (targetRot: number, duration = 0.8, onHalfway?: () => void) => {
        if (isRotating.current) return
        isRotating.current = true

        let halfwayFired = false
        const initialRot = baseRotateY.get()
        const rotDelta = targetRot - initialRot

        // Timer for halfway callback if requested
        let halfwayTimer: NodeJS.Timeout | null = null
        if (onHalfway) {
          halfwayTimer = setTimeout(() => {
            if (!halfwayFired) {
              halfwayFired = true
              onHalfway()
            }
          }, (duration * 1000) / 2)
        }

        animate(baseRotateY, targetRot, {
          duration: prefersReducedMotion ? 0 : duration,
          ease: [0.25, 1, 0.45, 1],
          onComplete: () => {
            if (halfwayTimer) clearTimeout(halfwayTimer)
            if (onHalfway && !halfwayFired) {
              onHalfway()
            }
            setCurrentRotation(targetRot)
            isRotating.current = false
            const newStep = getStepFromRotation(targetRot)
            onIndexChange?.(newStep)
          },
        })
      },
      [baseRotateY, prefersReducedMotion, getStepFromRotation, onIndexChange]
    )

    const next = useCallback(() => {
      const target = currentRotation - 90
      rotateTo(target, 0.75)
    }, [currentRotation, rotateTo])

    const prev = useCallback(() => {
      const target = currentRotation + 90
      rotateTo(target, 0.75)
    }, [currentRotation, rotateTo])

    // Rotate back to Face 1 (Step 1)
    const rotateToStep1 = useCallback(
      (onHalfway?: () => void) => {
        const currentStep = getStepFromRotation(currentRotation)
        if (currentStep === 0) {
          // Already on face 1 -> Trigger full 360 transformation spin
          const target = currentRotation - 360
          rotateTo(target, 0.85, onHalfway)
        } else {
          // Snap to the nearest 360-degree multiple (Face 1)
          const target = Math.round(currentRotation / 360) * 360
          rotateTo(target, 0.75, onHalfway)
        }
      },
      [currentRotation, getStepFromRotation, rotateTo]
    )

    // Trigger explicit 360 spin
    const trigger360Spin = useCallback(
      (onHalfway?: () => void) => {
        const target = currentRotation - 360
        rotateTo(target, 0.85, onHalfway)
      },
      [currentRotation, rotateTo]
    )

    useImperativeHandle(
      ref,
      () => ({
        next,
        prev,
        rotateToStep1,
        trigger360Spin,
        getCurrentItemIndex: () => getStepFromRotation(currentRotation),
      }),
      [next, prev, rotateToStep1, trigger360Spin, getStepFromRotation, currentRotation]
    )

    // Drag handlers
    const handleDragStart = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (!enableDrag || isRotating.current) return

        isDragging.current = true
        const point = "touches" in e ? e.touches[0] : e
        startPosition.current = { x: point.clientX, y: point.clientY }
        startRotation.current = currentRotation
        e.preventDefault()
      },
      [enableDrag, currentRotation]
    )

    const handleDragMove = useCallback(
      (e: MouseEvent | TouchEvent) => {
        if (!isDragging.current || isRotating.current) return

        const point = "touches" in e ? e.touches[0] : e
        const deltaX = point.clientX - startPosition.current.x
        const rotationDelta = (deltaX * dragSensitivity) / 1.5

        const newRotation = startRotation.current + rotationDelta
        baseRotateY.set(newRotation)
      },
      [dragSensitivity, baseRotateY]
    )

    const handleDragEnd = useCallback(() => {
      if (!isDragging.current) return
      isDragging.current = false

      const currentValue = baseRotateY.get()
      const snappedRotation = Math.round(currentValue / 90) * 90

      rotateTo(snappedRotation, 0.5)
    }, [baseRotateY, rotateTo])

    useEffect(() => {
      if (!enableDrag) return

      window.addEventListener("mousemove", handleDragMove)
      window.addEventListener("mouseup", handleDragEnd)
      window.addEventListener("touchmove", handleDragMove)
      window.addEventListener("touchend", handleDragEnd)

      return () => {
        window.removeEventListener("mousemove", handleDragMove)
        window.removeEventListener("mouseup", handleDragEnd)
        window.removeEventListener("touchmove", handleDragMove)
        window.removeEventListener("touchend", handleDragEnd)
      }
    }, [enableDrag, handleDragMove, handleDragEnd])

    // Depth is half of the width so faces form a seamless square prism in 3D
    const depth = width

    const transform = useTransform(
      isDragging.current ? springRotateY : baseRotateY,
      (y) => `translateZ(-${depth / 2}px) rotateY(${y}deg)`
    )

    // 4 fixed 3D walls around the Y axis
    const faceTransforms = useMemo(
      () => [
        // Face 0: Front (0deg)
        `rotateY(0deg) translateZ(${depth / 2}px)`,
        // Face 1: Right (90deg)
        `rotateY(90deg) translateZ(${depth / 2}px)`,
        // Face 2: Back (180deg)
        `rotateY(180deg) translateZ(${depth / 2}px)`,
        // Face 3: Left (270deg)
        `rotateY(270deg) translateZ(${depth / 2}px)`,
      ],
      [depth]
    )

    return (
      <div
        className={cn(
          "relative focus:outline-0 select-none",
          enableDrag && "cursor-grab active:cursor-grabbing",
          className
        )}
        style={{
          width,
          height,
          perspective: `${perspective}px`,
        }}
        tabIndex={0}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        {...props}
      >
        <motion.div
          className="relative w-full h-full [transform-style:preserve-3d] will-change-transform"
          style={{ transform }}
        >
          {/* Face 0 — Step 1 */}
          <CubeFace
            transform={faceTransforms[0]}
            width={width}
            height={height}
          >
            <MediaRenderer item={items[0]} />
          </CubeFace>

          {/* Face 1 — Step 2 */}
          <CubeFace
            transform={faceTransforms[1]}
            width={width}
            height={height}
          >
            <MediaRenderer item={items[1]} />
          </CubeFace>

          {/* Face 2 — Step 3 */}
          <CubeFace
            transform={faceTransforms[2]}
            width={width}
            height={height}
          >
            <MediaRenderer item={items[2]} />
          </CubeFace>

          {/* Face 3 — Step 4 */}
          <CubeFace
            transform={faceTransforms[3]}
            width={width}
            height={height}
          >
            <MediaRenderer item={items[3]} />
          </CubeFace>
        </motion.div>
      </div>
    )
  }
)

BoxCarousel.displayName = "BoxCarousel"

export default BoxCarousel
