import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PenLine, Eye, Database, ArrowRight, Plus, 
  Trash2, RefreshCw, Clock, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Command {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  payload: Record<string, unknown>;
  timestamp: number;
}

interface Event {
  id: string;
  type: string;
  data: Product | { id: string };
  timestamp: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

const CQRSDemo = () => {
  const [products, setProducts] = useState<Product[]>([
    { id: "1", name: "Laptop", price: 999, stock: 10 },
    { id: "2", name: "Keyboard", price: 79, stock: 25 },
  ]);
  const [readModel, setReadModel] = useState<Product[]>([
    { id: "1", name: "Laptop", price: 999, stock: 10 },
    { id: "2", name: "Keyboard", price: 79, stock: 25 },
  ]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [newProductName, setNewProductName] = useState("");
  const [syncDelay, setSyncDelay] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const executeCommand = useCallback(async (command: Command) => {
    // Add to command queue
    setCommands(prev => [command, ...prev.slice(0, 9)]);

    // Process command -> generate event
    let event: Event | null = null;

    switch (command.type) {
      case "CREATE": {
        const newProduct: Product = {
          id: generateId(),
          name: command.payload.name as string,
          price: Math.floor(Math.random() * 500) + 50,
          stock: Math.floor(Math.random() * 30) + 5,
        };
        setProducts(prev => [...prev, newProduct]);
        event = { id: generateId(), type: "ProductCreated", data: newProduct, timestamp: Date.now() };
        break;
      }

      case "DELETE": {
        const deleteId = command.payload.id as string;
        setProducts(prev => prev.filter(p => p.id !== deleteId));
        event = { id: generateId(), type: "ProductDeleted", data: { id: deleteId }, timestamp: Date.now() };
        break;
      }

      case "UPDATE": {
        const updateId = command.payload.id as string;
        setProducts(prev => prev.map(p => 
          p.id === updateId 
            ? { ...p, stock: (p.stock || 0) - 1 } 
            : p
        ));
        event = { id: generateId(), type: "ProductUpdated", data: { id: updateId }, timestamp: Date.now() };
        break;
      }
    }

    if (event) {
      setEvents(prev => [event!, ...prev.slice(0, 9)]);

      // Sync to read model (with optional delay to show eventual consistency)
      if (syncDelay) {
        setIsSyncing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      setReadModel(prev => {
        switch (event!.type) {
          case "ProductCreated":
            return [...prev, event!.data as Product];
          case "ProductDeleted":
            return prev.filter(p => p.id !== (event!.data as { id: string }).id);
          case "ProductUpdated": {
            const eventData = event!.data as { id: string };
            return prev.map(p => 
              p.id === eventData.id 
                ? { ...p, stock: (p.stock || 0) - 1 } 
                : p
            );
          }
          default:
            return prev;
        }
      });
      setIsSyncing(false);
    }
  }, [syncDelay]);

  const addProduct = () => {
    if (!newProductName.trim()) return;
    executeCommand({
      id: generateId(),
      type: "CREATE",
      payload: { name: newProductName.trim() },
      timestamp: Date.now(),
    });
    setNewProductName("");
  };

  const deleteProduct = (id: string) => {
    executeCommand({
      id: generateId(),
      type: "DELETE",
      payload: { id },
      timestamp: Date.now(),
    });
  };

  const purchaseProduct = (id: string) => {
    executeCommand({
      id: generateId(),
      type: "UPDATE",
      payload: { id, action: "purchase" },
      timestamp: Date.now(),
    });
  };

  return (
    <section id="cqrs" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Architecture Pattern</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">CQRS</span>
            <span className="text-foreground"> + Event Sourcing</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Command Query Responsibility Segregation separates read and write operations. 
            Combined with Event Sourcing for complete audit trail.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-lg border border-primary/30">
              <PenLine className="w-5 h-5 text-primary" />
              <span className="font-medium">Commands</span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-lg border border-secondary/30">
              <Layers className="w-5 h-5 text-secondary" />
              <span className="font-medium">Event Store</span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-lg border border-accent/30">
              <Eye className="w-5 h-5 text-accent" />
              <span className="font-medium">Read Model</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Write Side (Commands) */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <PenLine className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Write Side (Commands)</h3>
            </div>

            {/* Add Product */}
            <div className="flex gap-2 mb-4">
              <Input
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="New product name..."
                onKeyDown={(e) => e.key === 'Enter' && addProduct()}
              />
              <Button onClick={addProduct} size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Products List */}
            <div className="space-y-2 mb-4">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ${product.price} • Stock: {product.stock}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => purchaseProduct(product.id)}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteProduct(product.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Commands */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Commands</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                <AnimatePresence>
                  {commands.slice(0, 5).map((cmd) => (
                    <motion.div
                      key={cmd.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs font-mono p-2 bg-primary/10 rounded"
                    >
                      {cmd.type}: {JSON.stringify(cmd.payload).slice(0, 30)}...
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Event Store */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-secondary" />
              <h3 className="text-lg font-semibold">Event Store</h3>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="sync-delay"
                checked={syncDelay}
                onChange={(e) => setSyncDelay(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="sync-delay" className="text-sm text-muted-foreground">
                Simulate sync delay (eventual consistency)
              </label>
            </div>

            {isSyncing && (
              <div className="flex items-center gap-2 p-3 bg-warning/20 rounded-lg mb-4">
                <Clock className="w-4 h-4 text-warning animate-pulse" />
                <span className="text-sm text-warning">Syncing to read model...</span>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {events.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    Events will appear here
                  </p>
                ) : (
                  events.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-secondary/10 rounded-lg border border-secondary/20"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {event.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <code className="text-xs text-muted-foreground">
                        {JSON.stringify(event.data).slice(0, 50)}...
                      </code>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Read Side */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold">Read Side (Query)</h3>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {readModel.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-accent/10 rounded-lg border border-accent/20"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Price: ${product.price}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Available: {product.stock} units
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">Optimized for reads</h4>
              <p className="text-xs text-muted-foreground">
                Read model is denormalized and cached for fast queries. 
                Updated asynchronously from event store.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CQRSDemo;
