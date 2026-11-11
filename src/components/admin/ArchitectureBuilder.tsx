import React, { useState, useMemo } from "react";
import {
  Users,
  Layout,
  Server,
  ShieldCheck,
  Database,
  HardDrive,
  Cpu,
  Layers,
  ArrowDown,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  RefreshCw,
  Eye,
  Edit3,
  Network,
  GitBranch,
  Radio,
} from "lucide-react";
import { ArchitectureNode, ArchitectureTierType } from "../../types";
import { useSettings } from "../../context/SettingsContext";
import {
  normalizeHex,
  hexToRgb,
  generateShadesFromHex,
  getStoredBrandColor,
  DEFAULT_BRAND_COLOR,
} from "../../utils/brandTheme";
import {
  ArchitectureDiagram,
  REPAIR_SERVICE_MULTI_TIER_PRESET,
} from "../ui/ArchitectureDiagram";
import { Select, SelectOption } from "../ui/Select";

interface ArchitectureBuilderProps {
  initialNodes?: ArchitectureNode[];
  initialNotes?: string;
  onChange: (nodes: ArchitectureNode[], summaryText: string) => void;
}

export const TIER_CONFIG: Record<
  ArchitectureTierType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
  }
> = {
  client: { label: "Clients & UI Layer", icon: Users, badge: "Presentation" },
  gateway: { label: "Gateway & Routing", icon: Layout, badge: "Ingress" },
  auth: {
    label: "Authentication & Guard",
    icon: ShieldCheck,
    badge: "Security",
  },
  service: { label: "Backend & Services", icon: Server, badge: "Compute" },
  database: { label: "Primary Database", icon: Database, badge: "Persistence" },
  storage: {
    label: "Storage & Assets",
    icon: HardDrive,
    badge: "Object Store",
  },
  queue: { label: "Cache & Message Queue", icon: Cpu, badge: "Asynchronous" },
  external: {
    label: "External Services & APIs",
    icon: Network,
    badge: "Integration",
  },
};

const DEFAULT_BRANCHING_PRESET: ArchitectureNode[] = [
  {
    id: "tier-client",
    tier: "client",
    title: "Presentation & UI Application Layer",
    role: "Responsive Web Ingress & Client Application",
    technologies: ["React 19", "TypeScript", "Tailwind CSS", "Vite"],
    flowDescription:
      "Dispatches authenticated client state queries and renders interactive UI components with zero-layout-shift.",
    targetNodeIds: ["tier-gateway"],
  },
  {
    id: "tier-gateway",
    tier: "gateway",
    title: "Application Gateway & Ingress",
    role: "Edge Routing & Static Asset Delivery",
    technologies: ["Vercel Edge", "HTTPS / TLS 1.3", "HTTP Caching"],
    flowDescription:
      "Routes incoming client browser traffic, verifies headers, and branches to parallel security and API services.",
    targetNodeIds: ["tier-auth", "tier-service"],
  },
  {
    id: "tier-auth",
    tier: "auth",
    title: "Identity Verification & RBAC Guard",
    role: "Security Gate & Token Verification",
    technologies: ["Firebase Auth", "RBAC Tokens", "Zero-Trust"],
    flowDescription:
      "Validates administrator credentials and signs JSON Web Tokens for privileged document operations.",
    targetNodeIds: ["tier-database"],
  },
  {
    id: "tier-service",
    tier: "service",
    title: "Core Business API & Cloud Functions",
    role: "Business Logic & Domain Transactions",
    technologies: ["Node.js", "Express", "Cloud Run / Serverless"],
    flowDescription:
      "Coordinates data validation, executes transaction mutations, and delivers high-performance JSON payloads.",
    targetNodeIds: ["tier-database", "tier-storage"],
  },
  {
    id: "tier-database",
    tier: "database",
    title: "Cloud Firestore NoSQL Datastore",
    role: "Real-Time Document Persistence",
    technologies: ["Cloud Firestore", "ABAC Security Rules", "Indexes"],
    flowDescription:
      "Stores atomic collections, profiles, projects, and analytics with strict attribute-based security.",
  },
  {
    id: "tier-storage",
    tier: "storage",
    title: "Assets & Media Storage Bucket",
    role: "Object Storage & High-Speed Media Delivery",
    technologies: ["Firebase Storage", "Cloudinary CDN", "Signed URLs"],
    flowDescription:
      "Serves optimized thumbnails, resume PDFs, and case study media artifacts with low-latency CDN delivery.",
  },
];

const FULLSTACK_MICROSERVICES_PRESET: ArchitectureNode[] = [
  {
    id: "tier-client",
    tier: "client",
    title: "Client Web & Mobile Interface",
    role: "Single Page Experience & Client Cache",
    technologies: ["React 19", "Next.js / Vite", "Tailwind CSS"],
    flowDescription:
      "Provides interactive interfaces for desktop and mobile clients with optimistic updates.",
    targetNodeIds: ["tier-gateway"],
  },
  {
    id: "tier-gateway",
    tier: "gateway",
    title: "API Gateway & Reverse Proxy",
    role: "Ingress Traffic Controller & Rate Limiting",
    technologies: ["Express.js", "CORS Middleware", "NGINX"],
    flowDescription:
      "Terminates SSL, authenticates requests, and routes endpoints to internal microservices.",
    targetNodeIds: ["tier-auth", "tier-service"],
  },
  {
    id: "tier-auth",
    tier: "auth",
    title: "OAuth 2.0 & Token Authority",
    role: "Session Management & Token Validation",
    technologies: ["OAuth2", "JWT", "Argon2"],
    flowDescription:
      "Authenticates user sessions, issues short-lived JWTs, and handles refresh rotations.",
    targetNodeIds: ["tier-database"],
  },
  {
    id: "tier-service",
    tier: "service",
    title: "Application Core Microservices",
    role: "Business Logic & Domain Transactions",
    technologies: ["Node.js", "TypeScript", "REST / GraphQL"],
    flowDescription:
      "Executes domain business workflows, validates payloads, and coordinates data mutations.",
    targetNodeIds: ["tier-database", "tier-queue"],
  },
  {
    id: "tier-database",
    tier: "database",
    title: "Relational Database Engine",
    role: "ACID Transactions & Structured Data",
    technologies: ["PostgreSQL", "Drizzle ORM", "Connection Pool"],
    flowDescription:
      "Maintains normalized relational tables with referential integrity and transactional safety.",
  },
  {
    id: "tier-queue",
    tier: "queue",
    title: "Redis Cache & Event Broker",
    role: "In-Memory Cache & Asynchronous Tasks",
    technologies: ["Redis", "BullMQ", "Pub/Sub"],
    flowDescription:
      "Caches frequent queries and processes background notifications and report generation asynchronously.",
  },
];

const AI_AUGMENTED_PRESET: ArchitectureNode[] = [
  {
    id: "tier-client",
    tier: "client",
    title: "Conversational & Interactive Workspace",
    role: "Real-time Streaming Interface",
    technologies: ["React 19", "Framer Motion", "Tailwind CSS"],
    flowDescription:
      "Streams server-sent generative events and provides interactive controls.",
    targetNodeIds: ["tier-gateway"],
  },
  {
    id: "tier-gateway",
    tier: "gateway",
    title: "AI Gateway & Rate Limiter",
    role: "Token Bucket & Request Throttling",
    technologies: ["Cloudflare / Express", "Rate Limiter"],
    flowDescription:
      "Monitors user quota, prevents model abuse, and routes queries.",
    targetNodeIds: ["tier-service"],
  },
  {
    id: "tier-service",
    tier: "service",
    title: "AI Orchestration & Prompt Pipeline",
    role: "Model Context Protocol & Generation Proxy",
    technologies: ["Google GenAI SDK", "Gemini 2.5 Flash", "Node.js"],
    flowDescription:
      "Structures system instructions, handles tool calling, and mediates between user and LLM.",
    targetNodeIds: ["tier-database"],
  },
  {
    id: "tier-database",
    tier: "database",
    title: "Vector Knowledge Store & Database",
    role: "Embeddings & Persistent Context",
    technologies: ["Cloud Firestore / pgvector", "Cosine Similarity"],
    flowDescription:
      "Stores knowledge fragments, system prompt snapshots, and conversational memory.",
  },
];

export const ArchitectureBuilder: React.FC<ArchitectureBuilderProps> = ({
  initialNodes,
  initialNotes,
  onChange,
}) => {
  const { settings } = useSettings();
  const brandColor = normalizeHex(
    settings?.brandColor ||
      settings?.primaryColor ||
      getStoredBrandColor() ||
      DEFAULT_BRAND_COLOR,
  );
  const brandRgb = useMemo(() => hexToRgb(brandColor), [brandColor]);
  const brandShades = useMemo(
    () => generateShadesFromHex(brandColor),
    [brandColor],
  );

  // Parse initial state safely
  const [nodes, setNodes] = useState<ArchitectureNode[]>(() => {
    if (
      initialNodes &&
      Array.isArray(initialNodes) &&
      initialNodes.length > 0
    ) {
      return initialNodes;
    }
    if (initialNotes && initialNotes.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(initialNotes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fall back below
      }
    }
    return DEFAULT_BRANCHING_PRESET;
  });

  const [activeTab, setActiveTab] = useState<"builder" | "preview">("builder");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Custom Select Dropdown Options with Icons and Badges
  const tierOptions: SelectOption[] = useMemo(() => {
    return Object.entries(TIER_CONFIG).map(([key, item]) => ({
      value: key,
      label: item.label,
      badge: item.badge,
      icon: item.icon,
    }));
  }, []);

  const levelOptions: SelectOption[] = useMemo(
    () => [
      { value: "-1", label: "Auto (DAG Inferred)", badge: "Automatic" },
      {
        value: "0",
        label: "Level 01 (Root Ingress)",
        badge: "L1",
        description: "Touchpoint for client & staff portals",
      },
      {
        value: "1",
        label: "Level 02 (Application / Gateway)",
        badge: "L2",
        description: "Edge routing & PWA client shell",
      },
      {
        value: "2",
        label: "Level 03 (Core Services)",
        badge: "L3",
        description: "Domain features & operational modules",
      },
      {
        value: "3",
        label: "Level 04 (Sub-Services & Servers)",
        badge: "L4",
        description: "Backend servers & API wrappers",
      },
      {
        value: "4",
        label: "Level 05 (Datastores & Third-Party)",
        badge: "L5",
        description: "Databases, AI models & payments",
      },
      {
        value: "5",
        label: "Level 06 (Downstream Workers)",
        badge: "L6",
        description: "Async queues & background sync",
      },
    ],
    [],
  );

  // Sync with parent when nodes change
  const notifyChange = (updatedNodes: ArchitectureNode[]) => {
    setNodes(updatedNodes);
    // Generate a high-level summary string as well for backwards compatibility
    const summary = updatedNodes
      .map((n) => `${n.title} (${n.technologies.slice(0, 2).join(", ")})`)
      .join(" ➔ ");
    onChange(updatedNodes, summary);
  };

  const handleAddTier = (tier: ArchitectureTierType) => {
    const config = TIER_CONFIG[tier];
    const newNode: ArchitectureNode = {
      id: `tier-${Date.now()}`,
      tier,
      title: `New ${config.badge} Layer`,
      role: `Custom ${config.badge} Service`,
      technologies: ["TypeScript", "Cloud"],
      flowDescription: "Handles data ingress and inter-service transmission.",
    };
    const updated = [...nodes, newNode];
    setEditingNodeId(newNode.id);
    notifyChange(updated);
  };

  const handleUpdateNode = (id: string, updates: Partial<ArchitectureNode>) => {
    const updated = nodes.map((node) =>
      node.id === id ? { ...node, ...updates } : node,
    );
    notifyChange(updated);
  };

  const handleDeleteNode = (id: string) => {
    const updated = nodes.filter((node) => node.id !== id);
    notifyChange(updated);
  };

  const handleMoveNode = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === nodes.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...nodes];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    notifyChange(updated);
  };

  const handleApplyPreset = (preset: ArchitectureNode[]) => {
    notifyChange(preset);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 md:p-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="p-1.5 rounded-lg border shadow-xs"
              style={{
                backgroundColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.12)`,
                borderColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.25)`,
                color: brandColor,
              }}
            >
              <GitBranch className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              System Architecture Flowchart Builder
            </h4>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Design parallel branching paths, assign tech stacks, and verify
            dynamic running gradient connectors.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "builder"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Builder ({nodes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "preview"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Flowchart Preview</span>
          </button>
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Presets:
        </span>
        <button
          type="button"
          onClick={() => handleApplyPreset(REPAIR_SERVICE_MULTI_TIER_PRESET)}
          className="text-xs px-2.5 py-1 rounded-lg border font-semibold transition-colors"
          style={{
            borderColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.35)`,
            backgroundColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.08)`,
            color: brandColor,
          }}
        >
          Repair & Service Platform (5-Tier Tree)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(DEFAULT_BRANCHING_PRESET)}
          className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          Branching Serverless
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(FULLSTACK_MICROSERVICES_PRESET)}
          className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          Microservices & Gateway
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset(AI_AUGMENTED_PRESET)}
          className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          AI Pipeline & Vector Store
        </button>
      </div>

      {activeTab === "builder" ? (
        <div className="space-y-3">
          {nodes.map((node, index) => {
            const config = TIER_CONFIG[node.tier] || TIER_CONFIG.service;
            const IconComponent = config.icon;
            const isEditing = editingNodeId === node.id;

            return (
              <div
                key={node.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-3 transition-all"
              >
                {/* Node Summary Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="p-1.5 rounded-lg border shrink-0"
                      style={{
                        backgroundColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.1)`,
                        borderColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.25)`,
                        color: brandColor,
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {node.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {config.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        {node.role} · {node.technologies.join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveNode(index, "up")}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 text-zinc-600 dark:text-zinc-400"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveNode(index, "down")}
                      disabled={index === nodes.length - 1}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 text-zinc-600 dark:text-zinc-400"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingNodeId(isEditing ? null : node.id)
                      }
                      className="px-2 py-1 text-xs font-medium rounded-lg bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
                    >
                      {isEditing ? "Close" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNode(node.id)}
                      className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      title="Delete Tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Edit Form */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                          Tier Classification
                        </label>
                        <Select
                          sizeVariant="sm"
                          value={node.tier}
                          onChange={(e) =>
                            handleUpdateNode(node.id, {
                              tier: e.target.value as ArchitectureTierType,
                            })
                          }
                          options={tierOptions}
                          placeholder="Select tier..."
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                          Layer Title
                        </label>
                        <input
                          type="text"
                          value={node.title}
                          onChange={(e) =>
                            handleUpdateNode(node.id, { title: e.target.value })
                          }
                          placeholder="e.g. Presentation & UI Application Layer"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                          System Role
                        </label>
                        <input
                          type="text"
                          value={node.role}
                          onChange={(e) =>
                            handleUpdateNode(node.id, { role: e.target.value })
                          }
                          placeholder="e.g. Edge Ingress & User Interaction"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                          Technologies Used (Comma Separated)
                        </label>
                        <input
                          type="text"
                          value={node.technologies.join(", ")}
                          onChange={(e) =>
                            handleUpdateNode(node.id, {
                              technologies: e.target.value
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="React 19, TypeScript, Tailwind"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                          Hierarchy Level Depth
                        </label>
                        <Select
                          sizeVariant="sm"
                          value={String(
                            typeof node.level === "number" ? node.level : -1,
                          )}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            handleUpdateNode(node.id, {
                              level: val >= 0 ? val : undefined,
                            });
                          }}
                          options={levelOptions}
                          placeholder="Select level depth..."
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                          Data Flow Narrative & Protocols
                        </label>
                        <input
                          type="text"
                          value={node.flowDescription}
                          onChange={(e) =>
                            handleUpdateNode(node.id, {
                              flowDescription: e.target.value,
                            })
                          }
                          placeholder="Describes data transactions, protocols, and security guardrails..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    {/* Downstream Connections Selector */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                        Branches Downstream To:
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
                        {nodes
                          .filter((n) => n.id !== node.id)
                          .map((target) => {
                            const isConnected = node.targetNodeIds?.includes(
                              target.id,
                            );
                            return (
                              <button
                                key={target.id}
                                type="button"
                                onClick={() => {
                                  const currentTargets =
                                    node.targetNodeIds || [];
                                  const nextTargets = isConnected
                                    ? currentTargets.filter(
                                        (id) => id !== target.id,
                                      )
                                    : [...currentTargets, target.id];
                                  handleUpdateNode(node.id, {
                                    targetNodeIds: nextTargets,
                                  });
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
                                  isConnected
                                    ? "bg-white dark:bg-zinc-700 font-bold shadow-xs"
                                    : "opacity-60 hover:opacity-100 bg-transparent text-zinc-600 dark:text-zinc-400"
                                }`}
                                style={{
                                  borderColor: isConnected
                                    ? brandColor
                                    : undefined,
                                  color: isConnected ? brandColor : undefined,
                                }}
                              >
                                <span>{isConnected ? "✓" : "+"}</span>
                                <span className="truncate max-w-40">
                                  {target.title}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Tier Buttons */}
          <div className="pt-2">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Add Architecture Tier:
            </span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TIER_CONFIG).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleAddTier(key as ArchitectureTierType)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" style={{ color: brandColor }} />
                  <span>{item.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Live Flowchart Preview using the actual multi-tier DAG engine */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Live Flowchart Preview</span>
            <span
              className="flex items-center gap-1 text-[11px]"
              style={{ color: brandColor }}
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Full Multi-Tier DAG Engine</span>
            </span>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <ArchitectureDiagram nodes={nodes} />
          </div>
        </div>
      )}
    </div>
  );
};
