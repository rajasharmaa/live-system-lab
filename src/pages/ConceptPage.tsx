import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

// Lazy approach: Just import all demos here for the registry
import HorizontalScalingDemo from "@/components/HorizontalScalingDemo";
import ReverseProxyDemo from "@/components/ReverseProxyDemo";
import BackPressureDemo from "@/components/BackPressureDemo";
import CacheStrategiesDemo from "@/components/CacheStrategiesDemo";
import CAPTheoremDemo from "@/components/CAPTheoremDemo";
import BloomFilterDemo from "@/components/BloomFilterDemo";
import SagaPatternDemo from "@/components/SagaPatternDemo";
import CQRSDemo from "@/components/CQRSDemo";
import RateLimiterDemo from "@/components/RateLimiterDemo";
import CacheDemo from "@/components/CacheDemo";
import ConsistentHashingDemo from "@/components/ConsistentHashingDemo";
import DistributedTracingDemo from "@/components/DistributedTracingDemo";
import CircuitBreakerDemo from "@/components/CircuitBreakerDemo";
import LoadBalancerDemo from "@/components/LoadBalancerDemo";
import DatabaseShardingDemo from "@/components/DatabaseShardingDemo";
import MessageQueueDemo from "@/components/MessageQueueDemo";
import LeaderElectionDemo from "@/components/LeaderElectionDemo";
import TwoPhaseCommitDemo from "@/components/TwoPhaseCommitDemo";
import BulkheadPatternDemo from "@/components/BulkheadPatternDemo";
import APIGatewayDemo from "@/components/APIGatewayDemo";
import PubSubDemo from "@/components/PubSubDemo";
import RetryPatternDemo from "@/components/RetryPatternDemo";
import IdempotencyDemo from "@/components/IdempotencyDemo";
import HeartbeatDemo from "@/components/HeartbeatDemo";
import KubernetesDemo from "@/components/KubernetesDemo";
import EventSourcingDemo from "@/components/EventSourcingDemo";
import CDNDemo from "@/components/CDNDemo";
import GraphQLDemo from "@/components/GraphQLDemo";
import DatabaseReplicationDemo from "@/components/DatabaseReplicationDemo";
import WALDemo from "@/components/WALDemo";
import SQLvsNoSQLDemo from "@/components/SQLvsNoSQLDemo";
import CommunicationPatternsDemo from "@/components/CommunicationPatternsDemo";
import EncryptionTLSDemo from "@/components/EncryptionTLSDemo";
import CICDPipelineDemo from "@/components/CICDPipelineDemo";
import ServiceMeshDemo from "@/components/ServiceMeshDemo";
import MicroservicesDemo from "@/components/MicroservicesDemo";
import DatabaseIndexingDemo from "@/components/DatabaseIndexingDemo";
import ConnectionPoolDemo from "@/components/ConnectionPoolDemo";
import MetricsDashboard from "@/components/MetricsDashboard";
import CentralizedLoggingDemo from "@/components/CentralizedLoggingDemo";
import JWTAuthDemo from "@/components/JWTAuthDemo";
import OAuthFlowDemo from "@/components/OAuthFlowDemo";
import RBACDemo from "@/components/RBACDemo";
import LoadTestingDemo from "@/components/LoadTestingDemo";
import ServerlessDemo from "@/components/ServerlessDemo";
import DistributedLocksDemo from "@/components/DistributedLocksDemo";
import GossipProtocolDemo from "@/components/GossipProtocolDemo";
import ObserverPatternDemo from "@/components/ObserverPatternDemo";
import ClientServerDemo from "@/components/ClientServerDemo";
import EventDrivenDemo from "@/components/EventDrivenDemo";
import RESTArchitectureDemo from "@/components/RESTArchitectureDemo";
import KeyValueStoreDemo from "@/components/KeyValueStoreDemo";
import ConsensusAlgorithmsDemo from "@/components/ConsensusAlgorithmsDemo";
import EventStreamingDemo from "@/components/EventStreamingDemo";
import HealthChecksDemo from "@/components/HealthChecksDemo";
import AlertingDemo from "@/components/AlertingDemo";
import AutoScalingDemo from "@/components/AutoScalingDemo";
import MicroservicesOverviewDemo from "@/components/MicroservicesOverviewDemo";
import ProcessSchedulingDemo from "@/components/ProcessSchedulingDemo";
import PageReplacementDemo from "@/components/PageReplacementDemo";
import DeadlockDemo from "@/components/DeadlockDemo";
import ProcessSyncDemo from "@/components/ProcessSyncDemo";
import DiskSchedulingDemo from "@/components/DiskSchedulingDemo";
import MemoryAllocationDemo from "@/components/MemoryAllocationDemo";
import ThreadsVsProcessesDemo from "@/components/ThreadsVsProcessesDemo";
import VirtualMemoryDemo from "@/components/VirtualMemoryDemo";
import IPCDemo from "@/components/IPCDemo";
import FileAllocationDemo from "@/components/FileAllocationDemo";

// Map IDs from TopicsRoadmap to components
export const componentRegistry: Record<string, React.FC> = {
  "horizontal-vs-vertical": HorizontalScalingDemo,
  "reverse-proxy": ReverseProxyDemo,
  "back-pressure": BackPressureDemo,
  "cache-strategies": CacheStrategiesDemo,
  "cap-theorem": CAPTheoremDemo,
  "bloom-filter": BloomFilterDemo,
  "saga": SagaPatternDemo,
  "cqrs": CQRSDemo,
  "rate-limiting": RateLimiterDemo,
  "caching": CacheDemo,
  "consistent-hashing": ConsistentHashingDemo,
  "tracing": DistributedTracingDemo,
  "circuit-breaker": CircuitBreakerDemo,
  "load-balancer": LoadBalancerDemo,
  "sharding": DatabaseShardingDemo,
  "message-queue": MessageQueueDemo,
  "leader-election": LeaderElectionDemo,
  "two-phase-commit": TwoPhaseCommitDemo,
  "2pc": TwoPhaseCommitDemo,
  "bulkhead": BulkheadPatternDemo,
  "api-gateway": APIGatewayDemo,
  "pub-sub": PubSubDemo,
  "retry-pattern": RetryPatternDemo,
  "idempotency": IdempotencyDemo,
  "heartbeat": HeartbeatDemo,
  "containers": KubernetesDemo,
  "event-sourcing": EventSourcingDemo,
  "cdn": CDNDemo,
  "graphql": GraphQLDemo,
  "replication": DatabaseReplicationDemo,
  "wal": WALDemo,
  "sql-vs-nosql": SQLvsNoSQLDemo,
  "websocket": CommunicationPatternsDemo,
  "encryption": EncryptionTLSDemo,
  "ci-cd": CICDPipelineDemo,
  "service-mesh": ServiceMeshDemo,
  "microservices": MicroservicesDemo,
  "indexing": DatabaseIndexingDemo,
  "connection-pool": ConnectionPoolDemo,
  "metrics": MetricsDashboard,
  "logging": CentralizedLoggingDemo,
  "jwt": JWTAuthDemo,
  "oauth": OAuthFlowDemo,
  "rbac": RBACDemo,
  "load-testing": LoadTestingDemo,
  "serverless": ServerlessDemo,
  "distributed-locks": DistributedLocksDemo,
  "gossip-protocol": GossipProtocolDemo,
  "observer": ObserverPatternDemo,
  "saga-pattern": SagaPatternDemo,
  "client-server": ClientServerDemo,
  "event-driven": EventDrivenDemo,
  "rest": RESTArchitectureDemo,
  "key-value": KeyValueStoreDemo,
  "consensus": ConsensusAlgorithmsDemo,
  "event-streaming": EventStreamingDemo,
  "health-checks": HealthChecksDemo,
  "alerting": AlertingDemo,
  "auto-scaling": AutoScalingDemo,
  "microservices-overview": MicroservicesOverviewDemo,
  // Operating Systems
  "process-scheduling": ProcessSchedulingDemo,
  "page-replacement": PageReplacementDemo,
  "deadlock": DeadlockDemo,
  "process-sync": ProcessSyncDemo,
  "disk-scheduling": DiskSchedulingDemo,
  "memory-allocation": MemoryAllocationDemo,
  "threads-vs-processes": ThreadsVsProcessesDemo,
  "virtual-memory": VirtualMemoryDemo,
  "ipc": IPCDemo,
  "file-allocation": FileAllocationDemo,
};

const ConceptPage = () => {
  const { id } = useParams();
  
  if (!id || !componentRegistry[id]) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-bold mb-4 text-destructive">Concept Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the system design concept you're looking for.</p>
        <Link to="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-bold flex items-center gap-2">
          <ArrowLeft size={18} /> Back to Roadmap
        </Link>
      </div>
    );
  }

  const Component = componentRegistry[id];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-muted rounded-full transition-colors group">
          <ArrowLeft size={20} className="text-muted-foreground group-hover:text-foreground" />
        </Link>
        <span className="font-mono text-sm font-bold opacity-50">/concept/{id}</span>
      </header>
      
      <main className="pb-24">
        <Component />
      </main>
    </motion.div>
  );
};

export default ConceptPage;
