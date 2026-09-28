import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Server, Database, Zap, Shield, Activity, 
  GitBranch, MessageSquare, CheckCircle, Circle,
  ChevronRight, Lock, BarChart3, Cloud, Cpu
} from "lucide-react";
import { componentRegistry } from "../pages/ConceptPage";


interface Topic {
  id: string;
  name: string;
  implemented: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  topics: Topic[];
}

const categories: Category[] = [
  {
    id: "basics",
    name: "Basic System Design",
    icon: Server,
    color: "hsl(var(--primary))",
    topics: [
      { id: "client-server", name: "Client-Server Architecture", implemented: true },
      { id: "microservices", name: "Microservices Architecture", implemented: true },
      { id: "event-driven", name: "Event-Driven Architecture", implemented: true },
      { id: "rest", name: "REST Architecture", implemented: true },
      { id: "graphql", name: "GraphQL Architecture", implemented: true },
    ]
  },
  {
    id: "scalability",
    name: "Scalability & Performance",
    icon: Zap,
    color: "hsl(var(--warning))",
    topics: [
      { id: "horizontal-vs-vertical", name: "Horizontal vs Vertical Scaling", implemented: true },
      { id: "load-balancer", name: "Load Balancer", implemented: true },
      { id: "caching", name: "Caching (Redis)", implemented: true },
      { id: "cache-strategies", name: "Cache Writing Strategies", implemented: true },
      { id: "rate-limiting", name: "Rate Limiting", implemented: true },
      { id: "sharding", name: "Database Sharding", implemented: true },
      { id: "cdn", name: "CDN", implemented: true },
      { id: "consistent-hashing", name: "Consistent Hashing", implemented: true },
    ]
  },
  {
    id: "databases",
    name: "Databases & Storage",
    icon: Database,
    color: "hsl(var(--accent))",
    topics: [
      { id: "sql-vs-nosql", name: "SQL vs NoSQL Databases", implemented: true },
      { id: "wal", name: "Write-Ahead Log (WAL)", implemented: true },
      { id: "key-value", name: "Key-Value Store (Redis)", implemented: true },
      { id: "replication", name: "Database Replication", implemented: true },
      { id: "indexing", name: "Database Indexing", implemented: true },
      { id: "websocket", name: "Polling vs SSE vs WebSockets", implemented: true },
      { id: "connection-pool", name: "Connection Pooling", implemented: true },
    ]
  },
  {
    id: "distributed",
    name: "Distributed Systems",
    icon: GitBranch,
    color: "hsl(var(--secondary))",
    topics: [
      { id: "cap-theorem", name: "CAP Theorem", implemented: true },
      { id: "leader-election", name: "Leader Election (Raft/Bully)", implemented: true },
      { id: "two-phase-commit", name: "Two-Phase Commit", implemented: true },
      { id: "consensus", name: "Consensus Algorithms", implemented: true },
      { id: "bloom-filter", name: "Bloom Filter", implemented: true },
      { id: "gossip-protocol", name: "Gossip Protocol", implemented: true },
      { id: "distributed-locks", name: "Distributed Locks", implemented: true },
    ]
  },
  {
    id: "messaging",
    name: "Messaging & Async",
    icon: MessageSquare,
    color: "hsl(190 100% 60%)",
    topics: [
      { id: "message-queue", name: "Message Queue", implemented: true },
      { id: "back-pressure", name: "Back Pressure", implemented: true },
      { id: "pub-sub", name: "Pub-Sub System", implemented: true },
      { id: "event-streaming", name: "Event Streaming", implemented: true },
      { id: "saga", name: "Saga Pattern", implemented: true },
    ]
  },
  {
    id: "reliability",
    name: "Reliability & Fault Tolerance",
    icon: Shield,
    color: "hsl(var(--success))",
    topics: [
      { id: "heartbeat", name: "Heartbeat / Failure Detection", implemented: true },
      { id: "idempotency", name: "Idempotency API", implemented: true },
      { id: "circuit-breaker", name: "Circuit Breaker", implemented: true },
      { id: "retry-pattern", name: "Retry Mechanism", implemented: true },
      { id: "bulkhead", name: "Bulkhead Pattern", implemented: true },
      { id: "health-checks", name: "Health Checks", implemented: true },
    ]
  },
  {
    id: "security",
    name: "Security & Authentication",
    icon: Lock,
    color: "hsl(0 85% 60%)",
    topics: [
      { id: "jwt", name: "JWT Authentication", implemented: true },
      { id: "oauth", name: "OAuth Flow", implemented: true },
      { id: "rbac", name: "RBAC", implemented: true },
      { id: "encryption", name: "Encryption/TLS", implemented: true },
    ]
  },
  {
    id: "patterns",
    name: "System Design Patterns",
    icon: GitBranch,
    color: "hsl(280 80% 60%)",
    topics: [
      { id: "cqrs", name: "CQRS", implemented: true },
      { id: "event-sourcing", name: "Event Sourcing", implemented: true },
      { id: "saga-pattern", name: "Saga Pattern", implemented: true },
      { id: "observer", name: "Observer Pattern", implemented: true },
    ]
  },
  {
    id: "monitoring",
    name: "Monitoring & Logging",
    icon: BarChart3,
    color: "hsl(45 100% 55%)",
    topics: [
      { id: "metrics", name: "Metrics Dashboard", implemented: true },
      { id: "tracing", name: "Distributed Tracing", implemented: true },
      { id: "logging", name: "Centralized Logging", implemented: true },
      { id: "alerting", name: "Alerting", implemented: true },
    ]
  },
  {
    id: "cloud",
    name: "Cloud & DevOps",
    icon: Cloud,
    color: "hsl(200 100% 50%)",
    topics: [
      { id: "reverse-proxy", name: "Reverse Proxy", implemented: true },
      { id: "api-gateway", name: "API Gateway", implemented: true },
      { id: "containers", name: "Docker/Kubernetes", implemented: true },
      { id: "ci-cd", name: "CI/CD Pipeline", implemented: true },
      { id: "auto-scaling", name: "Auto Scaling", implemented: true },
      { id: "serverless", name: "Serverless", implemented: true },
      { id: "service-mesh", name: "Service Mesh (Istio)", implemented: true },
      { id: "load-testing", name: "Load Testing", implemented: true },
      { id: "microservices-overview", name: "Microservices Overview", implemented: true },
    ]
  },
  {
    id: "os",
    name: "Operating Systems",
    icon: Cpu,
    color: "hsl(30 90% 55%)",
    topics: [
      { id: "process-scheduling", name: "CPU Scheduling", implemented: true },
      { id: "page-replacement", name: "Page Replacement", implemented: true },
      { id: "deadlock", name: "Deadlock (Banker's)", implemented: true },
      { id: "process-sync", name: "Process Synchronization", implemented: true },
      { id: "disk-scheduling", name: "Disk Scheduling", implemented: true },
      { id: "memory-allocation", name: "Memory Allocation", implemented: true },
      { id: "threads-vs-processes", name: "Threads vs Processes", implemented: true },
      { id: "virtual-memory", name: "Virtual Memory / Paging", implemented: true },
      { id: "ipc", name: "Inter-Process Communication", implemented: true },
      { id: "file-allocation", name: "File Allocation Methods", implemented: true },
    ]
  },
];

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};

const TopicsRoadmap = () => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const isTopicImplemented = (id: string) => !!componentRegistry[id];

  const totalTopics = categories.reduce((acc, cat) => acc + cat.topics.length, 0);
  const implementedTopics = categories.reduce(
    (acc, cat) => acc + cat.topics.filter(t => isTopicImplemented(t.id)).length, 0
  );
  const progressPercent = Math.round((implementedTopics / totalTopics) * 100);

  return (
    <section id="roadmap" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">System Design</span> Roadmap
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Interactive visualizations of {totalTopics} system design concepts. 
            Click any category to explore demos.
          </p>
          
          {/* Progress bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono text-primary">{implementedTopics}/{totalTopics} topics</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${progressPercent}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: 'var(--gradient-primary)' }}
              />
            </div>
          </div>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {categories.map((category, index) => {
            const implemented = category.topics.filter(t => isTopicImplemented(t.id)).length;
            const isExpanded = expandedCategory === category.id;
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className={`relative ${isExpanded ? 'z-50' : ''}`}
              >
                <motion.button
                  onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full glass-card p-4 text-left transition-all ${
                    isExpanded ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <category.icon className="w-5 h-5" style={{ color: category.color }} />
                    </div>
                    <ChevronRight 
                      className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{category.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${(implemented / category.topics.length) * 100}%`,
                          backgroundColor: category.color 
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {implemented}/{category.topics.length}
                    </span>
                  </div>
                </motion.button>

                {/* Expanded Topics List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full left-0 right-0 z-50 mt-3 glass-card p-2 space-y-1 overflow-hidden rounded-xl shadow-2xl border border-white/10 backdrop-blur-xl"
                      style={{ boxShadow: `0 10px 40px -10px ${category.color}50` }}
                    >
                      {category.topics.map((topic, i) => (
                        <motion.button
                          key={topic.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 + 0.1 }}
                          onClick={() => navigate(`/concept/${topic.id}`)}
                          disabled={!isTopicImplemented(topic.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200 ${
                            isTopicImplemented(topic.id) 
                              ? 'hover:bg-white/10 cursor-pointer hover:translate-x-1 text-foreground hover:text-white' 
                              : 'opacity-40 cursor-not-allowed text-muted-foreground'
                          }`}
                        >
                          {isTopicImplemented(topic.id) ? (
                            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: category.color }} />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="truncate font-medium">{topic.name}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Navigation - Sticky */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap justify-center gap-2 sticky top-4 z-40 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border shadow-lg"
        >
          {[
            { label: "Rate Limiting", id: "rate-limiting" },
            { label: "Caching", id: "caching" },
            { label: "Horizontal vs Vertical", id: "horizontal-vs-vertical" },
            { label: "Reverse Proxy", id: "reverse-proxy" },
            { label: "Idempotency", id: "idempotency" },
            { label: "Back Pressure", id: "back-pressure" },
            { label: "SQL vs NoSQL", id: "sql-vs-nosql" },
            { label: "WAL", id: "wal" },
            { label: "Heartbeat", id: "heartbeat" },
            { label: "Communication Patterns", id: "websocket" },
            { label: "CPU Scheduling", id: "process-scheduling" },
            { label: "Page Replacement", id: "page-replacement" },
            { label: "Deadlock", id: "deadlock" },
            { label: "Disk Scheduling", id: "disk-scheduling" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(`/concept/${item.id}`)}
              className="px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-secondary-foreground text-xs font-medium transition-colors"
            >
              {item.label}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TopicsRoadmap;
