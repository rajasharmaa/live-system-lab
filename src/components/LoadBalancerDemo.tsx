import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Server, ArrowRight, Play, Pause, Settings2 } from "lucide-react";
import { LoadBot } from "./ui/SVGMascots";

interface ServerNode {
  id: number;
  name: string;
  requests: number;
  health: number;
  weight: number;
}

type Algorithm = "round-robin" | "least-connections" | "weighted" | "random";

export const LoadBalancerInteractive = () => {
  const [servers, setServers] = useState<ServerNode[]>([
    { id: 1, name: "Server 1", requests: 0, health: 100, weight: 1 },
    { id: 2, name: "Server 2", requests: 0, health: 100, weight: 2 },
    { id: 3, name: "Server 3", requests: 0, health: 100, weight: 1 },
  ]);
  const [algorithm, setAlgorithm] = useState<Algorithm>("round-robin");
  const [currentServer, setCurrentServer] = useState<number | null>(null);
  const [roundRobinIndex, setRoundRobinIndex] = useState(0);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [totalRequests, setTotalRequests] = useState(0);
  const [animatingRequest, setAnimatingRequest] = useState(false);

  useEffect(() => {
    if (!isAutoMode) return;
    const interval = setInterval(() => {
      sendRequest();
    }, 800);
    return () => clearInterval(interval);
  }, [isAutoMode, algorithm, roundRobinIndex, servers]);

  const getNextServer = (): number => {
    const healthyServers = servers.filter(s => s.health > 0);
    if (healthyServers.length === 0) return servers[0].id;

    switch (algorithm) {
      case "round-robin":
        const nextIndex = roundRobinIndex % healthyServers.length;
        setRoundRobinIndex(prev => prev + 1);
        return healthyServers[nextIndex].id;
      
      case "least-connections":
        return healthyServers.reduce((min, server) => 
          server.requests < min.requests ? server : min
        ).id;
      
      case "weighted":
        const totalWeight = healthyServers.reduce((sum, s) => sum + s.weight, 0);
        let random = Math.random() * totalWeight;
        for (const server of healthyServers) {
          random -= server.weight;
          if (random <= 0) return server.id;
        }
        return healthyServers[0].id;
      
      case "random":
        return healthyServers[Math.floor(Math.random() * healthyServers.length)].id;
      
      default:
        return servers[0].id;
    }
  };

  const sendRequest = () => {
    setAnimatingRequest(true);
    const targetId = getNextServer();
    setCurrentServer(targetId);
    
    setTimeout(() => {
      setServers(prev => prev.map(s => 
        s.id === targetId ? { ...s, requests: s.requests + 1 } : s
      ));
      setTotalRequests(prev => prev + 1);
      setAnimatingRequest(false);
    }, 400);
  };

  const resetDemo = () => {
    setServers(prev => prev.map(s => ({ ...s, requests: 0 })));
    setTotalRequests(0);
    setRoundRobinIndex(0);
    setCurrentServer(null);
  };

  const toggleServerHealth = (id: number) => {
    setServers(prev => prev.map(s => 
      s.id === id ? { ...s, health: s.health > 0 ? 0 : 100 } : s
    ));
  };

  const updateWeight = (id: number, weight: number) => {
    setServers(prev => prev.map(s => 
      s.id === id ? { ...s, weight } : s
    ));
  };

  const algorithms: { value: Algorithm; label: string; description: string }[] = [
    { value: "round-robin", label: "Round Robin", description: "Distributes requests evenly in sequence" },
    { value: "least-connections", label: "Least Connections", description: "Routes to server with fewest active requests" },
    { value: "weighted", label: "Weighted", description: "Distributes based on server capacity weights" },
    { value: "random", label: "Random", description: "Randomly selects from healthy servers" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
      {/* Algorithm Selector */}
      <div className="grid grid-cols-2 gap-2">
        {algorithms.map((alg) => (
          <motion.button
            key={alg.value}
            onClick={() => setAlgorithm(alg.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`p-2 rounded-lg border transition-all text-left ${
              algorithm === alg.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/50 bg-card/50 text-muted-foreground hover:border-primary/50"
            }`}
          >
            <div className="font-semibold text-[10px] md:text-sm mb-0.5">{alg.label}</div>
            <div className="text-[8px] md:text-xs opacity-70 truncate">{alg.description}</div>
          </motion.button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Load Balancer Visual */}
        <Card className="glass-card p-4 md:col-span-2">
          <div className="flex items-center justify-between gap-4 h-40">
            {/* Client */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mb-1">
                <span className="text-xl">👤</span>
              </div>
              <span className="text-[9px] md:text-xs text-muted-foreground">Clients</span>
              <span className="text-sm font-mono font-bold text-foreground mt-0.5">
                {totalRequests}
              </span>
            </div>

            {/* Arrow with animation */}
            <div className="flex-1 relative">
              <div className="h-0.5 bg-border w-full" />
              <AnimatePresence>
                {animatingRequest && (
                  <motion.div
                    initial={{ left: 0 }}
                    animate={{ left: "100%" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute top-1/2 -translate-y-1/2"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Load Balancer */}
            <div className="flex flex-col items-center">
              <motion.div 
                animate={{ rotate: isAutoMode ? 360 : 0 }}
                transition={{ duration: 2, repeat: isAutoMode ? Infinity : 0, ease: "linear" }}
                className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-primary flex items-center justify-center mb-1"
              >
                <Scale className="w-6 h-6 text-primary" />
              </motion.div>
              <span className="text-[9px] md:text-xs text-muted-foreground text-center">Load Balancer</span>
              <Badge className="mt-1 text-[8px] truncate max-w-[80px]">{algorithms.find(a => a.value === algorithm)?.label}</Badge>
            </div>

            {/* Arrows to servers */}
            <div className="flex-1 flex flex-col gap-3 justify-center h-full py-4">
              {servers.map((server) => (
                <div key={server.id} className="relative h-0.5 bg-border flex-1">
                  <AnimatePresence>
                    {animatingRequest && currentServer === server.id && (
                      <motion.div
                        initial={{ left: 0 }}
                        animate={{ left: "100%" }}
                        transition={{ duration: 0.4 }}
                        className="absolute top-1/2 -translate-y-1/2"
                      >
                        <div className="w-2 h-2 rounded-full bg-success" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Servers */}
            <div className="flex flex-col gap-2 justify-center h-full">
              {servers.map((server) => (
                <motion.div
                  key={server.id}
                  animate={{
                    scale: currentServer === server.id ? 1.05 : 1,
                    borderColor: currentServer === server.id ? "hsl(var(--success))" : "hsl(var(--border))"
                  }}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors bg-card ${
                    server.health === 0 ? "opacity-40" : ""
                  }`}
                >
                  <Server className={`w-4 h-4 ${server.health > 0 ? "text-success" : "text-destructive"}`} />
                  <div>
                    <div className="text-[10px] font-medium leading-none">{server.name}</div>
                    <div className="text-[9px] text-muted-foreground font-mono">{server.requests} req</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={sendRequest} disabled={isAutoMode} className="flex-1 text-xs h-8">
              <ArrowRight className="w-3 h-3 mr-1" /> Send
            </Button>
            <Button onClick={() => setIsAutoMode(!isAutoMode)} variant={isAutoMode ? "destructive" : "secondary"} className="flex-1 text-xs h-8">
              {isAutoMode ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
              {isAutoMode ? "Stop" : "Auto"}
            </Button>
            <Button onClick={resetDemo} variant="outline" className="text-xs h-8">Reset</Button>
          </div>
        </Card>

        {/* Server Configuration */}
        <Card className="glass-card p-4 overflow-y-auto max-h-[300px] custom-scrollbar">
          <div className="space-y-3">
            {servers.map((server) => (
              <div key={server.id} className="glass-card p-2 md:p-3 rounded-lg space-y-2 text-[10px] md:text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{server.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleServerHealth(server.id)}
                    className={`h-6 text-[10px] px-2 ${server.health > 0 ? "text-success" : "text-destructive"}`}
                  >
                    {server.health > 0 ? "Healthy" : "Down"}
                  </Button>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                    <span>Weight: {server.weight}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={server.weight}
                    onChange={(e) => updateWeight(server.id, Number(e.target.value))}
                    className="w-full accent-primary h-1"
                    disabled={algorithm !== "weighted"}
                  />
                </div>

                {/* Request distribution bar */}
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: totalRequests > 0 ? `${(server.requests / totalRequests) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const LoadBalancerDemo = () => {
  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-background to-card/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <LoadBot />
          <div>
            <h2 className="text-3xl font-bold mb-2">Load Balancing Algorithms</h2>
            <p className="text-muted-foreground">
              A load balancer distributes incoming network traffic across a group of backend servers.
              <strong> Why?</strong> Ensures no single server bears too much demand, improving responsiveness and availability.
              <strong> Real-world:</strong> Nginx, AWS ELB, HAProxy.
            </p>
          </div>
        </div>
        <LoadBalancerInteractive />
      </div>
    </section>
  );
};

export default LoadBalancerDemo;
