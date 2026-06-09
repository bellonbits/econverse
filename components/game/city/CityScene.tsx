/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
"use client";

import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Float, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useGameStore } from "@/store/game-store";
import { getEconomyHealthScore } from "@/lib/economy-engine";

function Building({ position, height, width, color }) {
  const windows = useMemo(() => {
    const rows = Math.floor(height / 1.2);
    const cols = Math.max(1, Math.floor(width / 0.9));
    const result = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result.push({
          x: position[0] + (c - cols / 2 + 0.5) * 0.75,
          y: r * 1.1 + 0.6,
          z: position[2] + width / 2 + 0.05,
          lit: Math.random() > 0.35,
        });
      }
    }
    return result;
  }, [height, width, position]);

  return (
    <group>
      <mesh position={[position[0], height / 2, position[2]]} castShadow receiveShadow>
        <boxGeometry args={[width, height, width]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.25} />
      </mesh>
      <mesh position={[position[0], height + 0.15, position[2]]}>
        <boxGeometry args={[width * 0.5, 0.3, width * 0.5]} />
        <meshStandardMaterial color="#0a0f1e" roughness={1} />
      </mesh>
      {windows.map((w, i) => (
        <mesh key={i} position={[w.x, w.y, w.z]}>
          <planeGeometry args={[0.28, 0.38]} />
          <meshStandardMaterial
            color={w.lit ? "#ffd166" : "#0d1b2a"}
            emissive={w.lit ? "#ff9f1c" : "#000000"}
            emissiveIntensity={w.lit ? 0.5 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}

function Roads() {
  const segments = useMemo(() => {
    const r = [];
    for (let i = -4; i <= 4; i++) {
      r.push({ pos: [i * 10, 0.02, 0], scale: [1.8, 0.01, 82] });
      r.push({ pos: [0, 0.02, i * 10], scale: [82, 0.01, 1.8] });
    }
    return r;
  }, []);
  return (
    <>
      {segments.map((s, i) => (
        <mesh key={i} position={s.pos}>
          <boxGeometry args={s.scale} />
          <meshStandardMaterial color="#111827" roughness={1} />
        </mesh>
      ))}
    </>
  );
}

function Vehicle({ startX, startZ, dir, speed, color }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    if (dir === "x") {
      ref.current.position.x = ((ref.current.position.x + speed + 42) % 84) - 42;
    } else {
      ref.current.position.z = ((ref.current.position.z + speed + 42) % 84) - 42;
    }
  });
  return (
    <mesh
      ref={ref}
      position={[startX, 0.22, startZ]}
      rotation={[0, dir === "x" ? 0 : Math.PI / 2, 0]}
    >
      <boxGeometry args={[1.3, 0.38, 0.62]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function EconomyOrb({ health }) {
  const ref = useRef();
  const color = health > 70 ? "#10b981" : health > 40 ? "#f59e0b" : "#ef4444";
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.elapsedTime * 0.4;
    ref.current.rotation.x = s.clock.elapsedTime * 0.15;
    ref.current.position.y = 26 + Math.sin(s.clock.elapsedTime * 0.8) * 0.6;
  });
  return (
    <group>
      <mesh ref={ref} position={[0, 26, 0]}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} wireframe />
      </mesh>
      <pointLight position={[0, 26, 0]} intensity={2} color={color} distance={20} />
    </group>
  );
}

function CityContent() {
  const { economy, businesses, activeEvents } = useGameStore();
  const health = economy ? getEconomyHealthScore(economy) : 70;
  const heightMult = health > 70 ? 1.2 : health > 40 ? 1.0 : 0.75;

  const buildings = useMemo(() => [
    { pos: [0, 0, 0], h: 22 * heightMult, w: 3.2, color: "#1a2744" },
    { pos: [5.5, 0, 0], h: 16 * heightMult, w: 2.6, color: "#1e3a5f" },
    { pos: [-5.5, 0, 0], h: 19 * heightMult, w: 2.6, color: "#142952" },
    { pos: [0, 0, 5.5], h: 13 * heightMult, w: 2.2, color: "#1a3050" },
    { pos: [3, 0, -5], h: 11 * heightMult, w: 2, color: "#0f2040" },
    { pos: [-15, 0, 15], h: 5.5, w: 3.2, color: "#2d3748" },
    { pos: [-18.5, 0, 15], h: 4.5, w: 2.6, color: "#374151" },
    { pos: [-15, 0, 18.5], h: 6.5, w: 3.2, color: "#2d3748" },
    { pos: [-20, 0, 19], h: 3.5, w: 2.2, color: "#374151" },
    { pos: [15, 0, -15], h: 8, w: 4.5, color: "#1a4040" },
    { pos: [18.5, 0, -15], h: 5.5, w: 3.2, color: "#1a3a3a" },
    { pos: [-21, 0, -21], h: 9, w: 5.5, color: "#2a2a2a" },
    { pos: [-26, 0, -21], h: 7, w: 4.5, color: "#252525" },
    ...businesses.slice(0, 4).map((b, i) => ({
      pos: [(i - 1.5) * 8, 0, -16],
      h: Math.max(4, b.level * 3.5 + 3),
      w: 3.2,
      color: "#1a4a2a",
    })),
  ], [businesses, heightMult]);

  const vehicles = useMemo(() => {
    const vehicleColors = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#f97316"];
    const count = Math.max(4, Math.floor(health / 15));
    return Array.from({ length: count }, (_, i) => ({
      startX: Math.floor(Math.random() * 9 - 4) * 10 + 0.6,
      startZ: (Math.random() - 0.5) * 60,
      dir: i % 2 === 0 ? "x" : "z",
      speed: 0.04 + Math.random() * 0.04,
      color: vehicleColors[i % vehicleColors.length],
    }));
  }, [health]);

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[40, 60, 30]} intensity={0.9} castShadow shadow-mapSize={[2048, 2048]} />
      <pointLight position={[0, 10, 0]} intensity={0.3} color="#6699ff" />

      {/* Sky */}
      <color attach="background" args={["#060b14"]} />
      <fog attach="fog" args={["#060b14", 60, 120]} />
      <Stars radius={180} depth={60} count={2500} factor={4} fade saturation={0} />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color="#080d18" roughness={1} />
      </mesh>

      <Grid
        args={[200, 200]}
        position={[0, 0.01, 0]}
        cellSize={10}
        cellThickness={0.4}
        cellColor="#0e1e35"
        sectionSize={40}
        sectionThickness={0.8}
        sectionColor="#0e1e35"
        fadeDistance={80}
        fadeStrength={1}
      />

      <Roads />

      {buildings.map((b, i) => (
        <Building key={i} position={b.pos} height={b.h} width={b.w} color={b.color} />
      ))}

      {vehicles.map((v, i) => (
        <Vehicle key={i} {...v} />
      ))}

      <EconomyOrb health={health} />

      <OrbitControls
        maxPolarAngle={Math.PI / 2.15}
        minPolarAngle={0.2}
        maxDistance={75}
        minDistance={6}
        enablePan
        panSpeed={0.8}
        rotateSpeed={0.6}
      />
    </>
  );
}

export default function CityScene() {
  const { economy } = useGameStore();
  const health = economy ? getEconomyHealthScore(economy) : 70;

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [28, 22, 28], fov: 52 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <CityContent />
        </Suspense>
      </Canvas>

      {/* Overlay */}
      <div className="absolute top-4 left-4 space-y-2 pointer-events-none">
        <div className="glass rounded-xl px-3 py-2 text-xs">
          <div className="text-slate-400 mb-1">Economy Health</div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${health}%`,
                  backgroundColor: health > 70 ? "#10b981" : health > 40 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <span className="font-bold text-white">{health.toFixed(0)}%</span>
          </div>
        </div>
        {economy && (
          <div className="glass rounded-xl px-3 py-2 space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Inflation</span>
              <span className={`font-bold ${economy.inflation > 4 ? "text-red-400" : "text-emerald-400"}`}>
                {economy.inflation.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Employment</span>
              <span className={`font-bold ${economy.unemployment < 5 ? "text-emerald-400" : "text-yellow-400"}`}>
                {(100 - economy.unemployment).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 right-4 glass rounded-xl px-3 py-1.5 text-xs text-slate-500 pointer-events-none">
        Drag · Scroll · Right-click pan
      </div>
    </div>
  );
}
