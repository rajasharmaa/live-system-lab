import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShoppingCart, CreditCard, Package, Truck, 
  CheckCircle, XCircle, RotateCcw, Play, Pause,
  ArrowRight, ArrowLeft, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type StepStatus = "pending" | "running" | "completed" | "failed" | "compensating" | "compensated";

interface SagaStep {
  id: string;
  name: string;
  icon: React.ElementType;
  action: string;
  compensation: string;
  status: StepStatus;
}

const initialSteps: SagaStep[] = [
  { id: "order", name: "Create Order", icon: ShoppingCart, action: "createOrder()", compensation: "cancelOrder()", status: "pending" },
  { id: "payment", name: "Process Payment", icon: CreditCard, action: "chargeCard()", compensation: "refundPayment()", status: "pending" },
  { id: "inventory", name: "Reserve Inventory", icon: Package, action: "reserveStock()", compensation: "releaseStock()", status: "pending" },
  { id: "shipping", name: "Schedule Shipping", icon: Truck, action: "scheduleDelivery()", compensation: "cancelShipment()", status: "pending" },
];

export const SagaInteractive = () => {
  const [steps, setSteps] = useState<SagaStep[]>(initialSteps);
  const [isRunning, setIsRunning] = useState(false);
  const [failAtStep, setFailAtStep] = useState<string | null>("inventory");
  const [logs, setLogs] = useState<string[]>([]);
  const [sagaType, setSagaType] = useState<"choreography" | "orchestration">("orchestration");

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const updateStep = (stepId: string, status: StepStatus) => {
    setSteps(prev => prev.map(s => s.id === stepId ? { ...s, status } : s));
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runSaga = useCallback(async () => {
    setIsRunning(true);
    setSteps(initialSteps);
    setLogs([]);
    
    addLog("🚀 Starting Saga Transaction...");
    addLog(`Mode: ${sagaType === "orchestration" ? "Orchestrator-based" : "Choreography-based"}`);

    const completedSteps: string[] = [];

    for (const step of initialSteps) {
      updateStep(step.id, "running");
      addLog(`⏳ Executing ${step.action}...`);
      await sleep(1000);

      if (step.id === failAtStep) {
        updateStep(step.id, "failed");
        addLog(`❌ ${step.name} FAILED!`);
        addLog("🔄 Starting compensation (rollback)...");
        
        for (const completedStepId of [...completedSteps].reverse()) {
          const completedStep = initialSteps.find(s => s.id === completedStepId)!;
          updateStep(completedStepId, "compensating");
          addLog(`↩️ Executing ${completedStep.compensation}...`);
          await sleep(800);
          updateStep(completedStepId, "compensated");
          addLog(`✅ ${completedStep.name} compensated`);
        }
        
        addLog("⚠️ Saga transaction rolled back");
        setIsRunning(false);
        return;
      }

      updateStep(step.id, "completed");
      completedSteps.push(step.id);
      addLog(`✅ ${step.name} completed`);
    }

    addLog("🎉 Saga transaction completed successfully!");
    setIsRunning(false);
  }, [failAtStep, sagaType]);

  const reset = () => {
    setSteps(initialSteps);
    setLogs([]);
    setIsRunning(false);
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case "running": return "border-warning bg-warning/20";
      case "completed": return "border-success bg-success/20";
      case "failed": return "border-destructive bg-destructive/20";
      case "compensating": return "border-secondary bg-secondary/20";
      case "compensated": return "border-muted bg-muted/50";
      default: return "border-border";
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-success" />;
      case "failed": return <XCircle className="w-4 h-4 md:w-5 md:h-5 text-destructive" />;
      case "compensating": return <RotateCcw className="w-4 h-4 md:w-5 md:h-5 text-secondary animate-spin" />;
      case "compensated": return <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />;
      case "running": return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}><Play className="w-4 h-4 md:w-5 md:h-5 text-warning" /></motion.div>;
      default: return <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 w-full max-w-4xl mx-auto">
      {/* Top: Steps Visualization */}
      <div className="glass-card p-4 md:p-6 flex flex-col w-full shadow-lg border border-border/50 bg-card/40 backdrop-blur-sm rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4 border-b border-border/50 pb-4">
          <h3 className="text-lg md:text-xl font-semibold">Transaction Steps</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="saga-type" className="text-xs">Orchestration</Label>
            <Switch
              id="saga-type"
              checked={sagaType === "choreography"}
              onCheckedChange={(checked) => setSagaType(checked ? "choreography" : "orchestration")}
            />
            <Label htmlFor="saga-type" className="text-xs">Choreography</Label>
          </div>
        </div>

        {/* Steps Flow (Wrap for small containers) */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-6 md:mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-shrink-0 mb-2">
              <motion.div
                layout
                className={`p-3 md:p-4 rounded-xl border-2 transition-colors w-40 md:w-48 ${getStatusColor(step.status)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <step.icon className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="font-medium text-xs md:text-sm leading-tight truncate">{step.name}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <code className="text-[10px] md:text-xs text-muted-foreground truncate w-24">
                    {step.status === "compensating" || step.status === "compensated" 
                      ? step.compensation 
                      : step.action}
                  </code>
                  {getStatusIcon(step.status)}
                </div>
              </motion.div>
              {index < steps.length - 1 && (
                <div className="flex justify-center mx-1 md:mx-2">
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-auto">
          {/* Fail Point Selector */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Simulate failure at:</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={failAtStep === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFailAtStep(null)}
                disabled={isRunning}
                className="text-[10px] md:text-xs h-7 md:h-8"
              >
                No Failure
              </Button>
              {initialSteps.map((step) => (
                <Button
                  key={step.id}
                  variant={failAtStep === step.id ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setFailAtStep(step.id)}
                  disabled={isRunning}
                  className="text-[10px] md:text-xs h-7 md:h-8 px-2"
                >
                  <AlertTriangle className="w-3 h-3 mr-1 hidden sm:block" />
                  <span>{step.name.split(" ")[1]}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={runSaga} 
              disabled={isRunning}
              className="gap-2 text-xs h-8 flex-1 sm:flex-none"
            >
              <Play className="w-3 h-3" />
              Run Saga
            </Button>
            <Button 
              onClick={reset} 
              variant="outline"
              disabled={isRunning}
              className="gap-2 text-xs h-8 flex-1 sm:flex-none"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom: Logs */}
      <div className="glass-card p-4 flex flex-col shadow-lg border border-border/50 bg-card/40 backdrop-blur-sm rounded-xl">
        <h3 className="text-sm font-semibold mb-2">Transaction Log</h3>
        <div className="h-32 overflow-y-auto space-y-1 font-mono text-[10px] custom-scrollbar border border-border/30 rounded p-2 bg-background/50">
          <AnimatePresence>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 italic">
                Click "Run Saga" to start
              </p>
            ) : (
              logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-1 rounded text-muted-foreground"
                >
                  {log}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const SagaPatternDemo = () => {
  return (
    <section id="saga-pattern" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Distributed Transactions</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Saga Pattern</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Manage distributed transactions with compensating actions. 
            Each step can be rolled back if a subsequent step fails.
          </p>
        </motion.div>

        <SagaInteractive />

        {/* Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 grid md:grid-cols-2 gap-6 max-w-6xl mx-auto"
        >
          <div className="glass-card p-6">
            <h4 className="font-semibold mb-2 text-primary">Orchestration</h4>
            <p className="text-sm text-muted-foreground">
              Central coordinator manages the saga. It tells each service what to do 
              and handles compensation if failures occur.
            </p>
          </div>
          <div className="glass-card p-6">
            <h4 className="font-semibold mb-2 text-secondary">Choreography</h4>
            <p className="text-sm text-muted-foreground">
              Each service listens for events and decides what to do next. 
              More decoupled but harder to track.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SagaPatternDemo;
