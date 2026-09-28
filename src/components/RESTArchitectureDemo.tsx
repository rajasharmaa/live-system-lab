import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Database, ArrowRight, ArrowLeft } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

export const RESTInteractive = () => {
  const [activeMethod, setActiveMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE' | null>(null);
  const [dbItems, setDbItems] = useState<{ id: number; name: string }[]>([
    { id: 1, name: "Item 1" },
    { id: 2, name: "Item 2" }
  ]);
  const [response, setResponse] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);

  const handleRequest = (method: 'GET' | 'POST' | 'PUT' | 'DELETE') => {
    if (isAnimating) return;
    setActiveMethod(method);
    setIsAnimating(true);
    setResponse("");

    setTimeout(() => {
      switch (method) {
        case 'GET':
          setResponse(JSON.stringify(dbItems, null, 2));
          break;
        case 'POST':
          const newItem = { id: dbItems.length + 1, name: `Item ${dbItems.length + 1}` };
          setDbItems([...dbItems, newItem]);
          setResponse(`201 Created\n${JSON.stringify(newItem, null, 2)}`);
          break;
        case 'PUT':
          if (dbItems.length > 0) {
            const updated = [...dbItems];
            updated[0] = { ...updated[0], name: `${updated[0].name} (Updated)` };
            setDbItems(updated);
            setResponse(`200 OK\n${JSON.stringify(updated[0], null, 2)}`);
          } else {
            setResponse("404 Not Found");
          }
          break;
        case 'DELETE':
          if (dbItems.length > 0) {
            setDbItems(dbItems.slice(1));
            setResponse("204 No Content");
          } else {
            setResponse("404 Not Found");
          }
          break;
      }
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    }, 1500);
  };

  return (
    <div className="glass-card p-4 md:p-8 rounded-xl w-full max-w-4xl mx-auto shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm flex flex-col">
      <div className="flex flex-wrap gap-2 md:gap-4 justify-center mb-6 md:mb-12">
        {[
          { m: 'GET', color: 'bg-blue-500', label: 'Read' },
          { m: 'POST', color: 'bg-green-500', label: 'Create' },
          { m: 'PUT', color: 'bg-yellow-500', label: 'Update' },
          { m: 'DELETE', color: 'bg-red-500', label: 'Delete' }
        ].map(btn => (
          <button
            key={btn.m}
            onClick={() => handleRequest(btn.m as any)}
            disabled={isAnimating}
            className={`py-1.5 px-3 md:py-2 md:px-6 rounded-lg font-bold text-white shadow-lg disabled:opacity-50 transition-transform active:scale-95 ${btn.color} text-xs md:text-base`}
          >
            {btn.m}
            <span className="block text-[8px] md:text-[10px] font-normal opacity-80">{btn.label}</span>
          </button>
        ))}
      </div>

      <div className="relative flex justify-between items-center h-48 md:h-64 border-b border-border/50 pb-4 md:pb-8 mb-4 md:mb-8">
        {/* Client */}
        <div className="z-10 flex flex-col items-center gap-2 md:gap-4 bg-card p-3 md:p-6 rounded-xl border border-border shadow-lg w-24 md:w-48 text-center">
          <Globe size={32} className="text-primary md:w-12 md:h-12" />
          <div>
            <h3 className="font-bold text-xs md:text-base">Client</h3>
            <p className="text-[9px] md:text-xs text-muted-foreground hidden sm:block">HTTP Requests</p>
          </div>
        </div>

        {/* Network Area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[2px] bg-border absolute top-1/2 -translate-y-1/2"></div>
          
          <AnimatePresence>
            {activeMethod && isAnimating && (
              <motion.div
                initial={{ left: '15%', opacity: 0 }}
                animate={{ left: '85%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute top-1/2 -translate-y-1/2 bg-background border border-border rounded-lg p-1.5 md:p-2 text-[10px] md:text-xs font-mono shadow-md flex items-center gap-1 md:gap-2 whitespace-nowrap"
              >
                <ArrowRight size={12} className="text-primary md:w-3.5 md:h-3.5" />
                <span className="hidden sm:inline">{activeMethod} /api/items</span>
                <span className="inline sm:hidden">{activeMethod}</span>
              </motion.div>
            )}
            {!isAnimating && response && (
              <motion.div
                initial={{ left: '85%', opacity: 0 }}
                animate={{ left: '15%', opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
                className="absolute top-1/2 -translate-y-1/2 bg-background border border-success/50 rounded-lg p-1.5 md:p-2 text-[10px] md:text-xs font-mono shadow-md flex items-center gap-1 md:gap-2 text-success whitespace-nowrap"
              >
                <ArrowLeft size={12} className="md:w-3.5 md:h-3.5" />
                Response
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Server / DB */}
        <div className="z-10 flex flex-col items-center gap-2 md:gap-4 bg-card p-3 md:p-6 rounded-xl border border-border shadow-lg w-24 md:w-48 relative overflow-hidden text-center">
          <Database size={32} className="text-secondary md:w-12 md:h-12" />
          <div>
            <h3 className="font-bold text-xs md:text-base">Server</h3>
            <p className="text-[9px] md:text-xs text-muted-foreground hidden sm:block">Resources</p>
          </div>
          
          <AnimatePresence>
            {activeMethod && isAnimating && (
               <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-secondary/10 backdrop-blur-[2px] flex items-center justify-center z-20"
             >
               <span className="text-[10px] md:text-xs font-bold animate-pulse text-secondary">Processing...</span>
             </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="grid sm:grid-cols-2 gap-4 md:gap-8">
        <div>
          <h4 className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Server State</h4>
          <pre className="bg-muted p-2 md:p-4 rounded-lg text-[10px] md:text-xs font-mono h-24 md:h-32 overflow-auto border border-border text-primary custom-scrollbar">
            {JSON.stringify(dbItems, null, 2)}
          </pre>
        </div>
        <div>
          <h4 className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Client Response</h4>
          <pre className="bg-muted p-2 md:p-4 rounded-lg text-[10px] md:text-xs font-mono h-24 md:h-32 overflow-auto border border-border text-success custom-scrollbar">
            {response || "// Waiting for request..."}
          </pre>
        </div>
      </div>
    </div>
  );
};

const RESTArchitectureDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">REST Architecture</h2>
            <p className="text-muted-foreground">
              Representational State Transfer (REST) is an architectural style that defines a set of constraints to be used for creating Web services. It relies on standard HTTP methods (GET, POST, PUT, DELETE) applied to resources (URIs).
            </p>
          </div>
        </div>
        <RESTInteractive />
      </div>
    </section>
  );
};

export default RESTArchitectureDemo;
