import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Key, Shield, ArrowRight, CheckCircle, XCircle, RefreshCw, Eye, EyeOff, Fingerprint } from "lucide-react";

interface HandshakeStep {
  id: number;
  label: string;
  from: "client" | "server";
  detail: string;
  status: "pending" | "active" | "done";
}

const TLS_STEPS: Omit<HandshakeStep, "status">[] = [
  { id: 1, label: "Client Hello", from: "client", detail: "Supported cipher suites, TLS version, client random" },
  { id: 2, label: "Server Hello", from: "server", detail: "Chosen cipher suite, server random, session ID" },
  { id: 3, label: "Certificate", from: "server", detail: "X.509 certificate with public key & CA signature" },
  { id: 4, label: "Certificate Verify", from: "client", detail: "Validate cert chain → Root CA, check expiry & domain" },
  { id: 5, label: "Key Exchange", from: "client", detail: "Pre-master secret encrypted with server's public key" },
  { id: 6, label: "Session Keys", from: "server", detail: "Both derive symmetric session keys from shared secret" },
  { id: 7, label: "Finished", from: "client", detail: "Encrypted 'Finished' message verifies handshake integrity" },
  { id: 8, label: "Secure Channel", from: "server", detail: "✅ AES-256-GCM encrypted bidirectional communication" },
];

const EncryptionTLSDemo = () => {
  const [steps, setSteps] = useState<HandshakeStep[]>(
    TLS_STEPS.map(s => ({ ...s, status: "pending" as const }))
  );
  const [currentStep, setCurrentStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"tls" | "symmetric" | "asymmetric">("tls");
  
  // Symmetric demo state
  const [plaintext, setPlaintext] = useState("Hello, World!");
  const [symKey] = useState("AES-256-KEY-x9f3...");
  const [showEncrypted, setShowEncrypted] = useState(false);
  
  // Asymmetric demo state
  const [asymStep, setAsymStep] = useState(0);

  const runHandshake = useCallback(() => {
    if (running) return;
    setRunning(true);
    setCurrentStep(0);
    setSteps(TLS_STEPS.map(s => ({ ...s, status: "pending" as const })));

    TLS_STEPS.forEach((_, idx) => {
      setTimeout(() => {
        setCurrentStep(idx);
        setSteps(prev => prev.map((s, i) => ({
          ...s,
          status: i < idx ? "done" : i === idx ? "active" : "pending"
        })));
        if (idx === TLS_STEPS.length - 1) {
          setTimeout(() => {
            setSteps(prev => prev.map(s => ({ ...s, status: "done" as const })));
            setRunning(false);
          }, 600);
        }
      }, idx * 700);
    });
  }, [running]);

  const resetHandshake = () => {
    setSteps(TLS_STEPS.map(s => ({ ...s, status: "pending" as const })));
    setCurrentStep(-1);
    setRunning(false);
  };

  const fakeEncrypt = (text: string) => {
    return btoa(text).split("").map((c, i) => 
      String.fromCharCode(c.charCodeAt(0) + ((i * 7) % 26))
    ).join("").substring(0, 24) + "...";
  };

  return (
    <section className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Encryption & TLS</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            TLS handshake, certificate validation, and symmetric vs asymmetric encryption
          </p>
        </motion.div>

        {/* Mode Tabs */}
        <div className="flex justify-center mb-8">
          <div className="glass-card p-1 flex gap-1">
            {([
              { key: "tls", label: "TLS Handshake", icon: Shield },
              { key: "symmetric", label: "Symmetric", icon: Key },
              { key: "asymmetric", label: "Asymmetric", icon: Lock },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  mode === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {mode === "tls" && (
          <div className="max-w-5xl mx-auto">
            {/* Controls */}
            <div className="flex justify-center gap-3 mb-8">
              <button
                onClick={runHandshake}
                disabled={running}
                className="px-5 py-2.5 rounded-lg text-sm font-medium bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 transition-all"
              >
                <Shield className="w-4 h-4 inline mr-1" /> Start TLS Handshake
              </button>
              <button
                onClick={resetHandshake}
                className="px-5 py-2.5 rounded-lg text-sm font-medium glass-card hover:bg-muted/50 transition-all"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" /> Reset
              </button>
            </div>

            {/* Handshake Visualization */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4">
              {/* Client */}
              <div className="text-center">
                <div className="glass-card p-4 inline-flex flex-col items-center gap-2">
                  <Fingerprint className="w-8 h-8 text-primary" />
                  <span className="font-bold">Client</span>
                  <span className="text-xs text-muted-foreground font-mono">Browser</span>
                </div>
              </div>
              <div />
              {/* Server */}
              <div className="text-center">
                <div className="glass-card p-4 inline-flex flex-col items-center gap-2">
                  <Shield className="w-8 h-8 text-success" />
                  <span className="font-bold">Server</span>
                  <span className="text-xs text-muted-foreground font-mono">api.example.com</span>
                </div>
              </div>

              {/* Steps */}
              {steps.map((step) => (
                <>
                  <div key={`left-${step.id}`} className={`flex items-center ${step.from === "client" ? "justify-end" : "justify-end opacity-0"}`}>
                    {step.from === "client" && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={step.status !== "pending" ? { opacity: 1, x: 0 } : {}}
                        className={`glass-card p-3 text-xs max-w-[200px] ${
                          step.status === "active" ? "ring-2 ring-primary" :
                          step.status === "done" ? "opacity-80" : ""
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-1">
                          {step.status === "done" ? <CheckCircle className="w-3 h-3 text-success" /> :
                           step.status === "active" ? <RefreshCw className="w-3 h-3 text-primary animate-spin" /> : null}
                          {step.label}
                        </div>
                        <div className="text-muted-foreground mt-1">{step.detail}</div>
                      </motion.div>
                    )}
                  </div>
                  <div key={`arrow-${step.id}`} className="flex items-center justify-center">
                    <motion.div
                      animate={step.status === "active" ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ repeat: step.status === "active" ? Infinity : 0, duration: 0.6 }}
                    >
                      <ArrowRight className={`w-5 h-5 ${
                        step.from === "client" ? "" : "rotate-180"
                      } ${
                        step.status === "active" ? "text-primary" :
                        step.status === "done" ? "text-success" : "text-muted-foreground/30"
                      }`} />
                    </motion.div>
                  </div>
                  <div key={`right-${step.id}`} className={`flex items-center ${step.from === "server" ? "justify-start" : "justify-start opacity-0"}`}>
                    {step.from === "server" && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={step.status !== "pending" ? { opacity: 1, x: 0 } : {}}
                        className={`glass-card p-3 text-xs max-w-[200px] ${
                          step.status === "active" ? "ring-2 ring-success" :
                          step.status === "done" ? "opacity-80" : ""
                        }`}
                      >
                        <div className="font-semibold flex items-center gap-1">
                          {step.status === "done" ? <CheckCircle className="w-3 h-3 text-success" /> :
                           step.status === "active" ? <RefreshCw className="w-3 h-3 text-success animate-spin" /> : null}
                          {step.label}
                        </div>
                        <div className="text-muted-foreground mt-1">{step.detail}</div>
                      </motion.div>
                    )}
                  </div>
                </>
              ))}
            </div>
          </div>
        )}

        {mode === "symmetric" && (
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="glass-card p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" /> Plaintext
                </h3>
                <textarea
                  value={plaintext}
                  onChange={(e) => { setPlaintext(e.target.value); setShowEncrypted(false); }}
                  className="w-full bg-muted/30 rounded-lg p-3 text-sm font-mono h-24 resize-none border border-muted focus:border-primary outline-none"
                />
                <button
                  onClick={() => setShowEncrypted(true)}
                  className="w-full mt-3 px-4 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-all"
                >
                  <Lock className="w-4 h-4 inline mr-1" /> Encrypt (AES-256)
                </button>
              </div>

              <div className="glass-card p-6 flex flex-col items-center justify-center">
                <Key className="w-10 h-10 text-warning mb-3" />
                <div className="text-sm font-bold mb-1">Shared Key</div>
                <div className="font-mono text-xs text-muted-foreground text-center break-all bg-muted/30 p-2 rounded">
                  {symKey}
                </div>
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  Same key encrypts & decrypts
                </div>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] px-2 py-1 bg-success/20 text-success rounded">Fast</span>
                  <span className="text-[10px] px-2 py-1 bg-warning/20 text-warning rounded">Key distribution problem</span>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <EyeOff className="w-5 h-5 text-destructive" /> Ciphertext
                </h3>
                <div className="bg-muted/30 rounded-lg p-3 text-sm font-mono h-24 overflow-hidden break-all">
                  {showEncrypted ? (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive">
                      {fakeEncrypt(plaintext)}
                    </motion.span>
                  ) : (
                    <span className="text-muted-foreground">Press encrypt...</span>
                  )}
                </div>
                {showEncrypted && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowEncrypted(false)}
                    className="w-full mt-3 px-4 py-2 bg-success/20 text-success rounded-lg text-sm hover:bg-success/30 transition-all"
                  >
                    <Key className="w-4 h-4 inline mr-1" /> Decrypt
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        )}

        {mode === "asymmetric" && (
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Alice */}
              <div className="glass-card p-6 border-2 border-primary/30">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Fingerprint className="w-6 h-6 text-primary" /> Alice (Sender)
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Alice's Private Key 🔐</div>
                    <div className="font-mono text-xs text-destructive">RSA-PRIV-a7x9...kept-secret</div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Bob's Public Key 🔓</div>
                    <div className="font-mono text-xs text-success">RSA-PUB-b3k2...shared-freely</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Encrypts with Bob's <strong className="text-success">public key</strong> → Only Bob can decrypt
                </div>
              </div>

              {/* Bob */}
              <div className="glass-card p-6 border-2 border-success/30">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-success" /> Bob (Receiver)
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Bob's Private Key 🔐</div>
                    <div className="font-mono text-xs text-destructive">RSA-PRIV-b3k2...kept-secret</div>
                  </div>
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Alice's Public Key 🔓</div>
                    <div className="font-mono text-xs text-success">RSA-PUB-a7x9...shared-freely</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Decrypts with own <strong className="text-destructive">private key</strong> → Reads Alice's message
                </div>
              </div>
            </div>

            {/* Flow Steps */}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {[
                { step: 0, label: "Generate Key Pairs", desc: "Each party creates public + private keys" },
                { step: 1, label: "Exchange Public Keys", desc: "Share public keys openly (no secrecy needed)" },
                { step: 2, label: "Encrypt with Public", desc: "Alice encrypts using Bob's public key" },
                { step: 3, label: "Decrypt with Private", desc: "Bob decrypts using his private key" },
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setAsymStep(s.step)}
                  className={`glass-card p-3 text-left transition-all max-w-[200px] ${
                    asymStep === s.step ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="text-xs font-bold flex items-center gap-1">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      asymStep >= s.step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>{s.step + 1}</span>
                    {s.label}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{s.desc}</div>
                </button>
              ))}
            </div>

            <div className="glass-card p-4 mt-6 text-xs text-center space-y-1">
              <div><strong>Asymmetric encryption</strong> solves the key distribution problem but is ~1000x slower than symmetric.</div>
              <div className="text-muted-foreground">TLS uses asymmetric to exchange a symmetric key, then symmetric for data transfer (hybrid approach).</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default EncryptionTLSDemo;
