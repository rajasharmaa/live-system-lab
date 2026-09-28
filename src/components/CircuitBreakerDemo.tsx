import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldOff, ShieldAlert, Zap, AlertTriangle, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { ShieldGuard } from "./ui/SVGMascots";

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface RequestLog {
  id: number;
  success: boolean;
  timestamp: number;
}

export const CircuitBreakerInteractive = () => {
  const [circuitState, setCircuitState] = useState<CircuitState>("CLOSED");
  const [failureCount, setFailureCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [requestLogs, setRequestLogs] = useState<RequestLog[]>([]);
  const [failureThreshold] = useState(5);
  const [recoveryTimeout] = useState(5000);
  const [lastFailureTime, setLastFailureTime] = useState<number | null>(null);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [simulatedServiceHealth, setSimulatedServiceHealth] = useState(80);

  // Auto-recovery from OPEN to HALF_OPEN
  useEffect(() => {
    if (circuitState === "OPEN" && lastFailureTime) {
      const timer = setTimeout(() => {
        setCircuitState("HALF_OPEN");
      }, recoveryTimeout);
      return () => clearTimeout(timer);
    }
  }, [circuitState, lastFailureTime, recoveryTimeout]);

  // Auto-mode simulation
  useEffect(() => {
    if (!isAutoMode) return;
    const interval = setInterval(() => {
      makeRequest();
    }, 500);
    return () => clearInterval(interval);
  }, [isAutoMode, circuitState, simulatedServiceHealth]);

  const makeRequest = () => {
    const isSuccess = Math.random() * 100 < simulatedServiceHealth;
    
    const newLog: RequestLog = {
      id: Date.now(),
      success: isSuccess,
      timestamp: Date.now(),
    };

    setRequestLogs(prev => [newLog, ...prev].slice(0, 20));

    if (circuitState === "OPEN") {
      return; // Circuit is open, reject immediately
    }

    if (circuitState === "HALF_OPEN") {
      if (isSuccess) {
        setCircuitState("CLOSED");
        setFailureCount(0);
        setSuccessCount(prev => prev + 1);
      } else {
        setCircuitState("OPEN");
        setLastFailureTime(Date.now());
      }
      return;
    }

    // CLOSED state
    if (isSuccess) {
      setSuccessCount(prev => prev + 1);
      setFailureCount(0);
    } else {
      const newFailureCount = failureCount + 1;
      setFailureCount(newFailureCount);
      if (newFailureCount >= failureThreshold) {
        setCircuitState("OPEN");
        setLastFailureTime(Date.now());
      }
    }
  };

  const resetCircuit = () => {
    setCircuitState("CLOSED");
    setFailureCount(0);
    setSuccessCount(0);
    setRequestLogs([]);
    setLastFailureTime(null);
  };

  const getStateColor = () => {
    switch (circuitState) {
      case "CLOSED": return "text-success";
      case "OPEN": return "text-destructive";
      case "HALF_OPEN": return "text-warning";
    }
  };

  const getStateIcon = () => {
    switch (circuitState) {
      case "CLOSED": return <Shield className="w-8 h-8 md:w-12 md:h-12" />;
      case "OPEN": return <ShieldOff className="w-8 h-8 md:w-12 md:h-12" />;
      case "HALF_OPEN": return <ShieldAlert className="w-8 h-8 md:w-12 md:h-12" />;
    }
  };

  const getStateBadge = () => {
    switch (circuitState) {
      case "CLOSED": return <Badge className="bg-success/20 text-success border-success/30 text-[10px] md:text-xs">CLOSED - Allowing Traffic</Badge>;
      case "OPEN": return <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-[10px] md:text-xs">OPEN - Blocking Traffic</Badge>;
      case "HALF_OPEN": return <Badge className="bg-warning/20 text-warning border-warning/30 text-[10px] md:text-xs">HALF-OPEN - Testing</Badge>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Circuit Visualization */}
        <Card className="glass-card p-4 md:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Circuit State
            </h3>

            <div className="flex flex-col items-center justify-center py-4 md:py-8">
              <motion.div
                key={circuitState}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`${getStateColor()} mb-2 md:mb-4`}
              >
                {getStateIcon()}
              </motion.div>
              {getStateBadge()}

              <div className="mt-4 md:mt-8 grid grid-cols-3 gap-2 md:gap-4 w-full text-center">
                <div className="glass-card p-2 md:p-4 rounded-lg">
                  <div className="text-lg md:text-2xl font-mono font-bold text-success">{successCount}</div>
                  <div className="text-[9px] md:text-xs text-muted-foreground">Successful</div>
                </div>
                <div className="glass-card p-2 md:p-4 rounded-lg">
                  <div className="text-lg md:text-2xl font-mono font-bold text-destructive">{failureCount}</div>
                  <div className="text-[9px] md:text-xs text-muted-foreground">Failures</div>
                </div>
                <div className="glass-card p-2 md:p-4 rounded-lg">
                  <div className="text-lg md:text-2xl font-mono font-bold text-warning">{failureThreshold}</div>
                  <div className="text-[9px] md:text-xs text-muted-foreground">Threshold</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[10px] md:text-sm text-muted-foreground mb-1 md:mb-2 block">
                Simulated Service Health: {simulatedServiceHealth}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={simulatedServiceHealth}
                onChange={(e) => setSimulatedServiceHealth(Number(e.target.value))}
                className="w-full accent-primary h-1 md:h-2"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={makeRequest}
                disabled={isAutoMode}
                className="flex-1 text-[10px] md:text-xs h-8"
              >
                Send Request
              </Button>
              <Button
                onClick={() => setIsAutoMode(!isAutoMode)}
                variant={isAutoMode ? "destructive" : "secondary"}
                className="flex-[1.5] text-[10px] md:text-xs h-8"
              >
                {isAutoMode ? "Stop Auto" : "Auto Mode"}
              </Button>
              <Button onClick={resetCircuit} variant="outline" size="icon" className="h-8 w-8">
                <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Request Log & Explanation */}
        <Card className="glass-card p-4 md:p-6 flex flex-col">
          <h3 className="text-sm md:text-lg font-semibold text-foreground mb-2 md:mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-warning" />
            Request Log
          </h3>

          <div className="h-32 md:h-48 overflow-y-auto space-y-2 mb-4 md:mb-6 custom-scrollbar pr-2">
            <AnimatePresence>
              {requestLogs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-1 md:gap-2 text-[10px] md:text-sm p-1.5 md:p-2 rounded ${
                    log.success ? "bg-success/10" : "bg-destructive/10"
                  }`}
                >
                  {log.success ? (
                    <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 md:w-4 md:h-4 text-destructive flex-shrink-0" />
                  )}
                  <span className="font-mono text-[9px] md:text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={log.success ? "text-success" : "text-destructive"}>
                    {log.success ? "Success" : "Failed"}
                  </span>
                  {circuitState === "OPEN" && !log.success && (
                    <Badge variant="outline" className="ml-auto text-[8px] md:text-[10px] py-0 h-4">
                      Rejected
                    </Badge>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="space-y-2 md:space-y-4 border-t border-border/50 pt-2 md:pt-4 mt-auto">
            <div className="glass-card p-2 md:p-3 rounded-lg">
              <div className="flex items-center gap-1.5 md:gap-2 text-success mb-0.5 md:mb-1">
                <Shield className="w-3 h-3 md:w-4 md:h-4" />
                <span className="font-semibold text-[10px] md:text-sm">CLOSED</span>
              </div>
              <p className="text-[9px] md:text-xs text-muted-foreground">
                Normal operation. All requests pass through. Monitoring for failures.
              </p>
            </div>
            <div className="glass-card p-2 md:p-3 rounded-lg">
              <div className="flex items-center gap-1.5 md:gap-2 text-destructive mb-0.5 md:mb-1">
                <ShieldOff className="w-3 h-3 md:w-4 md:h-4" />
                <span className="font-semibold text-[10px] md:text-sm">OPEN</span>
              </div>
              <p className="text-[9px] md:text-xs text-muted-foreground">
                Too many failures detected. Requests blocked immediately to prevent cascade.
              </p>
            </div>
            <div className="glass-card p-2 md:p-3 rounded-lg">
              <div className="flex items-center gap-1.5 md:gap-2 text-warning mb-0.5 md:mb-1">
                <ShieldAlert className="w-3 h-3 md:w-4 md:h-4" />
                <span className="font-semibold text-[10px] md:text-sm">HALF-OPEN</span>
              </div>
              <p className="text-[9px] md:text-xs text-muted-foreground">
                Recovery phase. Limited requests allowed to test if service is healthy again.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const CircuitBreakerDemo = () => {
  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <ShieldGuard />
          <div>
            <h2 className="text-3xl font-bold mb-2">Circuit Breaker Pattern</h2>
            <p className="text-muted-foreground">
              Prevents an application from repeatedly trying to execute an operation that's likely to fail.
              <strong> Why?</strong> Stops cascading failures in microservices, allows failing services time to recover.
              <strong> Real-world:</strong> Netflix Hystrix, Resilience4j.
            </p>
          </div>
        </div>
        <CircuitBreakerInteractive />
      </div>
    </section>
  );
};

export default CircuitBreakerDemo;
