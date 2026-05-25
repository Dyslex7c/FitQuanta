'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="page-wrapper">

      {/* Hero — void black with grid and cold moon glow behind center */}
      <section className="bg-void-grid" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

        {/* Moon radial — faint gold glow in the center, like in the logo */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(232,168,32,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Warm glow bottom — fire from the tail */}
        <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '200px', background: 'radial-gradient(ellipse at center, rgba(240,112,40,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: '580px', margin: '0 auto' }}>

          <img src="/logo.png" alt="FitQuanta" style={{ height: '100px', width: '100px', margin: '0 auto 28px', display: 'block' }} />

          {/* Orange-gold gradient title — matches the phoenix fire */}
          <h1 style={{
            fontFamily: 'var(--font-display), Orbitron, sans-serif',
            fontSize: 'clamp(2rem, 6vw, 3.5rem)',
            fontWeight: 900,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f07028 50%, #e8a820 100%)',
            backgroundClip: 'text',
            marginBottom: '16px',
            lineHeight: 1.05,
          }}>
            FitQuanta
          </h1>

          <p style={{ fontSize: '16px', color: '#9090a0', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto 10px' }}>
            AI-powered fitness plans built around you. Track progress. Train with certified coaches.
          </p>
          <p style={{ fontSize: '12px', color: '#545870', marginBottom: '40px' }}>
            Free for users without medical conditions.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-lg">Get started free</Link>
            <Link href="/login" className="btn btn-outline btn-lg">Sign in</Link>
          </div>

          {/* Trust line */}
          <p style={{ fontSize: '12px', color: '#545870', marginTop: '36px', letterSpacing: '0.04em' }}>
            No credit card &nbsp;·&nbsp; Free AI plans &nbsp;·&nbsp; Cancel anytime
          </p>
        </div>
      </section>

      {/* Features strip */}
      <section style={{ borderTop: '1px solid #22223a', background: '#0d0d14' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '48px' }}>
          {[
            { accent: '#f07028', label: 'AI Plans', body: '7-day workout and diet plan generated from your profile in seconds. Free, no conditions.' },
            { accent: '#1ed696', label: 'Progress Tracking', body: 'Log workouts, meals, sleep and steps. Six charts show your progress over time.' },
            { accent: '#e8a820', label: 'Certified Trainers', body: 'Medical condition? Buy a customised plan from a verified trainer on our marketplace.' },
          ].map(f => (
            <div key={f.label}>
              <p style={{ fontFamily: 'var(--font-display), Orbitron, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: f.accent, marginBottom: '10px' }}>
                {f.label}
              </p>
              <p style={{ fontSize: '13px', color: '#9090a0', lineHeight: 1.7 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>


    </main>
  );
}
