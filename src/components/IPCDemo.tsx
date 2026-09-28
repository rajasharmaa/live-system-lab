import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Info, Network, Play, Pause, RotateCcw } from "lucide-react";

type Mode = 'pipe' | 'shared-memory' | 'message-passing';

const IPCDemo = () => {
  const [mode, setMode] = useState<Mode>('pipe');
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<{ text: string; from: string; to: string; id: number }[]>([]);
  const [sharedData, setSharedData] = useState<string[]>([]);
  const [pipeBuffer, setPipeBuffer] = useState<string[]>([]);
  const [logs, setLogs] = useState<{ text: string; type: 'send' | 'recv' | 'info' }[]>([]);
  const counter = useRef(0);
  const logsRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type: 'send' | 'recv' | 'info') => {
    setLogs(prev => [...prev.slice(-25), { text, type }]);
  };

  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      counter.current++;

      if (mode === 'pipe') {
        if (Math.random() < 0.6) {
          const msg = `data_${counter.current}`;
          setPipeBuffer(prev => {
            if (prev.length >= 8) {
              addLog('Pipe buffer full — writer blocked', 'info');
              return prev;
            }
            addLog(`Writer → pipe: "${msg}"`, 'send');
            return [...prev, msg];
          });
        } else {
          setPipeBuffer(prev => {
            if (prev.length === 0) {
              addLog('Pipe empty — reader blocked', 'info');
              return prev;
            }
            const [first, ...rest] = prev;
            addLog(`Reader ← pipe: "${first}"`, 'recv');
            return rest;
          });
        }
      } else if (mode === 'shared-memory') {
        const key = `key_${counter.current % 4}`;
        const val = `val_${counter.current}`;
        if (Math.random() < 0.5) {
          setSharedData(prev => {
            const next = [...prev];
            const idx = next.findIndex(s => s.startsWith(key + '='));
            if (idx >= 0) next[idx] = `${key}=${val}`; else next.push(`${key}=${val}`);
            addLog(`Process A writes: ${key}=${val}`, 'send');
            return next.slice(-6);
          });
        } else {
          if (sharedData.length > 0) {
            const entry = sharedData[Math.floor(Math.random() * sharedData.length)];
            addLog(`Process B reads: ${entry}`, 'recv');
          } else {
            addLog('Process B: shared memory empty', 'info');
          }
        }
      } else {
        // Message passing
        const from = Math.random() < 0.5 ? 'P1' : 'P2';
        const to = from === 'P1' ? 'P2' : 'P1';
        if (Math.random() < 0.6) {
          const msg = { text: `msg_${counter.current}`, from, to, id: counter.current };
          setMessages(prev => [...prev.slice(-5), msg]);
          addLog(`${from} → send(${to}, "${msg.text}")`, 'send');
        } else if (messages.length > 0) {
          const msg = messages[0];
          setMessages(prev => prev.slice(1));
          addLog(`${msg.to} ← recv("${msg.text}") from ${msg.from}`, 'recv');
        }
      }
    }, 800);

    return () => clearInterval(interval);
  }, [running, mode, sharedData, messages, pipeBuffer]);

  useEffect(() => {
    logsRef.current?.scrollTo(0, logsRef.current.scrollHeight);
  }, [logs]);

  const reset = () => {
    setRunning(false);
    setMessages([]);
    setSharedData([]);
    setPipeBuffer([]);
    setLogs([]);
    counter.current = 0;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <Network className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">Inter-Process Communication</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Visualize how processes communicate: Pipes, Shared Memory, and Message Passing.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><Network className="w-4 h-4 text-primary" /> IPC Method</h3>
          <div className="space-y-2">
            {([['pipe', 'Pipe (Unidirectional)'], ['shared-memory', 'Shared Memory'], ['message-passing', 'Message Passing']] as const).map(([val, label]) => (
              <button key={val} onClick={() => { setMode(val); reset(); }}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all border text-left ${mode === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/40 text-muted-foreground hover:border-primary/40'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setRunning(!running)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm ${running ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground'}`}>
              {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
            </button>
            <button onClick={reset} className="px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-muted-foreground">
                {mode === 'pipe' && <><strong className="text-foreground">Pipes:</strong> One-way byte stream between related processes. Writer pushes data, reader pulls it. Blocking when full or empty.</>}
                {mode === 'shared-memory' && <><strong className="text-foreground">Shared Memory:</strong> Fastest IPC — processes map the same physical memory. Needs synchronization (mutex/semaphore) to avoid races.</>}
                {mode === 'message-passing' && <><strong className="text-foreground">Message Passing:</strong> Processes send/receive structured messages via the kernel. No shared state, but involves copy overhead.</>}
              </div>
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-4">
              {mode === 'pipe' ? 'Pipe Communication' : mode === 'shared-memory' ? 'Shared Memory Region' : 'Message Queue'}
            </h3>

            {mode === 'pipe' && (
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl border-2 border-success/30 bg-success/5 text-center flex-shrink-0">
                  <div className="text-xs text-muted-foreground">Writer</div>
                  <div className="font-mono font-bold text-success text-lg">P1</div>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <div className="flex gap-1 h-12 bg-muted/20 rounded-lg border border-border p-1 overflow-hidden">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div key={i}
                          className={`flex-1 rounded flex items-center justify-center text-[8px] font-mono transition-all ${pipeBuffer[i] ? 'bg-primary/20 border border-primary/30 text-primary' : 'border border-dashed border-border'}`}>
                          {pipeBuffer[i] ? '●' : ''}
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-center text-[10px] text-muted-foreground mt-1 font-mono">
                      buffer: {pipeBuffer.length}/8
                    </div>
                  </div>
                  <div className="flex justify-center mt-1">
                    <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="p-4 rounded-xl border-2 border-accent/30 bg-accent/5 text-center flex-shrink-0">
                  <div className="text-xs text-muted-foreground">Reader</div>
                  <div className="font-mono font-bold text-accent text-lg">P2</div>
                </div>
              </div>
            )}

            {mode === 'shared-memory' && (
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl border-2 border-success/30 bg-success/5 text-center flex-shrink-0">
                  <div className="text-xs text-muted-foreground">Writer</div>
                  <div className="font-mono font-bold text-success text-lg">P1</div>
                </div>
                <div className="flex-1 p-4 rounded-xl border-2 border-warning/30 bg-warning/5">
                  <div className="text-xs text-center text-muted-foreground mb-2 font-mono">SHARED MEMORY REGION</div>
                  <div className="space-y-1">
                    {sharedData.length === 0 ? (
                      <div className="text-center text-muted-foreground text-xs py-4">Empty</div>
                    ) : sharedData.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="px-2 py-1 bg-warning/10 rounded text-xs font-mono text-warning border border-warning/20">
                        {s}
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl border-2 border-accent/30 bg-accent/5 text-center flex-shrink-0">
                  <div className="text-xs text-muted-foreground">Reader</div>
                  <div className="font-mono font-bold text-accent text-lg">P2</div>
                </div>
              </div>
            )}

            {mode === 'message-passing' && (
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-xl border-2 border-success/30 bg-success/5 text-center flex-shrink-0">
                  <div className="font-mono font-bold text-success text-lg">P1</div>
                  <div className="text-[10px] text-muted-foreground">send() / recv()</div>
                </div>
                <div className="flex-1">
                  <div className="p-3 rounded-xl border border-border bg-muted/10">
                    <div className="text-[10px] text-center text-muted-foreground mb-2 font-mono">KERNEL MESSAGE QUEUE</div>
                    <div className="space-y-1 min-h-[60px]">
                      {messages.map(m => (
                        <motion.div key={m.id} initial={{ opacity: 0, x: m.from === 'P1' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-xs">
                          <span className="text-success font-mono">{m.from}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-accent font-mono">{m.to}</span>
                          <span className="text-muted-foreground ml-auto font-mono">{m.text}</span>
                        </motion.div>
                      ))}
                      {messages.length === 0 && <div className="text-center text-muted-foreground text-xs py-2">Empty</div>}
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl border-2 border-accent/30 bg-accent/5 text-center flex-shrink-0">
                  <div className="font-mono font-bold text-accent text-lg">P2</div>
                  <div className="text-[10px] text-muted-foreground">send() / recv()</div>
                </div>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-3">Event Log</h3>
            <div ref={logsRef} className="h-40 overflow-y-auto space-y-1 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">Click Start to begin simulation</div>
              ) : logs.map((l, i) => (
                <div key={i} className={l.type === 'send' ? 'text-success' : l.type === 'recv' ? 'text-accent' : 'text-warning'}>
                  {l.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPCDemo;
