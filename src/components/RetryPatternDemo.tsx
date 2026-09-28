import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, Clock, AlertTriangle, CheckCircle, 
  XCircle, Zap, Timer, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RetryAttempt {
  id: string;
  attemptNumber: number;
  delay: number;
  status: "pending" | "retrying" | "success" | "failed";
  timestamp: number;
  error?: string;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  strategy: "fixed" | "exponential" | "exponential-jitter";
}

const strategies: { id: RetryConfig["strategy"]; name: string; description: string }[] = [
  { id: "fixed", name: "Fixed Delay", description: "Same delay between each retry" },
  { id: "exponential", name: "Exponential Backoff", description: "Delay doubles each attempt" },
  { id: "exponential-jitter", name: "Exponential + Jitter", description: "Randomized exponential delay" },
];

const RetryPatternDemo = () => {
  const [attempts, setAttempts] = useState<RetryAttempt[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [failureRate, setFailureRate] = useState(70); // 70% chance of failure
  const [config, setConfig] = useState<RetryConfig>({
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 16000,
    strategy: "exponential-jitter",
  });

  const calculateDelay = useCallback((attempt: number): number => {
    switch (config.strategy) {
      case "fixed":
        return config.baseDelay;
      case "exponential":
        return Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
      case "exponential-jitter": {
        const exponentialDelay = Math.min(config.baseDelay * Math.pow(2, attempt), config.maxDelay);
        const jitter = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        return Math.floor(exponentialDelay * jitter);
      }
      default:
        return config.baseDelay;
    }
  }, [config]);

  const simulateRequest = useCallback((): boolean => {
    return Math.random() * 100 > failureRate;
  }, [failureRate]);

  const startRetry = useCallback(async () => {
    setIsRunning(true);
    setAttempts([]);
    setCurrentAttempt(0);

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      const delay = attempt === 0 ? 0 : calculateDelay(attempt - 1);
      
      const newAttempt: RetryAttempt = {
        id: Math.random().toString(36).substr(2, 9),
        attemptNumber: attempt + 1,
        delay,
        status: "pending",
        timestamp: Date.now(),
      };

      setAttempts(prev => [...prev, newAttempt]);
      setCurrentAttempt(attempt + 1);

      // Wait for delay if not first attempt
      if (delay > 0) {
        setAttempts(prev => prev.map(a => 
          a.id === newAttempt.id ? { ...a, status: "retrying" } : a
        ));

        // Countdown animation
        const startTime = Date.now();
        const countdownInterval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, delay - elapsed);
          setCountdown(remaining);
          if (remaining <= 0) clearInterval(countdownInterval);
        }, 50);

        await new Promise(resolve => setTimeout(resolve, delay));
        clearInterval(countdownInterval);
        setCountdown(0);
      }

      // Simulate request
      const success = simulateRequest();

      if (success) {
        setAttempts(prev => prev.map(a => 
          a.id === newAttempt.id ? { ...a, status: "success" } : a
        ));
        setIsRunning(false);
        return;
      } else {
        setAttempts(prev => prev.map(a => 
          a.id === newAttempt.id 
            ? { ...a, status: attempt < config.maxRetries ? "failed" : "failed", error: "Request timeout" } 
            : a
        ));
      }
    }

    setIsRunning(false);
  }, [config, calculateDelay, simulateRequest]);

  const getStatusIcon = (status: RetryAttempt["status"]) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-muted-foreground" />;
      case "retrying": return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "success": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatDelay = (ms: number): string => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms}ms`;
  };

  // Calculate delay visualization data
  const delayVisualization = Array.from({ length: config.maxRetries }, (_, i) => ({
    attempt: i + 1,
    delay: calculateDelay(i),
  }));

  return (
    <section id="retry-pattern" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Reliability & Fault Tolerance</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Retry Pattern</span>
            <span className="text-foreground"> with Backoff</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Automatically retry failed operations with configurable backoff strategies 
            to handle transient failures gracefully.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Configuration</h3>
            </div>

            {/* Strategy Selection */}
            <div className="space-y-2 mb-6">
              <label className="text-sm text-muted-foreground">Retry Strategy</label>
              {strategies.map((strategy) => (
                <motion.button
                  key={strategy.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setConfig(prev => ({ ...prev, strategy: strategy.id }))}
                  disabled={isRunning}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    config.strategy === strategy.id
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted/50 border-2 border-transparent hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium text-sm">{strategy.name}</div>
                  <div className="text-xs text-muted-foreground">{strategy.description}</div>
                </motion.button>
              ))}
            </div>

            {/* Failure Rate */}
            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-2 block">
                Failure Rate: {failureRate}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={failureRate}
                onChange={(e) => setFailureRate(parseInt(e.target.value))}
                disabled={isRunning}
                className="w-full"
              />
            </div>

            {/* Max Retries */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground mb-2 block">
                Max Retries: {config.maxRetries}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={config.maxRetries}
                onChange={(e) => setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                disabled={isRunning}
                className="w-full"
              />
            </div>

            <Button onClick={startRetry} disabled={isRunning} className="w-full">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "Retrying..." : "Start Request"}
            </Button>
          </div>

          {/* Retry Timeline */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-secondary" />
              <h3 className="text-lg font-semibold">Retry Timeline</h3>
            </div>

            {/* Countdown */}
            {countdown > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 p-4 bg-yellow-500/20 rounded-lg border border-yellow-500/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-yellow-500 font-medium">Waiting before retry...</span>
                  <span className="font-mono text-yellow-500">{formatDelay(countdown)}</span>
                </div>
                <div className="h-2 bg-yellow-500/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-yellow-500 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: countdown / 1000, ease: "linear" }}
                  />
                </div>
              </motion.div>
            )}

            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {attempts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    Click "Start Request" to begin
                  </p>
                ) : (
                  attempts.map((attempt, index) => (
                    <motion.div
                      key={attempt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border ${
                        attempt.status === "success" 
                          ? "bg-green-500/10 border-green-500/50"
                          : attempt.status === "failed"
                            ? "bg-red-500/10 border-red-500/50"
                            : attempt.status === "retrying"
                              ? "bg-yellow-500/10 border-yellow-500/50"
                              : "bg-muted/50 border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(attempt.status)}
                          <span className="font-medium text-sm">
                            Attempt {attempt.attemptNumber}
                          </span>
                        </div>
                        {attempt.delay > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Wait: {formatDelay(attempt.delay)}
                          </Badge>
                        )}
                      </div>
                      {attempt.error && (
                        <p className="text-xs text-red-400 mt-1">{attempt.error}</p>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Result Summary */}
            {attempts.length > 0 && !isRunning && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  {attempts.some(a => a.status === "success") ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">Success after {attempts.filter(a => a.status !== "pending").length} attempts</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-500">All {config.maxRetries + 1} attempts failed</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Delay Visualization */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold">Delay Curve</h3>
            </div>

            <div className="space-y-2">
              {delayVisualization.map((item, index) => {
                const maxDelay = Math.max(...delayVisualization.map(d => d.delay));
                const widthPercent = (item.delay / maxDelay) * 100;
                const isActive = currentAttempt === item.attempt;
                
                return (
                  <div key={item.attempt} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-8">R{item.attempt}</span>
                    <div className="flex-1 h-6 bg-muted/50 rounded overflow-hidden">
                      <motion.div
                        className={`h-full rounded ${isActive ? "bg-primary" : "bg-primary/50"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercent}%` }}
                        transition={{ delay: index * 0.1 }}
                      />
                    </div>
                    <span className="text-xs font-mono w-12 text-right">
                      {formatDelay(item.delay)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Strategy Explanation */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">
                {strategies.find(s => s.id === config.strategy)?.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {config.strategy === "fixed" && 
                  `Wait ${formatDelay(config.baseDelay)} between each retry attempt.`}
                {config.strategy === "exponential" && 
                  `Delay doubles: ${formatDelay(config.baseDelay)} → ${formatDelay(config.baseDelay * 2)} → ${formatDelay(config.baseDelay * 4)}...`}
                {config.strategy === "exponential-jitter" && 
                  `Exponential delay with random jitter (50-100%) to prevent thundering herd.`}
              </p>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mt-8 glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Retry Best Practices
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🎲 Add Jitter</h4>
              <p className="text-sm text-muted-foreground">
                Randomize delays to prevent synchronized retries from multiple clients.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">⏱️ Set Max Delay</h4>
              <p className="text-sm text-muted-foreground">
                Cap maximum delay to avoid excessively long waits.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🔍 Idempotency</h4>
              <p className="text-sm text-muted-foreground">
                Ensure operations are idempotent to safely retry without side effects.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🚫 Don't Retry Everything</h4>
              <p className="text-sm text-muted-foreground">
                Only retry transient failures, not 4xx client errors.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RetryPatternDemo;
