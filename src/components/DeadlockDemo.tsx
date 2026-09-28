import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Play, RotateCcw, Info, ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";

interface Resource {
  id: number;
  total: number;
  available: number;
}

interface ProcessState {
  id: number;
  allocation: number[];
  max: number[];
  need: number[];
}

const defaultResources: Resource[] = [
  { id: 0, total: 10, available: 3 },
  { id: 1, total: 5, available: 3 },
  { id: 2, total: 7, available: 2 },
];

const defaultProcesses: ProcessState[] = [
  { id: 0, allocation: [0, 1, 0], max: [7, 5, 3], need: [7, 4, 3] },
  { id: 1, allocation: [2, 0, 0], max: [3, 2, 2], need: [1, 2, 2] },
  { id: 2, allocation: [3, 0, 2], max: [9, 0, 2], need: [6, 0, 0] },
  { id: 3, allocation: [2, 1, 1], max: [2, 2, 2], need: [0, 1, 1] },
  { id: 4, allocation: [0, 0, 2], max: [4, 3, 3], need: [4, 3, 1] },
];

function bankersAlgorithm(processes: ProcessState[], available: number[]): { safe: boolean; sequence: number[]; steps: { processId: number; work: number[]; canRun: boolean }[] } {
  const n = processes.length;
  const m = available.length;
  const work = [...available];
  const finish = Array(n).fill(false);
  const sequence: number[] = [];
  const steps: { processId: number; work: number[]; canRun: boolean }[] = [];
  
  let found = true;
  while (found) {
    found = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;
      const canRun = processes[i].need.every((need, j) => need <= work[j]);
      steps.push({ processId: processes[i].id, work: [...work], canRun });
      if (canRun) {
        for (let j = 0; j < m; j++) work[j] += processes[i].allocation[j];
        finish[i] = true;
        sequence.push(processes[i].id);
        found = true;
      }
    }
  }
  
  return { safe: finish.every(f => f), sequence, steps };
}

const DeadlockDemo = () => {
  const [processes, setProcesses] = useState<ProcessState[]>(defaultProcesses);
  const [available, setAvailable] = useState<number[]>([3, 3, 2]);
  const [hasRun, setHasRun] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  
  const resourceNames = ['A', 'B', 'C'];

  const result = useMemo(() => {
    if (!hasRun) return null;
    return bankersAlgorithm(processes, available);
  }, [processes, available, hasRun]);

  const run = () => { setHasRun(true); setActiveStep(-1); };
  const reset = () => {
    setProcesses(defaultProcesses);
    setAvailable([3, 3, 2]);
    setHasRun(false);
    setActiveStep(-1);
  };

  const updateAllocation = (pIdx: number, rIdx: number, val: number) => {
    setProcesses(prev => prev.map((p, i) => {
      if (i !== pIdx) return p;
      const newAlloc = [...p.allocation];
      newAlloc[rIdx] = val;
      const newNeed = p.max.map((m, j) => m - newAlloc[j]);
      return { ...p, allocation: newAlloc, need: newNeed };
    }));
    setHasRun(false);
  };

  const updateMax = (pIdx: number, rIdx: number, val: number) => {
    setProcesses(prev => prev.map((p, i) => {
      if (i !== pIdx) return p;
      const newMax = [...p.max];
      newMax[rIdx] = val;
      const newNeed = newMax.map((m, j) => m - p.allocation[j]);
      return { ...p, max: newMax, need: newNeed };
    }));
    setHasRun(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <Lock className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">Deadlock Avoidance</span> — Banker's Algorithm
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Simulate the Banker's Algorithm to determine if a system is in a safe state.
          Modify allocations and maximum needs to see how safety changes.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Config */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> Resources</h3>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Available Resources</label>
            <div className="grid grid-cols-3 gap-3">
              {available.map((a, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{resourceNames[i]}</div>
                  <input type="number" min={0} max={10} value={a}
                    onChange={e => { const v = [...available]; v[i] = Number(e.target.value); setAvailable(v); setHasRun(false); }}
                    className="w-full bg-muted/30 border border-border rounded-lg p-2 text-center font-mono text-sm focus:outline-none focus:border-primary" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={run} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
              <Play className="w-4 h-4" /> Check Safety
            </button>
            <button onClick={reset} className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border flex items-start gap-3 ${result.safe ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                {result.safe ? <ShieldCheck className="w-5 h-5 text-success flex-shrink-0 mt-0.5" /> : <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />}
                <div>
                  <div className={`font-semibold text-sm ${result.safe ? 'text-success' : 'text-destructive'}`}>
                    {result.safe ? 'SAFE STATE' : 'UNSAFE STATE — Deadlock Possible!'}
                  </div>
                  {result.safe && (
                    <div className="mt-2 flex items-center gap-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">Sequence:</span>
                      {result.sequence.map((id, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-success/20 text-success rounded text-xs font-mono font-bold">P{id}</span>
                          {i < result.sequence.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-muted-foreground">
                <strong className="text-foreground">Banker's Algorithm</strong> checks if granting a resource request leads to a safe state where all processes can eventually complete.
              </div>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="lg:col-span-2 space-y-6">
          {/* Allocation & Max */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Process Resource Tables</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 px-2 text-left" rowSpan={2}>Process</th>
                    <th className="py-1 px-2 text-center border-b border-border" colSpan={3}>Allocation</th>
                    <th className="py-1 px-2 text-center border-b border-border" colSpan={3}>Maximum</th>
                    <th className="py-1 px-2 text-center border-b border-border" colSpan={3}>Need</th>
                  </tr>
                  <tr className="border-b border-border text-muted-foreground">
                    {[...resourceNames, ...resourceNames, ...resourceNames].map((r, i) => (
                      <th key={i} className="py-1 px-2 text-center text-xs">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processes.map((p, pIdx) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-2 px-2 font-mono font-bold text-primary">P{p.id}</td>
                      {p.allocation.map((a, rIdx) => (
                        <td key={`a${rIdx}`} className="py-1 px-1 text-center">
                          <input type="number" min={0} max={10} value={a}
                            onChange={e => updateAllocation(pIdx, rIdx, Number(e.target.value))}
                            className="w-10 bg-transparent border-b border-border text-center font-mono text-sm focus:outline-none focus:border-primary" />
                        </td>
                      ))}
                      {p.max.map((m, rIdx) => (
                        <td key={`m${rIdx}`} className="py-1 px-1 text-center">
                          <input type="number" min={0} max={10} value={m}
                            onChange={e => updateMax(pIdx, rIdx, Number(e.target.value))}
                            className="w-10 bg-transparent border-b border-border text-center font-mono text-sm focus:outline-none focus:border-primary" />
                        </td>
                      ))}
                      {p.need.map((n, rIdx) => (
                        <td key={`n${rIdx}`} className="py-1 px-1 text-center">
                          <span className={`font-mono text-sm ${n < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{n}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Execution Steps */}
          <AnimatePresence>
            {result && result.safe && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <h3 className="font-semibold mb-4">Execution Trace</h3>
                <div className="space-y-2">
                  {result.sequence.map((pid, i) => {
                    const proc = processes.find(p => p.id === pid)!;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        onMouseEnter={() => setActiveStep(i)} onMouseLeave={() => setActiveStep(-1)}
                        className={`p-3 rounded-lg border transition-all cursor-default ${activeStep === i ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                            <span className="font-mono font-bold">P{pid}</span>
                            <span className="text-xs text-muted-foreground">executes and releases</span>
                            <span className="font-mono text-xs text-success">[{proc.allocation.join(', ')}]</span>
                          </div>
                          <ShieldCheck className="w-4 h-4 text-success" />
                        </div>
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

export default DeadlockDemo;
