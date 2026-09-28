import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Server, Database, Users, Layers, Info } from "lucide-react";

const SystemArchitecture = () => {
  const [serviceCount, setServiceCount] = useState(3);
  const [trafficLoad, setTrafficLoad] = useState(50);
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [metrics, setMetrics] = useState({
    dbQueries: 0,
    avgLatency: 0,
    cacheHitRate: 0,
  });

  useEffect(() => {
    // Simulate system behavior based on configuration
    const baseLoad = trafficLoad * 10;
    const cacheReduction = cacheEnabled ? 0.85 : 0;
    const serviceDistribution = serviceCount;

    const dbQueries = Math.round(baseLoad * (1 - cacheReduction) / serviceDistribution);
    const avgLatency = cacheEnabled
      ? Math.round(5 + (trafficLoad / 10) / serviceCount)
      : Math.round(100 + (trafficLoad * 2) / serviceCount);
    const cacheHitRate = cacheEnabled ? Math.min(95, 60 + serviceCount * 5) : 0;

    setMetrics({ dbQueries, avgLatency, cacheHitRate });
  }, [serviceCount, trafficLoad, cacheEnabled]);

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
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-muted-foreground">Module 3</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">System Architecture</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Visualize how scaling services and caching affects system behavior. 
            Watch database load decrease as you add services and enable caching.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 rounded-xl space-y-6"
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              Configuration
            </h3>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-muted-foreground">Service Instances</label>
                <span className="font-mono text-primary">{serviceCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={serviceCount}
                onChange={(e) => setServiceCount(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm text-muted-foreground">Traffic Load</label>
                <span className="font-mono text-primary">{trafficLoad}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={trafficLoad}
                onChange={(e) => setTrafficLoad(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Redis Cache</span>
              <button
                onClick={() => setCacheEnabled(!cacheEnabled)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  cacheEnabled
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {cacheEnabled ? "ON" : "OFF"}
              </button>
            </div>

            {/* Info tooltip */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Horizontal Scaling:</strong>
                  <br />
                  Adding more service instances distributes load, while Redis provides 
                  a shared cache that reduces database queries across all instances.
                </div>
              </div>
            </div>
          </motion.div>

          {/* Architecture Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6 rounded-xl lg:col-span-2"
          >
            <h3 className="text-lg font-semibold mb-6">Live Architecture View</h3>

            <div className="relative">
              {/* Client */}
              <div className="flex justify-center mb-6">
                <div className="glass-card px-6 py-4 rounded-lg flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  <div>
                    <div className="font-semibold">Clients</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {trafficLoad * 100} req/s
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection line */}
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{ scaleY: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-1 h-8 bg-gradient-to-b from-primary to-secondary rounded"
                />
              </div>

              {/* Load Balancer */}
              <div className="flex justify-center mb-6">
                <div className="glass-card px-6 py-4 rounded-lg gradient-border">
                  <div className="font-semibold text-center">Load Balancer</div>
                  <div className="text-xs text-muted-foreground text-center font-mono">
                    Round Robin
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="flex justify-center gap-4 mb-6 flex-wrap">
                {Array.from({ length: serviceCount }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="glass-card px-4 py-3 rounded-lg"
                  >
                    <Server className="w-5 h-5 text-primary mx-auto mb-1" />
                    <div className="text-xs font-mono text-muted-foreground">
                      svc-{i + 1}
                    </div>
                    <div className="text-xs font-mono text-success">
                      {Math.round(100 / serviceCount)}%
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Cache and DB row */}
              <div className="flex justify-center gap-8 items-start">
                {/* Redis */}
                <motion.div
                  animate={{ opacity: cacheEnabled ? 1 : 0.3 }}
                  className={`glass-card px-6 py-4 rounded-lg ${
                    cacheEnabled ? "border border-success/30" : ""
                  }`}
                >
                  <div className="text-2xl text-center mb-1">⚡</div>
                  <div className="font-semibold text-center">Redis</div>
                  <div className="text-xs text-muted-foreground text-center font-mono">
                    {cacheEnabled ? `${metrics.cacheHitRate}% hit` : "disabled"}
                  </div>
                </motion.div>

                {/* Database */}
                <div className="glass-card px-6 py-4 rounded-lg">
                  <Database className={`w-8 h-8 mx-auto mb-1 ${
                    metrics.dbQueries > 300 ? "text-destructive" : 
                    metrics.dbQueries > 100 ? "text-warning" : "text-success"
                  }`} />
                  <div className="font-semibold text-center">PostgreSQL</div>
                  <div className="text-xs text-muted-foreground text-center font-mono">
                    {metrics.dbQueries} queries/s
                  </div>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border/50">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">DB Load</div>
                <div className={`text-2xl font-bold font-mono ${
                  metrics.dbQueries > 300 ? "text-destructive" : 
                  metrics.dbQueries > 100 ? "text-warning" : "text-success"
                }`}>
                  {metrics.dbQueries}
                  <span className="text-sm">/s</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Avg Latency</div>
                <div className={`text-2xl font-bold font-mono ${
                  metrics.avgLatency < 20 ? "text-success" : 
                  metrics.avgLatency < 50 ? "text-warning" : "text-destructive"
                }`}>
                  {metrics.avgLatency}
                  <span className="text-sm">ms</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Cache Hit</div>
                <div className={`text-2xl font-bold font-mono ${
                  metrics.cacheHitRate > 70 ? "text-success" : 
                  metrics.cacheHitRate > 30 ? "text-warning" : "text-muted-foreground"
                }`}>
                  {metrics.cacheHitRate}
                  <span className="text-sm">%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default SystemArchitecture;
