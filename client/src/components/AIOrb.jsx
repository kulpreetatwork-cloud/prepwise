import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AIOrb({ state = 'idle', audioLevel = 0 }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const center = size / 2;

    const draw = () => {
      timeRef.current += 0.015;
      const t = timeRef.current;
      ctx.clearRect(0, 0, size, size);

      const baseRadius = 55;
      const intensity = state === 'speaking' ? 1.2 + audioLevel * 0.8 :
                        state === 'listening' ? 0.8 + audioLevel * 0.6 :
                        state === 'thinking' ? 0.6 : 0.3;

      for (let ring = 4; ring >= 0; ring--) {
        const phase = t * (0.8 + ring * 0.15);
        const ringRadius = baseRadius + ring * 22 + Math.sin(phase) * (8 * intensity);
        const alpha = (0.08 - ring * 0.012) * (0.5 + intensity * 0.5);

        const grad = ctx.createRadialGradient(center, center, ringRadius * 0.2, center, center, ringRadius);
        grad.addColorStop(0, `rgba(139, 92, 246, ${alpha * 1.5})`);
        grad.addColorStop(0.4, `rgba(109, 72, 226, ${alpha})`);
        grad.addColorStop(0.7, `rgba(79, 70, 229, ${alpha * 0.6})`);
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.beginPath();
        ctx.arc(center, center, ringRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      const coreRadius = baseRadius + Math.sin(t * 1.5) * (6 * intensity);
      const coreGrad = ctx.createRadialGradient(
        center - 8, center - 8, 0, center, center, coreRadius
      );
      coreGrad.addColorStop(0, 'rgba(200, 170, 255, 0.95)');
      coreGrad.addColorStop(0.3, 'rgba(139, 92, 246, 0.8)');
      coreGrad.addColorStop(0.6, 'rgba(99, 102, 241, 0.6)');
      coreGrad.addColorStop(0.85, 'rgba(79, 70, 229, 0.3)');
      coreGrad.addColorStop(1, 'rgba(59, 130, 246, 0.05)');

      ctx.beginPath();
      ctx.arc(center, center, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      if (state === 'speaking' || state === 'listening') {
        const particleCount = state === 'speaking' ? 8 : 5;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + t * 0.8;
          const wobble = Math.sin(t * 2.5 + i * 1.2) * (4 + audioLevel * 12);
          const dist = coreRadius + 12 + wobble;
          const x = center + Math.cos(angle) * dist;
          const y = center + Math.sin(angle) * dist;
          const dotR = 1.5 + audioLevel * 2.5;
          const dotAlpha = 0.3 + audioLevel * 0.5;

          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fillStyle = state === 'speaking'
            ? `rgba(168, 130, 255, ${dotAlpha})`
            : `rgba(52, 211, 153, ${dotAlpha})`;
          ctx.fill();
        }
      }

      if (state === 'thinking') {
        for (let i = 0; i < 3; i++) {
          const angle = t * 1.5 + (i / 3) * Math.PI * 2;
          const dist = coreRadius + 18;
          const x = center + Math.cos(angle) * dist;
          const y = center + Math.sin(angle) * dist;
          const pulse = 0.4 + Math.sin(t * 3 + i * 2) * 0.3;

          ctx.beginPath();
          ctx.arc(x, y, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 191, 36, ${pulse})`;
          ctx.fill();
        }
      }

      const glowGrad = ctx.createRadialGradient(center - 15, center - 15, 0, center, center, 25);
      glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(center - 12, center - 12, 25, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [state, audioLevel]);

  const stateConfig = {
    idle: { label: 'Ready', color: 'text-text-muted', bg: 'bg-dark-tertiary' },
    speaking: { label: 'AI Speaking', color: 'text-purple-400', bg: 'bg-purple-500/15' },
    listening: { label: 'Listening', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    thinking: { label: 'Thinking', color: 'text-amber-400', bg: 'bg-amber-500/15' },
  };

  const cfg = stateConfig[state] || stateConfig.idle;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <motion.div
        animate={{
          scale: state === 'speaking' ? [1, 1.08, 1] : state === 'thinking' ? [1, 1.03, 1] : 1,
          opacity: state === 'idle' ? 0.4 : 0.7,
        }}
        transition={{ duration: state === 'speaking' ? 1.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute w-80 h-80 rounded-full blur-2xl"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(59,130,246,0.05) 70%, transparent 100%)' }}
      />

      <canvas ref={canvasRef} className="relative z-10" style={{ width: 300, height: 300 }} />

      <motion.div
        key={state}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-4 z-20"
      >
        <span className={`text-xs font-semibold tracking-wide px-4 py-1.5 rounded-full ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
      </motion.div>
    </div>
  );
}
