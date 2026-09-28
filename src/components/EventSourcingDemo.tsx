import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Play, RotateCcw, Clock, ArrowRight, History } from "lucide-react";

interface Event {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  version: number;
}

interface AccountState {
  id: string;
  balance: number;
  owner: string;
  status: "active" | "frozen" | "closed";
}

const EventSourcingDemo = () => {
  const [events, setEvents] = useState<Event[]>([
    { id: "evt-1", type: "AccountCreated", data: { owner: "Alice", initialBalance: 1000 }, timestamp: new Date(Date.now() - 86400000 * 5), version: 1 },
    { id: "evt-2", type: "MoneyDeposited", data: { amount: 500 }, timestamp: new Date(Date.now() - 86400000 * 4), version: 2 },
    { id: "evt-3", type: "MoneyWithdrawn", data: { amount: 200 }, timestamp: new Date(Date.now() - 86400000 * 3), version: 3 },
    { id: "evt-4", type: "MoneyDeposited", data: { amount: 1000 }, timestamp: new Date(Date.now() - 86400000 * 2), version: 4 },
    { id: "evt-5", type: "MoneyWithdrawn", data: { amount: 300 }, timestamp: new Date(Date.now() - 86400000), version: 5 },
  ]);
  
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [temporalQuery, setTemporalQuery] = useState<Date | null>(null);
  const [amount, setAmount] = useState("");

  const reconstructState = (upToVersion?: number): AccountState => {
    const relevantEvents = upToVersion 
      ? events.filter(e => e.version <= upToVersion)
      : events;
    
    return relevantEvents.reduce<AccountState>((state, event) => {
      switch (event.type) {
        case "AccountCreated":
          return {
            id: "ACC-001",
            balance: (event.data.initialBalance as number) || 0,
            owner: (event.data.owner as string) || "Unknown",
            status: "active",
          };
        case "MoneyDeposited":
          return { ...state, balance: state.balance + (event.data.amount as number) };
        case "MoneyWithdrawn":
          return { ...state, balance: state.balance - (event.data.amount as number) };
        case "AccountFrozen":
          return { ...state, status: "frozen" };
        case "AccountClosed":
          return { ...state, status: "closed" };
        default:
          return state;
      }
    }, { id: "", balance: 0, owner: "", status: "active" });
  };

  const currentState = reconstructState(replayIndex ?? undefined);

  const addEvent = (type: string, data: Record<string, unknown>) => {
    const newEvent: Event = {
      id: `evt-${Date.now()}`,
      type,
      data,
      timestamp: new Date(),
      version: events.length + 1,
    };
    setEvents(prev => [...prev, newEvent]);
    setReplayIndex(null);
  };

  const handleDeposit = () => {
    const amt = parseFloat(amount);
    if (amt > 0) {
      addEvent("MoneyDeposited", { amount: amt });
      setAmount("");
    }
  };

  const handleWithdraw = () => {
    const amt = parseFloat(amount);
    if (amt > 0 && amt <= currentState.balance) {
      addEvent("MoneyWithdrawn", { amount: amt });
      setAmount("");
    }
  };

  const startReplay = async () => {
    setIsReplaying(true);
    setReplayIndex(0);
    
    for (let i = 1; i <= events.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setReplayIndex(i);
    }
    
    setIsReplaying(false);
  };

  const queryAtTime = (date: Date) => {
    setTemporalQuery(date);
    const idx = events.findIndex(e => e.timestamp > date);
    setReplayIndex(idx === -1 ? events.length : idx);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "AccountCreated": return "🏦";
      case "MoneyDeposited": return "💰";
      case "MoneyWithdrawn": return "💸";
      case "AccountFrozen": return "🥶";
      case "AccountClosed": return "🔒";
      default: return "📝";
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "AccountCreated": return "bg-blue-500/20 border-blue-500/50";
      case "MoneyDeposited": return "bg-green-500/20 border-green-500/50";
      case "MoneyWithdrawn": return "bg-orange-500/20 border-orange-500/50";
      case "AccountFrozen": return "bg-cyan-500/20 border-cyan-500/50";
      case "AccountClosed": return "bg-red-500/20 border-red-500/50";
      default: return "bg-muted";
    }
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <Database className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Event Sourcing
                  <Badge variant="outline" className="ml-2">CQRS Pattern</Badge>
                </CardTitle>
                <CardDescription>
                  Store state as a sequence of events, enabling replay and temporal queries
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Store */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Event Store (Append-Only Log)
                </h4>
                <ScrollArea className="h-80 border rounded-lg p-3">
                  <div className="space-y-2">
                    {events.map((event, idx) => (
                      <div 
                        key={event.id}
                        className={`p-3 rounded-lg border transition-all ${getEventColor(event.type)} ${
                          replayIndex !== null && idx >= replayIndex ? "opacity-30" : ""
                        } ${replayIndex === idx ? "ring-2 ring-primary" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span>{getEventIcon(event.type)}</span>
                            <span className="font-semibold text-sm">{event.type}</span>
                            <Badge variant="outline" className="text-xs">v{event.version}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {event.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          {JSON.stringify(event.data)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-28"
                  />
                  <Button size="sm" onClick={handleDeposit} disabled={!amount || isReplaying}>
                    Deposit
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleWithdraw} disabled={!amount || isReplaying}>
                    Withdraw
                  </Button>
                  <div className="flex-1" />
                  <Button size="sm" variant="secondary" onClick={startReplay} disabled={isReplaying}>
                    <Play className="w-4 h-4 mr-1" />
                    Replay Events
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => { setReplayIndex(null); setTemporalQuery(null); }}
                    disabled={replayIndex === null}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Current State */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Reconstructed State
                  {replayIndex !== null && (
                    <Badge variant="secondary" className="text-xs">
                      @v{replayIndex}
                    </Badge>
                  )}
                </h4>
                <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border">
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-primary">
                      ${currentState.balance.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account ID:</span>
                      <span className="font-mono">{currentState.id || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Owner:</span>
                      <span>{currentState.owner || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={currentState.status === "active" ? "default" : "destructive"}>
                        {currentState.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span>{replayIndex ?? events.length}</span>
                    </div>
                  </div>
                </div>

                {/* Temporal Query */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Temporal Query
                  </h4>
                  <div className="text-xs text-muted-foreground mb-2">
                    Query state at any point in time
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {[5, 4, 3, 2, 1].map((daysAgo) => (
                      <Button
                        key={daysAgo}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => queryAtTime(new Date(Date.now() - 86400000 * daysAgo + 1000))}
                      >
                        {daysAgo}d ago
                      </Button>
                    ))}
                  </div>
                  {temporalQuery && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Showing state as of: {temporalQuery.toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                  <div className="font-semibold mb-2">Why Event Sourcing?</div>
                  <div>✓ Complete audit trail</div>
                  <div>✓ Time-travel debugging</div>
                  <div>✓ Temporal queries</div>
                  <div>✓ Event replay & rebuild</div>
                  <div>✓ Domain event integration</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default EventSourcingDemo;
