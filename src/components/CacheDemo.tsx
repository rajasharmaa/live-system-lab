import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Database, Power, Info, Zap } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

interface CacheEvent {
  id: number;
  hit: boolean;
  latency: number;
  timestamp: Date;
}

export const CacheInteractive = () => {
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [events, setEvents] = useState<CacheEvent[]>([]);
  const [flashState, setFlashState] = useState<"hit" | "miss" | null>(null);
  const [cache] = useState<Map<string, { data: string; expires: number }>>(new Map());
  const eventId = useState({ current: 0 })[0];

  const simulateRequest = useCallback(() => {
    const key = "user_data";
    const now = Date.now();
    let hit = false;
    let latency: number;

    if (cacheEnabled && cache.has(key)) {
      const cached = cache.get(key)!;
      if (cached.expires > now) {
        hit = true;
        latency = 2 + Math.random() * 3; // 2-5ms cache hit
      } else {
        cache.delete(key);
        latency = 150 + Math.random() * 100; // 150-250ms DB hit
      }
    } else {
      latency = 150 + Math.random() * 100; // 150-250ms DB hit
    }

    // Set cache if enabled
    if (cacheEnabled && !hit) {
      cache.set(key, { data: "user_data", expires: now + 5000 }); // 5s TTL
    }

    const event: CacheEvent = {
      id: eventId.current++,
      hit,
      latency: Math.round(latency),
      timestamp: new Date(),
    };

    setEvents((prev) => [...prev.slice(-19), event]);
    setFlashState(hit ? "hit" : "miss");
    setTimeout(() => setFlashState(null), 500);
  }, [cacheEnabled, cache, eventId]);

  const avgLatency = events.length > 0
    ? Math.round(events.reduce((a, b) => a + b.latency, 0) / events.length)
    : 0;

  const hitRate = events.length > 0
    ? Math.round((events.filter((e) => e.hit).length / events.length) * 100)
    : 0;

  const latencyData = events.slice(-10).map((e, i) => ({
    name: i + 1,
    latency: e.latency,
    hit: e.hit,
  }));

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Visual Demo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card p-4 md:p-8 rounded-xl relative overflow-hidden"
        >
          {/* Flash effect */}
          <AnimatePresence>
            {flashState && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 ${
                  flashState === "hit" ? "bg-success" : "bg-destructive"
                }`}
              />
            )}
          </AnimatePresence>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h3 className="text-sm md:text-lg font-semibold flex items-center gap-2">
                <Database className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                Redis Cache
              </h3>
              <button
                onClick={() => {
                  setCacheEnabled(!cacheEnabled);
                  cache.clear();
                  setEvents([]);
                }}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors text-[10px] md:text-sm ${
                  cacheEnabled
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                <Power className="w-3 h-3 md:w-4 md:h-4" />
                {cacheEnabled ? "ON" : "OFF"}
              </button>
            </div>

            {/* Architecture visualization */}
            <div className="flex items-center justify-between gap-2 md:gap-4 mb-6 md:mb-8">
              <div className="flex-1 p-2 md:p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-xl md:text-2xl mb-1">👤</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Client</div>
              </div>

              <motion.div
                animate={{ scaleX: flashState ? [1, 1.2, 1] : 1 }}
                className="flex-1 h-1 bg-gradient-to-r from-primary to-secondary rounded"
              />

              <div className={`flex-1 p-2 md:p-4 rounded-lg text-center transition-colors ${
                cacheEnabled ? "bg-primary/20 border border-primary/30" : "bg-muted/30"
              }`}>
                <div className="text-xl md:text-2xl mb-1">⚡</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Redis</div>
                <div className="text-[8px] md:text-xs font-mono text-primary mt-1">
                  {cacheEnabled ? "ACTIVE" : "DISABLED"}
                </div>
              </div>

              <motion.div
                animate={{ scaleX: flashState === "miss" ? [1, 1.2, 1] : 1 }}
                className={`flex-1 h-1 rounded ${
                  flashState === "miss" ? "bg-destructive" : "bg-muted"
                }`}
              />

              <div className="flex-1 p-2 md:p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-xl md:text-2xl mb-1">🗄️</div>
                <div className="text-[10px] md:text-xs text-muted-foreground">Database</div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={simulateRequest}
              className="w-full py-3 md:py-4 rounded-lg text-sm md:text-base font-semibold bg-primary text-primary-foreground glow-effect"
            >
              <Zap className="inline-block w-4 h-4 md:w-5 md:h-5 mr-2" />
              Send Request
            </motion.button>

            {/* Tooltip */}
            <div className="p-3 md:p-4 rounded-lg bg-muted/50 border border-border/50 mt-4 md:mt-6">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-[10px] md:text-xs text-muted-foreground">
                  <strong className="text-foreground">How Redis helps:</strong>
                  <br />
                  Cache stores frequently accessed data in memory. First request 
                  hits DB (~150ms), subsequent requests hit cache (~3ms) until TTL expires.
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-4 md:space-y-6"
        >
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 md:p-6 rounded-xl">
              <div className="text-[10px] md:text-sm text-muted-foreground mb-1">Avg Latency</div>
              <div className={`text-2xl md:text-4xl font-bold font-mono ${
                avgLatency < 20 ? "text-success" : avgLatency < 100 ? "text-warning" : "text-destructive"
              }`}>
                {avgLatency}<span className="text-sm md:text-lg">ms</span>
              </div>
            </div>
            <div className="glass-card p-4 md:p-6 rounded-xl">
              <div className="text-[10px] md:text-sm text-muted-foreground mb-1">Hit Rate</div>
              <div className={`text-2xl md:text-4xl font-bold font-mono ${
                hitRate > 70 ? "text-success" : hitRate > 30 ? "text-warning" : "text-muted-foreground"
              }`}>
                {hitRate}<span className="text-sm md:text-lg">%</span>
              </div>
            </div>
          </div>

          {/* Latency chart */}
          <div className="glass-card p-4 md:p-6 rounded-xl">
            <h3 className="text-sm md:text-lg font-semibold mb-2 md:mb-4">Latency per Request</h3>
            <div className="h-32 md:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyData}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} tick={{ fontSize: 10 }} />
                  <YAxis stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} width={30} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number, name: string, props: { payload: { hit: boolean } }) => [
                      `${value}ms`,
                      props.payload.hit ? "Cache Hit" : "DB Query"
                    ]}
                  />
                  <Bar dataKey="latency" radius={[4, 4, 0, 0]}>
                    {latencyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.hit ? "hsl(var(--success))" : "hsl(var(--destructive))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex gap-4 md:gap-6 mt-4 justify-center">
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded bg-success" />
                <span className="text-[10px] md:text-sm text-muted-foreground">Cache Hit (~3ms)</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded bg-destructive" />
                <span className="text-[10px] md:text-sm text-muted-foreground">DB Query (~150ms)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const CacheDemo = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-card/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Distributed Caching (Redis)</h2>
            <p className="text-muted-foreground">
              A cache is a fast, in-memory data store (like Redis/Memcached) used to store frequently accessed data.
              <strong> Why?</strong> Reduces database load and dramatically lowers response latency (milliseconds vs microseconds).
              <strong> Real-world:</strong> User sessions, recent tweets, product catalogs.
            </p>
          </div>
        </div>
        <CacheInteractive />
      </div>
    </section>
  );
};

export default CacheDemo;
