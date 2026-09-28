import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryStick, Play, RotateCcw, Info, CheckCircle, XCircle } from "lucide-react";

type Algorithm = 'fifo' | 'lru' | 'optimal';

interface FrameState {
  frames: (number | null)[];
  hit: boolean;
  page: number;
}

function simulateFIFO(pages: number[], frameCount: number): FrameState[] {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const result: FrameState[] = [];
  let pointer = 0;
  for (const page of pages) {
    if (frames.includes(page)) {
      result.push({ frames: [...frames], hit: true, page });
    } else {
      frames[pointer % frameCount] = page;
      pointer++;
      result.push({ frames: [...frames], hit: false, page });
    }
  }
  return result;
}

function simulateLRU(pages: number[], frameCount: number): FrameState[] {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const result: FrameState[] = [];
  const recent: number[] = [];
  for (const page of pages) {
    if (frames.includes(page)) {
      recent.splice(recent.indexOf(page), 1);
      recent.push(page);
      result.push({ frames: [...frames], hit: true, page });
    } else {
      if (frames.includes(null)) {
        const idx = frames.indexOf(null);
        frames[idx] = page;
      } else {
        const lru = recent.shift()!;
        const idx = frames.indexOf(lru);
        frames[idx] = page;
      }
      recent.push(page);
      result.push({ frames: [...frames], hit: false, page });
    }
  }
  return result;
}

function simulateOptimal(pages: number[], frameCount: number): FrameState[] {
  const frames: (number | null)[] = Array(frameCount).fill(null);
  const result: FrameState[] = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (frames.includes(page)) {
      result.push({ frames: [...frames], hit: true, page });
    } else {
      if (frames.includes(null)) {
        const idx = frames.indexOf(null);
        frames[idx] = page;
      } else {
        let farthest = -1, replaceIdx = 0;
        for (let f = 0; f < frameCount; f++) {
          const nextUse = pages.slice(i + 1).indexOf(frames[f]!);
          if (nextUse === -1) { replaceIdx = f; break; }
          if (nextUse > farthest) { farthest = nextUse; replaceIdx = f; }
        }
        frames[replaceIdx] = page;
      }
      result.push({ frames: [...frames], hit: false, page });
    }
  }
  return result;
}

const defaultPages = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];

const PageReplacementDemo = () => {
  const [algorithm, setAlgorithm] = useState<Algorithm>('fifo');
  const [frameCount, setFrameCount] = useState(3);
  const [pageString, setPageString] = useState(defaultPages.join(', '));
  const [hasRun, setHasRun] = useState(false);
  const [step, setStep] = useState(0);

  const pages = useMemo(() => pageString.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)), [pageString]);

  const simulation = useMemo(() => {
    if (!hasRun) return [];
    switch (algorithm) {
      case 'fifo': return simulateFIFO(pages, frameCount);
      case 'lru': return simulateLRU(pages, frameCount);
      case 'optimal': return simulateOptimal(pages, frameCount);
    }
  }, [pages, frameCount, algorithm, hasRun]);

  const hits = simulation.filter(s => s.hit).length;
  const faults = simulation.filter(s => !s.hit).length;
  const hitRatio = simulation.length > 0 ? ((hits / simulation.length) * 100).toFixed(1) : '—';

  const run = () => { setHasRun(true); setStep(0); };
  const reset = () => { setHasRun(false); setStep(0); setPageString(defaultPages.join(', ')); };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <MemoryStick className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">Page Replacement</span> Algorithms
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Simulate how the OS decides which page to evict from memory when a page fault occurs.
          Compare FIFO, LRU, and Optimal algorithms.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><MemoryStick className="w-4 h-4 text-primary" /> Configuration</h3>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Algorithm</label>
            <div className="space-y-2">
              {([['fifo', 'FIFO (First In First Out)'], ['lru', 'LRU (Least Recently Used)'], ['optimal', 'Optimal (Bélády\'s)']] as const).map(([val, label]) => (
                <button key={val} onClick={() => { setAlgorithm(val); setHasRun(false); }}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all border text-left ${algorithm === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/40 text-muted-foreground hover:border-primary/40'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Frames</span>
              <span className="font-mono text-primary">{frameCount}</span>
            </div>
            <input type="range" min={2} max={5} value={frameCount} onChange={e => { setFrameCount(Number(e.target.value)); setHasRun(false); }}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Page Reference String</label>
            <textarea value={pageString} onChange={e => { setPageString(e.target.value); setHasRun(false); }}
              className="w-full h-20 bg-muted/30 border border-border rounded-lg p-2 text-xs font-mono resize-none focus:outline-none focus:border-primary"
              placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4" />
          </div>

          <div className="flex gap-2">
            <button onClick={run} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
              <Play className="w-4 h-4" /> Simulate
            </button>
            <button onClick={reset} className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-muted-foreground">
                <strong className="text-foreground">Page Fault</strong> occurs when a requested page is not in memory and must be loaded from disk, potentially evicting another page.
              </div>
            </div>
          </div>
        </div>

        {/* Simulation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <AnimatePresence>
            {hasRun && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Page Faults</div>
                  <div className="text-3xl font-bold font-mono text-destructive">{faults}</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Page Hits</div>
                  <div className="text-3xl font-bold font-mono text-success">{hits}</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Hit Ratio</div>
                  <div className="text-3xl font-bold font-mono text-primary">{hitRatio}%</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step-by-step table */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Frame States</h3>
              {hasRun && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                    className="px-2 py-1 rounded text-xs border border-border disabled:opacity-30">Prev</button>
                  <span className="font-mono text-xs text-muted-foreground">{step + 1}/{simulation.length}</span>
                  <button onClick={() => setStep(Math.min(simulation.length - 1, step + 1))} disabled={step >= simulation.length - 1}
                    className="px-2 py-1 rounded text-xs border border-border disabled:opacity-30">Next</button>
                  <button onClick={() => setStep(simulation.length - 1)}
                    className="px-2 py-1 rounded text-xs border border-border text-primary">All</button>
                </div>
              )}
            </div>

            {!hasRun ? (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                Configure and click <span className="text-primary font-medium mx-1">Simulate</span> to see page replacement in action
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {simulation.slice(0, step + 1).map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }} className="flex flex-col items-center gap-1 min-w-[42px]">
                      {/* Page number */}
                      <div className={`text-xs font-mono font-bold px-2 py-1 rounded ${s.hit ? 'text-success' : 'text-destructive'}`}>
                        {s.page}
                      </div>
                      {/* Frames */}
                      {s.frames.map((f, fi) => (
                        <div key={fi}
                          className={`w-10 h-10 rounded border flex items-center justify-center font-mono text-xs font-bold transition-all ${
                            f !== null ? 'border-primary/50 bg-primary/10 text-foreground' : 'border-border bg-muted/20 text-muted-foreground'
                          }`}>
                          {f !== null ? f : '—'}
                        </div>
                      ))}
                      {/* Hit/Miss */}
                      <div className="flex items-center gap-0.5">
                        {s.hit ? <CheckCircle className="w-3 h-3 text-success" /> : <XCircle className="w-3 h-3 text-destructive" />}
                        <span className={`text-[9px] font-mono ${s.hit ? 'text-success' : 'text-destructive'}`}>
                          {s.hit ? 'HIT' : 'MISS'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageReplacementDemo;
