import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Wifi, WifiOff, Plus, Trash2, Play, Pause, RotateCcw, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface Node {
  id: number;
  x: number;
  y: number;
  alive: boolean;
  infected: boolean; // received current rumor
  infectedAt?: number;
}

interface GossipMsg {
  id: string;
  from: number;
  to: number;
  ts: number;
}

const RADIUS = 140;
const FANOUT = 2;
const TICK_MS = 700;

function placeNodes(count: number): Node[] {
  const arr: Node[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    arr.push({
      id: i,
      x: 200 + RADIUS * Math.cos(angle),
      y: 170 + RADIUS * Math.sin(angle),
      alive: true,
      infected: false,
    });
  }
  return arr;
}

const GossipProtocolDemo = () => {
  const [nodes, setNodes] = useState<Node[]>(() => placeNodes(10));
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<GossipMsg[]>([]);
  const [tick, setTick] = useState(0);
  const [history, setHistory] = useState<{ t: number; infected: number; messages: number; alive: number }[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const msgCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // Simulated WebSocket lifecycle
  useEffect(() => {
    const t = setTimeout(() => setWsConnected(true), 600);
    return () => clearTimeout(t);
  }, []);

  const pushLog = useCallback((msg: string) => {
    setLog((l) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l].slice(0, 50));
  }, []);

  const startGossip = useCallback(() => {
    setNodes((ns) => {
      const idx = ns.findIndex((n) => n.alive);
      if (idx < 0) return ns;
      const next = ns.map((n) => ({ ...n, infected: false, infectedAt: undefined }));
      next[idx].infected = true;
      next[idx].infectedAt = 0;
      pushLog(`Rumor seeded at node ${next[idx].id}`);
      return next;
    });
    msgCountRef.current = 0;
    setHistory([]);
    setTick(0);
    setRunning(true);
  }, [pushLog]);

  const reset = useCallback(() => {
    setRunning(false);
    setMessages([]);
    setHistory([]);
    setLog([]);
    setTick(0);
    msgCountRef.current = 0;
    setNodes(placeNodes(10));
  }, []);

  const addNode = useCallback(() => {
    setNodes((ns) => {
      if (ns.length >= 16) return ns;
      const next = placeNodes(ns.length + 1).map((n, i) => ({
        ...n,
        alive: ns[i]?.alive ?? true,
        infected: ns[i]?.infected ?? false,
      }));
      pushLog(`Node ${ns.length} joined the cluster`);
      return next;
    });
  }, [pushLog]);

  const removeNode = useCallback(() => {
    setNodes((ns) => {
      if (ns.length <= 4) return ns;
      pushLog(`Node ${ns.length - 1} left the cluster`);
      return placeNodes(ns.length - 1).map((n, i) => ({
        ...n,
        alive: ns[i].alive,
        infected: ns[i].infected,
      }));
    });
  }, [pushLog]);

  const toggleNode = useCallback((id: number) => {
    setNodes((ns) => ns.map((n) => {
      if (n.id !== id) return n;
      pushLog(`Node ${id} ${n.alive ? "FAILED" : "RECOVERED"}`);
      return { ...n, alive: !n.alive, infected: n.alive ? false : n.infected };
    }));
  }, [pushLog]);

  // Gossip tick
  useEffect(() => {
    if (!running) return;
    timerRef.current = window.setInterval(() => {
      setTick((t) => t + 1);
      setNodes((ns) => {
        const aliveInfected = ns.filter((n) => n.alive && n.infected);
        const aliveAll = ns.filter((n) => n.alive);
        if (aliveInfected.length === 0 || aliveInfected.length === aliveAll.length) {
          return ns;
        }
        const newMsgs: GossipMsg[] = [];
        const toInfect = new Set<number>();
        aliveInfected.forEach((src) => {
          const peers = aliveAll.filter((p) => p.id !== src.id);
          for (let i = 0; i < FANOUT && peers.length > 0; i++) {
            const peer = peers[Math.floor(Math.random() * peers.length)];
            newMsgs.push({ id: `${Date.now()}-${src.id}-${peer.id}-${i}`, from: src.id, to: peer.id, ts: Date.now() });
            if (!peer.infected) toInfect.add(peer.id);
            msgCountRef.current++;
          }
        });
        setMessages((m) => [...m, ...newMsgs].slice(-30));
        setTimeout(() => setMessages((m) => m.filter((mm) => !newMsgs.find((nm) => nm.id === mm.id))), TICK_MS - 50);
        return ns.map((n) => toInfect.has(n.id) ? { ...n, infected: true } : n);
      });
    }, TICK_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [running]);

  // Track history
  useEffect(() => {
    if (!running) return;
    const infected = nodes.filter((n) => n.alive && n.infected).length;
    const alive = nodes.filter((n) => n.alive).length;
    setHistory((h) => [...h, { t: tick, infected, alive, messages: msgCountRef.current }].slice(-40));
    if (infected === alive && infected > 0 && running) {
      pushLog(`Convergence reached in ${tick} rounds (${msgCountRef.current} messages)`);
      setRunning(false);
    }
  }, [tick]); // eslint-disable-line

  const alive = nodes.filter((n) => n.alive).length;
  const infected = nodes.filter((n) => n.alive && n.infected).length;
  const coverage = alive > 0 ? Math.round((infected / alive) * 100) : 0;

  return (
    <section className="py-20 px-6">
      <div className="container max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Radio className="w-4 h-4" /> Distributed Systems
          </div>
          <h2 className="text-4xl font-bold mb-3"><span className="gradient-text">Gossip Protocol</span> Simulation</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Watch rumors propagate epidemically across nodes via random peer selection. Real-time membership changes streamed over a live channel.</p>
        </motion.div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono ${wsConnected ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
            {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            ws://gossip-cluster {wsConnected ? "CONNECTED" : "CONNECTING…"}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cluster view */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Cluster Topology</h3>
              <div className="flex gap-2">
                <button onClick={addNode} className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition" title="Add node"><Plus className="w-4 h-4" /></button>
                <button onClick={removeNode} className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition" title="Remove node"><Trash2 className="w-4 h-4" /></button>
                <button onClick={running ? () => setRunning(false) : startGossip} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition flex items-center gap-1.5 text-sm">
                  {running ? <><Pause className="w-4 h-4" />Pause</> : <><Play className="w-4 h-4" />Gossip</>}
                </button>
                <button onClick={reset} className="p-2 rounded-lg bg-muted hover:bg-muted/70 transition" title="Reset"><RotateCcw className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="relative h-[360px] bg-muted/20 rounded-lg overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 340">
                <AnimatePresence>
                  {messages.map((m) => {
                    const f = nodes[m.from]; const t = nodes[m.to];
                    if (!f || !t) return null;
                    return (
                      <motion.line
                        key={m.id}
                        initial={{ pathLength: 0, opacity: 0.8 }}
                        animate={{ pathLength: 1, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                        stroke="hsl(var(--primary))" strokeWidth={1.5} strokeDasharray="4 4"
                      />
                    );
                  })}
                </AnimatePresence>
                {nodes.map((n) => (
                  <g key={n.id} onClick={() => toggleNode(n.id)} className="cursor-pointer">
                    <motion.circle
                      cx={n.x} cy={n.y} r={18}
                      animate={{
                        fill: !n.alive ? "hsl(var(--destructive) / 0.3)" : n.infected ? "hsl(var(--success))" : "hsl(var(--muted))",
                        scale: n.infected && n.alive ? [1, 1.15, 1] : 1,
                      }}
                      transition={{ duration: 0.5 }}
                      stroke={n.alive ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                      strokeWidth={2}
                    />
                    <text x={n.x} y={n.y + 4} textAnchor="middle" className="fill-foreground text-xs font-mono pointer-events-none">{n.id}</text>
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-2 left-3 text-xs text-muted-foreground font-mono">Click node to fail/recover · Fanout={FANOUT}</div>
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4">
              <Stat label="Nodes" value={nodes.length} />
              <Stat label="Alive" value={alive} accent="text-success" />
              <Stat label="Infected" value={`${infected}/${alive}`} accent="text-primary" />
              <Stat label="Coverage" value={`${coverage}%`} accent="text-accent" />
            </div>
          </div>

          {/* Side panels */}
          <div className="space-y-6">
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3 text-sm">Propagation</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line type="monotone" dataKey="infected" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="alive" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3 text-sm">Message Volume</h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Line type="monotone" dataKey="messages" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2"><Radio className="w-3.5 h-3.5 text-primary" />Event Stream</h3>
              <div className="h-40 overflow-auto space-y-1 text-xs font-mono">
                {log.length === 0 ? <div className="text-muted-foreground">Waiting for events…</div> :
                  log.map((l, i) => <div key={i} className="text-muted-foreground border-l-2 border-primary/40 pl-2">{l}</div>)}
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

export default GossipProtocolDemo;
