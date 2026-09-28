import React from 'react';
import { motion } from 'framer-motion';

export const MascotBase = ({ children, color = "hsl(var(--primary))", title }: { children: React.ReactNode, color?: string, title?: string }) => (
  <motion.div 
    whileHover={{ scale: 1.05 }}
    className="relative flex items-center justify-center w-16 h-16 rounded-xl border-2 bg-card overflow-hidden shadow-lg"
    style={{ borderColor: color }}
    title={title}
  >
    <div className="absolute inset-0 opacity-10" style={{ backgroundColor: color }} />
    {children}
  </motion.div>
);

export const LoadBot = () => (
  <MascotBase color="hsl(162 66% 50%)" title="LoadBot - Load Balancer">
    <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current text-primary">
      <path d="M 20 40 L 80 40 L 80 80 L 20 80 Z" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="35" cy="60" r="6" />
      <circle cx="65" cy="60" r="6" />
      <path d="M 50 15 L 30 35 L 70 35 Z" />
      <path d="M 40 40 L 40 30 M 60 40 L 60 30" stroke="currentColor" strokeWidth="4" />
    </svg>
  </MascotBase>
);

export const ShieldGuard = () => (
  <MascotBase color="hsl(0 85% 60%)" title="ShieldGuard - Circuit Breaker">
    <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current text-destructive">
      <path d="M 50 10 L 20 25 L 20 60 C 20 80 50 95 50 95 C 50 95 80 80 80 60 L 80 25 Z" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M 40 50 L 50 60 L 70 40" fill="none" stroke="currentColor" strokeWidth="6" />
    </svg>
  </MascotBase>
);

export const MailCarrier = () => (
  <MascotBase color="hsl(45 100% 55%)" title="MailCarrier - Message Queue">
    <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current text-warning">
      <path d="M 15 30 L 85 30 L 85 70 L 15 70 Z" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M 15 30 L 50 55 L 85 30" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="50" cy="15" r="8" />
    </svg>
  </MascotBase>
);

export const DataDroid = () => (
  <MascotBase color="hsl(151 100% 73%)" title="DataDroid - Database">
    <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current text-accent">
      <ellipse cx="50" cy="25" rx="35" ry="12" fill="none" stroke="currentColor" strokeWidth="6" />
      <ellipse cx="50" cy="50" rx="35" ry="12" fill="none" stroke="currentColor" strokeWidth="6" />
      <ellipse cx="50" cy="75" rx="35" ry="12" fill="none" stroke="currentColor" strokeWidth="6" />
      <path d="M 15 25 L 15 75 M 85 25 L 85 75" fill="none" stroke="currentColor" strokeWidth="6" />
      <rect x="40" y="35" width="20" height="6" />
    </svg>
  </MascotBase>
);

export const SpeedDemon = () => (
  <MascotBase color="hsl(190 100% 60%)" title="SpeedDemon - Rate Limiter">
    <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current" style={{ color: "hsl(190 100% 60%)" }}>
      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="160 60" transform="rotate(135 50 50)" />
      <path d="M 50 50 L 70 30" stroke="currentColor" strokeWidth="6" />
      <circle cx="50" cy="50" r="6" />
    </svg>
  </MascotBase>
);

export const ArchitectBot = () => (
  <MascotBase color="hsl(280 80% 60%)" title="ArchitectBot - System Architecture">
    <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current" style={{ color: "hsl(280 80% 60%)" }}>
      <rect x="25" y="25" width="50" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="6" />
      <line x1="25" y1="50" x2="75" y2="50" stroke="currentColor" strokeWidth="4" />
      <line x1="50" y1="25" x2="50" y2="75" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="8" />
    </svg>
  </MascotBase>
);

export const NetWeaver = () => (
  <MascotBase color="hsl(200 100% 50%)" title="NetWeaver - Networking">
    <svg viewBox="0 0 100 100" className="w-10 h-10 fill-current" style={{ color: "hsl(200 100% 50%)" }}>
      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="4" />
      <line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" strokeWidth="4" />
      <line x1="25" y1="25" x2="75" y2="75" stroke="currentColor" strokeWidth="4" />
      <line x1="25" y1="75" x2="75" y2="25" stroke="currentColor" strokeWidth="4" />
    </svg>
  </MascotBase>
);
