'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulseAngle: number;
}

export function ElectricParticles() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Do not render electric particles on content / docs pages to maintain reading focus
  const isDocsPage = pathname?.startsWith('/docs');

  useEffect(() => {
    if (isDocsPage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Keep particle density low and subtle for professional elegance
    const particleCount = Math.min(30, Math.floor((width * height) / 38000));
    const particles: Particle[] = [];

    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      active: false,
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 1.5 + 1, // 1px to 2.5px
        baseAlpha: Math.random() * 0.35 + 0.25, // 0.25 to 0.60
        pulseSpeed: Math.random() * 0.03 + 0.015,
        pulseAngle: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth cursor interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;

      const cursorRadius = 140;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Soft alpha pulsing
        p.pulseAngle += p.pulseSpeed;
        const currentAlpha = Math.max(
          0.15,
          p.baseAlpha + Math.sin(p.pulseAngle) * 0.18
        );

        let finalAlpha = currentAlpha;

        // Gentle random wandering nudge across the screen
        p.vx += (Math.random() - 0.5) * 0.015;
        p.vy += (Math.random() - 0.5) * 0.015;

        // Subtle attraction towards cursor when within close radius
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < cursorRadius && dist > 0) {
            const force = (1 - dist / cursorRadius) * 0.02;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
            finalAlpha = Math.min(0.85, currentAlpha + (1 - dist / cursorRadius) * 0.35);
          }
        }

        // Speed cap to keep movements slow, calm, and graceful
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.5) {
          p.vx = (p.vx / speed) * 0.5;
          p.vy = (p.vy / speed) * 0.5;
        } else if (speed < 0.12) {
          p.vx = (p.vx / (speed || 1)) * 0.12;
          p.vy = (p.vy / (speed || 1)) * 0.12;
        }

        // Apply position
        p.x += p.vx;
        p.y += p.vy;

        // Infinite screen edge wrap
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        // Draw glowing cyan electric node
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(3, 234, 255, ${finalAlpha})`;
        ctx.shadowColor = '#03eaff';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.restore();

        // Connect nearby particles within close proximity with faint electrical filaments
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const pdx = p2.x - p.x;
          const pdy = p2.y - p.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);

          if (pdist < 95) {
            const lineAlpha = (1 - pdist / 95) * 0.1 * finalAlpha;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(3, 234, 255, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDocsPage]);

  if (isDocsPage) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-75"
      aria-hidden="true"
    />
  );
}
