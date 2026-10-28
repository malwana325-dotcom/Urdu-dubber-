import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Pipette, 
  Copy, 
  Check, 
  RotateCcw, 
  ChevronDown, 
  Sliders, 
  Sparkles 
} from 'lucide-react';
import { 
  normalizeHex, 
  hexToRgb, 
  rgbToHex, 
  hexToHsl, 
  hslToHex, 
  RgbColor, 
  HslColor, 
  BROADCAST_SWATCHES 
} from '../../utils/colorUtils';
import { cn } from '../../utils/cn';

interface AdvancedColorPickerProps {
  color: string; // Hex color e.g. '#FFD700'
  onChange: (hex: string) => void;
  alpha?: number; // 0 to 1
  onChangeAlpha?: (alpha: number) => void;
  label?: string;
  assTagHint?: string; // e.g. '\1c & \1a'
  className?: string;
  showAlpha?: boolean;
  inline?: boolean;
  presetSwatches?: { label: string; color: string }[];
}

export const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  color,
  onChange,
  alpha = 1,
  onChangeAlpha,
  label,
  assTagHint,
  className,
  showAlpha = true,
  inline = false,
  presetSwatches = BROADCAST_SWATCHES
}) => {
  const normHex = useMemo(() => normalizeHex(color), [color]);
  const [isOpen, setIsOpen] = useState(inline);
  const [activeFormat, setActiveFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [copied, setCopied] = useState(false);

  // Local HSL state for smooth sliding
  const [hsl, setHsl] = useState<HslColor>(() => hexToHsl(normHex));
  const [rgb, setRgb] = useState<RgbColor>(() => hexToRgb(normHex));

  // Sync internal HSL/RGB when external color changes
  useEffect(() => {
    setHsl(hexToHsl(normHex));
    setRgb(hexToRgb(normHex));
  }, [normHex]);

  // Handle HSL slider change
  const handleHslChange = (patch: Partial<HslColor>) => {
    const updated = { ...hsl, ...patch };
    setHsl(updated);
    const newHex = hslToHex(updated);
    setRgb(hexToRgb(newHex));
    onChange(newHex);
  };

  // Handle RGB slider change
  const handleRgbChange = (patch: Partial<RgbColor>) => {
    const updated = { ...rgb, ...patch };
    setRgb(updated);
    const newHex = rgbToHex(updated);
    setHsl(hexToHsl(newHex));
    onChange(newHex);
  };

  // EyeDropper API
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          onChange(normalizeHex(result.sRGBHex));
        }
      } catch (err) {
        // Cancelled or not supported
      }
    }
  };

  const handleCopyColor = () => {
    navigator.clipboard?.writeText(normHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click if not inline
  useEffect(() => {
    if (inline) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, inline]);

  const pickerPanel = (
    <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-xl shadow-xl space-y-3 text-xs w-full max-w-[340px]">
      {/* Top Preview Bar with Eyedropper & Format Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Color Chip with Alpha Grid */}
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 shadow-2xs shrink-0">
            {/* Checkered transparency background */}
            <div 
              className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] dark:bg-[radial-gradient(#334155_1px,transparent_1px)]" 
            />
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: normHex,
                opacity: alpha 
              }}
            />
          </div>

          <div>
            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-xs">
              {normHex}
            </div>
            <div className="text-[9px] text-zinc-400 font-mono">
              {showAlpha ? `Alpha: ${Math.round(alpha * 100)}%` : 'Solid Color'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* EyeDropper button if supported */}
          {'EyeDropper' in window && (
            <button
              type="button"
              onClick={handleEyeDropper}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors"
              title="Pick color from cinema screen"
            >
              <Pipette size={13} />
            </button>
          )}

          {/* Copy Hex */}
          <button
            type="button"
            onClick={handleCopyColor}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors"
            title="Copy Hex Code"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>

          {/* Native Color Picker trigger */}
          <label className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer transition-colors flex items-center justify-center">
            <input 
              type="color" 
              value={normHex} 
              onChange={e => onChange(e.target.value)} 
              className="w-0 h-0 opacity-0 absolute pointer-events-none" 
            />
            <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: normHex }} />
          </label>
        </div>
      </div>

      {/* Format Selector Pills */}
      <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-bold">
        {(['hex', 'rgb', 'hsl'] as const).map(fmt => (
          <button
            key={fmt}
            type="button"
            onClick={() => setActiveFormat(fmt)}
            className={cn(
              "flex-1 py-1 rounded-md uppercase transition-all cursor-pointer text-center",
              activeFormat === fmt 
                ? "bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs" 
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
            )}
          >
            {fmt}
          </button>
        ))}
      </div>

      {/* Numerical Inputs by active format */}
      {activeFormat === 'hex' && (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-zinc-400 text-xs font-bold">#</span>
          <input
            type="text"
            value={normHex.replace('#', '')}
            onChange={e => {
              const val = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
              if (val.length === 6) {
                onChange('#' + val.toUpperCase());
              }
            }}
            maxLength={6}
            className="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-xs uppercase text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="FFFFFF"
          />
        </div>
      )}

      {activeFormat === 'rgb' && (
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { key: 'r' as const, label: 'R', val: rgb.r },
            { key: 'g' as const, label: 'G', val: rgb.g },
            { key: 'b' as const, label: 'B', val: rgb.b }
          ].map(ch => (
            <div key={ch.key} className="space-y-0.5">
              <label className="text-[9px] font-bold text-zinc-400">{ch.label}</label>
              <input
                type="number"
                min="0"
                max="255"
                value={ch.val}
                onChange={e => handleRgbChange({ [ch.key]: Number(e.target.value) })}
                className="w-full px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-[11px] text-zinc-900 dark:text-zinc-100 text-center"
              />
            </div>
          ))}
        </div>
      )}

      {activeFormat === 'hsl' && (
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { key: 'h' as const, label: 'Hue °', val: hsl.h, max: 360 },
            { key: 's' as const, label: 'Sat %', val: hsl.s, max: 100 },
            { key: 'l' as const, label: 'Light %', val: hsl.l, max: 100 }
          ].map(ch => (
            <div key={ch.key} className="space-y-0.5">
              <label className="text-[9px] font-bold text-zinc-400">{ch.label}</label>
              <input
                type="number"
                min="0"
                max={ch.max}
                value={ch.val}
                onChange={e => handleHslChange({ [ch.key]: Number(e.target.value) })}
                className="w-full px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-[11px] text-zinc-900 dark:text-zinc-100 text-center"
              />
            </div>
          ))}
        </div>
      )}

      {/* Interactive Rainbow Hue Slider */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[9.5px]">
          <span className="font-bold text-zinc-500">Hue Spectrum</span>
          <span className="font-mono text-zinc-400">{hsl.h}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          value={hsl.h}
          onChange={e => handleHslChange({ h: Number(e.target.value) })}
          className="w-full h-3 rounded-lg appearance-none cursor-pointer outline-none"
          style={{
            background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
          }}
        />
      </div>

      {/* Saturation & Lightness Dual Sliders */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-zinc-500 font-medium">Saturation</span>
            <span className="font-mono text-zinc-400">{hsl.s}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.s}
            onChange={e => handleHslChange({ s: Number(e.target.value) })}
            className="w-full h-2 rounded-lg accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-[9px]">
            <span className="text-zinc-500 font-medium">Lightness</span>
            <span className="font-mono text-zinc-400">{hsl.l}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={hsl.l}
            onChange={e => handleHslChange({ l: Number(e.target.value) })}
            className="w-full h-2 rounded-lg accent-emerald-500 cursor-pointer"
          />
        </div>
      </div>

      {/* ASS / Alpha Opacity Slider */}
      {showAlpha && onChangeAlpha && (
        <div className="space-y-1 pt-1 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex justify-between items-center text-[9.5px]">
            <span className="font-bold text-zinc-600 dark:text-zinc-300">
              Opacity / Alpha {assTagHint ? `(${assTagHint})` : ''}
            </span>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {Math.round(alpha * 100)}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={alpha}
              onChange={e => onChangeAlpha(Number(e.target.value))}
              className="w-full h-2.5 rounded-lg accent-emerald-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Quick Cinema Swatches */}
      {presetSwatches && presetSwatches.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-zinc-200 dark:border-zinc-800">
          <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
            Cinema Broadcast Swatches
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {presetSwatches.slice(0, 18).map(sw => (
              <button
                key={sw.color + sw.label}
                type="button"
                onClick={() => onChange(sw.color)}
                className={cn(
                  "h-5 rounded-md border transition-transform hover:scale-110 cursor-pointer relative shadow-2xs",
                  normHex === normalizeHex(sw.color)
                    ? "ring-2 ring-emerald-500 ring-offset-1 border-white"
                    : "border-zinc-300 dark:border-zinc-700"
                )}
                style={{ backgroundColor: sw.color }}
                title={`${sw.label} (${sw.color})`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (inline) {
    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              {label}
            </label>
            {assTagHint && (
              <span className="font-mono text-[9px] text-zinc-400">{assTagHint}</span>
            )}
          </div>
        )}
        {pickerPanel}
      </div>
    );
  }

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-850 hover:border-emerald-500 transition-colors shadow-2xs cursor-pointer group"
      >
        <div className="relative w-5 h-5 rounded-md overflow-hidden border border-zinc-300 dark:border-zinc-600 shrink-0">
          <div 
            className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:4px_4px]" 
          />
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: normHex, opacity: alpha }} 
          />
        </div>

        <div className="text-left font-mono text-[10.5px] font-bold text-zinc-800 dark:text-zinc-200">
          {normHex}
        </div>

        {showAlpha && onChangeAlpha && (
          <span className="text-[9px] font-mono text-zinc-400">
            {Math.round(alpha * 100)}%
          </span>
        )}

        <ChevronDown size={12} className={cn("text-zinc-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Floating Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[150] animate-in fade-in zoom-in-95 duration-150">
          {pickerPanel}
        </div>
      )}
    </div>
  );
};
