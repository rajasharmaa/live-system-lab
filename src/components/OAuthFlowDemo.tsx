import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Server, Shield, Key, ArrowRight, 
  CheckCircle, XCircle, RefreshCw, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FlowStep {
  id: number;
  from: "user" | "client" | "authServer" | "resourceServer";
  to: "user" | "client" | "authServer" | "resourceServer";
  message: string;
  description: string;
  data?: string;
}

const oauthSteps: FlowStep[] = [
  { id: 1, from: "user", to: "client", message: "Click Login", description: "User initiates OAuth flow", data: "" },
  { id: 2, from: "client", to: "authServer", message: "Authorization Request", description: "Redirect with client_id, scope, redirect_uri, state", data: "?response_type=code&client_id=abc&redirect_uri=https://..." },
  { id: 3, from: "authServer", to: "user", message: "Login Prompt", description: "Auth server shows login/consent screen", data: "" },
  { id: 4, from: "user", to: "authServer", message: "Approve Access", description: "User authenticates and grants permission", data: "username=john&consent=allow" },
  { id: 5, from: "authServer", to: "client", message: "Authorization Code", description: "Redirect back with temporary code", data: "?code=xyz123&state=..." },
  { id: 6, from: "client", to: "authServer", message: "Token Request", description: "Exchange code for tokens (server-side)", data: "grant_type=authorization_code&code=xyz123&client_secret=..." },
  { id: 7, from: "authServer", to: "client", message: "Access Token", description: "Returns access_token + refresh_token", data: '{"access_token":"eyJhbGc...","refresh_token":"dGhpcyB..."}' },
  { id: 8, from: "client", to: "resourceServer", message: "API Request", description: "Request with Bearer token", data: "Authorization: Bearer eyJhbGc..." },
  { id: 9, from: "resourceServer", to: "client", message: "Protected Data", description: "Returns user's protected resources", data: '{"user":{"email":"john@example.com"}}' },
];

const OAuthFlowDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isPlaying || currentStep >= oauthSteps.length) {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => prev + 1);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const startFlow = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(true);
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(false);
  };

  const getActorPosition = (actor: string) => {
    switch (actor) {
      case "user": return 0;
      case "client": return 1;
      case "authServer": return 2;
      case "resourceServer": return 3;
      default: return 0;
    }
  };

  const getActorIcon = (actor: string) => {
    switch (actor) {
      case "user": return <User className="w-6 h-6" />;
      case "client": return <Server className="w-6 h-6" />;
      case "authServer": return <Shield className="w-6 h-6" />;
      case "resourceServer": return <Lock className="w-6 h-6" />;
      default: return null;
    }
  };

  const getActorLabel = (actor: string) => {
    switch (actor) {
      case "user": return "User";
      case "client": return "Client App";
      case "authServer": return "Auth Server";
      case "resourceServer": return "Resource Server";
      default: return "";
    }
  };

  return (
    <section id="oauth" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Security & Auth</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">OAuth 2.0</span>
            <span className="text-foreground"> Authorization Code Flow</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Interactive visualization of the OAuth 2.0 authorization code grant flow - 
            the most secure flow for server-side applications.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <Button onClick={startFlow} disabled={isPlaying}>
            <Key className="w-4 h-4 mr-2" />
            Start OAuth Flow
          </Button>
          <Button variant="outline" onClick={resetFlow}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Actors */}
        <div className="glass-card p-6 mb-6">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {["user", "client", "authServer", "resourceServer"].map((actor) => (
              <div key={actor} className="text-center">
                <motion.div 
                  className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    oauthSteps[currentStep]?.from === actor || oauthSteps[currentStep]?.to === actor
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                  animate={{
                    scale: oauthSteps[currentStep]?.from === actor || oauthSteps[currentStep]?.to === actor 
                      ? [1, 1.1, 1] : 1
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {getActorIcon(actor)}
                </motion.div>
                <span className="text-sm font-medium">{getActorLabel(actor)}</span>
              </div>
            ))}
          </div>

          {/* Flow Animation */}
          <div className="relative h-24 mb-4">
            <AnimatePresence>
              {currentStep < oauthSteps.length && isPlaying && (
                <motion.div
                  key={currentStep}
                  className="absolute top-1/2 -translate-y-1/2"
                  initial={{ 
                    left: `${getActorPosition(oauthSteps[currentStep].from) * 25 + 12.5}%`,
                    opacity: 0,
                    scale: 0.5
                  }}
                  animate={{ 
                    left: `${getActorPosition(oauthSteps[currentStep].to) * 25 + 12.5}%`,
                    opacity: 1,
                    scale: 1
                  }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-lg px-4 py-2 whitespace-nowrap">
                    <ArrowRight className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{oauthSteps[currentStep].message}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="grid md:grid-cols-3 gap-4">
          {oauthSteps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: completedSteps.includes(index) || currentStep === index ? 1 : 0.5,
                y: 0 
              }}
              className={`glass-card p-4 border-2 transition-colors ${
                currentStep === index 
                  ? "border-primary" 
                  : completedSteps.includes(index) 
                    ? "border-green-500/50" 
                    : "border-transparent"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  completedSteps.includes(index) 
                    ? "bg-green-500/20 text-green-500" 
                    : currentStep === index
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {completedSteps.includes(index) ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{step.id}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {getActorLabel(step.from)} → {getActorLabel(step.to)}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{step.message}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{step.description}</p>
                  {step.data && (
                    <code className="text-xs bg-muted/50 px-2 py-1 rounded block overflow-hidden text-ellipsis">
                      {step.data.slice(0, 40)}...
                    </code>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security Notes */}
        <div className="mt-8 glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Why Authorization Code Flow?
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🔐 Secret Protection</h4>
              <p className="text-sm text-muted-foreground">
                Client secret never exposed to browser - token exchange happens server-side.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🎫 Short-Lived Code</h4>
              <p className="text-sm text-muted-foreground">
                Authorization code expires quickly (usually 10 min) and can only be used once.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🔄 Refresh Tokens</h4>
              <p className="text-sm text-muted-foreground">
                Long-lived refresh tokens allow obtaining new access tokens without re-authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OAuthFlowDemo;
