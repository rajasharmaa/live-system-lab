import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Server, Database, Globe, Clock, 
  ChevronRight, Play, RotateCcw, AlertTriangle,
  CheckCircle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Span {
  id: string;
  traceId: string;
  parentId: string | null;
  service: string;
  operation: string;
  startTime: number;
  duration: number;
  status: "success" | "error" | "pending";
  tags: Record<string, string>;
}

interface Trace {
  id: string;
  spans: Span[];
  totalDuration: number;
  status: "success" | "error" | "pending";
}

const services = [
  { name: "API Gateway", icon: Globe, color: "hsl(var(--primary))" },
  { name: "User Service", icon: Server, color: "hsl(var(--secondary))" },
  { name: "Order Service", icon: Server, color: "hsl(var(--accent))" },
  { name: "Payment Service", icon: Server, color: "hsl(var(--warning))" },
  { name: "Database", icon: Database, color: "hsl(var(--success))" },
];

const DistributedTracingDemo = () => {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [simulateError, setSimulateError] = useState(false);

  const generateSpanId = () => Math.random().toString(36).substr(2, 16);
  const generateTraceId = () => Math.random().toString(36).substr(2, 32);

  const simulateRequest = useCallback(async () => {
    setIsTracing(true);
    const traceId = generateTraceId();
    const spans: Span[] = [];
    let currentTime = 0;
    const errorAtService = simulateError ? Math.floor(Math.random() * 4) + 1 : -1;

    // API Gateway
    const gatewaySpan: Span = {
      id: generateSpanId(),
      traceId,
      parentId: null,
      service: "API Gateway",
      operation: "POST /api/orders",
      startTime: currentTime,
      duration: 0,
      status: "pending",
      tags: { "http.method": "POST", "http.url": "/api/orders" },
    };
    spans.push(gatewaySpan);

    // User Service
    await new Promise(r => setTimeout(r, 300));
    currentTime += 50;
    const userSpan: Span = {
      id: generateSpanId(),
      traceId,
      parentId: gatewaySpan.id,
      service: "User Service",
      operation: "validateUser()",
      startTime: currentTime,
      duration: 120,
      status: errorAtService === 1 ? "error" : "success",
      tags: { "user.id": "usr_123", "validated": errorAtService === 1 ? "false" : "true" },
    };
    spans.push(userSpan);

    if (errorAtService === 1) {
      gatewaySpan.status = "error";
      gatewaySpan.duration = currentTime + 120;
      setTraces(prev => [{ id: traceId, spans: [...spans], totalDuration: gatewaySpan.duration, status: "error" }, ...prev.slice(0, 4)]);
      setIsTracing(false);
      return;
    }

    // Order Service
    await new Promise(r => setTimeout(r, 400));
    currentTime += 170;
    const orderSpan: Span = {
      id: generateSpanId(),
      traceId,
      parentId: gatewaySpan.id,
      service: "Order Service",
      operation: "createOrder()",
      startTime: currentTime,
      duration: 200,
      status: errorAtService === 2 ? "error" : "success",
      tags: { "order.id": "ord_" + Math.random().toString(36).substr(2, 6) },
    };
    spans.push(orderSpan);

    if (errorAtService === 2) {
      gatewaySpan.status = "error";
      gatewaySpan.duration = currentTime + 200;
      setTraces(prev => [{ id: traceId, spans: [...spans], totalDuration: gatewaySpan.duration, status: "error" }, ...prev.slice(0, 4)]);
      setIsTracing(false);
      return;
    }

    // Payment Service
    await new Promise(r => setTimeout(r, 500));
    currentTime += 370;
    const paymentSpan: Span = {
      id: generateSpanId(),
      traceId,
      parentId: orderSpan.id,
      service: "Payment Service",
      operation: "processPayment()",
      startTime: currentTime,
      duration: 350,
      status: errorAtService === 3 ? "error" : "success",
      tags: { "payment.method": "card", "amount": "$99.99" },
    };
    spans.push(paymentSpan);

    if (errorAtService === 3) {
      gatewaySpan.status = "error";
      gatewaySpan.duration = currentTime + 350;
      setTraces(prev => [{ id: traceId, spans: [...spans], totalDuration: gatewaySpan.duration, status: "error" }, ...prev.slice(0, 4)]);
      setIsTracing(false);
      return;
    }

    // Database
    await new Promise(r => setTimeout(r, 300));
    currentTime += 720;
    const dbSpan: Span = {
      id: generateSpanId(),
      traceId,
      parentId: paymentSpan.id,
      service: "Database",
      operation: "INSERT orders",
      startTime: currentTime,
      duration: 45,
      status: errorAtService === 4 ? "error" : "success",
      tags: { "db.type": "postgresql", "db.statement": "INSERT INTO orders..." },
    };
    spans.push(dbSpan);

    await new Promise(r => setTimeout(r, 200));
    
    gatewaySpan.duration = currentTime + 95;
    gatewaySpan.status = errorAtService === 4 ? "error" : "success";

    const trace: Trace = {
      id: traceId,
      spans,
      totalDuration: gatewaySpan.duration,
      status: gatewaySpan.status,
    };

    setTraces(prev => [trace, ...prev.slice(0, 4)]);
    setSelectedTrace(trace);
    setIsTracing(false);
  }, [simulateError]);

  const getServiceColor = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    return service?.color || "hsl(var(--muted))";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4 text-success" />;
      case "error": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-warning animate-pulse" />;
    }
  };

  return (
    <section id="tracing" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Observability</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Distributed Tracing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Track requests across multiple services. Visualize latency, 
            identify bottlenecks, and debug distributed systems.
          </p>
        </motion.div>

        {/* Service Map */}
        <div className="glass-card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Service Map</h3>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {services.map((service, index) => (
              <div key={service.name} className="flex items-center">
                <motion.div
                  animate={isTracing ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, delay: index * 0.2, repeat: isTracing ? Infinity : 0 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                  style={{ 
                    borderColor: service.color,
                    backgroundColor: `${service.color}20`
                  }}
                >
                  <service.icon className="w-5 h-5" style={{ color: service.color }} />
                  <span className="text-sm font-medium">{service.name}</span>
                </motion.div>
                {index < services.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Controls & Trace List */}
          <div className="space-y-6">
            {/* Controls */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Simulate Request</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="simulate-error"
                    checked={simulateError}
                    onChange={(e) => setSimulateError(e.target.checked)}
                  />
                  <label htmlFor="simulate-error" className="text-sm">
                    <AlertTriangle className="w-4 h-4 inline mr-1 text-warning" />
                    Simulate random failure
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={simulateRequest} 
                    disabled={isTracing}
                    className="flex-1 gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {isTracing ? "Tracing..." : "Send Request"}
                  </Button>
                  <Button 
                    onClick={() => { setTraces([]); setSelectedTrace(null); }}
                    variant="outline"
                    size="icon"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Trace List */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Traces</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {traces.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 text-sm">
                      No traces yet
                    </p>
                  ) : (
                    traces.map((trace) => (
                      <motion.button
                        key={trace.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setSelectedTrace(trace)}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          selectedTrace?.id === trace.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {trace.id.slice(0, 16)}...
                          </span>
                          {getStatusIcon(trace.status)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{trace.spans.length} spans</span>
                          <span className="text-xs text-muted-foreground">
                            {trace.totalDuration}ms
                          </span>
                        </div>
                      </motion.button>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Trace Detail / Waterfall */}
          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="text-lg font-semibold mb-4">
              {selectedTrace ? "Trace Waterfall" : "Select a trace"}
            </h3>

            {selectedTrace ? (
              <div className="space-y-3">
                {/* Trace ID */}
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono">{selectedTrace.id}</span>
                  <Badge 
                    variant={selectedTrace.status === "success" ? "default" : "destructive"}
                    className="ml-auto"
                  >
                    {selectedTrace.totalDuration}ms
                  </Badge>
                </div>

                {/* Waterfall Chart */}
                <div className="space-y-2">
                  {selectedTrace.spans.map((span, index) => {
                    const leftOffset = (span.startTime / selectedTrace.totalDuration) * 100;
                    const width = (span.duration / selectedTrace.totalDuration) * 100;
                    
                    return (
                      <motion.div
                        key={span.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          <span 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getServiceColor(span.service) }}
                          />
                          <span className="text-sm font-medium w-32 truncate">{span.service}</span>
                          <span className="text-xs text-muted-foreground flex-1 truncate">
                            {span.operation}
                          </span>
                          <span className="text-xs font-mono">{span.duration}ms</span>
                          {getStatusIcon(span.status)}
                        </div>
                        <div className="h-6 bg-muted/30 rounded relative overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(width, 2)}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`absolute h-full rounded ${
                              span.status === "error" ? "bg-destructive/60" : ""
                            }`}
                            style={{ 
                              left: `${leftOffset}%`,
                              backgroundColor: span.status !== "error" ? getServiceColor(span.service) : undefined,
                              opacity: 0.7
                            }}
                          />
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.entries(span.tags).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="text-xs px-1.5 py-0.5 bg-muted/50 rounded">
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Timeline Scale */}
                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>0ms</span>
                  <span>{Math.round(selectedTrace.totalDuration / 2)}ms</span>
                  <span>{selectedTrace.totalDuration}ms</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Send a request to see the trace waterfall
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DistributedTracingDemo;
