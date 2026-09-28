import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Search, Zap, GitBranch, Hash,
  ArrowRight, Clock, CheckCircle, AlertTriangle, BarChart3
} from "lucide-react";

// B-Tree node structure
interface BTreeNode {
  keys: number[];
  children?: BTreeNode[];
  highlighted?: boolean;
  found?: boolean;
}

const sampleBTree: BTreeNode = {
  keys: [40],
  children: [
    {
      keys: [10, 25],
      children: [
        { keys: [1, 5, 8] },
        { keys: [12, 18, 22] },
        { keys: [28, 35, 38] },
      ],
    },
    {
      keys: [60, 80],
      children: [
        { keys: [42, 50, 55] },
        { keys: [65, 70, 75] },
        { keys: [85, 90, 95] },
      ],
    },
  ],
};

interface HashBucket {
  index: number;
  entries: { key: string; value: string; highlighted?: boolean }[];
}

const hashBuckets: HashBucket[] = [
  { index: 0, entries: [{ key: "alice", value: "row_12" }, { key: "frank", value: "row_67" }] },
  { index: 1, entries: [{ key: "bob", value: "row_34" }] },
  { index: 2, entries: [{ key: "charlie", value: "row_56" }, { key: "grace", value: "row_89" }] },
  { index: 3, entries: [{ key: "david", value: "row_78" }] },
  { index: 4, entries: [] },
  { index: 5, entries: [{ key: "eve", value: "row_45" }] },
  { index: 6, entries: [{ key: "helen", value: "row_23" }] },
  { index: 7, entries: [{ key: "ivan", value: "row_91" }, { key: "judy", value: "row_14" }] },
];

interface QueryPlan {
  query: string;
  steps: { operation: string; cost: string; rows: string; note: string; type: "good" | "bad" | "neutral" }[];
  usesIndex: boolean;
  estimatedTime: string;
}

const queryPlans: QueryPlan[] = [
  {
    query: "SELECT * FROM users WHERE id = 42",
    usesIndex: true,
    estimatedTime: "0.02ms",
    steps: [
      { operation: "Index Scan (B-Tree)", cost: "0.15", rows: "1", note: "Primary key lookup — O(log n)", type: "good" },
      { operation: "Fetch Row", cost: "0.01", rows: "1", note: "Direct pointer to heap", type: "good" },
    ],
  },
  {
    query: "SELECT * FROM users WHERE name = 'alice'",
    usesIndex: true,
    estimatedTime: "0.05ms",
    steps: [
      { operation: "Index Scan (Hash)", cost: "0.10", rows: "1", note: "Hash index on name — O(1)", type: "good" },
      { operation: "Fetch Row", cost: "0.01", rows: "1", note: "Direct bucket lookup", type: "good" },
    ],
  },
  {
    query: "SELECT * FROM users WHERE age > 25 AND age < 40",
    usesIndex: true,
    estimatedTime: "1.2ms",
    steps: [
      { operation: "Index Range Scan (B-Tree)", cost: "2.50", rows: "150", note: "B-Tree supports range queries", type: "good" },
      { operation: "Filter", cost: "0.30", rows: "150", note: "Apply range predicate", type: "neutral" },
    ],
  },
  {
    query: "SELECT * FROM users WHERE UPPER(email) = 'TEST@MAIL.COM'",
    usesIndex: false,
    estimatedTime: "45ms",
    steps: [
      { operation: "Seq Scan (Full Table)", cost: "120.00", rows: "10000", note: "Function on column prevents index use", type: "bad" },
      { operation: "Filter", cost: "15.00", rows: "1", note: "Applied after scanning all rows", type: "bad" },
    ],
  },
];

interface IndexStrategy {
  scenario: string;
  recommended: "btree" | "hash" | "none";
  reason: string;
  icon: React.ElementType;
}

const strategies: IndexStrategy[] = [
  { scenario: "Primary key lookups", recommended: "btree", reason: "Efficient O(log n) lookups, supports uniqueness", icon: Search },
  { scenario: "Exact match queries (WHERE x = y)", recommended: "hash", reason: "O(1) constant time lookups", icon: Hash },
  { scenario: "Range queries (WHERE x BETWEEN a AND b)", recommended: "btree", reason: "B-Tree maintains sorted order for range scans", icon: GitBranch },
  { scenario: "ORDER BY / sorting", recommended: "btree", reason: "B-Tree stores data in sorted order", icon: BarChart3 },
  { scenario: "Low-cardinality columns (e.g., status)", recommended: "none", reason: "Index overhead > sequential scan benefit", icon: AlertTriangle },
  { scenario: "Write-heavy tables", recommended: "none", reason: "Index maintenance slows inserts/updates", icon: Clock },
];

const DatabaseIndexingDemo = () => {
  const [activeTab, setActiveTab] = useState<"btree" | "hash" | "queryplan" | "strategies">("btree");
  const [searchKey, setSearchKey] = useState<number | null>(null);
  const [searchPath, setSearchPath] = useState<number[][]>([]);
  const [foundNode, setFoundNode] = useState<number | null>(null);
  const [hashSearch, setHashSearch] = useState<string>("");
  const [hashResult, setHashResult] = useState<{ bucket: number; found: boolean } | null>(null);
  const [selectedQuery, setSelectedQuery] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  const searchBTree = useCallback((key: number) => {
    setIsSearching(true);
    setFoundNode(null);
    setSearchKey(key);
    const path: number[][] = [];

    const traverse = (node: BTreeNode, depth: number): boolean => {
      path.push([depth, ...node.keys]);
      for (let i = 0; i < node.keys.length; i++) {
        if (key === node.keys[i]) return true;
        if (key < node.keys[i]) {
          if (node.children) return traverse(node.children[i], depth + 1);
          return false;
        }
      }
      if (node.children) return traverse(node.children[node.keys.length], depth + 1);
      return false;
    };

    // Animate step by step
    const found = traverse(sampleBTree, 0);
    setSearchPath([]);

    path.forEach((step, i) => {
      setTimeout(() => {
        setSearchPath(prev => [...prev, step]);
        if (i === path.length - 1) {
          if (found) setFoundNode(key);
          setIsSearching(false);
        }
      }, (i + 1) * 500);
    });
  }, []);

  const searchHash = useCallback((key: string) => {
    if (!key) return;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) % hashBuckets.length;
    }
    const bucket = hashBuckets[hash];
    const found = bucket?.entries.some(e => e.key === key) ?? false;
    setHashResult({ bucket: hash, found });
  }, []);

  const isNodeHighlighted = (depth: number, keys: number[]) => {
    return searchPath.some(p => p[0] === depth && keys.some(k => p.includes(k)));
  };

  const renderBTreeNode = (node: BTreeNode, depth: number, index: number) => {
    const highlighted = isNodeHighlighted(depth, node.keys);
    const hasFound = foundNode !== null && node.keys.includes(foundNode);
    return (
      <div key={`${depth}-${index}`} className="flex flex-col items-center">
        <motion.div
          className={`flex gap-0.5 rounded-lg border px-1 py-1 font-mono text-xs transition-all ${
            hasFound ? "bg-success/20 border-success ring-2 ring-success/40" :
            highlighted ? "bg-primary/20 border-primary ring-2 ring-primary/40" :
            "bg-muted/30 border-border"
          }`}
          animate={highlighted ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {node.keys.map((k, i) => (
            <span key={i} className={`px-2 py-1 rounded ${
              hasFound && k === foundNode ? "bg-success text-success-foreground font-bold" :
              highlighted ? "text-primary" : "text-foreground"
            }`}>
              {k}
            </span>
          ))}
        </motion.div>
        {node.children && (
          <div className="flex gap-4 mt-3 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-3 bg-border -mt-3" />
            {node.children.map((child, i) => (
              <div key={i} className="relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-3 bg-border -mt-3" />
                {renderBTreeNode(child, depth + 1, i)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="py-24 relative">
      <div className="container px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 mb-6">
            <Database className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Database Indexing</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Database Indexing</span> Strategies
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore B-Tree and Hash indexes, analyze query plans, and learn when to use each indexing strategy.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {([
            { id: "btree", label: "B-Tree Index", icon: GitBranch },
            { id: "hash", label: "Hash Index", icon: Hash },
            { id: "queryplan", label: "Query Plans", icon: Search },
            { id: "strategies", label: "Index Selection", icon: Zap },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id ? "bg-accent text-accent-foreground" : "glass-card hover:bg-muted/50"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* B-Tree Tab */}
        {activeTab === "btree" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" /> B-Tree Index Traversal
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Click a value to see how the B-Tree is traversed to find it (O(log n) complexity):</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {[1, 12, 28, 42, 65, 85, 95, 99].map(key => (
                  <button
                    key={key}
                    onClick={() => searchBTree(key)}
                    disabled={isSearching}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-mono transition-all ${
                      searchKey === key ? "bg-primary/20 border-primary text-primary" : "glass-card border-border hover:border-primary/50 text-foreground"
                    } ${isSearching ? "opacity-50" : ""}`}
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* B-Tree visualization */}
              <div className="flex justify-center overflow-x-auto py-6">
                {renderBTreeNode(sampleBTree, 0, 0)}
              </div>

              {/* Search result */}
              <AnimatePresence>
                {searchKey !== null && !isSearching && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-4 p-3 rounded-lg border text-sm font-mono ${
                      foundNode !== null ? "bg-success/10 border-success/30 text-success" : "bg-destructive/10 border-destructive/30 text-destructive"
                    }`}
                  >
                    {foundNode !== null ? (
                      <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Found key {foundNode} in {searchPath.length} steps (depth {searchPath.length - 1})</span>
                    ) : (
                      <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Key {searchKey} not found — traversed {searchPath.length} nodes</span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* B-Tree properties */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Time Complexity", value: "O(log n)", desc: "Balanced tree height" },
                { label: "Supports", value: "Range Queries", desc: "Sorted leaf nodes" },
                { label: "Best For", value: "ORDER BY, BETWEEN", desc: "Sorted data access" },
              ].map(prop => (
                <div key={prop.label} className="glass-card p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{prop.label}</div>
                  <div className="text-lg font-bold text-primary font-mono">{prop.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{prop.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Hash Index Tab */}
        {activeTab === "hash" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <Hash className="w-5 h-5 text-warning" /> Hash Index Lookup
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Type a name to hash it and find the bucket (O(1) average):</p>
              <div className="flex gap-3 mb-6">
                <input
                  type="text"
                  value={hashSearch}
                  onChange={e => { setHashSearch(e.target.value); setHashResult(null); }}
                  placeholder="Try: alice, bob, charlie, david..."
                  className="flex-1 px-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={() => searchHash(hashSearch)}
                  className="px-5 py-2 rounded-lg bg-warning/20 text-warning border border-warning/30 text-sm font-medium hover:bg-warning/30 transition-all"
                >
                  Hash & Lookup
                </button>
              </div>

              {/* Hash buckets */}
              <div className="space-y-2">
                {hashBuckets.map(bucket => {
                  const isTarget = hashResult?.bucket === bucket.index;
                  return (
                    <motion.div
                      key={bucket.index}
                      className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                        isTarget ? "border-warning bg-warning/10 ring-2 ring-warning/30" : "border-border/50"
                      }`}
                      animate={isTarget ? { scale: [1, 1.02, 1] } : {}}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold ${
                        isTarget ? "bg-warning/20 text-warning" : "bg-muted/30 text-muted-foreground"
                      }`}>
                        [{bucket.index}]
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      <div className="flex gap-2 flex-wrap flex-1">
                        {bucket.entries.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">empty</span>
                        ) : (
                          bucket.entries.map(entry => {
                            const isFound = isTarget && entry.key === hashSearch.toLowerCase();
                            return (
                              <span key={entry.key} className={`text-xs px-3 py-1 rounded border font-mono ${
                                isFound ? "bg-success/20 border-success/40 text-success font-bold" : "bg-muted/30 border-border text-foreground"
                              }`}>
                                {entry.key} → {entry.value}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Result */}
              <AnimatePresence>
                {hashResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-3 rounded-lg border text-sm font-mono ${
                      hashResult.found ? "bg-success/10 border-success/30 text-success" : "bg-destructive/10 border-destructive/30 text-destructive"
                    }`}
                  >
                    hash("{hashSearch}") = bucket[{hashResult.bucket}] → {hashResult.found ? "✅ Found!" : "❌ Not found"}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Time Complexity", value: "O(1)", desc: "Constant time average" },
                { label: "Limitation", value: "No Range", desc: "Only exact matches" },
                { label: "Best For", value: "WHERE x = y", desc: "Equality predicates" },
              ].map(prop => (
                <div key={prop.label} className="glass-card p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">{prop.label}</div>
                  <div className="text-lg font-bold text-warning font-mono">{prop.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{prop.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Query Plan Tab */}
        {activeTab === "queryplan" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-secondary" /> Query Plan Analysis
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {queryPlans.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedQuery(i)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                      selectedQuery === i ? "bg-secondary/20 border-secondary text-secondary" : "glass-card border-border text-muted-foreground hover:border-secondary/50"
                    }`}
                  >
                    Query {i + 1}
                  </button>
                ))}
              </div>

              {/* Selected query */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border mb-4">
                <code className="text-sm font-mono text-foreground">{queryPlans[selectedQuery].query}</code>
              </div>

              {/* Plan steps */}
              <div className="space-y-2">
                {queryPlans[selectedQuery].steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${
                      step.type === "good" ? "border-success/30 bg-success/5" :
                      step.type === "bad" ? "border-destructive/30 bg-destructive/5" :
                      "border-border"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${
                        step.type === "good" ? "text-success" : step.type === "bad" ? "text-destructive" : "text-foreground"
                      }`}>{step.operation}</div>
                      <div className="text-xs text-muted-foreground">{step.note}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Cost</div>
                      <div className="text-sm font-mono text-foreground">{step.cost}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Rows</div>
                      <div className="text-sm font-mono text-foreground">{step.rows}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Summary */}
              <div className={`mt-4 p-3 rounded-lg border flex items-center justify-between ${
                queryPlans[selectedQuery].usesIndex ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
              }`}>
                <div className="flex items-center gap-2 text-sm">
                  {queryPlans[selectedQuery].usesIndex ? (
                    <><CheckCircle className="w-4 h-4 text-success" /><span className="text-success font-medium">Uses Index</span></>
                  ) : (
                    <><AlertTriangle className="w-4 h-4 text-destructive" /><span className="text-destructive font-medium">Full Table Scan</span></>
                  )}
                </div>
                <div className="text-sm font-mono">
                  <Clock className="w-3 h-3 inline mr-1 text-muted-foreground" />
                  <span className={queryPlans[selectedQuery].usesIndex ? "text-success" : "text-destructive"}>
                    {queryPlans[selectedQuery].estimatedTime}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Strategies Tab */}
        {activeTab === "strategies" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" /> When to Use Each Index
              </h3>
              <div className="space-y-3">
                {strategies.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/20 transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted/30 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{s.scenario}</div>
                      <div className="text-xs text-muted-foreground">{s.reason}</div>
                    </div>
                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-lg border ${
                      s.recommended === "btree" ? "bg-primary/10 border-primary/30 text-primary" :
                      s.recommended === "hash" ? "bg-warning/10 border-warning/30 text-warning" :
                      "bg-muted/30 border-border text-muted-foreground"
                    }`}>
                      {s.recommended === "none" ? "Skip Index" : s.recommended === "btree" ? "B-Tree" : "Hash"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Comparison table */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4">B-Tree vs Hash — Quick Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground">Feature</th>
                      <th className="text-center py-2 px-3 text-primary font-medium">B-Tree</th>
                      <th className="text-center py-2 px-3 text-warning font-medium">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Exact Match", "O(log n)", "O(1) ✅"],
                      ["Range Queries", "✅ Supported", "❌ Not supported"],
                      ["Sorting", "✅ Natural order", "❌ No order"],
                      ["Space", "Moderate", "Larger (buckets)"],
                      ["Insert Cost", "O(log n)", "O(1) amortized"],
                      ["Default in PostgreSQL", "✅ Yes", "Available"],
                    ].map(([feature, btree, hash]) => (
                      <tr key={feature} className="border-b border-border/50">
                        <td className="py-2 px-3 text-foreground font-medium">{feature}</td>
                        <td className="py-2 px-3 text-center text-primary font-mono text-xs">{btree}</td>
                        <td className="py-2 px-3 text-center text-warning font-mono text-xs">{hash}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DatabaseIndexingDemo;
