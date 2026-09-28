import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitBranch, Search, Globe, ArrowRight, Radio, Server, Shield, Zap } from "lucide-react";
import { NetWeaver } from "./ui/SVGMascots";

interface Service {
  id: string;
  name: string;
  version: string;
  status: "healthy" | "degraded" | "down";
  instances: number;
  port: number;
}

interface RegistryEntry {
  serviceId: string;
  host: string;
  port: number;
  health: "UP" | "DOWN";
  metadata: { version: string; region: string };
}

const initialServices: Service[] = [
  { id: "user", name: "User Service", version: "v2.1.0", status: "healthy", instances: 3, port: 8001 },
  { id: "order", name: "Order Service", version: "v1.8.0", status: "healthy", instances: 2, port: 8002 },
  { id: "payment", name: "Payment Service", version: "v3.0.0", status: "healthy", instances: 2, port: 8003 },
  { id: "inventory", name: "Inventory Service", version: "v1.5.0", status: "healthy", instances: 1, port: 8004 },
  { id: "notification", name: "Notification Service", version: "v2.0.0", status: "healthy", instances: 2, port: 8005 },
];

const communicationPatterns = [
  {
    id: "sync",
    name: "Synchronous (REST/gRPC)",
    description: "Direct request-response between services. Simple but creates tight coupling.",
    flow: ["API Gateway", "Order Service", "User Service", "Payment Service"],
    pros: ["Simple to implement", "Immediate response", "Easy debugging"],
    cons: ["Tight coupling", "Cascading failures", "Higher latency chain"],
  },
  {
    id: "async",
    name: "Asynchronous (Event-Driven)",
    description: "Services communicate via events through a message broker. Loose coupling.",
    flow: ["Order Service", "Message Broker", "Payment Service", "Notification Service"],
    pros: ["Loose coupling", "Better resilience", "Independent scaling"],
    cons: ["Eventual consistency", "Complex debugging", "Message ordering"],
  },
  {
    id: "hybrid",
    name: "Hybrid (CQRS + Events)",
    description: "Queries use sync calls, commands emit events. Best of both worlds.",
    flow: ["Client", "Query → Read DB", "Command → Event Bus", "Write Services"],
    pros: ["Optimized reads", "Decoupled writes", "Scalable"],
    cons: ["Higher complexity", "Data sync lag", "More infrastructure"],
  },
];

const MicroservicesDemo = () => {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);
  const [discoveryQuery, setDiscoveryQuery] = useState<string | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<RegistryEntry[]>([]);
  const [activePattern, setActivePattern] = useState(communicationPatterns[0]);
  const [flowStep, setFlowStep] = useState(-1);
  const [selectedVersion, setSelectedVersion] = useState<"v1" | "v2" | "v3">("v2");
  const [versionRouting, setVersionRouting] = useState<Record<string, number>>({ v1: 10, v2: 80, v3: 10 });

  // Build registry from services
  useEffect(() => {
    const entries: RegistryEntry[] = [];
    services.forEach((svc) => {
      for (let i = 0; i < svc.instances; i++) {
        entries.push({
          serviceId: svc.id,
          host: `${svc.id}-${i}.internal`,
          port: svc.port + i,
          health: svc.status === "down" ? "DOWN" : "UP",
          metadata: { version: svc.version, region: i % 2 === 0 ? "us-east" : "us-west" },
        });
      }
    });
    setRegistry(entries);
  }, [services]);

  const discoverService = (serviceId: string) => {
    setDiscoveryQuery(serviceId);
    const results = registry.filter((r) => r.serviceId === serviceId && r.health === "UP");
    setDiscoveryResult(results);
  };

  const toggleServiceHealth = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId
          ? { ...s, status: s.status === "healthy" ? "down" : "healthy" }
          : s
      )
    );
  };

  const animateFlow = () => {
    setFlowStep(0);
    const steps = activePattern.flow.length;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        clearInterval(interval);
        setTimeout(() => setFlowStep(-1), 1500);
      } else {
        setFlowStep(step);
      }
    }, 800);
  };

  const statusColor = (status: string) => {
    if (status === "healthy" || status === "UP") return "bg-accent text-accent-foreground";
    if (status === "degraded") return "bg-warning text-warning-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[var(--gradient-glow)] opacity-20" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <NetWeaver />
          <div>
            <h2 className="text-3xl font-bold mb-2">Microservices Architecture</h2>
            <p className="text-muted-foreground">
              An architectural style that structures an application as a collection of loosely coupled, independently deployable services.
              <strong> Why?</strong> Enables scaling specific components, faster deployments, and fault isolation.
              <strong> Challenge:</strong> Adds network complexity, distributed transactions, and tracing overhead.
            </p>
          </div>
        </div>

        <Tabs defaultValue="discovery" className="space-y-6">
          <TabsList className="bg-card/80 border border-border/50">
            <TabsTrigger value="discovery">Service Discovery</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="versioning">API Versioning</TabsTrigger>
          </TabsList>

          {/* Service Discovery */}
          <TabsContent value="discovery">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    Service Registry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {services.map((svc) => (
                    <motion.div
                      key={svc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${svc.status === "healthy" ? "bg-accent" : svc.status === "degraded" ? "bg-warning" : "bg-destructive"}`} />
                        <div>
                          <div className="text-sm font-mono text-foreground">{svc.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {svc.version} • {svc.instances} instances • :{svc.port}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => discoverService(svc.id)}
                        >
                          <Search className="w-3 h-3 mr-1" /> Discover
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => toggleServiceHealth(svc.id)}
                        >
                          {svc.status === "healthy" ? "Kill" : "Revive"}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                    <Search className="w-5 h-5 text-accent" />
                    Discovery Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {discoveryQuery ? (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Query: <code className="text-primary bg-muted px-2 py-0.5 rounded">GET /services/{discoveryQuery}</code>
                      </div>
                      {discoveryResult.length > 0 ? (
                        discoveryResult.map((entry, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-3 rounded-lg bg-muted/30 border border-border/30 font-mono text-xs space-y-1"
                          >
                            <div className="flex justify-between">
                              <span className="text-foreground">{entry.host}:{entry.port}</span>
                              <Badge className={statusColor(entry.health)} variant="outline">{entry.health}</Badge>
                            </div>
                            <div className="text-muted-foreground">
                              version: {entry.metadata.version} | region: {entry.metadata.region}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-destructive text-sm">
                          No healthy instances found for "{discoveryQuery}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      Click "Discover" on a service to query the registry
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Communication Patterns */}
          <TabsContent value="communication">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-mono text-foreground">Patterns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {communicationPatterns.map((pattern) => (
                    <motion.button
                      key={pattern.id}
                      onClick={() => { setActivePattern(pattern); setFlowStep(-1); }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        activePattern.id === pattern.id
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/30 bg-muted/20 hover:bg-muted/40"
                      }`}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="text-sm font-mono text-foreground">{pattern.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{pattern.description}</div>
                    </motion.button>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-border/50 lg:col-span-2">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                    <Radio className="w-5 h-5 text-secondary" />
                    {activePattern.name}
                  </CardTitle>
                  <Button size="sm" onClick={animateFlow} className="bg-primary text-primary-foreground">
                    <Zap className="w-3 h-3 mr-1" /> Simulate
                  </Button>
                </CardHeader>
                <CardContent>
                  {/* Flow visualization */}
                  <div className="flex items-center justify-between mb-6 py-4">
                    {activePattern.flow.map((step, i) => (
                      <div key={i} className="flex items-center">
                        <motion.div
                          className={`px-4 py-3 rounded-lg border text-sm font-mono transition-colors ${
                            flowStep >= i
                              ? "bg-primary/20 border-primary/50 text-primary"
                              : "bg-muted/30 border-border/30 text-muted-foreground"
                          }`}
                          animate={flowStep === i ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          {step}
                        </motion.div>
                        {i < activePattern.flow.length - 1 && (
                          <ArrowRight className={`w-4 h-4 mx-2 ${flowStep > i ? "text-primary" : "text-border"}`} />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-accent mb-2">✓ Pros</h4>
                      {activePattern.pros.map((pro, i) => (
                        <div key={i} className="text-xs text-muted-foreground py-1">• {pro}</div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-destructive mb-2">✗ Cons</h4>
                      {activePattern.cons.map((con, i) => (
                        <div key={i} className="text-xs text-muted-foreground py-1">• {con}</div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Versioning */}
          <TabsContent value="versioning">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                    <Globe className="w-5 h-5 text-warning" />
                    Versioning Strategies
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { method: "URL Path", example: "/api/v2/users", desc: "Most common, explicit versioning in URL" },
                    { method: "Header", example: "Accept: application/vnd.api+json;version=2", desc: "Clean URLs, version in Accept header" },
                    { method: "Query Param", example: "/api/users?version=2", desc: "Simple, but pollutes query string" },
                  ].map((strategy) => (
                    <div key={strategy.method} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                      <div className="text-sm font-semibold text-foreground">{strategy.method}</div>
                      <code className="text-xs text-primary bg-muted px-2 py-0.5 rounded block mt-1">{strategy.example}</code>
                      <div className="text-xs text-muted-foreground mt-1">{strategy.desc}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-mono text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Traffic Routing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Canary-style version routing — distribute traffic across API versions:
                  </p>
                  {(["v1", "v2", "v3"] as const).map((v) => (
                    <div key={v} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-mono text-foreground">{v}</span>
                        <span className="text-muted-foreground">{versionRouting[v]}%</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${v === "v1" ? "bg-muted-foreground" : v === "v2" ? "bg-primary" : "bg-accent"}`}
                          animate={{ width: `${versionRouting[v]}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setVersionRouting({ v1: 0, v2: 20, v3: 80 })}
                      className="text-xs"
                    >
                      Promote v3
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setVersionRouting({ v1: 10, v2: 80, v3: 10 })}
                      className="text-xs"
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setVersionRouting({ v1: 0, v2: 0, v3: 100 })}
                      className="text-xs"
                    >
                      Full Cutover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default MicroservicesDemo;
