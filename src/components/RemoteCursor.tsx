import React from 'react';
import type { RemoteUser } from '../types/multiplayer';
import { hexToRgba } from '../utils/colors';

interface RemoteCursorProps {
  user: RemoteUser;
}

const RemoteCursor: React.FC<RemoteCursorProps> = ({ user }) => {
  if (!user.isActive) return null;

  // Use displayCursor (interpolated) for smooth rendering
  const { x, y } = user.displayCursor;

  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: x,
        top: y,
        zIndex: 50,
        // No CSS transition — movement is driven by rAF interpolation in the hook
      }}
    >
      {/* SVG cursor arrow */}
      <svg
        width="22"
        height="26"
        viewBox="0 0 22 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: `drop-shadow(0 2px 6px ${hexToRgba(user.color, 0.5)})` }}
      >
        <path
          d="M1 1L1 21L6.5 15.5L10.5 24L13 23L9 14.5L17 14.5L1 1Z"
          fill={user.color}
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      {/* Name label */}
      <div
        className="absolute top-5 left-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
        style={{
          background: user.color,
          color: '#0a0f1e',
          boxShadow: `0 2px 12px ${hexToRgba(user.color, 0.5)}`,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.3)', animation: 'blink 1.5s ease-in-out infinite' }}
        />
        {user.name}
      </div>
    </div>
  );
};

export default RemoteCursor;
