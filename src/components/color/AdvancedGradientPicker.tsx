import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  RotateCw, 
  Sparkles, 
  Sliders, 
  ArrowRight,
  Layers,
  Check
} from 'lucide-react';
import { 
  GradientStop, 
  buildLinearGradientCss, 
  normalizeHex 
} from '../../utils/colorUtils';
import { AdvancedColorPicker } from './AdvancedColorPicker';
import { cn } from '../../utils/cn';

interface AdvancedGradientPickerProps {
  stops: GradientStop[];
  onChangeStops: (stops: GradientStop[]) => void;
  angle?: number; // 0 - 360 degrees
  onChangeAngle?: (angle: number) => void;
  onApplyPreset?: (colors: string[], name: string) => void;
  className?: string;
}

export const PRESET_GRADIENTS: { name: string; angle: number; stops: { color: string; offset: number }[] }[] = [
  {
    name: 'Cinema Imperial Gold',
    angle: 135,
    stops: [
      { color: '#FFE259', offset: 0 },
      { color: '#FFA751', offset: 100 }
    ]
  },
  {
    name: 'CapCut Viral Punch Yellow',
    angle: 90,
    stops: [
      { color: '#FFF200', offset: 0 },
      { color: '#FF7300', offset: 100 }
    ]
  },
  {
    name: 'Cyberpunk Neon Synth',
    angle: 135,
    stops: [
      { color: '#FF007A', offset: 0 },
      { color: '#7928CA', offset: 50 },
      { color: '#00F0FF', offset: 100 }
    ]
  },
  {
    name: 'Urdu Nastaliq Saffron & Ruby',
    angle: 135,
    stops: [
      { color: '#F59E0B', offset: 0 },
      { color: '#EF4444', offset: 50 },
      { color: '#78350F', offset: 100 }
    ]
  },
  {
    name: 'Royal Emerald Luxury',
    angle: 135,
    stops: [
      { color: '#34D399', offset: 0 },
      { color: '#059669', offset: 50 },
      { color: '#064E3B', offset: 100 }
    ]
  },
  {
    name: 'Arctic Diamond Frost',
    angle: 180,
    stops: [
      { color: '#FFFFFF', offset: 0 },
      { color: '#BAE6FD', offset: 50 },
      { color: '#38BDF8', offset: 100 }
    ]
  },
  {
    name: 'Blood Orange Volcano',
    angle: 135,
    stops: [
      { color: '#FF416C', offset: 0 },
      { color: '#FF4B2B', offset: 100 }
    ]
  },
  {
    name: 'High-Contrast Broadcast Platinum',
    angle: 180,
    stops: [
      { color: '#FFFFFF', offset: 0 },
      { color: '#E2E8F0', offset: 48 },
      { color: '#94A3B8', offset: 100 }
    ]
  }
];

export const AdvancedGradientPicker: React.FC<AdvancedGradientPickerProps> = ({
  stops,
  onChangeStops,
  angle = 135,
  onChangeAngle,
  onApplyPreset,
  className
}) => {
  const [activeStopId, setActiveStopId] = useState<string>(stops[0]?.id || 'stop-0');

  const activeStop = useMemo(() => {
    return stops.find(s => s.id === activeStopId) || stops[0];
  }, [stops, activeStopId]);

  const cssGradient = useMemo(() => {
    return buildLinearGradientCss(stops, angle);
  }, [stops, angle]);

  // Handle adding stop by clicking on gradient track
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const offset = Math.round(Math.max(0, Math.min(100, (clickX / rect.width) * 100)));

    const newStop: GradientStop = {
      id: `stop-${Date.now()}`,
      color: activeStop ? activeStop.color : '#FFFFFF',
      offset
    };

    const updated = [...stops, newStop].sort((a, b) => a.offset - b.offset);
    onChangeStops(updated);
    setActiveStopId(newStop.id);
  };

  // Update selected stop
  const updateActiveStop = (patch: Partial<GradientStop>) => {
    if (!activeStop) return;
    const updated = stops.map(s => {
      if (s.id === activeStop.id) {
        return { ...s, ...patch };
      }
      return s;
    });
    onChangeStops(updated);
  };

  // Delete selected stop
  const handleDeleteActiveStop = () => {
    if (stops.length <= 2) return;
    const updated = stops.filter(s => s.id !== activeStop.id);
    onChangeStops(updated);
    setActiveStopId(updated[0].id);
  };

  // Reverse all stops
  const handleReverseStops = () => {
    const reversed = stops.map(s => ({
      ...s,
      offset: 100 - s.offset
    })).sort((a, b) => a.offset - b.offset);
    onChangeStops(reversed);
  };

  // Apply curated preset
  const handleSelectPreset = (preset: typeof PRESET_GRADIENTS[0]) => {
    const newStops: GradientStop[] = preset.stops.map((s, idx) => ({
      id: `stop-${Date.now()}-${idx}`,
      color: s.color,
      offset: s.offset
    }));
    onChangeStops(newStops);
    if (onChangeAngle) onChangeAngle(preset.angle);
    if (onApplyPreset) {
      onApplyPreset(preset.stops.map(s => s.color), preset.name);
    }
  };

  return (
    <div className={cn("p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-500" />
          <span>Interactive Multi-Stop Gradient Builder</span>
        </label>
        <span className="text-[9px] font-mono text-zinc-400">
          {stops.length} Color Stops • {angle}°
        </span>
      </div>

      {/* Main Interactive Gradient Track */}
      <div className="space-y-3">
        <div className="relative pt-2 pb-6 select-none">
          {/* Gradient Visual Strip */}
          <div 
            onClick={handleTrackClick}
            className="h-7 w-full rounded-xl cursor-crosshair border border-zinc-300 dark:border-zinc-700 shadow-inner relative overflow-hidden"
            style={{ background: cssGradient }}
            title="Click anywhere on the bar to add a color stop"
          />

          {/* Interactive Stop Pins */}
          {stops.map(stop => {
            const isSelected = stop.id === activeStop?.id;
            return (
              <div
                key={stop.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveStopId(stop.id);
                }}
                className={cn(
                  "absolute -bottom-1 -translate-x-1/2 flex flex-col items-center cursor-pointer transition-transform group z-10",
                  isSelected ? "scale-115 z-20" : "hover:scale-105 opacity-85"
                )}
                style={{ left: `${stop.offset}%` }}
              >
                {/* Pointer triangle */}
                <div 
                  className={cn(
                    "w-0 h-0 border-x-4 border-x-transparent border-b-4",
                    isSelected ? "border-b-emerald-600 dark:border-b-emerald-400" : "border-b-zinc-400"
                  )} 
                />
                {/* Handle circle */}
                <div 
                  className={cn(
                    "w-5 h-5 rounded-full border-2 shadow-md flex items-center justify-center transition-all",
                    isSelected 
                      ? "border-emerald-600 dark:border-emerald-400 ring-2 ring-emerald-500/30 ring-offset-1" 
                      : "border-white dark:border-zinc-900"
                  )}
                  style={{ backgroundColor: stop.color }}
                >
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-2xs" />}
                </div>
                <span className="text-[8px] font-mono text-zinc-500 font-bold mt-0.5">
                  {Math.round(stop.offset)}%
                </span>
              </div>
            );
          })}
        </div>
        <p className="text-[9px] text-zinc-400 text-center">
          Click bar to insert new color stop. Click pins to adjust color or position.
        </p>
      </div>

      {/* Selected Stop Inspector Controls */}
      {activeStop && (
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[10px] text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeStop.color }} />
              <span>Editing Active Stop ({Math.round(activeStop.offset)}%)</span>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleReverseStops}
                className="p-1 px-2 rounded-lg border border-zinc-200 dark:border-zinc-750 text-[9px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                title="Reverse stops order"
              >
                <RotateCw size={10} />
                <span>Flip</span>
              </button>

              {stops.length > 2 && (
                <button
                  type="button"
                  onClick={handleDeleteActiveStop}
                  className="p-1 px-2 rounded-lg border border-rose-200 dark:border-rose-900/50 text-[9px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer flex items-center gap-1"
                  title="Remove this stop"
                >
                  <Trash2 size={10} />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Color Picker for active stop */}
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-bold text-zinc-500">Color:</span>
              <AdvancedColorPicker
                color={activeStop.color}
                onChange={newColor => updateActiveStop({ color: newColor })}
                showAlpha={false}
              />
            </div>

            {/* Position slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-zinc-500 font-bold">Stop Position</span>
                <span className="font-mono text-emerald-600 font-bold">{Math.round(activeStop.offset)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={activeStop.offset}
                onChange={e => updateActiveStop({ offset: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer h-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* Gradient Direction & Angle Controls */}
      {onChangeAngle && (
        <div className="space-y-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Gradient Direction & Angle
            </span>
            <span className="font-mono text-xs font-bold text-emerald-600">{angle}°</span>
          </div>

          {/* Quick Direction Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
            {[
              { label: '0° ↑', a: 0 },
              { label: '45° ↗', a: 45 },
              { label: '90° →', a: 90 },
              { label: '135° ↘', a: 135 },
              { label: '180° ↓', a: 180 },
              { label: '270° ←', a: 270 }
            ].map(dir => (
              <button
                key={dir.a}
                type="button"
                onClick={() => onChangeAngle(dir.a)}
                className={cn(
                  "py-1 rounded-lg border text-[9.5px] font-bold transition-all cursor-pointer text-center",
                  angle === dir.a
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                )}
              >
                {dir.label}
              </button>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={angle}
            onChange={e => onChangeAngle(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-2"
          />
        </div>
      )}

      {/* Gradient Presets Library */}
      <div className="space-y-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
        <div className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Cinema & CapCut Gradient Presets
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESET_GRADIENTS.map(p => {
            const preview = buildLinearGradientCss(
              p.stops.map((s, i) => ({ id: `${i}`, color: s.color, offset: s.offset })),
              p.angle
            );
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 bg-white dark:bg-zinc-850 hover:shadow-2xs transition-all cursor-pointer flex flex-col gap-1.5 text-left group"
              >
                <div 
                  className="h-4 w-full rounded-md shadow-2xs border border-black/10 group-hover:scale-102 transition-transform" 
                  style={{ background: preview }}
                />
                <span className="font-bold text-[9.5px] text-zinc-800 dark:text-zinc-200 truncate">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
