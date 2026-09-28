import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Radio, Users, MessageSquare, ArrowRight, 
  Send, CheckCircle, Bell, Zap, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  topic: string;
  content: string;
  publisher: string;
  timestamp: number;
}

interface Subscriber {
  id: string;
  name: string;
  topics: string[];
  messages: Message[];
  color: string;
}

interface Topic {
  id: string;
  name: string;
  color: string;
  messageCount: number;
}

const initialTopics: Topic[] = [
  { id: "orders", name: "orders", color: "bg-blue-500", messageCount: 0 },
  { id: "payments", name: "payments", color: "bg-green-500", messageCount: 0 },
  { id: "notifications", name: "notifications", color: "bg-purple-500", messageCount: 0 },
  { id: "analytics", name: "analytics", color: "bg-orange-500", messageCount: 0 },
];

const initialSubscribers: Subscriber[] = [
  { id: "1", name: "Order Service", topics: ["orders"], messages: [], color: "bg-blue-500" },
  { id: "2", name: "Payment Service", topics: ["orders", "payments"], messages: [], color: "bg-green-500" },
  { id: "3", name: "Email Service", topics: ["notifications"], messages: [], color: "bg-purple-500" },
  { id: "4", name: "Analytics Engine", topics: ["orders", "payments", "analytics"], messages: [], color: "bg-orange-500" },
  { id: "5", name: "Audit Logger", topics: ["orders", "payments", "notifications", "analytics"], messages: [], color: "bg-red-500" },
];

const PubSubDemo = () => {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [subscribers, setSubscribers] = useState<Subscriber[]>(initialSubscribers);
  const [publishedMessages, setPublishedMessages] = useState<Message[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("orders");
  const [messageContent, setMessageContent] = useState("");
  const [animatingMessage, setAnimatingMessage] = useState<{ message: Message; targetSubs: string[] } | null>(null);
  const [isAutoPublishing, setIsAutoPublishing] = useState(false);

  const publishMessage = useCallback((topic: string, content: string) => {
    const message: Message = {
      id: Math.random().toString(36).substr(2, 9),
      topic,
      content: content || `Event from ${topic}`,
      publisher: "Publisher",
      timestamp: Date.now(),
    };

    // Update topic message count
    setTopics(prev => prev.map(t => 
      t.id === topic ? { ...t, messageCount: t.messageCount + 1 } : t
    ));

    // Add to published messages
    setPublishedMessages(prev => [message, ...prev.slice(0, 9)]);

    // Find subscribers for this topic
    const targetSubscribers = subscribers.filter(s => s.topics.includes(topic));
    
    // Animate message delivery
    setAnimatingMessage({ message, targetSubs: targetSubscribers.map(s => s.id) });

    // Deliver to subscribers after animation
    setTimeout(() => {
      setSubscribers(prev => prev.map(sub => {
        if (sub.topics.includes(topic)) {
          return {
            ...sub,
            messages: [message, ...sub.messages.slice(0, 4)],
          };
        }
        return sub;
      }));
      setAnimatingMessage(null);
    }, 800);

    setMessageContent("");
  }, [subscribers]);

  useEffect(() => {
    if (!isAutoPublishing) return;

    const interval = setInterval(() => {
      const randomTopic = initialTopics[Math.floor(Math.random() * initialTopics.length)];
      const sampleMessages = [
        "New order #12345 placed",
        "Payment processed successfully",
        "User signup completed",
        "Inventory updated",
        "Report generated",
      ];
      publishMessage(randomTopic.id, sampleMessages[Math.floor(Math.random() * sampleMessages.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoPublishing, publishMessage]);

  const handlePublish = () => {
    if (!selectedTopic) return;
    publishMessage(selectedTopic, messageContent);
  };

  return (
    <section id="pub-sub" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Messaging & Async</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Pub-Sub</span>
            <span className="text-foreground"> Pattern</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Publishers send messages to topics without knowing subscribers. 
            Subscribers receive messages from topics they're interested in.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-lg border border-primary/30">
              <Send className="w-5 h-5 text-primary" />
              <span className="font-medium">Publishers</span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-lg border border-secondary/30">
              <Radio className="w-5 h-5 text-secondary" />
              <span className="font-medium">Message Broker</span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-lg border border-accent/30">
              <Users className="w-5 h-5 text-accent" />
              <span className="font-medium">Subscribers</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Publisher */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Publisher</h3>
            </div>

            <div className="space-y-4">
              {/* Topic Selection */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Select Topic</label>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedTopic === topic.id
                          ? `${topic.color} text-white`
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {topic.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Message content..."
                  onKeyDown={(e) => e.key === 'Enter' && handlePublish()}
                />
                <Button onClick={handlePublish} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Auto-publish toggle */}
              <Button 
                variant={isAutoPublishing ? "destructive" : "outline"} 
                className="w-full"
                onClick={() => setIsAutoPublishing(!isAutoPublishing)}
              >
                <Zap className="w-4 h-4 mr-2" />
                {isAutoPublishing ? "Stop Auto-Publish" : "Start Auto-Publish"}
              </Button>

              {/* Recent Published */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Published Messages</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <AnimatePresence>
                    {publishedMessages.slice(0, 5).map((msg) => {
                      const topic = topics.find(t => t.id === msg.topic);
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-2 bg-muted/50 rounded text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${topic?.color}`} />
                            <span className="font-mono">{msg.topic}</span>
                          </div>
                          <p className="text-muted-foreground mt-1 truncate">{msg.content}</p>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Topics / Broker */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-5 h-5 text-secondary" />
              <h3 className="text-lg font-semibold">Message Broker</h3>
            </div>

            <div className="space-y-4">
              {/* Topics */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Topics</h4>
                <div className="space-y-2">
                  {topics.map((topic) => (
                    <motion.div
                      key={topic.id}
                      animate={{
                        scale: animatingMessage?.message.topic === topic.id ? [1, 1.05, 1] : 1,
                      }}
                      className={`p-3 rounded-lg border-2 ${
                        animatingMessage?.message.topic === topic.id
                          ? "border-primary bg-primary/10"
                          : "border-transparent bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${topic.color}`} />
                          <span className="font-mono text-sm">{topic.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {topic.messageCount} msgs
                        </Badge>
                      </div>
                      {/* Subscriber indicators */}
                      <div className="flex gap-1 mt-2">
                        {subscribers.filter(s => s.topics.includes(topic.id)).map((sub) => (
                          <div
                            key={sub.id}
                            className={`w-4 h-4 rounded-full ${sub.color} opacity-50`}
                            title={sub.name}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Animation indicator */}
              <AnimatePresence>
                {animatingMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="p-3 bg-primary/20 rounded-lg border border-primary/50"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary animate-bounce" />
                      <span className="text-sm">Delivering to {animatingMessage.targetSubs.length} subscribers...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Subscribers */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold">Subscribers</h3>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {subscribers.map((subscriber) => (
                <motion.div
                  key={subscriber.id}
                  animate={{
                    scale: animatingMessage?.targetSubs.includes(subscriber.id) ? [1, 1.03, 1] : 1,
                    borderColor: animatingMessage?.targetSubs.includes(subscriber.id) 
                      ? "hsl(var(--primary))" 
                      : "transparent",
                  }}
                  className="p-3 rounded-lg bg-muted/50 border-2"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${subscriber.color}`} />
                    <span className="font-medium text-sm">{subscriber.name}</span>
                  </div>
                  
                  {/* Subscribed topics */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Filter className="w-3 h-3 text-muted-foreground" />
                    {subscriber.topics.map((topicId) => {
                      const topic = topics.find(t => t.id === topicId);
                      return (
                        <span key={topicId} className={`text-xs px-1.5 py-0.5 rounded ${topic?.color} text-white`}>
                          {topicId}
                        </span>
                      );
                    })}
                  </div>

                  {/* Recent messages */}
                  {subscriber.messages.length > 0 && (
                    <div className="space-y-1">
                      {subscriber.messages.slice(0, 2).map((msg) => (
                        <div key={msg.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span className="truncate">{msg.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Pub-Sub Benefits
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🔓 Loose Coupling</h4>
              <p className="text-sm text-muted-foreground">
                Publishers and subscribers don't need to know about each other.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">📈 Scalability</h4>
              <p className="text-sm text-muted-foreground">
                Add subscribers without modifying publishers or broker.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">⚡ Async Processing</h4>
              <p className="text-sm text-muted-foreground">
                Publishers don't wait for subscribers to process messages.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🎯 Topic Filtering</h4>
              <p className="text-sm text-muted-foreground">
                Subscribers receive only messages they're interested in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PubSubDemo;
