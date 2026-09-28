import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Play, RotateCcw, Plus, Trash2, Info, Clock, Zap } from "lucide-react";

interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color: string;
}

interface GanttBlock {
  processId: string;
  start: number;
  end: number;
  color: string;
}

const COLORS = [
  "hsl(180 80% 55%)", "hsl(280 80% 60%)", "hsl(45 100% 55%)",
  "hsl(0 85% 60%)", "hsl(142 70% 45%)", "hsl(200 100% 50%)",
  "hsl(320 80% 55%)", "hsl(30 90% 55%)"
];

type Algorithm = 'fcfs' | 'sjf' | 'rr' | 'priority';

const defaultProcesses: Process[] = [
  { id: "P1", arrivalTime: 0, burstTime: 6, priority: 3, color: COLORS[0] },
  { id: "P2", arrivalTime: 1, burstTime: 4, priority: 1, color: COLORS[1] },
  { id: "P3", arrivalTime: 2, burstTime: 2, priority: 4, color: COLORS[2] },
  { id: "P4", arrivalTime: 3, burstTime: 3, priority: 2, color: COLORS[3] },
];

function scheduleFCFS(procs: Process[]): GanttBlock[] {
  const sorted = [...procs].sort((a, b) => a.arrivalTime - b.arrivalTime);
  const blocks: GanttBlock[] = [];
  let time = 0;
  for (const p of sorted) {
    const start = Math.max(time, p.arrivalTime);
    blocks.push({ processId: p.id, start, end: start + p.burstTime, color: p.color });
    time = start + p.burstTime;
  }
  return blocks;
}

function scheduleSJF(procs: Process[]): GanttBlock[] {
  const remaining = procs.map(p => ({ ...p, remaining: p.burstTime }));
  const blocks: GanttBlock[] = [];
  let time = 0;
  const done = new Set<string>();
  while (done.size < procs.length) {
    const available = remaining.filter(p => !done.has(p.id) && p.arrivalTime <= time);
    if (available.length === 0) { time++; continue; }
    available.sort((a, b) => a.remaining - b.remaining);
    const next = available[0];
    blocks.push({ processId: next.id, start: time, end: time + next.remaining, color: next.color });
    time += next.remaining;
    done.add(next.id);
  }
  return blocks;
}

function scheduleRR(procs: Process[], quantum: number): GanttBlock[] {
  const remaining = procs.map(p => ({ ...p, rem: p.burstTime }));
  remaining.sort((a, b) => a.arrivalTime - b.arrivalTime);
  const blocks: GanttBlock[] = [];
  const queue: typeof remaining = [];
  let time = 0;
  let idx = 0;
  // Add initially available
  while (idx < remaining.length && remaining[idx].arrivalTime <= time) {
    queue.push(remaining[idx]); idx++;
  }
  while (queue.length > 0 || idx < remaining.length) {
    if (queue.length === 0) { time = remaining[idx].arrivalTime; while (idx < remaining.length && remaining[idx].arrivalTime <= time) { queue.push(remaining[idx]); idx++; } continue; }
    const current = queue.shift()!;
    const execTime = Math.min(quantum, current.rem);
    blocks.push({ processId: current.id, start: time, end: time + execTime, color: current.color });
    time += execTime;
    current.rem -= execTime;
    // Add newly arrived processes
    while (idx < remaining.length && remaining[idx].arrivalTime <= time) { queue.push(remaining[idx]); idx++; }
    if (current.rem > 0) queue.push(current);
  }
  return blocks;
}

function schedulePriority(procs: Process[]): GanttBlock[] {
  const remaining = [...procs];
  const blocks: GanttBlock[] = [];
  let time = 0;
  const done = new Set<string>();
  while (done.size < procs.length) {
    const available = remaining.filter(p => !done.has(p.id) && p.arrivalTime <= time);
    if (available.length === 0) { time++; continue; }
    available.sort((a, b) => a.priority - b.priority);
    const next = available[0];
    blocks.push({ processId: next.id, start: time, end: time + next.burstTime, color: next.color });
    time += next.burstTime;
    done.add(next.id);
  }
  return blocks;
}

function computeMetrics(procs: Process[], blocks: GanttBlock[]) {
  return procs.map(p => {
    const pBlocks = blocks.filter(b => b.processId === p.id);
    const completionTime = Math.max(...pBlocks.map(b => b.end));
    const turnaroundTime = completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    return { id: p.id, completionTime, turnaroundTime, waitingTime };
  });
}

const ProcessSchedulingDemo = () => {
  const [processes, setProcesses] = useState<Process[]>(defaultProcesses);
  const [algorithm, setAlgorithm] = useState<Algorithm>('fcfs');
  const [quantum, setQuantum] = useState(2);
  const [hasRun, setHasRun] = useState(false);

  const gantt = useMemo(() => {
    if (!hasRun) return [];
    switch (algorithm) {
      case 'fcfs': return scheduleFCFS(processes);
      case 'sjf': return scheduleSJF(processes);
      case 'rr': return scheduleRR(processes, quantum);
      case 'priority': return schedulePriority(processes);
    }
  }, [processes, algorithm, quantum, hasRun]);

  const metrics = useMemo(() => hasRun ? computeMetrics(processes, gantt) : [], [processes, gantt, hasRun]);
  const avgWait = metrics.length > 0 ? (metrics.reduce((s, m) => s + m.waitingTime, 0) / metrics.length).toFixed(2) : '—';
  const avgTAT = metrics.length > 0 ? (metrics.reduce((s, m) => s + m.turnaroundTime, 0) / metrics.length).toFixed(2) : '—';
  const totalTime = gantt.length > 0 ? Math.max(...gantt.map(b => b.end)) : 0;

  const addProcess = () => {
    const id = `P${processes.length + 1}`;
    setProcesses(prev => [...prev, { id, arrivalTime: 0, burstTime: Math.floor(Math.random() * 6) + 1, priority: Math.floor(Math.random() * 5) + 1, color: COLORS[processes.length % COLORS.length] }]);
    setHasRun(false);
  };

  const removeProcess = (id: string) => {
    setProcesses(prev => prev.filter(p => p.id !== id));
    setHasRun(false);
  };

  const reset = () => { setProcesses(defaultProcesses); setHasRun(false); };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <Cpu className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">CPU Scheduling</span> Algorithms
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Visualize how different CPU scheduling algorithms allocate processor time to processes.
          Compare FCFS, SJF, Round Robin, and Priority scheduling.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> Configuration</h3>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Algorithm</label>
            <div className="grid grid-cols-2 gap-2">
              {([['fcfs', 'FCFS'], ['sjf', 'SJF (Non-Preemptive)'], ['rr', 'Round Robin'], ['priority', 'Priority']] as const).map(([val, label]) => (
                <button key={val} onClick={() => { setAlgorithm(val); setHasRun(false); }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${algorithm === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/40 text-muted-foreground hover:border-primary/40'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {algorithm === 'rr' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Time Quantum</span>
                <span className="font-mono text-primary">{quantum}</span>
              </div>
              <input type="range" min={1} max={6} value={quantum} onChange={e => { setQuantum(Number(e.target.value)); setHasRun(false); }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Processes</label>
              <button onClick={addProcess} className="text-xs flex items-center gap-1 text-primary hover:underline"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {processes.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border text-xs">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="font-mono font-bold w-8">{p.id}</span>
                  <div className="flex-1 grid grid-cols-3 gap-1">
                    <div>
                      <span className="text-muted-foreground">AT:</span>
                      <input type="number" min={0} max={20} value={p.arrivalTime}
                        onChange={e => { setProcesses(prev => prev.map(x => x.id === p.id ? { ...x, arrivalTime: Number(e.target.value) } : x)); setHasRun(false); }}
                        className="w-10 bg-transparent border-b border-border text-center font-mono ml-1" />
                    </div>
                    <div>
                      <span className="text-muted-foreground">BT:</span>
                      <input type="number" min={1} max={20} value={p.burstTime}
                        onChange={e => { setProcesses(prev => prev.map(x => x.id === p.id ? { ...x, burstTime: Number(e.target.value) } : x)); setHasRun(false); }}
                        className="w-10 bg-transparent border-b border-border text-center font-mono ml-1" />
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pr:</span>
                      <input type="number" min={1} max={10} value={p.priority}
                        onChange={e => { setProcesses(prev => prev.map(x => x.id === p.id ? { ...x, priority: Number(e.target.value) } : x)); setHasRun(false); }}
                        className="w-10 bg-transparent border-b border-border text-center font-mono ml-1" />
                    </div>
                  </div>
                  {processes.length > 2 && (
                    <button onClick={() => removeProcess(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setHasRun(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">
              <Play className="w-4 h-4" /> Schedule
            </button>
            <button onClick={reset}
              className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-muted-foreground">
                <strong className="text-foreground">AT</strong> = Arrival Time, <strong className="text-foreground">BT</strong> = Burst Time, <strong className="text-foreground">Pr</strong> = Priority (lower = higher priority)
              </div>
            </div>
          </div>
        </div>

        {/* Gantt Chart & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gantt Chart */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Gantt Chart</h3>
            {!hasRun ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
                Configure processes and click <span className="text-primary font-medium mx-1">Schedule</span> to visualize
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-0.5 items-end min-h-[80px] overflow-x-auto pb-6 relative">
                  {gantt.map((block, i) => {
                    const width = Math.max(((block.end - block.start) / totalTime) * 100, 4);
                    return (
                      <motion.div key={i} initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }} style={{ width: `${width}%`, backgroundColor: block.color + '30', borderColor: block.color }}
                        className="relative h-16 rounded-lg border-2 flex items-center justify-center origin-bottom">
                        <span className="font-mono text-xs font-bold">{block.processId}</span>
                        <span className="absolute -bottom-5 left-0 text-[10px] font-mono text-muted-foreground">{block.start}</span>
                        {i === gantt.length - 1 && (
                          <span className="absolute -bottom-5 right-0 text-[10px] font-mono text-muted-foreground">{block.end}</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Metrics Table */}
          <AnimatePresence>
            {hasRun && metrics.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-warning" /> Results</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 px-3 text-left">Process</th>
                        <th className="py-2 px-3 text-right">Arrival</th>
                        <th className="py-2 px-3 text-right">Burst</th>
                        <th className="py-2 px-3 text-right">Completion</th>
                        <th className="py-2 px-3 text-right">Turnaround</th>
                        <th className="py-2 px-3 text-right">Waiting</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m, i) => {
                        const p = processes.find(x => x.id === m.id)!;
                        return (
                          <motion.tr key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }} className="border-b border-border/50">
                            <td className="py-2 px-3 flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                              <span className="font-mono font-bold">{m.id}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono">{p.arrivalTime}</td>
                            <td className="py-2 px-3 text-right font-mono">{p.burstTime}</td>
                            <td className="py-2 px-3 text-right font-mono text-primary">{m.completionTime}</td>
                            <td className="py-2 px-3 text-right font-mono text-accent">{m.turnaroundTime}</td>
                            <td className="py-2 px-3 text-right font-mono text-warning">{m.waitingTime}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Avg Waiting Time</div>
                    <div className="text-2xl font-bold font-mono text-warning">{avgWait}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Avg Turnaround Time</div>
                    <div className="text-2xl font-bold font-mono text-accent">{avgTAT}</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ProcessSchedulingDemo;
