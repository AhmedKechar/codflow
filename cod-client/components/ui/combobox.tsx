"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

const Combobox = PopoverPrimitive.Root

function ComboboxTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="combobox-trigger" {...props} />
}

function ComboboxContent({
  className,
  children,
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        collisionAvoidance={{ side: 'none', fallbackAxisSide: 'none' }}
        className="isolate z-[65]"
      >
        <PopoverPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            "relative isolate z-50 w-(--anchor-width) min-w-40 max-h-64 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground border border-border shadow-[0_1px_3px_rgba(0,0,0,0.12)] p-1.5",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Combobox, ComboboxContent, ComboboxTrigger }
