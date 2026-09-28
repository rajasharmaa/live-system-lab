import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Shield, Key, Lock, Unlock, CheckCircle, 
  XCircle, UserCog, Database, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

interface User {
  id: string;
  name: string;
  avatar: string;
  roles: string[];
}

const permissions: Permission[] = [
  { id: "read:users", name: "Read Users", resource: "users", action: "read" },
  { id: "write:users", name: "Write Users", resource: "users", action: "write" },
  { id: "delete:users", name: "Delete Users", resource: "users", action: "delete" },
  { id: "read:posts", name: "Read Posts", resource: "posts", action: "read" },
  { id: "write:posts", name: "Write Posts", resource: "posts", action: "write" },
  { id: "delete:posts", name: "Delete Posts", resource: "posts", action: "delete" },
  { id: "read:settings", name: "Read Settings", resource: "settings", action: "read" },
  { id: "write:settings", name: "Write Settings", resource: "settings", action: "write" },
  { id: "manage:billing", name: "Manage Billing", resource: "billing", action: "manage" },
];

const roles: Role[] = [
  { 
    id: "admin", 
    name: "Admin", 
    color: "bg-red-500",
    permissions: permissions.map(p => p.id) 
  },
  { 
    id: "editor", 
    name: "Editor", 
    color: "bg-blue-500",
    permissions: ["read:users", "read:posts", "write:posts", "delete:posts", "read:settings"] 
  },
  { 
    id: "viewer", 
    name: "Viewer", 
    color: "bg-green-500",
    permissions: ["read:users", "read:posts", "read:settings"] 
  },
  { 
    id: "billing", 
    name: "Billing Admin", 
    color: "bg-yellow-500",
    permissions: ["read:users", "manage:billing"] 
  },
];

const users: User[] = [
  { id: "1", name: "Alice Chen", avatar: "A", roles: ["admin"] },
  { id: "2", name: "Bob Smith", avatar: "B", roles: ["editor"] },
  { id: "3", name: "Carol White", avatar: "C", roles: ["viewer"] },
  { id: "4", name: "David Lee", avatar: "D", roles: ["editor", "billing"] },
];

const RBACDemo = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(users[0]);
  const [checkPermission, setCheckPermission] = useState<string | null>(null);
  const [accessResult, setAccessResult] = useState<boolean | null>(null);

  const getUserPermissions = (user: User): string[] => {
    const userPermissions = new Set<string>();
    user.roles.forEach(roleId => {
      const role = roles.find(r => r.id === roleId);
      if (role) {
        role.permissions.forEach(p => userPermissions.add(p));
      }
    });
    return Array.from(userPermissions);
  };

  const checkAccess = (permissionId: string) => {
    if (!selectedUser) return;
    
    setCheckPermission(permissionId);
    const userPermissions = getUserPermissions(selectedUser);
    const hasAccess = userPermissions.includes(permissionId);
    
    setTimeout(() => {
      setAccessResult(hasAccess);
    }, 500);
  };

  const resetCheck = () => {
    setCheckPermission(null);
    setAccessResult(null);
  };

  return (
    <section id="rbac" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">Security & Auth</Badge>
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">RBAC</span>
            <span className="text-foreground"> Role-Based Access Control</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Interactive demonstration of role-based access control showing how users inherit 
            permissions through their assigned roles.
          </p>
        </motion.div>

        {/* RBAC Hierarchy Diagram */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-lg border border-primary/30">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-medium">Users</span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/20 rounded-lg border border-secondary/30">
              <Shield className="w-5 h-5 text-secondary" />
              <span className="font-medium">Roles</span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-lg border border-accent/30">
              <Key className="w-5 h-5 text-accent" />
              <span className="font-medium">Permissions</span>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg border border-muted-foreground/30">
              <Database className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Resources</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Users Panel */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Users</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select a user to see their role-based permissions.
            </p>
            <div className="space-y-2">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedUser(user); resetCheck(); }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?.id === user.id 
                      ? "bg-primary/20 border-2 border-primary" 
                      : "bg-muted/50 border-2 border-transparent hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {user.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="flex gap-1 mt-1">
                        {user.roles.map(roleId => {
                          const role = roles.find(r => r.id === roleId);
                          return role ? (
                            <span key={roleId} className={`text-xs px-2 py-0.5 rounded ${role.color} text-white`}>
                              {role.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    {selectedUser?.id === user.id && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Roles Panel */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-secondary" />
              <h3 className="text-lg font-semibold">Roles</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Roles group permissions for easier management.
            </p>
            <div className="space-y-3">
              {roles.map((role) => {
                const isActive = selectedUser?.roles.includes(role.id);
                return (
                  <motion.div
                    key={role.id}
                    animate={{ 
                      opacity: isActive ? 1 : 0.5,
                      scale: isActive ? 1 : 0.98
                    }}
                    className={`p-3 rounded-lg border-2 ${
                      isActive ? "border-secondary bg-secondary/10" : "border-transparent bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${role.color}`} />
                      <span className="font-medium text-sm">{role.name}</span>
                      {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 4).map(permId => (
                        <span key={permId} className="text-xs px-2 py-0.5 bg-muted rounded">
                          {permissions.find(p => p.id === permId)?.name}
                        </span>
                      ))}
                      {role.permissions.length > 4 && (
                        <span className="text-xs px-2 py-0.5 bg-muted rounded">
                          +{role.permissions.length - 4} more
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Permissions Panel */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold">Check Permissions</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Click to check if {selectedUser?.name || "selected user"} has access.
            </p>
            
            {/* Access Result */}
            <AnimatePresence>
              {accessResult !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 rounded-lg mb-4 ${
                    accessResult 
                      ? "bg-green-500/20 border border-green-500/50" 
                      : "bg-red-500/20 border border-red-500/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {accessResult ? (
                      <>
                        <Unlock className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-green-500">Access Granted</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 text-red-500" />
                        <span className="font-medium text-red-500">Access Denied</span>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {permissions.map((permission) => {
                const hasPermission = selectedUser 
                  ? getUserPermissions(selectedUser).includes(permission.id)
                  : false;
                const isChecking = checkPermission === permission.id;
                
                return (
                  <motion.button
                    key={permission.id}
                    onClick={() => checkAccess(permission.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      isChecking 
                        ? "bg-primary/20 border-2 border-primary" 
                        : hasPermission
                          ? "bg-green-500/10 border-2 border-green-500/30"
                          : "bg-muted/50 border-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {hasPermission ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">{permission.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {permission.resource}:{permission.action}
                      </Badge>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mt-8 glass-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            RBAC Best Practices
          </h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🔐 Least Privilege</h4>
              <p className="text-sm text-muted-foreground">
                Assign minimum permissions needed to perform duties.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">📊 Separate Roles Table</h4>
              <p className="text-sm text-muted-foreground">
                Never store roles in user profile - use a dedicated table.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">🔒 Server-Side Checks</h4>
              <p className="text-sm text-muted-foreground">
                Always validate permissions server-side, never trust client.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">📝 Audit Logging</h4>
              <p className="text-sm text-muted-foreground">
                Log all access attempts for security compliance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RBACDemo;
