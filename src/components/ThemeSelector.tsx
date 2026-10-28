import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Zap, Sparkles, Droplets, Flame, Check, Palette, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export type AppTheme = 'classic' | 'cinematic' | 'cyber' | 'neon' | 'sapphire' | 'amber';

export interface ThemeDefinition {
  id: AppTheme;
  name: string;
  category: 'Light' | 'Dark' | 'Special';
  description: string;
  isDark: boolean;
  colors: {
    primary: string;
    bg: string;
    accent: string;
    border: string;
  };
  icon: React.FC<{ size?: number; className?: string }>;
}

export const APP_THEMES: ThemeDefinition[] = [
  {
    id: 'classic',
    name: 'Classic Light',
    category: 'Light',
    description: 'Clean studio aesthetic with emerald accents and crisp slate borders',
    isDark: false,
    colors: {
      primary: '#059669',
      bg: '#f4f4f5',
      accent: '#10b981',
      border: '#e4e4e7'
    },
    icon: Sun
  },
  {
    id: 'cinematic',
    name: 'Cinematic Dark',
    category: 'Dark',
    description: 'Deep zinc charcoal with emerald studio highlights and balanced contrast',
    isDark: true,
    colors: {
      primary: '#10b981',
      bg: '#18181b',
      accent: '#34d399',
      border: '#27272a'
    },
    icon: Moon
  },
  {
    id: 'cyber',
    name: 'Cyberpunk (Cyber)',
    category: 'Special',
    description: 'Obsidian dark with electric cyan, neon magenta accents, and sci-fi glowing borders',
    isDark: true,
    colors: {
      primary: '#00f0ff',
      bg: '#07070d',
      accent: '#ff0055',
      border: '#00f0ff55'
    },
    icon: Zap
  },
  {
    id: 'neon',
    name: 'Neon Glow (Synthwave)',
    category: 'Special',
    description: 'Deep violet-navy with radiant magenta glow, purple aura, and glassy backdrops',
    isDark: true,
    colors: {
      primary: '#ec4899',
      bg: '#0c0a1e',
      accent: '#a855f7',
      border: '#ec489955'
    },
    icon: Sparkles
  },
  {
    id: 'sapphire',
    name: 'Midnight Sapphire',
    category: 'Dark',
    description: 'Deep oceanic abyss navy with icy cyan & sapphire tones for relaxing night editing',
    isDark: true,
    colors: {
      primary: '#38bdf8',
      bg: '#060e1c',
      accent: '#60a5fa',
      border: '#1e293b'
    },
    icon: Droplets
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    category: 'Special',
    description: 'Warm espresso with rich golden amber, bronze highlights, and soft cinema warmth',
    isDark: true,
    colors: {
      primary: '#f59e0b',
      bg: '#120e0a',
      accent: '#fbbf24',
      border: '#292017'
    },
    icon: Flame
  }
];

interface ThemeSelectorProps {
  currentTheme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ currentTheme, onThemeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme = APP_THEMES.find(t => t.id === currentTheme) || APP_THEMES[0];
  const ActiveIcon = activeTheme.icon;

  // Auto-close on click outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-2xs select-none",
          isOpen
            ? "bg-zinc-200/80 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 shadow-xs"
            : "bg-zinc-100 hover:bg-zinc-200/70 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 border-zinc-200 dark:border-zinc-700"
        )}
        title={`Current Theme: ${activeTheme.name}. Click to change theme`}
      >
        <div 
          className="w-4 h-4 rounded-full flex items-center justify-center text-white shadow-2xs shrink-0"
          style={{ backgroundColor: activeTheme.colors.primary }}
        >
          <ActiveIcon size={10} className="stroke-[2.5]" />
        </div>
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 hidden sm:inline">
          {activeTheme.name.split(' ')[0]}
        </span>
        <div className="flex items-center gap-0.5">
          <span 
            className="w-2 h-2 rounded-full border border-black/10 dark:border-white/10" 
            style={{ backgroundColor: activeTheme.colors.accent }} 
          />
        </div>
        <ChevronDown size={12} className={cn("text-zinc-400 transition-transform duration-150", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-2.5 z-[100] animate-in fade-in zoom-in-95 duration-150 space-y-2">
          
          {/* Header */}
          <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <Palette size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                Visual Themes
              </span>
            </div>
            <span className="text-[9.5px] font-mono text-zinc-400 font-bold">
              {APP_THEMES.length} Presets
            </span>
          </div>

          {/* Theme Options Grid */}
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {APP_THEMES.map(theme => {
              const isSelected = theme.id === currentTheme;
              const Icon = theme.icon;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    onThemeChange(theme.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group",
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-800 border-emerald-500/80 dark:border-emerald-400/80 shadow-xs"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Icon size={14} className="stroke-[2.5]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                          {theme.name}
                        </span>
                        {theme.category === 'Special' && (
                          <span className="px-1.5 py-0.2 rounded-full text-[8px] font-extrabold uppercase tracking-tight bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate leading-snug">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {/* Color Swatch & Selected Indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center -space-x-1">
                      <span 
                        className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-2xs" 
                        style={{ backgroundColor: theme.colors.bg }}
                        title="Background" 
                      />
                      <span 
                        className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-2xs" 
                        style={{ backgroundColor: theme.colors.primary }}
                        title="Primary" 
                      />
                      <span 
                        className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-zinc-900 shadow-2xs" 
                        style={{ backgroundColor: theme.colors.accent }}
                        title="Accent" 
                      />
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check size={11} className="stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
};
