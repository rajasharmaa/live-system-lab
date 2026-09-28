import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Send, ShoppingCart, CreditCard, Mail, Box } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

export const EventDrivenInteractive = () => {
  const [events, setEvents] = useState<{ id: number; type: string; position: number }[]>([]);
  const [logs, setLogs] = useState<{ id: number; text: string }[]>([]);

  const triggerEvent = () => {
    const id = Date.now();
    setEvents(prev => [...prev, { id, type: 'order_placed', position: 0 }]);
    setLogs(prev => [{ id, text: 'Producer: User placed an order' }, ...prev].slice(0, 5));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => {
        let newEvents = prev.map(e => ({ ...e, position: e.position + 1 }));
        
        // When event reaches position 2 (Event Bus), add logs for consumers
        newEvents.forEach(e => {
          if (e.position === 2) {
            setLogs(logs => [
              { id: Date.now() + 1, text: 'Consumer (Payment): Processing payment' },
              { id: Date.now() + 2, text: 'Consumer (Inventory): Reserving items' },
              { id: Date.now() + 3, text: 'Consumer (Email): Sending confirmation' },
              ...logs
            ].slice(0, 5));
          }
        });
        
        // Remove events that are done (position > 4)
        return newEvents.filter(e => e.position <= 4);
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-4 md:p-8 rounded-xl w-full max-w-4xl mx-auto shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm flex flex-col">
      <div className="flex justify-center mb-6 md:mb-12">
        <button 
          onClick={triggerEvent}
          className="py-2 px-4 md:py-3 md:px-6 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors text-xs md:text-base"
        >
          <ShoppingCart size={16} className="md:w-5 md:h-5" /> 
          <span>Place Order <span className="hidden sm:inline">(Produce Event)</span></span>
        </button>
      </div>

      <div className="relative h-48 md:h-64 border border-border bg-card rounded-xl shadow-lg p-2 md:p-6 flex flex-col justify-between overflow-hidden mb-4 md:mb-8">
        {/* Event Bus (Center) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-32 md:h-32 rounded-full border-2 md:border-4 border-primary/30 flex items-center justify-center bg-primary/5 z-10">
          <div className="text-center">
            <Zap className="mx-auto text-primary mb-0.5 md:mb-1 w-5 h-5 md:w-6 md:h-6" />
            <span className="text-[9px] md:text-xs font-bold leading-tight">Event Bus</span>
          </div>
        </div>

        {/* Producer (Left) */}
        <div className="absolute top-1/2 left-2 md:left-8 -translate-y-1/2 flex flex-col items-center gap-1 md:gap-2 z-20">
          <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl bg-secondary/20 flex items-center justify-center border border-secondary/50">
            <ShoppingCart className="text-secondary w-5 h-5 md:w-6 md:h-6" />
          </div>
          <span className="text-[8px] md:text-xs font-semibold text-center leading-tight">Order<br/>Service</span>
        </div>

        {/* Consumers (Right) */}
        <div className="absolute top-2 md:top-4 right-2 md:right-8 flex items-center gap-2 md:gap-3 z-20">
          <span className="text-[8px] md:text-xs font-semibold text-right leading-tight hidden sm:block">Payment<br/>Service</span>
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-success/20 flex items-center justify-center border border-success/50" title="Payment Service">
            <CreditCard className="text-success w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
        
        <div className="absolute top-1/2 right-2 md:right-8 -translate-y-1/2 flex items-center gap-2 md:gap-3 z-20">
          <span className="text-[8px] md:text-xs font-semibold text-right leading-tight hidden sm:block">Inventory<br/>Service</span>
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-warning/20 flex items-center justify-center border border-warning/50" title="Inventory Service">
            <Box className="text-warning w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>

        <div className="absolute bottom-2 md:bottom-4 right-2 md:right-8 flex items-center gap-2 md:gap-3 z-20">
          <span className="text-[8px] md:text-xs font-semibold text-right leading-tight hidden sm:block">Email<br/>Service</span>
          <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-destructive/20 flex items-center justify-center border border-destructive/50" title="Email Service">
            <Mail className="text-destructive w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>

        {/* Event Animations */}
        <AnimatePresence>
          {events.map(event => (
            <motion.div
              key={event.id}
              initial={{ left: '20px', top: '50%', opacity: 1, scale: 0 }}
              animate={{
                left: event.position >= 2 ? 'calc(100% - 40px)' : '50%',
                top: event.position >= 2 ? (event.id % 3 === 0 ? '15%' : event.id % 3 === 1 ? '50%' : '85%') : '50%',
                scale: event.position === 2 ? 1.5 : 1,
                opacity: event.position > 3 ? 0 : 1,
              }}
              transition={{ duration: 0.8 }}
              className="absolute w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full shadow-[0_0_10px_var(--primary)] z-30 -translate-x-1/2 -translate-y-1/2"
            />
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-2 md:mt-4 h-32 md:h-40 overflow-hidden flex flex-col">
        <h4 className="text-[10px] md:text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex-shrink-0">Event Log</h4>
        <div className="space-y-1.5 md:space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
          <AnimatePresence>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-[10px] md:text-sm italic">Waiting for events...</p>
            ) : (
              logs.map(log => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-1.5 md:p-2 bg-muted/50 rounded border border-border text-[9px] md:text-xs font-mono"
                >
                  {log.text}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const EventDrivenDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Event-Driven Architecture</h2>
            <p className="text-muted-foreground">
              A software architecture paradigm promoting the production, detection, consumption of, and reaction to events. Services are decoupled; they don't know about each other, they just publish and subscribe to events on an Event Bus.
            </p>
          </div>
        </div>
        <EventDrivenInteractive />
      </div>
    </section>
  );
};

export default EventDrivenDemo;
