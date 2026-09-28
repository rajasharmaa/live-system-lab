import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Zap, Clock, Shield } from "lucide-react";

type SystemChoice = "CP" | "AP" | "CA";

interface Node {
  id: string;
  name: string;
  data: string;
  isAvailable: boolean;
  isConsistent: boolean;
  latency: number;
}

interface Scenario {
  id: SystemChoice;
  name: string;
  description: string;
  examples: string[];
  icon: React.ReactNode;
  color: string;
  tradeoff: string;
}

const scenarios: Scenario[] = [
  {
    id: "CP",
    name: "Consistency + Partition Tolerance",
    description: "System remains consistent during partitions but may become unavailable. Writes are blocked until partition heals.",
    examples: ["MongoDB (primary)", "HBase", "Redis Cluster"],
    icon: <Shield className="w-5 h-5" />,
    color: "text-blue-500",
    tradeoff: "Sacrifices Availability",
  },
  {
    id: "AP",
    name: "Availability + Partition Tolerance",
    description: "System remains available during partitions but may return stale data. Uses eventual consistency.",
    examples: ["Cassandra", "DynamoDB", "CouchDB"],
    icon: <Zap className="w-5 h-5" />,
    color: "text-green-500",
    tradeoff: "Sacrifices Consistency",
  },
  {
    id: "CA",
    name: "Consistency + Availability",
    description: "System is both consistent and available, but cannot tolerate network partitions. Only works in single-node or no-partition scenarios.",
    examples: ["PostgreSQL (single)", "MySQL (single)", "Traditional RDBMS"],
    icon: <Database className="w-5 h-5" />,
    color: "text-purple-500",
    tradeoff: "No Partition Tolerance",
  },
];

const CAPTheoremDemo = () => {
  const [selectedSystem, setSelectedSystem] = useState<SystemChoice>("CP");
  const [hasPartition, setHasPartition] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([
    { id: "node1", name: "Node A (Primary)", data: "v1: user_count=100", isAvailable: true, isConsistent: true, latency: 5 },
    { id: "node2", name: "Node B (Replica)", data: "v1: user_count=100", isAvailable: true, isConsistent: true, latency: 8 },
    { id: "node3", name: "Node C (Replica)", data: "v1: user_count=100", isAvailable: true, isConsistent: true, latency: 12 },
  ]);
  const [isWriting, setIsWriting] = useState(false);
  const [writeVersion, setWriteVersion] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [message, ...prev].slice(0, 10));
  }, []);

  const simulateWrite = async () => {
    if (isWriting) return;
    setIsWriting(true);
    
    const newVersion = writeVersion + 1;
    const newData = `v${newVersion}: user_count=${100 + newVersion * 10}`;
    setWriteVersion(newVersion);

    addLog(`📝 Write request: ${newData}`);
    await new Promise(r => setTimeout(r, 300));

    if (!hasPartition) {
      // No partition - all systems work normally
      setNodes(prev => prev.map(n => ({ ...n, data: newData, isConsistent: true })));
      addLog("✅ All nodes updated successfully");
    } else {
      // Network partition exists
      switch (selectedSystem) {
        case "CP":
          // CP: Block writes, maintain consistency, sacrifice availability
          addLog("⚠️ Partition detected! Blocking write to maintain consistency...");
          setNodes(prev => prev.map((n, i) => 
            i === 0 
              ? { ...n, isAvailable: true, isConsistent: true }
              : { ...n, isAvailable: false, isConsistent: true }
          ));
          await new Promise(r => setTimeout(r, 500));
          addLog("❌ Write rejected - cannot reach quorum");
          break;

        case "AP":
          // AP: Accept writes, allow inconsistency
          addLog("⚠️ Partition detected! Accepting write anyway...");
          setNodes(prev => prev.map((n, i) => 
            i === 0 
              ? { ...n, data: newData, isAvailable: true, isConsistent: false }
              : { ...n, isAvailable: true, isConsistent: false, latency: n.latency + 100 }
          ));
          await new Promise(r => setTimeout(r, 500));
          addLog("⚡ Write accepted - eventual consistency mode");
          addLog("📊 Node A has new data, replicas have stale data");
          break;

        case "CA":
          // CA: System fails on partition
          addLog("💥 Partition detected! System cannot operate...");
          setNodes(prev => prev.map(n => ({ ...n, isAvailable: false })));
          await new Promise(r => setTimeout(r, 500));
          addLog("❌ System unavailable - no partition tolerance");
          break;
      }
    }

    setIsWriting(false);
  };

  const healPartition = () => {
    setHasPartition(false);
    addLog("🔗 Network partition healed");
    setNodes(prev => {
      const primaryData = prev[0].data;
      return prev.map(n => ({
        ...n,
        data: primaryData,
        isAvailable: true,
        isConsistent: true,
        latency: n.id === "node1" ? 5 : n.id === "node2" ? 8 : 12,
      }));
    });
  };

  const createPartition = () => {
    setHasPartition(true);
    addLog("🔌 Network partition created between nodes");
  };

  const currentScenario = scenarios.find(s => s.id === selectedSystem)!;

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">Distributed Systems Theory</Badge>
          <h2 className="text-3xl font-bold mb-4">CAP Theorem</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            In a distributed system, you can only guarantee two of three properties: 
            Consistency, Availability, and Partition Tolerance.
          </p>
        </div>

        {/* CAP Triangle Selector */}
        <div className="flex justify-center mb-8">
          <div className="relative w-80 h-72">
            {/* Triangle visualization */}
            <svg viewBox="0 0 200 180" className="w-full h-full">
              <polygon
                points="100,10 10,170 190,170"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted-foreground/30"
              />
              
              {/* Labels */}
              <text x="100" y="8" textAnchor="middle" className="fill-current text-xs font-semibold">
                Consistency
              </text>
              <text x="10" y="185" textAnchor="middle" className="fill-current text-xs font-semibold">
                Availability
              </text>
              <text x="190" y="185" textAnchor="middle" className="fill-current text-xs font-semibold">
                Partition
              </text>
            </svg>

            {/* Clickable regions */}
            <button
              onClick={() => setSelectedSystem("CP")}
              className={`absolute top-12 right-8 p-3 rounded-full transition-all ${
                selectedSystem === "CP" 
                  ? "bg-blue-500 text-white scale-110" 
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              CP
            </button>
            <button
              onClick={() => setSelectedSystem("AP")}
              className={`absolute bottom-8 left-8 p-3 rounded-full transition-all ${
                selectedSystem === "AP" 
                  ? "bg-green-500 text-white scale-110" 
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              AP
            </button>
            <button
              onClick={() => setSelectedSystem("CA")}
              className={`absolute top-12 left-8 p-3 rounded-full transition-all ${
                selectedSystem === "CA" 
                  ? "bg-purple-500 text-white scale-110" 
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              CA
            </button>
          </div>
        </div>

        {/* Selected System Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full bg-muted ${currentScenario.color}`}>
                {currentScenario.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{currentScenario.name}</h3>
                <p className="text-muted-foreground mb-3">{currentScenario.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="destructive">{currentScenario.tradeoff}</Badge>
                  {currentScenario.examples.map(ex => (
                    <Badge key={ex} variant="secondary">{ex}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Live Simulation</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Network Partition</span>
                  <Switch
                    checked={hasPartition}
                    onCheckedChange={(checked) => checked ? createPartition() : healPartition()}
                  />
                  {hasPartition && <WifiOff className="w-4 h-4 text-red-500" />}
                </div>
              </CardTitle>
              <CardDescription>
                Toggle partition and try writing to see how each system responds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Nodes Visualization */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {nodes.map((node, i) => (
                  <motion.div
                    key={node.id}
                    animate={{
                      opacity: node.isAvailable ? 1 : 0.5,
                      scale: node.isAvailable ? 1 : 0.95,
                    }}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      !node.isAvailable 
                        ? "border-red-500/50 bg-red-500/10" 
                        : !node.isConsistent
                        ? "border-yellow-500/50 bg-yellow-500/10"
                        : "border-green-500/50 bg-green-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4" />
                      <span className="text-sm font-medium">{node.name}</span>
                    </div>
                    
                    <div className="text-xs font-mono bg-background/50 p-2 rounded mb-2">
                      {node.data}
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {node.isAvailable ? (
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span>{node.isAvailable ? "Available" : "Unavailable"}</span>
                    </div>
                    
                    {!node.isConsistent && node.isAvailable && (
                      <div className="flex items-center gap-2 text-xs text-yellow-500 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Stale data</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{node.latency}ms latency</span>
                    </div>

                    {/* Partition line */}
                    {hasPartition && i === 0 && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        className="absolute right-0 top-0 bottom-0 w-1 bg-red-500 origin-top"
                        style={{ right: "-8px" }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Partition Visual */}
              <AnimatePresence>
                {hasPartition && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4"
                  >
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-500">Network partition between Node A and replicas</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <Button onClick={simulateWrite} disabled={isWriting} size="lg">
                  {isWriting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Writing...
                    </>
                  ) : (
                    "Simulate Write"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Event Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Event Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                <AnimatePresence>
                  {logs.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs p-2 bg-muted/50 rounded"
                    >
                      {log}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {logs.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Toggle partition and write to see events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {scenarios.map(scenario => (
            <Card 
              key={scenario.id}
              className={`cursor-pointer transition-all ${
                selectedSystem === scenario.id ? "ring-2 ring-primary" : "hover:bg-muted/50"
              }`}
              onClick={() => setSelectedSystem(scenario.id)}
            >
              <CardContent className="pt-4">
                <div className={`flex items-center gap-2 mb-2 ${scenario.color}`}>
                  {scenario.icon}
                  <span className="font-semibold">{scenario.id}</span>
                </div>
                <p className="text-xs text-muted-foreground">{scenario.tradeoff}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CAPTheoremDemo;
