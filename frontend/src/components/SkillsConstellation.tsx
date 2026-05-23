"use client";
import { useEffect, useRef } from "react";

type Node = {
  label: string; x: number; y: number; r: number;
  primary?: boolean; cat: 0 | 1 | 2;
};

const COLORS = [
  { core: "#3B82F6", ring: "rgba(59,130,246,0.12)", text: "#93C5FD" }, // Skills - Blue
  { core: "#2DD4BF", ring: "rgba(45,212,191,0.12)", text: "#5EEAD4" }, // Tech - Teal
  { core: "#A78BFA", ring: "rgba(167,139,250,0.12)", text: "#C4B5FD" }, // Roles - Purple
];

function buildNodes(skills: string[], technologies: string[]): { nodes: Node[]; edges: [number, number][] } {
  const nodes: Node[] = [
    { label: "AI Core", x: 200, y: 200, r: 25, primary: true, cat: 2 },
  ];

  // Coordinates optimized for 400x400 canvas
  const positions = [
    { x: 120, y: 120 }, { x: 280, y: 110 }, { x: 90,  y: 230 },
    { x: 310, y: 230 }, { x: 200, y: 320 }, { x: 330, y: 160 },
    { x: 70,  y: 160 }, { x: 150, y: 330 }, { x: 250, y: 330 },
  ];

  const safeSkills = skills || [];
  const safeTech = technologies || [];

  safeSkills.slice(0, 4).forEach((s, i) => {
    nodes.push({ label: s, x: positions[i].x, y: positions[i].y, r: 16, cat: 0 });
  });
  
  safeTech.slice(0, 5).forEach((t, i) => {
    nodes.push({ label: t, x: positions[i + 4].x, y: positions[i + 4].y, r: 14, cat: 1 });
  });

  const edges: [number, number][] = [];
  for (let i = 1; i < nodes.length; i++) {
    edges.push([0, i]); // Connect everything to the center hub
  }
  if (nodes.length > 4) edges.push([1, 3], [2, 4]); // cross links for network feel

  return { nodes, edges };
}

export default function SkillsConstellation({ skills, technologies }: { skills: string[]; technologies: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!skills?.length && !technologies?.length) return;

    const ctx = canvas.getContext("2d")!;
    const { nodes, edges } = buildNodes(skills, technologies);
    const W = 400, H = 400;
    
    const offsets = nodes.map(() => Math.random() * Math.PI * 2);
    let t = 0, progress = 0, animId = 0;

    function draw() {
      ctx.clearRect(0, 0, W, H);
      progress = Math.min(progress + 0.02, 1);
      t += 0.01;

      // Draw Edges
      edges.forEach(([ai, bi]) => {
        const a = nodes[ai], b = nodes[bi];
        const ax = a.x + Math.sin(t * 0.5 + offsets[ai]) * 3;
        const ay = a.y + Math.cos(t * 0.4 + offsets[ai]) * 3;
        const bx = b.x + Math.sin(t * 0.5 + offsets[bi]) * 3;
        const by = b.y + Math.cos(t * 0.4 + offsets[bi]) * 3;
        
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = "rgba(30, 45, 69, 0.6)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw Nodes
      nodes.forEach((node, i) => {
        const ox = Math.sin(t * 0.5 + offsets[i]) * 3 * progress;
        const oy = Math.cos(t * 0.4 + offsets[i]) * 3 * progress;
        const nx = node.x + ox, ny = node.y + oy;
        const c = COLORS[node.cat];
        const alpha = Math.min(progress * 2, 1);

        // Glow Ring
        ctx.beginPath();
        ctx.arc(nx, ny, node.r + 6, 0, Math.PI * 2);
        ctx.fillStyle = c.ring;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Node Solid BG
        ctx.beginPath();
        ctx.arc(nx, ny, node.r, 0, Math.PI * 2);
        ctx.fillStyle = "#0F172A";
        ctx.globalAlpha = 1;
        ctx.fill();
        ctx.strokeStyle = c.core;
        ctx.lineWidth = node.primary ? 2 : 1.2;
        ctx.globalAlpha = alpha;
        ctx.stroke();

        // Text Label
        ctx.fillStyle = c.text;
        ctx.font = `${node.primary ? "600 11px" : "500 9px"} monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, nx, ny);
        ctx.globalAlpha = 1;
      });

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [skills, technologies]);

  return (
    <div className="w-full flex items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="w-full aspect-square max-w-[400px] block mx-auto text-slate-400"
      />
    </div>
  );
}