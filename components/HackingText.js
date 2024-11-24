'use client';
import { useState, useEffect } from 'react';

const HackingText = ({ text, className = '' }) => {
  const [displayText, setDisplayText] = useState(text);
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+{}[]|;:,.<>?/~`';

  useEffect(() => {
    let iterations = 0;
    const maxIterations = 3; // Number of scramble iterations before settling
    let interval;

    const scrambleText = () => {
      const scrambled = text.split('').map((char, index) => {
        if (char === ' ') return ' ';
        if (iterations >= maxIterations) return text[index];
        return characters[Math.floor(Math.random() * characters.length)];
      }).join('');

      setDisplayText(scrambled);

      if (iterations >= maxIterations) {
        clearInterval(interval);
        setTimeout(() => {
          // Reset iterations for next hover
          iterations = 0;
        }, 1000);
      }
      iterations++;
    };

    // Initial scramble
    interval = setInterval(scrambleText, 50);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className={className}>
      {displayText}
    </span>
  );
};

export default HackingText;
