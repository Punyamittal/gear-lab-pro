import React from 'react';
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const LeverSwitch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
        className={cn(
            "peer relative h-[80px] w-10 shrink-0 cursor-pointer rounded-[20px] bg-[#e4e4e4] transition-colors outline-none",
            "data-[state=checked]:bg-[#e4e4e4] disabled:cursor-not-allowed disabled:opacity-50",
            className
        )}
        style={{
            boxShadow: '2px 0px 5px rgba(0, 0, 0, 0.274) inset, -2px 0px 5px rgba(255, 255, 255, 0.411) inset'
        }}
        {...props}
        ref={ref}
    >
        {/* Internal Slot Line */}
        <div
            className="absolute left-1/2 top-[10%] bottom-[10%] w-[4px] -translate-x-1/2 rounded-full"
            style={{ backgroundColor: 'rgb(39, 39, 39)' }}
        />

        <SwitchPrimitives.Thumb
            className={cn(
                "pointer-events-none block h-2 w-[24px] rounded-[2px] bg-[#5e5e5e] transition-all duration-300",
                "absolute left-1/2 -translate-x-1/2",
                "data-[state=unchecked]:top-[15px] data-[state=unchecked]:border-[#23ff23] data-[state=unchecked]:border",
                "data-[state=checked]:top-[60px] data-[state=checked]:border-[#ec0000] data-[state=checked]:border",
                "shadow-[5px 2px 5px rgba(8, 8, 8, 0.288)]"
            )}
        />
    </SwitchPrimitives.Root>
));

LeverSwitch.displayName = "LeverSwitch";

export { LeverSwitch };
