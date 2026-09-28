import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, Server, Globe, File, ArrowLeft } from "lucide-react";
import { ArchitectBot } from "./ui/SVGMascots";

const ReverseProxyDemo = () => {
  const [requests, setRequests] = useState<{ id: number; status: 'pending' | 'blocked' | 'served_cache' | 'forwarded' }[]>([]);
  const [reqId, setReqId] = useState(0);

  const simulateRequest = () => {
    const id = reqId;
    setReqId(id + 1);
    
    // Simulate reverse proxy rules
    const rand = Math.random();
    let status: 'pending' | 'blocked' | 'served_cache' | 'forwarded' = 'pending';
    
    setRequests(prev => [...prev.slice(-5), { id, status }]);
    
    setTimeout(() => {
      if (rand < 0.2) status = 'blocked'; // WAF / Security
      else if (rand < 0.5) status = 'served_cache'; // Static content caching
      else status = 'forwarded'; // Passed to backend
      
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    }, 1000);
  };

  useEffect(() => {
    const interval = setInterval(simulateRequest, 1500);
    return () => clearInterval(interval);
  }, [reqId]);

  return (
    <section className="py-24 px-6 bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <ArchitectBot />
          <div>
            <h2 className="text-3xl font-bold mb-2">Reverse Proxy</h2>
            <p className="text-muted-foreground">
              A server that sits in front of web servers and forwards client requests to those servers.
              Key roles: <strong>Security/WAF</strong>, <strong>SSL Termination</strong>, <strong>Caching static content</strong>, and <strong>Compression</strong>.
            </p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-xl relative overflow-hidden">
          <div className="grid grid-cols-3 gap-4 items-center justify-between min-h-[300px]">
            {/* Client Side */}
            <div className="flex flex-col items-center">
              <Globe size={48} className="text-muted-foreground mb-4" />
              <span className="font-mono text-sm">Public Internet</span>
            </div>
            
            {/* Reverse Proxy */}
            <div className="flex flex-col items-center z-10">
              <div className="bg-card border-2 border-primary rounded-xl p-6 shadow-glow relative">
                <Shield size={48} className="text-primary mb-2 mx-auto" />
                <h3 className="font-bold text-center">Nginx / HAProxy</h3>
                <div className="text-xs text-muted-foreground mt-2 flex flex-col gap-1 text-center font-mono">
                  <span>SSL Termination</span>
                  <span>Static Cache</span>
                  <span>WAF Rules</span>
                </div>
              </div>
            </div>
            
            {/* Backend Servers */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-muted/30 p-4 rounded-lg flex items-center gap-3 border border-border">
                <Server className="text-success" />
                <span className="font-mono text-sm">App Server A</span>
              </div>
              <div className="bg-muted/30 p-4 rounded-lg flex items-center gap-3 border border-border">
                <Server className="text-success" />
                <span className="font-mono text-sm">App Server B</span>
              </div>
            </div>
          </div>
          
          {/* Animated Requests */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatePresence>
              {requests.map(req => (
                <motion.div
                  key={req.id}
                  initial={{ x: '10%', y: '50%', opacity: 0 }}
                  animate={
                    req.status === 'pending' ? { x: '45%', opacity: 1 } :
                    req.status === 'blocked' ? { x: '45%', opacity: 0, scale: 2 } :
                    req.status === 'served_cache' ? { x: '10%', opacity: 0 } :
                    { x: '80%', opacity: 0 }
                  }
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className={`absolute top-1/2 -mt-4 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold
                    ${req.status === 'pending' ? 'bg-primary/20 text-primary border border-primary/50' : 
                      req.status === 'blocked' ? 'bg-destructive/20 text-destructive border border-destructive/50' : 
                      req.status === 'served_cache' ? 'bg-warning/20 text-warning border border-warning/50' : 
                      'bg-success/20 text-success border border-success/50'}`}
                >
                  {req.status === 'pending' ? <><ArrowRight size={14}/> Request</> :
                   req.status === 'blocked' ? 'BLOCKED (WAF)' :
                   req.status === 'served_cache' ? <><ArrowLeft size={14}/> CACHE HIT</> :
                   'FORWARDED'}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReverseProxyDemo;
