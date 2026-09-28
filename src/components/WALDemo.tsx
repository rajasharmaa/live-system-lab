import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, FileText, ArrowRight, Zap, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

const WALDemo = () => {
  const [wal, setWal] = useState<{ id: number, query: string, committed: boolean }[]>([]);
  const [dbState, setDbState] = useState<{ k: string, v: string }[]>([]);
  const [dbStatus, setDbStatus] = useState<'running' | 'crashed' | 'recovering'>('running');

  const insertData = () => {
    if (dbStatus !== 'running') return;
    
    const id = Date.now();
    const query = `INSERT INTO users VALUES ('User_${Math.floor(Math.random() * 100)}')`;
    
    // Step 1: Append to WAL immediately
    setWal(prev => [...prev.slice(-4), { id, query, committed: false }]);
    
    // Step 2: Apply to memory/disk later (simulated async)
    setTimeout(() => {
      if (dbStatus !== 'running') return; // Simulated crash before commit
      
      setDbState(prev => [{ k: `row_${id}`, v: query }, ...prev].slice(0, 5));
      setWal(prev => prev.map(entry => entry.id === id ? { ...entry, committed: true } : entry));
    }, 1500);
  };

  const simulateCrash = () => {
    if (dbStatus !== 'running') return;
    setDbStatus('crashed');
    // Clear memory (simulating RAM loss), but WAL stays (Disk)
    setDbState([]);
  };

  const recoverDb = () => {
    setDbStatus('recovering');
    
    setTimeout(() => {
      // Replay WAL
      const recoveredState = wal.map(entry => ({ k: `row_${entry.id}`, v: entry.query }));
      setDbState(recoveredState.reverse());
      setWal(prev => prev.map(entry => ({ ...entry, committed: true })));
      setDbStatus('running');
    }, 2000);
  };

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Write-Ahead Log (WAL)</h2>
            <p className="text-muted-foreground">
              Before a database modifies its data files, it writes the change to an append-only log on disk (WAL). If the database crashes before writing to the actual data files, it can replay the WAL upon restart to recover lost data. Used in Postgres, MySQL, Cassandra.
            </p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-xl">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={insertData}
              disabled={dbStatus !== 'running'}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap size={18} /> Insert Data
            </button>
            <button 
              onClick={simulateCrash}
              disabled={dbStatus !== 'running'}
              className="flex-1 py-3 border border-destructive text-destructive rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-destructive/10 disabled:opacity-50"
            >
              <AlertTriangle size={18} /> Simulate DB Crash
            </button>
            <button 
              onClick={recoverDb}
              disabled={dbStatus !== 'crashed'}
              className="flex-1 py-3 border border-success text-success rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-success/10 disabled:opacity-50"
            >
              <RefreshCw size={18} className={dbStatus === 'recovering' ? 'animate-spin' : ''} /> 
              {dbStatus === 'recovering' ? 'Recovering...' : 'Restart & Recover'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* WAL (Disk) */}
            <div className="border border-border bg-card rounded-xl overflow-hidden flex flex-col h-64">
              <div className="bg-muted p-3 border-b border-border font-bold flex items-center gap-2">
                <FileText className="text-warning" size={18} /> WAL (Disk Storage - Safe)
              </div>
              <div className="p-4 flex-1 overflow-auto space-y-2 relative">
                <AnimatePresence>
                  {wal.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Log is empty...</p>
                  ) : wal.map(entry => (
                    <motion.div 
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-2 bg-muted/50 rounded border border-border text-xs font-mono flex items-center justify-between"
                    >
                      <span className="truncate mr-2">{entry.query}</span>
                      {entry.committed ? 
                        <CheckCircle2 size={14} className="text-success flex-shrink-0" /> : 
                        <span className="text-warning flex-shrink-0">Pending</span>
                      }
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* DB Data Files (Memory/Disk) */}
            <div className={`border-2 rounded-xl overflow-hidden flex flex-col h-64 transition-colors ${dbStatus === 'crashed' ? 'border-destructive bg-destructive/10' : dbStatus === 'recovering' ? 'border-warning bg-warning/10' : 'border-border bg-card'}`}>
              <div className="bg-muted p-3 border-b border-border font-bold flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><Database className="text-primary" size={18} /> DB Data Pages (RAM/Disk)</span>
                {dbStatus === 'crashed' && <span className="text-xs text-destructive font-bold animate-pulse">CRASHED - RAM CLEARED</span>}
              </div>
              <div className="p-4 flex-1 overflow-auto space-y-2 relative">
                <AnimatePresence>
                  {dbState.length === 0 && dbStatus === 'running' && (
                    <p className="text-xs text-muted-foreground italic">No data committed yet...</p>
                  )}
                  {dbStatus === 'crashed' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <AlertTriangle size={48} className="text-destructive/50" />
                    </div>
                  )}
                  {dbState.map(entry => (
                    <motion.div 
                      key={entry.k}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-2 bg-primary/10 text-primary border border-primary/30 rounded text-xs font-mono"
                    >
                      {entry.v}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-center gap-4 text-muted-foreground">
            <span className="text-xs font-mono flex items-center gap-1">Client <ArrowRight size={12}/> WAL (Fast) <ArrowRight size={12}/> DB Data (Slow)</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WALDemo;
