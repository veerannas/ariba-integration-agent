"use client";
import { useEffect, useState } from "react";

export default function WebMCPBadge() {
  const [status, setStatus] = useState<"checking" | "active" | "inactive">("checking");

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("tools" in navigator && !!navigator.tools ? "active" : "inactive");
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (status === "checking") return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        status === "active"
          ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300"
          : "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
      }`}
      title={
        status === "active"
          ? "WebMCP active — agents can call tools on this page"
          : "WebMCP not detected. Enable chrome://flags/#enable-webmcp-testing or open in ChatGPT browser"
      }
    >
      <span
        className={`h-2 w-2 rounded-full ${
          status === "active" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
        }`}
      />
      {status === "active" ? "WebMCP Active" : "WebMCP Off"}
    </span>
  );
}
