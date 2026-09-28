import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, Lock, Unlock, User, Shield, Clock, 
  CheckCircle, XCircle, RefreshCw, Eye, EyeOff,
  ArrowRight, Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TokenPayload {
  sub: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

const JWTAuthDemo = () => {
  const [username, setUsername] = useState("john_doe");
  const [password, setPassword] = useState("password123");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<TokenPayload | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isExpired, setIsExpired] = useState(false);
  const [expiresIn, setExpiresIn] = useState(30);

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 9)]);
  };

  // Simulated Base64 encoding for demo
  const base64Encode = (obj: object) => {
    return btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  };

  const generateToken = useCallback(() => {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: "user_" + Math.random().toString(36).substr(2, 9),
      name: username,
      role: "admin",
      iat: now,
      exp: now + expiresIn,
    };
    
    // Simulated signature (in reality, this would be HMAC-SHA256)
    const signature = "simulated_signature_" + Math.random().toString(36).substr(2, 16);
    
    const jwt = `${base64Encode(header)}.${base64Encode(payload)}.${signature}`;
    
    return { jwt, payload };
  }, [username, expiresIn]);

  const login = useCallback(async () => {
    addLog("🔐 Attempting login...");
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username && password) {
      addLog("✅ Credentials validated");
      const { jwt, payload } = generateToken();
      setToken(jwt);
      setDecodedToken(payload);
      setIsAuthenticated(true);
      setIsExpired(false);
      addLog("🎫 JWT token generated");
      addLog(`⏱️ Token expires in ${expiresIn} seconds`);

      // Auto-expire token
      setTimeout(() => {
        setIsExpired(true);
        addLog("⚠️ Token expired!");
      }, expiresIn * 1000);
    } else {
      addLog("❌ Invalid credentials");
    }
  }, [username, password, generateToken, expiresIn]);

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setDecodedToken(null);
    setIsExpired(false);
    addLog("👋 User logged out");
  };

  const refreshToken = useCallback(() => {
    addLog("🔄 Refreshing token...");
    const { jwt, payload } = generateToken();
    setToken(jwt);
    setDecodedToken(payload);
    setIsExpired(false);
    addLog("✅ Token refreshed");
  }, [generateToken]);

  const formatTokenPart = (part: string, color: string) => (
    <span style={{ color }}>{part}</span>
  );

  return (
    <section id="jwt" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Authentication</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">JWT</span>
            <span className="text-foreground"> Authentication</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            JSON Web Tokens for stateless authentication. 
            Self-contained tokens with encoded claims and digital signatures.
          </p>
        </motion.div>

        {/* Auth Flow Diagram */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-lg">
              <User className="w-5 h-5 text-primary" />
              <span>Client</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs">credentials</span>
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-lg">
              <Server className="w-5 h-5 text-secondary" />
              <span>Auth Server</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs">JWT</span>
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-lg">
              <Shield className="w-5 h-5 text-accent" />
              <span>Protected API</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Login / Token Display */}
          <div className="space-y-6">
            {/* Login Form */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                {isAuthenticated ? <Unlock className="w-5 h-5 text-success" /> : <Lock className="w-5 h-5" />}
                {isAuthenticated ? "Authenticated" : "Login"}
              </h3>

              {!isAuthenticated ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Username</label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Token expires in (seconds)</label>
                    <Input
                      type="number"
                      value={expiresIn}
                      onChange={(e) => setExpiresIn(parseInt(e.target.value) || 30)}
                      min={5}
                      max={300}
                    />
                  </div>
                  <Button onClick={login} className="w-full gap-2">
                    <Key className="w-4 h-4" />
                    Login & Generate JWT
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/30">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span>Logged in as <strong>{username}</strong></span>
                    </div>
                    <Badge variant="secondary">{decodedToken?.role}</Badge>
                  </div>

                  {isExpired && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span className="text-destructive">Token expired!</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={refreshToken} variant="outline" className="flex-1 gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh Token
                    </Button>
                    <Button onClick={logout} variant="destructive" className="flex-1 gap-2">
                      <Lock className="w-4 h-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Token Display */}
            {token && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-semibold mb-3">JWT Token</h3>
                <div className="p-4 bg-muted/50 rounded-lg font-mono text-xs break-all">
                  {token.split('.').map((part, index) => (
                    <span key={index}>
                      {formatTokenPart(
                        part, 
                        index === 0 ? "hsl(var(--primary))" : 
                        index === 1 ? "hsl(var(--secondary))" : 
                        "hsl(var(--accent))"
                      )}
                      {index < 2 && <span className="text-muted-foreground">.</span>}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs">
                  <span className="text-primary">■ Header</span>
                  <span className="text-secondary">■ Payload</span>
                  <span className="text-accent">■ Signature</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right: Decoded Token & Logs */}
          <div className="space-y-6">
            {/* Decoded Payload */}
            {decodedToken && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-6"
              >
                <Tabs defaultValue="payload">
                  <TabsList className="mb-4">
                    <TabsTrigger value="header">Header</TabsTrigger>
                    <TabsTrigger value="payload">Payload</TabsTrigger>
                  </TabsList>
                  <TabsContent value="header">
                    <pre className="p-4 bg-muted/50 rounded-lg font-mono text-sm overflow-auto">
{JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="payload">
                    <pre className="p-4 bg-muted/50 rounded-lg font-mono text-sm overflow-auto">
{JSON.stringify(decodedToken, null, 2)}
                    </pre>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Issued:</span>
                        <span>{new Date(decodedToken.iat * 1000).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Expires:</span>
                        <span className={isExpired ? "text-destructive" : ""}>
                          {new Date(decodedToken.exp * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {/* Activity Log */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
              <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
                <AnimatePresence>
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Login to see activity
                    </p>
                  ) : (
                    logs.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-2 bg-muted/30 rounded"
                      >
                        {log}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JWTAuthDemo;
