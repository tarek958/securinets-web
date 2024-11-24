'use client';
import { useEffect, useRef } from 'react';

const MatrixBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}[]|;:,.<>?/~`';
    const charArray = chars.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#ff3333');
    gradient.addColorStop(1, '#ff6666');

    const draw = () => {
      // Add semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = gradient;
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Draw character
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Add glowing effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        
        ctx.fillText(char, x, y);

        // Reset drop when it reaches bottom or randomly
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Move drop
        drops[i]++;
      }
    };

    // Animation loop
    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ background: 'black' }}
    />
  );
};

export default MatrixBackground;
