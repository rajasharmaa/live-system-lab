import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, Bell, AlertTriangle, CheckCircle, 
  XCircle, Server, Database, Zap, Filter, TrendingUp
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  service: string;
  message: string;
  traceId: string;
}

interface Alert {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  currentValue: number;
  status: "ok" | "firing" | "pending";
  lastTriggered?: string;
}

const services = ["api-gateway", "auth-service", "order-service", "payment-service", "notification-service"];
const logMessages: Record<string, string[]> = {
  info: [
    "Request processed successfully",
    "User session created",
    "Cache hit for key",
    "Health check passed",
    "Connection pool refreshed",
  ],
  warn: [
    "Response time exceeding threshold",
    "Memory usage above 80%",
    "Rate limit approaching for client",
    "Certificate expiring in 7 days",
    "Retry attempt 2 of 3",
  ],
  error: [
    "Failed to connect to database",
    "Timeout waiting for upstream",
    "Authentication token expired",
    "Disk space critically low",
    "Unhandled exception in handler",
  ],
  debug: [
    "Parsing request headers",
    "Cache miss, fetching from origin",
    "Serializing response payload",
    "DNS resolution completed",
    "TLS handshake completed",
  ],
};

const generateTraceId = () => {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
};

const CentralizedLoggingDemo = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [isStreaming, setIsStreaming] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: "1", name: "Error Rate", condition: "errors/min > threshold", threshold: 5, currentValue: 0, status: "ok" },
    { id: "2", name: "Latency P99", condition: "p99_latency > threshold", threshold: 500, currentValue: 120, status: "ok" },
    { id: "3", name: "Memory Usage", condition: "memory_pct > threshold", threshold: 85, currentValue: 72, status: "ok" },
    { id: "4", name: "Disk Space", condition: "disk_pct > threshold", threshold: 90, currentValue: 45, status: "ok" },
  ]);
  const [activeTab, setActiveTab] = useState<"logs" | "alerts" | "aggregation">("logs");
  const [errorCount, setErrorCount] = useState(0);

  const generateLog = useCallback((): LogEntry => {
    const levels: LogEntry["level"][] = ["info", "info", "info", "warn", "error", "debug"];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const service = services[Math.floor(Math.random() * services.length)];
    const messages = logMessages[level];
    const message = messages[Math.floor(Math.random() * messages.length)];

    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      traceId: generateTraceId(),
    };
  }, []);

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      const newLog = generateLog();
      setLogs(prev => [newLog, ...prev].slice(0, 100));
      if (newLog.level === "error") {
        setErrorCount(prev => prev + 1);
      }
    }, 600);
    return () => clearInterval(interval);
  }, [isStreaming, generateLog]);

  // Update alerts based on error count
  useEffect(() => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === "1") {
        const newValue = errorCount;
        return {
          ...alert,
          currentValue: newValue,
          status: newValue > alert.threshold ? "firing" : newValue > alert.threshold * 0.8 ? "pending" : "ok",
        };
      }
      if (alert.id === "2" && isStreaming) {
        const newValue = 120 + Math.random() * (errorCount > 3 ? 500 : 100);
        return {
          ...alert,
          currentValue: Math.round(newValue),
          status: newValue > alert.threshold ? "firing" : newValue > alert.threshold * 0.8 ? "pending" : "ok",
        };
      }
      return alert;
    }));
  }, [errorCount, isStreaming]);

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== "all" && log.level !== levelFilter) return false;
    if (serviceFilter !== "all" && log.service !== serviceFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !log.service.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.traceId.includes(searchQuery)) return false;
    return true;
  });

  const logCounts = {
    info: logs.filter(l => l.level === "info").length,
    warn: logs.filter(l => l.level === "warn").length,
    error: logs.filter(l => l.level === "error").length,
    debug: logs.filter(l => l.level === "debug").length,
  };

  const levelColors: Record<string, string> = {
    info: "text-primary",
    warn: "text-warning",
    error: "text-destructive",
    debug: "text-muted-foreground",
  };

  const levelBgColors: Record<string, string> = {
    info: "bg-primary/10 border-primary/30",
    warn: "bg-warning/10 border-warning/30",
    error: "bg-destructive/10 border-destructive/30",
    debug: "bg-muted/30 border-border",
  };

  const alertStatusColors: Record<string, string> = {
    ok: "text-success",
    firing: "text-destructive",
    pending: "text-warning",
  };

  const injectBurst = () => {
    const burst = Array.from({ length: 10 }, () => {
      const log = generateLog();
      log.level = "error";
      log.message = logMessages.error[Math.floor(Math.random() * logMessages.error.length)];
      return log;
    });
    setLogs(prev => [...burst, ...prev].slice(0, 100));
    setErrorCount(prev => prev + 10);
  };

  return (
    <section className="py-24 relative">
      <div className="container px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 border border-warning/30 mb-6">
            <FileText className="w-4 h-4 text-warning" />
            <span className="text-sm font-medium text-warning">Centralized Logging & Alerting</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Log Aggregation</span> & Alerting
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Collect, search, and analyze logs from all services. Set threshold-based alerts for proactive monitoring.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-8">
          {(["logs", "alerts", "aggregation"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab ? "bg-primary text-primary-foreground" : "glass-card hover:bg-muted/50"
              }`}
            >
              {tab === "logs" && <FileText className="w-4 h-4 inline mr-2" />}
              {tab === "alerts" && <Bell className="w-4 h-4 inline mr-2" />}
              {tab === "aggregation" && <TrendingUp className="w-4 h-4 inline mr-2" />}
              {tab}
            </button>
          ))}
        </div>

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Controls */}
            <div className="glass-card p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search logs by message, service, or trace ID..."
                    className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  >
                    <option value="all">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                    <option value="debug">Debug</option>
                  </select>
                  <select
                    value={serviceFilter}
                    onChange={e => setServiceFilter(e.target.value)}
                    className="bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                  >
                    <option value="all">All Services</option>
                    {services.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => { setIsStreaming(!isStreaming); if (!isStreaming) setErrorCount(0); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isStreaming ? "bg-destructive/20 text-destructive border border-destructive/30" : "bg-success/20 text-success border border-success/30"
                  }`}
                >
                  {isStreaming ? "⏹ Stop" : "▶ Stream Logs"}
                </button>
                <button onClick={injectBurst} className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive/20 text-destructive border border-destructive/30">
                  💥 Error Burst
                </button>
              </div>
            </div>

            {/* Log Stats */}
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(logCounts).map(([level, count]) => (
                <div key={level} className={`glass-card p-3 border ${levelBgColors[level]}`}>
                  <div className={`text-2xl font-bold font-mono ${levelColors[level]}`}>{count}</div>
                  <div className="text-xs text-muted-foreground uppercase">{level}</div>
                </div>
              ))}
            </div>

            {/* Log Stream */}
            <div className="glass-card overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center gap-4 text-xs text-muted-foreground font-mono">
                <span className="w-[180px]">TIMESTAMP</span>
                <span className="w-[60px]">LEVEL</span>
                <span className="w-[140px]">SERVICE</span>
                <span className="flex-1">MESSAGE</span>
                <span className="w-[120px]">TRACE ID</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      {logs.length === 0 ? "Click 'Stream Logs' to start generating logs" : "No logs match your filters"}
                    </div>
                  ) : (
                    filteredLogs.slice(0, 50).map(log => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-2 border-b border-border/50 flex items-center gap-4 text-xs font-mono hover:bg-muted/20 transition-colors ${
                          log.level === "error" ? "bg-destructive/5" : ""
                        }`}
                      >
                        <span className="w-[180px] text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}.{new Date(log.timestamp).getMilliseconds().toString().padStart(3, "0")}</span>
                        <span className={`w-[60px] font-bold uppercase ${levelColors[log.level]}`}>{log.level}</span>
                        <span className="w-[140px] text-secondary">{log.service}</span>
                        <span className="flex-1 text-foreground">{log.message}</span>
                        <span className="w-[120px] text-muted-foreground truncate">{log.traceId.slice(0, 12)}…</span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {alerts.map(alert => (
                <motion.div key={alert.id} className={`glass-card p-5 border ${
                  alert.status === "firing" ? "border-destructive/50 bg-destructive/5" : 
                  alert.status === "pending" ? "border-warning/50 bg-warning/5" : "border-border"
                }`} layout>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {alert.status === "firing" ? <XCircle className="w-5 h-5 text-destructive" /> :
                       alert.status === "pending" ? <AlertTriangle className="w-5 h-5 text-warning" /> :
                       <CheckCircle className="w-5 h-5 text-success" />}
                      <h3 className="font-semibold text-foreground">{alert.name}</h3>
                    </div>
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                      alert.status === "firing" ? "bg-destructive/20 text-destructive" :
                      alert.status === "pending" ? "bg-warning/20 text-warning" :
                      "bg-success/20 text-success"
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mb-3">{alert.condition}</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Current</span>
                        <span className={alertStatusColors[alert.status]}>{alert.currentValue}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            alert.status === "firing" ? "bg-destructive" : alert.status === "pending" ? "bg-warning" : "bg-success"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((alert.currentValue / alert.threshold) * 100, 100)}%` }}
                          transition={{ type: "spring" }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Threshold: <span className="text-foreground font-mono">{alert.threshold}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="glass-card p-4 text-center text-sm text-muted-foreground">
              💡 Start streaming logs and inject error bursts to see alerts transition from <span className="text-success font-medium">OK</span> → <span className="text-warning font-medium">Pending</span> → <span className="text-destructive font-medium">Firing</span>
            </div>
          </motion.div>
        )}

        {/* Aggregation Tab */}
        {activeTab === "aggregation" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Log Aggregation Pipeline
              </h3>
              <div className="flex items-center justify-between gap-4 overflow-x-auto pb-4">
                {[
                  { icon: Server, label: "Services", desc: "Application logs", color: "text-primary" },
                  { icon: Zap, label: "Collectors", desc: "Fluentd / Logstash", color: "text-warning" },
                  { icon: Database, label: "Storage", desc: "Elasticsearch", color: "text-accent" },
                  { icon: Search, label: "Search", desc: "Kibana / Grafana", color: "text-secondary" },
                  { icon: Bell, label: "Alerts", desc: "Threshold Rules", color: "text-destructive" },
                ].map((step, i) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <motion.div
                      className="flex flex-col items-center gap-2 min-w-[100px]"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15 }}
                    >
                      <div className={`w-14 h-14 rounded-xl bg-muted/50 border border-border flex items-center justify-center`}>
                        <step.icon className={`w-7 h-7 ${step.color}`} />
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-foreground">{step.label}</div>
                        <div className="text-xs text-muted-foreground">{step.desc}</div>
                      </div>
                    </motion.div>
                    {i < 4 && (
                      <motion.div
                        className="text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.15 + 0.1 }}
                      >
                        →
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Per-service breakdown */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4">Logs by Service</h3>
              <div className="space-y-3">
                {services.map(service => {
                  const count = logs.filter(l => l.service === service).length;
                  const errors = logs.filter(l => l.service === service && l.level === "error").length;
                  const maxCount = Math.max(...services.map(s => logs.filter(l => l.service === s).length), 1);
                  return (
                    <div key={service} className="flex items-center gap-3">
                      <span className="w-[160px] text-sm font-mono text-secondary">{service}</span>
                      <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden flex">
                        <motion.div
                          className="h-full bg-primary/40"
                          animate={{ width: `${((count - errors) / maxCount) * 100}%` }}
                        />
                        <motion.div
                          className="h-full bg-destructive/60"
                          animate={{ width: `${(errors / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-[60px] text-right">{count} logs</span>
                    </div>
                  );
                })}
              </div>
              {logs.length === 0 && (
                <div className="text-center text-muted-foreground text-sm mt-4">Stream logs to see aggregation data</div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default CentralizedLoggingDemo;
