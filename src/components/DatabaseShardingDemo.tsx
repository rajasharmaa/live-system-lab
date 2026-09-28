import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Key, ArrowRight, Zap, HardDrive, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataRecord {
  id: string;
  userId: number;
  region: string;
  timestamp: number;
  shardId: number;
}

interface Shard {
  id: number;
  name: string;
  records: DataRecord[];
  load: number;
}

const regions = ["US-East", "US-West", "EU-West", "EU-East", "Asia-Pacific"];

const DatabaseShardingDemo = () => {
  const [shardCount, setShardCount] = useState(4);
  const [shardKey, setShardKey] = useState<"userId" | "region" | "hash">("userId");
  const [shards, setShards] = useState<Shard[]>([]);
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [isInserting, setIsInserting] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<DataRecord | null>(null);
  const [stats, setStats] = useState({ totalRecords: 0, avgLoad: 0, maxLoad: 0, minLoad: 0 });

  // Initialize shards
  useEffect(() => {
    const newShards: Shard[] = Array.from({ length: shardCount }, (_, i) => ({
      id: i,
      name: `Shard ${i + 1}`,
      records: [],
      load: 0,
    }));
    setShards(newShards);
    setRecords([]);
  }, [shardCount]);

  // Calculate shard for a record
  const calculateShard = useCallback((record: Omit<DataRecord, "shardId">): number => {
    switch (shardKey) {
      case "userId":
        return record.userId % shardCount;
      case "region":
        return regions.indexOf(record.region) % shardCount;
      case "hash":
        // Simple hash function
        const hash = record.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return hash % shardCount;
      default:
        return 0;
    }
  }, [shardKey, shardCount]);

  // Insert a record
  const insertRecord = useCallback(() => {
    const newRecord: Omit<DataRecord, "shardId"> = {
      id: Math.random().toString(36).substr(2, 9),
      userId: Math.floor(Math.random() * 1000),
      region: regions[Math.floor(Math.random() * regions.length)],
      timestamp: Date.now(),
    };

    const shardId = calculateShard(newRecord);
    const fullRecord: DataRecord = { ...newRecord, shardId };

    setIsInserting(true);
    setPendingRecord(fullRecord);

    setTimeout(() => {
      setShards(prev => prev.map(shard => 
        shard.id === shardId 
          ? { ...shard, records: [...shard.records, fullRecord], load: shard.load + 1 }
          : shard
      ));
      setRecords(prev => [...prev, fullRecord]);
      setIsInserting(false);
      setPendingRecord(null);
    }, 500);
  }, [calculateShard]);

  // Bulk insert
  const bulkInsert = useCallback(() => {
    const insertNext = (count: number) => {
      if (count <= 0) return;
      insertRecord();
      setTimeout(() => insertNext(count - 1), 100);
    };
    insertNext(20);
  }, [insertRecord]);

  // Update stats
  useEffect(() => {
    const loads = shards.map(s => s.load);
    const total = loads.reduce((a, b) => a + b, 0);
    setStats({
      totalRecords: total,
      avgLoad: total / shardCount,
      maxLoad: Math.max(...loads, 0),
      minLoad: Math.min(...loads, 0),
    });
  }, [shards, shardCount]);

  const getLoadColor = (load: number) => {
    const maxLoad = Math.max(...shards.map(s => s.load), 1);
    const ratio = load / maxLoad;
    if (ratio > 0.8) return "text-red-400";
    if (ratio > 0.5) return "text-yellow-400";
    return "text-emerald-400";
  };

  const getBalanceScore = () => {
    if (stats.maxLoad === 0) return 100;
    const variance = stats.maxLoad - stats.minLoad;
    const score = Math.max(0, 100 - (variance / stats.avgLoad) * 20);
    return Math.round(score);
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 mb-4">
            <HardDrive className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400 text-sm font-medium">Horizontal Scaling</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Database Sharding
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Partition data across multiple database instances for horizontal scaling.
            Choose different shard keys to see how data distribution changes.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-400" />
              Sharding Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Number of Shards: {shardCount}
                </label>
                <Slider
                  value={[shardCount]}
                  onValueChange={([v]) => setShardCount(v)}
                  min={2}
                  max={8}
                  step={1}
                  className="py-2"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Shard Key Strategy
                </label>
                <Select value={shardKey} onValueChange={(v) => setShardKey(v as typeof shardKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="userId">User ID (Modulo)</SelectItem>
                    <SelectItem value="region">Region (Range)</SelectItem>
                    <SelectItem value="hash">Hash-based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={insertRecord} disabled={isInserting} className="flex-1">
                  <Zap className="w-4 h-4 mr-2" />
                  Insert Record
                </Button>
                <Button onClick={bulkInsert} variant="outline" className="flex-1">
                  Bulk Insert (20)
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 pt-4 border-t border-border/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Records</span>
                <span className="font-mono text-foreground">{stats.totalRecords}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg per Shard</span>
                <span className="font-mono text-foreground">{stats.avgLoad.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance Score</span>
                <span className={`font-mono ${getBalanceScore() > 70 ? "text-emerald-400" : getBalanceScore() > 40 ? "text-yellow-400" : "text-red-400"}`}>
                  {getBalanceScore()}%
                </span>
              </div>
            </div>

            {/* Educational tooltip */}
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-xs text-orange-300">
                <strong>Why Sharding?</strong> Single databases hit limits. Sharding splits data 
                across multiple instances, enabling near-infinite horizontal scaling.
              </p>
            </div>
          </div>

          {/* Visualization */}
          <div className="lg:col-span-2 glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-400" />
              Shard Distribution
            </h3>

            {/* Pending record animation */}
            <AnimatePresence>
              {pendingRecord && (
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="mb-4 p-3 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center gap-3"
                >
                  <Hash className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-mono text-foreground">
                    Routing record (userId: {pendingRecord.userId}, region: {pendingRecord.region})
                  </span>
                  <ArrowRight className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span className="text-sm text-orange-400">Shard {pendingRecord.shardId + 1}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Shards grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shards.map((shard) => (
                <motion.div
                  key={shard.id}
                  layout
                  className={`p-4 rounded-lg border ${
                    pendingRecord?.shardId === shard.id 
                      ? "border-orange-500 bg-orange-500/10" 
                      : "border-border/50 bg-card/30"
                  } transition-colors`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Database className={`w-4 h-4 ${getLoadColor(shard.load)}`} />
                      <span className="text-sm font-medium text-foreground">{shard.name}</span>
                    </div>
                    <span className={`font-mono text-sm ${getLoadColor(shard.load)}`}>
                      {shard.load}
                    </span>
                  </div>

                  {/* Load bar */}
                  <div className="h-2 bg-background/50 rounded-full overflow-hidden mb-3">
                    <motion.div
                      className={`h-full ${
                        shard.load / (stats.maxLoad || 1) > 0.8 
                          ? "bg-red-500" 
                          : shard.load / (stats.maxLoad || 1) > 0.5 
                            ? "bg-yellow-500" 
                            : "bg-emerald-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(shard.load / (stats.maxLoad || 1)) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  {/* Recent records */}
                  <div className="space-y-1 max-h-24 overflow-hidden">
                    <AnimatePresence mode="popLayout">
                      {shard.records.slice(-3).map((record) => (
                        <motion.div
                          key={record.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-xs font-mono text-muted-foreground truncate"
                        >
                          {record.id.slice(0, 6)}... | {record.region}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Shard key explanation */}
            <div className="mt-6 p-4 rounded-lg bg-card/30 border border-border/50">
              <h4 className="text-sm font-semibold text-foreground mb-2">Current Strategy: {shardKey}</h4>
              <p className="text-xs text-muted-foreground">
                {shardKey === "userId" && "Records are distributed based on userId % shardCount. Good for even distribution when user IDs are sequential."}
                {shardKey === "region" && "Records are partitioned by geographic region. Ideal for data locality but may cause hotspots if traffic is region-heavy."}
                {shardKey === "hash" && "A hash function distributes records uniformly. Best for balanced load but loses ordering benefits."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DatabaseShardingDemo;
