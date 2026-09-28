import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Box, Server, Network, ArrowRight, Play, Square, RotateCcw, Plus, Minus, Zap } from "lucide-react";

interface Pod {
  id: string;
  name: string;
  status: "running" | "pending" | "terminating" | "failed";
  cpu: number;
  memory: number;
  restarts: number;
}

interface Service {
  name: string;
  type: "ClusterIP" | "LoadBalancer" | "NodePort";
  targetPods: string[];
  port: number;
}

const KubernetesDemo = () => {
  const [pods, setPods] = useState<Pod[]>([
    { id: "pod-1", name: "api-server-1", status: "running", cpu: 45, memory: 60, restarts: 0 },
    { id: "pod-2", name: "api-server-2", status: "running", cpu: 30, memory: 45, restarts: 0 },
  ]);
  const [services] = useState<Service[]>([
    { name: "api-service", type: "LoadBalancer", targetPods: ["api-server"], port: 8080 },
    { name: "db-service", type: "ClusterIP", targetPods: ["postgres"], port: 5432 },
  ]);
  const [desiredReplicas, setDesiredReplicas] = useState(2);
  const [isAutoScaling, setIsAutoScaling] = useState(false);
  const [traffic, setTraffic] = useState(50);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const scalePods = (direction: "up" | "down") => {
    if (direction === "up") {
      const newReplicas = desiredReplicas + 1;
      setDesiredReplicas(newReplicas);
      addLog(`Scaling up to ${newReplicas} replicas`);
      
      const newPod: Pod = {
        id: `pod-${Date.now()}`,
        name: `api-server-${newReplicas}`,
        status: "pending",
        cpu: 0,
        memory: 0,
        restarts: 0,
      };
      setPods(prev => [...prev, newPod]);
      
      setTimeout(() => {
        setPods(prev => prev.map(p => 
          p.id === newPod.id ? { ...p, status: "running", cpu: 20, memory: 30 } : p
        ));
        addLog(`Pod ${newPod.name} is now running`);
      }, 2000);
    } else if (desiredReplicas > 1) {
      const newReplicas = desiredReplicas - 1;
      setDesiredReplicas(newReplicas);
      addLog(`Scaling down to ${newReplicas} replicas`);
      
      const podToRemove = pods[pods.length - 1];
      setPods(prev => prev.map(p => 
        p.id === podToRemove.id ? { ...p, status: "terminating" } : p
      ));
      
      setTimeout(() => {
        setPods(prev => prev.filter(p => p.id !== podToRemove.id));
        addLog(`Pod ${podToRemove.name} terminated`);
      }, 1500);
    }
  };

  const simulatePodFailure = () => {
    if (pods.length > 0) {
      const randomPod = pods[Math.floor(Math.random() * pods.length)];
      addLog(`Pod ${randomPod.name} failed! Controller detecting...`);
      
      setPods(prev => prev.map(p => 
        p.id === randomPod.id ? { ...p, status: "failed" } : p
      ));
      
      setTimeout(() => {
        addLog(`ReplicaSet creating replacement pod`);
        const newPod: Pod = {
          id: `pod-${Date.now()}`,
          name: randomPod.name,
          status: "pending",
          cpu: 0,
          memory: 0,
          restarts: randomPod.restarts + 1,
        };
        setPods(prev => [...prev.filter(p => p.id !== randomPod.id), newPod]);
        
        setTimeout(() => {
          setPods(prev => prev.map(p => 
            p.id === newPod.id ? { ...p, status: "running", cpu: 25, memory: 35 } : p
          ));
          addLog(`Pod ${newPod.name} recovered (restarts: ${newPod.restarts})`);
        }, 2000);
      }, 1500);
    }
  };

  useEffect(() => {
    if (!isAutoScaling) return;
    
    const interval = setInterval(() => {
      const avgCpu = pods.filter(p => p.status === "running").reduce((sum, p) => sum + p.cpu, 0) / pods.length;
      
      if (avgCpu > 70 && pods.length < 5) {
        addLog(`HPA: CPU ${avgCpu.toFixed(0)}% > 70%, scaling up`);
        scalePods("up");
      } else if (avgCpu < 30 && pods.length > 2) {
        addLog(`HPA: CPU ${avgCpu.toFixed(0)}% < 30%, scaling down`);
        scalePods("down");
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isAutoScaling, pods]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPods(prev => prev.map(p => {
        if (p.status !== "running") return p;
        const baseCpu = (traffic / pods.filter(pod => pod.status === "running").length) * 1.5;
        return {
          ...p,
          cpu: Math.min(100, Math.max(10, baseCpu + Math.random() * 20 - 10)),
          memory: Math.min(100, p.memory + Math.random() * 4 - 2),
        };
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [traffic, pods.length]);

  const getStatusColor = (status: Pod["status"]) => {
    switch (status) {
      case "running": return "bg-green-500";
      case "pending": return "bg-yellow-500 animate-pulse";
      case "terminating": return "bg-orange-500 animate-pulse";
      case "failed": return "bg-red-500";
    }
  };

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Box className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Kubernetes Orchestration
                  <Badge variant="outline" className="ml-2">Container Management</Badge>
                </CardTitle>
                <CardDescription>
                  Pod scaling, self-healing, and service discovery in action
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => scalePods("down")}
                  disabled={desiredReplicas <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-sm font-mono w-24 text-center">
                  Replicas: {desiredReplicas}
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => scalePods("up")}
                  disabled={pods.length >= 5}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <Button
                size="sm"
                variant={isAutoScaling ? "default" : "outline"}
                onClick={() => {
                  setIsAutoScaling(!isAutoScaling);
                  addLog(isAutoScaling ? "HPA disabled" : "HPA enabled (target: 50% CPU)");
                }}
              >
                <Zap className="w-4 h-4 mr-1" />
                {isAutoScaling ? "HPA Active" : "Enable HPA"}
              </Button>
              
              <Button size="sm" variant="destructive" onClick={simulatePodFailure}>
                <Square className="w-4 h-4 mr-1" />
                Simulate Failure
              </Button>
              
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground">Traffic:</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={traffic}
                  onChange={(e) => setTraffic(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm font-mono w-12">{traffic}%</span>
              </div>
            </div>

            {/* Architecture Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Load Balancer */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Network className="w-4 h-4" />
                  Services & Discovery
                </h4>
                <div className="space-y-2">
                  {services.map((service) => (
                    <div key={service.name} className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{service.name}</span>
                        <Badge variant="outline" className="text-xs">{service.type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Port: {service.port} → Pods: {service.targetPods.join(", ")}*
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                  <strong>Service Discovery:</strong> Kubernetes DNS resolves service names to ClusterIP, 
                  automatically load-balancing across healthy pods.
                </div>
              </div>

              {/* Pods */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Box className="w-4 h-4" />
                  Pods ({pods.length}/{desiredReplicas} desired)
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pods.map((pod) => (
                    <div key={pod.id} className="p-3 bg-card border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(pod.status)}`} />
                          <span className="font-mono text-sm">{pod.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize">
                          {pod.status}
                        </Badge>
                      </div>
                      {pod.status === "running" && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-12">CPU:</span>
                            <Progress value={pod.cpu} className="h-2 flex-1" />
                            <span className="w-10 text-right">{pod.cpu.toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-12">Memory:</span>
                            <Progress value={pod.memory} className="h-2 flex-1" />
                            <span className="w-10 text-right">{pod.memory.toFixed(0)}%</span>
                          </div>
                          {pod.restarts > 0 && (
                            <div className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                              <RotateCcw className="w-3 h-3" />
                              Restarts: {pod.restarts}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Nodes */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  Worker Nodes
                </h4>
                <div className="space-y-2">
                  {["node-1", "node-2"].map((node, i) => (
                    <div key={node} className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{node}</span>
                        <Badge className="bg-green-500 text-xs">Ready</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Pods: {pods.filter((_, idx) => idx % 2 === i).length} | 
                        CPU: {(32 + i * 16)}cores | RAM: {(64 + i * 32)}GB
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                  <strong>Scheduler:</strong> Distributes pods across nodes based on resource requests, 
                  affinity rules, and taints/tolerations.
                </div>
              </div>
            </div>

            {/* Event Log */}
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400 h-28 overflow-y-auto">
              <div className="text-gray-500 mb-1"># Kubernetes Events</div>
              {logs.length === 0 ? (
                <div className="text-gray-600">Waiting for events...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default KubernetesDemo;
