import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { Activity, Gauge, Zap, Clock } from "lucide-react";

export const MetricsInteractive = () => {
  const [data, setData] = useState<Array<{
    time: number;
    requests: number;
    latency: number;
    cacheHit: number;
    errors: number;
  }>>([]);

  const [liveStats, setLiveStats] = useState({
    requestsPerSec: 0,
    avgLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
  });

  useEffect(() => {
    const generateData = () => {
      const now = Date.now();
      const requests = 800 + Math.random() * 400;
      const latency = 15 + Math.random() * 10;
      const cacheHit = 85 + Math.random() * 10;
      const errors = Math.random() * 2;

      setLiveStats({
        requestsPerSec: Math.round(requests),
        avgLatency: Math.round(latency),
        cacheHitRate: Math.round(cacheHit),
        errorRate: Number(errors.toFixed(2)),
      });

      setData(prev => [
        ...prev.slice(-19),
        { time: now, requests, latency, cacheHit, errors }
      ]);
    };

    const initialData = [];
    for (let i = 0; i < 20; i++) {
      initialData.push({
        time: Date.now() - (20 - i) * 1000,
        requests: 800 + Math.random() * 400,
        latency: 15 + Math.random() * 10,
        cacheHit: 85 + Math.random() * 10,
        errors: Math.random() * 2
      });
    }
    setData(initialData);

    const interval = setInterval(generateData, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-4 md:p-6 rounded-xl w-full max-w-4xl mx-auto shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
      {/* Live indicator */}
      <div className="flex justify-center mb-4 md:mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 glass-card rounded-full bg-card/60">
          <span className="relative flex h-2 w-2 md:h-3 md:w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 md:h-3 md:w-3 bg-success"></span>
          </span>
          <span className="text-[10px] md:text-sm font-mono text-muted-foreground">
            LIVE
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
        {[
          { label: "Requests", value: liveStats.requestsPerSec, unit: "/s", color: "text-primary", bg: "bg-primary/20" },
          { label: "Latency", value: liveStats.avgLatency, unit: "ms", color: "text-success", bg: "bg-success/20" },
          { label: "Cache Hit", value: liveStats.cacheHitRate, unit: "%", color: "text-secondary", bg: "bg-secondary/20" },
          { label: "Errors", value: liveStats.errorRate, unit: "%", color: "text-warning", bg: "bg-warning/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border/50 p-2 md:p-4 rounded-lg flex flex-col items-center justify-center text-center shadow-sm">
            <div className={`text-sm md:text-2xl font-bold font-mono ${stat.color}`}>
              {stat.value}<span className="text-[8px] md:text-sm text-muted-foreground ml-1">{stat.unit}</span>
            </div>
            <div className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Mini Charts */}
      <div className="grid grid-cols-2 gap-4 h-32 md:h-48">
        <div className="bg-card border border-border/50 rounded-lg p-2 md:p-4 flex flex-col">
          <div className="text-[10px] md:text-xs text-muted-foreground mb-2">Throughput</div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="reqGradientMini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="requests" stroke="hsl(var(--primary))" fill="url(#reqGradientMini)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-lg p-2 md:p-4 flex flex-col">
          <div className="text-[10px] md:text-xs text-muted-foreground mb-2">Latency</div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="latGradientMini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="latency" stroke="hsl(var(--success))" fill="url(#latGradientMini)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricsDashboard = () => {
  const [data, setData] = useState<Array<{
    time: number;
    requests: number;
    latency: number;
    cacheHit: number;
    errors: number;
  }>>([]);

  const [liveStats, setLiveStats] = useState({
    requestsPerSec: 0,
    avgLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
  });

  useEffect(() => {
    const generateData = () => {
      const now = Date.now();
      const requests = 800 + Math.random() * 400;
      const latency = 15 + Math.random() * 10;
      const cacheHit = 85 + Math.random() * 10;
      const errors = Math.random() * 2;

      setLiveStats({
        requestsPerSec: Math.round(requests),
        avgLatency: Math.round(latency),
        cacheHitRate: Math.round(cacheHit),
        errorRate: Number(errors.toFixed(2)),
      });

      setData(prev => [
        ...prev.slice(-59),
        { time: now, requests, latency, cacheHit, errors }
      ]);
    };

    const initialData = [];
    for (let i = 0; i < 30; i++) {
      initialData.push({
        time: Date.now() - (30 - i) * 1000,
        requests: 800 + Math.random() * 400,
        latency: 15 + Math.random() * 10,
        cacheHit: 85 + Math.random() * 10,
        errors: Math.random() * 2
      });
    }
    setData(initialData);

    const interval = setInterval(generateData, 1000);
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    unit, 
    color,
    trend 
  }: { 
    icon: typeof Activity; 
    label: string; 
    value: number | string; 
    unit: string; 
    color: string;
    trend?: "up" | "down" | "stable";
  }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`text-xs px-2 py-1 rounded ${
            trend === "up" ? "bg-success/20 text-success" :
            trend === "down" ? "bg-destructive/20 text-destructive" :
            "bg-muted text-muted-foreground"
          }`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} stable
          </div>
        )}
      </div>
      <div className="text-3xl font-bold font-mono">
        {value}<span className="text-lg text-muted-foreground">{unit}</span>
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </motion.div>
  );

  return (
    <section className="py-24 px-6">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card mb-4">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-muted-foreground">Module 5</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Real-Time Dashboard</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Live metrics streaming via WebSocket. This is how production 
            monitoring dashboards display system health in real-time.
          </p>
        </motion.div>

        {/* Live indicator */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
            <span className="text-sm font-mono text-muted-foreground">
              LIVE — Updates every second
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Zap}
            label="Requests per Second"
            value={liveStats.requestsPerSec}
            unit="/s"
            color="bg-primary/20 text-primary"
            trend="stable"
          />
          <StatCard
            icon={Clock}
            label="Average Latency"
            value={liveStats.avgLatency}
            unit="ms"
            color="bg-success/20 text-success"
            trend="stable"
          />
          <StatCard
            icon={Gauge}
            label="Cache Hit Rate"
            value={liveStats.cacheHitRate}
            unit="%"
            color="bg-secondary/20 text-secondary"
            trend="up"
          />
          <StatCard
            icon={Activity}
            label="Error Rate"
            value={liveStats.errorRate}
            unit="%"
            color="bg-warning/20 text-warning"
            trend="stable"
          />
        </div>

        {/* Charts grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Requests chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 rounded-xl"
          >
            <h3 className="text-lg font-semibold mb-4">Request Throughput</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="requestGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tickFormatter={() => ""} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                  <YAxis stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${Math.round(value)} req/s`, 'Requests']}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="hsl(var(--primary))"
                    fill="url(#requestGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Latency chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 rounded-xl"
          >
            <h3 className="text-lg font-semibold mb-4">Response Latency</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tickFormatter={() => ""} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                  <YAxis stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${Math.round(value)}ms`, 'Latency']}
                  />
                  <Area
                    type="monotone"
                    dataKey="latency"
                    stroke="hsl(var(--success))"
                    fill="url(#latencyGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Cache hit rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 rounded-xl"
          >
            <h3 className="text-lg font-semibold mb-4">Cache Hit Rate</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <XAxis dataKey="time" tickFormatter={() => ""} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${Math.round(value)}%`, 'Cache Hit Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="cacheHit"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Error rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 rounded-xl"
          >
            <h3 className="text-lg font-semibold mb-4">Error Rate</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tickFormatter={() => ""} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                  <YAxis domain={[0, 5]} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Error Rate']}
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stroke="hsl(var(--destructive))"
                    fill="url(#errorGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MetricsDashboard;
