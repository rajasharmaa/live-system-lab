import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, AlertTriangle, CheckCircle, XCircle, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface QueryResult {
  query: string;
  bloomResult: "possibly_present" | "definitely_not";
  actualResult: boolean;
  isFalsePositive: boolean;
  timestamp: number;
}

const FILTER_SIZE = 32;
const NUM_HASH_FUNCTIONS = 3;

// Simple hash functions for demo purposes
const hashFunctions = [
  (str: string, size: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % size;
    }
    return Math.abs(hash);
  },
  (str: string, size: number) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    }
    return Math.abs(hash % size);
  },
  (str: string, size: number) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 6) + (hash << 16) - hash);
    }
    return Math.abs(hash % size);
  },
];

const BloomFilterDemo = () => {
  const [actualSet, setActualSet] = useState<Set<string>>(new Set(["apple", "banana", "cherry"]));
  const [bitArray, setBitArray] = useState<boolean[]>(() => {
    // Initialize with existing items
    const arr = new Array(FILTER_SIZE).fill(false);
    ["apple", "banana", "cherry"].forEach(item => {
      hashFunctions.forEach(fn => {
        arr[fn(item, FILTER_SIZE)] = true;
      });
    });
    return arr;
  });
  const [inputValue, setInputValue] = useState("");
  const [queryValue, setQueryValue] = useState("");
  const [queryResults, setQueryResults] = useState<QueryResult[]>([]);
  const [highlightedBits, setHighlightedBits] = useState<number[]>([]);
  const [animatingBits, setAnimatingBits] = useState<number[]>([]);

  const stats = useMemo(() => {
    const totalQueries = queryResults.length;
    const falsePositives = queryResults.filter(r => r.isFalsePositive).length;
    const trueNegatives = queryResults.filter(r => r.bloomResult === "definitely_not").length;
    const setBitsCount = bitArray.filter(b => b).length;
    const fillRatio = (setBitsCount / FILTER_SIZE) * 100;
    
    return {
      totalQueries,
      falsePositives,
      falsePositiveRate: totalQueries > 0 ? ((falsePositives / totalQueries) * 100).toFixed(1) : "0.0",
      trueNegatives,
      setBitsCount,
      fillRatio: fillRatio.toFixed(1),
    };
  }, [queryResults, bitArray]);

  const addItem = useCallback(() => {
    if (!inputValue.trim() || actualSet.has(inputValue.trim())) return;
    
    const item = inputValue.trim().toLowerCase();
    const bitsToSet = hashFunctions.map(fn => fn(item, FILTER_SIZE));
    
    // Animate the bits being set
    setAnimatingBits(bitsToSet);
    setTimeout(() => setAnimatingBits([]), 500);
    
    // Update bit array
    const newBitArray = [...bitArray];
    bitsToSet.forEach(bit => {
      newBitArray[bit] = true;
    });
    setBitArray(newBitArray);
    
    // Update actual set
    setActualSet(prev => new Set([...prev, item]));
    setInputValue("");
  }, [inputValue, actualSet, bitArray]);

  const queryItem = useCallback(() => {
    if (!queryValue.trim()) return;
    
    const item = queryValue.trim().toLowerCase();
    const bitsToCheck = hashFunctions.map(fn => fn(item, FILTER_SIZE));
    
    // Highlight the bits being checked
    setHighlightedBits(bitsToCheck);
    setTimeout(() => setHighlightedBits([]), 1500);
    
    // Check if all bits are set
    const allBitsSet = bitsToCheck.every(bit => bitArray[bit]);
    const actuallyPresent = actualSet.has(item);
    
    const result: QueryResult = {
      query: item,
      bloomResult: allBitsSet ? "possibly_present" : "definitely_not",
      actualResult: actuallyPresent,
      isFalsePositive: allBitsSet && !actuallyPresent,
      timestamp: Date.now(),
    };
    
    setQueryResults(prev => [result, ...prev.slice(0, 9)]);
    setQueryValue("");
  }, [queryValue, bitArray, actualSet]);

  const reset = () => {
    const initialItems = ["apple", "banana", "cherry"];
    const arr = new Array(FILTER_SIZE).fill(false);
    initialItems.forEach(item => {
      hashFunctions.forEach(fn => {
        arr[fn(item, FILTER_SIZE)] = true;
      });
    });
    setBitArray(arr);
    setActualSet(new Set(initialItems));
    setQueryResults([]);
    setHighlightedBits([]);
  };

  return (
    <section id="bloom-filter" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Probabilistic Data Structure</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Bloom Filter</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Space-efficient probabilistic data structure for membership testing. 
            May report false positives, but never false negatives.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card p-6"
          >
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              Bit Array Visualization
              <span className="text-sm font-mono text-muted-foreground">({FILTER_SIZE} bits)</span>
            </h3>
            
            {/* Bit Array Grid */}
            <div className="grid grid-cols-8 gap-2 mb-6">
              {bitArray.map((bit, index) => (
                <motion.div
                  key={index}
                  animate={{
                    scale: animatingBits.includes(index) ? [1, 1.3, 1] : 1,
                    backgroundColor: highlightedBits.includes(index) 
                      ? "hsl(var(--warning))" 
                      : bit 
                        ? "hsl(var(--primary))" 
                        : "hsl(var(--muted))"
                  }}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center 
                    text-xs font-mono transition-colors
                    ${bit ? 'text-primary-foreground' : 'text-muted-foreground'}
                  `}
                >
                  {bit ? "1" : "0"}
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="glass-card p-3 text-center">
                <div className="text-2xl font-bold text-primary">{stats.setBitsCount}</div>
                <div className="text-xs text-muted-foreground">Bits Set</div>
              </div>
              <div className="glass-card p-3 text-center">
                <div className="text-2xl font-bold text-accent">{stats.fillRatio}%</div>
                <div className="text-xs text-muted-foreground">Fill Ratio</div>
              </div>
              <div className="glass-card p-3 text-center">
                <div className="text-2xl font-bold text-destructive">{stats.falsePositiveRate}%</div>
                <div className="text-xs text-muted-foreground">False Positive Rate</div>
              </div>
            </div>

            {/* Current Set */}
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Items in Set:</h4>
              <div className="flex flex-wrap gap-2">
                {[...actualSet].map(item => (
                  <Badge key={item} variant="secondary" className="font-mono">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Add Item */}
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Add item to set..."
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                className="flex-1"
              />
              <Button onClick={addItem} className="gap-2">
                <Plus className="w-4 h-4" /> Add
              </Button>
              <Button onClick={reset} variant="outline" size="icon">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>

          {/* Right: Query & Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Query Input */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4">Membership Query</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  value={queryValue}
                  onChange={(e) => setQueryValue(e.target.value)}
                  placeholder="Query item..."
                  onKeyDown={(e) => e.key === 'Enter' && queryItem()}
                  className="flex-1"
                />
                <Button onClick={queryItem} className="gap-2">
                  <Search className="w-4 h-4" /> Check
                </Button>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Try querying items not in the set (e.g., "grape", "mango") to see false positives. 
                  Bloom filters can say "maybe present" or "definitely not present".
                </p>
              </div>
            </div>

            {/* Query Results */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4">Query Results</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                <AnimatePresence>
                  {queryResults.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No queries yet. Try searching for an item!
                    </p>
                  ) : (
                    queryResults.map((result, index) => (
                      <motion.div
                        key={result.timestamp}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`p-3 rounded-lg border ${
                          result.isFalsePositive 
                            ? 'bg-destructive/10 border-destructive/30' 
                            : result.bloomResult === "definitely_not"
                              ? 'bg-muted/50 border-border'
                              : 'bg-success/10 border-success/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">"{result.query}"</span>
                            {result.isFalsePositive && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                False Positive!
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {result.bloomResult === "possibly_present" ? (
                              <Badge className="bg-warning/20 text-warning border-warning/30">
                                Maybe Present
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Present
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Actually in set: {result.actualResult ? (
                            <span className="text-success">Yes</span>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* How it works */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-3">How Bloom Filters Work</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Add:</strong> Hash item with {NUM_HASH_FUNCTIONS} functions → Set those bits to 1</p>
                <p><strong className="text-foreground">Query:</strong> Check if all {NUM_HASH_FUNCTIONS} hash positions are 1</p>
                <p><strong className="text-foreground">Trade-off:</strong> More bits = fewer false positives, but more memory</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BloomFilterDemo;
