import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HardDrive, Play, RotateCcw, Info, ArrowRight } from "lucide-react";

type Method = 'contiguous' | 'linked' | 'indexed';

interface FileEntry {
  name: string;
  size: number;
  color: string;
}

const COLORS = ["hsl(180 80% 55%)", "hsl(280 80% 60%)", "hsl(45 100% 55%)", "hsl(0 85% 60%)", "hsl(142 70% 45%)"];
const TOTAL_BLOCKS = 20;

const defaultFiles: FileEntry[] = [
  { name: "readme.txt", size: 3, color: COLORS[0] },
  { name: "app.js", size: 4, color: COLORS[1] },
  { name: "data.csv", size: 5, color: COLORS[2] },
  { name: "image.png", size: 3, color: COLORS[3] },
];

interface BlockAllocation {
  blockId: number;
  file: string | null;
  color: string | null;
  next: number | null; // for linked
}

function allocateContiguous(files: FileEntry[]): { blocks: BlockAllocation[]; directory: { name: string; start: number; length: number }[]; fragmentation: number } {
  const blocks: BlockAllocation[] = Array.from({ length: TOTAL_BLOCKS }, (_, i) => ({ blockId: i, file: null, color: null, next: null }));
  const directory: { name: string; start: number; length: number }[] = [];
  let pos = 0;
  for (const f of files) {
    if (pos + f.size > TOTAL_BLOCKS) break;
    for (let i = pos; i < pos + f.size; i++) {
      blocks[i] = { blockId: i, file: f.name, color: f.color, next: null };
    }
    directory.push({ name: f.name, start: pos, length: f.size });
    pos += f.size;
  }
  const fragmentation = TOTAL_BLOCKS - pos;
  return { blocks, directory, fragmentation };
}

function allocateLinked(files: FileEntry[]): { blocks: BlockAllocation[]; directory: { name: string; start: number; length: number }[]; fragmentation: number } {
  const blocks: BlockAllocation[] = Array.from({ length: TOTAL_BLOCKS }, (_, i) => ({ blockId: i, file: null, color: null, next: null }));
  const directory: { name: string; start: number; length: number }[] = [];
  // Scatter blocks
  const available = Array.from({ length: TOTAL_BLOCKS }, (_, i) => i);
  // Shuffle
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  let aIdx = 0;
  for (const f of files) {
    if (aIdx + f.size > available.length) break;
    const fileBlocks = available.slice(aIdx, aIdx + f.size);
    directory.push({ name: f.name, start: fileBlocks[0], length: f.size });
    for (let i = 0; i < fileBlocks.length; i++) {
      blocks[fileBlocks[i]] = {
        blockId: fileBlocks[i],
        file: f.name,
        color: f.color,
        next: i < fileBlocks.length - 1 ? fileBlocks[i + 1] : null,
      };
    }
    aIdx += f.size;
  }
  return { blocks, directory, fragmentation: TOTAL_BLOCKS - aIdx };
}

function allocateIndexed(files: FileEntry[]): { blocks: BlockAllocation[]; directory: { name: string; indexBlock: number; dataBlocks: number[] }[]; fragmentation: number } {
  const blocks: BlockAllocation[] = Array.from({ length: TOTAL_BLOCKS }, (_, i) => ({ blockId: i, file: null, color: null, next: null }));
  const directory: { name: string; indexBlock: number; dataBlocks: number[] }[] = [];
  let pos = 0;
  for (const f of files) {
    if (pos + f.size + 1 > TOTAL_BLOCKS) break;
    // Index block
    const indexBlock = pos;
    blocks[indexBlock] = { blockId: indexBlock, file: `${f.name} [IDX]`, color: f.color, next: null };
    const dataBlocks: number[] = [];
    for (let i = 1; i <= f.size; i++) {
      blocks[pos + i] = { blockId: pos + i, file: f.name, color: f.color, next: null };
      dataBlocks.push(pos + i);
    }
    directory.push({ name: f.name, indexBlock, dataBlocks });
    pos += f.size + 1;
  }
  return { blocks, directory, fragmentation: TOTAL_BLOCKS - pos };
}

const FileAllocationDemo = () => {
  const [method, setMethod] = useState<Method>('contiguous');
  const [files] = useState<FileEntry[]>(defaultFiles);
  const [hasRun, setHasRun] = useState(false);

  const result = useMemo(() => {
    if (!hasRun) return null;
    switch (method) {
      case 'contiguous': return { type: 'contiguous' as const, ...allocateContiguous(files) };
      case 'linked': return { type: 'linked' as const, ...allocateLinked(files) };
      case 'indexed': return { type: 'indexed' as const, ...allocateIndexed(files) };
    }
  }, [files, method, hasRun]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <HardDrive className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">File Allocation</span> Methods
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Visualize how the file system allocates disk blocks to files.
          Compare Contiguous, Linked, and Indexed allocation.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><HardDrive className="w-4 h-4 text-primary" /> Method</h3>
          <div className="space-y-2">
            {([['contiguous', 'Contiguous Allocation'], ['linked', 'Linked Allocation'], ['indexed', 'Indexed Allocation']] as const).map(([val, label]) => (
              <button key={val} onClick={() => { setMethod(val); setHasRun(false); }}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all border text-left ${method === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/40 text-muted-foreground hover:border-primary/40'}`}>
                {label}
              </button>
            ))}
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-2">Files</div>
            <div className="space-y-1.5">
              {files.map(f => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                  <span className="font-mono flex-1">{f.name}</span>
                  <span className="text-muted-foreground">{f.size} blocks</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setHasRun(true)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
              <Play className="w-4 h-4" /> Allocate
            </button>
            <button onClick={() => setHasRun(false)} className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-muted-foreground">
                {method === 'contiguous' && <><strong className="text-foreground">Contiguous:</strong> Each file occupies consecutive blocks. Fast reads, but suffers from external fragmentation.</>}
                {method === 'linked' && <><strong className="text-foreground">Linked:</strong> Each block has a pointer to the next. No fragmentation, but slow random access.</>}
                {method === 'indexed' && <><strong className="text-foreground">Indexed:</strong> An index block stores pointers to all data blocks. Supports random access, but wastes an extra block.</>}
              </div>
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Disk blocks */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Disk Blocks ({TOTAL_BLOCKS} total)</h3>
              {result && (
                <span className="text-xs text-muted-foreground font-mono">Free: {result.fragmentation} blocks</span>
              )}
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {(result ? result.blocks : Array.from({ length: TOTAL_BLOCKS }, (_, i) => ({ blockId: i, file: null, color: null, next: null }))).map((b, i) => (
                <motion.div key={i} initial={hasRun ? { scale: 0.5, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-[8px] font-mono transition-all relative ${
                    b.file ? 'border-opacity-60' : 'border-border border-dashed bg-muted/10'
                  }`}
                  style={b.file ? { backgroundColor: b.color + '20', borderColor: b.color! } : {}}>
                  <span className="text-muted-foreground">{b.blockId}</span>
                  {b.file && <span className="font-bold truncate w-full text-center px-0.5" style={{ color: b.color! }}>
                    {b.file.includes('[IDX]') ? '📋' : '■'}
                  </span>}
                  {b.next !== null && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-warning rounded-full flex items-center justify-center text-[6px] text-warning-foreground font-bold z-10">
                      →
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Directory */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
                <h3 className="font-semibold mb-4">Directory Table</h3>
                {result.type === 'contiguous' && 'directory' in result && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground text-xs">
                        <th className="py-2 px-3 text-left">File</th>
                        <th className="py-2 px-3 text-right">Start Block</th>
                        <th className="py-2 px-3 text-right">Length</th>
                        <th className="py-2 px-3 text-left">Blocks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(result as any).directory.map((d: any, i: number) => {
                        const f = files.find(x => x.name === d.name)!;
                        return (
                          <motion.tr key={d.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                            className="border-b border-border/30">
                            <td className="py-2 px-3 flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                              <span className="font-mono text-xs">{d.name}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-primary">{d.start}</td>
                            <td className="py-2 px-3 text-right font-mono">{d.length}</td>
                            <td className="py-2 px-3">
                              <div className="flex gap-1">
                                {Array.from({ length: d.length }, (_, j) => (
                                  <span key={j} className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: f.color + '20', color: f.color }}>
                                    {d.start + j}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {result.type === 'linked' && 'directory' in result && (
                  <div className="space-y-3">
                    {(result as any).directory.map((d: any, i: number) => {
                      const f = files.find(x => x.name === d.name)!;
                      const chain: number[] = [];
                      let current: number | null = d.start;
                      while (current !== null) {
                        chain.push(current);
                        current = result.blocks[current].next;
                      }
                      return (
                        <motion.div key={d.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }} className="flex items-center gap-2 flex-wrap">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                          <span className="font-mono text-xs font-bold">{d.name}:</span>
                          {chain.map((b, j) => (
                            <span key={j} className="flex items-center gap-1">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: f.color + '20', color: f.color }}>{b}</span>
                              {j < chain.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                            </span>
                          ))}
                          <span className="text-[10px] text-muted-foreground">→ null</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {result.type === 'indexed' && 'directory' in result && (
                  <div className="space-y-4">
                    {(result as any).directory.map((d: any, i: number) => {
                      const f = files.find(x => x.name === d.name)!;
                      return (
                        <motion.div key={d.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }} className="flex items-start gap-3">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: f.color }} />
                          <div>
                            <span className="font-mono text-xs font-bold">{d.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-1 rounded border text-[10px] font-mono bg-warning/10 border-warning/30 text-warning">
                                📋 IDX: {d.indexBlock}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <div className="flex gap-1 flex-wrap">
                                {d.dataBlocks.map((b: number) => (
                                  <span key={b} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: f.color + '20', color: f.color }}>{b}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default FileAllocationDemo;
