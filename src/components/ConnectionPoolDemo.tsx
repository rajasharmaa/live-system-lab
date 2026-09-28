import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Link, Unlink, Timer, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Connection {
  id: number;
  status: "idle" | "active" | "creating";
  startTime?: number;
  queryType?: string;
}

interface LatencyData {
  time: number;
  pooled: number;
  noPool: number;
}

const ConnectionPoolDemo = () => {
  const [poolEnabled, setPoolEnabled] = useState(true);
  const [poolSize, setPoolSize] = useState(5);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [waitQueue, setWaitQueue] = useState<number[]>([]);
  const [latencyData, setLatencyData] = useState<LatencyData[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    avgLatencyPooled: 0,
    avgLatencyNoPool: 0,
    connectionsCreated: 0,
    connectionsReused: 0,
  });

  // Initialize pool
  useEffect(() => {
    if (poolEnabled) {
      const initialConnections: Connection[] = Array.from({ length: poolSize }, (_, i) => ({
        id: i + 1,
        status: "idle" as const,
      }));
      setConnections(initialConnections);
    } else {
      setConnections([]);
    }
    setWaitQueue([]);
  }, [poolEnabled, poolSize]);

  const simulateQuery = () => {
    const queryTime = 50 + Math.random() * 100; // 50-150ms query time
    const connectionTime = 100 + Math.random() * 150; // 100-250ms connection overhead

    if (poolEnabled) {
      // Find idle connection
      const idleIndex = connections.findIndex(c => c.status === "idle");
      
      if (idleIndex !== -1) {
        // Reuse existing connection
        setConnections(prev => prev.map((c, i) => 
          i === idleIndex 
            ? { ...c, status: "active" as const, startTime: Date.now(), queryType: "SELECT" }
            : c
        ));

        setStats(prev => ({
          ...prev,
          totalRequests: prev.totalRequests + 1,
          connectionsReused: prev.connectionsReused + 1,
        }));

        // Simulate query completion
        setTimeout(() => {
          setConnections(prev => prev.map((c, i) => 
            i === idleIndex ? { ...c, status: "idle" as const, startTime: undefined } : c
          ));

          // Update latency data
          const pooledLatency = queryTime;
          const noPoolLatency = connectionTime + queryTime;
          
          setLatencyData(prev => [...prev, {
            time: Date.now(),
            pooled: Math.round(pooledLatency),
            noPool: Math.round(noPoolLatency),
          }].slice(-20));

          setStats(prev => ({
            ...prev,
            avgLatencyPooled: Math.round((prev.avgLatencyPooled * (prev.totalRequests - 1) + pooledLatency) / prev.totalRequests),
            avgLatencyNoPool: Math.round((prev.avgLatencyNoPool * (prev.totalRequests - 1) + noPoolLatency) / prev.totalRequests),
          }));
        }, queryTime);
      } else {
        // Add to wait queue
        setWaitQueue(prev => [...prev, Date.now()]);
        
        // Wait and retry
        setTimeout(() => {
          setWaitQueue(prev => prev.slice(1));
          simulateQuery();
        }, 200);
      }
    } else {
      // No pool - create new connection each time
      const newConn: Connection = {
        id: Date.now(),
        status: "creating",
      };
      setConnections(prev => [...prev, newConn]);

      setStats(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + 1,
        connectionsCreated: prev.connectionsCreated + 1,
      }));

      // Simulate connection creation
      setTimeout(() => {
        setConnections(prev => prev.map(c => 
          c.id === newConn.id ? { ...c, status: "active" as const } : c
        ));

        // Simulate query
        setTimeout(() => {
          setConnections(prev => prev.filter(c => c.id !== newConn.id));

          const noPoolLatency = connectionTime + queryTime;
          
          setLatencyData(prev => [...prev, {
            time: Date.now(),
            pooled: Math.round(queryTime),
            noPool: Math.round(noPoolLatency),
          }].slice(-20));

          setStats(prev => ({
            ...prev,
            avgLatencyNoPool: Math.round((prev.avgLatencyNoPool * (prev.totalRequests - 1) + noPoolLatency) / prev.totalRequests),
          }));
        }, queryTime);
      }, connectionTime);
    }
  };

  const burstQueries = () => {
    for (let i = 0; i < 10; i++) {
      setTimeout(() => simulateQuery(), i * 100);
    }
  };

  const resetStats = () => {
    setStats({
      totalRequests: 0,
      avgLatencyPooled: 0,
      avgLatencyNoPool: 0,
      connectionsCreated: 0,
      connectionsReused: 0,
    });
    setLatencyData([]);
    setWaitQueue([]);
  };

  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-background to-card/20">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Database className="w-3 h-3 mr-1" />
            RESOURCE OPTIMIZATION
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Connection Pooling
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Reuse database connections instead of creating new ones for each request.
            See the dramatic latency improvement with pooling enabled.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Pool Visualization */}
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Connection Pool
              </h3>
              <Button
                variant={poolEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setPoolEnabled(!poolEnabled)}
              >
                {poolEnabled ? <Link className="w-4 h-4 mr-2" /> : <Unlink className="w-4 h-4 mr-2" />}
                Pool {poolEnabled ? "ON" : "OFF"}
              </Button>
            </div>

            {poolEnabled && (
              <div className="mb-6">
                <label className="text-sm text-muted-foreground mb-2 block">
                  Pool Size: {poolSize}
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={poolSize}
                  onChange={(e) => setPoolSize(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}

            {/* Connection Grid */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              <AnimatePresence mode="popLayout">
                {connections.map((conn) => (
                  <motion.div
                    key={conn.id}
                    layout
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-colors ${
                      conn.status === "idle" 
                        ? "border-success/50 bg-success/10"
                        : conn.status === "active"
                        ? "border-primary bg-primary/20"
                        : "border-warning bg-warning/10"
                    }`}
                  >
                    {conn.status === "idle" && <CheckCircle2 className="w-5 h-5 text-success" />}
                    {conn.status === "active" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                    {conn.status === "creating" && <Timer className="w-5 h-5 text-warning animate-pulse" />}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Wait Queue */}
            {waitQueue.length > 0 && (
              <div className="mb-6 p-3 rounded-lg bg-warning/10 border border-warning/30">
                <div className="flex items-center gap-2 text-warning text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {waitQueue.length} requests waiting for connection
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={simulateQuery} className="flex-1">
                Send Query
              </Button>
              <Button onClick={burstQueries} variant="secondary" className="flex-1">
                Burst (10x)
              </Button>
              <Button onClick={resetStats} variant="outline">
                Reset
              </Button>
            </div>

            {/* Legend */}
            <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-success/50" />
                Idle
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/50" />
                Active
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-warning/50" />
                Creating
              </div>
            </div>
          </Card>

          {/* Stats & Chart */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance Comparison
            </h3>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-card p-4 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Avg Latency (Pooled)</div>
                <div className="text-2xl font-mono font-bold text-success">{stats.avgLatencyPooled}ms</div>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Avg Latency (No Pool)</div>
                <div className="text-2xl font-mono font-bold text-destructive">{stats.avgLatencyNoPool}ms</div>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Connections Reused</div>
                <div className="text-2xl font-mono font-bold text-primary">{stats.connectionsReused}</div>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Connections Created</div>
                <div className="text-2xl font-mono font-bold text-warning">{stats.connectionsCreated}</div>
              </div>
            </div>

            {/* Latency Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyData}>
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    tickFormatter={(v) => `${v}ms`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}ms`,
                      name === "pooled" ? "With Pool" : "Without Pool"
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pooled" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="noPool" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-4 justify-center text-xs mt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-success" />
                With Pool
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-destructive border-dashed" style={{ borderTop: "2px dashed" }} />
                Without Pool
              </div>
            </div>

            <div className="mt-6 p-4 glass-card rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-2">💡 Why Connection Pooling?</h4>
              <p className="text-xs text-muted-foreground">
                Creating database connections is expensive (~100-300ms). Pooling maintains 
                pre-established connections that can be reused, reducing latency by 50-70%.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ConnectionPoolDemo;
