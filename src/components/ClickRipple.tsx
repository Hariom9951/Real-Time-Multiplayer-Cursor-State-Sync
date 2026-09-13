import React from 'react';
import type { ClickRipple as ClickRippleType } from '../types/multiplayer';
import { hexToRgba } from '../utils/colors';

interface ClickRippleProps {
  ripple: ClickRippleType;
}

const ClickRipple: React.FC<ClickRippleProps> = ({ ripple }) => {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{ left: ripple.x, top: ripple.y, zIndex: 60 }}
    >
      {/* Outer expanding ring */}
      <div
        className="absolute rounded-full"
        style={{
          width: 56,
          height: 56,
          left: -28,
          top: -28,
          border: `2px solid ${ripple.color}`,
          animation: 'click-ripple-ring 0.7s ease-out forwards',
        }}
      />
      {/* Inner dot */}
      <div
        className="absolute rounded-full"
        style={{
          width: 12,
          height: 12,
          left: -6,
          top: -6,
          background: ripple.color,
          boxShadow: `0 0 12px ${hexToRgba(ripple.color, 0.8)}`,
          animation: 'click-ripple-dot 0.7s ease-out forwards',
        }}
      />
    </div>
  );
};

export default ClickRipple;
