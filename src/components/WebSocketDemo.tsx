import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Send, Heart, ArrowUpDown, RefreshCw, Users, MessageSquare, Zap, XCircle } from "lucide-react";

interface WsMessage {
  id: number;
  direction: "send" | "receive" | "system";
  type: string;
  payload: string;
  timestamp: number;
}

interface WsClient {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "connecting";
  lastHeartbeat: number;
  messageCount: number;
}

const WebSocketDemo = () => {
  const [clients, setClients] = useState<WsClient[]>([
    { id: "client-1", name: "Browser App", status: "connected", lastHeartbeat: Date.now(), messageCount: 0 },
    { id: "client-2", name: "Mobile App", status: "connected", lastHeartbeat: Date.now(), messageCount: 0 },
  ]);
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [serverStatus, setServerStatus] = useState<"online" | "offline">("online");
  const [heartbeatActive, setHeartbeatActive] = useState(true);
  const [heartbeatPulse, setHeartbeatPulse] = useState(false);
  const msgCounter = useRef(0);
  const heartbeatRef = useRef<NodeJS.Timeout>();

  const addMessage = useCallback((msg: Omit<WsMessage, "id" | "timestamp">) => {
    msgCounter.current++;
    setMessages(prev => [{
      ...msg,
      id: msgCounter.current,
      timestamp: Date.now(),
    }, ...prev].slice(0, 20));
  }, []);

  // Heartbeat mechanism
  useEffect(() => {
    if (!heartbeatActive) {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      return;
    }
    heartbeatRef.current = setInterval(() => {
      if (serverStatus === "offline") return;
      setHeartbeatPulse(true);
      setTimeout(() => setHeartbeatPulse(false), 300);

      setClients(prev => prev.map(c =>
        c.status === "connected" ? { ...c, lastHeartbeat: Date.now() } : c
      ));
      addMessage({ direction: "system", type: "PING/PONG", payload: "Heartbeat exchange" });
    }, 4000);

    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [heartbeatActive, serverStatus, addMessage]);

  const sendMessage = useCallback((clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client || client.status !== "connected" || serverStatus === "offline") return;

    const payloads = [
      '{"action":"chat","text":"Hello!"}',
      '{"action":"move","x":42,"y":17}',
      '{"action":"subscribe","channel":"news"}',
      '{"action":"update","field":"score","value":100}',
    ];
    const payload = payloads[Math.floor(Math.random() * payloads.length)];

    addMessage({ direction: "send", type: "MESSAGE", payload: `${client.name}: ${payload}` });

    setClients(prev => prev.map(c =>
      c.id === clientId ? { ...c, messageCount: c.messageCount + 1 } : c
    ));

    // Server broadcasts to other connected clients
    setTimeout(() => {
      addMessage({ direction: "receive", type: "BROADCAST", payload: `Server → all: ${payload}` });
      setClients(prev => prev.map(c =>
        c.id !== clientId && c.status === "connected"
          ? { ...c, messageCount: c.messageCount + 1 }
          : c
      ));
    }, 200 + Math.random() * 300);
  }, [clients, serverStatus, addMessage]);

  const toggleClient = useCallback((clientId: string) => {
    setClients(prev => prev.map(c => {
      if (c.id !== clientId) return c;
      if (c.status === "connected") {
        addMessage({ direction: "system", type: "CLOSE", payload: `${c.name} disconnected (code: 1000)` });
        return { ...c, status: "disconnected" as const };
      } else {
        const updated = { ...c, status: "connecting" as const };
        addMessage({ direction: "system", type: "CONNECTING", payload: `${c.name} reconnecting...` });
        setTimeout(() => {
          setClients(p => p.map(cc =>
            cc.id === clientId ? { ...cc, status: "connected" as const, lastHeartbeat: Date.now() } : cc
          ));
          addMessage({ direction: "system", type: "OPEN", payload: `${c.name} connected (ws://server:8080)` });
        }, 1200);
        return updated;
      }
    }));
  }, [addMessage]);

  const toggleServer = useCallback(() => {
    if (serverStatus === "online") {
      setServerStatus("offline");
      addMessage({ direction: "system", type: "SERVER_DOWN", payload: "Server went offline" });
      setClients(prev => prev.map(c =>
        c.status === "connected" ? { ...c, status: "disconnected" } : c
      ));
    } else {
      setServerStatus("online");
      addMessage({ direction: "system", type: "SERVER_UP", payload: "Server back online" });
    }
  }, [serverStatus, addMessage]);

  const addClient = useCallback(() => {
    const id = `client-${clients.length + 1}`;
    const names = ["Desktop Client", "Tablet App", "IoT Device", "Admin Panel", "Bot"];
    const name = names[clients.length % names.length];
    setClients(prev => [...prev, { id, name, status: "connecting", lastHeartbeat: Date.now(), messageCount: 0 }]);
    addMessage({ direction: "system", type: "CONNECTING", payload: `${name} connecting...` });
    setTimeout(() => {
      setClients(prev => prev.map(c => c.id === id ? { ...c, status: "connected" } : c));
      addMessage({ direction: "system", type: "OPEN", payload: `${name} connected (ws://server:8080)` });
    }, 800);
  }, [clients.length, addMessage]);

  const connectedCount = clients.filter(c => c.status === "connected").length;

  return (
    <section className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">WebSocket</span> Communication
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time bidirectional communication with connection management and heartbeats
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Clients */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Clients
              </h3>
              <button
                onClick={addClient}
                className="text-xs px-3 py-1.5 glass-card hover:bg-muted/50 transition-all"
              >
                + Add Client
              </button>
            </div>
            <AnimatePresence mode="popLayout">
              {clients.map(client => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`glass-card p-4 border-2 transition-all ${
                    client.status === "connected" ? "border-success/30" :
                    client.status === "connecting" ? "border-warning/30" :
                    "border-destructive/30"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {client.status === "connected" ? (
                      <Wifi className="w-5 h-5 text-success" />
                    ) : client.status === "connecting" ? (
                      <RefreshCw className="w-5 h-5 text-warning animate-spin" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-destructive" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{client.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {client.messageCount} messages
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      client.status === "connected" ? "bg-success/20 text-success" :
                      client.status === "connecting" ? "bg-warning/20 text-warning" :
                      "bg-destructive/20 text-destructive"
                    }`}>
                      {client.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendMessage(client.id)}
                      disabled={client.status !== "connected" || serverStatus === "offline"}
                      className="flex-1 text-xs px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 disabled:opacity-40 transition-all"
                    >
                      <Send className="w-3 h-3 inline mr-1" /> Send
                    </button>
                    <button
                      onClick={() => toggleClient(client.id)}
                      className={`flex-1 text-xs px-3 py-1.5 rounded-lg transition-all ${
                        client.status === "connected"
                          ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                          : "bg-success/20 text-success hover:bg-success/30"
                      }`}
                    >
                      {client.status === "connected" ? "Disconnect" : "Reconnect"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Server */}
          <div>
            <motion.div
              className={`glass-card p-6 border-2 transition-all ${
                serverStatus === "online" ? "border-success/40" : "border-destructive/40"
              }`}
              animate={heartbeatPulse ? { scale: [1, 1.02, 1] } : {}}
            >
              <div className="flex items-center gap-3 mb-4">
                <ArrowUpDown className={`w-8 h-8 ${
                  serverStatus === "online" ? "text-success" : "text-destructive"
                }`} />
                <div>
                  <h3 className="font-bold text-lg">WebSocket Server</h3>
                  <span className="text-xs text-muted-foreground font-mono">ws://server:8080</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={serverStatus === "online" ? "text-success" : "text-destructive"}>
                    {serverStatus.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Connections</span>
                  <span className="font-mono">{connectedCount}/{clients.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Heartbeat</span>
                  <motion.span
                    animate={heartbeatPulse ? { color: ["hsl(var(--success))", "hsl(var(--foreground))"] } : {}}
                    className="flex items-center gap-1"
                  >
                    <Heart className={`w-3 h-3 ${heartbeatActive ? "text-success" : "text-muted-foreground"}`} />
                    {heartbeatActive ? "Active (4s)" : "Disabled"}
                  </motion.span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={toggleServer}
                  className={`w-full text-sm px-4 py-2 rounded-lg transition-all ${
                    serverStatus === "online"
                      ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
                      : "bg-success/20 text-success hover:bg-success/30"
                  }`}
                >
                  {serverStatus === "online" ? (
                    <><XCircle className="w-4 h-4 inline mr-1" /> Kill Server</>
                  ) : (
                    <><Zap className="w-4 h-4 inline mr-1" /> Start Server</>
                  )}
                </button>
                <button
                  onClick={() => setHeartbeatActive(!heartbeatActive)}
                  className="w-full text-sm px-4 py-2 rounded-lg glass-card hover:bg-muted/50 transition-all"
                >
                  <Heart className="w-4 h-4 inline mr-1" />
                  {heartbeatActive ? "Disable" : "Enable"} Heartbeat
                </button>
              </div>
            </motion.div>

            {/* Protocol info */}
            <div className="glass-card p-4 mt-4 text-xs space-y-2">
              <div className="font-semibold text-sm mb-2">WebSocket Protocol</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success" /> Full-duplex communication
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" /> Single TCP connection
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warning" /> Low overhead frames
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" /> HTTP upgrade handshake
              </div>
            </div>
          </div>

          {/* Message Stream */}
          <div className="glass-card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Message Stream
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.direction === "send" ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-2.5 rounded-lg text-xs ${
                      msg.direction === "send" ? "bg-primary/10 border-l-2 border-primary" :
                      msg.direction === "receive" ? "bg-success/10 border-l-2 border-success" :
                      "bg-muted/30 border-l-2 border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono font-bold ${
                        msg.direction === "send" ? "text-primary" :
                        msg.direction === "receive" ? "text-success" :
                        "text-muted-foreground"
                      }`}>
                        {msg.direction === "send" ? "↑" : msg.direction === "receive" ? "↓" : "•"} {msg.type}
                      </span>
                      <span className="text-muted-foreground ml-auto text-[10px]">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground font-mono truncate">{msg.payload}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {messages.length === 0 && (
                <p className="text-muted-foreground text-center py-8">Send a message or wait for heartbeat</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebSocketDemo;
