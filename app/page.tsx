'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="page-wrapper">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-grid overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan/5 blur-3xl pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] rounded-full bg-orange/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto animate-fade-in py-12">
          {/* Cyberpunk mechanical phoenix mini-SVG logo */}
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center rounded-3xl bg-gradient-to-br from-cyan to-orange p-[2px] shadow-[0_0_30px_rgba(0,212,255,0.35)] mb-8 animate-pulse-cyan">
            <div className="w-full h-full bg-[#0a0a12] rounded-[22px] flex items-center justify-center">
              <svg className="w-12 h-12 text-cyan" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan to-purple mb-4 drop-shadow-[0_0_15px_rgba(0,212,255,0.25)]">
            FitQuanta
          </h1>

          <p className="text-text-muted text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            AI-powered fitness plans. Professional trainers. Your progress, visualised.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base px-8 py-3 text-center">
              Start for free
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-3 text-center">
              Sign in
            </Link>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
            <div className="card">
              <h3 className="font-display font-bold text-lg text-cyan mb-2">1. BMI Tracking</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Verify your metrics on our secure platform. View color-coded scales mapping your category accurately.
              </p>
            </div>
            <div className="card">
              <h3 className="font-display font-bold text-lg text-orange mb-2">2. Llama AI Plans</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Get clean diet recipes and structured exercise routines computed client-side and saved into MongoDB.
              </p>
            </div>
            <div className="card">
              <h3 className="font-display font-bold text-lg text-cyan mb-2">3. Safety Gate</h3>
              <p className="text-text-muted text-sm leading-relaxed">
                Automatic validation halts LLM injection and skips query outputs if injuries or conditions are reported.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
