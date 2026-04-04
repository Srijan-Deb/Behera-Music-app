"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, PlusSquare } from "lucide-react";

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed/standalone
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Prompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Delay prompt slightly to not annoy immediately
      const timer = setTimeout(() => {
        if (!isStandaloneMode) setShowPrompt(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    };

    // Show prompt for iOS if not standalone
    if (isIOSDevice && !isStandaloneMode) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-8 md:w-96"
      >
        <div className="bg-card/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          {/* Subtle gradient background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
          
          <button 
            onClick={() => setShowPrompt(false)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/5 transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-inner">
              <Download className="w-6 h-6 text-emerald-400" />
            </div>
            
            <div className="flex flex-col gap-1 pr-6">
              <h3 className="font-bold text-lg leading-tight text-white">Install Behera</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Download the app for a faster, offline-ready music experience on your phone.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {isIOS ? (
              <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-2 border border-white/5">
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">Step 1</span> Tap the share icon below
                </p>
                <div className="flex items-center justify-center py-1">
                  <Share className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-xs text-muted-foreground font-medium flex items-center gap-2 border-t border-white/5 pt-2">
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px]">Step 2</span> Scroll and tap <span className="text-white font-bold flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3 h-3"/></span>
                </p>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Install Now
              </button>
            )}
            
            <button 
              onClick={() => setShowPrompt(false)}
              className="w-full py-2.5 text-xs text-muted-foreground hover:text-white transition-colors text-center font-medium"
            >
              Maybe later
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
