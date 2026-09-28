import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryStick, Play, RotateCcw, Info, ArrowRight, CheckCircle, XCircle, Layers } from "lucide-react";

interface PageTableEntry {
  pageNo: number;
  frameNo: number | null;
  valid: boolean;
  dirty: boolean;
  referenced: boolean;
}

interface TLBEntry {
  pageNo: number;
  frameNo: number;
}

const VirtualMemoryDemo = () => {
  const [pageCount] = useState(8);
  const [frameCount] = useState(4);
  const [pageTable, setPageTable] = useState<PageTableEntry[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      pageNo: i,
      frameNo: i < 4 ? i : null,
      valid: i < 4,
      dirty: false,
      referenced: i < 4,
    }))
  );
  const [tlb, setTlb] = useState<TLBEntry[]>([
    { pageNo: 0, frameNo: 0 },
    { pageNo: 1, frameNo: 1 },
  ]);
  const [accessLog, setAccessLog] = useState<{ page: number; offset: number; tlbHit: boolean; pageHit: boolean; physAddr: string }[]>([]);
  const [inputPage, setInputPage] = useState(0);
  const [inputOffset, setInputOffset] = useState(0);
  const pageSize = 4096;

  const accessPage = () => {
    const page = inputPage;
    const offset = inputOffset;

    // Check TLB
    const tlbEntry = tlb.find(e => e.pageNo === page);
    if (tlbEntry) {
      const physAddr = `0x${((tlbEntry.frameNo * pageSize) + offset).toString(16).toUpperCase()}`;
      setAccessLog(prev => [...prev.slice(-15), { page, offset, tlbHit: true, pageHit: true, physAddr }]);
      setPageTable(prev => prev.map(e => e.pageNo === page ? { ...e, referenced: true } : e));
      return;
    }

    // Check page table
    const ptEntry = pageTable.find(e => e.pageNo === page);
    if (ptEntry && ptEntry.valid && ptEntry.frameNo !== null) {
      const physAddr = `0x${((ptEntry.frameNo * pageSize) + offset).toString(16).toUpperCase()}`;
      setAccessLog(prev => [...prev.slice(-15), { page, offset, tlbHit: false, pageHit: true, physAddr }]);
      // Update TLB (FIFO)
      setTlb(prev => {
        const next = [...prev];
        if (next.length >= 4) next.shift();
        next.push({ pageNo: page, frameNo: ptEntry.frameNo! });
        return next;
      });
      setPageTable(prev => prev.map(e => e.pageNo === page ? { ...e, referenced: true } : e));
      return;
    }

    // Page fault!
    // Find a victim frame (FIFO from valid entries)
    const validEntries = pageTable.filter(e => e.valid);
    if (validEntries.length > 0) {
      const victim = validEntries[0];
      const frameNo = victim.frameNo!;
      setPageTable(prev => prev.map(e => {
        if (e.pageNo === victim.pageNo) return { ...e, valid: false, frameNo: null, referenced: false };
        if (e.pageNo === page) return { ...e, valid: true, frameNo, referenced: true };
        return e;
      }));
      const physAddr = `0x${((frameNo * pageSize) + offset).toString(16).toUpperCase()}`;
      setAccessLog(prev => [...prev.slice(-15), { page, offset, tlbHit: false, pageHit: false, physAddr }]);
      // Update TLB
      setTlb(prev => {
        const next = prev.filter(e => e.pageNo !== victim.pageNo);
        if (next.length >= 4) next.shift();
        next.push({ pageNo: page, frameNo });
        return next;
      });
    }
  };

  const reset = () => {
    setPageTable(Array.from({ length: 8 }, (_, i) => ({
      pageNo: i, frameNo: i < 4 ? i : null, valid: i < 4, dirty: false, referenced: i < 4,
    })));
    setTlb([{ pageNo: 0, frameNo: 0 }, { pageNo: 1, frameNo: 1 }]);
    setAccessLog([]);
  };

  const tlbHits = accessLog.filter(a => a.tlbHit).length;
  const pageFaults = accessLog.filter(a => !a.pageHit).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <MemoryStick className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">Virtual Memory</span> & Paging
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Visualize address translation from virtual to physical addresses through TLB and page tables.
          See page faults and TLB hits in action.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><MemoryStick className="w-4 h-4 text-primary" /> Memory Access</h3>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Page Number (0–{pageCount - 1})</label>
            <input type="number" min={0} max={pageCount - 1} value={inputPage}
              onChange={e => setInputPage(Number(e.target.value))}
              className="w-full bg-muted/30 border border-border rounded-lg p-2 font-mono text-sm focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Offset (0–{pageSize - 1})</label>
            <input type="number" min={0} max={pageSize - 1} value={inputOffset}
              onChange={e => setInputOffset(Number(e.target.value))}
              className="w-full bg-muted/30 border border-border rounded-lg p-2 font-mono text-sm focus:outline-none focus:border-primary" />
          </div>

          <div className="flex gap-2">
            <button onClick={accessPage} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
              <Play className="w-4 h-4" /> Access
            </button>
            <button onClick={reset} className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border">
              <div className="text-[10px] text-muted-foreground">Accesses</div>
              <div className="text-lg font-bold font-mono text-primary">{accessLog.length}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border">
              <div className="text-[10px] text-muted-foreground">TLB Hits</div>
              <div className="text-lg font-bold font-mono text-success">{tlbHits}</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/20 border border-border">
              <div className="text-[10px] text-muted-foreground">Page Faults</div>
              <div className="text-lg font-bold font-mono text-destructive">{pageFaults}</div>
            </div>
          </div>

          {/* Translation flow */}
          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="text-[10px] text-muted-foreground font-semibold mb-2">ADDRESS TRANSLATION FLOW:</div>
            <div className="flex items-center gap-1 text-[10px] flex-wrap">
              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded font-mono">Virtual Addr</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="px-2 py-0.5 bg-success/20 text-success rounded font-mono">TLB</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="px-2 py-0.5 bg-accent/20 text-accent rounded font-mono">Page Table</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <span className="px-2 py-0.5 bg-warning/20 text-warning rounded font-mono">Physical Addr</span>
            </div>
          </div>
        </div>

        {/* Tables */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* TLB */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-success" /> TLB (Translation Lookaside Buffer)
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 px-2 text-left">Page #</th>
                    <th className="py-2 px-2 text-right">Frame #</th>
                  </tr>
                </thead>
                <tbody>
                  {tlb.map((e, i) => (
                    <motion.tr key={`${e.pageNo}-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="border-b border-border/30">
                      <td className="py-2 px-2 font-mono font-bold text-success">{e.pageNo}</td>
                      <td className="py-2 px-2 text-right font-mono">{e.frameNo}</td>
                    </motion.tr>
                  ))}
                  {tlb.length === 0 && <tr><td colSpan={2} className="py-4 text-center text-muted-foreground">Empty</td></tr>}
                </tbody>
              </table>
            </div>

            {/* Page Table */}
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <MemoryStick className="w-4 h-4 text-accent" /> Page Table
              </h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 px-1 text-left">Page</th>
                    <th className="py-2 px-1 text-center">Frame</th>
                    <th className="py-2 px-1 text-center">Valid</th>
                    <th className="py-2 px-1 text-center">Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {pageTable.map(e => (
                    <tr key={e.pageNo} className={`border-b border-border/30 ${e.valid ? '' : 'opacity-50'}`}>
                      <td className="py-1.5 px-1 font-mono font-bold">{e.pageNo}</td>
                      <td className="py-1.5 px-1 text-center font-mono">{e.frameNo !== null ? e.frameNo : '—'}</td>
                      <td className="py-1.5 px-1 text-center">
                        {e.valid ? <CheckCircle className="w-3 h-3 text-success mx-auto" /> : <XCircle className="w-3 h-3 text-destructive mx-auto" />}
                      </td>
                      <td className="py-1.5 px-1 text-center">
                        {e.referenced ? <span className="text-success">R</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Access Log */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-3">Access Log</h3>
            {accessLog.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                Enter a page number and click <span className="text-primary font-medium mx-1">Access</span> to simulate
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {accessLog.map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-xs p-2 rounded-lg bg-muted/10 border border-border/30">
                    <span className="font-mono text-muted-foreground w-6">#{i + 1}</span>
                    <span className="font-mono">Page {a.page} + {a.offset}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="font-mono text-primary font-bold">{a.physAddr}</span>
                    <span className="ml-auto flex items-center gap-2">
                      {a.tlbHit ? (
                        <span className="px-2 py-0.5 bg-success/20 text-success rounded text-[10px]">TLB HIT</span>
                      ) : a.pageHit ? (
                        <span className="px-2 py-0.5 bg-accent/20 text-accent rounded text-[10px]">PAGE HIT</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-destructive/20 text-destructive rounded text-[10px]">PAGE FAULT</span>
                      )}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualMemoryDemo;
