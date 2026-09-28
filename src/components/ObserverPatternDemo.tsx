import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, Radio, Zap, Bell, ShoppingCart, BarChart3, 
  Mail, MessageSquare, ArrowRight, Plus, X
} from "lucide-react";

interface Observer {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  subscribedEvents: string[];
  receivedEvents: EventMessage[];
}

interface EventMessage {
  id: string;
  type: string;
  data: string;
  timestamp: number;
  fromSubject: string;
}

const eventTypes = [
  { id: "user.login", label: "User Login", color: "text-primary" },
  { id: "order.placed", label: "Order Placed", color: "text-accent" },
  { id: "payment.completed", label: "Payment Done", color: "text-success" },
  { id: "item.outofstock", label: "Out of Stock", color: "text-destructive" },
  { id: "price.changed", label: "Price Changed", color: "text-warning" },
];

const initialObservers: Observer[] = [
  { id: "1", name: "Email Service", icon: Mail, color: "text-primary", subscribedEvents: ["order.placed", "payment.completed"], receivedEvents: [] },
  { id: "2", name: "Analytics", icon: BarChart3, color: "text-accent", subscribedEvents: ["user.login", "order.placed", "payment.completed"], receivedEvents: [] },
  { id: "3", name: "Notification", icon: Bell, color: "text-warning", subscribedEvents: ["item.outofstock", "price.changed"], receivedEvents: [] },
  { id: "4", name: "Inventory", icon: ShoppingCart, color: "text-success", subscribedEvents: ["order.placed", "item.outofstock"], receivedEvents: [] },
];

const ObserverPatternDemo = () => {
  const [observers, setObservers] = useState<Observer[]>(initialObservers);
  const [dispatchingEvent, setDispatchingEvent] = useState<string | null>(null);
  const [animatingTo, setAnimatingTo] = useState<string[]>([]);
  const [eventLog, setEventLog] = useState<{ event: string; observers: string[]; time: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"demo" | "subscriptions" | "log">("demo");

  const dispatchEvent = useCallback((eventType: string) => {
    if (dispatchingEvent) return;
    setDispatchingEvent(eventType);

    const targetObservers = observers.filter(o => o.subscribedEvents.includes(eventType));
    const targetIds = targetObservers.map(o => o.id);

    // Animate dispatch
    setTimeout(() => {
      setAnimatingTo(targetIds);
    }, 300);

    // Deliver events
    setTimeout(() => {
      const newEvent: EventMessage = {
        id: crypto.randomUUID(),
        type: eventType,
        data: `Event data for ${eventType}`,
        timestamp: Date.now(),
        fromSubject: "EventBus",
      };
      setObservers(prev => prev.map(o => {
        if (targetIds.includes(o.id)) {
          return { ...o, receivedEvents: [newEvent, ...o.receivedEvents].slice(0, 10) };
        }
        return o;
      }));
      setEventLog(prev => [{
        event: eventType,
        observers: targetObservers.map(o => o.name),
        time: new Date().toLocaleTimeString(),
      }, ...prev].slice(0, 20));
      setAnimatingTo([]);
      setDispatchingEvent(null);
    }, 1000);
  }, [dispatchingEvent, observers]);

  const toggleSubscription = (observerId: string, eventType: string) => {
    setObservers(prev => prev.map(o => {
      if (o.id !== observerId) return o;
      const has = o.subscribedEvents.includes(eventType);
      return {
        ...o,
        subscribedEvents: has
          ? o.subscribedEvents.filter(e => e !== eventType)
          : [...o.subscribedEvents, eventType],
      };
    }));
  };

  const eventColor = (type: string) => eventTypes.find(e => e.id === type)?.color || "text-foreground";

  return (
    <section className="py-24 relative">
      <div className="container px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30 mb-6">
            <Eye className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">Observer Pattern</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Observer</span> Pattern
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Decouple components with publish-subscribe. Subjects notify observers of state changes without tight coupling.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {(["demo", "subscriptions", "log"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab ? "bg-secondary text-secondary-foreground" : "glass-card hover:bg-muted/50"
              }`}
            >
              {tab === "demo" && <Radio className="w-4 h-4 inline mr-2" />}
              {tab === "subscriptions" && <Eye className="w-4 h-4 inline mr-2" />}
              {tab === "log" && <MessageSquare className="w-4 h-4 inline mr-2" />}
              {tab === "log" ? "Event Log" : tab}
            </button>
          ))}
        </div>

        {/* Demo Tab */}
        {activeTab === "demo" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Event Dispatcher */}
            <div className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Event Subject (Dispatcher)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Click an event to dispatch it to all subscribed observers:</p>
              <div className="flex flex-wrap gap-3">
                {eventTypes.map(event => (
                  <motion.button
                    key={event.id}
                    onClick={() => dispatchEvent(event.id)}
                    disabled={!!dispatchingEvent}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      dispatchingEvent === event.id
                        ? "bg-primary/20 border-primary ring-2 ring-primary/50"
                        : "glass-card border-border hover:border-primary/50"
                    } ${dispatchingEvent && dispatchingEvent !== event.id ? "opacity-40" : ""}`}
                  >
                    <span className={event.color}>{event.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Dispatch Animation */}
            <AnimatePresence>
              {dispatchingEvent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center justify-center gap-3 py-4"
                >
                  <div className="px-4 py-2 rounded-lg bg-primary/20 border border-primary/40 text-sm font-mono">
                    <span className={eventColor(dispatchingEvent)}>{dispatchingEvent}</span>
                  </div>
                  <motion.div animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </motion.div>
                  <span className="text-sm text-muted-foreground">dispatching to observers...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Observers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {observers.map(observer => {
                const isReceiving = animatingTo.includes(observer.id);
                return (
                  <motion.div
                    key={observer.id}
                    className={`glass-card p-5 border transition-all ${
                      isReceiving ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border"
                    }`}
                    animate={isReceiving ? { scale: [1, 1.03, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <observer.icon className={`w-5 h-5 ${observer.color}`} />
                      <h4 className="font-semibold text-sm text-foreground">{observer.name}</h4>
                      {isReceiving && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded"
                        >
                          received!
                        </motion.span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Subscribed to:</div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {observer.subscribedEvents.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">No subscriptions</span>
                      ) : (
                        observer.subscribedEvents.map(e => (
                          <span key={e} className={`text-xs px-2 py-0.5 rounded bg-muted/50 ${eventColor(e)}`}>
                            {e.split(".")[1]}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Events received: <span className="text-foreground font-mono">{observer.receivedEvents.length}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === "subscriptions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
            <h3 className="font-semibold text-foreground mb-4">Subscription Matrix</h3>
            <p className="text-sm text-muted-foreground mb-4">Toggle which events each observer subscribes to:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Observer</th>
                    {eventTypes.map(e => (
                      <th key={e.id} className={`text-center py-2 px-3 font-medium ${e.color}`}>{e.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {observers.map(observer => (
                    <tr key={observer.id} className="border-b border-border/50">
                      <td className="py-3 px-3 font-medium text-foreground flex items-center gap-2">
                        <observer.icon className={`w-4 h-4 ${observer.color}`} />
                        {observer.name}
                      </td>
                      {eventTypes.map(event => {
                        const subscribed = observer.subscribedEvents.includes(event.id);
                        return (
                          <td key={event.id} className="text-center py-3 px-3">
                            <button
                              onClick={() => toggleSubscription(observer.id, event.id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                subscribed
                                  ? "bg-primary/20 text-primary border border-primary/40"
                                  : "bg-muted/30 text-muted-foreground border border-border hover:border-primary/30"
                              }`}
                            >
                              {subscribed ? <Eye className="w-4 h-4" /> : <Plus className="w-3 h-3" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Event Log Tab */}
        {activeTab === "log" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Event Dispatch Log</span>
              {eventLog.length > 0 && (
                <button onClick={() => setEventLog([])} className="text-xs text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3 inline mr-1" />Clear
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {eventLog.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Dispatch events from the Demo tab to see the log
                </div>
              ) : (
                eventLog.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="px-4 py-3 border-b border-border/50 flex items-start gap-3 text-sm"
                  >
                    <span className="text-xs text-muted-foreground font-mono mt-0.5">{entry.time}</span>
                    <span className={`font-mono font-medium ${eventColor(entry.event)}`}>{entry.event}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {entry.observers.map(o => (
                        <span key={o} className="text-xs px-2 py-0.5 rounded bg-muted/50 text-foreground">{o}</span>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default ObserverPatternDemo;
