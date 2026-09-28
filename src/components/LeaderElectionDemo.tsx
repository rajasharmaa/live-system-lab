import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Server, Wifi, WifiOff, Play, Pause, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Node {
  id: number;
  name: string;
  status: "follower" | "candidate" | "leader" | "offline";
  term: number;
  votedFor: number | null;
  votes: number;
  lastHeartbeat: number;
}

interface LogEntry {
  timestamp: number;
  message: string;
  type: "info" | "election" | "heartbeat" | "failure";
}

const LeaderElectionDemo = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [algorithm, setAlgorithm] = useState<"raft" | "bully">("raft");
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTerm, setCurrentTerm] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize nodes
  useEffect(() => {
    const initialNodes: Node[] = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Node ${i + 1}`,
      status: i === 0 ? "leader" : "follower",
      term: 1,
      votedFor: null,
      votes: 0,
      lastHeartbeat: Date.now(),
    }));
    setNodes(initialNodes);
    addLog("System initialized. Node 1 is the initial leader.", "info");
  }, []);

  const addLog = useCallback((message: string, type: LogEntry["type"]) => {
    setLogs(prev => [{
      timestamp: Date.now(),
      message,
      type,
    }, ...prev].slice(0, 50));
  }, []);

  // Raft election
  const startRaftElection = useCallback((candidateId: number) => {
    const newTerm = currentTerm + 1;
    setCurrentTerm(newTerm);

    addLog(`Node ${candidateId} starts election for term ${newTerm}`, "election");

    setNodes(prev => prev.map(node => {
      if (node.id === candidateId) {
        return { ...node, status: "candidate", term: newTerm, votes: 1, votedFor: candidateId };
      }
      return { ...node, status: node.status === "offline" ? "offline" : "follower", term: newTerm, votedFor: null, votes: 0 };
    }));

    // Simulate voting
    setTimeout(() => {
      setNodes(prev => {
        const onlineNodes = prev.filter(n => n.status !== "offline");
        const candidate = prev.find(n => n.id === candidateId);
        if (!candidate || candidate.status === "offline") return prev;

        let votes = 1; // Self vote
        const votingNodes: number[] = [];

        onlineNodes.forEach(node => {
          if (node.id !== candidateId && Math.random() > 0.3) {
            votes++;
            votingNodes.push(node.id);
          }
        });

        const majority = Math.floor(onlineNodes.length / 2) + 1;
        const won = votes >= majority;

        if (votingNodes.length > 0) {
          addLog(`Nodes [${votingNodes.join(", ")}] voted for Node ${candidateId}`, "election");
        }

        if (won) {
          addLog(`Node ${candidateId} wins election with ${votes}/${onlineNodes.length} votes!`, "election");
          return prev.map(node => ({
            ...node,
            status: node.status === "offline" ? "offline" : node.id === candidateId ? "leader" : "follower",
            votes: node.id === candidateId ? votes : 0,
          }));
        } else {
          addLog(`Election failed. Node ${candidateId} got ${votes}/${onlineNodes.length} votes (needs ${majority})`, "election");
          return prev.map(node => ({
            ...node,
            status: node.status === "offline" ? "offline" : "follower",
            votes: 0,
          }));
        }
      });
    }, 1000);
  }, [currentTerm, addLog]);

  // Bully election
  const startBullyElection = useCallback((initiatorId: number) => {
    addLog(`Node ${initiatorId} initiates Bully election`, "election");

    setNodes(prev => {
      const higherNodes = prev.filter(n => n.id > initiatorId && n.status !== "offline");
      
      if (higherNodes.length === 0) {
        // This node becomes leader
        addLog(`Node ${initiatorId} is the highest online node - becomes leader`, "election");
        return prev.map(node => ({
          ...node,
          status: node.status === "offline" ? "offline" : node.id === initiatorId ? "leader" : "follower",
        }));
      }

      // Higher nodes respond
      const respondingNode = higherNodes[higherNodes.length - 1];
      addLog(`Node ${respondingNode.id} responds - taking over election`, "election");

      setTimeout(() => {
        setNodes(p => p.map(node => ({
          ...node,
          status: node.status === "offline" ? "offline" : node.id === respondingNode.id ? "leader" : "follower",
        })));
        addLog(`Node ${respondingNode.id} becomes the new leader`, "election");
      }, 800);

      return prev;
    });
  }, [addLog]);

  // Toggle node status
  const toggleNode = useCallback((nodeId: number) => {
    setNodes(prev => {
      const node = prev.find(n => n.id === nodeId);
      if (!node) return prev;

      const wasLeader = node.status === "leader";
      const newStatus = node.status === "offline" ? "follower" : "offline";

      if (newStatus === "offline") {
        addLog(`Node ${nodeId} goes offline${wasLeader ? " (was leader!)" : ""}`, "failure");
      } else {
        addLog(`Node ${nodeId} comes back online`, "info");
      }

      const updated = prev.map(n => n.id === nodeId ? { ...n, status: newStatus as Node["status"] } : n);

      // Trigger election if leader went down
      if (wasLeader) {
        const onlineFollowers = updated.filter(n => n.status === "follower");
        if (onlineFollowers.length > 0) {
          const newCandidate = algorithm === "bully" 
            ? onlineFollowers[onlineFollowers.length - 1] // Highest ID for bully
            : onlineFollowers[Math.floor(Math.random() * onlineFollowers.length)]; // Random for Raft
          
          setTimeout(() => {
            if (algorithm === "raft") {
              startRaftElection(newCandidate.id);
            } else {
              startBullyElection(newCandidate.id);
            }
          }, 500);
        }
      }

      return updated;
    });
  }, [algorithm, addLog, startRaftElection, startBullyElection]);

  // Heartbeat simulation
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const leader = nodes.find(n => n.status === "leader");
        if (leader) {
          addLog(`Leader (Node ${leader.id}) sends heartbeat`, "heartbeat");
          setNodes(prev => prev.map(n => ({ ...n, lastHeartbeat: Date.now() })));
        }
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, nodes, addLog]);

  const getStatusColor = (status: Node["status"]) => {
    switch (status) {
      case "leader": return "border-yellow-500 bg-yellow-500/20";
      case "candidate": return "border-blue-500 bg-blue-500/20";
      case "follower": return "border-emerald-500 bg-emerald-500/20";
      case "offline": return "border-red-500/50 bg-red-500/10 opacity-50";
    }
  };

  const getLogColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "election": return "text-blue-400";
      case "heartbeat": return "text-emerald-400";
      case "failure": return "text-red-400";
      default: return "text-muted-foreground";
    }
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-4">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Consensus Protocol</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Leader Election
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Watch how distributed systems elect a primary node when the current leader fails.
            Compare Raft (democratic) vs Bully (hierarchical) algorithms.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-400" />
              Election Controls
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Algorithm
                </label>
                <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as typeof algorithm)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raft">Raft (Majority Vote)</SelectItem>
                    <SelectItem value="bully">Bully (Highest ID)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => setIsRunning(!isRunning)} 
                className="w-full"
                variant={isRunning ? "destructive" : "default"}
              >
                {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isRunning ? "Stop Heartbeats" : "Start Heartbeats"}
              </Button>

              <Button 
                onClick={() => {
                  const onlineFollowers = nodes.filter(n => n.status === "follower");
                  if (onlineFollowers.length > 0) {
                    const candidate = onlineFollowers[Math.floor(Math.random() * onlineFollowers.length)];
                    if (algorithm === "raft") {
                      startRaftElection(candidate.id);
                    } else {
                      startBullyElection(candidate.id);
                    }
                  }
                }}
                variant="outline"
                className="w-full"
              >
                <Zap className="w-4 h-4 mr-2" />
                Force Election
              </Button>
            </div>

            {/* Legend */}
            <div className="space-y-2 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Click nodes to toggle online/offline</p>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Leader</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Follower</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Candidate</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="text-muted-foreground">Offline</span>
              </div>
            </div>

            {/* Educational tooltip */}
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-300">
                <strong>{algorithm === "raft" ? "Raft:" : "Bully:"}</strong>{" "}
                {algorithm === "raft" 
                  ? "Nodes vote democratically. A candidate needs majority votes to become leader. More fault-tolerant."
                  : "Highest ID node always wins. Simpler but less fair. Used when nodes have natural ordering."}
              </p>
            </div>
          </div>

          {/* Nodes visualization */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-yellow-400" />
              Cluster Nodes
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {nodes.map((node) => (
                <motion.button
                  key={node.id}
                  onClick={() => toggleNode(node.id)}
                  className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${getStatusColor(node.status)}`}
                  layout
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{node.name}</span>
                    {node.status === "leader" && (
                      <Crown className="w-4 h-4 text-yellow-400" />
                    )}
                    {node.status === "offline" ? (
                      <WifiOff className="w-4 h-4 text-red-400" />
                    ) : (
                      <Wifi className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {node.status}
                  </div>
                  {node.status === "candidate" && (
                    <div className="text-xs text-blue-400 mt-1">
                      Votes: {node.votes}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            <div className="mt-6 p-3 rounded-lg bg-card/50 border border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Term</span>
                <span className="font-mono text-foreground">{currentTerm}</span>
              </div>
            </div>
          </div>

          {/* Event log */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Event Log
            </h3>

            <div className="h-80 overflow-y-auto space-y-2 pr-2">
              <AnimatePresence mode="popLayout">
                {logs.map((log, i) => (
                  <motion.div
                    key={log.timestamp + i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`text-xs font-mono p-2 rounded bg-card/30 ${getLogColor(log.type)}`}
                  >
                    <span className="text-muted-foreground mr-2">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {log.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderElectionDemo;
