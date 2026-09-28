import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Box, Server, AlertTriangle, CheckCircle, XCircle,
  Play, RotateCcw, Users, ShoppingCart, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

interface Compartment {
  id: string;
  name: string;
  icon: React.ElementType;
  maxConcurrent: number;
  activeCalls: number;
  queuedCalls: number;
  status: "healthy" | "degraded" | "overloaded";
  successCount: number;
  failureCount: number;
}

const initialCompartments: Compartment[] = [
  { id: "user", name: "User Service", icon: Users, maxConcurrent: 5, activeCalls: 0, queuedCalls: 0, status: "healthy", successCount: 0, failureCount: 0 },
  { id: "order", name: "Order Service", icon: ShoppingCart, maxConcurrent: 10, activeCalls: 0, queuedCalls: 0, status: "healthy", successCount: 0, failureCount: 0 },
  { id: "payment", name: "Payment Service", icon: CreditCard, maxConcurrent: 3, activeCalls: 0, queuedCalls: 0, status: "healthy", successCount: 0, failureCount: 0 },
];

const BulkheadPatternDemo = () => {
  const [compartments, setCompartments] = useState<Compartment[]>(initialCompartments);
  const [bulkheadEnabled, setBulkheadEnabled] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [isOverloading, setIsOverloading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 19)]);
  };

  const updateCompartment = (id: string, updates: Partial<Compartment>) => {
    setCompartments(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const getStatus = (active: number, max: number): "healthy" | "degraded" | "overloaded" => {
    const ratio = active / max;
    if (ratio < 0.6) return "healthy";
    if (ratio < 1) return "degraded";
    return "overloaded";
  };

  const sendRequest = useCallback(async (compartmentId: string) => {
    const compartment = compartments.find(c => c.id === compartmentId);
    if (!compartment) return;

    if (bulkheadEnabled && compartment.activeCalls >= compartment.maxConcurrent) {
      // Request rejected due to bulkhead
      addLog(`❌ [${compartment.name}] Request REJECTED - Bulkhead limit reached (${compartment.maxConcurrent})`);
      updateCompartment(compartmentId, { 
        failureCount: compartment.failureCount + 1,
        status: "overloaded"
      });
      return;
    }

    // Accept request
    const newActive = compartment.activeCalls + 1;
    updateCompartment(compartmentId, { 
      activeCalls: newActive,
      status: getStatus(newActive, compartment.maxConcurrent)
    });
    addLog(`📤 [${compartment.name}] Request started (${newActive}/${compartment.maxConcurrent})`);

    // Simulate processing
    const delay = 500 + Math.random() * 1500;
    await new Promise(r => setTimeout(r, delay));

    // Complete request
    const success = Math.random() > 0.1;
    setCompartments(prev => {
      const current = prev.find(c => c.id === compartmentId);
      if (!current) return prev;
      const newActiveAfter = Math.max(0, current.activeCalls - 1);
      return prev.map(c => 
        c.id === compartmentId 
          ? { 
              ...c, 
              activeCalls: newActiveAfter,
              status: getStatus(newActiveAfter, c.maxConcurrent),
              successCount: success ? c.successCount + 1 : c.successCount,
              failureCount: success ? c.failureCount : c.failureCount + 1
            }
          : c
      );
    });
    addLog(`${success ? '✅' : '❌'} [${compartment.name}] Request ${success ? 'completed' : 'failed'} (${delay.toFixed(0)}ms)`);
  }, [compartments, bulkheadEnabled]);

  const overloadService = useCallback(async (compartmentId: string) => {
    setIsOverloading(true);
    const burstSize = 15;
    addLog(`🔥 Sending ${burstSize} requests to ${compartments.find(c => c.id === compartmentId)?.name}...`);
    
    for (let i = 0; i < burstSize; i++) {
      sendRequest(compartmentId);
      await new Promise(r => setTimeout(r, 100));
    }
    
    setIsOverloading(false);
  }, [compartments, sendRequest]);

  const reset = () => {
    setCompartments(initialCompartments);
    setLogs([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-success border-success/30 bg-success/10";
      case "degraded": return "text-warning border-warning/30 bg-warning/10";
      case "overloaded": return "text-destructive border-destructive/30 bg-destructive/10";
      default: return "";
    }
  };

  return (
    <section id="bulkhead" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Fault Isolation</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Bulkhead Pattern</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Isolate components to prevent cascading failures. 
            Like ship compartments, if one fills with water, others stay afloat.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center mb-8">
          <div className="glass-card p-4 flex items-center gap-4">
            <span className="text-sm">Bulkhead Protection:</span>
            <Button
              variant={bulkheadEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setBulkheadEnabled(!bulkheadEnabled)}
              className="gap-2"
            >
              <Box className="w-4 h-4" />
              {bulkheadEnabled ? "ENABLED" : "DISABLED"}
            </Button>
            <Button onClick={reset} variant="ghost" size="icon">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Compartments */}
          {compartments.map((compartment) => (
            <motion.div
              key={compartment.id}
              layout
              className={`glass-card p-6 border-2 transition-colors ${getStatusColor(compartment.status)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <compartment.icon className="w-6 h-6" />
                  <h3 className="font-semibold">{compartment.name}</h3>
                </div>
                <Badge 
                  variant={compartment.status === "healthy" ? "default" : 
                          compartment.status === "degraded" ? "secondary" : "destructive"}
                >
                  {compartment.status.toUpperCase()}
                </Badge>
              </div>

              {/* Capacity Visualization */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-mono">
                    {compartment.activeCalls}/{compartment.maxConcurrent}
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full transition-colors ${
                      compartment.status === "healthy" ? "bg-success" :
                      compartment.status === "degraded" ? "bg-warning" : "bg-destructive"
                    }`}
                    animate={{ 
                      width: `${(compartment.activeCalls / compartment.maxConcurrent) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Slots Visualization */}
              <div className="grid grid-cols-5 gap-1 mb-4">
                {Array.from({ length: compartment.maxConcurrent }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      backgroundColor: i < compartment.activeCalls 
                        ? compartment.status === "healthy" ? "hsl(var(--success))" :
                          compartment.status === "degraded" ? "hsl(var(--warning))" : "hsl(var(--destructive))"
                        : "hsl(var(--muted))"
                    }}
                    className="aspect-square rounded"
                  />
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-2 bg-success/10 rounded">
                  <div className="text-lg font-bold text-success">{compartment.successCount}</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div className="text-center p-2 bg-destructive/10 rounded">
                  <div className="text-lg font-bold text-destructive">{compartment.failureCount}</div>
                  <div className="text-xs text-muted-foreground">Rejected</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => sendRequest(compartment.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Send 1
                </Button>
                <Button 
                  onClick={() => overloadService(compartment.id)}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  disabled={isOverloading}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Overload
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logs */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
          <div className="h-48 overflow-y-auto space-y-1 font-mono text-xs">
            <AnimatePresence>
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Send requests to see activity
                </p>
              ) : (
                logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 bg-muted/30 rounded"
                  >
                    {log}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 glass-card p-6"
        >
          <h4 className="font-semibold mb-2">Why Bulkhead Pattern?</h4>
          <p className="text-sm text-muted-foreground">
            Without bulkheads, one overloaded service can exhaust all system resources, 
            causing cascading failures. With bulkheads, each service has isolated resource limits. 
            Try disabling protection and overloading a service to see the difference!
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default BulkheadPatternDemo;
