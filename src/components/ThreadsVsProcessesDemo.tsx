import { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Layers, Zap, MemoryStick, Clock, ArrowRight, ShieldCheck, ShieldAlert, Info } from "lucide-react";

const ThreadsVsProcessesDemo = () => {
  const [view, setView] = useState<'compare' | 'simulate'>('compare');
  const [processCount, setProcessCount] = useState(3);
  const [threadCount, setThreadCount] = useState(3);

  const comparisons = [
    { feature: "Memory Space", process: "Separate address space", thread: "Shared address space", processIcon: "🔒", threadIcon: "🔓" },
    { feature: "Creation Time", process: "~10ms (heavy)", thread: "~1ms (lightweight)", processIcon: "🐢", threadIcon: "⚡" },
    { feature: "Context Switch", process: "~1-10ms (expensive)", thread: "~0.1ms (fast)", processIcon: "🐢", threadIcon: "⚡" },
    { feature: "Communication", process: "IPC (pipes, sockets, shared mem)", thread: "Direct shared memory", processIcon: "📬", threadIcon: "📝" },
    { feature: "Isolation", process: "Full isolation (crash-safe)", thread: "No isolation (shared crash)", processIcon: "🛡️", threadIcon: "⚠️" },
    { feature: "Resource Usage", process: "High (own stack, heap, code)", thread: "Low (shared code, heap)", processIcon: "📦", threadIcon: "📎" },
    { feature: "Scalability", process: "Multi-core (separate CPUs)", thread: "Multi-core (same process)", processIcon: "🖥️", threadIcon: "🧵" },
    { feature: "Example Use", process: "Chrome tabs, microservices", thread: "Web server request handling", processIcon: "🌐", threadIcon: "🔄" },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <Layers className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">Threads vs Processes</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Understand the fundamental differences between processes and threads,
          and when to use each for concurrent programming.
        </p>
      </motion.div>

      {/* View Tabs */}
      <div className="flex justify-center gap-2">
        {(['compare', 'simulate'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${view === v ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/40 text-muted-foreground'}`}>
            {v === 'compare' ? 'Comparison Table' : 'Memory Model'}
          </button>
        ))}
      </div>

      {view === 'compare' ? (
        <div className="glass-card p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-left text-muted-foreground">Feature</th>
                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" /> Process
                  </div>
                </th>
                <th className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Layers className="w-4 h-4 text-accent" /> Thread
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <motion.tr key={row.feature} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }} className="border-b border-border/50 hover:bg-muted/10">
                  <td className="py-3 px-4 font-medium">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span>{row.processIcon}</span>
                      <span className="text-muted-foreground">{row.process}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-2 text-xs">
                      <span>{row.threadIcon}</span>
                      <span className="text-muted-foreground">{row.thread}</span>
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Processes */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> Multi-Process Model</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setProcessCount(Math.max(1, processCount - 1))} className="w-6 h-6 rounded border border-border flex items-center justify-center text-xs">-</button>
                <span className="font-mono text-sm text-primary">{processCount}</span>
                <button onClick={() => setProcessCount(Math.min(5, processCount + 1))} className="w-6 h-6 rounded border border-border flex items-center justify-center text-xs">+</button>
              </div>
            </div>

            <div className="space-y-3">
              {Array.from({ length: processCount }).map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                      <Cpu className="w-3 h-3 text-primary" />
                    </div>
                    <span className="font-mono text-xs font-bold">Process {i + 1} (PID: {1000 + i})</span>
                    <ShieldCheck className="w-3 h-3 text-success ml-auto" />
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['Code', 'Heap', 'Stack', 'Data'].map(seg => (
                      <div key={seg} className="p-2 rounded bg-primary/10 border border-primary/20 text-center">
                        <div className="text-[9px] text-muted-foreground">{seg}</div>
                        <MemoryStick className="w-3 h-3 mx-auto text-primary mt-0.5" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-success" /> Isolated address space
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-3 h-3 text-success" /> <strong className="text-foreground">Pros:</strong></div>
              <p>Full memory isolation, crash safety, multi-core utilization</p>
              <div className="flex items-center gap-2 mt-2 mb-1"><ShieldAlert className="w-3 h-3 text-warning" /> <strong className="text-foreground">Cons:</strong></div>
              <p>High memory overhead, slow context switch, complex IPC</p>
            </div>
          </div>

          {/* Threads */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Layers className="w-4 h-4 text-accent" /> Multi-Thread Model</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setThreadCount(Math.max(1, threadCount - 1))} className="w-6 h-6 rounded border border-border flex items-center justify-center text-xs">-</button>
                <span className="font-mono text-sm text-accent">{threadCount}</span>
                <button onClick={() => setThreadCount(Math.min(6, threadCount + 1))} className="w-6 h-6 rounded border border-border flex items-center justify-center text-xs">+</button>
              </div>
            </div>

            <div className="p-4 rounded-xl border-2 border-accent/30 bg-accent/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                  <Cpu className="w-3 h-3 text-accent" />
                </div>
                <span className="font-mono text-xs font-bold">Process (PID: 1000)</span>
              </div>

              {/* Shared segments */}
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {['Code (shared)', 'Heap (shared)', 'Data (shared)'].map(seg => (
                  <div key={seg} className="p-2 rounded bg-accent/10 border border-accent/20 text-center">
                    <div className="text-[9px] text-muted-foreground">{seg}</div>
                    <MemoryStick className="w-3 h-3 mx-auto text-accent mt-0.5" />
                  </div>
                ))}
              </div>

              {/* Thread stacks */}
              <div className="border-t border-border/50 pt-3">
                <div className="text-[10px] text-muted-foreground mb-2">Thread-private stacks:</div>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: threadCount }).map((_, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex-1 min-w-[60px] p-2 rounded bg-accent/15 border border-accent/30 text-center">
                      <Layers className="w-3 h-3 mx-auto text-accent" />
                      <div className="text-[9px] font-mono mt-1">T{i + 1}</div>
                      <div className="text-[8px] text-muted-foreground">Stack</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3 text-warning" /> Shared address space — fast communication
              </div>
            </div>

            {/* Context switch comparison */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <Clock className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <div className="text-xs text-muted-foreground">Context Switch</div>
                <div className="text-lg font-bold font-mono text-success">~0.1ms</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-center">
                <MemoryStick className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <div className="text-xs text-muted-foreground">Memory Overhead</div>
                <div className="text-lg font-bold font-mono text-success">Low</div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-3 h-3 text-success" /> <strong className="text-foreground">Pros:</strong></div>
              <p>Low overhead, fast context switch, shared memory communication</p>
              <div className="flex items-center gap-2 mt-2 mb-1"><ShieldAlert className="w-3 h-3 text-warning" /> <strong className="text-foreground">Cons:</strong></div>
              <p>No isolation, race conditions, one thread crash kills all</p>
            </div>
          </div>
        </div>
      )}

      {/* Key takeaway */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2"><Info className="w-4 h-4 text-primary" /> When to Use What?</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
            <div className="font-semibold text-sm mb-2 flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> Use Processes When:</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-primary" /> Isolation is critical (browser tabs, microservices)</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-primary" /> Crash of one shouldn't affect others</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-primary" /> Security boundaries needed</li>
            </ul>
          </div>
          <div className="p-4 rounded-lg border border-accent/30 bg-accent/5">
            <div className="font-semibold text-sm mb-2 flex items-center gap-2"><Layers className="w-4 h-4 text-accent" /> Use Threads When:</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-accent" /> Need to share data frequently</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-accent" /> Low latency communication required</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-accent" /> I/O-bound tasks (web servers, file processing)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreadsVsProcessesDemo;
