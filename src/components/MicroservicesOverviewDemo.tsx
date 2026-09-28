import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, Layers, ArrowRight, Database, Code, Shield } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

const MicroservicesOverviewDemo = () => {
  const [arch, setArch] = useState<'monolith' | 'microservices'>('monolith');

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Microservices vs Monolith</h2>
            <p className="text-muted-foreground">
              A monolithic application puts all its routing, middleware, and business logic in a single deployable unit. Microservices break these down into independently deployable, smaller services that communicate over a network, often each with their own database.
            </p>
          </div>
        </div>

        <div className="glass-card p-8 rounded-xl max-w-5xl mx-auto flex flex-col items-center gap-12">
          
          <div className="flex bg-muted p-1 rounded-lg">
            <button 
              onClick={() => setArch('monolith')}
              className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${arch === 'monolith' ? 'bg-background shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Monolithic Architecture
            </button>
            <button 
              onClick={() => setArch('microservices')}
              className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${arch === 'microservices' ? 'bg-background shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Microservices Architecture
            </button>
          </div>

          <div className="w-full relative h-96 border border-border bg-card rounded-xl overflow-hidden flex items-center justify-center p-8">
            <AnimatePresence mode="wait">
              {arch === 'monolith' ? (
                <motion.div 
                  key="monolith"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-12 items-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-bold">Clients</span>
                    <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center">
                      <Box size={24} className="text-muted-foreground" />
                    </div>
                  </div>
                  
                  <ArrowRight className="text-muted-foreground" />
                  
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-bold text-primary">Monolith Application</span>
                    <div className="w-64 p-4 rounded-xl bg-primary/10 border-2 border-primary flex flex-col gap-2">
                      <div className="bg-background p-2 border border-border rounded text-center text-xs font-bold text-primary flex justify-center gap-2"><Shield size={14}/> Auth Logic</div>
                      <div className="bg-background p-2 border border-border rounded text-center text-xs font-bold text-primary flex justify-center gap-2"><Code size={14}/> Users Logic</div>
                      <div className="bg-background p-2 border border-border rounded text-center text-xs font-bold text-primary flex justify-center gap-2"><Code size={14}/> Orders Logic</div>
                      <div className="bg-background p-2 border border-border rounded text-center text-xs font-bold text-primary flex justify-center gap-2"><Code size={14}/> Billing Logic</div>
                    </div>
                  </div>

                  <ArrowRight className="text-muted-foreground" />

                  <div className="flex flex-col items-center gap-2">
                    <span className="font-bold text-secondary">Single Database</span>
                    <div className="w-24 h-24 rounded-xl bg-secondary/10 border-2 border-secondary flex items-center justify-center">
                      <Database size={48} className="text-secondary" />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="microservices"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="flex gap-8 items-center w-full max-w-4xl"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-bold">Clients</span>
                    <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center">
                      <Box size={24} className="text-muted-foreground" />
                    </div>
                  </div>
                  
                  <ArrowRight className="text-muted-foreground" />
                  
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-bold text-warning">API Gateway</span>
                    <div className="w-16 h-48 rounded-xl bg-warning/10 border-2 border-warning flex flex-col items-center justify-center">
                      <Layers size={24} className="text-warning mb-2" />
                      <span className="text-[10px] uppercase font-bold text-warning rotate-180" style={{ writingMode: 'vertical-rl' }}>ROUTER</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between h-80 flex-1 relative px-8">
                    {/* Connecting lines */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-1 bg-warning/50"></div>
                    <div className="absolute left-8 top-10 bottom-10 w-1 bg-warning/50"></div>
                    <div className="absolute left-8 top-10 w-8 h-1 bg-warning/50"></div>
                    <div className="absolute left-8 bottom-10 w-8 h-1 bg-warning/50"></div>
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-1 bg-warning/50"></div>
                    
                    {/* Service 1 */}
                    <div className="flex items-center gap-4 relative z-10 ml-16">
                      <div className="bg-background w-32 p-3 border-2 border-primary rounded-xl flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-primary mb-1">Users Service</span>
                        <Code size={16} className="text-primary"/>
                      </div>
                      <ArrowRight className="text-muted-foreground" size={16} />
                      <div className="w-12 h-12 rounded-lg bg-secondary/10 border-2 border-secondary flex items-center justify-center">
                        <Database size={20} className="text-secondary" />
                      </div>
                    </div>
                    
                    {/* Service 2 */}
                    <div className="flex items-center gap-4 relative z-10 ml-16">
                      <div className="bg-background w-32 p-3 border-2 border-primary rounded-xl flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-primary mb-1">Orders Service</span>
                        <Code size={16} className="text-primary"/>
                      </div>
                      <ArrowRight className="text-muted-foreground" size={16} />
                      <div className="w-12 h-12 rounded-lg bg-secondary/10 border-2 border-secondary flex items-center justify-center">
                        <Database size={20} className="text-secondary" />
                      </div>
                    </div>
                    
                    {/* Service 3 */}
                    <div className="flex items-center gap-4 relative z-10 ml-16">
                      <div className="bg-background w-32 p-3 border-2 border-primary rounded-xl flex flex-col items-center text-center">
                        <span className="text-xs font-bold text-primary mb-1">Billing Service</span>
                        <Code size={16} className="text-primary"/>
                      </div>
                      <ArrowRight className="text-muted-foreground" size={16} />
                      <div className="w-12 h-12 rounded-lg bg-secondary/10 border-2 border-secondary flex items-center justify-center">
                        <Database size={20} className="text-secondary" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid md:grid-cols-2 gap-8 w-full text-sm">
            <div className="bg-card border border-border p-4 rounded-xl">
              <h4 className="font-bold mb-2">Monolith Pros & Cons</h4>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside text-xs">
                <li><span className="text-success font-bold">+</span> Simple to develop and test initially</li>
                <li><span className="text-success font-bold">+</span> Easy to deploy (one artifact)</li>
                <li><span className="text-success font-bold">+</span> No network overhead between modules</li>
                <li><span className="text-destructive font-bold">-</span> Hard to scale individual components</li>
                <li><span className="text-destructive font-bold">-</span> Codebase becomes tangled over time</li>
                <li><span className="text-destructive font-bold">-</span> Any bug can crash the entire application</li>
              </ul>
            </div>
            <div className="bg-card border border-border p-4 rounded-xl">
              <h4 className="font-bold mb-2">Microservices Pros & Cons</h4>
              <ul className="space-y-1 text-muted-foreground list-disc list-inside text-xs">
                <li><span className="text-success font-bold">+</span> Services scale independently</li>
                <li><span className="text-success font-bold">+</span> Teams can work and deploy independently</li>
                <li><span className="text-success font-bold">+</span> Can use different tech stacks per service</li>
                <li><span className="text-destructive font-bold">-</span> Complex distributed system (network fails)</li>
                <li><span className="text-destructive font-bold">-</span> Harder to trace requests and debug</li>
                <li><span className="text-destructive font-bold">-</span> Data consistency (distributed transactions) is hard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MicroservicesOverviewDemo;
