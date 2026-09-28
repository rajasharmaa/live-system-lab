import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, ArrowRight, ArrowLeft, RefreshCw, Zap, Server } from "lucide-react";
import { NetWeaver } from "./ui/SVGMascots";

const CommunicationPatternsDemo = () => {
  const [activeTab, setActiveTab] = useState<'polling' | 'sse' | 'websocket'>('websocket');
  const [messages, setMessages] = useState<{id: number, text: string, type: 'req' | 'res'}[]>([]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    setMessages([]);
    
    if (activeTab === 'polling') {
      interval = setInterval(() => {
        setMessages(prev => [...prev.slice(-4), { id: Date.now(), text: 'HTTP GET (Any updates?)', type: 'req' }]);
        setTimeout(() => {
          setMessages(prev => [...prev.slice(-5), { id: Date.now(), text: 'HTTP 200 (No updates)', type: 'res' }]);
        }, 300);
      }, 2000);
    } else if (activeTab === 'sse') {
      setMessages([{ id: Date.now(), text: 'HTTP GET /stream (Keep-Alive)', type: 'req' }]);
      interval = setInterval(() => {
        setMessages(prev => [...prev.slice(-5), { id: Date.now(), text: 'Event: Data chunk', type: 'res' }]);
      }, 2000);
    } else if (activeTab === 'websocket') {
      setMessages([{ id: Date.now(), text: 'HTTP Upgrade (Switching Protocols)', type: 'req' }]);
      interval = setInterval(() => {
        const isClient = Math.random() > 0.5;
        setMessages(prev => [...prev.slice(-5), { 
          id: Date.now(), 
          text: isClient ? 'WS Frame (Client -> Server)' : 'WS Frame (Server -> Client)', 
          type: isClient ? 'req' : 'res' 
        }]);
      }, 1500);
    }
    
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <NetWeaver />
          <div>
            <h2 className="text-3xl font-bold mb-2">Client-Server Communication</h2>
            <p className="text-muted-foreground">
              How clients talk to servers for real-time updates. Polling is inefficient. Server-Sent Events (SSE) is great for one-way streams. WebSockets are ideal for two-way low-latency communication.
            </p>
          </div>
        </div>

        <div className="glass-card p-2 rounded-xl flex flex-wrap gap-2 w-max mx-auto mb-8">
          <button 
            onClick={() => setActiveTab('polling')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${activeTab === 'polling' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <RefreshCw size={18} /> Short/Long Polling
          </button>
          <button 
            onClick={() => setActiveTab('sse')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${activeTab === 'sse' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <ArrowRight size={18} /> Server-Sent Events (SSE)
          </button>
          <button 
            onClick={() => setActiveTab('websocket')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${activeTab === 'websocket' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <Zap size={18} /> WebSockets
          </button>
        </div>

        <div className="glass-card p-8 rounded-xl max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-border">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center mb-2">💻</div>
              <span className="font-mono text-sm">Client</span>
            </div>
            
            <div className="flex-1 px-8 relative h-32 flex flex-col justify-center">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: msg.type === 'req' ? -20 : 20, x: msg.type === 'req' ? -20 : 20 }}
                  animate={{ opacity: 1, y: 0, x: 0 }}
                  className={`absolute w-full flex ${msg.type === 'req' ? 'justify-start text-primary' : 'justify-end text-success'} font-mono text-xs font-bold items-center gap-2`}
                  style={{ top: `${(i * 20) + 10}%` }}
                >
                  {msg.type === 'req' ? (
                    <><ArrowRight size={14} /> {msg.text}</>
                  ) : (
                    <>{msg.text} <ArrowLeft size={14} /></>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/20 border-2 border-primary rounded-xl flex items-center justify-center mb-2">
                <Server className="text-primary" />
              </div>
              <span className="font-mono text-sm">Server</span>
            </div>
          </div>
          
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-bold mb-2">Use Cases:</h4>
            <p className="text-sm text-muted-foreground">
              {activeTab === 'polling' && "Legacy fallback, simple status checks where real-time isn't critical. High overhead due to HTTP headers on every request."}
              {activeTab === 'sse' && "Stock tickers, news feeds, live scores. Uses standard HTTP, built-in reconnection, but only unidirectional (Server → Client)."}
              {activeTab === 'websocket' && "Chat apps, multiplayer games, collaborative editing (Figma/Docs). Low latency, bi-directional, but requires stateful load balancing."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunicationPatternsDemo;
