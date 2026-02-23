// src/components/ui/treemap-chart.tsx

import React, { useState } from 'react';
import { Group } from '@visx/group';
import {
    Treemap,
    hierarchy,
    stratify,
    treemapSquarify,
    treemapBinary,
    treemapDice,
    treemapResquarify,
    treemapSlice,
    treemapSliceDice,
} from '@visx/hierarchy';
import { TileMethod } from '@visx/hierarchy/lib/types';
import { shakespeare } from '@visx/mock-data';
type Shakespeare = (typeof shakespeare)[0];
import { scaleLinear } from '@visx/scale';

export const color1 = '#dc2626';
const color2 = '#450a0a';
export const background = 'rgba(0, 0, 0, 0.4)';

const colorScale = scaleLinear<string>({
    domain: [0, Math.max(...shakespeare.map((d) => d.size ?? 0))],
    range: [color2, color1],
});

const data = stratify<Shakespeare>()
    .id((d) => d.id)
    .parentId((d) => d.parent)(shakespeare)
    .sum((d) => d.size ?? 0);

const tileMethods: { [tile: string]: TileMethod<typeof data> } = {
    treemapSquarify,
    treemapBinary,
    treemapDice,
    treemapResquarify,
    treemapSlice,
    treemapSliceDice,
};

const defaultMargin = { top: 10, left: 10, right: 10, bottom: 10 };

export type TreemapChartProps = {
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
};

export const TreemapChart = ({ width, height, margin = defaultMargin }: TreemapChartProps) => {
    const [tileMethod, setTileMethod] = useState<string>('treemapSquarify');
    const xMax = width - margin.left - margin.right;
    const yMax = height - margin.top - margin.bottom;
    const root = hierarchy(data).sort((a, b) => (b.value || 0) - (a.value || 0));

    return width < 10 ? null : (
        <div>
            <div className="flex gap-2 mb-2 items-center text-xs">
                <label>tile method</label>{' '}
                <select
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setTileMethod(e.target.value)}
                    value={tileMethod}
                    className="bg-panel border border-panel rounded px-1 py-0.5"
                >
                    {Object.keys(tileMethods).map((tile) => (
                        <option key={tile} value={tile}>
                            {tile}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <svg width={width} height={height}>
                    <rect width={width} height={height} rx={14} fill={background} />
                    <Treemap<typeof data>
                        top={margin.top}
                        root={root}
                        size={[xMax, yMax]}
                        tile={tileMethods[tileMethod]}
                        round
                    >
                        {(treemap) => (
                            <Group>
                                {treemap
                                    .descendants()
                                    .reverse()
                                    .map((node, i) => {
                                        const nodeWidth = node.x1 - node.x0;
                                        const nodeHeight = node.y1 - node.y0;
                                        return (
                                            <Group
                                                key={`node-${i}`}
                                                top={node.y0 + margin.top}
                                                left={node.x0 + margin.left}
                                            >
                                                {node.depth === 1 && (
                                                    <rect
                                                        width={nodeWidth}
                                                        height={nodeHeight}
                                                        stroke={background}
                                                        strokeWidth={4}
                                                        fill="transparent"
                                                    />
                                                )}
                                                {node.depth > 2 && (
                                                    <rect
                                                        width={nodeWidth}
                                                        height={nodeHeight}
                                                        stroke={background}
                                                        fill={colorScale(node.value || 0)}
                                                    />
                                                )}
                                            </Group>
                                        );
                                    })}
                            </Group>
                        )}
                    </Treemap>
                </svg>
            </div>
        </div>
    );
};
