import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Zap, Database, ArrowRight } from "lucide-react";
import { ArchitectBot } from "./ui/SVGMascots";

const HorizontalScalingDemo = () => {
  const [verticalLevel, setVerticalLevel] = useState(1);
  const [horizontalCount, setHorizontalCount] = useState(1);
  const [requests, setRequests] = useState(10);
  
  const verticalCapacity = verticalLevel * 50;
  const horizontalCapacity = horizontalCount * 50;
  
  const verticalOverloaded = requests > verticalCapacity;
  const horizontalOverloaded = requests > horizontalCapacity;

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <ArchitectBot />
          <div>
            <h2 className="text-3xl font-bold mb-2">Horizontal vs Vertical Scaling</h2>
            <p className="text-muted-foreground">
              <strong>Vertical (Scale Up):</strong> Buy a bigger machine (more CPU/RAM). Has a hard limit and requires downtime.<br/>
              <strong>Horizontal (Scale Out):</strong> Add more standard machines. Infinite scale, resilient to failures, but requires load balancing.
            </p>
          </div>
        </div>

        <div className="mb-8 p-6 glass-card rounded-xl">
          <label className="text-sm text-muted-foreground block mb-2">Incoming Traffic (Requests/sec): {requests}</label>
          <input 
            type="range" min="10" max="300" step="10" value={requests} 
            onChange={(e) => setRequests(Number(e.target.value))}
            className="w-full accent-primary" 
          />
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Vertical Scaling */}
          <div className="glass-card p-6 rounded-xl flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4">Vertical Scaling</h3>
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setVerticalLevel(Math.min(5, verticalLevel + 1))}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold"
                disabled={verticalLevel >= 5}
              >
                Upgrade Server
              </button>
              <button 
                onClick={() => setVerticalLevel(Math.max(1, verticalLevel - 1))}
                className="px-4 py-2 border border-border rounded-md text-sm font-semibold"
              >
                Downgrade
              </button>
            </div>
            
            <div className="relative h-64 w-full flex items-end justify-center pb-4 border-b border-border">
              <motion.div 
                className={`flex flex-col items-center justify-center rounded-lg border-2 ${verticalOverloaded ? 'border-destructive bg-destructive/20 animate-pulse' : 'border-primary bg-primary/10'}`}
                animate={{ width: 60 + verticalLevel * 20, height: 60 + verticalLevel * 30 }}
                transition={{ type: "spring" }}
              >
                <Server className={verticalOverloaded ? "text-destructive" : "text-primary"} size={24 + verticalLevel * 4} />
                <span className="font-mono text-xs mt-2">vCPU: {verticalLevel * 2}</span>
                <span className="font-mono text-xs">RAM: {verticalLevel * 8}GB</span>
              </motion.div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm font-mono">Capacity: {verticalCapacity} req/s</p>
              <p className={`text-sm font-bold ${verticalOverloaded ? 'text-destructive' : 'text-success'}`}>
                {verticalOverloaded ? 'SERVER CRASHED (OOM)' : 'HEALTHY'}
              </p>
              {verticalLevel === 5 && <p className="text-xs text-warning mt-2">Hardware limit reached. Cannot scale further.</p>}
            </div>
          </div>

          {/* Horizontal Scaling */}
          <div className="glass-card p-6 rounded-xl flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4">Horizontal Scaling</h3>
            <div className="flex gap-4 mb-6">
              <button 
                onClick={() => setHorizontalCount(Math.min(8, horizontalCount + 1))}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold"
              >
                Add Server
              </button>
              <button 
                onClick={() => setHorizontalCount(Math.max(1, horizontalCount - 1))}
                className="px-4 py-2 border border-border rounded-md text-sm font-semibold"
              >
                Remove Server
              </button>
            </div>
            
            <div className="relative h-64 w-full flex flex-wrap content-end justify-center gap-4 pb-4 border-b border-border">
              <AnimatePresence>
                {Array.from({ length: horizontalCount }).map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={`flex flex-col items-center justify-center w-20 h-24 rounded-lg border-2 ${horizontalOverloaded ? 'border-destructive bg-destructive/20 animate-pulse' : 'border-primary bg-primary/10'}`}
                  >
                    <Server className={horizontalOverloaded ? "text-destructive" : "text-primary"} size={24} />
                    <span className="font-mono text-[10px] mt-1">Node {i+1}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm font-mono">Capacity: {horizontalCapacity} req/s</p>
              <p className={`text-sm font-bold ${horizontalOverloaded ? 'text-destructive' : 'text-success'}`}>
                {horizontalOverloaded ? 'NODES OVERLOADED' : 'HEALTHY'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Requires Load Balancer to distribute traffic.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HorizontalScalingDemo;
