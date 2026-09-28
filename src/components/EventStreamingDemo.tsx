import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, FastForward, Play, Server, HardDrive } from "lucide-react";
import { DataDroid } from "./ui/SVGMascots";

export const EventStreamingInteractive = () => {
  const [stream, setStream] = useState<{ id: number; data: string; offset: number }[]>([]);
  const [consumerOffset, setConsumerOffset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const produceEvent = () => {
    const nextOffset = stream.length;
    setStream(prev => [...prev, { id: Date.now(), data: `Event_${nextOffset}`, offset: nextOffset }]);
  };

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setConsumerOffset(prev => {
        if (prev < stream.length) return prev + 1;
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, stream.length]);

  return (
    <div className="glass-card p-6 md:p-8 rounded-xl w-full flex flex-col items-center shadow-xl border border-border/50 bg-card/40 backdrop-blur-sm">
      <div className="flex w-full justify-between items-center mb-8">
        <button 
          onClick={produceEvent}
          className="py-2 px-4 md:px-6 bg-primary text-primary-foreground rounded-lg font-semibold flex items-center gap-2 hover:bg-primary/90 text-sm md:text-base"
        >
          <Database size={18} /> Produce Event
        </button>
        
        <div className="flex gap-2 md:gap-4">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className={`py-2 px-4 md:px-6 rounded-lg font-semibold flex items-center gap-2 text-sm md:text-base ${isPlaying ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}`}
          >
            <Play size={18} /> <span className="hidden md:inline">{isPlaying ? 'Pause Consumer' : 'Start Consumer'}</span>
          </button>
          <button 
            onClick={() => setConsumerOffset(0)}
            className="py-2 px-3 md:px-4 border border-border bg-background rounded-lg text-sm flex items-center gap-2 hover:bg-muted"
          >
            <FastForward size={16} /> <span className="hidden md:inline">Replay</span>
          </button>
        </div>
      </div>

      <div className="border border-border bg-card rounded-xl p-4 md:p-6 relative overflow-hidden h-40 md:h-48 flex items-center w-full">
        {/* The immutable log (Topic/Partition) */}
        <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2">
          <HardDrive className="text-muted-foreground" size={24} />
          <span className="font-bold text-muted-foreground tracking-widest uppercase text-[10px] md:text-xs rotate-180" style={{ writingMode: 'vertical-rl' }}>Partition 0</span>
        </div>
        
        <div className="ml-10 md:ml-16 w-full flex items-center gap-2 overflow-x-auto pb-4 pt-4 custom-scrollbar">
          <AnimatePresence>
            {stream.map((evt, idx) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex-shrink-0 w-16 h-16 md:w-24 md:h-24 rounded-lg flex flex-col items-center justify-center border-2 transition-colors relative ${
                  idx < consumerOffset 
                    ? 'border-border bg-muted text-muted-foreground' // Read
                    : 'border-primary bg-primary/10 text-primary' // Unread
                }`}
              >
                <span className="text-[10px] md:text-xs font-mono absolute top-1 md:top-2 right-1 md:right-2 opacity-50">#{evt.offset}</span>
                <span className="font-bold text-xs md:text-sm">{evt.data}</span>
                
                {/* Consumer Cursor */}
                {idx === consumerOffset && (
                  <motion.div 
                    layoutId="cursor"
                    className="absolute -bottom-8 flex flex-col items-center"
                  >
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] md:border-l-8 md:border-r-8 md:border-b-8 border-l-transparent border-r-transparent border-b-success"></div>
                    <div className="bg-success text-success-foreground text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded shadow-lg flex items-center gap-1 whitespace-nowrap">
                      <Server size={10} /> Consumer A (Offset: {consumerOffset})
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {stream.length === consumerOffset && stream.length > 0 && (
             <motion.div 
             layoutId="cursor"
             className="absolute bottom-2 md:bottom-4 right-1/4 flex flex-col items-center"
           >
             <div className="bg-success text-success-foreground text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded shadow-lg flex items-center gap-1 whitespace-nowrap">
               <Server size={10} /> Waiting for new events... (Offset: {consumerOffset})
             </div>
           </motion.div>
          )}

          {stream.length === 0 && (
            <div className="w-full text-center text-muted-foreground italic text-xs md:text-sm">
              Topic is empty. Produce an event to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EventStreamingDemo = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
          <DataDroid />
          <div>
            <h2 className="text-3xl font-bold mb-2">Event Streaming (Kafka)</h2>
            <p className="text-muted-foreground">
              Unlike a message queue where messages are deleted after being read, an event stream (like Apache Kafka) appends events to an immutable log. Consumers track their own "offset" and can replay events from any point in the past.
            </p>
          </div>
        </div>
        <EventStreamingInteractive />
      </div>
    </section>
  );
};

export default EventStreamingDemo;
