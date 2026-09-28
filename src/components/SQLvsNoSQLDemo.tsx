import { useState } from "react";
import { motion } from "framer-motion";
import { Database, Table, FileJson, ArrowRight, Activity, Zap } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

export const SQLInteractive = () => {
  const [running, setRunning] = useState(false);

  const runDemo = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 2000);
  };

  return (
    <div className="glass-card p-4 md:p-6 rounded-xl w-full max-w-4xl mx-auto shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
      <div className="grid md:grid-cols-2 gap-4 md:gap-8 h-full">
        <div>
          <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4 text-primary flex items-center gap-2">
            <Table size={20} /> Relational Model
          </h3>
          <p className="text-[10px] md:text-sm text-muted-foreground mb-4 md:mb-6">Data is split into tables and normalized to reduce redundancy. Queries use JOINs to reconstruct data.</p>
          
          <div className="space-y-2 md:space-y-4 font-mono text-[9px] md:text-xs">
            <div className="bg-card border border-border p-2 md:p-3 rounded-lg shadow-inner">
              <div className="font-bold text-primary mb-1 md:mb-2 border-b border-border pb-1">USERS TABLE</div>
              <div className="flex justify-between text-muted-foreground"><span>id</span><span>INT PK</span></div>
              <div className="flex justify-between"><span>name</span><span>VARCHAR</span></div>
            </div>
            
            <div className="flex justify-center text-primary/50"><ArrowRight size={16} className="rotate-90 md:rotate-0 w-3 h-3 md:w-4 md:h-4" /></div>
            
            <div className="bg-card border border-border p-2 md:p-3 rounded-lg shadow-inner">
              <div className="font-bold text-primary mb-1 md:mb-2 border-b border-border pb-1">ORDERS TABLE</div>
              <div className="flex justify-between text-muted-foreground"><span>id</span><span>INT PK</span></div>
              <div className="flex justify-between"><span>user_id</span><span>INT FK</span></div>
              <div className="flex justify-between"><span>total</span><span>DECIMAL</span></div>
            </div>
          </div>
        </div>
        
        <div className="bg-muted/20 border border-border rounded-xl p-4 md:p-6 flex flex-col justify-between h-full">
          <div>
            <h4 className="font-bold mb-2 flex items-center gap-2 text-sm md:text-base"><Activity size={16} className="text-warning w-4 h-4 md:w-5 md:h-5"/> Query Example</h4>
            <pre className="bg-card p-3 md:p-4 rounded-lg text-[9px] md:text-xs overflow-x-auto text-primary/80 custom-scrollbar border border-border/50">
{`SELECT u.name, o.total 
FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE u.id = 1;`}
            </pre>
          </div>
          <div className="mt-4 md:mt-8 flex flex-col gap-2">
            <button onClick={runDemo} className="w-full py-2 md:py-3 bg-primary text-primary-foreground rounded-lg font-bold text-xs md:text-sm hover:bg-primary/90 transition-colors">
              Execute JOIN Query
            </button>
            <div className="h-8 md:h-10">
              {running && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 md:p-3 bg-success/20 border border-success/50 text-success text-[9px] md:text-xs font-mono rounded text-center">
                  Executing... (High CPU, ACID compliant)
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NoSQLInteractive = () => {
  const [running, setRunning] = useState(false);

  const runDemo = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 2000);
  };

  return (
    <div className="glass-card p-4 md:p-6 rounded-xl w-full max-w-4xl mx-auto shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
      <div className="grid md:grid-cols-2 gap-4 md:gap-8 h-full">
        <div>
          <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4 text-accent flex items-center gap-2">
            <FileJson size={20} /> Document Model
          </h3>
          <p className="text-[10px] md:text-sm text-muted-foreground mb-4 md:mb-6">Data is stored as JSON-like documents. Related data is often nested in a single document (denormalized).</p>
          
          <div className="space-y-2 md:space-y-4 font-mono text-[9px] md:text-xs">
            <div className="bg-card border border-border p-3 md:p-4 rounded-lg text-accent/80 shadow-inner overflow-auto custom-scrollbar max-h-48">
<pre>{`{
  "_id": "user_1",
  "name": "Alice",
  "orders": [
    {
      "order_id": "ord_99",
      "total": 120.50
    }
  ]
}`}</pre>
            </div>
          </div>
        </div>
        
        <div className="bg-muted/20 border border-border rounded-xl p-4 md:p-6 flex flex-col justify-between h-full">
          <div>
            <h4 className="font-bold mb-2 flex items-center gap-2 text-sm md:text-base"><Zap size={16} className="text-warning w-4 h-4 md:w-5 md:h-5"/> Query Example</h4>
            <pre className="bg-card p-3 md:p-4 rounded-lg text-[9px] md:text-xs overflow-x-auto text-accent/80 custom-scrollbar border border-border/50">
{`db.users.findOne({ 
  _id: "user_1" 
});`}
            </pre>
          </div>
          <div className="mt-4 md:mt-8 flex flex-col gap-2">
            <button onClick={runDemo} className="w-full py-2 md:py-3 bg-accent text-accent-foreground rounded-lg font-bold text-xs md:text-sm hover:bg-accent/90 transition-colors">
              Execute Read Query
            </button>
            <div className="h-8 md:h-10">
              {running && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 md:p-3 bg-success/20 border border-success/50 text-success text-[9px] md:text-xs font-mono rounded text-center">
                  Executing... (Fast lookup, eventually consistent)
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SQLvsNoSQLDemo = () => {
  const [activeTab, setActiveTab] = useState<'sql' | 'nosql'>('sql');

  return (
    <section className="py-24 px-6 bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">SQL vs NoSQL</h2>
            <p className="text-muted-foreground">
              <strong>SQL (Relational):</strong> Structured data, strict schema, ACID transactions. Good for complex queries and relations.<br/>
              <strong>NoSQL (Document/Key-Value):</strong> Unstructured data, dynamic schema, eventually consistent. Good for rapid development and horizontal scaling.
            </p>
          </div>
        </div>

        <div className="glass-card p-2 rounded-xl flex gap-2 w-max mx-auto mb-8">
          <button 
            onClick={() => setActiveTab('sql')}
            className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${activeTab === 'sql' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <Table size={18} /> SQL (PostgreSQL)
          </button>
          <button 
            onClick={() => setActiveTab('nosql')}
            className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors ${activeTab === 'nosql' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
          >
            <FileJson size={18} /> NoSQL (MongoDB)
          </button>
        </div>

        {activeTab === 'sql' ? <SQLInteractive /> : <NoSQLInteractive />}
      </div>
    </section>
  );
};

export default SQLvsNoSQLDemo;
