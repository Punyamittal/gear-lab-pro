import React from 'react';
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface LeverSliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
    label?: string;
}

const LeverSlider = React.forwardRef<
    React.ElementRef<typeof SliderPrimitive.Root>,
    LeverSliderProps
>(({ className, label, ...props }, ref) => {
    return (
        <div className="flex flex-col gap-2 w-full group">
            <SliderPrimitive.Root
                ref={ref}
                className={cn(
                    "relative flex items-center select-none touch-none w-full h-8 cursor-pointer",
                    className
                )}
                {...props}
            >
                {/* Track - Exact match to user's .Switch style */}
                <SliderPrimitive.Track
                    className="relative h-6 grow rounded-full bg-[#111] overflow-hidden border border-white/5"
                    style={{
                        boxShadow: '2px 0px 5px rgba(0, 0, 0, 0.8) inset, -1px 0px 2px rgba(255, 255, 255, 0.05) inset'
                    }}
                >
                    {/* Internal Slot - Exact match to user's .Switch::before */}
                    <div
                        className="absolute top-1/2 left-[5%] right-[5%] h-[4px] -translate-y-1/2 rounded-full"
                        style={{ backgroundColor: 'rgb(30, 0, 0)' }}
                    />

                    <SliderPrimitive.Range className="absolute h-full bg-red-600/20" />
                </SliderPrimitive.Track>

                {/* Thumb - Exact match to user's .Switch::after */}
                <SliderPrimitive.Thumb
                    className={cn(
                        "block w-[12px] h-10 bg-[#333] rounded-[2px] shadow-2xl transition-all duration-300",
                        "border border-red-600 focus:border-yellow-500 active:scale-95 outline-none cursor-grab active:cursor-grabbing",
                        "after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2",
                        "after:w-[1px] after:h-5 after:bg-white/20"
                    )}
                    style={{
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    }}
                />
            </SliderPrimitive.Root>
        </div>
    );
});

LeverSlider.displayName = "LeverSlider";

export { LeverSlider };
