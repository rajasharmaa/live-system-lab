import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, AlertTriangle, Info } from "lucide-react";

const TrafficSimulator = () => {
  const [traffic, setTraffic] = useState(100);
  const [metrics, setMetrics] = useState({
    cpuLoad: 0,
    queueSize: 0,
    errorRate: 0,
    responseTime: 0,
  });
  const [history, setHistory] = useState<Array<{
    time: number;
    cpu: number;
    errors: number;
    latency: number;
  }>>([]);

  useEffect(() => {
    // Simulate system behavior at different traffic levels
    const calculateMetrics = () => {
      const base = traffic / 100;
      
      // CPU increases logarithmically, then spikes at high load
      const cpuLoad = Math.min(100, Math.round(
        traffic < 5000
          ? 20 + (base * 30)
          : traffic < 50000
            ? 50 + ((traffic - 5000) / 45000) * 35
            : 85 + ((traffic - 50000) / 50000) * 15
      ));

      // Queue builds up at high load
      const queueSize = Math.max(0, Math.round(
        traffic > 10000 ? (traffic - 10000) / 100 : 0
      ));

      // Errors start appearing at high load
      const errorRate = Math.min(50, Math.max(0,
        traffic > 30000 ? ((traffic - 30000) / 70000) * 30 : 0
      ));

      // Response time increases with load
      const responseTime = Math.round(
        traffic < 1000
          ? 20 + (traffic / 100)
          : traffic < 10000
            ? 30 + ((traffic - 1000) / 900)
            : traffic < 50000
              ? 40 + ((traffic - 10000) / 400)
              : 140 + ((traffic - 50000) / 500)
      );

      setMetrics({ cpuLoad, queueSize, errorRate, responseTime });

      setHistory(prev => [
        ...prev.slice(-29),
        {
          time: Date.now(),
          cpu: cpuLoad,
          errors: errorRate,
          latency: responseTime,
        }
      ]);
    };

    const interval = setInterval(calculateMetrics, 500);
    calculateMetrics();

    return () => clearInterval(interval);
  }, [traffic]);

  const getStatusColor = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return "text-success";
    if (value < thresholds[1]) return "text-warning";
    return "text-destructive";
  };

  const trafficLabel = 
    traffic < 1000 ? `${traffic}` :
    traffic < 10000 ? `${(traffic / 1000).toFixed(1)}K` :
    `${(traffic / 1000).toFixed(0)}K`;

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-card/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-card mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-muted-foreground">Module 4</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Traffic Load Simulator</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how systems behave under increasing load. Watch CPU spike, 
            queues build up, and errors appear as traffic reaches critical levels.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Traffic Control */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 rounded-xl"
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Simulated Users
            </h3>

            {/* Large traffic display */}
            <div className="text-center mb-8">
              <div className="text-6xl font-bold font-mono gradient-text">
                {trafficLabel}
              </div>
              <div className="text-muted-foreground mt-2">concurrent users</div>
            </div>

            {/* Slider */}
            <div className="mb-8">
              <input
                type="range"
                min="100"
                max="100000"
                step="100"
                value={traffic}
                onChange={(e) => setTraffic(Number(e.target.value))}
                className="w-full h-3 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>100</span>
                <span>1K</span>
                <span>10K</span>
                <span>50K</span>
                <span>100K</span>
              </div>
            </div>

            {/* Traffic zone indicator */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className={`p-3 rounded-lg text-center transition-colors ${
                traffic < 10000 ? "bg-success/20 border border-success/30" : "bg-muted/30"
              }`}>
                <div className="text-xs font-semibold text-success">LOW</div>
                <div className="text-xs text-muted-foreground">&lt;10K</div>
              </div>
              <div className={`p-3 rounded-lg text-center transition-colors ${
                traffic >= 10000 && traffic < 50000 ? "bg-warning/20 border border-warning/30" : "bg-muted/30"
              }`}>
                <div className="text-xs font-semibold text-warning">MEDIUM</div>
                <div className="text-xs text-muted-foreground">10K-50K</div>
              </div>
              <div className={`p-3 rounded-lg text-center transition-colors ${
                traffic >= 50000 ? "bg-destructive/20 border border-destructive/30" : "bg-muted/30"
              }`}>
                <div className="text-xs font-semibold text-destructive">HIGH</div>
                <div className="text-xs text-muted-foreground">&gt;50K</div>
              </div>
            </div>

            {/* Warning message at high load */}
            {traffic >= 50000 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong className="text-destructive">System Under Stress</strong>
                  <p className="text-muted-foreground mt-1">
                    At this load, rate limiting and auto-scaling would kick in 
                    to protect the system from complete failure.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Info tooltip */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50 mt-6">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Real Production Behavior:</strong>
                  <br />
                  Systems degrade gracefully under load. First latency increases, 
                  then queues build up, finally errors appear as capacity is exceeded.
                </div>
              </div>
            </div>
          </motion.div>

          {/* Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-6 rounded-xl">
                <div className="text-sm text-muted-foreground mb-2">CPU Load</div>
                <div className={`text-4xl font-bold font-mono ${getStatusColor(metrics.cpuLoad, [50, 80])}`}>
                  {metrics.cpuLoad}<span className="text-lg">%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full mt-3">
                  <motion.div
                    className={`h-full rounded-full ${
                      metrics.cpuLoad < 50 ? "bg-success" :
                      metrics.cpuLoad < 80 ? "bg-warning" : "bg-destructive"
                    }`}
                    animate={{ width: `${metrics.cpuLoad}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <div className="text-sm text-muted-foreground mb-2">Request Queue</div>
                <div className={`text-4xl font-bold font-mono ${getStatusColor(metrics.queueSize, [100, 500])}`}>
                  {metrics.queueSize}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  pending requests
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <div className="text-sm text-muted-foreground mb-2">Error Rate</div>
                <div className={`text-4xl font-bold font-mono ${getStatusColor(metrics.errorRate, [1, 10])}`}>
                  {metrics.errorRate.toFixed(1)}<span className="text-lg">%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  5xx responses
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl">
                <div className="text-sm text-muted-foreground mb-2">Response Time</div>
                <div className={`text-4xl font-bold font-mono ${getStatusColor(metrics.responseTime, [50, 150])}`}>
                  {metrics.responseTime}<span className="text-lg">ms</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  p99 latency
                </div>
              </div>
            </div>

            {/* Live chart */}
            <div className="glass-card p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">System Health Over Time</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <XAxis dataKey="time" tickFormatter={() => ""} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                    <YAxis stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="cpu" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="CPU %" />
                    <Line type="monotone" dataKey="errors" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Error %" />
                    <Line type="monotone" dataKey="latency" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} name="Latency ms" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TrafficSimulator;
