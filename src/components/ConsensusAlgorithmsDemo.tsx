import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Server, ShieldCheck, AlertCircle, ShieldAlert } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

type AlgorithmType = 'raft' | 'paxos' | 'pbft';

type NodeState = 'follower' | 'candidate' | 'leader' | 'proposer' | 'acceptor' | 'primary' | 'replica' | 'faulty';
type MessageType = 'request_vote' | 'vote_granted' | 'append_entries' | 
                   'prepare' | 'promise' | 'accept' | 'accepted' | 
                   'pre_prepare' | 'pbft_prepare' | 'pbft_commit';

interface NodeData {
  id: number;
  state: NodeState;
  term: number;
  vote: number | null;
  value: string | null;
}

interface MessageData {
  id: number;
  from: number;
  to: number;
  type: MessageType;
}

export const ConsensusInteractive = () => {
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('raft');
  const [nodes, setNodes] = useState<NodeData[]>([
    { id: 1, state: 'follower', vote: null, term: 1, value: null },
    { id: 2, state: 'follower', vote: null, term: 1, value: null },
    { id: 3, state: 'follower', vote: null, term: 1, value: null },
    { id: 4, state: 'follower', vote: null, term: 1, value: null },
    { id: 5, state: 'follower', vote: null, term: 1, value: null }
  ]);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [phase, setPhase] = useState<'idle' | 'running' | 'stable'>('idle');

  useEffect(() => {
    setPhase('idle');
    setMessages([]);
    if (algorithm === 'raft') {
      setNodes([1, 2, 3, 4, 5].map(id => ({ id, state: 'follower', vote: null, term: 1, value: null })));
    } else if (algorithm === 'paxos') {
      setNodes([1, 2, 3, 4, 5].map(id => ({ id, state: 'acceptor', vote: null, term: 1, value: null })));
    } else if (algorithm === 'pbft') {
      setNodes([1, 2, 3, 4, 5].map(id => ({ id, state: 'replica', vote: null, term: 1, value: null })));
    }
  }, [algorithm]);

  const runRaftElection = (candidateId: number) => {
    if (phase !== 'idle') return;
    setPhase('running');
    
    setNodes(prev => prev.map(n => 
      n.id === candidateId ? { ...n, state: 'candidate', term: n.term + 1, vote: candidateId } : n
    ));

    const reqMessages = nodes.filter(n => n.id !== candidateId).map((n, i) => ({
      id: Date.now() + i, from: candidateId, to: n.id, type: 'request_vote' as const
    }));
    setMessages(reqMessages);

    setTimeout(() => {
      setMessages([]);
      const voteMsgs = nodes.filter(n => n.id !== candidateId).map((n, i) => ({
        id: Date.now() + 100 + i, from: n.id, to: candidateId, type: 'vote_granted' as const
      }));
      setMessages(voteMsgs);
      setNodes(prev => prev.map(n => 
        n.id !== candidateId ? { ...n, vote: candidateId, term: prev.find(p => p.id === candidateId)?.term || n.term } : n
      ));

      setTimeout(() => {
        setMessages([]);
        setNodes(prev => prev.map(n => n.id === candidateId ? { ...n, state: 'leader' } : n));
        setPhase('stable');

        const heartbeatInterval = setInterval(() => {
          setPhase(prevPhase => {
            if (prevPhase !== 'stable') {
              clearInterval(heartbeatInterval);
              return prevPhase;
            }
            const heartbeats = [1,2,3,4,5].filter(id => id !== candidateId).map((id, i) => ({
              id: Date.now() + 200 + i, from: candidateId, to: id, type: 'append_entries' as const
            }));
            setMessages(heartbeats);
            setTimeout(() => setMessages([]), 500);
            return prevPhase;
          });
        }, 2000);
      }, 1500);
    }, 1500);
  };

  const runPaxos = (proposerId: number) => {
    if (phase !== 'idle') return;
    setPhase('running');

    setNodes(prev => prev.map(n => n.id === proposerId ? { ...n, state: 'proposer' } : n));

    const prepareMsgs = nodes.filter(n => n.id !== proposerId).map((n, i) => ({
      id: Date.now() + i, from: proposerId, to: n.id, type: 'prepare' as const
    }));
    setMessages(prepareMsgs);

    setTimeout(() => {
      setMessages([]);
      const promiseMsgs = nodes.filter(n => n.id !== proposerId).map((n, i) => ({
        id: Date.now() + 100 + i, from: n.id, to: proposerId, type: 'promise' as const
      }));
      setMessages(promiseMsgs);

      setTimeout(() => {
        setMessages([]);
        const acceptMsgs = nodes.filter(n => n.id !== proposerId).map((n, i) => ({
          id: Date.now() + 200 + i, from: proposerId, to: n.id, type: 'accept' as const
        }));
        setMessages(acceptMsgs);

        setTimeout(() => {
          setMessages([]);
          setNodes(prev => prev.map(n => ({ ...n, value: 'V' })));
          
          const acceptedMsgs = nodes.filter(n => n.id !== proposerId).map((n, i) => ({
            id: Date.now() + 300 + i, from: n.id, to: proposerId, type: 'accepted' as const
          }));
          setMessages(acceptedMsgs);

          setTimeout(() => {
            setMessages([]);
            setPhase('stable');
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const runPBFT = (primaryId: number) => {
    if (phase !== 'idle') return;
    setPhase('running');

    const faultyNodeId = primaryId === 5 ? 4 : 5; 

    setNodes(prev => prev.map(n => 
      n.id === primaryId ? { ...n, state: 'primary' } : 
      n.id === faultyNodeId ? { ...n, state: 'faulty' } : { ...n, state: 'replica' }
    ));

    const prePrepareMsgs = nodes.filter(n => n.id !== primaryId).map((n, i) => ({
      id: Date.now() + i, from: primaryId, to: n.id, type: 'pre_prepare' as const
    }));
    setMessages(prePrepareMsgs);

    setTimeout(() => {
      setMessages([]);
      let prepMsgs: MessageData[] = [];
      nodes.filter(n => n.id !== primaryId && n.id !== faultyNodeId).forEach(n => {
        nodes.forEach((target, i) => {
          if (n.id !== target.id) {
            prepMsgs.push({ id: Date.now() + 100 + i + n.id*10, from: n.id, to: target.id, type: 'pbft_prepare' });
          }
        });
      });
      setMessages(prepMsgs);

      setTimeout(() => {
        setMessages([]);
        let commitMsgs: MessageData[] = [];
        nodes.filter(n => n.id !== faultyNodeId).forEach(n => {
          nodes.forEach((target, i) => {
            if (n.id !== target.id) {
              commitMsgs.push({ id: Date.now() + 200 + i + n.id*10, from: n.id, to: target.id, type: 'pbft_commit' });
            }
          });
        });
        setMessages(commitMsgs);

        setTimeout(() => {
          setMessages([]);
          setNodes(prev => prev.map(n => n.id !== faultyNodeId ? { ...n, value: 'Committed' } : n));
          setPhase('stable');
        }, 1500);
      }, 2000);
    }, 1500);
  };

  const startAction = () => {
    const randomId = Math.floor(Math.random() * 5) + 1;
    if (algorithm === 'raft') runRaftElection(randomId);
    else if (algorithm === 'paxos') runPaxos(randomId);
    else if (algorithm === 'pbft') runPBFT(1);
  };

  const resetState = () => {
    setPhase('idle');
    setMessages([]);
    if (algorithm === 'raft') setNodes([1, 2, 3, 4, 5].map(id => ({ id, state: 'follower', vote: null, term: 1, value: null })));
    if (algorithm === 'paxos') setNodes([1, 2, 3, 4, 5].map(id => ({ id, state: 'acceptor', vote: null, term: 1, value: null })));
    if (algorithm === 'pbft') setNodes([1, 2, 3, 4, 5].map(id => ({ id, state: 'replica', vote: null, term: 1, value: null })));
  };

  const getNodePosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 130;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  const getMessageColor = (type: MessageType) => {
    switch (type) {
      case 'request_vote': return 'bg-yellow-500';
      case 'vote_granted': return 'bg-green-500';
      case 'append_entries': return 'bg-blue-500';
      case 'prepare': return 'bg-yellow-500';
      case 'promise': return 'bg-purple-500';
      case 'accept': return 'bg-blue-500';
      case 'accepted': return 'bg-green-500';
      case 'pre_prepare': return 'bg-blue-500';
      case 'pbft_prepare': return 'bg-yellow-500';
      case 'pbft_commit': return 'bg-green-500';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="glass-card p-6 md:p-8 rounded-xl w-full flex flex-col items-center shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
      
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 bg-background/80 p-2 rounded-lg border border-border">
        {(['raft', 'paxos', 'pbft'] as AlgorithmType[]).map(alg => (
          <button
            key={alg}
            onClick={() => setAlgorithm(alg)}
            className={`px-4 md:px-6 py-2 rounded-md font-semibold capitalize transition-all text-sm md:text-base ${
              algorithm === alg ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            {alg === 'pbft' ? 'PBFT' : alg}
          </button>
        ))}
      </div>

      <div className="text-center mb-8 max-w-2xl text-muted-foreground min-h-[40px] text-sm md:text-base px-4">
        {algorithm === 'raft' && "Raft uses a leader election process to ensure there is always one node managing the replicated log."}
        {algorithm === 'paxos' && "Paxos uses a multi-phase protocol (Prepare, Promise, Accept, Accepted) to reach consensus on a single value."}
        {algorithm === 'pbft' && "Practical Byzantine Fault Tolerance (PBFT) allows the system to reach consensus even if some nodes are malicious or faulty."}
      </div>

      <div className="flex gap-4 mb-12">
        <button 
          onClick={startAction}
          disabled={phase !== 'idle'}
          className="py-2 px-6 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50 hover:bg-primary/90 transition-all text-sm md:text-base shadow-lg shadow-primary/20"
        >
          {algorithm === 'raft' ? 'Trigger Election' : algorithm === 'paxos' ? 'Start Paxos Round' : 'Start PBFT Round'}
        </button>
        <button 
          onClick={resetState}
          disabled={phase === 'idle'}
          className="py-2 px-6 bg-destructive text-destructive-foreground rounded-lg font-semibold disabled:opacity-50 hover:bg-destructive/90 transition-all text-sm md:text-base shadow-lg shadow-destructive/20"
        >
          Reset State
        </button>
      </div>

      <div className="relative w-full max-w-xl h-[350px] flex items-center justify-center">
        <AnimatePresence>
          {messages.map(msg => {
            const fromPos = getNodePosition(msg.from - 1, 5);
            const toPos = getNodePosition(msg.to - 1, 5);
            
            return (
              <motion.div
                key={msg.id}
                initial={{ x: fromPos.x, y: fromPos.y, opacity: 0, scale: 0.5 }}
                animate={{ x: toPos.x, y: toPos.y, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className={`absolute z-10 w-3 h-3 rounded-full shadow-lg ${getMessageColor(msg.type)}`}
              />
            );
          })}
        </AnimatePresence>

        {nodes.map((node, i) => {
          const pos = getNodePosition(i, 5);
          return (
            <motion.div
              key={node.id}
              animate={{ x: pos.x, y: pos.y }}
              className={`absolute z-20 flex flex-col items-center gap-1 p-3 rounded-xl border-2 bg-card transition-colors duration-300 ${
                node.state === 'leader' || node.state === 'primary' ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' :
                node.state === 'candidate' || node.state === 'proposer' ? 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                node.state === 'faulty' ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                'border-border hover:border-primary/50'
              }`}
              style={{ width: '90px', height: '90px' }}
            >
              {node.state === 'leader' || node.state === 'primary' ? <ShieldCheck className="text-green-500" size={28} /> :
               node.state === 'candidate' || node.state === 'proposer' ? <AlertCircle className="text-yellow-500" size={28} /> :
               node.state === 'faulty' ? <ShieldAlert className="text-red-500" size={28} /> :
               <Server className="text-muted-foreground" size={28} />}
              <div className="text-[10px] font-bold uppercase truncate w-full text-center">{node.state}</div>
              {node.value && <div className="text-[10px] bg-primary/20 text-primary px-2 rounded-full font-bold">Val: {node.value}</div>}
              {!node.value && algorithm === 'raft' && <div className="text-[10px] text-muted-foreground">T: {node.term}</div>}
            </motion.div>
          );
        })}
      </div>

      <div className="mt-12 w-full max-w-3xl flex flex-wrap justify-center gap-4 text-xs md:text-sm text-muted-foreground bg-background/50 p-4 rounded-xl border border-border/50">
        {algorithm === 'raft' && (
          <>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Request Vote</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Vote Granted</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Heartbeat (Append)</div>
          </>
        )}
        {algorithm === 'paxos' && (
          <>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Prepare</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Promise</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Accept</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Accepted</div>
          </>
        )}
        {algorithm === 'pbft' && (
          <>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Pre-Prepare</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Prepare Multicast</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Commit Multicast</div>
            <div className="flex items-center gap-2"><ShieldAlert className="text-red-500 w-4 h-4" /> Faulty Node</div>
          </>
        )}
      </div>
    </div>
  );
};

const ConsensusAlgorithmsDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Consensus Algorithms (Live Demo)</h2>
            <p className="text-muted-foreground">
              Consensus algorithms allow a collection of machines to work as a coherent group that can survive the failures of some of its members.
            </p>
          </div>
        </div>
        <ConsensusInteractive />
      </div>
    </section>
  );
};

export default ConsensusAlgorithmsDemo;

