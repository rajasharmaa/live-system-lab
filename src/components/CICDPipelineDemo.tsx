import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, Play, CheckCircle, XCircle, Clock, RefreshCw, Package, TestTube, Rocket, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";

interface PipelineStage {
  id: string;
  name: string;
  icon: React.ElementType;
  status: "idle" | "running" | "passed" | "failed";
  duration: number;
  details: string[];
}

interface Deployment {
  version: string;
  strategy: "blue-green" | "canary" | "rolling";
  status: "deploying" | "live" | "rolled-back";
  traffic: number;
}

const CICDPipelineDemo = () => {
  const [stages, setStages] = useState<PipelineStage[]>([
    { id: "source", name: "Source", icon: GitBranch, status: "idle", duration: 0, details: ["git push origin main", "Webhook triggered", "Commit: a3f9c2d"] },
    { id: "build", name: "Build", icon: Package, status: "idle", duration: 0, details: ["npm install", "TypeScript compile", "Bundle: 245KB gzip"] },
    { id: "test", name: "Test", icon: TestTube, status: "idle", duration: 0, details: ["Unit: 142 passed", "Integration: 38 passed", "Coverage: 87%"] },
    { id: "deploy", name: "Deploy", icon: Rocket, status: "idle", duration: 0, details: ["Docker build", "Push to registry", "Deploy to cluster"] },
  ]);
  const [running, setRunning] = useState(false);
  const [failAt, setFailAt] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<"blue-green" | "canary" | "rolling">("blue-green");
  const [deployments, setDeployments] = useState<Deployment[]>([
    { version: "v1.2.0", strategy: "blue-green", status: "live", traffic: 100 },
  ]);
  const [canaryPercent, setCanaryPercent] = useState(10);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const runPipeline = useCallback(() => {
    if (running) return;
    setRunning(true);
    timerRef.current = [];
    setStages(prev => prev.map(s => ({ ...s, status: "idle" as const, duration: 0 })));

    let delay = 0;
    const stageDurations = [800, 1500, 2000, 1200];

    stages.forEach((stage, idx) => {
      const t1 = setTimeout(() => {
        setStages(prev => prev.map((s, i) => i === idx ? { ...s, status: "running" } : s));
      }, delay);
      timerRef.current.push(t1);

      delay += stageDurations[idx];

      const t2 = setTimeout(() => {
        const shouldFail = failAt === stage.id;
        setStages(prev => prev.map((s, i) =>
          i === idx
            ? { ...s, status: shouldFail ? "failed" : "passed", duration: stageDurations[idx] }
            : s
        ));
        if (shouldFail) {
          setRunning(false);
        }
        if (idx === stages.length - 1 && !shouldFail) {
          // Deploy
          const newVersion = `v1.${3 + deployments.length}.0`;
          setDeployments(prev => [
            { version: newVersion, strategy, status: "deploying", traffic: strategy === "canary" ? canaryPercent : 0 },
            ...prev.map(d => d.status === "live"
              ? { ...d, traffic: strategy === "canary" ? 100 - canaryPercent : (strategy === "blue-green" ? 100 : d.traffic) }
              : d
            ),
          ]);
          setTimeout(() => {
            setDeployments(prev => prev.map((d, i) =>
              i === 0 ? { ...d, status: "live" as const, traffic: 100 } :
              { ...d, traffic: 0 }
            ));
          }, 2000);
          setRunning(false);
        }
      }, delay);
      timerRef.current.push(t2);
    });
  }, [running, failAt, stages, strategy, deployments.length, canaryPercent]);

  const resetPipeline = () => {
    timerRef.current.forEach(clearTimeout);
    setStages(prev => prev.map(s => ({ ...s, status: "idle" as const, duration: 0 })));
    setRunning(false);
    setDeployments([{ version: "v1.2.0", strategy: "blue-green", status: "live", traffic: 100 }]);
  };

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
            <span className="gradient-text">CI/CD Pipeline</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Build stages, test automation, and deployment strategies
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <button
            onClick={runPipeline}
            disabled={running}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-success/20 text-success hover:bg-success/30 disabled:opacity-50 transition-all"
          >
            <Play className="w-4 h-4 inline mr-1" /> Run Pipeline
          </button>
          <button
            onClick={resetPipeline}
            className="px-5 py-2.5 rounded-lg text-sm font-medium glass-card hover:bg-muted/50 transition-all"
          >
            <RefreshCw className="w-4 h-4 inline mr-1" /> Reset
          </button>
          <div className="glass-card p-1 flex gap-1">
            <button
              onClick={() => setFailAt(null)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${!failAt ? "bg-success/20 text-success" : "text-muted-foreground"}`}
            >
              All Pass
            </button>
            <button
              onClick={() => setFailAt("test")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${failAt === "test" ? "bg-destructive/20 text-destructive" : "text-muted-foreground"}`}
            >
              Fail at Test
            </button>
            <button
              onClick={() => setFailAt("build")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${failAt === "build" ? "bg-destructive/20 text-destructive" : "text-muted-foreground"}`}
            >
              Fail at Build
            </button>
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-4">
            {stages.map((stage, idx) => (
              <div key={stage.id} className="flex items-center gap-2 flex-shrink-0">
                <motion.div
                  className={`glass-card p-5 text-center min-w-[140px] border-2 transition-all ${
                    stage.status === "running" ? "border-primary/50" :
                    stage.status === "passed" ? "border-success/50" :
                    stage.status === "failed" ? "border-destructive/50" :
                    "border-muted/20"
                  }`}
                  animate={stage.status === "running" ? { boxShadow: [
                    "0 0 0 0 hsl(var(--primary) / 0)",
                    "0 0 20px 5px hsl(var(--primary) / 0.15)",
                    "0 0 0 0 hsl(var(--primary) / 0)",
                  ] } : {}}
                  transition={{ duration: 1.5, repeat: stage.status === "running" ? Infinity : 0 }}
                >
                  <div className="mb-2">
                    {stage.status === "running" ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                    ) : stage.status === "passed" ? (
                      <CheckCircle className="w-8 h-8 text-success mx-auto" />
                    ) : stage.status === "failed" ? (
                      <XCircle className="w-8 h-8 text-destructive mx-auto" />
                    ) : (
                      <stage.icon className="w-8 h-8 text-muted-foreground mx-auto" />
                    )}
                  </div>
                  <div className="font-bold text-sm">{stage.name}</div>
                  {stage.duration > 0 && (
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {(stage.duration / 1000).toFixed(1)}s
                    </div>
                  )}
                  {(stage.status === "passed" || stage.status === "failed") && (
                    <div className="mt-2 space-y-0.5">
                      {stage.details.map((d, i) => (
                        <div key={i} className="text-[10px] text-muted-foreground">{d}</div>
                      ))}
                    </div>
                  )}
                </motion.div>
                {idx < stages.length - 1 && (
                  <ArrowRight className={`w-5 h-5 flex-shrink-0 ${
                    stages[idx + 1].status !== "idle" ? "text-primary" : "text-muted-foreground/30"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Deployment Strategies */}
        <div className="max-w-5xl mx-auto">
          <h3 className="font-bold text-lg mb-4 text-center">Deployment Strategy</h3>
          <div className="flex justify-center gap-3 mb-6">
            {([
              { key: "blue-green", label: "Blue-Green", desc: "Instant cutover between environments" },
              { key: "canary", label: "Canary", desc: "Gradual traffic shift to new version" },
              { key: "rolling", label: "Rolling", desc: "Replace instances one at a time" },
            ] as const).map(s => (
              <button
                key={s.key}
                onClick={() => setStrategy(s.key)}
                className={`glass-card p-3 text-left max-w-[180px] transition-all ${
                  strategy === s.key ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="text-sm font-bold">{s.label}</div>
                <div className="text-[11px] text-muted-foreground">{s.desc}</div>
              </button>
            ))}
          </div>

          {/* Deployment Visualization */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strategy Diagram */}
            <div className="glass-card p-6">
              <h4 className="font-bold text-sm mb-4">{strategy === "blue-green" ? "Blue-Green" : strategy === "canary" ? "Canary" : "Rolling"} Deployment</h4>
              {strategy === "blue-green" && (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1 p-3 rounded-lg bg-primary/20 border border-primary/30 text-center">
                      <div className="text-xs font-bold text-primary">Blue (Current)</div>
                      <div className="text-[10px] text-muted-foreground mt-1">v1.2.0 — Serving traffic</div>
                      <div className="mt-2 h-2 bg-primary/50 rounded-full" />
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-success/20 border border-success/30 text-center">
                      <div className="text-xs font-bold text-success">Green (New)</div>
                      <div className="text-[10px] text-muted-foreground mt-1">v1.3.0 — Ready/standby</div>
                      <div className="mt-2 h-2 bg-success/30 rounded-full" />
                    </div>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    Switch load balancer → instant rollback if issues
                  </div>
                </div>
              )}
              {strategy === "canary" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground">Canary %:</span>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      value={canaryPercent}
                      onChange={(e) => setCanaryPercent(Number(e.target.value))}
                      className="flex-1 accent-warning"
                    />
                    <span className="font-mono text-xs w-8">{canaryPercent}%</span>
                  </div>
                  <div className="flex h-6 rounded-full overflow-hidden">
                    <div className="bg-primary/50 flex items-center justify-center text-[10px] font-bold" style={{ width: `${100 - canaryPercent}%` }}>
                      v1.2.0
                    </div>
                    <div className="bg-warning/50 flex items-center justify-center text-[10px] font-bold" style={{ width: `${canaryPercent}%` }}>
                      v1.3.0
                    </div>
                  </div>
                  <div className="text-center text-xs text-muted-foreground">
                    Monitor errors → increase or rollback
                  </div>
                </div>
              )}
              {strategy === "rolling" && (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">Pod {i}</span>
                      <div className={`flex-1 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                        i <= 2 ? "bg-success/30" : "bg-primary/30"
                      }`}>
                        {i <= 2 ? "v1.3.0 ✓" : "v1.2.0 (pending)"}
                      </div>
                    </div>
                  ))}
                  <div className="text-center text-xs text-muted-foreground mt-2">
                    Replace one pod at a time → zero downtime
                  </div>
                </div>
              )}
            </div>

            {/* Deployment History */}
            <div className="glass-card p-6">
              <h4 className="font-bold text-sm mb-4">Deployment History</h4>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {deployments.slice(0, 5).map((dep, idx) => (
                    <motion.div
                      key={`${dep.version}-${idx}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg"
                    >
                      <span className="font-mono text-sm font-bold">{dep.version}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        dep.status === "live" ? "bg-success/20 text-success" :
                        dep.status === "deploying" ? "bg-warning/20 text-warning" :
                        "bg-destructive/20 text-destructive"
                      }`}>
                        {dep.status}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">{dep.strategy}</span>
                      {dep.traffic > 0 && (
                        <span className="font-mono text-xs text-primary">{dep.traffic}%</span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CICDPipelineDemo;
