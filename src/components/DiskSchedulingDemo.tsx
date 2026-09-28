import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardDrive, Play, RotateCcw, Info, ArrowRight } from "lucide-react";

type Algorithm = 'fcfs' | 'sstf' | 'scan' | 'cscan';

function diskFCFS(requests: number[], head: number): { order: number[]; totalSeek: number; path: number[] } {
  const path = [head, ...requests];
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.abs(path[i] - path[i - 1]);
  return { order: requests, totalSeek: total, path };
}

function diskSSTF(requests: number[], head: number): { order: number[]; totalSeek: number; path: number[] } {
  const remaining = [...requests];
  const order: number[] = [];
  const path = [head];
  let pos = head;
  let total = 0;
  while (remaining.length > 0) {
    let minDist = Infinity, minIdx = 0;
    for (let i = 0; i < remaining.length; i++) {
      const dist = Math.abs(remaining[i] - pos);
      if (dist < minDist) { minDist = dist; minIdx = i; }
    }
    pos = remaining[minIdx];
    total += minDist;
    order.push(pos);
    path.push(pos);
    remaining.splice(minIdx, 1);
  }
  return { order, totalSeek: total, path };
}

function diskSCAN(requests: number[], head: number, maxCylinder: number): { order: number[]; totalSeek: number; path: number[] } {
  const left = requests.filter(r => r < head).sort((a, b) => b - a);
  const right = requests.filter(r => r >= head).sort((a, b) => a - b);
  const order = [...right, maxCylinder, ...left];
  const pathOrder = [head, ...right, maxCylinder, ...left];
  const path = pathOrder.filter((v, i) => i === 0 || v !== pathOrder[i - 1]);
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.abs(path[i] - path[i - 1]);
  return { order: order.filter(o => requests.includes(o)), totalSeek: total, path };
}

function diskCSCAN(requests: number[], head: number, maxCylinder: number): { order: number[]; totalSeek: number; path: number[] } {
  const left = requests.filter(r => r < head).sort((a, b) => a - b);
  const right = requests.filter(r => r >= head).sort((a, b) => a - b);
  const pathOrder = [head, ...right, maxCylinder, 0, ...left];
  const path = pathOrder.filter((v, i) => i === 0 || v !== pathOrder[i - 1]);
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.abs(path[i] - path[i - 1]);
  return { order: [...right, ...left].filter(o => requests.includes(o)), totalSeek: total, path };
}

const defaultRequests = [98, 183, 37, 122, 14, 124, 65, 67];
const MAX_CYLINDER = 199;

const DiskSchedulingDemo = () => {
  const [algorithm, setAlgorithm] = useState<Algorithm>('fcfs');
  const [head, setHead] = useState(53);
  const [requestStr, setRequestStr] = useState(defaultRequests.join(', '));
  const [hasRun, setHasRun] = useState(false);

  const requests = useMemo(() => requestStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 0 && n <= MAX_CYLINDER), [requestStr]);

  const result = useMemo(() => {
    if (!hasRun) return null;
    switch (algorithm) {
      case 'fcfs': return diskFCFS(requests, head);
      case 'sstf': return diskSSTF(requests, head);
      case 'scan': return diskSCAN(requests, head, MAX_CYLINDER);
      case 'cscan': return diskCSCAN(requests, head, MAX_CYLINDER);
    }
  }, [requests, head, algorithm, hasRun]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <HardDrive className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">Disk Scheduling</span> Algorithms
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Visualize how the OS schedules disk I/O requests to minimize seek time.
          Compare FCFS, SSTF, SCAN, and C-SCAN.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><HardDrive className="w-4 h-4 text-primary" /> Configuration</h3>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Algorithm</label>
            <div className="grid grid-cols-2 gap-2">
              {([['fcfs', 'FCFS'], ['sstf', 'SSTF'], ['scan', 'SCAN (Elevator)'], ['cscan', 'C-SCAN']] as const).map(([val, label]) => (
                <button key={val} onClick={() => { setAlgorithm(val); setHasRun(false); }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${algorithm === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/40 text-muted-foreground hover:border-primary/40'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Head Position</span>
              <span className="font-mono text-primary">{head}</span>
            </div>
            <input type="range" min={0} max={MAX_CYLINDER} value={head} onChange={e => { setHead(Number(e.target.value)); setHasRun(false); }}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Request Queue (0–{MAX_CYLINDER})</label>
            <textarea value={requestStr} onChange={e => { setRequestStr(e.target.value); setHasRun(false); }}
              className="w-full h-16 bg-muted/30 border border-border rounded-lg p-2 text-xs font-mono resize-none focus:outline-none focus:border-primary"
              placeholder="e.g. 98, 183, 37, 122" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setHasRun(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
              <Play className="w-4 h-4" /> Schedule
            </button>
            <button onClick={() => { setHasRun(false); setRequestStr(defaultRequests.join(', ')); setHead(53); }}
              className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-4 text-center">
                <div className="text-xs text-muted-foreground">Total Seek Time</div>
                <div className="text-3xl font-bold font-mono text-primary">{result.totalSeek}</div>
                <div className="text-xs text-muted-foreground">cylinders</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-muted-foreground">
                <strong className="text-foreground">SSTF</strong> picks the closest request (like SJF). <strong className="text-foreground">SCAN</strong> moves in one direction then reverses. <strong className="text-foreground">C-SCAN</strong> always goes in one direction then jumps back.
              </div>
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Disk track visual */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">Disk Cylinder Map</h3>
            <div className="relative h-12 bg-muted/30 rounded-lg border border-border mb-2">
              {/* Head position */}
              <motion.div className="absolute top-0 h-full w-1 bg-primary rounded" style={{ left: `${(head / MAX_CYLINDER) * 100}%` }}
                animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
              {/* Requests */}
              {requests.map((r, i) => (
                <div key={i} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-accent bg-accent/30"
                  style={{ left: `${(r / MAX_CYLINDER) * 100}%` }}>
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground">{r}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>0</span><span>{MAX_CYLINDER}</span>
            </div>
          </div>

          {/* Head movement path */}
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
              <h3 className="font-semibold mb-4">Head Movement Path</h3>

              {/* Visual path */}
              <div className="relative">
                {result.path.map((pos, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }} className="flex items-center gap-3 mb-2">
                    <span className="w-8 text-right text-[10px] font-mono text-muted-foreground">{i === 0 ? 'HEAD' : `#${i}`}</span>
                    <div className="flex-1 relative h-6">
                      <div className="absolute inset-y-0 left-0 right-0 bg-muted/20 rounded" />
                      <motion.div className="absolute top-0 h-full rounded flex items-center justify-center"
                        initial={{ width: 0 }} animate={{ width: `${(pos / MAX_CYLINDER) * 100}%` }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                        style={{ backgroundColor: i === 0 ? 'hsl(var(--primary))' : requests.includes(pos) ? 'hsl(var(--accent))' : 'hsl(var(--muted-foreground))' }}>
                      </motion.div>
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold">{pos}</span>
                    </div>
                    {i > 0 && (
                      <span className="text-[10px] font-mono text-warning w-12 text-right">+{Math.abs(pos - result.path[i - 1])}</span>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Service order */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">Service Order:</div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-mono font-bold">{head}</span>
                  {result.order.map((r, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-mono font-bold">{r}</span>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiskSchedulingDemo;
