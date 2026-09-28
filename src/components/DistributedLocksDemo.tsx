import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Wifi, WifiOff, Clock, Zap, AlertTriangle, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

interface Client {
  id: string;
  name: string;
  color: string;
  status: "idle" | "waiting" | "holding" | "failed";
  acquiredAt?: number;
  expiresAt?: number;
}

interface LogEntry {
  id: string;
  time: string;
  kind: "acquire" | "release" | "expire" | "deny" | "fail" | "recover";
  client: string;
  message: string;
}

const COLORS = ["text-primary", "text-accent", "text-warning", "text-success"];

const initialClients: Client[] = [
  { id: "c1", name: "worker-1", color: COLORS[0], status: "idle" },
  { id: "c2", name: "worker-2", color: COLORS[1], status: "idle" },
  { id: "c3", name: "worker-3", color: COLORS[2], status: "idle" },
  { id: "c4", name: "worker-4", color: COLORS[3], status: "idle" },
];

const TTL_MS = 5000;

const DistributedLocksDemo = () => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [holder, setHolder] = useState<string | null>(null);
  const [holderExpiresAt, setHolderExpiresAt] = useState<number | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [now, setNow] = useState(Date.now());
  const stats = useRef({ acquired: 0, expired: 0, denied: 0, failures: 0 });
  const [, force] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWsConnected(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(i);
  }, []);

  const pushLog = useCallback((entry: Omit<LogEntry, "id" | "time">) => {
    setLog((l) => [{ ...entry, id: Math.random().toString(36), time: new Date().toLocaleTimeString() }, ...l].slice(0, 40));
  }, []);

  // TTL expiry & queue advance
  useEffect(() => {
    if (!holder || !holderExpiresAt) return;
    if (now >= holderExpiresAt) {
      const expiredClient = clients.find((c) => c.id === holder);
      stats.current.expired++;
      force((x) => x + 1);
      pushLog({ kind: "expire", client: expiredClient?.name ?? holder, message: `TTL expired, lock auto-released` });
      setClients((cs) => cs.map((c) => c.id === holder ? { ...c, status: c.status === "failed" ? "failed" : "idle", acquiredAt: undefined, expiresAt: undefined } : c));
      setHolder(null);
      setHolderExpiresAt(null);
      // Promote next in queue
      setQueue((q) => {
        const next = q.find((id) => {
          const c = clients.find((cc) => cc.id === id);
          return c && c.status !== "failed";
        });
        if (next) {
          const expires = Date.now() + TTL_MS;
          setHolder(next);
          setHolderExpiresAt(expires);
          stats.current.acquired++;
          const nc = clients.find((c) => c.id === next);
          pushLog({ kind: "acquire", client: nc?.name ?? next, message: `Lock acquired (TTL ${TTL_MS}ms) from queue` });
          setClients((cs) => cs.map((c) => c.id === next ? { ...c, status: "holding", acquiredAt: Date.now(), expiresAt: expires } : c));
          return q.filter((id) => id !== next);
        }
        return q;
      });
    }
  }, [now, holder, holderExpiresAt, clients, pushLog]);

  const tryAcquire = useCallback((id: string) => {
    const client = clients.find((c) => c.id === id);
    if (!client || client.status === "failed") {
      pushLog({ kind: "deny", client: client?.name ?? id, message: "cannot acquire — node failed" });
      return;
    }
    if (holder === null) {
      const expires = Date.now() + TTL_MS;
      setHolder(id);
      setHolderExpiresAt(expires);
      stats.current.acquired++;
      pushLog({ kind: "acquire", client: client.name, message: `Lock acquired (TTL ${TTL_MS}ms)` });
      setClients((cs) => cs.map((c) => c.id === id ? { ...c, status: "holding", acquiredAt: Date.now(), expiresAt: expires } : c));
    } else if (holder === id) {
      pushLog({ kind: "deny", client: client.name, message: "already holds the lock" });
    } else if (queue.includes(id)) {
      pushLog({ kind: "deny", client: client.name, message: "already queued" });
    } else {
      stats.current.denied++;
      setQueue((q) => [...q, id]);
      setClients((cs) => cs.map((c) => c.id === id ? { ...c, status: "waiting" } : c));
      pushLog({ kind: "deny", client: client.name, message: "contended — queued for lock" });
    }
  }, [clients, holder, queue, pushLog]);

  const releaseLock = useCallback((id: string) => {
    if (holder !== id) return;
    const client = clients.find((c) => c.id === id);
    pushLog({ kind: "release", client: client?.name ?? id, message: "Lock released cleanly" });
    setClients((cs) => cs.map((c) => c.id === id ? { ...c, status: "idle", acquiredAt: undefined, expiresAt: undefined } : c));
    setHolder(null);
    setHolderExpiresAt(null);
    setQueue((q) => {
      const next = q.find((qid) => {
        const c = clients.find((cc) => cc.id === qid);
        return c && c.status !== "failed";
      });
      if (next) {
        const expires = Date.now() + TTL_MS;
        setHolder(next);
        setHolderExpiresAt(expires);
        stats.current.acquired++;
        const nc = clients.find((c) => c.id === next);
        pushLog({ kind: "acquire", client: nc?.name ?? next, message: "Lock acquired from queue" });
        setClients((cs) => cs.map((c) => c.id === next ? { ...c, status: "holding", acquiredAt: Date.now(), expiresAt: expires } : c));
        return q.filter((qid) => qid !== next);
      }
      return q;
    });
  }, [holder, clients, pushLog]);

  const toggleFail = useCallback((id: string) => {
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    if (client.status === "failed") {
      pushLog({ kind: "recover", client: client.name, message: "Node recovered, ready" });
      setClients((cs) => cs.map((c) => c.id === id ? { ...c, status: "idle" } : c));
    } else {
      stats.current.failures++;
      pushLog({ kind: "fail", client: client.name, message: client.status === "holding" ? "Holder CRASHED — lock will expire via TTL" : "Node failed" });
      setClients((cs) => cs.map((c) => c.id === id ? { ...c, status: "failed" } : c));
      setQueue((q) => q.filter((qid) => qid !== id));
      // If holder fails, keep lock until TTL expires (demonstrates recovery via TTL)
    }
  }, [clients, pushLog]);

  const reset = useCallback(() => {
    setClients(initialClients);
    setHolder(null);
    setHolderExpiresAt(null);
    setQueue([]);
    setLog([]);
    stats.current = { acquired: 0, expired: 0, denied: 0, failures: 0 };
    force((x) => x + 1);
  }, []);

  const remainingMs = holderExpiresAt ? Math.max(0, holderExpiresAt - now) : 0;
  const ttlPercent = holderExpiresAt ? (remainingMs / TTL_MS) * 100 : 0;
  const holderClient = clients.find((c) => c.id === holder);

  const logIcon = (k: LogEntry["kind"]) => {
    switch (k) {
      case "acquire": return <Lock className="w-3 h-3 text-success" />;
      case "release": return <Unlock className="w-3 h-3 text-primary" />;
      case "expire": return <Clock className="w-3 h-3 text-warning" />;
      case "deny": return <XCircle className="w-3 h-3 text-muted-foreground" />;
      case "fail": return <AlertTriangle className="w-3 h-3 text-destructive" />;
      case "recover": return <CheckCircle2 className="w-3 h-3 text-success" />;
    }
  };

  return (
    <section className="py-20 px-6">
      <div className="container max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Lock className="w-4 h-4" /> Coordination
          </div>
          <h2 className="text-4xl font-bold mb-3"><span className="gradient-text">Distributed Locks</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Redlock-style mutex with TTL safeguards. Trigger contention, crash holders, and watch automatic recovery via lease expiry — streamed live.</p>
        </motion.div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${wsConnected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
            {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            ws://lock-coordinator {wsConnected ? "CONNECTED" : "CONNECTING…"}
          </div>
          <button onClick={reset} className="px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70 text-xs flex items-center gap-1.5"><RotateCcw className="w-3 h-3" />Reset</button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lock state */}
          <div className="glass-card p-6 lg:col-span-1">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Lock: <code className="text-xs bg-muted px-2 py-0.5 rounded">jobs:critical</code></h3>

            <div className={`relative rounded-xl border-2 p-6 text-center transition-colors ${holder ? "border-success bg-success/5" : "border-dashed border-muted bg-muted/10"}`}>
              {holder ? (
                <>
                  <Lock className="w-10 h-10 mx-auto mb-2 text-success" />
                  <div className="text-sm text-muted-foreground">Held by</div>
                  <div className={`text-xl font-bold ${holderClient?.color}`}>{holderClient?.name}</div>
                  <div className="mt-3">
                    <div className="text-xs font-mono text-muted-foreground mb-1">TTL · {(remainingMs / 1000).toFixed(1)}s</div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div className={`h-full ${ttlPercent > 30 ? "bg-success" : "bg-destructive"}`} style={{ width: `${ttlPercent}%` }} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Unlock className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-muted-foreground">Lock is free</div>
                </>
              )}
            </div>

            <div className="mt-4">
              <div className="text-xs text-muted-foreground mb-2 font-mono">WAITING QUEUE ({queue.length})</div>
              <div className="space-y-1.5 min-h-[40px]">
                <AnimatePresence>
                  {queue.map((qid, i) => {
                    const c = clients.find((cc) => cc.id === qid);
                    return (
                      <motion.div key={qid} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="flex items-center gap-2 text-sm px-3 py-1.5 bg-muted/30 rounded-lg">
                        <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                        <span className={c?.color}>{c?.name}</span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {queue.length === 0 && <div className="text-xs text-muted-foreground italic">empty</div>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Stat label="Acquired" value={stats.current.acquired} accent="text-success" />
              <Stat label="Denied" value={stats.current.denied} accent="text-muted-foreground" />
              <Stat label="TTL Expired" value={stats.current.expired} accent="text-warning" />
              <Stat label="Failures" value={stats.current.failures} accent="text-destructive" />
            </div>
          </div>

          {/* Clients */}
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-accent" />Clients</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {clients.map((c) => {
                const isHolder = holder === c.id;
                return (
                  <motion.div key={c.id} layout className={`rounded-xl border p-4 transition-all ${c.status === "failed" ? "border-destructive/40 bg-destructive/5 opacity-70" : isHolder ? "border-success/60 bg-success/5" : "border-border bg-card/40"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${c.status === "failed" ? "bg-destructive" : c.status === "holding" ? "bg-success animate-pulse" : c.status === "waiting" ? "bg-warning animate-pulse" : "bg-muted-foreground"}`} />
                        <span className={`font-mono font-semibold ${c.color}`}>{c.name}</span>
                      </div>
                      <span className="text-xs font-mono uppercase text-muted-foreground">{c.status}</span>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={c.status === "failed"} onClick={() => tryAcquire(c.id)} className="flex-1 text-xs px-2 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"><Lock className="w-3 h-3" />Acquire</button>
                      <button disabled={!isHolder} onClick={() => releaseLock(c.id)} className="flex-1 text-xs px-2 py-1.5 rounded bg-muted hover:bg-muted/70 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"><Unlock className="w-3 h-3" />Release</button>
                      <button onClick={() => toggleFail(c.id)} className={`text-xs px-2 py-1.5 rounded flex items-center justify-center gap-1 ${c.status === "failed" ? "bg-success/10 text-success hover:bg-success/20" : "bg-destructive/10 text-destructive hover:bg-destructive/20"}`}>
                        {c.status === "failed" ? <><CheckCircle2 className="w-3 h-3" />Recover</> : <><AlertTriangle className="w-3 h-3" />Crash</>}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-warning" />Event Log (live)</h4>
              <div className="h-56 overflow-auto space-y-1 text-xs font-mono bg-muted/10 rounded-lg p-3">
                {log.length === 0 ? <div className="text-muted-foreground">No events yet — click Acquire on a client.</div> :
                  <AnimatePresence initial={false}>
                    {log.map((l) => (
                      <motion.div key={l.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 py-0.5">
                        <span className="text-muted-foreground">{l.time}</span>
                        {logIcon(l.kind)}
                        <span className="font-semibold">{l.client}</span>
                        <span className="text-muted-foreground">{l.message}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat = ({ label, value, accent = "text-foreground" }: { label: string; value: string | number; accent?: string }) => (
  <div className="bg-muted/30 rounded-lg p-3 text-center">
    <div className={`text-xl font-bold font-mono ${accent}`}>{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

export default DistributedLocksDemo;
