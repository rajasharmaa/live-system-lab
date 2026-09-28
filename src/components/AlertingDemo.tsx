import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Bell, Smartphone, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

export const AlertingInteractive = () => {
  const [metric, setMetric] = useState(40);
  const [isSpiking, setIsSpiking] = useState(false);
  const [alerts, setAlerts] = useState<{ id: number; type: string; msg: string; resolved: boolean }[]>([]);
  const threshold = 80;

  useEffect(() => {
    const interval = setInterval(() => {
      setMetric(prev => {
        let next = prev;
        if (isSpiking) {
          next = Math.min(100, prev + (Math.random() * 15 + 5));
        } else {
          next = Math.max(20, prev - (Math.random() * 10 + 2));
        }

        if (prev < threshold && next >= threshold) {
          const id = Date.now();
          setAlerts(a => [{ id, type: 'critical', msg: `CPU usage critical: ${Math.round(next)}%`, resolved: false }, ...a].slice(0, 3));
        }
        
        if (prev >= threshold && next < threshold) {
          setAlerts(a => a.map(alert => !alert.resolved ? { ...alert, resolved: true } : alert));
        }

        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSpiking]);

  return (
    <div className="glass-card p-6 md:p-8 rounded-xl w-full grid md:grid-cols-2 gap-8 shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><Activity className="text-primary"/> Server CPU</h3>
          <button 
            onClick={() => setIsSpiking(!isSpiking)}
            className={`py-2 px-4 rounded-lg font-bold text-xs md:text-sm transition-colors ${
              isSpiking ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'
            }`}
          >
            {isSpiking ? 'Resolve Spike' : 'Simulate Spike'}
          </button>
        </div>
        
        <div className="relative h-40 md:h-48 border border-border bg-card rounded-xl overflow-hidden p-4 flex flex-col justify-end">
          <div className="absolute top-[20%] left-0 w-full border-t-2 border-dashed border-destructive/50 z-0"></div>
          <span className="absolute top-[20%] right-2 -translate-y-full text-[10px] md:text-xs font-bold text-destructive/70">Threshold 80%</span>
          
          <div className="relative z-10 w-full flex items-end justify-center h-full">
            <motion.div 
              className={`w-24 md:w-32 rounded-t-xl transition-colors ${metric >= threshold ? 'bg-destructive/80' : 'bg-primary/80'}`}
              initial={{ height: '40%' }}
              animate={{ height: `${metric}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.8 }}
            >
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-2xl md:text-3xl font-bold text-white drop-shadow-md">
              {Math.round(metric)}%
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-bold flex items-center gap-2"><Bell className="text-warning"/> Alert Router</h3>
        
        <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-y-auto space-y-3 relative h-40 md:h-48 custom-scrollbar">
          <AnimatePresence>
            {alerts.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs md:text-sm italic">
                Systems normal. No active alerts.
              </div>
            )}
            {alerts.map(alert => (
              <motion.div
                key={alert.id + (alert.resolved ? 'r' : 'u')}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border text-xs md:text-sm flex flex-col gap-2 ${
                  alert.resolved ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/50'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className={`flex items-center gap-1 ${alert.resolved ? 'text-success' : 'text-destructive'}`}>
                    {alert.resolved ? <CheckCircle2 size={14}/> : <AlertTriangle size={14} className="animate-pulse"/>}
                    {alert.resolved ? 'RESOLVED' : 'FIRING'}
                  </span>
                  <span className="text-[10px] text-muted-foreground opacity-70">
                    {new Date(alert.id).toLocaleTimeString()}
                  </span>
                </div>
                <div>{alert.msg}</div>
                
                {!alert.resolved && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-destructive/20">
                    <div className="bg-background rounded p-1.5 flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                      <Smartphone size={10} /> PagerDuty
                    </div>
                    <div className="bg-background rounded p-1.5 flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
                      <Mail size={10} /> Email
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const AlertingDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Alerting</h2>
            <p className="text-muted-foreground">
              Monitoring systems track metrics over time. When a metric breaches a predefined threshold (e.g., CPU &gt; 80%), an alert is triggered and routed to on-call engineers via SMS, Email, or PagerDuty.
            </p>
          </div>
        </div>
        <AlertingInteractive />
      </div>
    </section>
  );
};

export default AlertingDemo;
