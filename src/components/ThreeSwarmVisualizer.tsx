/**
 * GearOpt X — 3D Swarm Visualizer
 * Powered by React-Three-Fiber & Three.js
 * Visualizes the particle swarm optimization in 3D space.
 */

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { type SwarmStep } from '@/lib/optimizer';

interface ParticleProps {
    position: [number, number, number];
    color: string;
}

const Particle = ({ position, color }: ParticleProps) => {
    const mesh = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.rotation.x = state.clock.getElapsedTime() * 0.5;
            mesh.current.rotation.y = state.clock.getElapsedTime() * 0.2;
        }
    });

    return (
        <mesh position={position} ref={mesh}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={2}
                toneMapped={false}
            />
        </mesh>
    );
};

interface SwarmProps {
    step: SwarmStep | null;
}

const SwarmScene = ({ step }: SwarmProps) => {
    const particles = useMemo(() => {
        if (!step || !step.particles) return [];
        return step.particles.map((p, i) => ({
            id: i,
            // Map first 3 gear ratios to X, Y, Z
            position: [
                ((p.position?.[0] || 3.0) - 3.0) * 3,
                ((p.position?.[1] || 2.0) - 2.0) * 3,
                ((p.position?.[2] || 1.5) - 1.5) * 3,
            ] as [number, number, number],
        }));
    }, [step]);

    const bestPosition = useMemo(() => {
        if (!step || !step.globalBest || step.globalBest.length < 3) return [0, 0, 0] as [number, number, number];
        return [
            (step.globalBest[0] - 3.0) * 3,
            (step.globalBest[1] - 2.0) * 3,
            (step.globalBest[2] - 1.5) * 3,
        ] as [number, number, number];
    }, [step]);

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />

            {particles.map((p) => (
                <Particle key={p.id} position={p.position} color="hsl(185, 60%, 72%)" />
            ))}

            {/* Global Best Indicator */}
            {step?.globalBest && (
                <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                    <mesh position={bestPosition}>
                        <octahedronGeometry args={[0.4, 0]} />
                        <MeshDistortMaterial
                            color="#ff4d00"
                            speed={2}
                            distort={0.4}
                            emissive="#ff4d00"
                            emissiveIntensity={4}
                        />
                    </mesh>
                </Float>
            )}

            {/* Axis Labels */}
            <Suspense fallback={null}>
                <Text position={[6, 0, 0]} fontSize={0.5} color="white">Gear 1</Text>
                <Text position={[0, 6, 0]} fontSize={0.5} color="white">Gear 2</Text>
                <Text position={[0, 0, 6]} fontSize={0.5} color="white">Gear 3</Text>
            </Suspense>

            {/* Center Grid */}
            <gridHelper args={[20, 20, 0x444444, 0x222222]} rotation={[Math.PI / 2, 0, 0]} />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <OrbitControls makeDefault />
        </>
    );
};

const ThreeSwarmVisualizer = ({ step }: SwarmProps) => {
    return (
        <div className="w-full h-full min-h-[400px] bg-black/40 rounded-3xl border border-panel/50 overflow-hidden relative group">
            <div className="absolute top-4 left-6 z-10 pointer-events-none">
                <h3 className="font-display text-[10px] tracking-[0.3em] text-primary uppercase font-black">
                    3D Orbital Swarm
                </h3>
                <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
                    High-Dimensional Optimization Space View
                </p>
            </div>

            <Canvas camera={{ position: [10, 10, 10], fov: 45 }} gl={{ antialias: true }}>
                <Suspense fallback={null}>
                    <SwarmScene step={step} />
                </Suspense>
            </Canvas>

            <div className="absolute bottom-4 right-6 text-[8px] font-mono text-muted-foreground opacity-40 uppercase pointer-events-none group-hover:opacity-80 transition-opacity">
                Orbital Controls Active — Click & Drag to Rotate
            </div>
        </div>
    );
};

export default ThreeSwarmVisualizer;
