import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Shield, Activity, Eye, ArrowRight, RefreshCw, Server, Zap, AlertTriangle, CheckCircle } from "lucide-react";

interface Service {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "down";
  requests: number;
  latency: number;
  sidecar: boolean;
}

interface TrafficRule {
  id: string;
  name: string;
  type: "retry" | "timeout" | "circuit-breaker" | "rate-limit";
  enabled: boolean;
  config: string;
}

interface TraceSpan {
  id: string;
  service: string;
  operation: string;
  duration: number;
  status: "ok" | "error";
  timestamp: number;
}

const ServiceMeshDemo = () => {
  const [services, setServices] = useState<Service[]>([
    { id: "api-gw", name: "API Gateway", status: "healthy", requests: 0, latency: 12, sidecar: true },
    { id: "user-svc", name: "User Service", status: "healthy", requests: 0, latency: 24, sidecar: true },
    { id: "order-svc", name: "Order Service", status: "healthy", requests: 0, latency: 45, sidecar: true },
    { id: "payment-svc", name: "Payment Service", status: "healthy", requests: 0, latency: 89, sidecar: true },
    { id: "inventory-svc", name: "Inventory Service", status: "healthy", requests: 0, latency: 32, sidecar: true },
    { id: "notification-svc", name: "Notification Service", status: "healthy", requests: 0, latency: 18, sidecar: true },
  ]);
  const [trafficRules, setTrafficRules] = useState<TrafficRule[]>([
    { id: "r1", name: "Retry Policy", type: "retry", enabled: true, config: "3 retries, exponential backoff" },
    { id: "r2", name: "Timeout", type: "timeout", enabled: true, config: "5s request timeout" },
    { id: "r3", name: "Circuit Breaker", type: "circuit-breaker", enabled: true, config: "5 failures → open 30s" },
    { id: "r4", name: "Rate Limit", type: "rate-limit", enabled: false, config: "100 req/s per service" },
  ]);
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [sending, setSending] = useState(false);
  const [activeFlow, setActiveFlow] = useState<string[]>([]);
  const [mode, setMode] = useState<"mesh" | "traffic" | "observability">("mesh");
  const [mtlsEnabled, setMtlsEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => timerRef.current.forEach(t => clearTimeout(t));
  }, []);

  const sendRequest = useCallback(() => {
    if (sending) return;
    setSending(true);
    setActiveFlow([]);
    setTraces([]);

    const flow = ["api-gw", "user-svc", "order-svc", "payment-svc", "inventory-svc", "notification-svc"];
    let delay = 0;

    flow.forEach((svcId, idx) => {
      const t = setTimeout(() => {
        setActiveFlow(prev => [...prev, svcId]);
        setServices(prev => prev.map(s =>
          s.id === svcId ? { ...s, requests: s.requests + 1 } : s
        ));
        const span: TraceSpan = {
          id: `span-${Date.now()}-${idx}`,
          service: svcId,
          operation: idx === 0 ? "ingress" : `call-${svcId}`,
          duration: services.find(s => s.id === svcId)?.latency || 20,
          status: services.find(s => s.id === svcId)?.status === "down" ? "error" : "ok",
          timestamp: Date.now(),
        };
        setTraces(prev => [...prev, span]);

        if (idx === flow.length - 1) {
          const t2 = setTimeout(() => {
            setSending(false);
          }, 600);
          timerRef.current.push(t2);
        }
      }, delay);
      timerRef.current.push(t);
      delay += 500;
    });
  }, [sending, services]);

  const toggleServiceStatus = (id: string) => {
    setServices(prev => prev.map(s => {
      if (s.id !== id) return s;
      const next = s.status === "healthy" ? "degraded" : s.status === "degraded" ? "down" : "healthy";
      return { ...s, status: next };
    }));
  };

  const toggleRule = (id: string) => {
    setTrafficRules(prev => prev.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const statusColor = (s: string) => {
    if (s === "healthy") return "text-green-400";
    if (s === "degraded") return "text-yellow-400";
    return "text-red-400";
  };

  const statusBg = (s: string) => {
    if (s === "healthy") return "bg-green-500/20 border-green-500/40";
    if (s === "degraded") return "bg-yellow-500/20 border-yellow-500/40";
    return "bg-red-500/20 border-red-500/40";
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-border/30">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-bold font-mono text-foreground mb-2 flex items-center gap-3">
            <Network className="w-8 h-8 text-primary" />
            Service Mesh (Istio)
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">
            Sidecar proxy architecture for traffic management, mTLS security, and distributed observability across microservices.
          </p>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-8">
            {(["mesh", "traffic", "observability"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {m === "mesh" ? "🔷 Sidecar Mesh" : m === "traffic" ? "🔀 Traffic Mgmt" : "👁 Observability"}
              </button>
            ))}
          </div>

          {/* Mesh View */}
          {mode === "mesh" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={sendRequest}
                    disabled={sending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm hover:bg-primary/80 disabled:opacity-50 transition-all"
                  >
                    {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Send Request
                  </button>
                  <label className="flex items-center gap-2 text-sm font-mono text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mtlsEnabled}
                      onChange={() => setMtlsEnabled(!mtlsEnabled)}
                      className="accent-primary"
                    />
                    <Shield className="w-4 h-4" /> mTLS
                  </label>
                </div>
                <span className="text-xs text-muted-foreground font-mono">Click a service to toggle status</span>
              </div>

              {/* Service Grid with Sidecar Proxies */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {services.map((svc, idx) => {
                  const isActive = activeFlow.includes(svc.id);
                  return (
                    <motion.div
                      key={svc.id}
                      onClick={() => toggleServiceStatus(svc.id)}
                      className={`relative p-4 rounded-xl border cursor-pointer transition-all ${statusBg(svc.status)} ${
                        isActive ? "ring-2 ring-primary shadow-lg shadow-primary/20" : ""
                      }`}
                      animate={isActive ? { scale: [1, 1.03, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Sidecar indicator */}
                      {svc.sidecar && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary/80 rounded-full flex items-center justify-center">
                          <Shield className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-sm text-foreground">{svc.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className={statusColor(svc.status)}>● {svc.status}</span>
                        <span className="text-muted-foreground">{svc.latency}ms</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {svc.requests} requests
                      </div>

                      {/* Flow arrow */}
                      {isActive && idx < services.length - 1 && (
                        <motion.div
                          className="absolute -right-3 top-1/2 -translate-y-1/2 text-primary z-10"
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* mTLS Status */}
              <div className={`p-4 rounded-xl border ${mtlsEnabled ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                <div className="flex items-center gap-2 font-mono text-sm">
                  {mtlsEnabled ? (
                    <>
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="text-green-400">mTLS Enabled</span>
                      <span className="text-muted-foreground ml-2">— All inter-service communication encrypted with mutual TLS certificates</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="text-red-400">mTLS Disabled</span>
                      <span className="text-muted-foreground ml-2">— Plaintext communication between services (insecure)</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Traffic Management */}
          {mode === "traffic" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-mono mb-4">
                Envoy sidecar proxies intercept all traffic and apply configurable policies:
              </p>
              {trafficRules.map(rule => (
                <motion.div
                  key={rule.id}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.enabled ? "bg-primary/5 border-primary/30" : "bg-muted/10 border-border/30"
                  }`}
                  layout
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`w-10 h-6 rounded-full transition-all relative ${
                          rule.enabled ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full absolute top-1"
                          animate={{ left: rule.enabled ? 22 : 4 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                      <div>
                        <span className="font-mono text-sm text-foreground">{rule.name}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          rule.type === "retry" ? "bg-blue-500/20 text-blue-400" :
                          rule.type === "timeout" ? "bg-yellow-500/20 text-yellow-400" :
                          rule.type === "circuit-breaker" ? "bg-red-500/20 text-red-400" :
                          "bg-purple-500/20 text-purple-400"
                        }`}>
                          {rule.type}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{rule.config}</span>
                  </div>
                </motion.div>
              ))}

              {/* Traffic Split Visualization */}
              <div className="mt-8 p-6 rounded-xl border border-border/30 bg-muted/5">
                <h4 className="font-mono text-sm text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Traffic Splitting (Canary)
                </h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                      <span>v1.0 (stable)</span>
                      <span>90%</span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-green-500 rounded-full" initial={{ width: 0 }} animate={{ width: "90%" }} transition={{ duration: 1 }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
                      <span>v2.0 (canary)</span>
                      <span>10%</span>
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div className="h-full bg-yellow-500 rounded-full" initial={{ width: 0 }} animate={{ width: "10%" }} transition={{ duration: 1 }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Observability */}
          {mode === "observability" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={sendRequest}
                  disabled={sending}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-mono text-sm hover:bg-primary/80 disabled:opacity-50 transition-all"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Generate Trace
                </button>
              </div>

              {/* Distributed Trace */}
              {traces.length > 0 && (
                <div className="p-4 rounded-xl border border-border/30 bg-muted/5">
                  <h4 className="font-mono text-sm text-foreground mb-4">Request Trace (Jaeger-style)</h4>
                  <div className="space-y-2">
                    {traces.map((span, idx) => (
                      <motion.div
                        key={span.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        <span className="w-32 text-xs font-mono text-muted-foreground truncate">{span.service}</span>
                        <div className="flex-1 relative h-6">
                          <div className="absolute inset-y-0 left-0 bg-muted/20 w-full rounded" />
                          <motion.div
                            className={`absolute inset-y-0 left-0 rounded ${
                              span.status === "ok" ? "bg-primary/60" : "bg-red-500/60"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (span.duration / 100) * 100)}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                          />
                          <span className="absolute inset-0 flex items-center px-2 text-xs font-mono text-foreground">
                            {span.operation} — {span.duration}ms
                          </span>
                        </div>
                        {span.status === "ok" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 text-xs font-mono text-muted-foreground">
                    Total latency: {traces.reduce((sum, s) => sum + s.duration, 0)}ms across {traces.length} spans
                  </div>
                </div>
              )}

              {/* Metrics Panel */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Requests", value: services.reduce((s, sv) => s + sv.requests, 0), color: "text-primary" },
                  { label: "Avg Latency", value: `${Math.round(services.reduce((s, sv) => s + sv.latency, 0) / services.length)}ms`, color: "text-yellow-400" },
                  { label: "Error Rate", value: `${services.filter(s => s.status === "down").length > 0 ? "12.5" : "0"}%`, color: services.filter(s => s.status === "down").length > 0 ? "text-red-400" : "text-green-400" },
                ].map(m => (
                  <div key={m.label} className="p-4 rounded-xl border border-border/30 bg-muted/5 text-center">
                    <div className={`text-2xl font-bold font-mono ${m.color}`}>{m.value}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{m.label}</div>
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

export default ServiceMeshDemo;
