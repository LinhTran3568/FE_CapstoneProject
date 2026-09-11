import React from "react"

export interface PixelateSvgFilterProps {
  id?: string
  size?: number
  crossLayers?: boolean
}

export default function PixelateSvgFilter({
  id = "pixelate-filter",
  size = 16,
  crossLayers = false,
}: PixelateSvgFilterProps) {
  return (
    <svg className="absolute inset-0 w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          {/* First layer: Normal pixelation effect */}
          <feConvolveMatrix
            kernelMatrix="1 1 1
                          1 1 1
                          1 1 1"
            result="AVG"
          />
          <feFlood x="1" y="1" width="1" height="1" />
          <feComposite
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="0"
            k4="0"
            width={size}
            height={size}
          />
          <feTile result="TILE" />
          <feComposite
            in="AVG"
            in2="TILE"
            operator="in"
            k1="0"
            k2="1"
            k3="0"
            k4="0"
          />
          <feMorphology operator="dilate" radius={size / 2} result={"NORMAL"} />
          {crossLayers && (
            <>
              {/* Second layer: Fallback with full-width tiling */}
              <feConvolveMatrix
                kernelMatrix="1 1 1
                              1 1 1
                              1 1 1"
                result="AVG"
              />
              <feFlood x="1" y="1" width="1" height="1" />
              <feComposite
                in2="SourceGraphic"
                operator="arithmetic"
                k1="0"
                k2="1"
                k3="0"
                k4="0"
                width={size / 2}
                height={size}
              />
              <feTile result="TILE" />
              <feComposite
                in="AVG"
                in2="TILE"
                operator="in"
                k1="0"
                k2="1"
                k3="0"
                k4="0"
              />
              <feMorphology
                operator="dilate"
                radius={size / 2}
                result={"FALLBACKX"}
              />
              {/* Third layer: Fallback with full-height tiling */}
              <feConvolveMatrix
                kernelMatrix="1 1 1
                              1 1 1
                              1 1 1"
                result="AVG"
              />
              <feFlood x="1" y="1" width="1" height="1" />
              <feComposite
                in2="SourceGraphic"
                operator="arithmetic"
                k1="0"
                k2="1"
                k3="0"
                k4="0"
                width={size}
                height={size / 2}
              />
              <feTile result="TILE" />
              <feComposite
                in="AVG"
                in2="TILE"
                operator="in"
                k1="0"
                k2="1"
                k3="0"
                k4="0"
              />
              <feMorphology
                operator="dilate"
                radius={size / 2}
                result={"FALLBACKY"}
              />
              <feMerge>
                <feMergeNode in="FALLBACKX" />
                <feMergeNode in="FALLBACKY" />
                <feMergeNode in="NORMAL" />
              </feMerge>
            </>
          )}
          {!crossLayers && <feMergeNode in="NORMAL" />}
        </filter>
      </defs>
    </svg>
  )
}
