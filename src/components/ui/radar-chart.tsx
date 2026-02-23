import React from 'react';
import { Group } from '@visx/group';
import { letterFrequency } from '@visx/mock-data';
import { scaleLinear } from '@visx/scale';
import { Point } from '@visx/point';
import { Line, LineRadial } from '@visx/shape';

const red = '#dc2626';
export const f1Red = '#dc2626';
const silver = 'rgba(255, 255, 255, 0.1)';
export const chartBackground = 'transparent';

const degrees = 360;

const genAngles = (length: number) =>
    [...new Array(length + 1)].map((_, i) => ({
        angle: i * (degrees / length) + (length % 2 === 0 ? 0 : degrees / length / 2),
    }));

const genPoints = (length: number, radius: number) => {
    const step = (Math.PI * 2) / length;
    return [...new Array(length)].map((_, i) => ({
        x: radius * Math.sin(i * step),
        y: radius * Math.cos(i * step),
    }));
};


function genPolygonPoints<Datum>(
    dataArray: Datum[],
    scale: (n: number) => number,
    getValue: (d: Datum) => number,
) {
    const step = (Math.PI * 2) / dataArray.length;
    let pointString = "";
    const points: { x: number; y: number }[] = [];

    if (dataArray.length === 0) {
        return { points, pointString };
    }

    for (let i = 0; i < dataArray.length; i++) {
        const xVal = scale(getValue(dataArray[i])) * Math.sin(i * step);
        const yVal = scale(getValue(dataArray[i])) * Math.cos(i * step);
        points.push({ x: xVal, y: yVal });
        pointString += `${xVal},${yVal} `;
    }
    return { points, pointString: pointString.trim() };
}

const defaultMargin = { top: 40, left: 80, right: 80, bottom: 80 };

export interface RadarChartComponentProps {
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
    levels?: number;
    data: any[];
    getValue: (d: any) => number;
}

export const RadarChart = ({
    width,
    height,
    margin = defaultMargin,
    levels = 5,
    data,
    getValue,
}: RadarChartComponentProps) => {
    if (width < 10 || !data || data.length === 0) return null;

    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;
    const radius = Math.min(xMax, yMax) / 2;


    if (radius <= 0) return null;

    const radialScale = scaleLinear<number>({
        range: [0, Math.PI * 2],
        domain: [degrees, 0],
    });

    const yScale = scaleLinear<number>({
        range: [0, radius],
        domain: [0, Math.max(...data.map(getValue), 0)],
    });

    const webs = genAngles(data.length);
    const axisLineEndpoints = genPoints(data.length, radius);
    const polygonDataPoints = genPolygonPoints(data, (d) => yScale(d) ?? 0, getValue);
    const zeroPoint = new Point({ x: 0, y: 0 });

    return (
        <svg width={width} height={height}>
            <rect fill={chartBackground} width={width} height={height} rx={14} />
            <Group top={margin.top + yMax / 2} left={margin.left + xMax / 2}>
                {[...new Array(levels)].map((_, i) => (
                    <LineRadial
                        key={`web-${i}`}
                        data={webs}
                        angle={(d) => radialScale(d.angle) ?? 0}
                        radius={((i + 1) * radius) / levels}
                        fill="none"
                        stroke={silver}
                        strokeWidth={2}
                        strokeOpacity={0.8}
                        strokeLinecap="round"
                    />
                ))}
                {[...new Array(data.length)].map((_, i) => (
                    <Line key={`radar-line-${i}`} from={zeroPoint} to={axisLineEndpoints[i]} stroke={silver} />
                ))}
                {polygonDataPoints.pointString && (
                    <polygon
                        points={polygonDataPoints.pointString}
                        fill={f1Red}
                        fillOpacity={0.2}
                        stroke={f1Red}
                        strokeWidth={2}
                    />
                )}
                {polygonDataPoints.points.map((point, i) => (
                    <circle key={`radar-point-${i}`} cx={point.x} cy={point.y} r={3} fill={f1Red} stroke="white" strokeWidth={1} />
                ))}
            </Group>
        </svg>
    );
};
