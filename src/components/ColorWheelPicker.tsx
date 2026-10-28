import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pipette, Check, Copy } from 'lucide-react';
import { cn } from '../utils/cn';

interface ColorWheelPickerProps {
  color: string; // Hex string e.g. '#FFD700' or rgba
  onChange: (hex: string, alpha?: number) => void;
  label?: string;
  showAlpha?: boolean;
  alpha?: number; // 0 to 1
  onAlphaChange?: (alpha: number) => void;
  className?: string;
  inline?: boolean;
  size?: 'normal' | 'double';
}

// Convert Hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number; a: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.startsWith('rgba')) {
    const match = clean.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1
      };
    }
  }
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length === 8) {
    const r = parseInt(clean.substring(0, 2), 16) || 255;
    const g = parseInt(clean.substring(2, 4), 16) || 255;
    const b = parseInt(clean.substring(4, 6), 16) || 255;
    const a = (parseInt(clean.substring(6, 8), 16) || 255) / 255;
    return { r, g, b, a };
  }
  const r = parseInt(clean.substring(0, 2), 16) || 255;
  const g = parseInt(clean.substring(2, 4), 16) || 255;
  const b = parseInt(clean.substring(4, 6), 16) || 255;
  return { r, g, b, a: 1 };
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    if (max === rNorm) {
      h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
    } else if (max === gNorm) {
      h = ((bNorm - rNorm) / d + 2) / 6;
    } else {
      h = ((rNorm - gNorm) / d + 4) / 6;
    }
  }

  return { h: h * 360, s, v };
}

// Convert HSV to Hex
function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  const toHex = (val: number) => {
    const num = Math.round((val + m) * 255);
    const clamped = Math.max(0, Math.min(255, num));
    return clamped.toString(16).padStart(2, '0');
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Standard ASS cinema color swatches
const CINEMA_PRESET_SWATCHES = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Warm Cream', hex: '#FFFBEB' },
  { name: 'Cinema Gold', hex: '#FFD700' },
  { name: 'Amber Glow', hex: '#F59E0B' },
  { name: 'Neon Yellow', hex: '#FEF08A' },
  { name: 'Electric Cyan', hex: '#00F5D4' },
  { name: 'Sky Azure', hex: '#38BDF8' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Bright Mint', hex: '#6EE7B7' },
  { name: 'Hot Coral', hex: '#FB7185' },
  { name: 'Crimson Red', hex: '#EF4444' },
  { name: 'Royal Violet', hex: '#A855F7' },
  { name: 'Midnight Pitch', hex: '#000000' },
  { name: 'Charcoal Dark', hex: '#18181B' },
  { name: 'Steel Border', hex: '#3F3F46' },
  { name: 'Silver Sub', hex: '#94A3B8' }
];

export const ColorWheelPicker: React.FC<ColorWheelPickerProps> = ({
  color,
  onChange,
  label,
  showAlpha = true,
  alpha = 1,
  onAlphaChange,
  className,
  inline = false,
  size = 'double'
}) => {
  const isDouble = size === 'double';
  const wheelPx = isDouble ? 288 : 144;

  const [isOpen, setIsOpen] = useState(inline);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);
  const [copied, setCopied] = useState(false);

  // Parse initial color
  const rgb = hexToRgb(color);
  const initialHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
  const [hsv, setHsv] = useState(initialHsv);
  const [currentAlpha, setCurrentAlpha] = useState(alpha ?? rgb.a ?? 1);
  const [hexInput, setHexInput] = useState(color.startsWith('#') ? color.toUpperCase() : '#FFFFFF');

  // Sync when prop changes
  useEffect(() => {
    const parsed = hexToRgb(color);
    setHsv(rgbToHsv(parsed.r, parsed.g, parsed.b));
    if (color.startsWith('#')) {
      setHexInput(color.toUpperCase());
    }
  }, [color]);

  useEffect(() => {
    if (alpha !== undefined) {
      setCurrentAlpha(alpha);
    }
  }, [alpha]);

  // Click outside to close if not inline
  useEffect(() => {
    if (inline) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, inline]);

  // Draw the color wheel onto canvas
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 2;

    ctx.clearRect(0, 0, width, height);

    // Draw circular hue & saturation gradient
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = ((angle - 1) * Math.PI) / 180;
      const endAngle = ((angle + 1) * Math.PI) / 180;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      // Create radial gradient from center white to edge color
      const radGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      radGrad.addColorStop(0, '#FFFFFF');
      radGrad.addColorStop(1, `hsl(${angle}, 100%, 50%)`);

      ctx.fillStyle = radGrad;
      ctx.fill();
    }

    // Outer border ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = isDouble ? 2.5 : 1.5;
    ctx.stroke();

    // Draw selector indicator for current HSV
    const angleRad = (hsv.h * Math.PI) / 180;
    const dist = hsv.s * radius;
    const pickerX = centerX + Math.cos(angleRad) * dist;
    const pickerY = centerY + Math.sin(angleRad) * dist;

    const outerR = isDouble ? 9 : 6;
    const innerR = isDouble ? 6 : 4;

    ctx.beginPath();
    ctx.arc(pickerX, pickerY, outerR, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = isDouble ? 3.5 : 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pickerX, pickerY, innerR, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = isDouble ? 2 : 1.5;
    ctx.stroke();
  }, [hsv, isDouble]);

  useEffect(() => {
    if (isOpen) {
      drawWheel();
    }
  }, [isOpen, drawWheel]);

  // Handle pointer interactions on wheel
  const handlePointerOnWheel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    const radius = Math.min(centerX, centerY) - 2;
    const dist = Math.min(radius, Math.hypot(x, y));
    const s = Math.max(0, Math.min(1, dist / radius));

    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    const newHsv = { ...hsv, h: angle, s };
    setHsv(newHsv);
    const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(newHex);
    onChange(newHex, currentAlpha);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDraggingWheel(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointerOnWheel(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingWheel) {
      handlePointerOnWheel(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingWheel) {
      setIsDraggingWheel(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  const handleBrightnessChange = (v: number) => {
    const newHsv = { ...hsv, v };
    setHsv(newHsv);
    const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v);
    setHexInput(newHex);
    onChange(newHex, currentAlpha);
  };

  const handleAlphaSliderChange = (newA: number) => {
    setCurrentAlpha(newA);
    if (onAlphaChange) {
      onAlphaChange(newA);
    }
    const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
    onChange(currentHex, newA);
  };

  const handleHexInputChange = (val: string) => {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      const parsed = hexToRgb(val);
      const newHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
      setHsv(newHsv);
      onChange(val.toUpperCase(), currentAlpha);
    }
  };

  const handleSelectSwatch = (swatchHex: string) => {
    const parsed = hexToRgb(swatchHex);
    const newHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
    setHsv(newHsv);
    setHexInput(swatchHex.toUpperCase());
    onChange(swatchHex.toUpperCase(), currentAlpha);
  };

  const currentComputedHex = hsvToHex(hsv.h, hsv.s, hsv.v);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-xs", className)}>
      {/* Trigger Button (if not inline) */}
      {!inline && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 p-1 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors shadow-2xs cursor-pointer"
        >
          <div
            className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 shadow-2xs shrink-0"
            style={{ backgroundColor: currentComputedHex, opacity: currentAlpha }}
          />
          <span className="font-mono text-[10.5px] font-bold text-zinc-700 dark:text-zinc-200 uppercase">
            {currentComputedHex}
          </span>
          <Pipette size={11} className="text-zinc-400" />
        </button>
      )}

      {/* Color Wheel Panel */}
      {isOpen && (
        <div
          className={cn(
            "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-3 z-50 text-zinc-800 dark:text-zinc-100 space-y-3",
            inline ? "w-full" : (isDouble ? "absolute top-full left-0 mt-1.5 w-80 sm:w-84 max-w-[95vw]" : "absolute top-full left-0 mt-1.5 w-64")
          )}
        >
          {label && (
            <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
              <span className="font-bold text-[10.5px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {label}
              </span>
              <span className="font-mono text-[10px] text-zinc-400">
                {Math.round(currentAlpha * 100)}% Opacity
              </span>
            </div>
          )}

          {/* Interactive Circular Wheel (Doubled Resolution & Dimensions) */}
          <div className="flex justify-center items-center py-1">
            <div className={cn(
              "relative rounded-full overflow-hidden shadow-inner flex items-center justify-center bg-zinc-950 transition-all",
              isDouble ? "w-72 h-72" : "w-36 h-36"
            )}>
              <canvas
                ref={canvasRef}
                width={wheelPx}
                height={wheelPx}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="cursor-crosshair touch-none"
              />
            </div>
          </div>

          {/* Value / Brightness Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase">
              <span>Brightness / Value</span>
              <span className="font-mono">{Math.round(hsv.v * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={hsv.v}
              onChange={e => handleBrightnessChange(parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, #000000, ${hsvToHex(hsv.h, hsv.s, 1)})`
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>

          {/* Opacity / Alpha Slider (if enabled) */}
          {showAlpha && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] font-bold text-zinc-500 uppercase">
                <span>Alpha Opacity (SSA \alpha)</span>
                <span className="font-mono">{Math.round(currentAlpha * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={currentAlpha}
                onChange={e => handleAlphaSliderChange(parseFloat(e.target.value))}
                style={{
                  background: `linear-gradient(to right, transparent, ${currentComputedHex})`
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          )}

          {/* Hex Input & Copy */}
          <div className="flex items-center gap-1.5 pt-1">
            <div
              className="w-6 h-6 rounded-lg border border-zinc-300 dark:border-zinc-700 shadow-2xs shrink-0"
              style={{ backgroundColor: currentComputedHex, opacity: currentAlpha }}
            />
            <input
              type="text"
              value={hexInput}
              onChange={e => handleHexInputChange(e.target.value)}
              placeholder="#FFFFFF"
              maxLength={7}
              className="w-full p-1.5 px-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(currentComputedHex);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer shrink-0"
              title="Copy Hex"
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
            </button>
          </div>

          {/* Quick Cinema Swatches */}
          <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Cinema Swatches
            </span>
            <div className="grid grid-cols-8 gap-1.5">
              {CINEMA_PRESET_SWATCHES.map(s => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => handleSelectSwatch(s.hex)}
                  title={s.name}
                  className={cn(
                    "w-5 h-5 rounded-md border transition-transform cursor-pointer hover:scale-110",
                    currentComputedHex.toLowerCase() === s.hex.toLowerCase()
                      ? "ring-2 ring-emerald-500 ring-offset-1 border-white"
                      : "border-zinc-300 dark:border-zinc-700"
                  )}
                  style={{ backgroundColor: s.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
