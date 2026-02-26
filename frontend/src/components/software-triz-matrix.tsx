"use client";

import { useState, useMemo, useCallback } from "react";

// ─── 40 Software Inventive Principles ───
const PRINCIPLES = {
  1: { name: "Segmentation", sw: "Decompose into microservices, shard databases, partition data by key. Split monolith into bounded contexts.", ex: "Sharding a user table by region so each shard handles local traffic independently." },
  2: { name: "Extraction", sw: "Separate the varying concern from the stable one. Extract a hot path into its own service. Pull config out of code.", ex: "Extracting a recommendation engine from a monolithic e-commerce app into a standalone ML service." },
  3: { name: "Local Quality", sw: "Different components optimized for their specific context. Feature flags, A/B configs, per-tenant settings.", ex: "Serving different cache TTLs per API endpoint based on data volatility." },
  4: { name: "Asymmetry", sw: "CQRS — separate read/write paths. Asymmetric replication. Different SLAs for different consumers.", ex: "Write to a normalized DB, read from a denormalized materialized view optimized for queries." },
  5: { name: "Merging", sw: "Batch operations, connection pooling, request coalescing, bundling API calls.", ex: "Coalescing 1000 individual DB writes into a single bulk insert every 100ms." },
  6: { name: "Universality", sw: "Generic interfaces, polymorphic handlers, plugin architectures, protocol-agnostic middleware.", ex: "A single event processor that handles any message type through a plugin registry." },
  7: { name: "Nested Doll", sw: "Layered caching (L1 in-process, L2 Redis, L3 CDN). Nested containers. Hierarchical config.", ex: "Request hits in-memory cache → Redis → database, with each layer progressively slower but more complete." },
  8: { name: "Anti-weight", sw: "Serverless, edge computing, thin clients. Move computation closer to data or user.", ex: "Running validation logic at CDN edge nodes instead of routing to origin servers." },
  9: { name: "Preliminary Counter-action", sw: "Circuit breakers, backpressure, rate limiting. Pre-emptively protect against anticipated failure.", ex: "Circuit breaker that opens after 5 failures, preventing cascade into a degraded downstream service." },
  10: { name: "Preliminary Action", sw: "Precomputation, cache warming, prefetching, materialized views, ahead-of-time compilation.", ex: "Nightly job that precomputes personalized recommendation scores so serving is a simple lookup." },
  11: { name: "Beforehand Cushioning", sw: "Graceful degradation, fallback responses, default values, feature kill-switches.", ex: "If recommendation service is down, serve trending items instead of returning an error." },
  12: { name: "Equipotentiality", sw: "Load balancing, consistent hashing, level-triggered (not edge-triggered) designs.", ex: "Consistent hashing ring so adding/removing nodes only redistributes 1/N of keys." },
  13: { name: "The Other Way Around", sw: "Push instead of pull. Event-driven instead of polling. Invert the dependency.", ex: "Replace polling an API every 5s with a WebSocket that pushes changes on occurrence." },
  14: { name: "Curvature", sw: "Non-linear scaling, exponential backoff, logarithmic data structures (B-trees, skip lists).", ex: "Exponential backoff with jitter on retries — 1s, 2s, 4s, 8s — to avoid thundering herd." },
  15: { name: "Dynamics", sw: "Auto-scaling, adaptive algorithms, dynamic configuration, self-tuning systems.", ex: "Auto-scaling group that adds pods when p99 latency exceeds threshold, removes when idle." },
  16: { name: "Partial or Excessive Action", sw: "Eventual consistency, over-provisioning, optimistic locking, speculative execution.", ex: "Optimistic locking — assume no conflict, only check at commit time. Cheaper than pessimistic locks." },
  17: { name: "Another Dimension", sw: "Multi-tenancy, adding metadata dimensions, time-series indexing, vector embeddings.", ex: "Adding a tenant_id dimension to every table so one deployment serves all customers." },
  18: { name: "Mechanical Vibration", sw: "Heartbeats, health checks, periodic pings, gossip protocols.", ex: "Gossip protocol where each node periodically exchanges state with random peers to detect failures." },
  19: { name: "Periodic Action", sw: "Cron jobs, batch processing, scheduled compaction, periodic garbage collection.", ex: "Nightly compaction job that merges small Parquet files into optimally-sized ones." },
  20: { name: "Continuity of Useful Action", sw: "Streaming pipelines, persistent connections, connection keep-alive, continuous deployment.", ex: "Kafka streaming topology that processes events continuously rather than in hourly batch windows." },
  21: { name: "Skipping", sw: "Lazy evaluation, skip-level caching, sampling, probabilistic data structures.", ex: "Bloom filter that skips 99% of unnecessary disk reads by probabilistically checking membership." },
  22: { name: "Blessing in Disguise", sw: "Chaos engineering, fault injection, using failures as learning signals. Antifragile design.", ex: "Netflix Chaos Monkey randomly killing instances in production to ensure resilience is real, not theoretical." },
  23: { name: "Feedback", sw: "Observability, closed-loop control, adaptive rate limiting, PID controllers for autoscaling.", ex: "Adaptive rate limiter that tightens limits when error rates rise and loosens when system is healthy." },
  24: { name: "Intermediary", sw: "Message queues, API gateways, proxies, middleware, sidecar patterns.", ex: "Envoy sidecar proxy handling mTLS, retries, and observability so application code stays clean." },
  25: { name: "Self-service", sw: "Self-healing infrastructure, auto-remediation, self-registration, autonomous agents.", ex: "Kubernetes pod that auto-restarts on health check failure without human intervention." },
  26: { name: "Copying", sw: "Read replicas, CDN replication, data mirroring, shadow traffic, blue-green deployments.", ex: "Shadow traffic — copy production requests to a staging environment to test new code under real load." },
  27: { name: "Cheap Short-living Objects", sw: "Ephemeral containers, spot instances, disposable environments, serverless functions.", ex: "Using spot instances for batch ML training — 70% cheaper, job checkpoints handle interruptions." },
  28: { name: "Mechanics Substitution", sw: "Replace hardware with software-defined equivalents. SDN, virtual machines, software load balancers.", ex: "Replacing hardware F5 load balancer with software-defined Envoy mesh — cheaper, more flexible, version-controlled." },
  29: { name: "Pneumatics & Hydraulics", sw: "Flow-based processing, streaming, backpressure-aware pipelines, fluid resource allocation.", ex: "Reactive Streams with backpressure — consumer signals how fast it can accept, producer throttles accordingly." },
  30: { name: "Flexible Shells & Thin Films", sw: "Abstraction layers, containers, interfaces, API contracts that hide implementation.", ex: "Repository pattern that lets you swap Postgres for DynamoDB without touching business logic." },
  31: { name: "Porous Materials", sw: "Sparse data structures, bloom filters, compressed sparse columns, probabilistic sketches.", ex: "HyperLogLog counting unique visitors — uses 12KB of memory regardless of cardinality." },
  32: { name: "Color Changes", sw: "Observability layers, distributed tracing, semantic logging, feature flag instrumentation.", ex: "OpenTelemetry traces that color every request with service, version, and tenant context." },
  33: { name: "Homogeneity", sw: "Standardized APIs, uniform interfaces, canonical data models, consistent error formats.", ex: "Every microservice exposes the same /health, /metrics, /ready endpoints with identical schemas." },
  34: { name: "Discarding & Recovering", sw: "TTLs, garbage collection, tombstones, soft deletes, immutable append-only logs.", ex: "Kafka log compaction — retain only the latest value per key, discard obsolete versions." },
  35: { name: "Parameter Changes", sw: "Dynamic config, feature toggles, runtime tuning, A/B experiments as parameter sweeps.", ex: "Changing cache eviction policy from LRU to LFU via config change, no redeployment needed." },
  36: { name: "Phase Transitions", sw: "State machines, mode switching, circuit breaker states, system operating modes.", ex: "Service that transitions from NORMAL → DEGRADED → MAINTENANCE based on error rate thresholds." },
  37: { name: "Thermal Expansion", sw: "Elastic scaling, burst capacity, auto-provisioning on demand spikes.", ex: "Lambda functions that scale from 0 to 10,000 concurrent invocations during a flash sale." },
  38: { name: "Strong Oxidants", sw: "Parallel processing, GPU acceleration, SIMD, MapReduce, massively concurrent execution.", ex: "Moving a fraud scoring model from CPU to GPU — 50x throughput improvement, same latency." },
  39: { name: "Inert Atmosphere", sw: "Sandboxing, isolation, namespaces, security boundaries, zero-trust networks.", ex: "Running untrusted user code inside gVisor sandboxes with no network access and memory caps." },
  40: { name: "Composite Materials", sw: "Polyglot persistence, hybrid architectures, combining multiple strategies for one goal.", ex: "Using Redis for sessions + Postgres for transactions + Elasticsearch for search — best tool per access pattern." },
};

// ─── Software Engineering Parameters ───
const PARAMS = [
  { id: "LAT", name: "Latency", short: "LAT" },
  { id: "THR", name: "Throughput", short: "THR" },
  { id: "MEM", name: "Memory Usage", short: "MEM" },
  { id: "STO", name: "Storage", short: "STO" },
  { id: "SCA", name: "Scalability", short: "SCA" },
  { id: "CON", name: "Consistency", short: "CON" },
  { id: "AVA", name: "Availability", short: "AVA" },
  { id: "SEC", name: "Security", short: "SEC" },
  { id: "ACC", name: "Accuracy", short: "ACC" },
  { id: "DBG", name: "Debuggability", short: "DBG" },
  { id: "CST", name: "Infra Cost", short: "CST" },
  { id: "CPX", name: "Complexity", short: "CPX" },
  { id: "REL", name: "Reliability", short: "REL" },
  { id: "MNT", name: "Maintainability", short: "MNT" },
  { id: "RTP", name: "Real-time Perf", short: "RTP" },
  { id: "FRE", name: "Data Freshness", short: "FRE" },
];

// ─── Contradiction Matrix ───
// Key: "IMPROVING|WORSENING" → array of principle numbers
const MATRIX = {
  // Latency improving → what worsens
  "LAT|THR": [5, 20, 38],
  "LAT|MEM": [7, 10, 21],
  "LAT|STO": [10, 7, 34],
  "LAT|SCA": [8, 12, 1],
  "LAT|CON": [16, 4, 13],
  "LAT|AVA": [7, 26, 11],
  "LAT|SEC": [8, 39, 24],
  "LAT|ACC": [21, 16, 31],
  "LAT|DBG": [32, 7, 30],
  "LAT|CST": [27, 8, 37],
  "LAT|CPX": [7, 10, 30],
  "LAT|REL": [11, 9, 26],
  "LAT|MNT": [30, 7, 33],
  "LAT|RTP": [20, 38, 5],
  "LAT|FRE": [10, 7, 20],

  // Throughput improving
  "THR|LAT": [5, 20, 29],
  "THR|MEM": [5, 34, 19],
  "THR|STO": [5, 34, 19],
  "THR|SCA": [1, 12, 37],
  "THR|CON": [16, 4, 5],
  "THR|AVA": [26, 37, 15],
  "THR|SEC": [24, 39, 5],
  "THR|ACC": [16, 5, 19],
  "THR|DBG": [32, 33, 5],
  "THR|CST": [27, 37, 38],
  "THR|CPX": [5, 6, 33],
  "THR|REL": [9, 11, 23],
  "THR|MNT": [33, 6, 30],
  "THR|RTP": [20, 38, 29],
  "THR|FRE": [20, 5, 13],

  // Memory improving
  "MEM|LAT": [21, 34, 31],
  "MEM|THR": [34, 21, 5],
  "MEM|STO": [34, 31, 7],
  "MEM|SCA": [1, 34, 27],
  "MEM|CON": [34, 16, 7],
  "MEM|AVA": [34, 11, 27],
  "MEM|SEC": [39, 34, 31],
  "MEM|ACC": [31, 21, 16],
  "MEM|DBG": [32, 34, 31],
  "MEM|CST": [27, 34, 31],
  "MEM|CPX": [34, 31, 21],
  "MEM|REL": [11, 34, 7],
  "MEM|MNT": [34, 30, 33],
  "MEM|RTP": [21, 34, 38],
  "MEM|FRE": [34, 19, 21],

  // Scalability improving
  "SCA|LAT": [1, 8, 12],
  "SCA|THR": [1, 37, 12],
  "SCA|MEM": [1, 27, 17],
  "SCA|STO": [1, 17, 34],
  "SCA|CON": [16, 12, 4],
  "SCA|AVA": [26, 12, 37],
  "SCA|SEC": [39, 17, 1],
  "SCA|ACC": [16, 1, 12],
  "SCA|DBG": [32, 17, 33],
  "SCA|CST": [27, 37, 1],
  "SCA|CPX": [1, 6, 33],
  "SCA|REL": [12, 9, 26],
  "SCA|MNT": [33, 1, 6],
  "SCA|RTP": [1, 8, 37],
  "SCA|FRE": [13, 20, 1],

  // Consistency improving
  "CON|LAT": [4, 16, 10],
  "CON|THR": [4, 16, 5],
  "CON|MEM": [4, 7, 34],
  "CON|STO": [4, 34, 7],
  "CON|SCA": [4, 12, 16],
  "CON|AVA": [16, 4, 36],
  "CON|SEC": [39, 4, 24],
  "CON|ACC": [4, 23, 33],
  "CON|DBG": [32, 4, 33],
  "CON|CST": [4, 27, 16],
  "CON|CPX": [4, 33, 30],
  "CON|REL": [4, 26, 9],
  "CON|MNT": [4, 33, 30],
  "CON|RTP": [4, 20, 16],
  "CON|FRE": [4, 20, 13],

  // Availability improving
  "AVA|LAT": [26, 11, 7],
  "AVA|THR": [26, 37, 15],
  "AVA|MEM": [26, 27, 11],
  "AVA|STO": [26, 34, 27],
  "AVA|SCA": [26, 12, 37],
  "AVA|CON": [16, 26, 36],
  "AVA|SEC": [39, 26, 24],
  "AVA|ACC": [16, 26, 11],
  "AVA|DBG": [32, 26, 33],
  "AVA|CST": [27, 26, 37],
  "AVA|CPX": [26, 11, 6],
  "AVA|REL": [26, 9, 22],
  "AVA|MNT": [26, 33, 25],
  "AVA|RTP": [26, 11, 20],
  "AVA|FRE": [26, 20, 13],

  // Security improving
  "SEC|LAT": [39, 24, 8],
  "SEC|THR": [39, 24, 5],
  "SEC|MEM": [39, 31, 34],
  "SEC|STO": [39, 34, 17],
  "SEC|SCA": [39, 17, 1],
  "SEC|CON": [39, 4, 24],
  "SEC|AVA": [39, 26, 11],
  "SEC|ACC": [39, 23, 33],
  "SEC|DBG": [39, 32, 30],
  "SEC|CST": [39, 27, 28],
  "SEC|CPX": [39, 30, 6],
  "SEC|REL": [39, 9, 26],
  "SEC|MNT": [39, 33, 30],
  "SEC|RTP": [39, 8, 24],
  "SEC|FRE": [39, 24, 13],

  // Accuracy improving
  "ACC|LAT": [10, 21, 16],
  "ACC|THR": [5, 16, 19],
  "ACC|MEM": [31, 21, 7],
  "ACC|STO": [34, 7, 17],
  "ACC|SCA": [1, 16, 12],
  "ACC|CON": [4, 23, 33],
  "ACC|AVA": [11, 26, 16],
  "ACC|SEC": [39, 23, 33],
  "ACC|DBG": [32, 23, 33],
  "ACC|CST": [27, 16, 31],
  "ACC|CPX": [23, 33, 30],
  "ACC|REL": [23, 9, 11],
  "ACC|MNT": [33, 23, 30],
  "ACC|RTP": [10, 38, 21],
  "ACC|FRE": [20, 10, 13],

  // Reliability improving
  "REL|LAT": [9, 11, 26],
  "REL|THR": [9, 11, 23],
  "REL|MEM": [9, 26, 27],
  "REL|STO": [9, 26, 34],
  "REL|SCA": [9, 12, 26],
  "REL|CON": [9, 4, 26],
  "REL|AVA": [26, 9, 22],
  "REL|SEC": [39, 9, 26],
  "REL|ACC": [23, 9, 11],
  "REL|DBG": [32, 9, 22],
  "REL|CST": [27, 9, 22],
  "REL|CPX": [9, 22, 6],
  "REL|MNT": [9, 33, 25],
  "REL|RTP": [9, 11, 20],
  "REL|FRE": [9, 20, 26],

  // Cost improving
  "CST|LAT": [27, 8, 37],
  "CST|THR": [27, 37, 38],
  "CST|MEM": [27, 34, 31],
  "CST|STO": [27, 34, 19],
  "CST|SCA": [27, 37, 1],
  "CST|CON": [27, 16, 4],
  "CST|AVA": [27, 26, 11],
  "CST|SEC": [27, 28, 39],
  "CST|ACC": [27, 16, 31],
  "CST|DBG": [27, 32, 33],
  "CST|CPX": [27, 6, 28],
  "CST|REL": [27, 9, 22],
  "CST|MNT": [27, 33, 28],
  "CST|RTP": [27, 37, 8],
  "CST|FRE": [27, 19, 34],

  // Complexity reducing (improving simplicity)
  "CPX|LAT": [30, 6, 33],
  "CPX|THR": [6, 33, 5],
  "CPX|MEM": [30, 34, 6],
  "CPX|STO": [30, 34, 6],
  "CPX|SCA": [6, 33, 1],
  "CPX|CON": [33, 4, 30],
  "CPX|AVA": [6, 11, 33],
  "CPX|SEC": [30, 39, 6],
  "CPX|ACC": [33, 23, 30],
  "CPX|DBG": [32, 33, 30],
  "CPX|CST": [6, 28, 27],
  "CPX|REL": [6, 9, 33],
  "CPX|MNT": [33, 30, 6],
  "CPX|RTP": [30, 6, 8],
  "CPX|FRE": [30, 6, 13],

  // Maintainability improving
  "MNT|LAT": [33, 30, 7],
  "MNT|THR": [33, 6, 30],
  "MNT|MEM": [33, 30, 34],
  "MNT|STO": [33, 30, 34],
  "MNT|SCA": [33, 1, 6],
  "MNT|CON": [33, 4, 30],
  "MNT|AVA": [33, 26, 25],
  "MNT|SEC": [33, 39, 30],
  "MNT|ACC": [33, 23, 30],
  "MNT|DBG": [33, 32, 30],
  "MNT|CST": [33, 28, 27],
  "MNT|CPX": [33, 30, 6],
  "MNT|REL": [33, 9, 25],
  "MNT|RTP": [33, 30, 8],
  "MNT|FRE": [33, 30, 13],

  // Real-time Performance improving
  "RTP|LAT": [20, 38, 5],
  "RTP|THR": [20, 38, 29],
  "RTP|MEM": [20, 38, 21],
  "RTP|STO": [20, 34, 38],
  "RTP|SCA": [1, 8, 37],
  "RTP|CON": [20, 4, 16],
  "RTP|AVA": [20, 11, 26],
  "RTP|SEC": [8, 39, 20],
  "RTP|ACC": [10, 38, 21],
  "RTP|DBG": [32, 20, 33],
  "RTP|CST": [27, 37, 8],
  "RTP|CPX": [20, 30, 6],
  "RTP|REL": [9, 20, 11],
  "RTP|MNT": [33, 20, 30],
  "RTP|FRE": [20, 13, 10],

  // Data Freshness improving
  "FRE|LAT": [13, 20, 10],
  "FRE|THR": [20, 13, 5],
  "FRE|MEM": [13, 34, 20],
  "FRE|STO": [13, 34, 20],
  "FRE|SCA": [13, 1, 20],
  "FRE|CON": [13, 4, 20],
  "FRE|AVA": [13, 26, 20],
  "FRE|SEC": [13, 39, 24],
  "FRE|ACC": [13, 20, 10],
  "FRE|DBG": [13, 32, 20],
  "FRE|CST": [13, 27, 19],
  "FRE|CPX": [13, 30, 6],
  "FRE|REL": [13, 9, 20],
  "FRE|MNT": [13, 33, 20],
  "FRE|RTP": [13, 20, 10],

  // Debuggability improving
  "DBG|LAT": [32, 30, 7],
  "DBG|THR": [32, 33, 5],
  "DBG|MEM": [32, 34, 31],
  "DBG|STO": [32, 34, 17],
  "DBG|SCA": [32, 17, 33],
  "DBG|CON": [32, 4, 33],
  "DBG|AVA": [32, 26, 33],
  "DBG|SEC": [32, 39, 30],
  "DBG|ACC": [32, 23, 33],
  "DBG|CST": [32, 27, 33],
  "DBG|CPX": [32, 33, 30],
  "DBG|REL": [32, 9, 22],
  "DBG|MNT": [32, 33, 30],
  "DBG|RTP": [32, 20, 33],
  "DBG|FRE": [32, 13, 20],

  // Storage improving
  "STO|LAT": [34, 7, 10],
  "STO|THR": [34, 5, 19],
  "STO|MEM": [34, 31, 7],
  "STO|SCA": [34, 1, 17],
  "STO|CON": [34, 4, 7],
  "STO|AVA": [34, 26, 27],
  "STO|SEC": [34, 39, 17],
  "STO|ACC": [34, 7, 17],
  "STO|DBG": [34, 32, 17],
  "STO|CST": [34, 27, 19],
  "STO|CPX": [34, 30, 6],
  "STO|REL": [34, 9, 26],
  "STO|MNT": [34, 33, 30],
  "STO|RTP": [34, 20, 38],
  "STO|FRE": [34, 20, 13],
};

// ─── Color schemes ───
interface ColorScheme {
  bg: string; panel: string; grid: string; axis: string;
  text1: string; text2: string; series: string[];
}

const LIGHT: ColorScheme = {
  bg: "#FFFFFF", panel: "#F5F7FA", grid: "#E5E7EB", axis: "#D1D5DB",
  text1: "#111827", text2: "#4B5563",
  series: ["#003A8F","#1F4CEB","#5B7FA6","#2F7F9D","#2E6F4E","#C69214","#7A2E2E","#6B7280"],
};
const DARK: ColorScheme = {
  bg: "#0B1220", panel: "#111827", grid: "#1F2933", axis: "#374151",
  text1: "#E5E7EB", text2: "#9CA3AF",
  series: ["#4F83CC","#1F4CEB","#5B7FA6","#2F7F9D","#4CAF84","#E0B84C","#C26D6D","#9CA3AF"],
};

interface Selection {
  improving: string;
  worsening: string;
}

export default function SoftwareTRIZMatrix() {
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("matrix"); // matrix | principles
  const c = dark ? DARK : LIGHT;

  const cellKey = useCallback((imp: string, wor: string) => `${imp}|${wor}`, []);

  const selectedPrinciples = useMemo(() => {
    if (!selected) return [];
    const key = cellKey(selected.improving, selected.worsening);
    return ((MATRIX as Record<string, number[]>)[key] || []).map((n: number) => ({ num: n, ...(PRINCIPLES as Record<number, { name: string; sw: string; ex: string }>)[n] }));
  }, [selected, cellKey]);

  const filteredPrinciples = useMemo(() => {
    if (!searchTerm) return Object.entries(PRINCIPLES).map(([n, p]) => ({ num: parseInt(n), ...p }));
    const term = searchTerm.toLowerCase();
    return Object.entries(PRINCIPLES)
      .map(([n, p]) => ({ num: parseInt(n), ...p }))
      .filter(p => p.name.toLowerCase().includes(term) || p.sw.toLowerCase().includes(term) || p.ex.toLowerCase().includes(term));
  }, [searchTerm]);

  const impParam = selected ? PARAMS.find(p => p.id === selected.improving) : null;
  const worParam = selected ? PARAMS.find(p => p.id === selected.worsening) : null;

  return (
    <div style={{ background: c.bg, color: c.text1, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${c.grid}`, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Software TRIZ Contradiction Matrix
          </h1>
          <p style={{ fontSize: "13px", color: c.text2, margin: "4px 0 0" }}>
            16 parameters -- 40 inventive principles -- adapted for software & cloud engineering
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setViewMode(viewMode === "matrix" ? "principles" : "matrix")}
            style={{
              padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              background: c.panel, color: c.text1, border: `1px solid ${c.grid}`,
            }}
          >
            {viewMode === "matrix" ? "View All 40 Principles" : "View Matrix"}
          </button>
          <button
            onClick={() => setDark(!dark)}
            style={{
              padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              background: c.panel, color: c.text1, border: `1px solid ${c.grid}`,
            }}
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      {viewMode === "principles" ? (
        /* ─── Principles Catalog View ─── */
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          <input
            type="text"
            placeholder="Search principles... (e.g. cache, microservice, scaling)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: "8px", fontSize: "14px",
              background: c.panel, color: c.text1, border: `1px solid ${c.grid}`,
              marginBottom: "20px", outline: "none", boxSizing: "border-box",
            }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "12px" }}>
            {filteredPrinciples.map(p => (
              <div key={p.num} style={{
                padding: "16px", borderRadius: "8px", border: `1px solid ${c.grid}`,
                background: c.panel,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: "32px", height: "32px", borderRadius: "6px", fontSize: "13px", fontWeight: 700,
                    background: c.series[p.num % c.series.length] + "22",
                    color: c.series[p.num % c.series.length],
                  }}>
                    {p.num}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700 }}>{p.name}</span>
                </div>
                <p style={{ fontSize: "13px", color: c.text2, margin: "0 0 8px", lineHeight: "1.5" }}>{p.sw}</p>
                <p style={{
                  fontSize: "12px", color: c.text2, margin: 0, padding: "8px 10px", borderRadius: "6px",
                  background: dark ? "#0B1220" : "#FFFFFF", lineHeight: "1.5", fontStyle: "italic",
                  borderLeft: `3px solid ${c.series[p.num % c.series.length]}`,
                }}>
                  {p.ex}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ─── Matrix View ─── */
        <div style={{ display: "flex", height: "calc(100vh - 73px)" }}>
          {/* Matrix grid */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: c.series[0] }} />
              <span style={{ fontSize: "12px", color: c.text2 }}>3 principles</span>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: c.series[0], opacity: 0.6 }} />
              <span style={{ fontSize: "12px", color: c.text2 }}>2 principles</span>
              <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: c.grid }} />
              <span style={{ fontSize: "12px", color: c.text2 }}>no mapping</span>
              <span style={{ fontSize: "12px", color: c.text2, marginLeft: "16px" }}>
                Rows = improving parameter, Columns = worsening parameter
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr>
                    <th style={{
                      padding: "6px 10px", textAlign: "left", fontWeight: 700, fontSize: "10px",
                      color: c.text2, position: "sticky", left: 0, background: c.bg, zIndex: 2,
                      borderBottom: `2px solid ${c.series[0]}`, minWidth: "110px",
                    }}>
                      IMPROVE ↓ / WORSEN →
                    </th>
                    {PARAMS.map(p => (
                      <th key={p.id} style={{
                        padding: "6px 4px", textAlign: "center", fontWeight: 600, fontSize: "10px",
                        color: c.text2, borderBottom: `2px solid ${c.series[0]}`,
                        writingMode: "vertical-rl", transform: "rotate(180deg)", height: "90px",
                        letterSpacing: "0.02em",
                      }}>
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARAMS.map((rowP) => (
                    <tr key={rowP.id}>
                      <td style={{
                        padding: "6px 10px", fontWeight: 600, fontSize: "11px", color: c.text1,
                        position: "sticky", left: 0, background: c.bg, zIndex: 1,
                        borderBottom: `1px solid ${c.grid}`,
                        whiteSpace: "nowrap",
                      }}>
                        {rowP.name}
                      </td>
                      {PARAMS.map((colP) => {
                        const key = cellKey(rowP.id, colP.id);
                        const principles = (MATRIX as Record<string, number[]>)[key] || [];
                        const isSelf = rowP.id === colP.id;
                        const isSelected = selected && selected.improving === rowP.id && selected.worsening === colP.id;
                        const isHovered = hoveredCell === key;
                        const count = principles.length;

                        let bg = c.panel;
                        let opacity = 1;
                        if (isSelf) { bg = c.grid; opacity = 0.3; }
                        else if (count === 3) bg = c.series[0] + (dark ? "44" : "22");
                        else if (count === 2) bg = c.series[0] + (dark ? "28" : "14");
                        else if (count === 1) bg = c.series[0] + (dark ? "18" : "0A");

                        return (
                          <td
                            key={colP.id}
                            onClick={() => !isSelf && count > 0 && setSelected({ improving: rowP.id, worsening: colP.id })}
                            onMouseEnter={() => setHoveredCell(key)}
                            onMouseLeave={() => setHoveredCell(null)}
                            style={{
                              padding: "4px", textAlign: "center", cursor: isSelf || count === 0 ? "default" : "pointer",
                              background: isSelected ? c.series[0] + "55" : isHovered && count > 0 ? c.series[0] + "33" : bg,
                              borderBottom: `1px solid ${c.grid}`,
                              borderRight: `1px solid ${c.grid}`,
                              opacity, minWidth: "42px",
                              transition: "background 0.15s ease",
                              outline: isSelected ? `2px solid ${c.series[0]}` : "none",
                              outlineOffset: "-2px",
                            }}
                          >
                            {isSelf ? (
                              <span style={{ color: c.axis, fontSize: "10px" }}>--</span>
                            ) : count > 0 ? (
                              <span style={{ fontSize: "10px", fontWeight: 600, color: c.text2, fontFamily: "monospace" }}>
                                {principles.join(",")}
                              </span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          <div style={{
            width: "380px", minWidth: "380px", borderLeft: `1px solid ${c.grid}`,
            background: c.panel, overflow: "auto", padding: "20px",
          }}>
            {selected && selectedPrinciples.length > 0 ? (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: c.series[0], textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>
                    Contradiction
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "4px", fontSize: "13px", fontWeight: 600,
                      background: c.series[4] + "22", color: c.series[4],
                    }}>
                      Improve: {impParam?.name}
                    </span>
                    <span style={{ fontSize: "12px", color: c.text2 }}>vs</span>
                    <span style={{
                      padding: "4px 10px", borderRadius: "4px", fontSize: "13px", fontWeight: 600,
                      background: c.series[6] + "22", color: c.series[6],
                    }}>
                      Worsens: {worParam?.name}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: "11px", fontWeight: 700, color: c.text2, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>
                  Suggested Inventive Principles
                </p>

                {selectedPrinciples.map((p, i) => (
                  <div key={p.num} style={{
                    marginBottom: "16px", padding: "14px", borderRadius: "8px",
                    background: dark ? "#0B1220" : "#FFFFFF",
                    border: `1px solid ${c.grid}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "28px", height: "28px", borderRadius: "6px", fontSize: "12px", fontWeight: 800,
                        background: c.series[i % c.series.length] + "22",
                        color: c.series[i % c.series.length],
                      }}>
                        {p.num}
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>{p.name}</span>
                    </div>
                    <p style={{ fontSize: "13px", color: c.text2, margin: "0 0 10px", lineHeight: "1.55" }}>
                      {p.sw}
                    </p>
                    <div style={{
                      fontSize: "12px", color: c.text2, padding: "10px 12px", borderRadius: "6px",
                      background: c.panel, lineHeight: "1.55", fontStyle: "italic",
                      borderLeft: `3px solid ${c.series[i % c.series.length]}`,
                    }}>
                      {p.ex}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "40px 20px" }}>
                <div style={{
                  width: "64px", height: "64px", borderRadius: "12px", marginBottom: "16px",
                  background: c.series[0] + "15", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "28px",
                }}>
                  ?
                </div>
                <p style={{ fontSize: "15px", fontWeight: 600, margin: "0 0 8px" }}>Select a contradiction</p>
                <p style={{ fontSize: "13px", color: c.text2, margin: 0, lineHeight: "1.6" }}>
                  Click any cell in the matrix to see which inventive principles resolve the tradeoff between improving one parameter while the other worsens.
                </p>
                <div style={{
                  marginTop: "24px", padding: "14px", borderRadius: "8px",
                  background: dark ? "#0B1220" : "#FFFFFF",
                  border: `1px solid ${c.grid}`, textAlign: "left", fontSize: "12px",
                  color: c.text2, lineHeight: "1.6",
                }}>
                  <p style={{ fontWeight: 700, color: c.text1, margin: "0 0 6px", fontSize: "12px" }}>How to use this in a patent sprint:</p>
                  <p style={{ margin: "0 0 4px" }}>1. Identify your core engineering contradiction</p>
                  <p style={{ margin: "0 0 4px" }}>2. Find the row (what you&apos;re improving) and column (what worsens)</p>
                  <p style={{ margin: "0 0 4px" }}>3. Read the suggested principles and examples</p>
                  <p style={{ margin: 0 }}>4. Ask: &ldquo;Does my solution use one of these patterns in a novel way?&rdquo;</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
