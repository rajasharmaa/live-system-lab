import { motion } from "framer-motion";
import { Github, Linkedin, Mail, Server } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-16 px-6 border-t border-border/50">
      <div className="container">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-primary/20">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-xl">SystemViz</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs">
              Interactive demonstrations of how production systems 
              behave under load. Built to impress.
            </p>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="font-semibold mb-4">Built With</h4>
            <div className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Tailwind CSS", "Framer Motion", "Recharts"].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <strong className="text-foreground">Production Stack:</strong>
              <br />
              Spring Boot • Redis • PostgreSQL • WebSockets
            </div>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              {[
                { Icon: Github, href: "#", label: "GitHub" },
                { Icon: Linkedin, href: "#", label: "LinkedIn" },
                { Icon: Mail, href: "#", label: "Email" },
              ].map(({ Icon, href, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-lg glass-card hover:border-primary/50 transition-colors"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5 text-muted-foreground hover:text-primary" />
                </motion.a>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Want to discuss system design?
              <br />
              <a href="#" className="text-primary hover:underline">
                Let's connect →
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SystemViz Portfolio. Built to demonstrate real engineering.
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            "This is how production systems behave"
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
