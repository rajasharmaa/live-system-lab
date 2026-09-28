import { motion } from "framer-motion";
import { Activity, ArrowDown, Database, Network, Play, Server, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArchitectBot, DataDroid, LoadBot, SpeedDemon } from "./ui/SVGMascots";

const HeroSection = () => {
  return (
    <section className="relative min-h-[92vh] overflow-hidden grid-pattern">
      <div className="container relative z-10 px-5 py-6 md:px-8">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <div className="flex items-center gap-3"><div className="signal-icon size-9"><Network className="size-4" /></div><div><div className="font-heading text-sm font-bold">SYSTEM DESIGN</div><div className="font-mono text-[9px] uppercase text-muted-foreground">Interactive simulator</div></div></div>
          <div className="hidden items-center gap-7 font-mono text-[10px] uppercase text-muted-foreground sm:flex"><span className="text-primary">● System active</span><span>Latency 24ms</span><span>Nodes 12/12</span><span>Uptime 99.99%</span></div>
        </header>
        <div className="grid min-h-[620px] items-center gap-12 py-12 lg:grid-cols-[1.25fr_.75fr]">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
              <div className="mb-7 inline-flex items-center gap-2 border border-border bg-card/70 px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-mono text-muted-foreground">
                Real-Time System Simulation
              </span>
            </div>

            <h1 className="font-heading text-5xl font-bold leading-[.95] md:text-7xl lg:text-8xl">
              System Design<br /><span className="gradient-text">Simulator</span>
            </h1>

            <p className="my-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Architect, visualize, and stress-test the distributed systems that power the world's largest products.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-sm uppercase" onClick={() => document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" })}><Play /> Launch simulator</Button>
              <Button size="lg" variant="outline" className="rounded-sm uppercase" onClick={() => document.getElementById("core-concepts")?.scrollIntoView({ behavior: "smooth" })}>Core concepts <ArrowDown /></Button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 border-t border-border pt-8">
              {[
                { value: "10K+", label: "Requests/sec" },
                { value: "<5ms", label: "Cache Latency" },
                { value: "99.9%", label: "Uptime" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <div className="font-mono text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="data-label mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual - System Diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Central node */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
                  <div className="absolute inset-0 w-full h-full rounded-full bg-primary/30 animate-pulse-ring" />
                </div>
              </motion.div>

              {/* Center Hub */}
              <div className="absolute top-1/2 left-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/40 bg-card glow-effect">
                <ArchitectBot />
              </div>

              {/* Orbiting nodes */}
              {[
                { component: <DataDroid />, label: "Redis", delay: 0, position: "top-0 left-1/2 -translate-x-1/2" },
                { component: <LoadBot />, label: "Load Balancer", delay: 1, position: "top-1/2 right-0 -translate-y-1/2" },
                { component: <SpeedDemon />, label: "Rate Limit", delay: 2, position: "bottom-0 left-1/2 -translate-x-1/2" },
                { component: <DataDroid />, label: "Database", delay: 3, position: "top-1/2 left-0 -translate-y-1/2" },
              ].map(({ component, label, delay, position }) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + delay * 0.15 }}
                  className={`absolute ${position}`}
                >
                  <div className="command-panel p-2 float-animation flex flex-col items-center justify-center" style={{ animationDelay: `${delay * 0.5}s` }}>
                    {component}
                    <span className="text-[10px] font-mono text-muted-foreground mt-2">{label}</span>
                  </div>
                </motion.div>
              ))}

              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-45deg)' }}>
                <circle
                  cx="50%"
                  cy="50%"
                  r="40%"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  strokeDasharray="8 8"
                  opacity="0.3"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;
