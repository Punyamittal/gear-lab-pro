import React, { useMemo } from 'react';

interface Point {
    x: number;
    y: number;
}

interface PremiumLineChartProps {
    data: any[];
    xKey: string;
    yKeys: string[];
    colors?: string[];
    height?: number;
    width?: number;
    showArea?: boolean;
}

const PremiumLineChart = ({
    data,
    xKey,
    yKeys,
    colors = ['hsl(185, 100%, 50%)', 'hsl(155, 100%, 50%)', 'hsl(30, 100%, 55%)', 'hsl(270, 100%, 65%)', 'hsl(0, 100%, 60%)'],
    height = 300,
    width = 500,
    showArea = true
}: PremiumLineChartProps) => {
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxValue = useMemo(() => {
        if (data.length === 0) return 1;
        let max = 0;
        yKeys.forEach(key => {
            const keyMax = Math.max(...data.map(d => d[key] || 0));
            if (keyMax > max) max = keyMax;
        });
        return (max || 1) * 1.1;
    }, [data, yKeys]);

    const generatePathData = (key: string) => {
        if (data.length === 0) return { path: '', areaPath: '', points: [] as Point[] };
        const points = data.map((d, index) => ({
            x: padding + (index / (data.length - 1)) * chartWidth,
            y: padding + (1 - (d[key] || 0) / maxValue) * chartHeight
        }));

        if (points.length < 2) return { path: '', areaPath: '', points };

        let path = `M ${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const next = points[i + 1];

            const cp1x = prev.x + (curr.x - prev.x) * 0.5;
            const cp1y = prev.y;
            const cp2x = curr.x - (next ? (next.x - curr.x) * 0.3 : 0);
            const cp2y = curr.y;

            path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
        }

        const areaPath = `${path} L ${points[points.length - 1].x},${height - padding} L ${padding},${height - padding} Z`;

        return { path, areaPath, points };
    };

    if (data.length === 0) return <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] uppercase font-mono tracking-widest">No Telemetry Data</div>;

    return (
        <div className="w-full h-full relative group">
            <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <defs>
                    {yKeys.map((key, i) => (
                        <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity="0" />
                        </linearGradient>
                    ))}
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    </pattern>
                </defs>

                <rect width={width} height={height} fill="url(#grid)" />

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                    <line
                        key={i}
                        x1={padding}
                        y1={padding + p * chartHeight}
                        x2={width - padding}
                        y2={padding + p * chartHeight}
                        stroke="currentColor"
                        className="text-white/5"
                        strokeWidth="0.5"
                    />
                ))}

                {yKeys.map((key, i) => {
                    const { path, areaPath, points } = generatePathData(key);
                    const color = colors[i % colors.length];
                    return (
                        <g key={key}>
                            {showArea && yKeys.length === 1 && (
                                <path
                                    d={areaPath}
                                    fill={`url(#grad-${key})`}
                                    className="transition-all duration-1000"
                                />
                            )}
                            <path
                                d={path}
                                fill="none"
                                stroke={color}
                                strokeWidth={yKeys.length > 1 ? "1.5" : "2.5"}
                                strokeLinecap="round"
                                className="transition-all duration-1000 opacity-80 group-hover:opacity-100"
                            />
                            {points.length > 0 && i === 0 && (
                                <circle
                                    cx={points[points.length - 1].x}
                                    cy={points[points.length - 1].y}
                                    r="3"
                                    fill={color}
                                    className="animate-pulse"
                                />
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* HUD Overlay for max and items */}
            <div className="absolute top-2 right-4 flex flex-col items-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
                    {yKeys.length === 1 ? `${yKeys[0]}: ${Math.max(...data.map(d => d[yKeys[0]] || 0)).toFixed(2)}` : `PEAK: ${maxValue.toFixed(1)}`}
                </div>
                {yKeys.length > 1 && (
                    <div className="flex gap-2">
                        {yKeys.map((key, i) => (
                            <div key={key} className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                <span className="text-[8px] font-mono text-muted-foreground uppercase">{key}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremiumLineChart;
