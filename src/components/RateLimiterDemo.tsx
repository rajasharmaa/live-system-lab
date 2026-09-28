import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Zap, ShieldAlert, Info, Play, Pause } from "lucide-react";
import { SpeedDemon } from "./ui/SVGMascots";

interface DataPoint {
  time: number;
  allowed: number;
  blocked: number;
}

export const RateLimiterInteractive = () => {
  const [rps, setRps] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState({ allowed: 0, blocked: 0 });
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [recentEvents, setRecentEvents] = useState<{ id: number; allowed: boolean }[]>([]);
  const eventIdRef = useRef(0);
  const rateLimit = 500; // Max allowed requests per interval

  const processRequests = useCallback(() => {
    const allowed = Math.min(rps, rateLimit);
    const blocked = Math.max(0, rps - rateLimit);

    setStats((prev) => ({
      allowed: prev.allowed + allowed,
      blocked: prev.blocked + blocked,
    }));

    setChartData((prev) => {
      const newData = [
        ...prev.slice(-29),
        { time: Date.now(), allowed, blocked },
      ];
      return newData;
    });

    // Add visual events
    const newEvents = [];
    for (let i = 0; i < Math.min(5, allowed / 20); i++) {
      newEvents.push({ id: eventIdRef.current++, allowed: true });
    }
    for (let i = 0; i < Math.min(3, blocked / 20); i++) {
      newEvents.push({ id: eventIdRef.current++, allowed: false });
    }
    setRecentEvents((prev) => [...prev.slice(-10), ...newEvents]);
  }, [rps]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(processRequests, 500);
    return () => clearInterval(interval);
  }, [isRunning, processRequests]);

  // Clean up old events
  useEffect(() => {
    const timeout = setTimeout(() => {
      setRecentEvents((prev) => prev.slice(-8));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [recentEvents]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="glass-card p-4 rounded-xl flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm md:text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Traffic Control
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] md:text-sm text-muted-foreground">Requests/sec</label>
                  <span className="font-mono text-primary">{rps}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={rps}
                  onChange={(e) => setRps(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[9px] md:text-xs text-muted-foreground mt-1">
                  <span>10</span>
                  <span className="text-warning">Limit: {rateLimit}</span>
                  <span>1000</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsRunning(!isRunning)}
                className={`w-full py-2 md:py-3 rounded-lg text-xs md:text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isRunning
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Stop
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Start
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Live Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-4 rounded-xl lg:col-span-2"
        >
          <h3 className="text-sm md:text-lg font-semibold mb-2">Real-Time Traffic Flow</h3>

          <div className="h-32 md:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="time"
                  tickFormatter={() => ""}
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.3}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.3}
                  width={30}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="allowed"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  dot={false}
                  name="Allowed"
                />
                <Line
                  type="monotone"
                  dataKey="blocked"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  dot={false}
                  name="Blocked (429)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-2 md:p-4 rounded-lg bg-success/10 border border-success/30">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] md:text-sm text-muted-foreground">Allowed</span>
              </div>
              <div className="text-lg md:text-3xl font-bold font-mono text-success">
                {stats.allowed.toLocaleString()}
              </div>
            </div>
            <div className="p-2 md:p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-center gap-1.5 md:gap-2 mb-1">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-destructive animate-pulse" />
                <span className="text-[10px] md:text-sm text-muted-foreground">Blocked (429)</span>
              </div>
              <div className="text-lg md:text-3xl font-bold font-mono text-destructive">
                {stats.blocked.toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const RateLimiterDemo = () => {
  return (
    <section className="py-24 px-6">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <SpeedDemon />
          <div>
            <h2 className="text-3xl font-bold mb-2">Live Rate Limiter</h2>
            <p className="text-muted-foreground">
              Rate limiting controls how many requests a user or service can make in a given timeframe.
              <strong> Why?</strong> Prevents abuse, mitigates DDoS attacks, and ensures fair usage (noisy neighbor problem).
              <strong> Real-world:</strong> Twitter API limits, AWS API Gateway throttling.
            </p>
          </div>
        </div>
        <RateLimiterInteractive />
      </div>
    </section>
  );
};

export default RateLimiterDemo;
