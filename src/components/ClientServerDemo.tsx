import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, MonitorSmartphone, ArrowRight, ArrowLeft, Send } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

export const ClientServerInteractive = () => {
  const [messages, setMessages] = useState<{ id: number; type: 'req' | 'res'; text: string; status: 'sending' | 'processing' | 'done' }[]>([]);
  
  const sendRequest = () => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, type: 'req', text: 'GET /api/data', status: 'sending' }]);
    
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'processing' } : m));
      
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'done' } : m));
        setMessages(prev => [...prev, { id: id + 1, type: 'res', text: '200 OK: { data: "Hello" }', status: 'sending' }]);
        
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === id + 1 ? { ...m, status: 'done' } : m));
        }, 1000);
      }, 1500);
    }, 1000);
  };

  return (
    <div className="glass-card p-4 md:p-8 rounded-xl w-full max-w-4xl mx-auto shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm flex flex-col">
      <div className="flex justify-center mb-6 md:mb-12">
        <button 
          onClick={sendRequest}
          className="py-2 px-4 md:py-3 md:px-6 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors text-sm md:text-base"
        >
          <Send size={16} className="md:w-5 md:h-5" /> Send Request
        </button>
      </div>

      <div className="relative flex justify-between items-center h-48 md:h-64 border-b border-border/50 pb-4 md:pb-8 mb-4 md:mb-8">
        {/* Client */}
        <div className="z-10 flex flex-col items-center gap-2 md:gap-4 bg-card p-3 md:p-6 rounded-xl border border-border shadow-lg w-24 md:w-48 text-center">
          <MonitorSmartphone size={32} className="text-primary md:w-12 md:h-12" />
          <div>
            <h3 className="font-bold text-xs md:text-base">Client</h3>
            <p className="text-[9px] md:text-xs text-muted-foreground hidden sm:block">Browser / App</p>
          </div>
        </div>

        {/* Network Area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Connecting line */}
          <div className="w-full h-[2px] bg-border absolute top-1/2 -translate-y-1/2"></div>
          
          <AnimatePresence>
            {messages.map(msg => {
              if (msg.status === 'done') return null;
              
              const isReq = msg.type === 'req';
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ left: isReq ? '15%' : '85%', opacity: 0 }}
                  animate={{ 
                    left: msg.status === 'processing' ? (isReq ? '85%' : '15%') : (isReq ? '50%' : '50%'),
                    opacity: msg.status === 'processing' ? 0 : 1
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute top-1/2 -translate-y-1/2 bg-background border border-border rounded-lg p-1.5 md:p-2 text-[10px] md:text-xs font-mono shadow-md flex items-center gap-1 md:gap-2 whitespace-nowrap"
                >
                  {isReq ? <ArrowRight size={12} className="text-primary md:w-3.5 md:h-3.5" /> : <ArrowLeft size={12} className="text-success md:w-3.5 md:h-3.5" />}
                  {msg.text}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Server */}
        <div className="z-10 flex flex-col items-center gap-2 md:gap-4 bg-card p-3 md:p-6 rounded-xl border border-border shadow-lg w-24 md:w-48 text-center">
          <Server size={32} className="text-secondary md:w-12 md:h-12" />
          <div>
            <h3 className="font-bold text-xs md:text-base">Server</h3>
            <p className="text-[9px] md:text-xs text-muted-foreground hidden sm:block">Backend API</p>
          </div>
          <AnimatePresence>
            {messages.some(m => m.type === 'req' && m.status === 'processing') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -top-8 md:-top-12 bg-secondary text-secondary-foreground text-[10px] md:text-xs py-1 px-2 md:px-3 rounded-full animate-pulse"
              >
                Processing...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="space-y-2 h-32 overflow-y-auto custom-scrollbar">
        <h4 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Network Log</h4>
        <AnimatePresence>
          {messages.filter(m => m.status === 'done').map(msg => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-2 md:p-3 rounded border text-[10px] md:text-sm font-mono flex items-center gap-2 md:gap-3 ${
                msg.type === 'req' 
                  ? 'bg-primary/5 border-primary/20 text-foreground' 
                  : 'bg-success/5 border-success/20 text-foreground'
              }`}
            >
              {msg.type === 'req' ? <ArrowRight className="text-primary w-3 h-3 md:w-4 md:h-4"/> : <ArrowLeft className="text-success w-3 h-3 md:w-4 md:h-4"/>}
              <span className="opacity-50 w-8 md:w-12">{msg.type === 'req' ? 'REQ' : 'RES'}</span>
              <span>{msg.text}</span>
            </motion.div>
          )).reverse()}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ClientServerDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Client-Server Architecture</h2>
            <p className="text-muted-foreground">
              The fundamental model of distributed applications. A client (requester) initiates communication with a server (provider) which processes the request and returns a response.
            </p>
          </div>
        </div>
        <ClientServerInteractive />
      </div>
    </section>
  );
};

export default ClientServerDemo;
