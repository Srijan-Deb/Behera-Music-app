"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Palette, ChevronDown, Check } from "lucide-react";

const themes = [
  { id: "dark", name: "Dark Mode", color: "bg-zinc-900" },
  { id: "light", name: "Light Mode", color: "bg-white border border-black/10" },
  { id: "theme-cyberpunk", name: "Cyberpunk", color: "bg-fuchsia-600" },
  { id: "theme-ocean", name: "Ocean", color: "bg-cyan-600" },
  { id: "theme-sunset", name: "Sunset", color: "bg-orange-500" },
  { id: "theme-forest", name: "Forest", color: "bg-emerald-700" },
  { id: "theme-grid", name: "Blueprint Grid", color: "bg-indigo-900 border border-white/20" },
  { id: "theme-dots", name: "Polka Dots", color: "bg-yellow-600 border border-white/20" },
  { id: "theme-lines", name: "Crimson Waves", color: "bg-red-800 border border-white/20" }
] as const;

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeTheme = themes.find(t => t.id === theme) || themes[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors text-sm font-medium"
      >
        <Palette className="w-4 h-4 text-primary" />
        <span className="hidden sm:inline">{activeTheme.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180': ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border shadow-lg rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
           <div className="py-1 flex flex-col">
              {themes.map((t) => (
                 <button
                   key={t.id}
                   onClick={() => {
                     setTheme(t.id as any);
                     setIsOpen(false);
                   }}
                   className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5 w-full text-left
                     ${theme === t.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80'}`}
                 >
                   <div className={`w-4 h-4 rounded-full ${t.color} shadow-sm`} />
                   <span className="flex-1">{t.name}</span>
                   {theme === t.id && <Check className="w-4 h-4" />}
                 </button>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}
