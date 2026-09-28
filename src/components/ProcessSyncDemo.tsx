import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Users, Play, Pause, RotateCcw, Info, Package, Inbox } from "lucide-react";

type Mode = 'mutex' | 'semaphore' | 'producer-consumer';

interface BufferItem {
  id: number;
  color: string;
}

const ITEM_COLORS = ["hsl(180 80% 55%)", "hsl(280 80% 60%)", "hsl(45 100% 55%)", "hsl(0 85% 60%)", "hsl(142 70% 45%)", "hsl(200 100% 50%)"];

const ProcessSyncDemo = () => {
  const [mode, setMode] = useState<Mode>('producer-consumer');
  const [running, setRunning] = useState(false);
  const [bufferSize, setBufferSize] = useState(5);
  const [buffer, setBuffer] = useState<BufferItem[]>([]);
  const [producerState, setProducerState] = useState<'idle' | 'producing' | 'waiting'>('idle');
  const [consumerState, setConsumerState] = useState<'idle' | 'consuming' | 'waiting'>('idle');
  const [logs, setLogs] = useState<{ text: string; type: 'info' | 'producer' | 'consumer' | 'warning' }[]>([]);
  const [produced, setProduced] = useState(0);
  const [consumed, setConsumed] = useState(0);
  const itemCounter = useRef(0);
  const logsRef = useRef<HTMLDivElement>(null);

  // Mutex state
  const [mutexLocked, setMutexLocked] = useState(false);
  const [mutexHolder, setMutexHolder] = useState<string | null>(null);
  const [threads, setThreads] = useState([
    { id: 'T1', state: 'idle' as 'idle' | 'waiting' | 'critical' | 'done', counter: 0 },
    { id: 'T2', state: 'idle' as 'idle' | 'waiting' | 'critical' | 'done', counter: 0 },
    { id: 'T3', state: 'idle' as 'idle' | 'waiting' | 'critical' | 'done', counter: 0 },
  ]);
  const [sharedCounter, setSharedCounter] = useState(0);

  // Semaphore state
  const [semValue, setSemValue] = useState(3);
  const [semMax, setSemMax] = useState(3);
  const [semThreads, setSemThreads] = useState([
    { id: 'T1', state: 'idle' as 'idle' | 'waiting' | 'running' | 'done' },
    { id: 'T2', state: 'idle' as 'idle' | 'waiting' | 'running' | 'done' },
    { id: 'T3', state: 'idle' as 'idle' | 'waiting' | 'running' | 'done' },
    { id: 'T4', state: 'idle' as 'idle' | 'waiting' | 'running' | 'done' },
    { id: 'T5', state: 'idle' as 'idle' | 'waiting' | 'running' | 'done' },
  ]);

  const addLog = (text: string, type: 'info' | 'producer' | 'consumer' | 'warning') => {
    setLogs(prev => [...prev.slice(-30), { text, type }]);
  };

  // Producer-Consumer simulation
  useEffect(() => {
    if (!running || mode !== 'producer-consumer') return;
    const interval = setInterval(() => {
      const action = Math.random();
      if (action < 0.55) {
        // Produce
        if (buffer.length >= bufferSize) {
          setProducerState('waiting');
          addLog('Producer waiting — buffer FULL', 'warning');
        } else {
          setProducerState('producing');
          itemCounter.current++;
          const item: BufferItem = { id: itemCounter.current, color: ITEM_COLORS[itemCounter.current % ITEM_COLORS.length] };
          setBuffer(prev => [...prev, item]);
          setProduced(p => p + 1);
          addLog(`Produced item #${item.id}`, 'producer');
          setTimeout(() => setProducerState('idle'), 300);
        }
      } else {
        // Consume
        if (buffer.length === 0) {
          setConsumerState('waiting');
          addLog('Consumer waiting — buffer EMPTY', 'warning');
        } else {
          setConsumerState('consuming');
          const item = buffer[0];
          setBuffer(prev => prev.slice(1));
          setConsumed(c => c + 1);
          addLog(`Consumed item #${item.id}`, 'consumer');
          setTimeout(() => setConsumerState('idle'), 300);
        }
      }
    }, 800);
    return () => clearInterval(interval);
  }, [running, mode, buffer, bufferSize]);

  // Mutex simulation
  useEffect(() => {
    if (!running || mode !== 'mutex') return;
    const interval = setInterval(() => {
      setThreads(prev => {
        const next = [...prev.map(t => ({ ...t }))];
        const idle = next.filter(t => t.state === 'idle' || t.state === 'done');
        const inCritical = next.find(t => t.state === 'critical');
        
        if (inCritical) {
          inCritical.counter++;
          inCritical.state = 'done';
          setMutexLocked(false);
          setMutexHolder(null);
          setSharedCounter(s => s + 1);
          addLog(`${inCritical.id} exits critical section (counter++)`, 'info');
          const waiting = next.find(t => t.state === 'waiting');
          if (waiting) {
            waiting.state = 'critical';
            setMutexLocked(true);
            setMutexHolder(waiting.id);
            addLog(`${waiting.id} acquires mutex → enters critical section`, 'producer');
          }
        } else if (idle.length > 0) {
          const chosen = idle[Math.floor(Math.random() * idle.length)];
          const t = next.find(t => t.id === chosen.id)!;
          if (!mutexLocked) {
            t.state = 'critical';
            setMutexLocked(true);
            setMutexHolder(t.id);
            addLog(`${t.id} acquires mutex → enters critical section`, 'producer');
          } else {
            t.state = 'waiting';
            addLog(`${t.id} waiting for mutex (held by ${mutexHolder})`, 'warning');
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, mode, mutexLocked, mutexHolder]);

  // Semaphore simulation
  useEffect(() => {
    if (!running || mode !== 'semaphore') return;
    const interval = setInterval(() => {
      setSemThreads(prev => {
        const next = [...prev.map(t => ({ ...t }))];
        const runningThreads = next.filter(t => t.state === 'running');
        const idle = next.filter(t => t.state === 'idle' || t.state === 'done');

        // Random: release one running or acquire new
        if (runningThreads.length > 0 && Math.random() < 0.4) {
          const t = runningThreads[Math.floor(Math.random() * runningThreads.length)];
          t.state = 'done';
          setSemValue(v => Math.min(v + 1, semMax));
          addLog(`${t.id} signals semaphore (sem++)`, 'consumer');
        } else if (idle.length > 0) {
          const t = next.find(x => x.id === idle[Math.floor(Math.random() * idle.length)].id)!;
          if (semValue > 0) {
            t.state = 'running';
            setSemValue(v => v - 1);
            addLog(`${t.id} waits on semaphore → enters (sem--)`, 'producer');
          } else {
            t.state = 'waiting';
            addLog(`${t.id} blocked — semaphore is 0`, 'warning');
          }
        }
        return next;
      });
    }, 900);
    return () => clearInterval(interval);
  }, [running, mode, semValue, semMax]);

  useEffect(() => {
    logsRef.current?.scrollTo(0, logsRef.current.scrollHeight);
  }, [logs]);

  const reset = () => {
    setRunning(false);
    setBuffer([]);
    setLogs([]);
    setProduced(0);
    setConsumed(0);
    setProducerState('idle');
    setConsumerState('idle');
    setMutexLocked(false);
    setMutexHolder(null);
    setSharedCounter(0);
    setSemValue(semMax);
    setThreads([
      { id: 'T1', state: 'idle', counter: 0 },
      { id: 'T2', state: 'idle', counter: 0 },
      { id: 'T3', state: 'idle', counter: 0 },
    ]);
    setSemThreads([
      { id: 'T1', state: 'idle' },
      { id: 'T2', state: 'idle' },
      { id: 'T3', state: 'idle' },
      { id: 'T4', state: 'idle' },
      { id: 'T5', state: 'idle' },
    ]);
    itemCounter.current = 0;
  };

  const stateColor = (s: string) => {
    switch (s) {
      case 'producing': case 'critical': case 'running': return 'text-success';
      case 'waiting': return 'text-warning';
      case 'consuming': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
          <Users className="w-4 h-4" /> Operating Systems
        </div>
        <h1 className="text-4xl font-bold mb-3">
          <span className="gradient-text">Process Synchronization</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Visualize synchronization primitives: Mutex locks, Semaphores, and the Producer-Consumer problem.
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="glass-card p-6 space-y-5">
          <h3 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Mode</h3>
          <div className="space-y-2">
            {([['producer-consumer', 'Producer-Consumer'], ['mutex', 'Mutex Lock'], ['semaphore', 'Semaphore']] as const).map(([val, label]) => (
              <button key={val} onClick={() => { setMode(val); reset(); }}
                className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all border text-left ${mode === val ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card/40 text-muted-foreground hover:border-primary/40'}`}>
                {label}
              </button>
            ))}
          </div>

          {mode === 'producer-consumer' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Buffer Size</span>
                <span className="font-mono text-primary">{bufferSize}</span>
              </div>
              <input type="range" min={3} max={10} value={bufferSize} onChange={e => { setBufferSize(Number(e.target.value)); reset(); }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
            </div>
          )}

          {mode === 'semaphore' && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Max Permits</span>
                <span className="font-mono text-primary">{semMax}</span>
              </div>
              <input type="range" min={1} max={4} value={semMax} onChange={e => { setSemMax(Number(e.target.value)); setSemValue(Number(e.target.value)); reset(); }}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" />
            </div>
          )}

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
                {mode === 'producer-consumer' && <><strong className="text-foreground">Producer-Consumer:</strong> Producer adds items to a bounded buffer. Consumer removes them. When full, producer waits. When empty, consumer waits.</>}
                {mode === 'mutex' && <><strong className="text-foreground">Mutex:</strong> Only one thread can hold the lock at a time. Others must wait until the lock is released before entering the critical section.</>}
                {mode === 'semaphore' && <><strong className="text-foreground">Semaphore:</strong> A counting semaphore allows up to N threads to access a shared resource concurrently. When the count is 0, new threads must wait.</>}
              </div>
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {mode === 'producer-consumer' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 text-center">
                  <Package className={`w-6 h-6 mx-auto mb-1 ${stateColor(producerState)}`} />
                  <div className="text-xs text-muted-foreground">Producer</div>
                  <div className={`text-sm font-medium capitalize ${stateColor(producerState)}`}>{producerState}</div>
                  <div className="text-xl font-bold font-mono text-primary mt-1">{produced}</div>
                </div>
                <div className="glass-card p-4 text-center">
                  <Inbox className="w-6 h-6 mx-auto mb-1 text-accent" />
                  <div className="text-xs text-muted-foreground">Buffer</div>
                  <div className="text-sm font-medium text-accent">{buffer.length}/{bufferSize}</div>
                  <div className="w-full h-2 bg-muted rounded-full mt-2">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(buffer.length / bufferSize) * 100}%` }} />
                  </div>
                </div>
                <div className="glass-card p-4 text-center">
                  <Package className={`w-6 h-6 mx-auto mb-1 ${stateColor(consumerState)}`} />
                  <div className="text-xs text-muted-foreground">Consumer</div>
                  <div className={`text-sm font-medium capitalize ${stateColor(consumerState)}`}>{consumerState}</div>
                  <div className="text-xl font-bold font-mono text-primary mt-1">{consumed}</div>
                </div>
              </div>
              {/* Buffer visual */}
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-3">Bounded Buffer</h3>
                <div className="flex gap-2">
                  {Array.from({ length: bufferSize }).map((_, i) => (
                    <motion.div key={i} className={`flex-1 h-14 rounded-lg border-2 flex items-center justify-center transition-all ${buffer[i] ? 'border-primary/50' : 'border-border border-dashed'}`}
                      style={buffer[i] ? { backgroundColor: buffer[i].color + '20', borderColor: buffer[i].color } : {}}>
                      {buffer[i] && <span className="font-mono text-xs font-bold">#{buffer[i].id}</span>}
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'mutex' && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Mutex Lock</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${mutexLocked ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                  {mutexLocked ? `LOCKED by ${mutexHolder}` : 'UNLOCKED'}
                </div>
              </div>
              <div className="text-center mb-4">
                <div className="text-xs text-muted-foreground">Shared Counter</div>
                <div className="text-4xl font-bold font-mono text-primary">{sharedCounter}</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {threads.map(t => (
                  <div key={t.id} className={`p-4 rounded-lg border transition-all ${t.state === 'critical' ? 'border-success bg-success/10' : t.state === 'waiting' ? 'border-warning bg-warning/10' : 'border-border bg-muted/20'}`}>
                    <div className="font-mono font-bold text-center">{t.id}</div>
                    <div className={`text-xs text-center capitalize mt-1 ${stateColor(t.state)}`}>{t.state}</div>
                    <div className="text-xs text-center text-muted-foreground mt-1">ops: {t.counter}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'semaphore' && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Counting Semaphore</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${semValue === 0 ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'}`}>
                  S = {semValue} / {semMax}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {semThreads.map(t => (
                  <div key={t.id} className={`p-3 rounded-lg border text-center transition-all ${t.state === 'running' ? 'border-success bg-success/10' : t.state === 'waiting' ? 'border-warning bg-warning/10' : 'border-border bg-muted/20'}`}>
                    <div className="font-mono font-bold text-sm">{t.id}</div>
                    <div className={`text-[10px] capitalize mt-1 ${stateColor(t.state)}`}>{t.state}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logs */}
          <div className="glass-card p-6">
            <h3 className="font-semibold mb-3">Event Log</h3>
            <div ref={logsRef} className="h-40 overflow-y-auto space-y-1 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">Click Start to begin simulation</div>
              ) : logs.map((l, i) => (
                <div key={i} className={`${l.type === 'producer' ? 'text-success' : l.type === 'consumer' ? 'text-primary' : l.type === 'warning' ? 'text-warning' : 'text-muted-foreground'}`}>
                  <span className="text-muted-foreground/50">[{new Date().toLocaleTimeString()}]</span> {l.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSyncDemo;
