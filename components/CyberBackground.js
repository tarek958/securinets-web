'use client';
import { useEffect, useRef } from 'react';

const CyberBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initMatrix(); // Reinitialize when resized
      }
    };
    
    // Matrix characters including hacking terms
    const hackingTerms = [
      'HACK', 'SQL', 'XSS', 'ROOT', 'SHELL', 'DDOS', 'BREACH',
      'INJECT', 'BUFFER', 'EXPLOIT', 'PAYLOAD', 'CIPHER',
      '0', '1', '$', '#', '@', '*', '&', '%', '!', '?', '/',
      '>', '<', '}', '{', '[', ']', '|', '\\', '^', '~', '='
    ];
    
    const fontSize = 14;
    let columns = 0;
    let drops = [];

    // Initialize matrix effect
    const initMatrix = () => {
      columns = Math.floor(canvas.width / fontSize);
      drops = [];
      
      // Initialize drops
      for (let i = 0; i < columns; i++) {
        drops[i] = {
          x: i * fontSize,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 1.5,
          length: 10 + Math.floor(Math.random() * 20),
          chars: [],
          nextUpdate: 0,
          updateInterval: 50 + Math.random() * 50
        };
        
        // Initialize characters for this drop
        for (let j = 0; j < drops[i].length; j++) {
          drops[i].chars[j] = getRandomChar();
        }
      }
    };

    // Get random character or hacking term
    const getRandomChar = () => {
      if (Math.random() < 0.1) { // 10% chance for a hacking term
        return hackingTerms[Math.floor(Math.random() * hackingTerms.length)];
      }
      // Otherwise return a random katakana character
      return String.fromCharCode(
        0x30A0 + Math.random() * (0x30FF - 0x30A0 + 1)
      );
    };

    const draw = () => {
      // Create fade effect
      ctx.fillStyle = 'rgba(17, 24, 39, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = fontSize + 'px monospace';
      
      // Update and draw each drop
      drops.forEach((drop, i) => {
        const now = Date.now();
        
        // Move drop
        drop.y += drop.speed;
        
        // Draw characters in the drop
        for (let j = 0; j < drop.chars.length; j++) {
          const y = drop.y - (j * fontSize);
          if (y < canvas.height && y > 0) {
            // Calculate character opacity
            const opacity = 1 - (j / drop.chars.length);
            
            // Head of the drop (brightest)
            if (j === 0) {
              ctx.fillStyle = 'rgba(255, 255, 255, ' + opacity + ')';
            } 
            // Body of the drop (green for regular chars, red for hacking terms)
            else {
              const isHackingTerm = hackingTerms.includes(drop.chars[j]);
              const color = isHackingTerm ? '239, 68, 68' : '0, 255, 70';
              ctx.fillStyle = 'rgba(' + color + ', ' + opacity + ')';
            }
            
            ctx.fillText(drop.chars[j], drop.x, y);
          }
        }

        // Update characters if it's time
        if (now >= drop.nextUpdate) {
          // Shift characters down
          drop.chars.pop();
          drop.chars.unshift(getRandomChar());
          drop.nextUpdate = now + drop.updateInterval;
        }

        // Reset drop if it's gone too far
        if (drop.y - (drop.chars.length * fontSize) > canvas.height) {
          drop.y = -drop.length * fontSize;
          drop.speed = 0.5 + Math.random() * 1.5;
          drop.nextUpdate = now + drop.updateInterval;
        }
      });

      requestAnimationFrame(draw);
    };

    // Initialize and start animation
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{
        background: 'linear-gradient(to bottom, #111827, #1f2937)',
        zIndex: -1
      }}
    />
  );
};

export default CyberBackground;
