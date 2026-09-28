import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film, Youtube, MessageCircle, Camera, Car, Music2, ShoppingBag,
  Twitter, Search, Sparkles, Users, Database, Zap, Globe, Server,
  TrendingUp, Cpu, HardDrive, Network, Layers, ArrowRight
} from "lucide-react";

interface SystemArch {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  tagline: string;
  scale: { label: string; value: string }[];
  challenges: string[];
  components: {
    name: string;
    role: string;
    tech: string;
    icon: React.ElementType;
  }[];
  flow: string[];
  patterns: string[];
}

const systems: SystemArch[] = [
  {
    id: "netflix",
    name: "Netflix",
    icon: Film,
    color: "hsl(0 85% 55%)",
    tagline: "Global video streaming at petabyte scale",
    scale: [
      { label: "Subscribers", value: "260M+" },
      { label: "Hours/day", value: "1B+" },
      { label: "Egress", value: "200+ Tbps" },
      { label: "Microservices", value: "1000+" },
    ],
    challenges: [
      "Deliver high-bitrate video globally with <100ms startup",
      "Encode every title into 1000s of bitrate/codec variants",
      "Personalize home page in real time for each user",
      "Survive AWS region failures with zero downtime",
    ],
    components: [
      { name: "Open Connect CDN", role: "ISP-embedded edge caches serving 95%+ of traffic", tech: "Custom appliances, BGP anycast", icon: Globe },
      { name: "Encoding Pipeline", role: "Per-title adaptive bitrate transcoding", tech: "AWS S3, EC2 spot, FFmpeg", icon: Cpu },
      { name: "Playback API", role: "License, manifest, and CDN steering", tech: "Java/Spring, gRPC, Zuul", icon: Server },
      { name: "Recommendation", role: "Personalized ranking per row", tech: "Spark, TensorFlow, A/B platform", icon: Sparkles },
      { name: "Cassandra Clusters", role: "Viewing history, bookmarks", tech: "Cassandra multi-region", icon: Database },
      { name: "Chaos Engineering", role: "Simian Army kills nodes in prod", tech: "Chaos Monkey/Kong", icon: Zap },
    ],
    flow: [
      "Client requests playback → Playback API",
      "API picks best CDN (Open Connect) via real-time scoring",
      "Manifest served, client adaptive-streams chunks",
      "Events flow to Kafka → Flink → personalization",
    ],
    patterns: ["Microservices", "CDN", "Active-Active multi-region", "Chaos Engineering", "Event Streaming"],
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: Youtube,
    color: "hsl(0 100% 50%)",
    tagline: "User-generated video at planetary scale",
    scale: [
      { label: "Users", value: "2.7B" },
      { label: "Upload/min", value: "500hrs" },
      { label: "Views/day", value: "5B+" },
      { label: "Storage", value: "EB-scale" },
    ],
    challenges: [
      "Ingest and transcode 500 hours of video per minute",
      "Serve billions of recommendations with sub-second latency",
      "Detect copyrighted content (Content ID) in real time",
      "Balance creator monetization, ads, and CDN cost",
    ],
    components: [
      { name: "Upload Service", role: "Resumable chunked uploads to GCS", tech: "GFE, Google Cloud Storage", icon: HardDrive },
      { name: "Transcoding Farm", role: "VP9/AV1 encoding across resolutions", tech: "Borg, custom ASICs (VCU)", icon: Cpu },
      { name: "Vitess (MySQL)", role: "Sharded metadata store", tech: "Vitess on Kubernetes", icon: Database },
      { name: "Bigtable + Spanner", role: "View counts, comments, analytics", tech: "Bigtable, Spanner", icon: Database },
      { name: "Recommendation DNN", role: "Two-tower neural ranker", tech: "TensorFlow, TPUs", icon: Sparkles },
      { name: "Google Edge Cache", role: "ISP-peered video delivery", tech: "GGC, QUIC/HTTP3", icon: Globe },
    ],
    flow: [
      "Upload chunked → GCS → Pub/Sub event",
      "Transcoder fans out into N renditions",
      "Metadata written to Vitess + search index",
      "Viewer hits edge cache → HTTP/3 stream",
    ],
    patterns: ["Sharding (Vitess)", "Pub-Sub", "ML Ranking", "Edge Caching", "Pipeline processing"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: MessageCircle,
    color: "hsl(142 70% 45%)",
    tagline: "End-to-end encrypted messaging for 2B+ users",
    scale: [
      { label: "Users", value: "2B+" },
      { label: "Msgs/day", value: "100B+" },
      { label: "Engineers", value: "~50" },
      { label: "Calls/day", value: "2B+" },
    ],
    challenges: [
      "Maintain persistent connections for billions of devices",
      "Guarantee E2EE (Signal protocol) without seeing content",
      "Sync messages across multi-device with offline support",
      "Handle group fan-out efficiently (up to 1024 members)",
    ],
    components: [
      { name: "Erlang Chat Servers", role: "Persistent TCP/XMPP-like sessions", tech: "Erlang/OTP, FreeBSD", icon: Server },
      { name: "Mnesia/RocksDB", role: "Offline message queue per user", tech: "Mnesia, RocksDB", icon: Database },
      { name: "Signal Protocol", role: "Double-ratchet E2EE key exchange", tech: "libsignal, X3DH", icon: Layers },
      { name: "Media Service", role: "Encrypted blob upload/download", tech: "HTTP, S3-like store", icon: HardDrive },
      { name: "Push Gateway", role: "APNs/FCM wake-ups for offline devices", tech: "APNs, FCM", icon: Zap },
      { name: "Voice/Video", role: "WebRTC over relay (TURN)", tech: "PJSIP, Opus, VP8", icon: Network },
    ],
    flow: [
      "Sender encrypts msg with recipient's session key",
      "Erlang server stores ciphertext, fans out",
      "Recipient online → push, offline → APNs/FCM",
      "ACK returns; ciphertext deleted on delivery",
    ],
    patterns: ["Actor model (Erlang)", "Pub-Sub fan-out", "E2EE", "Eventual delivery", "Connection sharding"],
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Camera,
    color: "hsl(320 80% 55%)",
    tagline: "Photo/video sharing with personalized feeds",
    scale: [
      { label: "Users", value: "2B+ MAU" },
      { label: "Photos/day", value: "100M+" },
      { label: "Stories/day", value: "500M+" },
      { label: "Reels plays", value: "200B/day" },
    ],
    challenges: [
      "Generate personalized feed for billions in <200ms",
      "Store and serve trillions of photos/videos",
      "Real-time Stories with 24h auto-expiry",
      "Recommend Reels using collaborative + content signals",
    ],
    components: [
      { name: "Django Monolith → Services", role: "Originally Django on Postgres", tech: "Python, Cinder fork", icon: Server },
      { name: "TAO (Graph cache)", role: "Social graph reads at FB scale", tech: "MySQL + Memcached (TAO)", icon: Network },
      { name: "Cassandra", role: "Inbox, feed materialization", tech: "Apache Cassandra", icon: Database },
      { name: "Haystack", role: "Trillions of photo blobs", tech: "Haystack object store", icon: HardDrive },
      { name: "Feed Ranker", role: "ML re-ranker per session", tech: "PyTorch, FBLearner", icon: Sparkles },
      { name: "CDN + Edge", role: "Facebook Edge Network", tech: "FNA, HTTP/3", icon: Globe },
    ],
    flow: [
      "User opens app → fetch candidate posts from inbox cache",
      "Ranker scores using engagement + recency + ML",
      "Media URLs resolved to nearest CDN POP",
      "Engagement events → Kafka → feed updater",
    ],
    patterns: ["Fan-out on write/read hybrid", "Graph caching (TAO)", "ML Ranking", "CDN", "CQRS"],
  },
  {
    id: "uber",
    name: "Uber",
    icon: Car,
    color: "hsl(0 0% 10%)",
    tagline: "Real-time geospatial matching marketplace",
    scale: [
      { label: "Trips/day", value: "30M+" },
      { label: "Drivers", value: "6M+" },
      { label: "Cities", value: "10K+" },
      { label: "Services", value: "4000+" },
    ],
    challenges: [
      "Match riders to drivers in <2s given live geo state",
      "Surge pricing per H3 hex in real time",
      "Consistent ETAs across traffic conditions",
      "Strict transactional integrity for payments",
    ],
    components: [
      { name: "DISCO Dispatch", role: "Geo matching engine using H3 hexagons", tech: "Go, H3, Ringpop", icon: Network },
      { name: "Driver Location", role: "Hot writes from millions of phones", tech: "Cassandra, Kafka", icon: Database },
      { name: "Maps & ETA", role: "Routing, traffic-aware ETAs", tech: "OSRM, internal map stack", icon: Globe },
      { name: "Pricing/Surge", role: "Per-hex demand/supply ratio", tech: "Flink, Kafka", icon: TrendingUp },
      { name: "Schemaless", role: "MySQL-backed key-value layer", tech: "Schemaless on MySQL", icon: Database },
      { name: "Payments", role: "Idempotent multi-currency txns", tech: "Saga, Cadence workflows", icon: Server },
    ],
    flow: [
      "Driver pings location every 4s → Kafka → geo index",
      "Rider request → DISCO finds candidates in H3 ring",
      "Best driver scored on ETA + acceptance",
      "Trip orchestrated via Cadence saga",
    ],
    patterns: ["Geo-sharding (H3)", "Saga workflows", "Event streaming", "Service mesh", "Eventual consistency"],
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: Music2,
    color: "hsl(142 70% 45%)",
    tagline: "Audio streaming with personalized discovery",
    scale: [
      { label: "Users", value: "600M+" },
      { label: "Tracks", value: "100M+" },
      { label: "Podcasts", value: "5M+" },
      { label: "Services", value: "1000+" },
    ],
    challenges: [
      "Sub-second track start anywhere in the world",
      "Generate Discover Weekly for 600M users weekly",
      "Royalty accounting per stream — exact counts matter",
      "Run squads-of-squads with independent deploys",
    ],
    components: [
      { name: "Edge + Cache", role: "GCP CDN + own POPs for audio", tech: "GCP CDN, nginx", icon: Globe },
      { name: "Audio Backend", role: "Streams Ogg/Vorbis chunks", tech: "Java, gRPC", icon: Server },
      { name: "Event Delivery", role: "Trillions of events to BigQuery", tech: "Pub/Sub, Dataflow", icon: Network },
      { name: "ML Personalization", role: "Discover Weekly, Daily Mix", tech: "TensorFlow, Scio (Scala)", icon: Sparkles },
      { name: "Cassandra/Bigtable", role: "User libraries, playlists", tech: "Cassandra, Bigtable", icon: Database },
      { name: "Backstage", role: "Internal developer portal", tech: "Backstage (open-sourced)", icon: Layers },
    ],
    flow: [
      "Client resolves track → audio CDN URL",
      "Stream chunks; events sent to Pub/Sub",
      "Dataflow aggregates plays for royalties",
      "Weekly batch refreshes ML playlists",
    ],
    patterns: ["Event streaming", "Lambda architecture", "CDN", "ML batch + online", "Squad autonomy"],
  },
  {
    id: "amazon",
    name: "Amazon",
    icon: ShoppingBag,
    color: "hsl(35 100% 50%)",
    tagline: "E-commerce, logistics, and cloud at scale",
    scale: [
      { label: "Items", value: "350M+" },
      { label: "Orders/sec", value: "300+ (peak)" },
      { label: "FCs", value: "175+" },
      { label: "DynamoDB ops", value: "Quadrillions/yr" },
    ],
    challenges: [
      "Catalog search across hundreds of millions of items",
      "Inventory consistency across warehouses",
      "Recommendation + fraud at checkout in <100ms",
      "Black Friday spikes with zero degradation",
    ],
    components: [
      { name: "Service-Oriented Arch", role: "Bezos mandate: everything an API", tech: "Java, Coral framework", icon: Server },
      { name: "DynamoDB", role: "Cart, sessions, inventory hotpaths", tech: "DynamoDB", icon: Database },
      { name: "Search (A9)", role: "Lucene-based product search", tech: "Custom A9 + ML ranking", icon: Search },
      { name: "Recommendation", role: "Item-to-item collaborative filtering", tech: "Custom, SageMaker", icon: Sparkles },
      { name: "Order Pipeline", role: "Saga across pay/inventory/ship", tech: "SQS, Step Functions", icon: Layers },
      { name: "Fulfillment", role: "Routing to nearest FC w/ stock", tech: "Optimization solvers", icon: Network },
    ],
    flow: [
      "Browse → search service → ranked results",
      "Add to cart → DynamoDB cart item",
      "Checkout → saga: payment → inventory hold → ship",
      "Order events → fulfillment + recommendations",
    ],
    patterns: ["SOA mandate", "Saga", "DynamoDB single-table", "ML ranking", "Event-driven"],
  },
  {
    id: "twitter",
    name: "Twitter / X",
    icon: Twitter,
    color: "hsl(0 0% 10%)",
    tagline: "Real-time timeline fan-out for 500M+ users",
    scale: [
      { label: "DAU", value: "250M+" },
      { label: "Tweets/day", value: "500M" },
      { label: "Timeline reads", value: "300K/s" },
      { label: "Languages", value: "40+" },
    ],
    challenges: [
      "Build home timeline for celebrities w/ 100M followers",
      "Trends and search in real time",
      "Combat spam and abuse at scale",
      "Geo-replicate writes with low latency",
    ],
    components: [
      { name: "Tweet Service", role: "Write path, Snowflake ID generation", tech: "Scala, Finagle", icon: Server },
      { name: "Fan-out Service", role: "Pushes to follower home timelines", tech: "Redis cluster", icon: Network },
      { name: "Manhattan", role: "Distributed KV for tweets/users", tech: "Manhattan (in-house)", icon: Database },
      { name: "Earlybird Search", role: "Real-time inverted index", tech: "Lucene fork", icon: Search },
      { name: "Heron/Flink", role: "Streaming for trends, metrics", tech: "Heron, Kafka", icon: TrendingUp },
      { name: "Timeline Ranker", role: "ML ranking of mixed timeline", tech: "TensorFlow, GraphJet", icon: Sparkles },
    ],
    flow: [
      "Tweet written → Manhattan + Kafka",
      "Fan-out service writes to N follower Redis lists",
      "Celebrity tweets use pull-on-read instead",
      "Timeline read = merge cached list + ranker",
    ],
    patterns: ["Fan-out on write (hybrid)", "Pull vs push", "Distributed KV", "Stream processing", "ML ranking"],
  },
  {
    id: "google-search",
    name: "Google Search",
    icon: Search,
    color: "hsl(217 89% 61%)",
    tagline: "Index and rank the web in milliseconds",
    scale: [
      { label: "Queries/day", value: "8.5B+" },
      { label: "Indexed pages", value: "100B+" },
      { label: "P50 latency", value: "<200ms" },
      { label: "Datacenters", value: "30+" },
    ],
    challenges: [
      "Crawl and index a constantly changing web",
      "Rank with hundreds of signals + ML (BERT, MUM)",
      "Personalize without hurting freshness",
      "Spam-resistant ranking against adversaries",
    ],
    components: [
      { name: "Googlebot", role: "Distributed crawler with politeness", tech: "C++, Bigtable queue", icon: Globe },
      { name: "Indexing Pipeline", role: "Parse, dedupe, build inverted index", tech: "MapReduce → Flume", icon: Layers },
      { name: "Spanner/Bigtable", role: "Global metadata + index shards", tech: "Spanner, Bigtable", icon: Database },
      { name: "Query Frontend", role: "Spell, autocomplete, parse intent", tech: "C++ services, GFE", icon: Server },
      { name: "Ranking (BERT/MUM)", role: "Neural re-ranking of candidates", tech: "TPUs, TensorFlow", icon: Sparkles },
      { name: "Index Serving", role: "Sharded by docID across thousands", tech: "Custom serving stack", icon: Cpu },
    ],
    flow: [
      "Query → GFE → spell + intent parsing",
      "Scatter to thousands of index shards",
      "Each returns top-K → merger gathers",
      "Neural ranker re-orders → SERP rendered",
    ],
    patterns: ["Scatter-gather", "Sharded index", "MapReduce", "ML ranking", "Multi-region replication"],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: Sparkles,
    color: "hsl(160 70% 45%)",
    tagline: "LLM inference and conversational state at scale",
    scale: [
      { label: "Users", value: "200M+ weekly" },
      { label: "Msgs/day", value: "1B+" },
      { label: "GPUs", value: "100K+" },
      { label: "Context", value: "128K+ tokens" },
    ],
    challenges: [
      "Serve LLM tokens with low TTFT under bursty load",
      "Pack GPUs efficiently (continuous batching)",
      "Persist long conversation memory + retrieval",
      "Safety filtering on input and output",
    ],
    components: [
      { name: "Edge / API GW", role: "Auth, rate limits, routing", tech: "Cloudflare, custom GW", icon: Globe },
      { name: "Conversation Store", role: "Threads, system prompts", tech: "Postgres + KV cache", icon: Database },
      { name: "Inference Router", role: "Routes by model + GPU capacity", tech: "Custom scheduler", icon: Network },
      { name: "GPU Pods (Triton)", role: "Continuous batching, KV-cache reuse", tech: "Triton, vLLM-style", icon: Cpu },
      { name: "Vector Store / RAG", role: "Embeddings retrieval", tech: "Vector DB, embeddings", icon: Layers },
      { name: "Safety Stack", role: "Moderation in/out, jailbreak detect", tech: "Classifiers, policies", icon: Zap },
    ],
    flow: [
      "User msg → gateway → moderation",
      "Retrieve relevant context (RAG, memory)",
      "Router picks GPU pod with KV-cache hit",
      "Tokens streamed via SSE; output moderated",
    ],
    patterns: ["Continuous batching", "KV-cache", "RAG", "Streaming (SSE)", "Multi-tenant GPU"],
  },
];

const RealWorldSystemsDemo = () => {
  const [activeId, setActiveId] = useState(systems[0].id);
  const active = systems.find((s) => s.id === activeId)!;
  const Icon = active.icon;

  return (
    <section className="py-24 px-6">
      <div className="container max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-4">
            <Globe className="w-4 h-4" /> Case Studies
          </div>
          <h2 className="text-4xl font-bold mb-3">
            <span className="gradient-text">Real-World Systems</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Interactive architecture breakdowns of the systems that power the modern internet.
          </p>
        </motion.div>

        {/* System selector */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {systems.map((s) => {
            const SIcon = s.icon;
            const isActive = s.id === activeId;
            return (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveId(s.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all border ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                <SIcon className="w-4 h-4" style={isActive ? { color: s.color } : undefined} />
                {s.name}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="glass-card p-6 flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${active.color}20` }}
              >
                <Icon className="w-7 h-7" style={{ color: active.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold">{active.name}</h3>
                <p className="text-muted-foreground">{active.tagline}</p>
              </div>
            </div>

            {/* Scale stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {active.scale.map((s) => (
                <div key={s.label} className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold font-mono" style={{ color: active.color }}>
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Challenges */}
              <div className="glass-card p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  Engineering Challenges
                </h4>
                <ul className="space-y-2.5">
                  {active.challenges.map((c, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="font-mono text-xs mt-0.5" style={{ color: active.color }}>
                        0{i + 1}
                      </span>
                      <span>{c}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Request flow */}
              <div className="glass-card p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  Request Flow
                </h4>
                <ol className="space-y-3">
                  {active.flow.map((step, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      className="flex gap-3 text-sm"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: `${active.color}20`, color: active.color }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-muted-foreground pt-0.5">{step}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>

              {/* Patterns */}
              <div className="glass-card p-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-accent" />
                  Patterns Used
                </h4>
                <div className="flex flex-wrap gap-2">
                  {active.patterns.map((p, i) => (
                    <motion.span
                      key={p}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border"
                      style={{ borderColor: `${active.color}50`, color: active.color, backgroundColor: `${active.color}10` }}
                    >
                      {p}
                    </motion.span>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    Built by hundreds of teams working in parallel
                  </div>
                </div>
              </div>
            </div>

            {/* Components grid */}
            <div className="glass-card p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                Core Components
              </h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {active.components.map((c, i) => {
                  const CIcon = c.icon;
                  return (
                    <motion.div
                      key={c.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ y: -3 }}
                      className="rounded-xl border border-border bg-card/40 p-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${active.color}20` }}
                        >
                          <CIcon className="w-4 h-4" style={{ color: active.color }} />
                        </div>
                        <div className="font-semibold text-sm">{c.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">{c.role}</div>
                      <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground/70 border-t border-border pt-2">
                        {c.tech}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default RealWorldSystemsDemo;
