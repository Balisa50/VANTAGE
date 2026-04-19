/**
 * Curated list of roadmap.sh learning paths.
 * When a user picks one of these, the AI generates tasks that follow
 * roadmap.sh's exact curriculum for that path.
 */

export interface RoadmapShPath {
  id: string;
  title: string;
  slug: string;     // roadmap.sh URL slug
  category: string;
  emoji: string;
  description: string;
  estimatedWeeks: number;
}

export const ROADMAPSH_CATEGORIES = [
  "Frontend",
  "Backend",
  "Full Stack",
  "DevOps & Cloud",
  "Mobile",
  "Data & AI",
  "Computer Science",
  "Speciality",
] as const;

export const ROADMAPSH_PATHS: RoadmapShPath[] = [
  // ── Frontend ───────────────────────────────────────────────────────────────
  { id: "frontend",    title: "Frontend Developer",    slug: "frontend",    category: "Frontend",     emoji: "🌐", description: "HTML, CSS, JS, React — the full modern frontend path",         estimatedWeeks: 20 },
  { id: "react",       title: "React",                 slug: "react",       category: "Frontend",     emoji: "⚛️", description: "Components, hooks, state, routing, testing, patterns",          estimatedWeeks: 12 },
  { id: "vue",         title: "Vue.js",                slug: "vue",         category: "Frontend",     emoji: "💚", description: "Vue 3, Composition API, Pinia, Nuxt, testing",                  estimatedWeeks: 10 },
  { id: "angular",     title: "Angular",               slug: "angular",     category: "Frontend",     emoji: "🔴", description: "TypeScript-first framework, modules, RxJS, signals",            estimatedWeeks: 12 },
  { id: "javascript",  title: "JavaScript",            slug: "javascript",  category: "Frontend",     emoji: "🟡", description: "Fundamentals through advanced JS — closures, async, modules",   estimatedWeeks: 10 },
  { id: "typescript",  title: "TypeScript",            slug: "typescript",  category: "Frontend",     emoji: "🔷", description: "Types, generics, utility types, decorators, strict mode",       estimatedWeeks: 6  },

  // ── Backend ────────────────────────────────────────────────────────────────
  { id: "backend",     title: "Backend Developer",     slug: "backend",     category: "Backend",      emoji: "⚙️", description: "APIs, databases, auth, caching, scaling — full backend path",   estimatedWeeks: 20 },
  { id: "nodejs",      title: "Node.js",               slug: "nodejs",      category: "Backend",      emoji: "🟢", description: "Core Node, Express, Fastify, testing, deployment",             estimatedWeeks: 10 },
  { id: "python",      title: "Python",                slug: "python",      category: "Backend",      emoji: "🐍", description: "Python fundamentals through advanced — Django, FastAPI, async", estimatedWeeks: 14 },
  { id: "java",        title: "Java",                  slug: "java",        category: "Backend",      emoji: "☕", description: "OOP, Spring Boot, JVM, concurrency, microservices",             estimatedWeeks: 20 },
  { id: "golang",      title: "Go (Golang)",           slug: "golang",      category: "Backend",      emoji: "🐹", description: "Go fundamentals, concurrency, APIs, testing, modules",          estimatedWeeks: 10 },
  { id: "rust",        title: "Rust",                  slug: "rust",        category: "Backend",      emoji: "🦀", description: "Ownership, lifetimes, async, CLI tools, web servers",           estimatedWeeks: 16 },
  { id: "php",         title: "PHP",                   slug: "php",         category: "Backend",      emoji: "🐘", description: "Modern PHP, Laravel, Composer, REST APIs, databases",           estimatedWeeks: 12 },

  // ── Full Stack ─────────────────────────────────────────────────────────────
  { id: "fullstack",   title: "Full Stack Developer",  slug: "full-stack",  category: "Full Stack",   emoji: "🔥", description: "End-to-end: React + Node/Python + databases + deployment",      estimatedWeeks: 28 },

  // ── DevOps & Cloud ─────────────────────────────────────────────────────────
  { id: "devops",      title: "DevOps",                slug: "devops",      category: "DevOps & Cloud", emoji: "🚀", description: "CI/CD, containers, IaC, monitoring, SRE practices",           estimatedWeeks: 20 },
  { id: "docker",      title: "Docker",                slug: "docker",      category: "DevOps & Cloud", emoji: "🐳", description: "Images, containers, volumes, networking, Compose, security",  estimatedWeeks: 6  },
  { id: "kubernetes",  title: "Kubernetes",            slug: "kubernetes",  category: "DevOps & Cloud", emoji: "☸️", description: "Pods, deployments, services, ingress, Helm, operators",      estimatedWeeks: 10 },
  { id: "aws",         title: "AWS",                   slug: "aws",         category: "DevOps & Cloud", emoji: "☁️", description: "Core AWS services, architecture, IAM, serverless, costs",    estimatedWeeks: 14 },
  { id: "terraform",   title: "Terraform",             slug: "terraform",   category: "DevOps & Cloud", emoji: "🏗️", description: "IaC, state, modules, providers, best practices",            estimatedWeeks: 6  },
  { id: "linux",       title: "Linux",                 slug: "linux",       category: "DevOps & Cloud", emoji: "🐧", description: "Shell, file system, processes, networking, scripting",       estimatedWeeks: 8  },

  // ── Mobile ─────────────────────────────────────────────────────────────────
  { id: "android",       title: "Android",               slug: "android",       category: "Mobile",     emoji: "📱", description: "Kotlin, Jetpack Compose, architecture, testing, publishing", estimatedWeeks: 16 },
  { id: "react-native",  title: "React Native",          slug: "react-native",  category: "Mobile",     emoji: "📲", description: "Cross-platform mobile with React — navigation, native APIs", estimatedWeeks: 12 },
  { id: "flutter",       title: "Flutter",               slug: "flutter",       category: "Mobile",     emoji: "🦋", description: "Dart, widgets, state management, platform integration",       estimatedWeeks: 14 },

  // ── Data & AI ──────────────────────────────────────────────────────────────
  { id: "postgresql",  title: "PostgreSQL",            slug: "postgresql",  category: "Data & AI",    emoji: "🐘", description: "SQL, indexing, query optimisation, replication, extensions", estimatedWeeks: 8  },
  { id: "mongodb",     title: "MongoDB",               slug: "mongodb",     category: "Data & AI",    emoji: "🍃", description: "Documents, aggregation, indexing, Atlas, change streams",    estimatedWeeks: 6  },
  { id: "redis",       title: "Redis",                 slug: "redis",       category: "Data & AI",    emoji: "🔴", description: "Data structures, caching, pub/sub, streams, clustering",     estimatedWeeks: 5  },
  { id: "sql",         title: "SQL",                   slug: "sql",         category: "Data & AI",    emoji: "🗄️", description: "Queries, joins, indexes, transactions, query planning",      estimatedWeeks: 6  },
  { id: "graphql",     title: "GraphQL",               slug: "graphql",     category: "Data & AI",    emoji: "◈",  description: "Schema, queries, mutations, subscriptions, Apollo",          estimatedWeeks: 5  },
  { id: "ai-data-scientist", title: "AI & Data Scientist", slug: "ai-data-scientist", category: "Data & AI", emoji: "🤖", description: "Python, ML, deep learning, NLP, LLMs, deployment",  estimatedWeeks: 24 },
  { id: "mlops",       title: "MLOps",                 slug: "mlops",       category: "Data & AI",    emoji: "⚗️", description: "Model training pipelines, serving, monitoring, drift",      estimatedWeeks: 12 },

  // ── Computer Science ───────────────────────────────────────────────────────
  { id: "computer-science", title: "Computer Science", slug: "computer-science", category: "Computer Science", emoji: "🧠", description: "DSA, OS, networking, compilers, databases from first principles", estimatedWeeks: 30 },
  { id: "system-design",    title: "System Design",   slug: "system-design",    category: "Computer Science", emoji: "🏛️", description: "Scalability, distributed systems, CAP, load balancing, caching",  estimatedWeeks: 10 },
  { id: "dsa",               title: "Data Structures & Algorithms", slug: "datastructures-and-algorithms", category: "Computer Science", emoji: "📊", description: "Arrays to graphs — interview-ready DSA mastery", estimatedWeeks: 12 },
  { id: "git-github",       title: "Git & GitHub",    slug: "git-github",       category: "Computer Science", emoji: "🌿", description: "Branching, merging, rebasing, PRs, Actions, workflows",     estimatedWeeks: 3  },

  // ── Speciality ─────────────────────────────────────────────────────────────
  { id: "cyber-security", title: "Cyber Security",   slug: "cyber-security",   category: "Speciality",  emoji: "🔐", description: "Threats, cryptography, web security, pentesting, hardening", estimatedWeeks: 20 },
  { id: "blockchain",     title: "Blockchain",       slug: "blockchain",       category: "Speciality",  emoji: "⛓️", description: "Fundamentals, Solidity, smart contracts, DeFi, Web3",       estimatedWeeks: 14 },
  { id: "api-design",     title: "API Design",       slug: "api-design",       category: "Speciality",  emoji: "🔌", description: "REST, GraphQL, gRPC — design patterns, versioning, security", estimatedWeeks: 5  },
  { id: "software-architect", title: "Software Architecture", slug: "software-architect", category: "Speciality", emoji: "🏗️", description: "Patterns, clean arch, DDD, CQRS, microservices strategy", estimatedWeeks: 12 },
  { id: "ux-design",      title: "UX Design",        slug: "ux-design",        category: "Speciality",  emoji: "🎨", description: "Research, wireframes, prototyping, testing, accessibility",   estimatedWeeks: 10 },
  { id: "product-manager", title: "Product Manager", slug: "product-manager",  category: "Speciality",  emoji: "📋", description: "Strategy, roadmapping, metrics, user research, delivery",    estimatedWeeks: 10 },
];

export function getPathById(id: string): RoadmapShPath | undefined {
  return ROADMAPSH_PATHS.find((p) => p.id === id);
}

export function getPathsByCategory(): Record<string, RoadmapShPath[]> {
  const result: Record<string, RoadmapShPath[]> = {};
  for (const cat of ROADMAPSH_CATEGORIES) result[cat] = [];
  for (const path of ROADMAPSH_PATHS) {
    if (!result[path.category]) result[path.category] = [];
    result[path.category].push(path);
  }
  return result;
}
