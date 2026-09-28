import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, ArrowRight, BellRing, Boxes, Database, HeartPulse,
  Network, Radio, Scale, Server, Workflow, Zap, Shield, Inbox, Route, ShieldAlert, Rocket, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArchitectBot } from "./ui/SVGMascots";
import { ConsensusInteractive } from "./ConsensusAlgorithmsDemo";
import { EventStreamingInteractive } from "./EventStreamingDemo";
import { AlertingInteractive } from "./AlertingDemo";
import { HealthChecksInteractive } from "./HealthChecksDemo";
import { SagaInteractive } from "./SagaPatternDemo";
import { ClientServerInteractive } from "./ClientServerDemo";
import { RESTInteractive } from "./RESTArchitectureDemo";
import { EventDrivenInteractive } from "./EventDrivenDemo";
import { SQLInteractive, NoSQLInteractive } from "./SQLvsNoSQLDemo";
import { KeyValueStoreInteractive } from "./KeyValueStoreDemo";
import { AutoScalingInteractive } from "./AutoScalingDemo";
import { MetricsInteractive } from "./MetricsDashboard";
import { LoadBalancerInteractive } from "./LoadBalancerDemo";
import { CircuitBreakerInteractive } from "./CircuitBreakerDemo";
import { MessageQueueInteractive } from "./MessageQueueDemo";
import { RateLimiterInteractive } from "./RateLimiterDemo";
import { CacheInteractive } from "./CacheDemo";
import { APIGatewayInteractive } from "./APIGatewayDemo";

type Concept = {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  summary: string;
  tradeoff: string;
  nodes: string[];
};

const concepts: Concept[] = [
  { id: "client-server", name: "Client–Server", category: "Foundations", icon: Server, summary: "Clients request work; centralized servers validate, process, and return responses.", tradeoff: "Simple ownership, but servers become scaling and availability pressure points.", nodes: ["Browser", "API", "Service", "Database"] },
  { id: "rest", name: "REST", category: "Foundations", icon: Network, summary: "Resources are addressed by URLs and changed through standard HTTP operations.", tradeoff: "Predictable and cacheable, but clients may need several round trips.", nodes: ["GET /users", "Gateway", "User API", "200 JSON"] },
  { id: "api-gateway", name: "API Gateway", category: "Foundations", icon: Globe, summary: "Single entry point for all client requests. Handles authentication, rate limiting, and routes.", tradeoff: "Simplifies clients and centralized concerns, but becomes a single point of failure.", nodes: [] },
  { id: "event-driven", name: "Event-Driven", category: "Messaging", icon: Radio, summary: "Producers publish facts without waiting for every interested consumer.", tradeoff: "Loose coupling and resilience in exchange for eventual consistency.", nodes: ["Checkout", "Event Bus", "Inventory", "Email"] },
  { id: "message-queue", name: "Message Queue", category: "Messaging", icon: Inbox, summary: "Asynchronous communication and decoupling between services via queues.", tradeoff: "Decouples systems and handles spikes, but adds infrastructure complexity.", nodes: [] },
  { id: "sql", name: "SQL Database", category: "Storage", icon: Database, summary: "Structured tables, joins, and transactions protect strongly related data.", tradeoff: "Powerful consistency and queries, with stricter schemas and scale planning.", nodes: ["Query", "Planner", "Index", "Rows"] },
  { id: "nosql", name: "NoSQL Database", category: "Storage", icon: Boxes, summary: "Flexible records optimize access around a product's specific read patterns.", tradeoff: "Easy horizontal scale, but relationships and consistency move into design decisions.", nodes: ["Request", "Partition", "Document", "Replica"] },
  { id: "key-value", name: "Key–Value Store", category: "Storage", icon: Zap, summary: "A unique key maps directly to a value for extremely fast lookups.", tradeoff: "Excellent speed, but limited filtering beyond known keys.", nodes: ["session:42", "Hash", "Shard 3", "Value"] },
  { id: "caching", name: "Caching", category: "Storage", icon: Rocket, summary: "A fast, in-memory data store used to serve frequently accessed data.", tradeoff: "Dramatically lowers latency, but introduces cache invalidation complexity.", nodes: [] },
  { id: "load-balancer", name: "Load Balancer", category: "Network", icon: Route, summary: "Distributes incoming network traffic across a group of backend servers.", tradeoff: "Increases availability, but adds a single point of failure if not redundant.", nodes: [] },
  { id: "rate-limiter", name: "Rate Limiting", category: "Network", icon: ShieldAlert, summary: "Controls how many requests a user or service can make in a given timeframe.", tradeoff: "Prevents abuse and protects resources, but can reject valid users if misconfigured.", nodes: [] },
  { id: "consensus", name: "Consensus", category: "Distributed", icon: Scale, summary: "A quorum of nodes agrees on one ordered history despite failures.", tradeoff: "Correct coordination costs extra network messages and latency.", nodes: ["Leader", "Proposal", "Quorum", "Commit"] },
  { id: "event-streaming", name: "Event Streaming", category: "Messaging", icon: Workflow, summary: "An ordered, durable log lets many consumers replay events independently.", tradeoff: "High throughput and replayability require partition and ordering strategy.", nodes: ["Producer", "Partition", "Offset", "Consumer"] },
  { id: "saga", name: "Saga Orchestration", category: "Reliability", icon: Workflow, summary: "A long workflow becomes local transactions with compensating actions.", tradeoff: "Avoids global locks, but rollback logic and partial states are explicit.", nodes: ["Order", "Payment", "Stock", "Compensate"] },
  { id: "circuit-breaker", name: "Circuit Breaker", category: "Reliability", icon: Shield, summary: "Prevents repeated attempts to execute an operation that's likely to fail.", tradeoff: "Prevents cascading failures, but adds complexity to error handling.", nodes: [] },
  { id: "health-checks", name: "Health Checks", category: "Reliability", icon: HeartPulse, summary: "Readiness and liveness probes separate usable instances from stuck ones.", tradeoff: "Fast failure detection without ejecting healthy nodes during brief slowdowns.", nodes: ["Probe", "Instance A", "Instance B", "Router"] },
  { id: "metrics", name: "Metrics", category: "Observability", icon: Activity, summary: "Time-series measurements reveal latency, traffic, errors, and saturation.", tradeoff: "Low-cost trends, but labels must be controlled to avoid explosive cardinality.", nodes: ["Service", "Collector", "Time Series", "Dashboard"] },
  { id: "alerting", name: "Alerting", category: "Observability", icon: BellRing, summary: "Rules turn meaningful service symptoms into actionable notifications.", tradeoff: "Sensitive rules detect issues early; noisy rules create alert fatigue.", nodes: ["Metric", "Rule", "Incident", "Responder"] },
  { id: "auto-scaling", name: "Auto Scaling", category: "Cloud", icon: Boxes, summary: "Capacity expands and contracts from demand signals and target thresholds.", tradeoff: "Efficiency improves, but delayed signals can cause oscillation or cold capacity.", nodes: ["Traffic", "Policy", "+3 Nodes", "Stable Load"] },
];

const getInteractiveComponent = (id: string) => {
  switch (id) {
    case "client-server":
      return <ClientServerInteractive />;
    case "rest":
      return <RESTInteractive />;
    case "api-gateway":
      return <APIGatewayInteractive />;
    case "event-driven":
      return <EventDrivenInteractive />;
    case "message-queue":
      return <MessageQueueInteractive />;
    case "sql":
      return <SQLInteractive />;
    case "nosql":
      return <NoSQLInteractive />;
    case "key-value":
      return <KeyValueStoreInteractive />;
    case "caching":
      return <CacheInteractive />;
    case "load-balancer":
      return <LoadBalancerInteractive />;
    case "rate-limiter":
      return <RateLimiterInteractive />;
    case "consensus":
      return <ConsensusInteractive />;
    case "event-streaming":
      return <EventStreamingInteractive />;
    case "saga":
      return <SagaInteractive />;
    case "circuit-breaker":
      return <CircuitBreakerInteractive />;
    case "alerting":
      return <AlertingInteractive />;
    case "health-checks":
      return <HealthChecksInteractive />;
    case "auto-scaling":
      return <AutoScalingInteractive />;
    case "metrics":
      return <MetricsInteractive />;
    default:
      return null;
  }
};

const CoreConceptsLab = () => {
  const [activeId, setActiveId] = useState(concepts[0].id);
  const [running, setRunning] = useState(false);
  const active = useMemo(() => concepts.find((concept) => concept.id === activeId) ?? concepts[0], [activeId]);
  const run = () => { setRunning(false); window.setTimeout(() => setRunning(true), 30); };

  const InteractiveDemo = getInteractiveComponent(active.id);

  return (
    <section id="core-concepts" className="section-shell grid-pattern">
      <div className="container px-5 md:px-8">
        <div className="section-kicker">Core Concepts Lab · {concepts.length} models</div>
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <ArchitectBot />
            <div>
              <h2 className="section-title">Fundamentals, made visible.</h2>
              <p className="section-copy">Select a system primitive, then trace one request through its critical path. Every complex system is built from these basic blocks.</p>
            </div>
          </div>
          <div className="font-mono text-xs text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/30">LAB STATUS / READY</div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <nav className="command-panel max-h-[560px] overflow-y-auto p-2" aria-label="Core concept selection">
            {concepts.map((concept) => (
              <Button key={concept.id} id={concept.id} variant="ghost" onClick={() => { setActiveId(concept.id); setRunning(false); }}
                className={`mb-1 h-auto w-full justify-start rounded-sm px-3 py-3 text-left ${active.id === concept.id ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                <concept.icon className="size-4" />
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-foreground">{concept.name}</span><span className="block text-[10px] uppercase text-muted-foreground">{concept.category}</span></span>
              </Button>
            ))}
          </nav>

          <motion.div key={active.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="command-panel min-h-[560px] p-5 md:p-8 flex flex-col">
            <div className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
              <div className="flex gap-4"><div className="signal-icon"><active.icon className="size-5" /></div><div><div className="font-mono text-[10px] uppercase text-primary">{active.category} / active model</div><h3 className="mt-1 text-2xl font-bold">{active.name}</h3></div></div>
              {!InteractiveDemo && (
                <Tooltip><TooltipTrigger asChild><Button onClick={run} className="rounded-sm"><Zap /> Run trace</Button></TooltipTrigger><TooltipContent>Animate one request through this system.</TooltipContent></Tooltip>
              )}
            </div>

            <div className="grid gap-6 py-8 md:grid-cols-2">
              <div><div className="data-label">How it works</div><p className="mt-3 text-lg leading-relaxed text-foreground">{active.summary}</p></div>
              <div><div className="data-label">Design trade-off</div><p className="mt-3 leading-relaxed text-muted-foreground">{active.tradeoff}</p></div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
              {InteractiveDemo ? (
                <div className="w-full h-full flex items-center justify-center scale-95 origin-center">
                  {InteractiveDemo}
                </div>
              ) : (
                <div className="relative w-full grid gap-3 md:grid-cols-4">
                  {active.nodes.map((node, index) => (
                    <div key={node} className="relative flex min-h-28 items-center justify-center border border-border bg-muted/30 p-4 text-center">
                      <motion.div animate={running ? { borderColor: ["hsl(var(--border))", "hsl(var(--primary))", "hsl(var(--border))"] } : {}} transition={{ delay: index * .35, duration: .7 }} className="absolute inset-0 border border-transparent" />
                      <div><div className="mx-auto mb-3 size-2 rounded-full bg-primary" /><span className="font-mono text-xs">{node}</span></div>
                      {index < active.nodes.length - 1 && <motion.div animate={running ? { x: [0, 8, 0], opacity: [0.35, 1, 0.35] } : {}} transition={{ delay: index * .35, duration: .7 }} className="absolute -right-5 z-10 hidden text-primary md:block"><ArrowRight className="size-5" /></motion.div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {!InteractiveDemo && (
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 font-mono text-[10px] uppercase text-muted-foreground"><span>Trace mode: deterministic</span><span className={running ? "text-primary" : ""}>{running ? "Request delivered" : "Awaiting execution"}</span></div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CoreConceptsLab;