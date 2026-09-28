import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Server, CheckCircle2, XCircle, Clock, ArrowRight, AlertTriangle, RotateCcw } from "lucide-react";

type ParticipantStatus = "idle" | "preparing" | "prepared" | "committing" | "committed" | "aborting" | "aborted";
type CoordinatorPhase = "idle" | "prepare" | "waitingVotes" | "commit" | "abort" | "complete";

interface Participant {
  id: string;
  name: string;
  status: ParticipantStatus;
  vote: "yes" | "no" | null;
  willFail: boolean;
}

interface TransactionLog {
  id: number;
  timestamp: number;
  phase: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}

const TwoPhaseCommitDemo = () => {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "db1", name: "Orders DB", status: "idle", vote: null, willFail: false },
    { id: "db2", name: "Inventory DB", status: "idle", vote: null, willFail: false },
    { id: "db3", name: "Payment Service", status: "idle", vote: null, willFail: false },
  ]);
  const [coordinatorPhase, setCoordinatorPhase] = useState<CoordinatorPhase>("idle");
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [transactionId, setTransactionId] = useState(1);

  const addLog = useCallback((phase: string, message: string, type: TransactionLog["type"] = "info") => {
    setLogs(prev => [{
      id: Date.now(),
      timestamp: Date.now(),
      phase,
      message,
      type,
    }, ...prev].slice(0, 15));
  }, []);

  const resetDemo = useCallback(() => {
    setParticipants(prev => prev.map(p => ({ ...p, status: "idle", vote: null })));
    setCoordinatorPhase("idle");
    setIsRunning(false);
  }, []);

  const toggleParticipantFailure = (id: string) => {
    if (isRunning) return;
    setParticipants(prev => prev.map(p => 
      p.id === id ? { ...p, willFail: !p.willFail } : p
    ));
  };

  const runTransaction = async () => {
    if (isRunning) return;
    setIsRunning(true);
    resetDemo();
    
    const txId = transactionId;
    setTransactionId(prev => prev + 1);
    
    addLog("START", `Transaction TX-${txId} initiated`, "info");
    await new Promise(r => setTimeout(r, 500));

    // Phase 1: Prepare
    setCoordinatorPhase("prepare");
    addLog("PREPARE", "Coordinator sending PREPARE to all participants", "info");
    await new Promise(r => setTimeout(r, 500));

    setParticipants(prev => prev.map(p => ({ ...p, status: "preparing" })));
    setCoordinatorPhase("waitingVotes");
    await new Promise(r => setTimeout(r, 1000));

    // Collect votes
    const votes: boolean[] = [];
    for (const participant of participants) {
      const voteYes = !participant.willFail;
      votes.push(voteYes);
      
      setParticipants(prev => prev.map(p => 
        p.id === participant.id 
          ? { ...p, status: "prepared", vote: voteYes ? "yes" : "no" }
          : p
      ));
      
      addLog("VOTE", `${participant.name}: ${voteYes ? "VOTE_YES" : "VOTE_NO (resource locked)"}`, voteYes ? "success" : "error");
      await new Promise(r => setTimeout(r, 400));
    }

    const allVotedYes = votes.every(v => v);
    await new Promise(r => setTimeout(r, 500));

    // Phase 2: Commit or Abort
    if (allVotedYes) {
      setCoordinatorPhase("commit");
      addLog("DECISION", "All participants voted YES - sending COMMIT", "success");
      await new Promise(r => setTimeout(r, 500));

      setParticipants(prev => prev.map(p => ({ ...p, status: "committing" })));
      await new Promise(r => setTimeout(r, 800));

      for (const participant of participants) {
        setParticipants(prev => prev.map(p => 
          p.id === participant.id ? { ...p, status: "committed" } : p
        ));
        addLog("ACK", `${participant.name}: COMMITTED`, "success");
        await new Promise(r => setTimeout(r, 300));
      }

      setCoordinatorPhase("complete");
      addLog("COMPLETE", `Transaction TX-${txId} committed successfully`, "success");
    } else {
      setCoordinatorPhase("abort");
      addLog("DECISION", "One or more participants voted NO - sending ABORT", "error");
      await new Promise(r => setTimeout(r, 500));

      setParticipants(prev => prev.map(p => ({ ...p, status: "aborting" })));
      await new Promise(r => setTimeout(r, 800));

      for (const participant of participants) {
        setParticipants(prev => prev.map(p => 
          p.id === participant.id ? { ...p, status: "aborted" } : p
        ));
        addLog("ROLLBACK", `${participant.name}: ABORTED - rolling back changes`, "warning");
        await new Promise(r => setTimeout(r, 300));
      }

      setCoordinatorPhase("complete");
      addLog("COMPLETE", `Transaction TX-${txId} aborted - all changes rolled back`, "error");
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: ParticipantStatus) => {
    switch (status) {
      case "idle": return "bg-muted";
      case "preparing": return "bg-yellow-500/20 border-yellow-500";
      case "prepared": return "bg-blue-500/20 border-blue-500";
      case "committing": return "bg-green-500/20 border-green-500";
      case "committed": return "bg-green-500/30 border-green-500";
      case "aborting": return "bg-red-500/20 border-red-500";
      case "aborted": return "bg-red-500/30 border-red-500";
      default: return "bg-muted";
    }
  };

  const getStatusIcon = (status: ParticipantStatus) => {
    switch (status) {
      case "preparing":
      case "prepared":
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case "committing":
      case "committed":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "aborting":
      case "aborted":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4">Distributed Transactions</Badge>
          <h2 className="text-3xl font-bold mb-4">Two-Phase Commit (2PC)</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Atomic commit protocol ensuring all participants either commit or abort together.
            Toggle failures to see rollback behavior.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coordinator */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                Transaction Coordinator
              </CardTitle>
              <CardDescription>
                Click on participants to simulate failures, then run the transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Phase Indicator */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {["prepare", "waitingVotes", "commit/abort", "complete"].map((phase, i) => (
                  <div key={phase} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      (coordinatorPhase === "prepare" && i === 0) ||
                      (coordinatorPhase === "waitingVotes" && i === 1) ||
                      ((coordinatorPhase === "commit" || coordinatorPhase === "abort") && i === 2) ||
                      (coordinatorPhase === "complete" && i === 3)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    {i < 3 && <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />}
                  </div>
                ))}
              </div>

              {/* Participants */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <AnimatePresence>
                  {participants.map((participant) => (
                    <motion.div
                      key={participant.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${getStatusColor(participant.status)} ${
                        participant.willFail ? "ring-2 ring-red-500 ring-offset-2 ring-offset-background" : ""
                      }`}
                      onClick={() => toggleParticipantFailure(participant.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-5 h-5" />
                        <span className="font-medium text-sm">{participant.name}</span>
                        {getStatusIcon(participant.status)}
                      </div>
                      
                      <div className="text-xs text-muted-foreground capitalize mb-2">
                        Status: {participant.status}
                      </div>

                      {participant.vote && (
                        <Badge variant={participant.vote === "yes" ? "default" : "destructive"} className="text-xs">
                          Vote: {participant.vote.toUpperCase()}
                        </Badge>
                      )}

                      {participant.willFail && (
                        <div className="absolute -top-2 -right-2">
                          <AlertTriangle className="w-5 h-5 text-red-500 fill-red-500/20" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={runTransaction}
                  disabled={isRunning}
                  size="lg"
                >
                  {isRunning ? "Transaction in Progress..." : "Start Transaction"}
                </Button>
                <Button
                  onClick={resetDemo}
                  variant="outline"
                  size="lg"
                  disabled={isRunning}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Log */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Transaction Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <AnimatePresence>
                  {logs.map((log) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`text-xs p-2 rounded border-l-2 ${
                        log.type === "success" ? "border-green-500 bg-green-500/10" :
                        log.type === "error" ? "border-red-500 bg-red-500/10" :
                        log.type === "warning" ? "border-yellow-500 bg-yellow-500/10" :
                        "border-blue-500 bg-blue-500/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {log.phase}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{log.message}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {logs.length === 0 && (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    Start a transaction to see logs
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-500">Phase 1: Prepare (Voting)</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Coordinator sends PREPARE to all participants</li>
                  <li>• Each participant locks resources and logs changes</li>
                  <li>• Participants reply with VOTE_YES or VOTE_NO</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-500">Phase 2: Commit/Abort</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• If all vote YES → Coordinator sends COMMIT</li>
                  <li>• If any vote NO → Coordinator sends ABORT</li>
                  <li>• Participants acknowledge and release locks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TwoPhaseCommitDemo;
