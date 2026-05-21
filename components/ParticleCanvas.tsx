"use client";

import { useEffect, useRef } from "react";

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getBounds = () => ({
      width: canvas.clientWidth || window.innerWidth,
      height: canvas.clientHeight || window.innerHeight,
    });

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? window.innerWidth;
      const height = parent?.clientHeight ?? window.innerHeight;

      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };

    const resetParticle = (particle: {
      x: number;
      y: number;
      size: number;
      opacity: number;
      phase: number;
      drift: number;
      speedY: number;
    }) => {
      const { width, height } = getBounds();

      particle.x = Math.random() * width;
      particle.y = height + Math.random() * 28;
      particle.size = Math.random() * 1.5 + 0.5;
      particle.opacity = Math.random() * 0.32 + 0.22;
      particle.phase = Math.random() * Math.PI * 2;
      particle.drift = Math.random() * 0.55 + 0.1;
      particle.speedY = Math.random() * 0.36 + 0.14;
    };

    resizeCanvas();

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      size: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.05,
      speedY: Math.random() * 0.36 + 0.14,
      opacity: Math.random() * 0.32 + 0.22,
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.55 + 0.1,
    }));

    let animationId = 0;
    let frame = 0;

    const animate = () => {
      const { width, height } = getBounds();

      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.phase += 0.008;
        particle.x += particle.speedX + Math.sin(particle.phase + frame * 0.004) * particle.drift * 0.04;
        particle.y -= particle.speedY;

        if (particle.x < 0) particle.x = width;
        if (particle.x > width) particle.x = 0;
        if (particle.y < 0) resetParticle(particle);

        const progress = Math.max(0, Math.min(1, particle.y / height));
        const edgeFade = Math.sin(progress * Math.PI);
        const twinkle = 0.72 + Math.sin(particle.phase * 1.8) * 0.28;
        const alpha = particle.opacity * Math.max(0.25, edgeFade) * twinkle;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });

      frame += 1;
      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-[1] size-full" />;
}
