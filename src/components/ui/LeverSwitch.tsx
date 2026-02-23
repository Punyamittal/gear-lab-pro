import React from 'react';
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const LeverSwitch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
        className={cn(
            "peer relative h-[80px] w-10 shrink-0 cursor-pointer rounded-[20px] bg-[#111] transition-colors outline-none",
            "data-[state=checked]:bg-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-50",
            className
        )}
        style={{
            boxShadow: '2px 0px 5px rgba(0, 0, 0, 0.8) inset, -1px 0px 2px rgba(255, 255, 255, 0.05) inset'
        }}
        {...props}
        ref={ref}
    >
        {/* Internal Slot Line */}
        <div
            className="absolute left-1/2 top-[10%] bottom-[10%] w-[2px] -translate-x-1/2 rounded-full"
            style={{ backgroundColor: 'rgb(40, 0, 0)' }}
        />

        <SwitchPrimitives.Thumb
            className={cn(
                "pointer-events-none block h-2 w-[24px] rounded-[1px] bg-[#333] transition-all duration-300",
                "absolute left-1/2 -translate-x-1/2",
                "data-[state=unchecked]:top-[15px] data-[state=unchecked]:border-red-600 data-[state=unchecked]:border-2",
                "data-[state=checked]:top-[60px] data-[state=checked]:border-green-500 data-[state=checked]:border-2",
                "shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            )}
        />
    </SwitchPrimitives.Root>
));

LeverSwitch.displayName = "LeverSwitch";

export { LeverSwitch };
