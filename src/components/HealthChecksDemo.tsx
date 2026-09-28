import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, Activity, ArrowRight, ShieldCheck, HeartPulse, HeartCrack } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

export const HealthChecksInteractive = () => {
  const [nodes, setNodes] = useState([
    { id: 1, healthy: true, status: 'checking' },
    { id: 2, healthy: true, status: 'checking' },
    { id: 3, healthy: true, status: 'checking' }
  ]);
  const [pingPos, setPingPos] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPingPos(prev => {
        const next = prev >= 100 ? 0 : prev + 5;
        
        if (next === 50) {
          setNodes(ns => ns.map(n => ({ ...n, status: n.healthy ? 'ok' : 'fail' })));
        } else if (next === 0) {
          setNodes(ns => ns.map(n => ({ ...n, status: 'checking' })));
        }
        
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const toggleHealth = (id: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, healthy: !n.healthy } : n));
  };

  return (
    <div className="glass-card p-4 md:p-8 rounded-xl w-full flex flex-col items-center shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
      <div className="relative w-full h-60 md:h-80 flex items-center justify-between border-b border-border/50 pb-4 md:pb-8">
        <div className="z-10 flex flex-col items-center gap-2 md:gap-4 bg-card p-3 md:p-6 rounded-xl border border-border shadow-lg w-28 md:w-48">
          <Activity size={32} className="text-primary md:w-12 md:h-12" />
          <div className="text-center">
            <h3 className="font-bold text-xs md:text-base">Load Balancer</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground">Traffic Router</p>
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col justify-around pointer-events-none px-28 md:px-48 py-4 md:py-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="relative w-full h-8 flex items-center">
              <div className={`absolute w-full h-[1px] ${nodes[i].status === 'fail' ? 'bg-destructive/30 border-dashed' : 'bg-border'}`}></div>
              
              <motion.div
                className="absolute"
                style={{ left: `${pingPos}%` }}
              >
                {pingPos < 50 ? (
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"></div>
                ) : (
                  nodes[i].status === 'fail' ? (
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-destructive shadow-[0_0_8px_var(--destructive)]"></div>
                  ) : (
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-success shadow-[0_0_8px_var(--success)]"></div>
                  )
                )}
              </motion.div>
            </div>
          ))}
        </div>

        <div className="z-10 flex flex-col gap-3 md:gap-4">
          {nodes.map(node => (
            <div 
              key={node.id} 
              className={`flex items-center gap-2 md:gap-4 bg-card p-2 md:p-3 rounded-xl border-2 transition-colors cursor-pointer hover:scale-105 ${
                node.healthy ? 'border-success/50 hover:border-success' : 'border-destructive bg-destructive/10'
              }`}
              onClick={() => toggleHealth(node.id)}
            >
              <Server size={24} className={`md:w-8 md:h-8 ${node.healthy ? 'text-success' : 'text-destructive'}`} />
              <div className="flex flex-col">
                <span className="font-bold text-[10px] md:text-sm">Node {node.id}</span>
                <span className={`text-[8px] md:text-xs ${node.healthy ? 'text-success' : 'text-destructive'}`}>
                  {node.healthy ? '200 OK' : '503 Error'}
                </span>
              </div>
              <div className="ml-2 md:ml-4">
                {node.healthy ? <HeartPulse size={16} className="text-success animate-pulse md:w-5 md:h-5" /> : <HeartCrack size={16} className="text-destructive md:w-5 md:h-5" />}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 md:mt-8 text-center text-xs md:text-sm text-muted-foreground">
        <p>Click on a backend node to toggle its health status.</p>
        <p className="mt-1 md:mt-2 text-[10px] md:text-xs">The load balancer constantly pings nodes. If a node fails, it receives no traffic.</p>
      </div>
    </div>
  );
};

const HealthChecksDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Health Checks</h2>
            <p className="text-muted-foreground">
              A mechanism for a load balancer or service mesh to periodically test if backend instances are alive and ready to serve traffic. Unhealthy instances are temporarily removed from the routing pool.
            </p>
          </div>
        </div>
        <HealthChecksInteractive />
      </div>
    </section>
  );
};

export default HealthChecksDemo;
