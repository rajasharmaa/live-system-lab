import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Activity, Users, Plus, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

export const AutoScalingInteractive = () => {
  const [traffic, setTraffic] = useState(10); // requests per second
  const [instances, setInstances] = useState([{ id: 1 }]);
  const [scalingMsg, setScalingMsg] = useState<{type: 'up' | 'down', msg: string} | null>(null);

  const maxCapacityPerInstance = 20;
  const currentCapacity = instances.length * maxCapacityPerInstance;
  const utilization = Math.round((traffic / currentCapacity) * 100);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // Auto-scale logic
    if (utilization > 80 && instances.length < 5) {
      setScalingMsg({ type: 'up', msg: 'Scaling UP...' });
      timeout = setTimeout(() => {
        setInstances(prev => [...prev, { id: Date.now() }]);
        setScalingMsg(null);
      }, 1500);
    } else if (utilization < 30 && instances.length > 1) {
      setScalingMsg({ type: 'down', msg: 'Scaling DOWN...' });
      timeout = setTimeout(() => {
        setInstances(prev => prev.slice(0, prev.length - 1));
        setScalingMsg(null);
      }, 1500);
    } else {
      setScalingMsg(null);
    }

    return () => clearTimeout(timeout);
  }, [traffic, utilization, instances.length]);

  return (
    <div className="glass-card p-4 md:p-8 rounded-xl w-full max-w-4xl mx-auto flex flex-col gap-4 md:gap-8 shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
      {/* Traffic Controller */}
      <div className="bg-card border border-border p-4 md:p-6 rounded-xl flex flex-col items-center gap-2 md:gap-4 shadow-sm">
        <h3 className="font-bold flex items-center gap-2 text-sm md:text-base"><Users className="text-primary w-4 h-4 md:w-5 md:h-5"/> Traffic Generator (RPS)</h3>
        <div className="flex items-center gap-4 md:gap-6">
          <button 
            onClick={() => setTraffic(Math.max(5, traffic - 15))}
            className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shadow-sm active:scale-95"
          >
            <Minus className="w-4 h-4 md:w-6 md:h-6" />
          </button>
          
          <div className="text-2xl md:text-4xl font-mono font-bold w-16 md:w-24 text-center text-primary">
            {traffic}
          </div>
          
          <button 
            onClick={() => setTraffic(Math.min(95, traffic + 15))}
            className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 md:w-6 md:h-6" />
          </button>
        </div>
        <div className="text-[9px] md:text-xs text-muted-foreground text-center">Adjust incoming traffic to trigger auto-scaling</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 md:gap-8">
        {/* Cloud Environment */}
        <div className="relative h-48 md:h-64 border border-border bg-card rounded-xl p-4 md:p-6 overflow-hidden shadow-inner">
          <div className="absolute top-2 left-2 md:left-4 text-[9px] md:text-xs font-bold text-muted-foreground tracking-widest uppercase">Server Pool</div>
          
          <AnimatePresence>
            {scalingMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`absolute top-2 right-2 md:right-4 text-[9px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full flex items-center gap-1 shadow-lg z-10 ${
                  scalingMsg.type === 'up' ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'
                }`}
              >
                {scalingMsg.type === 'up' ? <ArrowUp size={12} className="md:w-3.5 md:h-3.5"/> : <ArrowDown size={12} className="md:w-3.5 md:h-3.5"/>}
                {scalingMsg.msg}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-full flex flex-wrap gap-2 md:gap-4 items-center justify-center content-center pt-6">
            <AnimatePresence>
              {instances.map((instance, i) => (
                <motion.div
                  key={instance.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="w-12 h-16 md:w-16 md:h-24 bg-secondary/10 border border-secondary md:border-2 rounded-lg flex flex-col items-center justify-center gap-1 md:gap-2 shadow-sm"
                >
                  <Server className="text-secondary w-5 h-5 md:w-6 md:h-6" />
                  <div className="text-[8px] md:text-[10px] font-mono text-muted-foreground">Node {i+1}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Metrics */}
        <div className="bg-card border border-border p-4 md:p-6 rounded-xl flex flex-col justify-center gap-4 md:gap-6 shadow-sm">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] md:text-sm font-bold flex items-center gap-1 md:gap-2"><Activity size={14} className="text-primary md:w-4 md:h-4"/> Cluster Utilization</span>
              <span className="text-[10px] md:text-sm font-mono font-bold">{utilization}%</span>
            </div>
            <div className="h-3 md:h-4 bg-muted rounded-full overflow-hidden relative border border-border/50">
              {/* Threshold markers */}
              <div className="absolute left-[30%] top-0 h-full w-[2px] bg-border z-10"></div>
              <div className="absolute left-[80%] top-0 h-full w-[2px] bg-border z-10"></div>
              
              <motion.div 
                className={`h-full transition-colors ${
                  utilization > 80 ? 'bg-destructive' : utilization < 30 ? 'bg-warning' : 'bg-success'
                }`}
                animate={{ width: `${Math.min(100, utilization)}%` }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between mt-1 text-[8px] md:text-[10px] text-muted-foreground">
              <span>Scale Down (&lt;30%)</span>
              <span>Scale Up (&gt;80%)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="bg-muted/50 border border-border/50 p-2 md:p-3 rounded-lg text-center">
              <div className="text-lg md:text-2xl font-bold font-mono text-foreground">{instances.length}</div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider">Active Instances</div>
            </div>
            <div className="bg-muted/50 border border-border/50 p-2 md:p-3 rounded-lg text-center">
              <div className="text-lg md:text-2xl font-bold font-mono text-foreground">{currentCapacity}</div>
              <div className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider">Total Capacity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AutoScalingDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Auto Scaling</h2>
            <p className="text-muted-foreground">
              Automatically adjusting the number of compute instances in response to changing load. This ensures performance during spikes (scale out) and saves costs during quiet periods (scale in).
            </p>
          </div>
        </div>
        <AutoScalingInteractive />
      </div>
    </section>
  );
};

export default AutoScalingDemo;
