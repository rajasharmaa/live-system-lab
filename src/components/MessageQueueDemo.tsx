import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Inbox, CheckCircle2, Clock, Zap, Users, Gauge, Trash2, Server, ArrowRight, Activity, Database, Send } from "lucide-react";
import { MailCarrier } from "./ui/SVGMascots";

interface Message {
  id: number;
  type: "email" | "notification" | "analytics" | "payment";
  priority: "high" | "normal" | "low";
  status: "queued" | "processing" | "completed";
  createdAt: number;
  processedAt?: number;
}

export const MessageQueueInteractive = () => {
  const [queue, setQueue] = useState<Message[]>([]);
  const [processed, setProcessed] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSpeed, setProcessingSpeed] = useState(1000);
  const [numConsumers, setNumConsumers] = useState(1);
  const [producerRate, setProducerRate] = useState(0);
  const messageIdRef = useRef(0);

  const messageTypes: Message["type"][] = ["email", "notification", "analytics", "payment"];
  const priorities: Message["priority"][] = ["high", "normal", "low"];

  // Producer - adds messages to queue
  useEffect(() => {
    if (producerRate === 0) return;
    const interval = setInterval(() => {
      const newMessage: Message = {
        id: ++messageIdRef.current,
        type: messageTypes[Math.floor(Math.random() * messageTypes.length)],
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: "queued",
        createdAt: Date.now(),
      };
      setQueue(prev => [...prev, newMessage]);
    }, 1000 / producerRate);
    return () => clearInterval(interval);
  }, [producerRate]);

  // Consumer - processes messages
  useEffect(() => {
    if (!isProcessing || queue.length === 0) return;

    const processMessage = () => {
      setQueue(prev => {
        if (prev.length === 0) return prev;
        
        // Sort by priority (high first)
        const sorted = [...prev].sort((a, b) => {
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Process messages based on number of consumers
        const toProcess = sorted.slice(0, numConsumers);
        const remaining = sorted.slice(numConsumers);

        toProcess.forEach(msg => {
          const completedMsg: Message = {
            ...msg,
            status: "completed" as const,
            processedAt: Date.now(),
          };
          setProcessed(p => [completedMsg, ...p].slice(0, 20));
        });

        return remaining;
      });
    };

    const interval = setInterval(processMessage, processingSpeed);
    return () => clearInterval(interval);
  }, [isProcessing, queue.length, processingSpeed, numConsumers]);

  const addMessage = (priority: Message["priority"] = "normal") => {
    const newMessage: Message = {
      id: ++messageIdRef.current,
      type: messageTypes[Math.floor(Math.random() * messageTypes.length)],
      priority,
      status: "queued",
      createdAt: Date.now(),
    };
    setQueue(prev => [...prev, newMessage]);
  };

  const clearAll = () => {
    setQueue([]);
    setProcessed([]);
    messageIdRef.current = 0;
  };

  const getTypeIcon = (type: Message["type"]) => {
    switch (type) {
      case "email": return "📧";
      case "notification": return "🔔";
      case "analytics": return "📊";
      case "payment": return "💳";
    }
  };

  const getPriorityColor = (priority: Message["priority"]) => {
    switch (priority) {
      case "high": return "border-destructive bg-destructive/10";
      case "normal": return "border-primary bg-primary/10";
      case "low": return "border-muted-foreground bg-muted/10";
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-4 w-full max-w-5xl mx-auto">
      {/* Controls */}
      <Card className="glass-card p-4">
        <h3 className="text-sm md:text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          Queue Controls
        </h3>

        <div className="space-y-4">
          {/* Producer Controls */}
          <div>
            <label className="text-[10px] md:text-xs text-muted-foreground mb-1 block">
                  Producer Rate: {producerRate} msg/sec
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={producerRate}
                  onChange={(e) => setProducerRate(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Consumer Controls */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Consumers: {numConsumers}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={numConsumers}
                  onChange={(e) => setNumConsumers(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              {/* Processing Speed */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Processing Time: {processingSpeed}ms
                </label>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="100"
                  value={processingSpeed}
                  onChange={(e) => setProcessingSpeed(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => addMessage("high")}
                  variant="outline"
                  size="sm"
                  className="border-destructive text-destructive hover:bg-destructive/10"
                >
                  + High
                </Button>
                <Button
                  onClick={() => addMessage("normal")}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  + Normal
                </Button>
                <Button
                  onClick={() => addMessage("low")}
                  variant="outline"
                  size="sm"
                  className="border-muted-foreground hover:bg-muted/50"
                >
                  + Low
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setIsProcessing(!isProcessing)}
                  className="flex-1"
                  variant={isProcessing ? "destructive" : "default"}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  {isProcessing ? "Stop" : "Start"} Processing
                </Button>
                <Button onClick={clearAll} variant="outline" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-2 md:gap-4">
              <div className="glass-card p-2 rounded-lg text-center">
                <div className="text-lg md:text-2xl font-mono font-bold text-warning">{queue.length}</div>
                <div className="text-[9px] md:text-xs text-muted-foreground">Queued</div>
              </div>
              <div className="glass-card p-2 rounded-lg text-center">
                <div className="text-lg md:text-2xl font-mono font-bold text-success">{processed.length}</div>
                <div className="text-[9px] md:text-xs text-muted-foreground">Processed</div>
              </div>
            </div>
          </Card>

          {/* Queue Visualization */}
          <Card className="glass-card p-4">
            <h3 className="text-sm md:text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Inbox className="w-4 h-4 text-warning" />
              Message Queue
              <Badge variant="secondary" className="ml-auto text-[10px]">{queue.length}</Badge>
            </h3>

            <div className="h-48 md:h-80 overflow-y-auto space-y-2 custom-scrollbar pr-2">
              <AnimatePresence mode="popLayout">
                {queue.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                    className={`p-3 rounded-lg border-l-4 ${getPriorityColor(msg.priority)}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTypeIcon(msg.type)}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium capitalize">{msg.type}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          #{msg.id} • {msg.priority}
                        </div>
                      </div>
                      {index < numConsumers && isProcessing && (
                        <Badge className="animate-pulse bg-primary/20 text-primary">
                          Processing...
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {queue.length === 0 && (
                <div className="h-full flex items-center justify-center text-muted-foreground text-[10px] md:text-sm">
                  Queue is empty
                </div>
              )}
            </div>
          </Card>

          {/* Processed Messages */}
          <Card className="glass-card p-4 flex flex-col">
            <h3 className="text-sm md:text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Processed
              <Badge variant="secondary" className="ml-auto bg-success/20 text-success text-[10px]">{processed.length}</Badge>
            </h3>

            <div className="h-48 md:h-80 overflow-y-auto space-y-2 custom-scrollbar pr-2">
              <AnimatePresence>
                {processed.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-lg bg-success/5 border border-success/20"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-lg">{getTypeIcon(msg.type)}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium capitalize">{msg.type}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          #{msg.id} • {msg.processedAt ? `${msg.processedAt - msg.createdAt}ms` : ""}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {processed.length === 0 && (
                <div className="h-full flex items-center justify-center text-muted-foreground text-[10px] md:text-sm">
                  No processed messages
                </div>
              )}
            </div>
          </Card>
    </div>
  );
};

const MessageQueueDemo = () => {
  return (
    <section className="py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <MailCarrier />
          <div>
            <h2 className="text-3xl font-bold mb-2">Message Queue Architecture</h2>
            <p className="text-muted-foreground">
              A message queue provides asynchronous communication and decoupling between services.
              <strong> Why?</strong> Allows systems to scale independently, prevents data loss during traffic spikes (buffering), and improves perceived latency.
              <strong> Real-world:</strong> RabbitMQ, Amazon SQS, Kafka.
            </p>
          </div>
        </div>
        <MessageQueueInteractive />
      </div>
    </section>
  );
};

export default MessageQueueDemo;
