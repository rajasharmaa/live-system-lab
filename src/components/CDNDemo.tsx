import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Globe, Server, Zap, RefreshCw, MapPin, Clock, ArrowRight } from "lucide-react";

interface EdgeLocation {
  id: string;
  name: string;
  region: string;
  cache: Map<string, { content: string; ttl: number; timestamp: number }>;
  hitRate: number;
  latency: number;
}

interface Request {
  id: string;
  path: string;
  fromLocation: string;
  status: "pending" | "cache-hit" | "cache-miss" | "served";
  latency: number;
}

const CDNDemo = () => {
  const [edgeLocations, setEdgeLocations] = useState<EdgeLocation[]>([
    { id: "us-east", name: "US East", region: "Virginia", cache: new Map(), hitRate: 0, latency: 20 },
    { id: "us-west", name: "US West", region: "California", cache: new Map(), hitRate: 0, latency: 45 },
    { id: "eu-west", name: "Europe", region: "Frankfurt", cache: new Map(), hitRate: 0, latency: 90 },
    { id: "ap-east", name: "Asia Pacific", region: "Singapore", cache: new Map(), hitRate: 0, latency: 180 },
  ]);
  
  const [requests, setRequests] = useState<Request[]>([]);
  const [originHits, setOriginHits] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const assets = ["/images/hero.jpg", "/css/styles.css", "/js/app.js", "/api/data.json", "/video/intro.mp4"];

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-5), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const simulateRequest = (locationId: string, path: string) => {
    const location = edgeLocations.find(l => l.id === locationId);
    if (!location) return;

    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setTotalRequests(prev => prev + 1);

    const newRequest: Request = {
      id: requestId,
      path,
      fromLocation: location.name,
      status: "pending",
      latency: 0,
    };
    setRequests(prev => [...prev.slice(-9), newRequest]);

    // Check cache
    const cached = location.cache.get(path);
    const now = Date.now();
    
    if (cached && now - cached.timestamp < cached.ttl * 1000) {
      // Cache hit
      setTimeout(() => {
        setRequests(prev => prev.map(r => 
          r.id === requestId 
            ? { ...r, status: "cache-hit", latency: location.latency }
            : r
        ));
        addLog(`CACHE HIT: ${path} from ${location.name} (${location.latency}ms)`);
        
        setEdgeLocations(prev => prev.map(l => 
          l.id === locationId 
            ? { ...l, hitRate: Math.min(100, l.hitRate + 5) }
            : l
        ));
      }, location.latency);
    } else {
      // Cache miss - fetch from origin
      setOriginHits(prev => prev + 1);
      const originLatency = 200 + location.latency;
      
      setTimeout(() => {
        setRequests(prev => prev.map(r => 
          r.id === requestId 
            ? { ...r, status: "cache-miss", latency: originLatency }
            : r
        ));
        addLog(`CACHE MISS: ${path} fetched from origin (${originLatency}ms)`);
        
        // Populate cache
        setEdgeLocations(prev => prev.map(l => {
          if (l.id === locationId) {
            const newCache = new Map(l.cache);
            newCache.set(path, { content: `Content of ${path}`, ttl: 300, timestamp: now });
            return { ...l, cache: newCache, hitRate: Math.max(0, l.hitRate - 2) };
          }
          return l;
        }));
      }, originLatency);
    }
  };

  const invalidateCache = (path?: string) => {
    setEdgeLocations(prev => prev.map(l => {
      const newCache = new Map(l.cache);
      if (path) {
        newCache.delete(path);
        addLog(`Invalidated ${path} at ${l.name}`);
      } else {
        newCache.clear();
        addLog(`Purged all cache at ${l.name}`);
      }
      return { ...l, cache: newCache, hitRate: path ? l.hitRate : 0 };
    }));
  };

  const warmCache = () => {
    addLog("Warming cache at all edge locations...");
    edgeLocations.forEach(location => {
      assets.forEach(asset => {
        const now = Date.now();
        setEdgeLocations(prev => prev.map(l => {
          if (l.id === location.id) {
            const newCache = new Map(l.cache);
            newCache.set(asset, { content: `Content of ${asset}`, ttl: 300, timestamp: now });
            return { ...l, cache: newCache, hitRate: 85 };
          }
          return l;
        }));
      });
    });
    addLog("Cache warmed at all edge locations");
  };

  useEffect(() => {
    if (!isSimulating) return;
    
    const interval = setInterval(() => {
      const randomLocation = edgeLocations[Math.floor(Math.random() * edgeLocations.length)];
      const randomAsset = assets[Math.floor(Math.random() * assets.length)];
      simulateRequest(randomLocation.id, randomAsset);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isSimulating, edgeLocations]);

  const globalHitRate = totalRequests > 0 
    ? ((totalRequests - originHits) / totalRequests * 100).toFixed(1)
    : "0";

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Globe className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Content Delivery Network (CDN)
                  <Badge variant="outline" className="ml-2">Edge Caching</Badge>
                </CardTitle>
                <CardDescription>
                  Global edge caching, cache invalidation, and content distribution
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Controls */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setIsSimulating(!isSimulating)}
                variant={isSimulating ? "destructive" : "default"}
              >
                {isSimulating ? "Stop" : "Start"} Traffic
              </Button>
              <Button variant="outline" onClick={warmCache}>
                <Zap className="w-4 h-4 mr-1" />
                Warm Cache
              </Button>
              <Button variant="outline" onClick={() => invalidateCache()}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Purge All
              </Button>
              <div className="ml-auto flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Hit Rate: </span>
                  <span className="font-bold text-green-500">{globalHitRate}%</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Requests: </span>
                  <span className="font-bold">{totalRequests}</span>
                </div>
              </div>
            </div>

            {/* Architecture */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Origin Server */}
              <div className="lg:col-span-4 flex justify-center mb-4">
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30 text-center">
                  <Server className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <div className="font-semibold">Origin Server</div>
                  <div className="text-xs text-muted-foreground">us-central-1</div>
                  <div className="text-xs mt-1">
                    Requests: <span className="font-mono">{originHits}</span>
                  </div>
                </div>
              </div>
              
              {/* Edge Locations */}
              {edgeLocations.map((location) => (
                <div key={location.id} className="p-4 bg-card border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-cyan-500" />
                    <span className="font-semibold text-sm">{location.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{location.region}</div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-xs">
                      <span>Hit Rate</span>
                      <span className="font-mono">{location.hitRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={location.hitRate} className="h-2" />
                  </div>
                  
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-mono">{location.latency}ms</span>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Cached</span>
                    <span className="font-mono">{location.cache.size} items</span>
                  </div>
                  
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {assets.slice(0, 3).map(asset => (
                      <Button
                        key={asset}
                        size="sm"
                        variant="ghost"
                        className="text-xs h-6 px-2"
                        onClick={() => simulateRequest(location.id, asset)}
                      >
                        {asset.split('/').pop()?.slice(0, 6)}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Request Log */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Requests
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {requests.slice(-6).reverse().map((req) => (
                    <div key={req.id} className="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          req.status === "cache-hit" 
                            ? "bg-green-500/20 border-green-500/50" 
                            : req.status === "cache-miss"
                            ? "bg-orange-500/20 border-orange-500/50"
                            : ""
                        }`}
                      >
                        {req.status === "cache-hit" ? "HIT" : req.status === "cache-miss" ? "MISS" : "..."}
                      </Badge>
                      <span className="font-mono flex-1 truncate">{req.path}</span>
                      <span className="text-muted-foreground">{req.fromLocation}</span>
                      {req.latency > 0 && (
                        <span className="font-mono text-muted-foreground">{req.latency}ms</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">CDN Benefits</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="font-semibold text-green-600">Reduced Latency</div>
                    <div className="text-muted-foreground">Content served from nearest edge</div>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <div className="font-semibold text-blue-600">Origin Offload</div>
                    <div className="text-muted-foreground">Reduced load on origin server</div>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/30">
                    <div className="font-semibold text-purple-600">Global Scale</div>
                    <div className="text-muted-foreground">Handle traffic spikes easily</div>
                  </div>
                  <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
                    <div className="font-semibold text-orange-600">Cache Control</div>
                    <div className="text-muted-foreground">TTL-based invalidation</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logs */}
            <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-cyan-400 h-24 overflow-y-auto">
              <div className="text-gray-500 mb-1"># CDN Edge Logs</div>
              {logs.length === 0 ? (
                <div className="text-gray-600">Start traffic to see logs...</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={log.includes("HIT") ? "text-green-400" : log.includes("MISS") ? "text-orange-400" : "text-cyan-400"}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CDNDemo;
