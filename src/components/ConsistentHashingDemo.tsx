import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Server, Plus, Minus, RefreshCw, Database, ArrowRight } from "lucide-react";

interface Node {
  id: string;
  position: number;
  color: string;
}

interface DataKey {
  key: string;
  position: number;
  assignedNode: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(142, 76%, 36%)",
  "hsl(280, 65%, 60%)",
];

const ConsistentHashingDemo = () => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: "Server-A", position: 45, color: COLORS[0] },
    { id: "Server-B", position: 135, color: COLORS[1] },
    { id: "Server-C", position: 225, color: COLORS[2] },
  ]);
  const [dataKeys, setDataKeys] = useState<DataKey[]>([
    { key: "user:1001", position: 30, assignedNode: "" },
    { key: "session:abc", position: 100, assignedNode: "" },
    { key: "cache:home", position: 200, assignedNode: "" },
    { key: "order:5555", position: 300, assignedNode: "" },
  ]);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [showMigration, setShowMigration] = useState(false);

  // Simple hash function for demo
  const hash = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash % 360);
  };

  // Assign keys to nodes (clockwise)
  const assignedKeys = useMemo(() => {
    return dataKeys.map(key => {
      const sortedNodes = [...nodes].sort((a, b) => a.position - b.position);
      let assignedNode = sortedNodes[0]; // Default to first node
      
      for (const node of sortedNodes) {
        if (node.position >= key.position) {
          assignedNode = node;
          break;
        }
      }
      
      // If no node found with position >= key.position, wrap around
      if (!sortedNodes.some(n => n.position >= key.position)) {
        assignedNode = sortedNodes[0];
      }
      
      return { ...key, assignedNode: assignedNode.id };
    });
  }, [dataKeys, nodes]);

  const addNode = () => {
    if (nodes.length >= 6) return;
    const newPosition = Math.floor(Math.random() * 360);
    const newNode: Node = {
      id: `Server-${String.fromCharCode(65 + nodes.length)}`,
      position: newPosition,
      color: COLORS[nodes.length % COLORS.length],
    };
    setShowMigration(true);
    setTimeout(() => setShowMigration(false), 2000);
    setNodes([...nodes, newNode]);
  };

  const removeNode = () => {
    if (nodes.length <= 2) return;
    setShowMigration(true);
    setTimeout(() => setShowMigration(false), 2000);
    setNodes(nodes.slice(0, -1));
  };

  const addKey = () => {
    if (!newKeyInput.trim()) return;
    const position = hash(newKeyInput);
    setDataKeys([...dataKeys, { key: newKeyInput, position, assignedNode: "" }]);
    setNewKeyInput("");
  };

  const redistributeNodes = () => {
    const newNodes = nodes.map((node, i) => ({
      ...node,
      position: (360 / nodes.length) * i + 15,
    }));
    setNodes(newNodes);
  };

  // Count keys per node
  const keysPerNode = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach(n => counts[n.id] = 0);
    assignedKeys.forEach(k => {
      if (counts[k.assignedNode] !== undefined) {
        counts[k.assignedNode]++;
      }
    });
    return counts;
  }, [assignedKeys, nodes]);

  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Hash className="w-3 h-3 mr-1" />
            DISTRIBUTED SYSTEMS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Consistent Hashing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Distribute data across nodes with minimal redistribution when nodes are added or removed.
            Used by Amazon DynamoDB, Apache Cassandra, and Discord.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Hash Ring Visualization */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Hash className="w-5 h-5 text-primary" />
              Hash Ring
            </h3>

            <div className="relative w-64 h-64 mx-auto">
              {/* Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-border/50" />
              
              {/* Ring gradient */}
              <div 
                className="absolute inset-0 rounded-full opacity-20"
                style={{
                  background: "conic-gradient(from 0deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))"
                }}
              />

              {/* Nodes */}
              <AnimatePresence>
                {nodes.map((node) => {
                  const angle = (node.position - 90) * (Math.PI / 180);
                  const x = 128 + 120 * Math.cos(angle);
                  const y = 128 + 120 * Math.sin(angle);
                  
                  return (
                    <motion.div
                      key={node.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: x, top: y }}
                    >
                      <div 
                        className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                        style={{ 
                          borderColor: node.color, 
                          backgroundColor: `${node.color}20`,
                          color: node.color
                        }}
                      >
                        <Server className="w-4 h-4" />
                      </div>
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground">
                        {node.id}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Data Keys */}
              <AnimatePresence>
                {assignedKeys.map((key) => {
                  const angle = (key.position - 90) * (Math.PI / 180);
                  const x = 128 + 85 * Math.cos(angle);
                  const y = 128 + 85 * Math.sin(angle);
                  const nodeColor = nodes.find(n => n.id === key.assignedNode)?.color || "hsl(var(--muted))";
                  
                  return (
                    <motion.div
                      key={key.key}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: x, top: y }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border-2"
                        style={{ 
                          borderColor: nodeColor,
                          backgroundColor: nodeColor
                        }}
                        title={key.key}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-foreground">{nodes.length}</div>
                  <div className="text-xs text-muted-foreground">Nodes</div>
                </div>
              </div>
            </div>

            {showMigration && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-warning text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Minimal data migration in progress...
                </div>
              </motion.div>
            )}

            <div className="flex gap-2 mt-6">
              <Button onClick={addNode} disabled={nodes.length >= 6} size="sm" className="flex-1">
                <Plus className="w-4 h-4 mr-1" />
                Add Node
              </Button>
              <Button onClick={removeNode} disabled={nodes.length <= 2} variant="outline" size="sm" className="flex-1">
                <Minus className="w-4 h-4 mr-1" />
                Remove Node
              </Button>
              <Button onClick={redistributeNodes} variant="secondary" size="sm">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Key Distribution */}
          <Card className="glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Key Distribution
            </h3>

            {/* Add new key */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Enter key (e.g., user:1234)"
                value={newKeyInput}
                onChange={(e) => setNewKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKey()}
                className="flex-1"
              />
              <Button onClick={addKey} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Key List */}
            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {assignedKeys.map((key) => {
                const nodeColor = nodes.find(n => n.id === key.assignedNode)?.color || "hsl(var(--muted))";
                return (
                  <motion.div
                    key={key.key}
                    layout
                    className="flex items-center gap-3 p-2 rounded-lg glass-card"
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: nodeColor }}
                    />
                    <span className="font-mono text-sm flex-1 truncate">{key.key}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <Badge 
                      variant="outline" 
                      style={{ borderColor: nodeColor, color: nodeColor }}
                    >
                      {key.assignedNode}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>

            {/* Node Load */}
            <h4 className="text-sm font-semibold text-foreground mb-3">Node Load Distribution</h4>
            <div className="space-y-2">
              {nodes.map((node) => (
                <div key={node.id} className="flex items-center gap-3">
                  <span className="text-sm w-20" style={{ color: node.color }}>{node.id}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: node.color }}
                      initial={{ width: 0 }}
                      animate={{ 
                        width: dataKeys.length > 0 
                          ? `${(keysPerNode[node.id] / dataKeys.length) * 100}%` 
                          : "0%" 
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono w-8 text-right">{keysPerNode[node.id]}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 glass-card rounded-lg">
              <h4 className="text-sm font-semibold text-foreground mb-2">💡 Why Consistent Hashing?</h4>
              <p className="text-xs text-muted-foreground">
                Traditional hashing redistributes all keys when nodes change. Consistent hashing 
                only moves K/N keys on average (K = total keys, N = nodes), enabling seamless scaling.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ConsistentHashingDemo;
