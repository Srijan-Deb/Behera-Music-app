"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("ServiceWorker registered with scope:", registration.scope);
        })
        .catch((err) => {
          console.log("ServiceWorker registration failed:", err);
        });
    }
  }, []);

  return null;
}
