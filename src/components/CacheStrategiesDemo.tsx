import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, ArrowRight, ArrowLeft, Zap, Box } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

type CacheStrategy = 'write-through' | 'write-behind' | 'write-around';

const CacheStrategiesDemo = () => {
  const [strategy, setStrategy] = useState<CacheStrategy>('write-through');
  const [messages, setMessages] = useState<{ id: number, text: string, type: 'app' | 'cache' | 'db' }[]>([]);
  const [dbData, setDbData] = useState<number>(0);
  const [cacheData, setCacheData] = useState<number | null>(null);

  const simulateWrite = () => {
    const val = Math.floor(Math.random() * 100);
    const id = Date.now();
    setMessages([]);
    
    if (strategy === 'write-through') {
      setMessages([{ id, text: `App writes ${val} to Cache`, type: 'app' }]);
      setTimeout(() => {
        setCacheData(val);
        setMessages(p => [...p, { id: id+1, text: `Cache synchronously writes ${val} to DB`, type: 'cache' }]);
        setTimeout(() => setDbData(val), 800);
      }, 800);
    } else if (strategy === 'write-behind') {
      setMessages([{ id, text: `App writes ${val} to Cache`, type: 'app' }]);
      setTimeout(() => {
        setCacheData(val);
        setMessages(p => [...p, { id: id+1, text: `App continues immediately`, type: 'app' }]);
        // Async write to DB
        setTimeout(() => {
          setMessages(p => [...p, { id: id+2, text: `Cache async flushes ${val} to DB`, type: 'cache' }]);
          setDbData(val);
        }, 2000);
      }, 500);
    } else if (strategy === 'write-around') {
      setMessages([{ id, text: `App writes ${val} directly to DB`, type: 'app' }]);
      setTimeout(() => {
        setDbData(val);
        setCacheData(null); // Invalidate cache
        setMessages(p => [...p, { id: id+1, text: `Cache is bypassed/invalidated`, type: 'db' }]);
      }, 1000);
    }
  };

  return (
    <section className="py-24 px-6 bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Cache Writing Strategies</h2>
            <p className="text-muted-foreground">
              How do you keep cache and database in sync when data changes?
              <strong> Write-Through:</strong> Safe but slow writes.
              <strong> Write-Behind:</strong> Fast writes but risk of data loss.
              <strong> Write-Around:</strong> Good for data written once and rarely read.
            </p>
          </div>
        </div>

        <div className="glass-card p-2 rounded-xl flex flex-wrap gap-2 w-max mx-auto mb-8">
          <button 
            onClick={() => { setStrategy('write-through'); setMessages([]); }}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${strategy === 'write-through' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            Write-Through
          </button>
          <button 
            onClick={() => { setStrategy('write-behind'); setMessages([]); }}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${strategy === 'write-behind' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            Write-Behind (Write-Back)
          </button>
          <button 
            onClick={() => { setStrategy('write-around'); setMessages([]); }}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${strategy === 'write-around' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            Write-Around
          </button>
        </div>

        <div className="glass-card p-8 rounded-xl max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-muted/50 rounded-xl flex items-center justify-center mb-2">💻</div>
              <span className="font-mono text-sm font-bold">App</span>
            </div>
            
            <div className="flex-1 px-4 relative flex items-center justify-center">
              <button onClick={simulateWrite} className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 z-10">
                <ArrowRight size={18}/> Write Data
              </button>
              
              <div className="absolute top-16 left-0 right-0 flex flex-col items-center gap-2">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                        msg.type === 'app' ? 'bg-primary/20 text-primary' : 
                        msg.type === 'cache' ? 'bg-warning/20 text-warning' : 
                        'bg-accent/20 text-accent'
                      }`}
                    >
                      {msg.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-warning/20 border-2 border-warning rounded-xl flex items-center justify-center mb-2 relative">
                <Zap className="text-warning" size={32} />
                <span className="absolute -bottom-3 bg-card px-2 text-xs font-mono border border-warning rounded text-warning">
                  {cacheData !== null ? cacheData : 'EMPTY'}
                </span>
              </div>
              <span className="font-mono text-sm font-bold mt-3">Cache (Redis)</span>
            </div>
            
            <div className="flex-1 px-4 flex items-center justify-center opacity-50">
              <ArrowRight className="text-muted-foreground w-full" />
            </div>

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-accent/20 border-2 border-accent rounded-xl flex items-center justify-center mb-2 relative">
                <Database className="text-accent" size={32} />
                <span className="absolute -bottom-3 bg-card px-2 text-xs font-mono border border-accent rounded text-accent">
                  {dbData}
                </span>
              </div>
              <span className="font-mono text-sm font-bold mt-3">Database (SQL)</span>
            </div>
          </div>
          
          <div className="bg-muted/30 p-6 rounded-lg border border-border">
            <h4 className="font-bold mb-2 flex items-center gap-2"><Box size={18} /> Architecture Trade-offs</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Pros:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  {strategy === 'write-through' && <li>Data is always consistent</li>}
                  {strategy === 'write-through' && <li>No risk of data loss</li>}
                  {strategy === 'write-behind' && <li>Extremely fast writes for the app</li>}
                  {strategy === 'write-behind' && <li>Reduces DB load (batching writes)</li>}
                  {strategy === 'write-around' && <li>Prevents cache pollution by unread data</li>}
                </ul>
              </div>
              <div>
                <strong className="text-foreground">Cons:</strong>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  {strategy === 'write-through' && <li>Higher latency (two write operations)</li>}
                  {strategy === 'write-behind' && <li>Risk of data loss if cache crashes before DB sync</li>}
                  {strategy === 'write-behind' && <li>Complex to implement</li>}
                  {strategy === 'write-around' && <li>Read after write is slow (cache miss)</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CacheStrategiesDemo;
