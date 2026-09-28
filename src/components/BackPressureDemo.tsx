import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Zap, ShieldAlert, ArrowRight, ArrowDown } from "lucide-react";
import { MailCarrier } from "./ui/SVGMascots";

const BackPressureDemo = () => {
  const [incomingRate, setIncomingRate] = useState(10); // requests per tick
  const [processingRate, setProcessingRate] = useState(5); // requests processed per tick
  const [queue, setQueue] = useState<number[]>([]);
  const [dropped, setDropped] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [backpressureEnabled, setBackpressureEnabled] = useState(true);
  
  const MAX_QUEUE = 50;

  useEffect(() => {
    const interval = setInterval(() => {
      setQueue(prevQueue => {
        let newQueue = [...prevQueue];
        
        // Process items
        const toProcess = Math.min(newQueue.length, processingRate);
        newQueue = newQueue.slice(toProcess);
        setProcessed(p => p + toProcess);
        
        // Add new items
        let newIncoming = incomingRate;
        
        if (backpressureEnabled) {
          // Dynamic backpressure - slow down incoming if queue is > 80% full
          if (newQueue.length > MAX_QUEUE * 0.8) {
            newIncoming = Math.floor(incomingRate * 0.2); // Reject/slow down 80%
          }
        }
        
        for (let i = 0; i < newIncoming; i++) {
          if (newQueue.length < MAX_QUEUE) {
            newQueue.push(Date.now() + i);
          } else {
            setDropped(d => d + 1);
          }
        }
        
        return newQueue;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [incomingRate, processingRate, backpressureEnabled]);

  return (
    <section className="py-24 px-6 bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <MailCarrier />
          <div>
            <h2 className="text-3xl font-bold mb-2">Back Pressure</h2>
            <p className="text-muted-foreground">
              What happens when consumers are slower than producers? Without backpressure, buffers overflow and servers crash (OOM). With backpressure, the system pushes back on the producer to slow down.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="glass-card p-6 rounded-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">System Controls</h3>
              <button 
                onClick={() => setBackpressureEnabled(!backpressureEnabled)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${backpressureEnabled ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}
              >
                {backpressureEnabled ? 'Backpressure: ON (429 Too Many Requests)' : 'Backpressure: OFF (Accept All)'}
              </button>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground block mb-2 flex justify-between">
                <span>Producer Rate (Incoming)</span>
                <span className="font-mono text-primary">{incomingRate} req/s</span>
              </label>
              <input 
                type="range" min="1" max="25" value={incomingRate} 
                onChange={(e) => setIncomingRate(Number(e.target.value))}
                className="w-full accent-primary" 
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground block mb-2 flex justify-between">
                <span>Consumer Rate (Processing)</span>
                <span className="font-mono text-accent">{processingRate} req/s</span>
              </label>
              <input 
                type="range" min="1" max="25" value={processingRate} 
                onChange={(e) => setProcessingRate(Number(e.target.value))}
                className="w-full accent-accent" 
              />
            </div>
            
            <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div className="bg-success/10 border border-success/30 p-3 rounded-lg text-center">
                <span className="block text-xs text-muted-foreground mb-1">Processed</span>
                <span className="text-xl font-mono text-success font-bold">{processed}</span>
              </div>
              <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg text-center">
                <span className="block text-xs text-muted-foreground mb-1">Dropped (OOM)</span>
                <span className="text-xl font-mono text-destructive font-bold">{dropped}</span>
              </div>
            </div>
            <div className="text-center">
                <button onClick={() => { setDropped(0); setProcessed(0); setQueue([]); }} className="text-xs text-muted-foreground underline mt-2">Reset Stats</button>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-full flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/20 border-2 border-primary rounded-xl flex items-center justify-center mb-2">
                  <Zap className="text-primary" />
                </div>
                <span className="font-mono text-xs">Producer</span>
              </div>
              
              <div className="flex-1">
                <div className="relative h-12 flex items-center justify-center mb-2">
                  {backpressureEnabled && queue.length > MAX_QUEUE * 0.8 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="absolute text-warning flex items-center gap-1 font-bold text-xs top-[-20px]">
                      <ArrowLeft size={14} /> SLOW DOWN! (429)
                    </motion.div>
                  )}
                  <ArrowRight className="text-muted-foreground w-full" />
                </div>
                
                {/* Queue Visualization */}
                <div className="w-full h-8 bg-muted rounded-full overflow-hidden border border-border relative">
                  <motion.div 
                    className={`absolute top-0 bottom-0 left-0 ${queue.length >= MAX_QUEUE ? 'bg-destructive' : queue.length > MAX_QUEUE * 0.8 ? 'bg-warning' : 'bg-primary'}`}
                    animate={{ width: `${(queue.length / MAX_QUEUE) * 100}%` }}
                    transition={{ type: "spring", bounce: 0 }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center mix-blend-difference text-white text-xs font-mono font-bold">
                    Queue: {queue.length} / {MAX_QUEUE}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-accent/20 border-2 border-accent rounded-xl flex items-center justify-center mb-2">
                  <Server className="text-accent" />
                </div>
                <span className="font-mono text-xs">Consumer</span>
              </div>
            </div>
            
            {queue.length >= MAX_QUEUE && !backpressureEnabled && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 bg-destructive/20 border border-destructive text-destructive p-3 rounded-lg flex items-center gap-2 font-bold text-sm">
                <ShieldAlert /> CRITICAL: OUT OF MEMORY (OOM)
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// Also needed for the UI, so adding ArrowLeft import
import { ArrowLeft } from "lucide-react";

export default BackPressureDemo;
