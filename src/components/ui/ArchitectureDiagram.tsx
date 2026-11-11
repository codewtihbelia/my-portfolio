import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Users,
  Layout,
  Server,
  ShieldCheck,
  Database,
  HardDrive,
  Cpu,
  Network,
  ArrowDown,
  Info,
  Layers,
  Sparkles,
  Activity,
  GitBranch,
  CheckCircle2,
  Lock,
  Radio,
  ExternalLink,
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

interface ArchitectureDiagramProps {
  customNotes?: string;
  nodes?: ArchitectureNode[];
  projectTitle?: string;
}

export const TIER_META: Record<
  ArchitectureTierType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: string;
  }
> = {
  client: { label: "Client Ingress", icon: Users, badge: "Presentation" },
  gateway: { label: "Edge & Ingress Gateway", icon: Layout, badge: "Gateway" },
  auth: {
    label: "Authentication & Security",
    icon: ShieldCheck,
    badge: "Guard",
  },
  service: { label: "Application Services", icon: Server, badge: "Compute" },
  database: {
    label: "Primary Datastore",
    icon: Database,
    badge: "Persistence",
  },
  storage: {
    label: "Storage & Assets",
    icon: HardDrive,
    badge: "Object Store",
  },
  queue: { label: "Event Queue & Cache", icon: Cpu, badge: "Asynchronous" },
  external: { label: "Third-Party Services", icon: Network, badge: "External" },
};

export const REPAIR_SERVICE_MULTI_TIER_PRESET: ArchitectureNode[] = [
  {
    id: "node-client-staff",
    tier: "client",
    level: 0,
    title: "Clients and Repair Staff",
    role: "Customers, Technicians, Admins",
    technologies: ["Customer Portal", "Staff App", "Admin Ingress"],
    flowDescription:
      "Primary end-user touchpoints allowing customers to book repairs and technicians to track workflows.",
    targetNodeIds: ["node-webapp-pwa"],
  },
  {
    id: "node-webapp-pwa",
    tier: "gateway",
    level: 1,
    title: "Web App and PWA",
    role: "Responsive Single Page & Progressive Web App",
    technologies: ["React 19", "TypeScript", "Vite", "Tailwind CSS"],
    flowDescription:
      "Core client application serving offline-ready PWA interfaces, handling local state, and routing authenticated requests.",
    targetNodeIds: ["node-repair-service-app", "node-auth-access-control"],
  },
  {
    id: "node-repair-service-app",
    tier: "service",
    level: 2,
    title: "Repair Service App",
    role: "Core Business Modules & Operational Logic",
    technologies: [
      "Booking",
      "Repair Tracking",
      "Dashboard",
      "Inventory",
      "Messaging",
    ],
    flowDescription:
      "Coordinates domain features including repair ticket lifecycles, real-time tracking, inventory balances, and staff messaging.",
    targetNodeIds: ["node-firebase-service-layer", "node-app-server"],
  },
  {
    id: "node-auth-access-control",
    tier: "auth",
    level: 2,
    title: "Authentication and Access Control",
    role: "Identity Verification & Role-Based Route Guards",
    technologies: ["Firebase Auth", "Role-Based", "Route Guards"],
    flowDescription:
      "Enforces security policies, granular role-based route permissions, and validates customer versus technician sessions.",
    targetNodeIds: ["node-firebase-auth"],
  },
  {
    id: "node-firebase-service-layer",
    tier: "service",
    level: 3,
    title: "Firebase Service Layer",
    role: "Firebase API Wrappers & Reactive Sync",
    technologies: [
      "Firebase API Wrappers",
      "Reactive SDK",
      "Snapshot Listeners",
    ],
    flowDescription:
      "Abstracts Firebase SDK calls, synchronizes reactive data streams, and handles optimistic client cache updates.",
    targetNodeIds: ["node-cloud-firestore"],
  },
  {
    id: "node-app-server",
    tier: "service",
    level: 3,
    title: "Application Server",
    role: "Domain Backend & Integration Broker",
    technologies: ["Node.js", "Express", "TypeScript"],
    flowDescription:
      "Processes secure server-side domain business logic, handles webhooks, and orchestrates external API integrations.",
    targetNodeIds: ["node-ai-support-integration", "node-payment-integration"],
  },
  {
    id: "node-firebase-auth",
    tier: "auth",
    level: 3,
    title: "Firebase Authentication",
    role: "Secure Identity Store & Token Authority",
    technologies: ["OAuth 2.0", "JWT Tokens", "Secure Cookies"],
    flowDescription:
      "Authoritative identity store maintaining encrypted user credentials, passwordless links, and claims.",
    targetNodeIds: [],
  },
  {
    id: "node-cloud-firestore",
    tier: "database",
    level: 4,
    title: "Cloud Firestore",
    role: "Atomic Collections & Document Persistence",
    technologies: [
      "Repairs",
      "Users",
      "Inventory",
      "Branches",
      "Organizations",
      "Messages",
    ],
    flowDescription:
      "NoSQL datastore persisting real-time collections for repairs, inventories, branch data, and message histories.",
    targetNodeIds: [],
  },
  {
    id: "node-ai-support-integration",
    tier: "external",
    level: 4,
    title: "AI Support Integration",
    role: "Intelligent Diagnostics & Automated Assistant",
    technologies: ["Google Gemini", "OpenAI", "Groq", "DeepSeek"],
    flowDescription:
      "Powers AI diagnosis assistants, automated ticket triage, repair estimate suggestions, and conversational support.",
    targetNodeIds: [],
  },
  {
    id: "node-payment-integration",
    tier: "external",
    level: 4,
    title: "Payment Integration",
    role: "Checkout & Financial Transaction Processing",
    technologies: [
      "PayMongo Checkout",
      "Credit Cards",
      "E-Wallets",
      "Webhooks",
    ],
    flowDescription:
      "Processes invoice settlements, repair deposits, and automated payment status callbacks via PayMongo.",
    targetNodeIds: [],
  },
];

export const DEFAULT_FLOWCHART_NODES: ArchitectureNode[] = [
  {
    id: "node-client",
    tier: "client",
    level: 0,
    title: "Clients & End Users",
    role: "Desktop & Mobile Browser Ingress",
    technologies: ["React 19", "TypeScript", "Tailwind CSS", "Vite"],
    flowDescription:
      "Initializes Single Page Application shell, authenticates user sessions, and renders UI components.",
    targetNodeIds: ["node-gateway"],
  },
  {
    id: "node-gateway",
    tier: "gateway",
    level: 1,
    title: "Edge Gateway & Reverse Proxy",
    role: "TLS 1.3 Termination & Traffic Routing",
    technologies: ["Vercel Edge", "HTTP/2", "CDN Ingress"],
    flowDescription:
      "Routes incoming client browser traffic, verifies headers, and balances requests to application services.",
    targetNodeIds: ["node-auth", "node-service"],
  },
  {
    id: "node-auth",
    tier: "auth",
    level: 2,
    title: "Authentication & Security Guard",
    role: "Role-Based Access Control (RBAC)",
    technologies: ["Firebase Auth", "JWT Claims", "Zero-Trust"],
    flowDescription:
      "Validates administrator credentials, signs session tokens, and guards mutating collections.",
    targetNodeIds: ["node-database"],
  },
  {
    id: "node-service",
    tier: "service",
    level: 2,
    title: "Core Business API & Functions",
    role: "Domain Transactions & API Logic",
    technologies: ["Node.js", "TypeScript", "REST / Cloud Functions"],
    flowDescription:
      "Executes domain business workflows, validates payloads, and coordinates data mutations.",
    targetNodeIds: ["node-database", "node-storage"],
  },
  {
    id: "node-database",
    tier: "database",
    level: 3,
    title: "Cloud Firestore NoSQL Datastore",
    role: "Atomic Real-Time Collections",
    technologies: ["Cloud Firestore", "ABAC Rules", "Compound Indexes"],
    flowDescription:
      "Maintains live reactive snapshots for projects, blog posts, messages, and settings with sub-100ms reads.",
    targetNodeIds: [],
  },
  {
    id: "node-storage",
    tier: "storage",
    level: 3,
    title: "Object Storage & Media Bucket",
    role: "High-Throughput Asset Delivery",
    technologies: ["Firebase Storage", "Cloudinary CDN", "Signed URLs"],
    flowDescription:
      "Delivers project cover images, downloadable PDF resumes, and client case study media.",
    targetNodeIds: [],
  },
];

export const ArchitectureDiagram: React.FC<ArchitectureDiagramProps> = ({
  customNotes,
  nodes: propNodes,
  projectTitle,
}) => {
  const { settings } = useSettings();

  // Dynamic brand color derived from Admin Site Settings
  const brandColor = normalizeHex(
    settings?.brandColor ||
      settings?.primaryColor ||
      getStoredBrandColor() ||
      DEFAULT_BRAND_COLOR,
  );
  const brandShades = useMemo(
    () => generateShadesFromHex(brandColor),
    [brandColor],
  );
  const brandRgb = useMemo(() => hexToRgb(brandColor), [brandColor]);

  // Resolve nodes either from props or parsed JSON customNotes
  const resolvedNodes = useMemo<ArchitectureNode[]>(() => {
    if (propNodes && Array.isArray(propNodes) && propNodes.length > 0) {
      return propNodes;
    }
    if (
      customNotes &&
      typeof customNotes === "string" &&
      customNotes.trim().startsWith("[")
    ) {
      try {
        const parsed = JSON.parse(customNotes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Fall back below
      }
    }
    return DEFAULT_FLOWCHART_NODES;
  }, [propNodes, customNotes]);

  // Dynamic N-level DAG grouping engine
  // Calculates arbitrary hierarchical tiers (Level 0 through Level N)
  const levels = useMemo(() => {
    if (!resolvedNodes || resolvedNodes.length === 0) return [];

    const hasExplicitLevels = resolvedNodes.some(
      (n) => typeof n.level === "number",
    );
    const nodeLevelMap = new Map<string, number>();

    if (hasExplicitLevels) {
      resolvedNodes.forEach((n) => {
        nodeLevelMap.set(n.id, typeof n.level === "number" ? n.level : 0);
      });
    } else {
      // Automatic DAG topological depth assignment
      const targetedSet = new Set<string>();
      resolvedNodes.forEach((n) => {
        n.targetNodeIds?.forEach((tid) => targetedSet.add(tid));
      });

      const roots = resolvedNodes.filter((n) => !targetedSet.has(n.id));
      const startNodes = roots.length > 0 ? roots : [resolvedNodes[0]];
      startNodes.forEach((root) => nodeLevelMap.set(root.id, 0));

      let changed = true;
      let iterations = 0;
      while (changed && iterations < 20) {
        changed = false;
        iterations++;
        resolvedNodes.forEach((node) => {
          const currentLevel = nodeLevelMap.get(node.id) ?? 0;
          node.targetNodeIds?.forEach((tid) => {
            const targetNode = resolvedNodes.find((n) => n.id === tid);
            if (targetNode) {
              const existing = nodeLevelMap.get(tid);
              const nextLevel = currentLevel + 1;
              if (existing === undefined || existing < nextLevel) {
                nodeLevelMap.set(tid, nextLevel);
                changed = true;
              }
            }
          });
        });
      }

      // Default fallback for any unvisited nodes
      resolvedNodes.forEach((node) => {
        if (!nodeLevelMap.has(node.id)) {
          const tierDefault =
            node.tier === "client"
              ? 0
              : node.tier === "gateway"
                ? 1
                : node.tier === "auth" || node.tier === "service"
                  ? 2
                  : 3;
          nodeLevelMap.set(node.id, tierDefault);
        }
      });
    }

    // Group nodes into sequential levels
    const maxLevel = Math.max(...Array.from(nodeLevelMap.values()), 0);
    const result: ArchitectureNode[][] = [];
    for (let l = 0; l <= maxLevel; l++) {
      const nodesInLevel = resolvedNodes.filter(
        (n) => (nodeLevelMap.get(n.id) ?? 0) === l,
      );
      if (nodesInLevel.length > 0) {
        result.push(nodesInLevel);
      }
    }
    return result.length > 0 ? result : [resolvedNodes];
  }, [resolvedNodes]);

  // Extract all directed parent-to-child connection pairs
  const connections = useMemo(() => {
    const list: { fromId: string; toId: string }[] = [];
    let hasExplicitTargets = false;

    resolvedNodes.forEach((node) => {
      if (
        node.targetNodeIds &&
        Array.isArray(node.targetNodeIds) &&
        node.targetNodeIds.length > 0
      ) {
        node.targetNodeIds.forEach((tid) => {
          if (resolvedNodes.some((n) => n.id === tid)) {
            list.push({ fromId: node.id, toId: tid });
            hasExplicitTargets = true;
          }
        });
      }
    });

    // Backward-compatibility: if no targets exist, connect adjacent levels
    if (!hasExplicitTargets && levels.length > 1) {
      for (let l = 0; l < levels.length - 1; l++) {
        const parents = levels[l];
        const children = levels[l + 1];
        parents.forEach((p) => {
          children.forEach((c) => {
            list.push({ fromId: p.id, toId: c.id });
          });
        });
      }
    }

    return list;
  }, [resolvedNodes, levels]);

  const [activeNodeId, setActiveNodeId] = useState<string>(
    resolvedNodes[0]?.id || "node-client",
  );
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"flowchart" | "matrix">("flowchart");

  const selectedNode =
    resolvedNodes.find((n) => n.id === (hoveredNodeId || activeNodeId)) ||
    resolvedNodes[0];
  const selectedMeta = selectedNode
    ? TIER_META[selectedNode.tier] || TIER_META.service
    : TIER_META.client;

  // Active / connected node check
  const isNodeConnected = (nodeId: string) => {
    const targetId = hoveredNodeId || activeNodeId;
    if (!targetId || targetId === nodeId) return true;
    const current = resolvedNodes.find((n) => n.id === targetId);
    if (!current) return false;

    // Direct child
    if (current.targetNodeIds?.includes(nodeId)) return true;

    // Direct parent
    const isParent = resolvedNodes.some(
      (p) => p.id === nodeId && p.targetNodeIds?.includes(targetId),
    );
    if (isParent) return true;

    return false;
  };

  const isPathActive = (fromId: string, toId: string) => {
    const targetId = hoveredNodeId || activeNodeId;
    if (!targetId) return true;
    if (fromId === targetId || toId === targetId) return true;
    return false;
  };

  // Canvas element ref and dynamic node center coordinates
  const canvasRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<
    Record<
      string,
      { x: number; top: number; bottom: number; width: number; height: number }
    >
  >({});

  const measurePositions = useCallback(() => {
    if (!canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newPositions: Record<
      string,
      { x: number; top: number; bottom: number; width: number; height: number }
    > = {};

    const cardElements = canvasRef.current.querySelectorAll<HTMLElement>(
      "[data-arch-node-id]",
    );
    cardElements.forEach((el) => {
      const id = el.getAttribute("data-arch-node-id");
      if (!id) return;
      const rect = el.getBoundingClientRect();
      newPositions[id] = {
        x: Math.round(rect.left - canvasRect.left + rect.width / 2),
        top: Math.round(rect.top - canvasRect.top),
        bottom: Math.round(rect.bottom - canvasRect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });

    setPositions(newPositions);
  }, []);

  useEffect(() => {
    measurePositions();
    const timer = setTimeout(measurePositions, 80);

    const ro = new ResizeObserver(() => {
      measurePositions();
    });

    if (canvasRef.current) {
      ro.observe(canvasRef.current);
    }

    window.addEventListener("resize", measurePositions);

    return () => {
      clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", measurePositions);
    };
  }, [measurePositions, levels, resolvedNodes, viewMode]);

  return (
    <div
      id="architecture-flowchart-container"
      className="p-6 md:p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6"
    >
      {/* Dynamic SVG Definitions with Adaptive Brand Color */}
      <svg className="hidden">
        <defs>
          {/* Running Gradient adapted to Admin Brand Color */}
          <linearGradient
            id="flowchart-brand-beam"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={brandShades["300"] || brandColor}
              stopOpacity="0.4"
            />
            <stop offset="50%" stopColor={brandColor} stopOpacity="1" />
            <stop
              offset="100%"
              stopColor={brandShades["700"] || brandColor}
              stopOpacity="0.8"
            />
          </linearGradient>

          {/* Running Gradient Horizontal for branching */}
          <linearGradient
            id="flowchart-brand-beam-h"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop
              offset="0%"
              stopColor={brandShades["300"] || brandColor}
              stopOpacity="0.4"
            />
            <stop offset="50%" stopColor={brandColor} stopOpacity="1" />
            <stop
              offset="100%"
              stopColor={brandShades["700"] || brandColor}
              stopOpacity="0.8"
            />
          </linearGradient>

          {/* Glow filter */}
          <filter
            id="flowchart-beam-glow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
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
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {projectTitle
                ? `${projectTitle} Architecture Flowchart`
                : "System Topology Flowchart"}
            </h3>
            <span
              className="hidden items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
              style={{
                backgroundColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.08)`,
                borderColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.2)`,
                color: brandColor,
              }}
            >
              <Radio className="w-3 h-3 animate-pulse" />
              <span>{levels.length}-Tier Dynamic Flow</span>
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Multi-tier branching flowchart depicting client touchpoints, service
            layers, asynchronous brokers, and persistent datastores.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 bg-zinc-200/60 dark:bg-zinc-800/80 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("flowchart")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === "flowchart"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Flowchart Canvas
          </button>
          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === "matrix"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Technical Matrix
          </button>
        </div>
      </div>

      {viewMode === "flowchart" ? (
        /* Dynamic Multi-Tier Flowchart Canvas */
        <div className="space-y-6">
          <div ref={canvasRef} className="w-full relative mx-auto py-2">
            {/* SVG Dynamic Connectors Layer */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
              style={{ minHeight: "100%" }}
            >
              {connections.map((conn, idx) => {
                const fromPos = positions[conn.fromId];
                const toPos = positions[conn.toId];
                if (!fromPos || !toPos) return null;

                const x1 = fromPos.x;
                const y1 = fromPos.bottom;
                const x2 = toPos.x;
                const y2 = toPos.top;
                const dy = y2 - y1;

                if (dy < 6) return null; // Avoid inverted lines

                // Smooth S-curve or vertical drop path
                const isVertical = Math.abs(x1 - x2) < 4;
                const pathD = isVertical
                  ? `M ${x1} ${y1} L ${x2} ${y2 - 6}`
                  : `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.45}, ${x2} ${y1 + dy * 0.55}, ${x2} ${y2 - 6}`;

                const active = isPathActive(conn.fromId, conn.toId);

                return (
                  <g key={`${conn.fromId}-${conn.toId}-${idx}`}>
                    {/* Base Hairline Track */}
                    <path
                      d={pathD}
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-zinc-300 dark:text-zinc-700"
                      fill="none"
                    />

                    {/* Running Gradient Beam */}
                    <path
                      d={pathD}
                      stroke="url(#flowchart-brand-beam)"
                      strokeWidth="3.5"
                      strokeDasharray="10 16"
                      filter="url(#flowchart-beam-glow)"
                      className={
                        active
                          ? "animate-flow-dash-fast"
                          : "animate-flow-dash opacity-30"
                      }
                      fill="none"
                    />

                    {/* Smooth Animated Traveling Gradient Circle */}
                    <circle
                      r="3.5"
                      fill={brandColor}
                      filter="url(#flowchart-beam-glow)"
                    >
                      <animateMotion
                        path={pathD}
                        dur={isVertical ? "1.4s" : "1.8s"}
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Centered Arrowhead into Child Card */}
                    <polygon
                      points={`${x2 - 3.5},${y2 - 7} ${x2 + 3.5},${y2 - 7} ${x2},${y2 - 2}`}
                      fill={brandColor}
                      filter="url(#flowchart-beam-glow)"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Hierarchical Levels Rows */}
            <div className="relative z-10 flex flex-col items-center space-y-12 md:space-y-16">
              {levels.map((levelNodes, levelIdx) => (
                <div
                  key={`level-${levelIdx}`}
                  className="w-full flex flex-col items-center space-y-2"
                >
                  {/* Subtle Level Indicator */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                      Level 0{levelIdx + 1}
                    </span>
                  </div>

                  {/* Nodes Row */}
                  <div
                    className={`w-full flex flex-wrap justify-center items-stretch gap-4 md:gap-6 ${
                      levelNodes.length === 1
                        ? "max-w-md"
                        : levelNodes.length === 2
                          ? "max-w-3xl"
                          : levelNodes.length === 3
                            ? "max-w-4xl"
                            : "max-w-5xl"
                    }`}
                  >
                    {levelNodes.map((node) => {
                      const meta = TIER_META[node.tier] || TIER_META.service;
                      const IconComponent = meta.icon;
                      const isSelected =
                        activeNodeId === node.id || hoveredNodeId === node.id;
                      const connected = isNodeConnected(node.id);

                      return (
                        <div
                          key={node.id}
                          id={`arch-node-${node.id}`}
                          data-arch-node-id={node.id}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          onClick={() => setActiveNodeId(node.id)}
                          className={`w-full sm:w-auto sm:min-w-60 sm:max-w-70 lg:max-w-77.5 flex-1 p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-white dark:bg-zinc-800 border-2 shadow-md"
                              : "bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-xs"
                          } ${connected ? "opacity-100" : "opacity-65"}`}
                          style={{
                            borderColor: isSelected ? brandColor : undefined,
                            boxShadow: isSelected
                              ? `0 0 0 3px rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.2)`
                              : undefined,
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span
                                className="p-1.5 rounded-lg border text-xs"
                                style={{
                                  backgroundColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.1)`,
                                  borderColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.25)`,
                                  color: brandColor,
                                }}
                              >
                                <IconComponent className="w-4 h-4" />
                              </span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                                {meta.badge}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                              {node.title}
                            </h4>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                              {node.role}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-700/60">
                            {node.technologies.slice(0, 4).map((tech) => (
                              <span
                                key={tech}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Node Technical Inspection Drawer */}
          {selectedNode && (
            <div
              className="p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6"
              style={{
                backgroundColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.04)`,
                borderColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.25)`,
              }}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className="p-2.5 rounded-xl border shrink-0 mt-0.5"
                  style={{
                    backgroundColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.12)`,
                    borderColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.3)`,
                    color: brandColor,
                  }}
                >
                  {React.createElement(selectedMeta.icon, {
                    className: "w-5 h-5",
                  })}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Technical Spec: {selectedNode.title}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.15)`,
                        color: brandColor,
                      }}
                    >
                      {selectedMeta.badge}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {selectedNode.role} · {selectedNode.technologies.join(", ")}
                  </div>
                  {selectedNode.flowDescription && (
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed">
                      {selectedNode.flowDescription}
                    </div>
                  )}

                  {/* Connected Targets Info */}
                  {selectedNode.targetNodeIds &&
                    selectedNode.targetNodeIds.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/50 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          Branches to:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedNode.targetNodeIds.map((targetId) => {
                            const target = resolvedNodes.find(
                              (n) => n.id === targetId,
                            );
                            return target ? (
                              <span
                                key={targetId}
                                className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                              >
                                {target.title}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <Activity className="w-4 h-4" style={{ color: brandColor }} />
                <span>Running Gradient Active</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Technical Matrix View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resolvedNodes.map((node, index) => {
            const meta = TIER_META[node.tier] || TIER_META.service;
            const IconComponent = meta.icon;

            return (
              <div
                key={node.id}
                className="p-5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Stage 0{index + 1}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                      {meta.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div
                      className="p-1.5 rounded-lg border"
                      style={{
                        backgroundColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.1)`,
                        borderColor: `rgba(${brandRgb.r}, ${brandRgb.g}, ${brandRgb.b}, 0.25)`,
                        color: brandColor,
                      }}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {node.title}
                    </h4>
                  </div>

                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                    {node.role}
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {node.flowDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-700/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Stack:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {node.technologies.map((t) => (
                      <span
                        key={t}
                        className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legacy or Custom Footnote Notes */}
      {customNotes && !customNotes.trim().startsWith("[") && (
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          <div className="font-semibold text-zinc-900 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" style={{ color: brandColor }} />
            <span>Architecture Specification Notes:</span>
          </div>
          <div>{customNotes}</div>
        </div>
      )}
    </div>
  );
};
