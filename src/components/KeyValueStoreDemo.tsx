import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Search, Plus, Trash2, Key } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

export const KeyValueStoreInteractive = () => {
  const [store, setStore] = useState<Record<string, string>>({
    'user:101': '{"name":"Alice","role":"Admin"}',
    'config:theme': 'dark',
    'session:xyz': 'valid'
  });
  
  const [keyInput, setKeyInput] = useState('');
  const [valInput, setValInput] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchResult, setSearchResult] = useState<{key: string, val: string | null} | null>(null);

  const handleSet = () => {
    if (!keyInput.trim() || !valInput.trim()) return;
    setStore(prev => ({ ...prev, [keyInput]: valInput }));
    setKeyInput('');
    setValInput('');
  };

  const handleGet = () => {
    if (!searchKey.trim()) return;
    const val = store[searchKey];
    setSearchResult({ key: searchKey, val: val || null });
  };

  const handleDelete = (k: string) => {
    const newStore = { ...store };
    delete newStore[k];
    setStore(newStore);
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-8 w-full max-w-5xl mx-auto">
      {/* Operations Panel */}
      <div className="glass-card p-4 md:p-6 rounded-xl flex flex-col gap-4 md:gap-8 shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
        <div>
          <h3 className="font-bold mb-2 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Plus className="text-primary w-4 h-4 md:w-5 md:h-5"/> Set Value (Write)</h3>
          <div className="flex gap-2 mb-2">
            <input 
              type="text" 
              placeholder="Key (e.g. user:123)" 
              className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-sm"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Value" 
              className="flex-[2] bg-background border border-border rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-sm"
              value={valInput}
              onChange={e => setValInput(e.target.value)}
            />
            <button 
              onClick={handleSet}
              className="bg-primary text-primary-foreground px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              SET
            </button>
          </div>
        </div>
        
        <div className="h-[1px] bg-border w-full"></div>

        <div>
          <h3 className="font-bold mb-2 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Search className="text-secondary w-4 h-4 md:w-5 md:h-5"/> Get Value (Read)</h3>
          <div className="flex gap-2 mb-2 md:mb-4">
            <input 
              type="text" 
              placeholder="Enter Key..." 
              className="flex-1 bg-background border border-border rounded-lg px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-sm"
              value={searchKey}
              onChange={e => setSearchKey(e.target.value)}
            />
            <button 
              onClick={handleGet}
              className="bg-secondary text-secondary-foreground px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-[10px] md:text-sm font-bold hover:bg-secondary/90 transition-colors"
            >
              GET
            </button>
          </div>
          
          <div className="h-16 md:h-20">
            <AnimatePresence mode="wait">
              {searchResult && (
                <motion.div 
                  key={searchResult.key + (searchResult.val ? 'found' : 'missing')}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={`p-2 md:p-4 rounded-lg border text-[10px] md:text-sm font-mono ${
                    searchResult.val 
                      ? 'bg-success/10 border-success/30 text-success-foreground' 
                      : 'bg-destructive/10 border-destructive/30 text-destructive'
                  }`}
                >
                  <div className="font-bold mb-0.5 md:mb-1 truncate">Result for "{searchResult.key}":</div>
                  <div className="truncate">{searchResult.val ? searchResult.val : '(nil) - Not Found'}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Database Visualization */}
      <div className="glass-card p-4 md:p-6 rounded-xl flex flex-col h-64 md:h-full shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
        <h3 className="font-bold mb-2 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Database className="text-primary w-4 h-4 md:w-5 md:h-5"/> Memory/Storage</h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 md:pr-2 custom-scrollbar">
          <AnimatePresence>
            {Object.entries(store).map(([k, v]) => (
              <motion.div 
                key={k}
                initial={{ opacity: 0, scale: 0.9, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                layout
                className="flex items-center gap-2 md:gap-3 bg-card border border-border p-2 md:p-3 rounded-lg group shadow-sm"
              >
                <div className="bg-primary/20 p-1.5 md:p-2 rounded text-primary flex-shrink-0">
                  <Key size={14} className="md:w-4 md:h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-[9px] md:text-xs text-muted-foreground font-mono mb-0.5 md:mb-1 truncate">{k}</div>
                  <div className="text-[10px] md:text-sm font-mono truncate">{v}</div>
                </div>
                <button 
                  onClick={() => handleDelete(k)}
                  className="text-destructive/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 p-1 md:p-2"
                >
                  <Trash2 size={14} className="md:w-4 md:h-4" />
                </button>
              </motion.div>
            ))}
            
            {Object.keys(store).length === 0 && (
              <div className="text-center p-4 md:p-8 text-muted-foreground italic text-[10px] md:text-sm">
                Database is empty
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const KeyValueStoreDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Key-Value Store</h2>
            <p className="text-muted-foreground">
              A simple database that uses an associative array (map/dictionary) as the fundamental data model. Extremely fast O(1) lookups. Examples include Redis, Memcached, DynamoDB.
            </p>
          </div>
        </div>
        <KeyValueStoreInteractive />
      </div>
    </section>
  );
};

export default KeyValueStoreDemo;
