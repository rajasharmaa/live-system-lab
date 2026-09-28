import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cloud, Zap, Clock, Play, Snowflake, Flame, ArrowRight, Activity, RefreshCw, AlertTriangle, CheckCircle, Server } from "lucide-react";

interface FunctionInstance {
  id: string;
  name: string;
  state: "cold" | "warming" | "hot" | "executing" | "scaling-down" | "terminated";
  lastInvoked: number | null;
  execTime: number;
  coldStartMs: number;
  memory: number;
  invocations: number;
}

interface EventTrigger {
  id: string;
  name: string;
  type: "http" | "schedule" | "queue" | "storage" | "stream";
  icon: string;
  targetFn: string;
}

interface InvocationLog {
  id: string;
  fnName: string;
  trigger: string;
  coldStart: boolean;
  duration: number;
  status: "success" | "error" | "timeout";
  timestamp: number;
}

const ServerlessDemo = () => {
  const [functions, setFunctions] = useState<FunctionInstance[]>([
    { id: "fn1", name: "processOrder", state: "cold", lastInvoked: null, execTime: 120, coldStartMs: 850, memory: 256, invocations: 0 },
    { id: "fn2", name: "sendEmail", state: "cold", lastInvoked: null, execTime: 45, coldStartMs: 320, memory: 128, invocations: 0 },
    { id: "fn3", name: "resizeImage", state: "cold", lastInvoked: null, execTime: 340, coldStartMs: 1200, memory: 512, invocations: 0 },
    { id: "fn4", name: "authHandler", state: "cold", lastInvoked: null, execTime: 28, coldStartMs: 450, memory: 128, invocations: 0 },
  ]);
  const [triggers] = useState<EventTrigger[]>([
    { id: "t1", name: "HTTP Request", type: "http", icon: "🌐", targetFn: "fn1" },
    { id: "t2", name: "Queue Message", type: "queue", icon: "📨", targetFn: "fn2" },
    { id: "t3", name: "File Upload", type: "storage", icon: "📁", targetFn: "fn3" },
    { id: "t4", name: "Cron (5 min)", type: "schedule", icon: "⏰", targetFn: "fn4" },
    { id: "t5", name: "Event Stream", type: "stream", icon: "📡", targetFn: "fn1" },
  ]);
  const [logs, setLogs] = useState<InvocationLog[]>([]);
  const [mode, setMode] = useState<"functions" | "triggers" | "scaling">("functions");
  const [autoScaleDemo, setAutoScaleDemo] = useState(false);
  const [scaleInstances, setScaleInstances] = useState(0);
  const [scalingDown, setScalingDown] = useState(false);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => timerRef.current.forEach(t => clearTimeout(t));
  }, []);

  // Auto scale-to-zero timer
  useEffect(() => {
    if (!autoScaleDemo) return;
    setScaleInstances(0);
    setScalingDown(false);
    let count = 0;
    const ramp = setInterval(() => {
      count++;
      setScaleInstances(Math.min(count, 8));
      if (count >= 8) {
        clearInterval(ramp);
        const t = setTimeout(() => {
          setScalingDown(true);
          let down = 8;
          const scaleDown = setInterval(() => {
            down--;
            setScaleInstances(Math.max(down, 0));
            if (down <= 0) {
              clearInterval(scaleDown);
              setAutoScaleDemo(false);
              setScalingDown(false);
            }
          }, 400);
          timerRef.current.push(scaleDown as unknown as NodeJS.Timeout);
        }, 2000);
        timerRef.current.push(t);
      }
    }, 300);
    timerRef.current.push(ramp as unknown as NodeJS.Timeout);
    return () => clearInterval(ramp);
  }, [autoScaleDemo]);

  const invokeFn = useCallback((fnId: string, triggerName: string = "manual") => {
    const fn = functions.find(f => f.id === fnId);
    if (!fn) return;

    const isCold = fn.state === "cold" || fn.state === "terminated";
    const totalTime = isCold ? fn.coldStartMs + fn.execTime : fn.execTime;

    // Warming phase
    setFunctions(prev => prev.map(f =>
      f.id === fnId ? { ...f, state: isCold ? "warming" : "executing" } : f
    ));

    const t1 = setTimeout(() => {
      setFunctions(prev => prev.map(f =>
        f.id === fnId ? { ...f, state: "executing" } : f
      ));
    }, isCold ? fn.coldStartMs : 0);
    timerRef.current.push(t1);

    // Execution complete
    const t2 = setTimeout(() => {
      setFunctions(prev => prev.map(f =>
        f.id === fnId ? {
          ...f,
          state: "hot",
          lastInvoked: Date.now(),
          invocations: f.invocations + 1,
        } : f
      ));
      const log: InvocationLog = {
        id: `log-${Date.now()}-${fnId}`,
        fnName: fn.name,
        trigger: triggerName,
        coldStart: isCold,
        duration: totalTime,
        status: Math.random() > 0.9 ? "error" : "success",
        timestamp: Date.now(),
      };
      setLogs(prev => [log, ...prev].slice(0, 20));
    }, totalTime);
    timerRef.current.push(t2);

    // Scale to zero after idle
    const t3 = setTimeout(() => {
      setFunctions(prev => prev.map(f =>
        f.id === fnId && f.state === "hot" ? { ...f, state: "scaling-down" } : f
      ));
      const t4 = setTimeout(() => {
        setFunctions(prev => prev.map(f =>
          f.id === fnId && f.state === "scaling-down" ? { ...f, state: "cold" } : f
        ));
      }, 1000);
      timerRef.current.push(t4);
    }, totalTime + 5000);
    timerRef.current.push(t3);
  }, [functions]);

  const stateColor = (s: string) => {
    switch (s) {
      case "cold": case "terminated": return "text-blue-400";
      case "warming": return "text-yellow-400";
      case "hot": return "text-green-400";
      case "executing": return "text-primary";
      case "scaling-down": return "text-orange-400";
      default: return "text-muted-foreground";
    }
  };

  const stateBg = (s: string) => {
    switch (s) {
      case "cold": case "terminated": return "border-blue-500/30 bg-blue-500/5";
      case "warming": return "border-yellow-500/40 bg-yellow-500/10";
      case "hot": return "border-green-500/40 bg-green-500/10";
      case "executing": return "border-primary/40 bg-primary/10 ring-2 ring-primary/30";
      case "scaling-down": return "border-orange-500/30 bg-orange-500/5";
      default: return "border-border/30 bg-muted/5";
    }
  };

  const stateIcon = (s: string) => {
    switch (s) {
      case "cold": case "terminated": return <Snowflake className="w-4 h-4 text-blue-400" />;
      case "warming": return <Flame className="w-4 h-4 text-yellow-400 animate-pulse" />;
      case "hot": return <Flame className="w-4 h-4 text-green-400" />;
      case "executing": return <Zap className="w-4 h-4 text-primary animate-pulse" />;
      case "scaling-down": return <Clock className="w-4 h-4 text-orange-400" />;
      default: return <Cloud className="w-4 h-4" />;
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border/30">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold font-mono text-foreground mb-2 flex items-center gap-3">
            <Cloud className="w-8 h-8 text-primary" />
            Serverless Architecture
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Functions-as-a-Service with cold start dynamics, event-driven triggers, and automatic scale-to-zero behavior.
          </p>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-8">
            {(["functions", "triggers", "scaling"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {m === "functions" ? "⚡ Functions" : m === "triggers" ? "🎯 Event Triggers" : "📈 Auto Scaling"}
              </button>
            ))}
          </div>

          {/* Functions View */}
          {mode === "functions" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {functions.map(fn => (
                  <motion.div
                    key={fn.id}
                    className={`p-5 rounded-xl border transition-all ${stateBg(fn.state)}`}
                    layout
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {stateIcon(fn.state)}
                        <span className="font-mono text-sm font-semibold text-foreground">{fn.name}()</span>
                      </div>
                      <button
                        onClick={() => invokeFn(fn.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary font-mono text-xs hover:bg-primary/30 transition-all"
                      >
                        <Play className="w-3 h-3" /> Invoke
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground">State</span>
                        <div className={`mt-0.5 ${stateColor(fn.state)}`}>{fn.state}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cold Start</span>
                        <div className="mt-0.5 text-foreground">{fn.coldStartMs}ms</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Memory</span>
                        <div className="mt-0.5 text-foreground">{fn.memory}MB</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs font-mono text-muted-foreground">
                      {fn.invocations} invocations • exec: {fn.execTime}ms
                    </div>

                    {/* Cold start visualization */}
                    {(fn.state === "warming" || fn.state === "executing") && (
                      <div className="mt-3">
                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${fn.state === "warming" ? "bg-yellow-500" : "bg-primary"}`}
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{
                              duration: fn.state === "warming" ? fn.coldStartMs / 1000 : fn.execTime / 1000,
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground mt-1">
                          {fn.state === "warming" ? `Cold starting... (${fn.coldStartMs}ms)` : `Executing... (${fn.execTime}ms)`}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Invocation Logs */}
              {logs.length > 0 && (
                <div className="p-4 rounded-xl border border-border/30 bg-muted/5">
                  <h4 className="font-mono text-sm text-foreground mb-3">Invocation Logs</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-center gap-2 text-xs font-mono">
                        {log.status === "success" ? (
                          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                        )}
                        <span className="text-foreground">{log.fnName}</span>
                        <span className="text-muted-foreground">via {log.trigger}</span>
                        <span className={log.coldStart ? "text-yellow-400" : "text-green-400"}>
                          {log.coldStart ? "🥶 cold" : "🔥 warm"}
                        </span>
                        <span className="text-muted-foreground">{log.duration}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Event Triggers */}
          {mode === "triggers" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-mono mb-4">
                Functions are invoked by events — no server management required:
              </p>
              {triggers.map(trigger => {
                const targetFn = functions.find(f => f.id === trigger.targetFn);
                return (
                  <motion.div
                    key={trigger.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-muted/5 hover:border-primary/30 transition-all"
                    whileHover={{ x: 4 }}
                  >
                    <span className="text-2xl">{trigger.icon}</span>
                    <div className="flex-1">
                      <span className="font-mono text-sm text-foreground">{trigger.name}</span>
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted/30 text-muted-foreground">{trigger.type}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-mono text-sm text-foreground">{targetFn?.name}()</span>
                    </div>
                    <button
                      onClick={() => invokeFn(trigger.targetFn, trigger.name)}
                      className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary font-mono text-xs hover:bg-primary/30 transition-all"
                    >
                      Fire
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Auto Scaling */}
          {mode === "scaling" && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setAutoScaleDemo(true)}
                  disabled={autoScaleDemo}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm hover:bg-primary/80 disabled:opacity-50 transition-all"
                >
                  {autoScaleDemo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  Simulate Traffic Burst
                </button>
                <span className="text-sm font-mono text-muted-foreground">
                  Watch functions scale up and back to zero
                </span>
              </div>

              {/* Scale visualization */}
              <div className="p-6 rounded-xl border border-border/30 bg-muted/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-mono text-sm text-foreground">Function Instances</h4>
                  <span className={`font-mono text-sm font-bold ${
                    scalingDown ? "text-orange-400" : scaleInstances > 0 ? "text-green-400" : "text-blue-400"
                  }`}>
                    {scaleInstances} active
                  </span>
                </div>

                <div className="flex items-end gap-2 h-32">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-t-lg relative"
                      animate={{
                        height: i < scaleInstances ? "100%" : "8px",
                        backgroundColor: i < scaleInstances
                          ? scalingDown ? "rgba(251, 146, 60, 0.6)" : "rgba(34, 197, 94, 0.6)"
                          : "rgba(100, 100, 100, 0.2)",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {i < scaleInstances && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Server className="w-4 h-4 text-white/70" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-between mt-2 text-xs font-mono text-muted-foreground">
                  <span>0 instances (idle)</span>
                  <span>8 instances (max burst)</span>
                </div>
              </div>

              {/* Scale-to-Zero explanation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { phase: "Scale Up", desc: "Traffic arrives → new instances spawn in ~300ms", icon: "📈", color: "text-green-400" },
                  { phase: "Execute", desc: "Concurrent requests processed in parallel", icon: "⚡", color: "text-primary" },
                  { phase: "Scale to Zero", desc: "No traffic → instances terminate, cost = $0", icon: "📉", color: "text-blue-400" },
                ].map(p => (
                  <div key={p.phase} className="p-4 rounded-xl border border-border/30 bg-muted/5 text-center">
                    <span className="text-2xl">{p.icon}</span>
                    <div className={`font-mono text-sm font-bold mt-2 ${p.color}`}>{p.phase}</div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default ServerlessDemo;
