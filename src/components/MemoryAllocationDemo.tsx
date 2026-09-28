import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryStick, Play, RotateCcw, Info, Plus, Trash2 } from "lucide-react";

type Algorithm = 'first-fit' | 'best-fit' | 'worst-fit';

interface MemBlock {
  id: number;
  size: number;
  allocated: string | null;
}

interface ProcessReq {
  id: string;
  size: number;
  color: string;
}

const COLORS = ["hsl(180 80% 55%)", "hsl(280 80% 60%)", "hsl(45 100% 55%)", "hsl(0 85% 60%)", "hsl(142 70% 45%)", "hsl(200 100% 50%)", "hsl(320 80% 55%)"];

const defaultBlocks: MemBlock[] = [
  { id: 1, size: 100, allocated: null },
  { id: 2, size: 500, allocated: null },
  { id: 3, size: 200, allocated: null },
  { id: 4, size: 300, allocated: null },
  { id: 5, size: 600, allocated: null },
];

const defaultProcesses: ProcessReq[] = [
  { id: "P1", size: 212, color: COLORS[0] },
  { id: "P2", size: 417, color: COLORS[1] },
  { id: "P3", size: 112, color: COLORS[2] },
  { id: "P4", size: 426, color: COLORS[3] },
];

function allocate(blocks: MemBlock[], processes: ProcessReq[], algo: Algorithm): { result: MemBlock[]; assignments: { processId: string; blockId: number | null; fragmentation: number }[] } {
  const mem = blocks.map(b => ({ ...b }));
  const assignments: { processId: string; blockId: number | null; fragmentation: number }[] = [];

  for (const proc of processes) {
    let bestIdx = -1;
    const available = mem.filter(b => b.allocated === null && b.size >= proc.size);

    if (available.length === 0) {
      assignments.push({ processId: proc.id, blockId: null, fragmentation: 0 });
      continue;
    }

    if (algo === 'first-fit') {
      bestIdx = mem.findIndex(b => b.allocated === null && b.size >= proc.size);
    } else if (algo === 'best-fit') {
      let minDiff = Infinity;
      mem.forEach((b, i) => {
        if (b.allocated === null && b.size >= proc.size && (b.size - proc.size) < minDiff) {
          minDiff = b.size - proc.size;
          bestIdx = i;
        }
      });
    } else {
      let maxDiff = -1;
      mem.forEach((b, i) => {
        if (b.allocated === null && b.size >= proc.size && (b.size - proc.size) > maxDiff) {
          maxDiff = b.size - proc.size;
          bestIdx = i;
        }
      });
    }

    if (bestIdx !== -1) {
      mem[bestIdx].allocated = proc.id;
      assignments.push({ processId: proc.id, blockId: mem[bestIdx].id, fragmentation: mem[bestIdx].size - proc.size });
    } else {
      assignments.push({ processId: proc.id, blockId: null, fragmentation: 0 });
    }
  }

  return { result: mem, assignments };
}

const MemoryAllocationDemo = () => {
  const [blocks, setBlocks] = useState<MemBlock[]>(defaultBlocks);
  const [processes, setProcesses] = useState<ProcessReq[]>(defaultProcesses);
  const [algorithm, setAlgorithm] = useState<Algorithm>('first-fit');
  const [hasRun, setHasRun] = useState(false);

  const { result, assignments } = useMemo(() => {
    if (!hasRun) return { result: blocks, assignments: [] };
    return allocate(blocks, processes, algorithm);
  }, [blocks, processes, algorithm, hasRun]);

  const totalFrag = assignments.reduce((s, a) => s + a.fragmentation, 0);
  const totalMem = blocks.reduce((s, b) => s + b.size, 0);

  const addBlock = () => {
    setBlocks(prev => [...prev, { id: prev.length + 1, size: Math.floor(Math.random() * 400) + 100, allocated: null }]);
    setHasRun(false);
  };

  const addProcess = () => {
    const id = `P${processes.length + 1}`;
    setProcesses(prev => [...prev, { id, size: Math.floor(Math.random() * 300) + 50, color: COLORS[processes.length % COLORS.length] }]);
    setHasRun(false);
  };

  const reset = () => { setBlocks(defaultBlocks); setProcesses(defaultProcesses); setHasRun(false); };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <MemoryStick className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">Memory Allocation</span> Strategies
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Visualize how the OS allocates memory blocks to processes.
          Compare First Fit, Best Fit, and Worst Fit strategies.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><MemoryStick className="w-4 h-4 text-primary" /> Configuration</h3>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Algorithm</label>
            <div className="space-y-2">
              {([['first-fit', 'First Fit'], ['best-fit', 'Best Fit'], ['worst-fit', 'Worst Fit']] as const).map(([val, label]) => (
                <button key={val} onClick={() => { setAlgorithm(val); setHasRun(false); }}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all border text-left ${algorithm === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/40 text-muted-foreground hover:border-primary/40'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Memory Blocks</span>
              <button onClick={addBlock} className="text-xs flex items-center gap-1 text-primary hover:underline"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {blocks.map((b, i) => (
                <div key={b.id} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-muted-foreground w-8">B{b.id}</span>
                  <input type="number" min={50} max={1000} value={b.size}
                    onChange={e => { setBlocks(prev => prev.map((x, j) => j === i ? { ...x, size: Number(e.target.value) } : x)); setHasRun(false); }}
                    className="flex-1 bg-muted/30 border border-border rounded px-2 py-1 font-mono text-center focus:outline-none focus:border-primary" />
                  <span className="text-muted-foreground">KB</span>
                  {blocks.length > 2 && <button onClick={() => { setBlocks(prev => prev.filter((_, j) => j !== i)); setHasRun(false); }}><Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Processes</span>
              <button onClick={addProcess} className="text-xs flex items-center gap-1 text-primary hover:underline"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {processes.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="font-mono w-8">{p.id}</span>
                  <input type="number" min={10} max={800} value={p.size}
                    onChange={e => { setProcesses(prev => prev.map((x, j) => j === i ? { ...x, size: Number(e.target.value) } : x)); setHasRun(false); }}
                    className="flex-1 bg-muted/30 border border-border rounded px-2 py-1 font-mono text-center focus:outline-none focus:border-primary" />
                  <span className="text-muted-foreground">KB</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setHasRun(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
              <Play className="w-4 h-4" /> Allocate
            </button>
            <button onClick={reset} className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-muted-foreground">
                <strong className="text-foreground">First Fit:</strong> First block that fits. <strong className="text-foreground">Best Fit:</strong> Smallest fitting block. <strong className="text-foreground">Worst Fit:</strong> Largest fitting block.
              </div>
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Memory visual */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Memory Map</h3>
            <div className="space-y-2">
              {(hasRun ? result : blocks).map((b, i) => {
                const proc = b.allocated ? processes.find(p => p.id === b.allocated) : null;
                const widthPct = (b.size / totalMem) * 100;
                return (
                  <motion.div key={b.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground w-8">B{b.id}</span>
                    <div className="flex-1 relative">
                      <div className="h-12 rounded-lg border border-border bg-muted/20 overflow-hidden relative">
                        {proc ? (
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(processes.find(p => p.id === b.allocated)!.size / b.size) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="h-full rounded-l-lg flex items-center px-3"
                            style={{ backgroundColor: proc.color + '40', borderRight: `2px solid ${proc.color}` }}>
                            <span className="font-mono text-xs font-bold">{b.allocated}</span>
                          </motion.div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Free</div>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground w-16 text-right">{b.size} KB</span>
                    {hasRun && proc && (
                      <span className="font-mono text-[10px] text-warning w-20 text-right">frag: {b.size - processes.find(p => p.id === b.allocated)!.size} KB</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Results */}
          <AnimatePresence>
            {hasRun && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <h3 className="font-semibold mb-4">Allocation Results</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="text-xs text-muted-foreground">Internal Fragmentation</div>
                    <div className="text-2xl font-bold font-mono text-warning">{totalFrag} KB</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="text-xs text-muted-foreground">Allocation Rate</div>
                    <div className="text-2xl font-bold font-mono text-success">
                      {assignments.filter(a => a.blockId !== null).length}/{processes.length}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {assignments.map((a, i) => {
                    const proc = processes.find(p => p.id === a.processId)!;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`flex items-center gap-3 p-2 rounded-lg border text-sm ${a.blockId ? 'border-border bg-muted/10' : 'border-destructive/30 bg-destructive/10'}`}>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: proc.color }} />
                        <span className="font-mono font-bold">{a.processId}</span>
                        <span className="text-muted-foreground">({proc.size} KB)</span>
                        <span className="text-muted-foreground">→</span>
                        {a.blockId ? (
                          <><span className="text-success font-mono">Block {a.blockId}</span><span className="text-warning text-xs ml-auto font-mono">frag: {a.fragmentation} KB</span></>
                        ) : (
                          <span className="text-destructive">Not allocated (no suitable block)</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MemoryAllocationDemo;
