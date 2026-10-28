import React, { useState, useMemo } from 'react';
import { 
  Wand2, 
  Palette, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Copy, 
  Sliders, 
  Contrast,
  ArrowRight,
  Sun,
  Type
} from 'lucide-react';
import { 
  HarmonyType, 
  generateHarmonies, 
  calculateOptimalSubtitleRoles, 
  CINEMA_THEMATIC_PALETTES, 
  normalizeHex,
  getContrastRatio,
  hslToHex
} from '../../utils/colorUtils';
import { AdvancedColorPicker } from './AdvancedColorPicker';
import { cn } from '../../utils/cn';

interface ColorPaletteGeneratorProps {
  onApplyRoles: (roles: {
    textColor: string;
    outlineColor: string;
    shadowColor: string;
    accentColor: string;
  }) => void;
  onApplyToCustomPalette: (colors: string[], name: string) => void;
  initialBaseColor?: string;
  className?: string;
}

export const ColorPaletteGenerator: React.FC<ColorPaletteGeneratorProps> = ({
  onApplyRoles,
  onApplyToCustomPalette,
  initialBaseColor = '#F59E0B',
  className
}) => {
  const [baseColor, setBaseColor] = useState(normalizeHex(initialBaseColor));
  const [harmonyType, setHarmonyType] = useState<HarmonyType>('complementary');
  const [appliedToast, setAppliedToast] = useState<string | null>(null);

  // Generate harmonic colors based on active base color & harmony mode
  const generatedColors = useMemo(() => {
    return generateHarmonies(baseColor, harmonyType);
  }, [baseColor, harmonyType]);

  // Calculate optimal roles for subtitles (Text, Stroke, Shadow)
  const computedRoles = useMemo(() => {
    return calculateOptimalSubtitleRoles(generatedColors);
  }, [generatedColors]);

  // Contrast ratio between text and outline
  const contrastRatio = useMemo(() => {
    return getContrastRatio(computedRoles.textColor, computedRoles.outlineColor).toFixed(1);
  }, [computedRoles]);

  // Handle randomize harmony base
  const handleRandomizeBase = () => {
    const randomHue = Math.floor(Math.random() * 360);
    const randomSat = Math.floor(65 + Math.random() * 35);
    const randomLight = Math.floor(45 + Math.random() * 35);
    const newHex = hslToHex({ h: randomHue, s: randomSat, l: randomLight });
    setBaseColor(newHex);
  };

  // Trigger apply to roles
  const handleApplyRolesToSubtitle = () => {
    onApplyRoles(computedRoles);
    setAppliedToast("Applied color scheme to Text, Outline & Shadow!");
    setTimeout(() => setAppliedToast(null), 2500);
  };

  // Trigger apply to custom palette
  const handleApplyToTimelinePalette = () => {
    onApplyToCustomPalette(generatedColors, `${harmonyType.toUpperCase()} Scheme`);
    setAppliedToast("Added to project gradient palette!");
    setTimeout(() => setAppliedToast(null), 2500);
  };

  // Select a curated thematic scheme
  const handleSelectThematic = (thm: typeof CINEMA_THEMATIC_PALETTES[0]) => {
    setBaseColor(thm.base);
    onApplyToCustomPalette(thm.colors, thm.name);
    const roles = calculateOptimalSubtitleRoles(thm.colors);
    onApplyRoles(roles);
    setAppliedToast(`Applied "${thm.name}" theme!`);
    setTimeout(() => setAppliedToast(null), 2500);
  };

  return (
    <div className={cn("p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Wand2 size={13} className="text-emerald-500" />
          <span>Color Theory & Harmony Palette Generator</span>
        </label>
        <button
          type="button"
          onClick={handleRandomizeBase}
          className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer transition-colors"
          title="Randomize base color"
        >
          <RefreshCw size={11} />
          <span>Randomize Base</span>
        </button>
      </div>

      {/* Base Color Picker & Harmony Type Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 rounded-xl">
        {/* Base Color Input */}
        <div className="space-y-1.5">
          <label className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">
            Anchor Base Color
          </label>
          <div className="flex items-center gap-2">
            <AdvancedColorPicker
              color={baseColor}
              onChange={newCol => setBaseColor(newCol)}
              showAlpha={false}
            />
            <span className="text-[9px] text-zinc-400">
              Harmonies radiate from this color
            </span>
          </div>
        </div>

        {/* Harmony Type Mode */}
        <div className="space-y-1.5">
          <label className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500">
            Harmony Rule
          </label>
          <select
            value={harmonyType}
            onChange={e => setHarmonyType(e.target.value as HarmonyType)}
            className="w-full p-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="complementary">Complementary (High Contrast 180°)</option>
            <option value="analogous">Analogous (Smooth Adjacent ±30°)</option>
            <option value="triadic">Triadic (Dynamic 3-Way 120°)</option>
            <option value="split-complementary">Split-Complementary (Rich Depth)</option>
            <option value="tetradic">Tetradic / Square (Rich 4-Way 90°)</option>
            <option value="monochromatic">Monochromatic (Cinema Luminance)</option>
          </select>
        </div>
      </div>

      {/* Generated Harmonic Palette Swatches */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            Generated Harmonic Scheme ({generatedColors.length} Tones)
          </span>
          <button
            type="button"
            onClick={handleApplyToTimelinePalette}
            className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            + Add to Timeline Gradient
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {generatedColors.map((col, idx) => (
            <div 
              key={col + idx}
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center gap-1.5 shadow-2xs group"
            >
              <div 
                className="w-full h-8 rounded-lg border border-black/10 shadow-inner group-hover:scale-102 transition-transform" 
                style={{ backgroundColor: col }}
              />
              <span className="font-mono text-[9px] font-bold text-zinc-700 dark:text-zinc-300">
                {col}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligent Role Assignment Card (Primary Text, Outline, Shadow) */}
      <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200 text-xs">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Optimal Subtitle Role Assignment</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-mono text-[9px] font-bold">
            <Contrast size={10} />
            <span>{contrastRatio}:1 Contrast</span>
          </div>
        </div>

        <p className="text-[9.5px] text-zinc-600 dark:text-zinc-400 leading-tight">
          Automatically maps harmonic tones to primary text fill, broadcast outline stroke, and cinematic shadow depth for guaranteed readability.
        </p>

        {/* Roles Badges Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Primary Text */}
          <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: computedRoles.textColor }} />
            <div className="truncate">
              <div className="text-[8.5px] font-bold uppercase text-zinc-400">Primary Text (\1c)</div>
              <div className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200">{computedRoles.textColor}</div>
            </div>
          </div>

          {/* Stroke Outline */}
          <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: computedRoles.outlineColor }} />
            <div className="truncate">
              <div className="text-[8.5px] font-bold uppercase text-zinc-400">Stroke Outline (\3c)</div>
              <div className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200">{computedRoles.outlineColor}</div>
            </div>
          </div>

          {/* Shadow / Glow */}
          <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border border-black/20 shrink-0" style={{ backgroundColor: computedRoles.shadowColor }} />
            <div className="truncate">
              <div className="text-[8.5px] font-bold uppercase text-zinc-400">Shadow Depth (\4c)</div>
              <div className="font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200">{computedRoles.shadowColor}</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleApplyRolesToSubtitle}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
          >
            <Check size={13} />
            <span>Apply Harmonic Roles to Text, Stroke & Shadow</span>
          </button>
        </div>

        {appliedToast && (
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[9.5px] text-center animate-in fade-in duration-200">
            {appliedToast}
          </div>
        )}
      </div>

      {/* Curated Thematic Cinema Palettes */}
      <div className="space-y-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
        <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
          Curated Cinema & Urdu Calligraphy Palettes
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CINEMA_THEMATIC_PALETTES.map(thm => (
            <button
              key={thm.name}
              type="button"
              onClick={() => handleSelectThematic(thm)}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 bg-white dark:bg-zinc-850 hover:shadow-2xs transition-all cursor-pointer flex flex-col gap-1.5 text-left group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[10px] text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600">
                  {thm.name}
                </span>
                <span className="text-[8.5px] text-emerald-600 dark:text-emerald-400 font-bold group-hover:underline">
                  Apply Theme →
                </span>
              </div>

              {/* Color strip */}
              <div className="flex h-2.5 w-full rounded-md overflow-hidden shadow-2xs border border-black/10">
                {thm.colors.map((c, i) => (
                  <div key={i} className="flex-1 h-full" style={{ backgroundColor: c }} />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
