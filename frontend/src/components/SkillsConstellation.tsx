"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

type NodeType = "hub" | "skill" | "technology";

type ConstellationNode = {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  radius: number;
  phase: number;
};

const COLORS = {
  hub: "#60A5FA",
  skill: "#3B82F6",
  technology: "#34D399",
  edge: "rgba(96, 165, 250, 0.22)",
  edgePulse: "rgba(52, 211, 153, 0.35)",
  label: "#94A3B8",
  glow: "rgba(59, 130, 246, 0.15)",
};

function buildNodes(skills: string[], technologies: string[]): ConstellationNode[] {
  const orbitItems = [
    ...skills.slice(0, 6).map((label) => ({ label, type: "skill" as const })),
    ...technologies.slice(0, 6).map((label) => ({
      label,
      type: "technology" as const,
    })),
  ];

  const nodes: ConstellationNode[] = [
    {
      id: "hub",
      label: "Profile",
      type: "hub",
      x: 0.5,
      y: 0.5,
      radius: 11,
      phase: 0,
    },
  ];

  if (orbitItems.length === 0) {
    return nodes;
  }

  const orbitRadius = 0.34;

  orbitItems.forEach((item, index) => {
    const angle = (index / orbitItems.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({
      id: `${item.type}-${index}-${item.label}`,
      label: item.label,
      type: item.type,
      x: 0.5 + Math.cos(angle) * orbitRadius,
      y: 0.5 + Math.sin(angle) * orbitRadius,
      radius: item.type === "skill" ? 8 : 7,
      phase: index * 0.65,
    });
  });

  return nodes;
}

type SkillsConstellationProps = {
  skills: string[];
  technologies: string[];
};

export default function SkillsConstellation({
  skills,
  technologies,
}: SkillsConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<ConstellationNode[]>([]);
  const frameRef = useRef<number | null>(null);

  const hasData = (skills?.length ?? 0) > 0 || (technologies?.length ?? 0) > 0;

  useEffect(() => {
    nodesRef.current = buildNodes(skills ?? [], technologies ?? []);
  }, [skills, technologies]);

  useEffect(() => {
    if (!skills?.length && !technologies?.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 400;
    const H = 400;

    const draw = (time: number) => {
      const nodes = nodesRef.current;
      const hub = nodes[0];
      const pulse = (Math.sin(time * 0.0015) + 1) / 2;

      ctx.clearRect(0, 0, W, H);

      for (const node of nodes) {
        if (!hub || node.id === hub.id) continue;

        const x1 = hub.x * W;
        const y1 = hub.y * H;
        const x2 = node.x * W;
        const y2 = node.y * H;
        const drift =
          Math.sin(time * 0.001 + node.phase) * 6 * (1 + pulse * 0.15);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2 + drift * 0.2, y2 + drift * 0.2);
        ctx.strokeStyle =
          node.type === "technology" ? COLORS.edgePulse : COLORS.edge;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (const node of nodes) {
        const driftX =
          node.type === "hub" ? 0 : Math.sin(time * 0.001 + node.phase) * 5;
        const driftY =
          node.type === "hub" ? 0 : Math.cos(time * 0.0012 + node.phase) * 5;

        const x = node.x * W + driftX;
        const y = node.y * H + driftY;
        const color =
          node.type === "hub"
            ? COLORS.hub
            : node.type === "skill"
              ? COLORS.skill
              : COLORS.technology;

        const glowRadius = node.radius + 10 + pulse * 4;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.45, `${color}88`);
        gradient.addColorStop(1, COLORS.glow);

        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.font = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";
        ctx.fillStyle = COLORS.label;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const label =
          node.label.length > 14
            ? `${node.label.slice(0, 13)}…`
            : node.label;
        ctx.fillText(label, x, y + node.radius + 6);
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [skills, technologies]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col p-5"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-blue-300">
        Skills constellation
      </p>
      <p className="mt-1 text-sm text-slate-400">
        {hasData
          ? `${skills.length + technologies.length} parsed signals in the network`
          : "Add skills or technologies to render the network"}
      </p>

      {hasData ? (
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="mx-auto mt-4 block w-full aspect-square max-w-[400px]"
          aria-label="Animated skills and technologies constellation"
        />
      ) : (
        <div className="mx-auto mt-4 flex aspect-square w-full max-w-[400px] items-center justify-center rounded-xl border border-dashed border-[#1E2D45] bg-[#0f172a]/60 text-sm text-slate-500">
          No constellation data yet
        </div>
      )}
    </motion.div>
  );
}
