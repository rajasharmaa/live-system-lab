import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, Server, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import { ArchitectBot } from "./ui/SVGMascots";

const IdempotencyDemo = () => {
  const [logs, setLogs] = useState<{ id: number, action: string, status: 'success' | 'error' | 'duplicate' }[]>([]);
  const [balance, setBalance] = useState(100);
  const [isIdempotent, setIsIdempotent] = useState(true);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [logId, setLogId] = useState(0);

  const processPayment = (retryId: string | null = null) => {
    const paymentId = retryId || `PAY-${Math.floor(Math.random() * 1000)}`;
    const currentLogId = logId;
    setLogId(prev => prev + 1);

    if (isIdempotent) {
      if (processedIds.has(paymentId)) {
        setLogs(prev => [{ id: currentLogId, action: `Retry ${paymentId}`, status: 'duplicate' }, ...prev].slice(0, 5));
        return paymentId; // Return same ID for potential further retries
      }
      
      setProcessedIds(prev => new Set(prev).add(paymentId));
      setBalance(prev => prev - 10);
      setLogs(prev => [{ id: currentLogId, action: `Process ${paymentId}`, status: 'success' }, ...prev].slice(0, 5));
    } else {
      setBalance(prev => prev - 10);
      setLogs(prev => [{ id: currentLogId, action: `Process ${paymentId} (No Check)`, status: 'success' }, ...prev].slice(0, 5));
    }
    
    return paymentId;
  };

  const simulateNetworkFailure = () => {
    const currentLogId = logId;
    setLogId(prev => prev + 1);
    
    // Simulate client sending payment, but network fails before getting response
    const paymentId = `PAY-${Math.floor(Math.random() * 1000)}`;
    
    // Server processes it
    if (isIdempotent) {
      setProcessedIds(prev => new Set(prev).add(paymentId));
    }
    setBalance(prev => prev - 10);
    
    setLogs(prev => [{ id: currentLogId, action: `Timeout ${paymentId}`, status: 'error' }, ...prev].slice(0, 5));
    
    // Client retries 1 second later because of timeout
    setTimeout(() => {
      processPayment(paymentId);
    }, 1000);
  };

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <ArchitectBot />
          <div>
            <h2 className="text-3xl font-bold mb-2">Idempotency</h2>
            <p className="text-muted-foreground">
              An operation is idempotent if it produces the same result no matter how many times it is executed.
              Crucial for payment systems and APIs where network timeouts cause clients to retry requests.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">API Configuration</h3>
              <button 
                onClick={() => setIsIdempotent(!isIdempotent)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${isIdempotent ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}
              >
                {isIdempotent ? 'Idempotency: ON' : 'Idempotency: OFF'}
              </button>
            </div>
            
            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => processPayment()}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <ArrowRight size={18} /> Normal Request
              </button>
              <button 
                onClick={simulateNetworkFailure}
                className="flex-1 py-3 border border-destructive text-destructive rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-destructive/10"
              >
                <RotateCcw size={18} /> Network Timeout & Retry
              </button>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl text-center">
              <span className="text-sm text-muted-foreground block mb-2">Account Balance</span>
              <span className="text-4xl font-mono font-bold">${balance}</span>
              {!isIdempotent && balance < 90 && (
                <p className="text-destructive text-xs mt-2 flex items-center justify-center gap-1">
                  <AlertTriangle size={12} /> Double charging risk!
                </p>
              )}
            </div>
            
            <div className="mt-4 text-center">
              <button onClick={() => { setBalance(100); setProcessedIds(new Set()); setLogs([]); }} className="text-xs text-muted-foreground underline">
                Reset Demo
              </button>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-6">Server Logs</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-8">Waiting for requests...</p>
                ) : logs.map((log) => (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg flex items-center justify-between border ${
                      log.status === 'success' ? 'bg-success/10 border-success/30' : 
                      log.status === 'duplicate' ? 'bg-warning/10 border-warning/30' : 
                      'bg-destructive/10 border-destructive/30'
                    }`}
                  >
                    <span className="font-mono text-sm">{log.action}</span>
                    <span className="flex items-center gap-1 text-xs font-bold">
                      {log.status === 'success' ? <><CheckCircle size={14} className="text-success"/> CHARGED $10</> :
                       log.status === 'duplicate' ? <><Shield size={14} className="text-warning"/> CACHED RESP</> :
                       <><AlertTriangle size={14} className="text-destructive"/> TIMEOUT</>}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {isIdempotent && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 font-mono">Processed Idempotency Keys:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(processedIds).slice(-6).map(id => (
                    <span key={id} className="text-[10px] bg-muted px-2 py-1 rounded font-mono">{id}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default IdempotencyDemo;
