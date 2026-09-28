import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Activity, AlertTriangle, TrendingUp, Zap, Server, Users } from "lucide-react";

interface MetricPoint {
  rps: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  throughput: number;
}

const calculateMetrics = (rps: number, maxRps: number): MetricPoint => {
  const load = rps / maxRps;
  const saturationPoint = 0.7;
  const isSaturated = load > saturationPoint;
  const overload = Math.max(0, load - saturationPoint) / (1 - saturationPoint);

  return {
    rps,
    latencyP50: isSaturated ? 50 + 450 * Math.pow(overload, 2) : 20 + 30 * load,
    latencyP95: isSaturated ? 200 + 2800 * Math.pow(overload, 2.5) : 50 + 150 * load,
    latencyP99: isSaturated ? 500 + 9500 * Math.pow(overload, 3) : 100 + 400 * load,
    errorRate: isSaturated ? Math.min(95, 2 + 93 * Math.pow(overload, 2)) : Math.random() * 0.5,
    cpuUsage: Math.min(100, 10 + 90 * Math.pow(load, 1.5)),
    memoryUsage: Math.min(98, 20 + 78 * Math.pow(load, 1.2)),
    throughput: isSaturated ? maxRps * saturationPoint * (1 - overload * 0.6) : rps * (0.95 + Math.random() * 0.05),
  };
};

const LoadTestingDemo = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [targetRps, setTargetRps] = useState(100);
  const [currentRps, setCurrentRps] = useState(0);
  const [maxRps] = useState(1000);
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [rampUp, setRampUp] = useState(true);
  const [phase, setPhase] = useState<"idle" | "ramp-up" | "sustained" | "spike" | "cooldown">("idle");

  const startTest = useCallback(() => {
    setIsRunning(true);
    setCurrentRps(0);
    setHistory([]);
    setPhase("ramp-up");
  }, []);

  const stopTest = useCallback(() => {
    setIsRunning(false);
    setPhase("cooldown");
    setTimeout(() => {
      setCurrentRps(0);
      setPhase("idle");
    }, 1500);
  }, []);

  const triggerSpike = useCallback(() => {
    setPhase("spike");
    setCurrentRps(maxRps * 0.95);
    setTimeout(() => {
      if (isRunning) {
        setPhase("sustained");
        setCurrentRps(targetRps);
      }
    }, 3000);
  }, [isRunning, targetRps, maxRps]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setCurrentRps((prev) => {
        if (phase === "ramp-up") {
          const next = prev + targetRps * 0.1;
          if (next >= targetRps) {
            setPhase("sustained");
            return targetRps;
          }
          return next;
        }
        if (phase === "spike") return prev;
        return targetRps + (Math.random() - 0.5) * targetRps * 0.1;
      });
    }, 200);
    return () => clearInterval(interval);
  }, [isRunning, targetRps, phase]);

  useEffect(() => {
    if (currentRps <= 0) return;
    const metrics = calculateMetrics(currentRps, maxRps);
    setHistory((prev) => [...prev.slice(-29), metrics]);
  }, [currentRps, maxRps]);

  const current = history[history.length - 1];
  const saturationPct = (currentRps / (maxRps * 0.7)) * 100;

  const getHealthStatus = () => {
    if (!current) return { label: "Idle", color: "bg-muted text-muted-foreground" };
    if (current.errorRate > 20) return { label: "Critical", color: "bg-destructive text-destructive-foreground" };
    if (current.errorRate > 5) return { label: "Degraded", color: "bg-warning text-warning-foreground" };
    return { label: "Healthy", color: "bg-accent text-accent-foreground" };
  };

  const health = getHealthStatus();

  const maxBarHeight = 120;

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[var(--gradient-glow)] opacity-30" />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 border-warning/30 text-warning">
            <Activity className="w-3 h-3 mr-1" />
            Performance Testing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 font-mono">
            Load Testing & Stress Analysis
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Observe how systems behave under increasing load — latency curves, error rates, and saturation points
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Test Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Target RPS: <span className="text-primary font-mono">{targetRps}</span>
                </label>
                <Slider
                  value={[targetRps]}
                  onValueChange={(v) => setTargetRps(v[0])}
                  min={50}
                  max={1200}
                  step={50}
                  disabled={isRunning}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>50</span>
                  <span className="text-warning">700 (sat.)</span>
                  <span>1200</span>
                </div>
              </div>

              <div className="flex gap-2">
                {!isRunning ? (
                  <Button onClick={startTest} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80">
                    <Zap className="w-4 h-4 mr-1" /> Start Test
                  </Button>
                ) : (
                  <Button onClick={stopTest} variant="destructive" className="flex-1">
                    Stop
                  </Button>
                )}
                <Button
                  onClick={triggerSpike}
                  disabled={!isRunning}
                  variant="outline"
                  className="border-warning/50 text-warning hover:bg-warning/10"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" /> Spike
                </Button>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phase</span>
                  <Badge variant="outline" className="text-xs capitalize">{phase}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={health.color}>{health.label}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current RPS</span>
                  <span className="font-mono text-foreground">{Math.round(currentRps)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saturation</span>
                  <span className={`font-mono ${saturationPct > 100 ? "text-destructive" : saturationPct > 80 ? "text-warning" : "text-accent"}`}>
                    {Math.min(100, Math.round(saturationPct))}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latency Chart */}
          <Card className="bg-card/80 backdrop-blur border-border/50 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-secondary" />
                Latency Distribution (ms)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-[140px] border-b border-border/30 mb-2">
                {history.map((point, i) => {
                  const maxLatency = 3000;
                  const h50 = Math.min(maxBarHeight, (point.latencyP50 / maxLatency) * maxBarHeight);
                  const h95 = Math.min(maxBarHeight, (point.latencyP95 / maxLatency) * maxBarHeight);
                  const h99 = Math.min(maxBarHeight, (point.latencyP99 / maxLatency) * maxBarHeight);
                  return (
                    <div key={i} className="flex-1 flex items-end gap-px relative group">
                      <div className="flex-1 bg-accent/60 rounded-t-sm transition-all" style={{ height: h50 }} />
                      <div className="flex-1 bg-warning/60 rounded-t-sm transition-all" style={{ height: h95 }} />
                      <div className="flex-1 bg-destructive/60 rounded-t-sm transition-all" style={{ height: h99 }} />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border rounded px-2 py-1 text-xs font-mono opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                        P50: {Math.round(point.latencyP50)}ms
                      </div>
                    </div>
                  );
                })}
                {history.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    Start a test to see latency data
                  </div>
                )}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-accent/60 rounded" /> P50</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-warning/60 rounded" /> P95</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-destructive/60 rounded" /> P99</span>
              </div>
            </CardContent>
          </Card>

          {/* Resource Gauges */}
          <Card className="bg-card/80 backdrop-blur border-border/50 lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                System Resources & Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "CPU Usage", value: current?.cpuUsage ?? 0, unit: "%", warn: 80, crit: 95 },
                  { label: "Memory", value: current?.memoryUsage ?? 0, unit: "%", warn: 75, crit: 90 },
                  { label: "Error Rate", value: current?.errorRate ?? 0, unit: "%", warn: 5, crit: 20 },
                  { label: "Throughput", value: current?.throughput ?? 0, unit: " rps", warn: Infinity, crit: Infinity },
                ].map((metric) => {
                  const color = metric.value >= metric.crit ? "text-destructive" : metric.value >= metric.warn ? "text-warning" : "text-accent";
                  const barColor = metric.value >= metric.crit ? "bg-destructive" : metric.value >= metric.warn ? "bg-warning" : "bg-accent";
                  const pct = metric.label === "Throughput" ? Math.min(100, (metric.value / maxRps) * 100) : Math.min(100, metric.value);
                  return (
                    <div key={metric.label} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{metric.label}</span>
                        <span className={`font-mono font-semibold ${color}`}>
                          {Math.round(metric.value)}{metric.unit}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${barColor}`}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {current && current.errorRate > 20 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">
                    System saturated! Error rate at {Math.round(current.errorRate)}% — latency P99: {Math.round(current.latencyP99)}ms
                  </span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default LoadTestingDemo;
