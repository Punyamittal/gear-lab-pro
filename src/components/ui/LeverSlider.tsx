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
                    className="relative h-6 grow rounded-full bg-[#e4e4e4] overflow-hidden"
                    style={{
                        boxShadow: '2px 0px 5px rgba(0, 0, 0, 0.274) inset, -2px 0px 5px rgba(255, 255, 255, 0.411) inset'
                    }}
                >
                    {/* Internal Slot - Exact match to user's .Switch::before */}
                    <div
                        className="absolute top-1/2 left-[5%] right-[5%] h-[5px] -translate-y-1/2 rounded-full"
                        style={{ backgroundColor: 'rgb(39, 39, 39)' }}
                    />

                    <SliderPrimitive.Range className="absolute h-full bg-primary/10" />
                </SliderPrimitive.Track>

                {/* Thumb - Exact match to user's .Switch::after */}
                <SliderPrimitive.Thumb
                    className={cn(
                        "block w-[10px] h-10 bg-[#5e5e5e] rounded-[3px] shadow-lg transition-all duration-300",
                        "border border-[#23ff23] focus:border-[#ec0000] active:scale-95 outline-none cursor-grab active:cursor-grabbing",
                        "after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2",
                        "after:w-[1px] after:h-5 after:bg-white/10"
                    )}
                    style={{
                        boxShadow: '5px 2px 5px rgba(8, 8, 8, 0.288)',
                    }}
                />
            </SliderPrimitive.Root>
        </div>
    );
});

LeverSlider.displayName = "LeverSlider";

export { LeverSlider };
