import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Play, Database, Zap, AlertTriangle, CheckCircle, ArrowRight, Layers } from "lucide-react";

interface QueryStep {
  resolver: string;
  field: string;
  dbCalls: number;
  cached: boolean;
  time: number;
}

const GraphQLDemo = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [querySteps, setQuerySteps] = useState<QueryStep[]>([]);
  const [useDataLoader, setUseDataLoader] = useState(false);
  const [totalDbCalls, setTotalDbCalls] = useState(0);
  const [activeTab, setActiveTab] = useState("query");

  const schema = `type Query {
  users: [User!]!
  user(id: ID!): User
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  author: User!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  text: String!
  author: User!
}`;

  const sampleQuery = `query GetUsersWithPosts {
  users {
    id
    name
    posts {
      id
      title
      comments {
        id
        text
        author {
          name
        }
      }
    }
  }
}`;

  const mockUsers = [
    { id: "1", name: "Alice", email: "alice@example.com" },
    { id: "2", name: "Bob", email: "bob@example.com" },
    { id: "3", name: "Charlie", email: "charlie@example.com" },
  ];

  const executeQuery = async () => {
    setIsExecuting(true);
    setQuerySteps([]);
    setTotalDbCalls(0);
    
    let dbCalls = 0;
    const steps: QueryStep[] = [];

    // Step 1: Resolve users
    await addStep(steps, { resolver: "Query.users", field: "users", dbCalls: 1, cached: false, time: 50 });
    dbCalls += 1;

    if (useDataLoader) {
      // With DataLoader - batched calls
      await addStep(steps, { resolver: "User.posts (batched)", field: "posts", dbCalls: 1, cached: false, time: 30 });
      dbCalls += 1;
      
      await addStep(steps, { resolver: "Post.comments (batched)", field: "comments", dbCalls: 1, cached: false, time: 25 });
      dbCalls += 1;
      
      await addStep(steps, { resolver: "Comment.author (batched + cached)", field: "author", dbCalls: 1, cached: true, time: 5 });
      dbCalls += 1;
    } else {
      // N+1 problem - individual calls
      for (const user of mockUsers) {
        await addStep(steps, { resolver: `User.posts (${user.name})`, field: "posts", dbCalls: 1, cached: false, time: 45 });
        dbCalls += 1;
      }
      
      // Simulating comments for each post (N+1 within N+1)
      for (let i = 0; i < 6; i++) {
        await addStep(steps, { resolver: `Post.comments (post-${i + 1})`, field: "comments", dbCalls: 1, cached: false, time: 40 });
        dbCalls += 1;
      }
      
      // Author for each comment
      for (let i = 0; i < 12; i++) {
        await addStep(steps, { resolver: `Comment.author (comment-${i + 1})`, field: "author", dbCalls: 1, cached: false, time: 35 });
        dbCalls += 1;
      }
    }

    setTotalDbCalls(dbCalls);
    setIsExecuting(false);
  };

  const addStep = async (steps: QueryStep[], step: QueryStep) => {
    await new Promise(resolve => setTimeout(resolve, 150));
    steps.push(step);
    setQuerySteps([...steps]);
  };

  const introspectionResult = {
    types: [
      { name: "Query", kind: "OBJECT", fields: ["users", "user"] },
      { name: "User", kind: "OBJECT", fields: ["id", "name", "email", "posts"] },
      { name: "Post", kind: "OBJECT", fields: ["id", "title", "author", "comments"] },
      { name: "Comment", kind: "OBJECT", fields: ["id", "text", "author"] },
      { name: "ID", kind: "SCALAR", fields: [] },
      { name: "String", kind: "SCALAR", fields: [] },
    ]
  };

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-500/10 rounded-lg">
                <Code className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  GraphQL API
                  <Badge variant="outline" className="ml-2">Query Language</Badge>
                </CardTitle>
                <CardDescription>
                  Query resolution, schema introspection, and N+1 problem solutions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="query">Query Execution</TabsTrigger>
                <TabsTrigger value="schema">Schema Introspection</TabsTrigger>
                <TabsTrigger value="n1">N+1 Problem</TabsTrigger>
              </TabsList>

              <TabsContent value="query" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Query Editor */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      GraphQL Query
                    </h4>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto">
                      <pre>{sampleQuery}</pre>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={executeQuery} disabled={isExecuting}>
                        <Play className="w-4 h-4 mr-1" />
                        Execute Query
                      </Button>
                      <Button
                        variant={useDataLoader ? "default" : "outline"}
                        onClick={() => setUseDataLoader(!useDataLoader)}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        {useDataLoader ? "DataLoader ON" : "DataLoader OFF"}
                      </Button>
                    </div>
                  </div>

                  {/* Resolution Steps */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Resolver Execution
                      {totalDbCalls > 0 && (
                        <Badge variant={totalDbCalls > 10 ? "destructive" : "default"} className="ml-auto">
                          {totalDbCalls} DB calls
                        </Badge>
                      )}
                    </h4>
                    <ScrollArea className="h-64 border rounded-lg p-3">
                      {querySteps.length === 0 ? (
                        <div className="text-muted-foreground text-sm text-center py-8">
                          Execute a query to see resolver steps
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {querySteps.map((step, idx) => (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg border text-sm flex items-center gap-2 ${
                                step.cached ? "bg-green-500/10 border-green-500/30" : "bg-muted/50"
                              }`}
                            >
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-mono">
                                {idx + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-mono text-xs">{step.resolver}</div>
                              </div>
                              {step.cached && (
                                <Badge variant="outline" className="text-xs bg-green-500/20">cached</Badge>
                              )}
                              <span className="text-xs text-muted-foreground">{step.time}ms</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schema" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Schema Definition */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Schema Definition (SDL)</h4>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-cyan-400 overflow-x-auto">
                      <pre>{schema}</pre>
                    </div>
                  </div>

                  {/* Introspection Result */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      __schema Introspection
                    </h4>
                    <div className="space-y-2">
                      {introspectionResult.types.map((type) => (
                        <div key={type.name} className="p-3 bg-card border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={type.kind === "SCALAR" ? "secondary" : "default"}>
                              {type.kind}
                            </Badge>
                            <span className="font-mono font-semibold">{type.name}</span>
                          </div>
                          {type.fields.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {type.fields.map((field) => (
                                <span key={field} className="text-xs px-2 py-1 bg-muted rounded font-mono">
                                  {field}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-xs">
                      <strong>Introspection</strong> allows clients to query the schema itself, 
                      enabling tools like GraphQL Playground to auto-generate documentation.
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="n1" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* N+1 Problem */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <h4 className="font-semibold">The N+1 Problem</h4>
                    </div>
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg space-y-3">
                      <p className="text-sm">
                        When fetching a list of N items and their related data, naive resolvers make:
                      </p>
                      <div className="font-mono text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          <span>1 query for users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          <span>N queries for posts (one per user)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          <span>N×M queries for comments</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          <span>N×M×K queries for authors</span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-orange-500 text-center py-2">
                        = 1 + 3 + 6 + 12 = 22 DB calls! 😱
                      </div>
                    </div>
                  </div>

                  {/* Solution: DataLoader */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h4 className="font-semibold">Solution: DataLoader</h4>
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg space-y-3">
                      <p className="text-sm">
                        DataLoader batches and caches database requests within a single request:
                      </p>
                      <div className="font-mono text-sm space-y-1">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-500" />
                          <span>1 query: SELECT * FROM users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-500" />
                          <span>1 query: SELECT * FROM posts WHERE user_id IN (...)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-500" />
                          <span>1 query: SELECT * FROM comments WHERE post_id IN (...)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-green-500" />
                          <span>1 query: SELECT * FROM users WHERE id IN (...) [cached!]</span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-500 text-center py-2">
                        = 4 DB calls! ✨
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 rounded-lg p-3 font-mono text-xs text-green-400">
                      <div className="text-gray-500 mb-1">// DataLoader example</div>
                      <pre>{`const userLoader = new DataLoader(
  async (ids) => {
    const users = await db.users
      .whereIn('id', ids);
    return ids.map(id => 
      users.find(u => u.id === id)
    );
  }
);`}</pre>
                    </div>
                  </div>
                </div>

                {/* Interactive comparison */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Try it yourself!</h4>
                    <Button
                      variant={useDataLoader ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setUseDataLoader(!useDataLoader);
                        setQuerySteps([]);
                        setTotalDbCalls(0);
                      }}
                    >
                      {useDataLoader ? "Disable DataLoader" : "Enable DataLoader"}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Go to the "Query Execution" tab and run the query with DataLoader 
                    {useDataLoader ? " disabled" : " enabled"} to see the difference.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default GraphQLDemo;
