'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-[85vh] bg-[#0a0a0f] flex flex-col justify-center items-center text-center px-6 relative overflow-hidden font-body text-[#e2e8f0]">
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#00d4ff]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#ff6b35]/10 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 z-10">
        {/* Main Logo Representation */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center rounded-3xl bg-gradient-to-br from-[#00d4ff] to-[#ff6b35] p-[2px] shadow-[0_0_40px_rgba(0,212,255,0.4)] animate-pulse">
          <div className="w-full h-full bg-[#0a0a0f] rounded-[22px] flex items-center justify-center">
            <svg className="w-16 h-16 text-[#00d4ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] via-[#e2e8f0] to-[#ff6b35] drop-shadow-[0_0_20px_rgba(0,212,255,0.2)]">
            FitQuanta
          </h1>
          <p className="font-display text-lg md:text-xl font-bold tracking-widest text-[#00d4ff] uppercase">
            Next-Gen AI Fitness Platform
          </p>
        </div>

        <p className="max-w-2xl mx-auto text-sm md:text-base text-[#94a3b8] leading-relaxed">
          Unlock customized 7-day training templates and nutrient-dense meal structures designed using LLMs,
          protected by our secure Medical Safety Gate. Track your biometrics using real-time interactive charts.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-[#00d4ff] text-[#0a0a0f] font-bold rounded-xl hover:bg-[#0099bb] transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] text-center"
          >
            Start Free Generation
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 border border-[#ff6b35] text-[#ff6b35] font-bold rounded-xl hover:bg-[#ff6b35]/10 transition-all shadow-[0_0_20px_rgba(255,107,53,0.1)] hover:shadow-[0_0_30px_rgba(255,107,53,0.3)] text-center"
          >
            Access Dashboard
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <h3 className="font-display font-bold text-lg text-[#00d4ff] mb-2">1. BMI Tracking</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Verify your metrics on our secure platform. View color-coded scales mapping your category accurately.
            </p>
          </div>
          <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <h3 className="font-display font-bold text-lg text-[#ff6b35] mb-2">2. Llama 3 AI Plans</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Get clean diet recipes and structured exercise routines computed client-side and saved into MongoDB.
            </p>
          </div>
          <div className="bg-[#12121a] p-6 rounded-2xl border border-[#1e1e2e] shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <h3 className="font-display font-bold text-lg text-[#00d4ff] mb-2">3. Safety Gate</h3>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Automatic validation halts LLM injection and skips query outputs if injuries or conditions are reported.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
