import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Server, Shield, Gauge, ArrowRight, 
  CheckCircle, XCircle, Clock, Lock, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Request {
  id: string;
  path: string;
  method: string;
  status: "pending" | "authenticated" | "rate-limited" | "routed" | "rejected";
  targetService?: string;
  timestamp: number;
}

interface Service {
  id: string;
  name: string;
  path: string;
  instances: number;
  healthy: boolean;
}

const services: Service[] = [
  { id: "users", name: "User Service", path: "/api/users", instances: 3, healthy: true },
  { id: "orders", name: "Order Service", path: "/api/orders", instances: 2, healthy: true },
  { id: "products", name: "Product Service", path: "/api/products", instances: 4, healthy: true },
  { id: "payments", name: "Payment Service", path: "/api/payments", instances: 2, healthy: false },
];

const requestPaths = [
  { path: "/api/users/profile", method: "GET", service: "users" },
  { path: "/api/orders/create", method: "POST", service: "orders" },
  { path: "/api/products/list", method: "GET", service: "products" },
  { path: "/api/payments/process", method: "POST", service: "payments" },
  { path: "/api/admin/settings", method: "GET", service: null }, // Unauthorized
];

export const APIGatewayInteractive = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [stats, setStats] = useState({ total: 0, authenticated: 0, rateLimited: 0, routed: 0 });

  const processRequest = useCallback((request: Request) => {
    // Step 1: Authentication check
    setTimeout(() => {
      setRequests(prev => prev.map(r => 
        r.id === request.id 
          ? { ...r, status: request.path.includes("admin") ? "rejected" : "authenticated" }
          : r
      ));

      if (request.path.includes("admin")) {
        setStats(prev => ({ ...prev, total: prev.total + 1 }));
        return;
      }

      // Step 2: Rate limiting check
      setTimeout(() => {
        const shouldRateLimit = rateLimitCount > 8;
        
        if (shouldRateLimit) {
          setRequests(prev => prev.map(r => 
            r.id === request.id ? { ...r, status: "rate-limited" } : r
          ));
          setStats(prev => ({ ...prev, total: prev.total + 1, rateLimited: prev.rateLimited + 1 }));
          return;
        }

        setRateLimitCount(prev => prev + 1);
        setStats(prev => ({ ...prev, authenticated: prev.authenticated + 1 }));

        // Step 3: Route to service
        setTimeout(() => {
          const targetService = services.find(s => request.path.startsWith(s.path));
          setRequests(prev => prev.map(r => 
            r.id === request.id 
              ? { ...r, status: "routed", targetService: targetService?.name }
              : r
          ));
          setStats(prev => ({ ...prev, total: prev.total + 1, routed: prev.routed + 1 }));
        }, 300);
      }, 300);
    }, 300);
  }, [rateLimitCount]);

  const sendRequest = useCallback(() => {
    const randomPath = requestPaths[Math.floor(Math.random() * requestPaths.length)];
    const newRequest: Request = {
      id: Math.random().toString(36).substr(2, 9),
      path: randomPath.path,
      method: randomPath.method,
      status: "pending",
      timestamp: Date.now(),
    };

    setRequests(prev => [newRequest, ...prev.slice(0, 9)]);
    processRequest(newRequest);
  }, [processRequest]);

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(sendRequest, 800);
    return () => clearInterval(interval);
  }, [isSimulating, sendRequest]);

  useEffect(() => {
    const decayInterval = setInterval(() => {
      setRateLimitCount(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(decayInterval);
  }, []);

  const getStatusIcon = (status: Request["status"]) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-muted-foreground animate-spin" />;
      case "authenticated": return <Shield className="w-4 h-4 text-blue-500" />;
      case "rate-limited": return <Gauge className="w-4 h-4 text-yellow-500" />;
      case "routed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: Request["status"]) => {
    switch (status) {
      case "pending": return "bg-muted";
      case "authenticated": return "bg-blue-500/20 border-blue-500/50";
      case "rate-limited": return "bg-yellow-500/20 border-yellow-500/50";
      case "routed": return "bg-green-500/20 border-green-500/50";
      case "rejected": return "bg-red-500/20 border-red-500/50";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4">
        <Button size="sm" onClick={() => setIsSimulating(!isSimulating)} className="text-xs md:text-sm">
          {isSimulating ? <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> : <Globe className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />}
          {isSimulating ? "Stop Simulation" : "Start Traffic"}
        </Button>
        <Button size="sm" variant="outline" onClick={sendRequest} className="text-xs md:text-sm">
          Send Single Request
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setRequests([]); setStats({ total: 0, authenticated: 0, rateLimited: 0, routed: 0 }); }} className="text-xs md:text-sm">
          <RefreshCw className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
          Reset
        </Button>
      </div>

      {/* Architecture Diagram */}
      <div className="glass-card p-4 md:p-6">
        <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-primary/20 rounded-lg border border-primary/30">
            <Globe className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-[10px] md:text-sm font-medium">Clients</span>
          </div>
          <ArrowRight className="w-4 h-4 md:w-6 md:h-6 text-muted-foreground rotate-90 md:rotate-0" />
          <div className="flex flex-col md:flex-row items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-secondary/20 rounded-lg border-2 border-secondary/50">
            <Shield className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
            <div className="text-center md:text-left">
              <span className="font-bold block text-xs md:text-sm">API Gateway</span>
              <span className="text-[8px] md:text-xs text-muted-foreground">Auth • Rate Limit • Route</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 md:w-6 md:h-6 text-muted-foreground rotate-90 md:rotate-0" />
          <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-accent/20 rounded-lg border border-accent/30">
            <Server className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            <span className="text-[10px] md:text-sm font-medium">Microservices</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Incoming Requests */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <h3 className="text-sm md:text-lg font-semibold">Incoming Requests</h3>
          </div>

          {/* Rate Limit Meter */}
          <div className="mb-4 p-2 md:p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between text-[10px] md:text-sm mb-1 md:mb-2">
              <span className="text-muted-foreground">Rate Limit Window</span>
              <span className={rateLimitCount > 8 ? "text-red-500 font-bold" : "text-foreground"}>
                {rateLimitCount}/10 requests
              </span>
            </div>
            <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${rateLimitCount > 8 ? "bg-red-500" : "bg-primary"}`}
                animate={{ width: `${(rateLimitCount / 10) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 h-48 md:h-64 overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence>
              {requests.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 text-[10px] md:text-sm">
                  Start simulation to see requests
                </p>
              ) : (
                requests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-2 md:p-3 rounded-lg border ${getStatusColor(request.status)}`}
                  >
                    <div className="flex items-center gap-1 md:gap-2">
                      {getStatusIcon(request.status)}
                      <Badge variant="outline" className="text-[8px] md:text-xs">{request.method}</Badge>
                      <code className="text-[10px] md:text-xs truncate flex-1">{request.path}</code>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Gateway Processing */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-secondary" />
            <h3 className="text-sm md:text-lg font-semibold">Gateway Pipeline</h3>
          </div>

          <div className="space-y-2 md:space-y-4">
            <div className="p-3 md:p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <Lock className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                <span className="font-medium text-[10px] md:text-sm">1. Authentication</span>
              </div>
              <p className="text-[8px] md:text-xs text-muted-foreground">
                Validate JWT tokens, API keys, or OAuth tokens
              </p>
            </div>

            <div className="p-3 md:p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <Gauge className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
                <span className="font-medium text-[10px] md:text-sm">2. Rate Limiting</span>
              </div>
              <p className="text-[8px] md:text-xs text-muted-foreground">
                Sliding window algorithm: 10 req/10s per client
              </p>
            </div>

            <div className="p-3 md:p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2 mb-1 md:mb-2">
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                <span className="font-medium text-[10px] md:text-sm">3. Request Routing</span>
              </div>
              <p className="text-[8px] md:text-xs text-muted-foreground">
                Route to healthy service instance based on path
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="p-2 bg-muted/50 rounded text-center">
              <div className="text-base md:text-lg font-bold text-primary">{stats.routed}</div>
              <div className="text-[8px] md:text-xs text-muted-foreground">Routed</div>
            </div>
            <div className="p-2 bg-muted/50 rounded text-center">
              <div className="text-base md:text-lg font-bold text-yellow-500">{stats.rateLimited}</div>
              <div className="text-[8px] md:text-xs text-muted-foreground">Rate Limited</div>
            </div>
          </div>
        </div>

        {/* Backend Services */}
        <div className="glass-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            <h3 className="text-sm md:text-lg font-semibold">Backend Services</h3>
          </div>

          <div className="space-y-2 md:space-y-3">
            {services.map((service) => (
              <motion.div
                key={service.id}
                className={`p-2 md:p-3 rounded-lg border ${
                  service.healthy 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[10px] md:text-sm">{service.name}</span>
                  <Badge variant={service.healthy ? "default" : "destructive"} className="text-[8px] md:text-xs">
                    {service.healthy ? "Healthy" : "Unhealthy"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <code className="text-[8px] md:text-xs text-muted-foreground">{service.path}/*</code>
                  <span className="text-[8px] md:text-xs text-muted-foreground">
                    {service.instances} instances
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const APIGatewayDemo = () => {
  return (
    <section id="api-gateway" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Cloud & DevOps</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">API Gateway</span>
            <span className="text-foreground"> Pattern</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Single entry point for all client requests. Handles authentication, 
            rate limiting, and routes to appropriate microservices.
          </p>
        </motion.div>
        <APIGatewayInteractive />
      </div>
    </section>
  );
};

export default APIGatewayDemo;
