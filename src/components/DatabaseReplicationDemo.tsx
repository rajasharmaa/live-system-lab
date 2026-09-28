import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, ArrowRight, ArrowDown, Zap, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Activity } from "lucide-react";

interface ReplicaNode {
  id: string;
  role: "master" | "slave";
  status: "healthy" | "failed" | "syncing" | "promoting";
  data: Record<string, string>;
  lag: number;
}

interface WriteLog {
  id: number;
  operation: string;
  timestamp: number;
  replicated: string[];
  mode: "sync" | "async";
}

const DatabaseReplicationDemo = () => {
  const [mode, setMode] = useState<"sync" | "async">("async");
  const [nodes, setNodes] = useState<ReplicaNode[]>([
    { id: "master", role: "master", status: "healthy", data: { user_1: "Alice", user_2: "Bob" }, lag: 0 },
    { id: "slave-1", role: "slave", status: "healthy", data: { user_1: "Alice", user_2: "Bob" }, lag: 0 },
    { id: "slave-2", role: "slave", status: "healthy", data: { user_1: "Alice", user_2: "Bob" }, lag: 0 },
  ]);
  const [writeLogs, setWriteLogs] = useState<WriteLog[]>([]);
  const [replicating, setReplicating] = useState<string | null>(null);
  const [writeCounter, setWriteCounter] = useState(3);
  const [failoverInProgress, setFailoverInProgress] = useState(false);

  const writeToMaster = useCallback(() => {
    const key = `user_${writeCounter}`;
    const names = ["Charlie", "Diana", "Eve", "Frank", "Grace", "Hank"];
    const value = names[writeCounter % names.length];

    setNodes(prev => prev.map(n =>
      n.role === "master" && n.status === "healthy"
        ? { ...n, data: { ...n.data, [key]: value } }
        : n
    ));

    const logEntry: WriteLog = {
      id: Date.now(),
      operation: `INSERT ${key} = "${value}"`,
      timestamp: Date.now(),
      replicated: [],
      mode,
    };
    setWriteLogs(prev => [logEntry, ...prev].slice(0, 8));
    setWriteCounter(prev => prev + 1);

    if (mode === "sync") {
      setReplicating("all");
      setTimeout(() => {
        setNodes(prev => prev.map(n =>
          n.role === "slave" && n.status === "healthy"
            ? { ...n, data: { ...n.data, [key]: value }, lag: 0 }
            : n
        ));
        setWriteLogs(prev => prev.map((l, i) =>
          i === 0 ? { ...l, replicated: ["slave-1", "slave-2"] } : l
        ));
        setReplicating(null);
      }, 800);
    } else {
      const slaves = nodes.filter(n => n.role === "slave" && n.status === "healthy");
      slaves.forEach((slave, idx) => {
        const delay = 300 + idx * 500 + Math.random() * 400;
        setTimeout(() => {
          setReplicating(slave.id);
          setTimeout(() => {
            setNodes(prev => prev.map(n =>
              n.id === slave.id
                ? { ...n, data: { ...n.data, [key]: value }, lag: Math.round(delay) }
                : n
            ));
            setWriteLogs(prev => prev.map((l, i) =>
              i === 0 ? { ...l, replicated: [...l.replicated, slave.id] } : l
            ));
            setReplicating(null);
          }, 300);
        }, delay);
      });
    }
  }, [mode, nodes, writeCounter]);

  const triggerFailover = useCallback(() => {
    if (failoverInProgress) return;
    setFailoverInProgress(true);

    setNodes(prev => prev.map(n =>
      n.role === "master" ? { ...n, status: "failed" } : n
    ));

    setTimeout(() => {
      setNodes(prev => {
        const healthySlaves = prev.filter(n => n.role === "slave" && n.status === "healthy");
        if (healthySlaves.length === 0) return prev;
        const promoted = healthySlaves.reduce((a, b) => a.lag <= b.lag ? a : b);
        return prev.map(n => {
          if (n.id === promoted.id) return { ...n, role: "master" as const, status: "promoting" as const };
          return n;
        });
      });
    }, 1500);

    setTimeout(() => {
      setNodes(prev => prev.map(n =>
        n.status === "promoting" ? { ...n, status: "healthy" } : n
      ));
      setFailoverInProgress(false);
    }, 3000);
  }, [failoverInProgress]);

  const resetDemo = () => {
    setNodes([
      { id: "master", role: "master", status: "healthy", data: { user_1: "Alice", user_2: "Bob" }, lag: 0 },
      { id: "slave-1", role: "slave", status: "healthy", data: { user_1: "Alice", user_2: "Bob" }, lag: 0 },
      { id: "slave-2", role: "slave", status: "healthy", data: { user_1: "Alice", user_2: "Bob" }, lag: 0 },
    ]);
    setWriteLogs([]);
    setWriteCounter(3);
    setFailoverInProgress(false);
    setReplicating(null);
  };

  const master = nodes.find(n => n.role === "master");
  const slaves = nodes.filter(n => n.role === "slave");

  return (
    <section className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Database Replication</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Master-slave replication with sync/async modes and automatic failover
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <div className="glass-card p-1 flex gap-1">
            <button
              onClick={() => setMode("sync")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "sync" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Synchronous
            </button>
            <button
              onClick={() => setMode("async")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "async" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Asynchronous
            </button>
          </div>
          <button
            onClick={writeToMaster}
            disabled={!master || master.status !== "healthy"}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-success/20 text-success hover:bg-success/30 transition-all disabled:opacity-50"
          >
            <Zap className="w-4 h-4 inline mr-1" /> Write to Master
          </button>
          <button
            onClick={triggerFailover}
            disabled={failoverInProgress || !master || master.status !== "healthy"}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 transition-all disabled:opacity-50"
          >
            <AlertTriangle className="w-4 h-4 inline mr-1" /> Simulate Failure
          </button>
          <button
            onClick={resetDemo}
            className="px-4 py-2 rounded-lg text-sm font-medium glass-card hover:bg-muted/50 transition-all"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" /> Reset
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Master Node */}
          <div className="lg:col-span-1">
            {master && (
              <motion.div
                className={`glass-card p-6 border-2 transition-all ${
                  master.status === "healthy" ? "border-success/50" :
                  master.status === "failed" ? "border-destructive/50" :
                  "border-warning/50"
                }`}
                animate={master.status === "failed" ? { x: [0, -5, 5, -5, 0] } : {}}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Database className={`w-8 h-8 ${
                    master.status === "healthy" ? "text-success" :
                    master.status === "failed" ? "text-destructive" : "text-warning"
                  }`} />
                  <div>
                    <h3 className="font-bold text-lg">Master</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      master.status === "healthy" ? "bg-success/20 text-success" :
                      master.status === "failed" ? "bg-destructive/20 text-destructive" :
                      "bg-warning/20 text-warning"
                    }`}>
                      {master.status === "failed" ? "FAILED" : master.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  {Object.entries(master.data).slice(-5).map(([k, v]) => (
                    <div key={k} className="flex justify-between p-1.5 bg-muted/30 rounded">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Read + Write
                </div>
              </motion.div>
            )}

            {/* Replication Arrow */}
            <div className="flex justify-center my-4">
              <motion.div
                animate={replicating ? { scale: [1, 1.3, 1] } : {}}
                transition={{ repeat: replicating ? Infinity : 0, duration: 0.5 }}
              >
                <ArrowDown className={`w-6 h-6 ${replicating ? "text-primary" : "text-muted-foreground"}`} />
              </motion.div>
            </div>

            <div className="text-center text-xs font-mono text-muted-foreground glass-card p-2">
              {mode === "sync" ? "⏳ Sync: waits for ALL replicas" : "⚡ Async: returns immediately"}
            </div>
          </div>

          {/* Slave Nodes */}
          <div className="lg:col-span-1 space-y-4">
            {nodes.map(node => {
              if (node.role !== "slave" && node.status !== "promoting") return null;
              const isReplicating = replicating === node.id || replicating === "all";
              return (
                <motion.div
                  key={node.id}
                  className={`glass-card p-5 border-2 transition-all ${
                    node.status === "promoting" ? "border-warning/50" :
                    isReplicating ? "border-primary/50" : "border-muted/30"
                  }`}
                  animate={isReplicating ? { boxShadow: ["0 0 0 0 hsl(var(--primary) / 0)", "0 0 20px 5px hsl(var(--primary) / 0.2)", "0 0 0 0 hsl(var(--primary) / 0)"] } : {}}
                  transition={{ duration: 1 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Database className={`w-6 h-6 ${
                      node.status === "promoting" ? "text-warning" :
                      isReplicating ? "text-primary" : "text-muted-foreground"
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{node.id}</h4>
                      <div className="flex items-center gap-2">
                        {node.status === "promoting" ? (
                          <span className="text-xs text-warning animate-pulse">⬆ PROMOTING TO MASTER</span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Lag: {node.lag}ms
                          </span>
                        )}
                      </div>
                    </div>
                    {isReplicating && (
                      <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    )}
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    {Object.entries(node.data).slice(-4).map(([k, v]) => (
                      <div key={k} className="flex justify-between p-1 bg-muted/20 rounded">
                        <span className="text-muted-foreground">{k}</span>
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">📖 Read Only</div>
                </motion.div>
              );
            })}
          </div>

          {/* Write Log */}
          <div className="lg:col-span-1">
            <div className="glass-card p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Write-Ahead Log
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {writeLogs.map(log => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-muted/20 rounded-lg text-xs"
                    >
                      <div className="font-mono text-foreground mb-1">{log.operation}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          log.mode === "sync" ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"
                        }`}>
                          {log.mode}
                        </span>
                        {["slave-1", "slave-2"].map(s => (
                          <span key={s} className="flex items-center gap-1">
                            {log.replicated.includes(s) ? (
                              <CheckCircle className="w-3 h-3 text-success" />
                            ) : (
                              <Clock className="w-3 h-3 text-muted-foreground" />
                            )}
                            <span className="text-muted-foreground">{s}</span>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {writeLogs.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Click "Write to Master" to start</p>
                )}
              </div>
            </div>

            {/* Mode explanation */}
            <div className="glass-card p-4 mt-4 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Sync:</strong> Strong consistency, higher latency. Write confirms after all replicas ack.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Async:</strong> Low latency, eventual consistency. Replicas may lag behind master.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DatabaseReplicationDemo;
