import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Server, AlertTriangle, Play, Pause, RefreshCw } from "lucide-react";
import { ShieldGuard } from "./ui/SVGMascots";

const HeartbeatDemo = () => {
  const [nodes, setNodes] = useState<{ id: number, status: 'alive' | 'dead', lastBeat: number }[]>([
    { id: 1, status: 'alive', lastBeat: Date.now() },
    { id: 2, status: 'alive', lastBeat: Date.now() },
    { id: 3, status: 'alive', lastBeat: Date.now() },
  ]);
  const [isRunning, setIsRunning] = useState(true);
  const [logs, setLogs] = useState<{id: number, msg: string, type: 'info' | 'warn' | 'error'}[]>([]);
  
  const TIMEOUT = 4000;

  useEffect(() => {
    if (!isRunning) return;
    
    // Simulate heartbeats from alive nodes
    const beatInterval = setInterval(() => {
      setNodes(prev => prev.map(n => {
        // 5% chance a node stops beating (simulated failure)
        if (n.status === 'alive' && Math.random() < 0.05) {
          return { ...n, status: 'dead' };
        }
        if (n.status === 'alive') {
          return { ...n, lastBeat: Date.now() };
        }
        return n;
      }));
    }, 1000);

    // Watchdog checking for dead nodes
    const watchInterval = setInterval(() => {
      const now = Date.now();
      setNodes(prev => {
        let changed = false;
        const newNodes = prev.map(n => {
          if (n.status === 'alive' && (now - n.lastBeat > TIMEOUT)) {
            changed = true;
            setLogs(l => [{id: now, msg: `Node ${n.id} missed heartbeats. Marking DEAD.`, type: 'error'}, ...l].slice(0, 5));
            return { ...n, status: 'dead' };
          }
          return n;
        });
        return changed ? newNodes : prev;
      });
    }, 500);

    return () => {
      clearInterval(beatInterval);
      clearInterval(watchInterval);
    };
  }, [isRunning]);

  const reviveNode = (id: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status: 'alive', lastBeat: Date.now() } : n));
    setLogs(l => [{id: Date.now(), msg: `Node ${id} recovered & reconnected.`, type: 'info'}, ...l].slice(0, 5));
  };

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <ShieldGuard />
          <div>
            <h2 className="text-3xl font-bold mb-2">Heartbeat & Failure Detection</h2>
            <p className="text-muted-foreground">
              Nodes periodically send "I am alive" signals (heartbeats) to a central coordinator. If heartbeats stop arriving within a timeout window, the node is marked as dead and traffic is routed away.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 glass-card p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Cluster Status</h3>
              <button 
                onClick={() => setIsRunning(!isRunning)}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${isRunning ? 'bg-destructive/20 text-destructive' : 'bg-primary text-primary-foreground'}`}
              >
                {isRunning ? <><Pause size={14}/> Stop Simulator</> : <><Play size={14}/> Start Simulator</>}
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {nodes.map(node => (
                <div key={node.id} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${node.status === 'alive' ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive'}`}>
                  <div className="relative">
                    <Server size={48} className={node.status === 'alive' ? "text-success" : "text-destructive"} />
                    {node.status === 'alive' && isRunning && (
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} 
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute -top-2 -right-2 text-success"
                      >
                        <Activity size={24} />
                      </motion.div>
                    )}
                    {node.status === 'dead' && (
                      <AlertTriangle size={24} className="absolute -top-2 -right-2 text-destructive" />
                    )}
                  </div>
                  
                  <span className="font-mono font-bold mt-4">Node {node.id}</span>
                  <span className={`text-xs mt-1 ${node.status === 'alive' ? 'text-success' : 'text-destructive font-bold'}`}>
                    {node.status === 'alive' ? 'HEALTHY' : 'DEAD'}
                  </span>
                  
                  {node.status === 'dead' && (
                    <button 
                      onClick={() => reviveNode(node.id)}
                      className="mt-3 text-xs bg-card border border-border px-3 py-1 rounded flex items-center gap-1 hover:bg-muted"
                    >
                      <RefreshCw size={12} /> Restart
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
              <Activity size={16} /> Timeout Threshold: {TIMEOUT}ms. A node is marked dead if no heartbeat is received.
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4">Watchdog Logs</h3>
            <div className="flex-1 overflow-hidden relative">
              <div className="space-y-2 absolute inset-0">
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div 
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-2 rounded text-xs font-mono border-l-2 ${
                        log.type === 'error' ? 'bg-destructive/10 border-destructive text-destructive' :
                        log.type === 'warn' ? 'bg-warning/10 border-warning text-warning' :
                        'bg-success/10 border-success text-success'
                      }`}
                    >
                      {log.msg}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {logs.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Monitoring cluster health...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeartbeatDemo;
