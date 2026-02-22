import type { SoftwareParameter, SoftwareInventivePrinciple, ContradictionEntry } from "./types";

// ═══════════════════════════════════════════════════════════════════
// 30 SOFTWARE ENGINEERING PARAMETERS
// ═══════════════════════════════════════════════════════════════════
export const SOFTWARE_PARAMETERS: SoftwareParameter[] = [
  { id: 1, name: "Response Latency", category: "performance", description: "Time from request to first response byte", exampleTradeoff: "Lower latency often requires more compute or caching infrastructure" },
  { id: 2, name: "Data Consistency", category: "data", description: "Guarantee that all nodes see the same data at the same time", exampleTradeoff: "Strong consistency reduces availability and increases latency (CAP theorem)" },
  { id: 3, name: "Throughput", category: "performance", description: "Number of operations or requests processed per unit time", exampleTradeoff: "Higher throughput may require batching, reducing individual request latency" },
  { id: 4, name: "Resource Cost", category: "operations", description: "Compute, memory, storage, and network costs", exampleTradeoff: "Reducing cost often means accepting higher latency or lower redundancy" },
  { id: 5, name: "Query Performance", category: "performance", description: "Speed and efficiency of database/search queries", exampleTradeoff: "Denormalization speeds reads but slows writes and increases storage" },
  { id: 6, name: "Data Freshness", category: "data", description: "How up-to-date the data is when served to users", exampleTradeoff: "Real-time data requires event-driven architecture, adding complexity" },
  { id: 7, name: "Horizontal Scalability", category: "scale", description: "Ability to add more nodes to handle increased load", exampleTradeoff: "Scaling out introduces distributed coordination complexity" },
  { id: 8, name: "Predictable Costs", category: "operations", description: "Ability to forecast and control infrastructure spending", exampleTradeoff: "Predictable costs may limit ability to handle traffic spikes" },
  { id: 9, name: "Fault Tolerance", category: "reliability", description: "System continues operating despite component failures", exampleTradeoff: "Redundancy increases cost and data synchronization complexity" },
  { id: 10, name: "Infrastructure Complexity", category: "operations", description: "Number of moving parts in the deployment architecture", exampleTradeoff: "Simpler infra may limit performance tuning and scaling options" },
  { id: 11, name: "Authentication Strength", category: "security", description: "Security level of identity verification", exampleTradeoff: "Stronger auth (MFA, biometrics) increases user friction" },
  { id: 12, name: "User Friction", category: "product", description: "Number of steps/barriers users face to complete actions", exampleTradeoff: "Reducing friction may weaken security or data quality" },
  { id: 13, name: "Feature Completeness", category: "product", description: "Breadth of functionality offered to users", exampleTradeoff: "More features increase maintenance burden and UX complexity" },
  { id: 14, name: "UX Simplicity", category: "product", description: "Ease of understanding and using the interface", exampleTradeoff: "Simplicity may limit power-user capabilities" },
  { id: 15, name: "Development Velocity", category: "engineering", description: "Speed at which new features can be shipped", exampleTradeoff: "Moving fast may accumulate technical debt" },
  { id: 16, name: "Code Quality / Maintainability", category: "engineering", description: "Readability, testability, and long-term health of the codebase", exampleTradeoff: "High quality code takes longer to write initially" },
  { id: 17, name: "Model Accuracy", category: "ai_ml", description: "Correctness of ML model predictions", exampleTradeoff: "Higher accuracy often requires more training data and compute" },
  { id: 18, name: "Inference Latency", category: "ai_ml", description: "Time to generate a prediction from an ML model", exampleTradeoff: "Faster inference may require model compression, reducing accuracy" },
  { id: 19, name: "Training Data Volume", category: "ai_ml", description: "Amount of data available for model training", exampleTradeoff: "More data improves models but raises privacy and storage concerns" },
  { id: 20, name: "Privacy Preservation", category: "security", description: "Degree to which user data is protected from exposure", exampleTradeoff: "Strong privacy limits personalization and analytics capabilities" },
  { id: 21, name: "API Surface Area", category: "integration", description: "Breadth and depth of public APIs exposed", exampleTradeoff: "Larger API surface increases versioning and compatibility burden" },
  { id: 22, name: "Maintenance Burden", category: "engineering", description: "Ongoing effort required to keep the system running", exampleTradeoff: "Lower maintenance may mean less customization capability" },
  { id: 23, name: "Offline Capability", category: "reliability", description: "System functionality without network connectivity", exampleTradeoff: "Offline support requires sync logic and conflict resolution" },
  { id: 24, name: "Sync Complexity", category: "data", description: "Difficulty of keeping data consistent across clients/nodes", exampleTradeoff: "Simpler sync may sacrifice real-time accuracy" },
  { id: 25, name: "Observability Depth", category: "operations", description: "Ability to understand internal system state from external outputs", exampleTradeoff: "Deep observability adds performance overhead and data storage costs" },
  { id: 26, name: "Performance Overhead", category: "performance", description: "Extra resource consumption from non-functional concerns", exampleTradeoff: "Reducing overhead may sacrifice security, logging, or monitoring" },
  { id: 27, name: "Multi-tenancy Isolation", category: "architecture", description: "Degree of separation between tenant data and compute", exampleTradeoff: "Strong isolation increases infrastructure cost per tenant" },
  { id: 28, name: "Customization Flexibility", category: "architecture", description: "Ability for users/tenants to customize behavior", exampleTradeoff: "More customization increases testing matrix and support complexity" },
  { id: 29, name: "Schema Rigidity", category: "data", description: "Strictness of data schema enforcement", exampleTradeoff: "Rigid schemas prevent data corruption but slow iteration" },
  { id: 30, name: "Deployment Frequency", category: "engineering", description: "How often new versions can be safely released", exampleTradeoff: "Frequent deploys require robust CI/CD and testing infrastructure" },
];

// ═══════════════════════════════════════════════════════════════════
// 15 SOFTWARE INVENTIVE PRINCIPLES
// ═══════════════════════════════════════════════════════════════════
export const SOFTWARE_PRINCIPLES: SoftwareInventivePrinciple[] = [
  {
    id: 1, name: "Segmentation / Microservices",
    description: "Break a monolith into independently deployable units. Isolate concerns so each can evolve, scale, and fail independently.",
    softwareExamples: [
      "Decompose monolith into microservices with independent databases",
      "Split a large ML pipeline into feature engineering, training, and serving stages",
      "Partition a message queue by topic for independent scaling",
    ],
  },
  {
    id: 2, name: "Extraction / Separation",
    description: "Move a concern to its own layer, service, or module. Extract what is useful or what is harmful into a separate entity.",
    softwareExamples: [
      "Extract authentication into a dedicated identity service",
      "Separate read models from write models in event-sourced systems",
      "Move business rules into a rules engine outside the main codebase",
    ],
  },
  {
    id: 3, name: "Asymmetry / Read-Write Split",
    description: "Separate the read path from the write path (CQRS). Accept write-side delay for read-side speed. Reconcile asynchronously.",
    softwareExamples: [
      "CQRS pattern with separate read/write stores",
      "Write to primary database, read from materialized views or read replicas",
      "Event sourcing: append-only writes, project to queryable read models",
    ],
  },
  {
    id: 4, name: "Prior Action / Pre-computation",
    description: "Cache, pre-compute, or warm up results before the request arrives. Trade stale-but-fast reads for eventual consistency.",
    softwareExamples: [
      "Pre-compute aggregations during off-peak hours (materialized views)",
      "CDN edge caching with TTL-based invalidation",
      "Warm ML model caches before production traffic shift",
    ],
  },
  {
    id: 5, name: "Inversion / Edge Push",
    description: "Move processing closer to the data source or user. Invert the traditional centralized architecture.",
    softwareExamples: [
      "Edge computing for IoT data processing (filter before send)",
      "Client-side ML inference (TensorFlow.js, Core ML) instead of server round-trip",
      "Database stored procedures for complex queries instead of application-layer joins",
    ],
  },
  {
    id: 6, name: "Intermediary / Proxy",
    description: "Insert middleware, sidecar, or gateway between components. The intermediary adds value without changing the endpoints.",
    softwareExamples: [
      "API gateway for rate limiting, auth, and request transformation",
      "Service mesh sidecar (Envoy) for observability and traffic control",
      "Message broker between producers and consumers for decoupling",
    ],
  },
  {
    id: 7, name: "Self-Service / Self-Healing",
    description: "System detects and recovers from failure automatically without human intervention.",
    softwareExamples: [
      "Kubernetes auto-restart on liveness probe failure",
      "Circuit breaker pattern with automatic retry and fallback",
      "Self-healing data pipelines that detect corruption and replay from source",
    ],
  },
  {
    id: 8, name: "Dynamism / Adaptive Config",
    description: "Replace static configuration with runtime-adaptive behavior. The system adjusts itself based on observed conditions.",
    softwareExamples: [
      "Dynamic rate limiting based on real-time traffic patterns",
      "Auto-scaling based on queue depth or CPU utilization",
      "Adaptive batch sizes in ML training based on gradient noise",
    ],
  },
  {
    id: 9, name: "Partial Action / Graceful Degradation",
    description: "Serve partial or approximate results when full results are unavailable. Upgrade to full consistency in the background.",
    softwareExamples: [
      "Return cached search results when the search service is slow",
      "Show stale dashboard data with a 'last updated' timestamp during outages",
      "Progressive image loading (blur-up then full resolution)",
    ],
  },
  {
    id: 10, name: "Feedback Loop / Observability",
    description: "Close the loop: measure, alert, auto-adjust. Use output signals to improve input decisions.",
    softwareExamples: [
      "A/B test results feed back into feature flag decisions",
      "Error rate monitoring triggers automatic rollback",
      "User engagement metrics auto-tune recommendation algorithms",
    ],
  },
  {
    id: 11, name: "Discarding / Ephemeral Resources",
    description: "Use disposable, short-lived resources instead of persistent ones. Rebuild rather than maintain.",
    softwareExamples: [
      "Spot instances for batch processing (accept interruption for cost savings)",
      "Ephemeral containers: rebuild on every deploy instead of patching",
      "Serverless functions: no servers to maintain, pay per invocation",
    ],
  },
  {
    id: 12, name: "Dimensionality Change",
    description: "Move from request-response to event-driven, streaming, or reactive paradigms. Change the communication model.",
    softwareExamples: [
      "Replace polling with WebSocket or Server-Sent Events for real-time updates",
      "Event-driven architecture with Kafka instead of synchronous REST calls",
      "Stream processing (Flink/Spark Streaming) instead of batch ETL",
    ],
  },
  {
    id: 13, name: "Universality / Abstraction",
    description: "One mechanism handles multiple use cases. Create a general-purpose tool instead of specialized solutions.",
    softwareExamples: [
      "GraphQL as a universal query interface over multiple REST APIs",
      "Plugin architecture that handles multiple data formats with one pipeline",
      "Generic workflow engine instead of hard-coded business process logic",
    ],
  },
  {
    id: 14, name: "Copying / Replication",
    description: "Replicate data or compute across nodes for availability, speed, or fault tolerance.",
    softwareExamples: [
      "Multi-region database replication for disaster recovery",
      "Read replicas to distribute query load",
      "Model ensembles: multiple models vote on the same prediction",
    ],
  },
  {
    id: 15, name: "Nesting / Composition",
    description: "Compose smaller primitives into complex behavior. Build systems from composable, reusable building blocks.",
    softwareExamples: [
      "Middleware chains in Express/Koa for cross-cutting concerns",
      "Terraform modules composing infrastructure from reusable blocks",
      "React component composition for complex UI from simple atoms",
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// CONTRADICTION MATRIX (sparse: ~50 high-value cells)
// Each entry: improving parameter ID -> worsening parameter ID -> suggested principle IDs
// ═══════════════════════════════════════════════════════════════════
export const CONTRADICTION_MATRIX: ContradictionEntry[] = [
  // ── Response Latency (1) improved ──────────────────────────────
  { improvingParam: 1, worseningParam: 2, suggestedPrinciples: [4, 3, 9] },   // latency vs consistency
  { improvingParam: 1, worseningParam: 4, suggestedPrinciples: [4, 11, 5] },  // latency vs cost
  { improvingParam: 1, worseningParam: 5, suggestedPrinciples: [4, 5, 6] },   // latency vs query performance
  { improvingParam: 1, worseningParam: 6, suggestedPrinciples: [4, 9, 3] },   // latency vs data freshness
  { improvingParam: 1, worseningParam: 9, suggestedPrinciples: [9, 14, 7] },  // latency vs fault tolerance
  { improvingParam: 1, worseningParam: 10, suggestedPrinciples: [4, 6, 1] },  // latency vs infra complexity
  { improvingParam: 1, worseningParam: 16, suggestedPrinciples: [4, 15, 6] }, // latency vs code quality
  { improvingParam: 1, worseningParam: 24, suggestedPrinciples: [4, 3, 9] },  // latency vs sync complexity
  { improvingParam: 1, worseningParam: 25, suggestedPrinciples: [8, 11, 1] }, // latency vs observability
  { improvingParam: 1, worseningParam: 26, suggestedPrinciples: [5, 4, 11] }, // latency vs perf overhead

  // ── Data Consistency (2) improved ──────────────────────────────
  { improvingParam: 2, worseningParam: 1, suggestedPrinciples: [3, 12, 14] }, // consistency vs latency
  { improvingParam: 2, worseningParam: 3, suggestedPrinciples: [3, 12, 6] },  // consistency vs throughput
  { improvingParam: 2, worseningParam: 4, suggestedPrinciples: [14, 9, 11] }, // consistency vs cost
  { improvingParam: 2, worseningParam: 6, suggestedPrinciples: [3, 12, 10] }, // consistency vs freshness
  { improvingParam: 2, worseningParam: 7, suggestedPrinciples: [14, 3, 6] },  // consistency vs scalability
  { improvingParam: 2, worseningParam: 15, suggestedPrinciples: [13, 15, 6] }, // consistency vs dev velocity

  // ── Throughput (3) improved ────────────────────────────────────
  { improvingParam: 3, worseningParam: 1, suggestedPrinciples: [12, 1, 4] },  // throughput vs latency
  { improvingParam: 3, worseningParam: 2, suggestedPrinciples: [9, 3, 12] },  // throughput vs consistency
  { improvingParam: 3, worseningParam: 4, suggestedPrinciples: [11, 1, 8] },  // throughput vs cost
  { improvingParam: 3, worseningParam: 5, suggestedPrinciples: [1, 4, 12] },  // throughput vs query perf
  { improvingParam: 3, worseningParam: 9, suggestedPrinciples: [14, 7, 6] },  // throughput vs fault tolerance
  { improvingParam: 3, worseningParam: 10, suggestedPrinciples: [1, 6, 13] }, // throughput vs complexity
  { improvingParam: 3, worseningParam: 16, suggestedPrinciples: [13, 15, 10] }, // throughput vs code quality

  // ── Resource Cost (4) improved ─────────────────────────────────
  { improvingParam: 4, worseningParam: 1, suggestedPrinciples: [4, 9, 5] },   // cost vs latency
  { improvingParam: 4, worseningParam: 3, suggestedPrinciples: [8, 11, 1] },  // cost vs throughput
  { improvingParam: 4, worseningParam: 5, suggestedPrinciples: [4, 11, 9] },  // cost vs query performance
  { improvingParam: 4, worseningParam: 7, suggestedPrinciples: [11, 8, 1] },  // cost vs scalability
  { improvingParam: 4, worseningParam: 9, suggestedPrinciples: [11, 9, 7] },  // cost vs fault tolerance
  { improvingParam: 4, worseningParam: 17, suggestedPrinciples: [11, 5, 8] }, // cost vs model accuracy
  { improvingParam: 4, worseningParam: 25, suggestedPrinciples: [8, 11, 1] }, // cost vs observability

  // ── Query Performance (5) improved ─────────────────────────────
  { improvingParam: 5, worseningParam: 1, suggestedPrinciples: [4, 3, 14] },  // query perf vs latency
  { improvingParam: 5, worseningParam: 2, suggestedPrinciples: [3, 4, 9] },   // query perf vs consistency
  { improvingParam: 5, worseningParam: 4, suggestedPrinciples: [4, 11, 5] },  // query perf vs cost
  { improvingParam: 5, worseningParam: 6, suggestedPrinciples: [4, 12, 3] },  // query perf vs data freshness
  { improvingParam: 5, worseningParam: 10, suggestedPrinciples: [4, 1, 6] },  // query perf vs complexity
  { improvingParam: 5, worseningParam: 16, suggestedPrinciples: [13, 4, 15] }, // query perf vs code quality
  { improvingParam: 5, worseningParam: 22, suggestedPrinciples: [4, 13, 11] }, // query perf vs maintenance
  { improvingParam: 5, worseningParam: 29, suggestedPrinciples: [3, 13, 9] }, // query perf vs schema rigidity

  // ── Data Freshness (6) improved ────────────────────────────────
  { improvingParam: 6, worseningParam: 2, suggestedPrinciples: [12, 3, 9] },  // freshness vs consistency
  { improvingParam: 6, worseningParam: 4, suggestedPrinciples: [12, 8, 11] }, // freshness vs cost
  { improvingParam: 6, worseningParam: 5, suggestedPrinciples: [12, 4, 8] },  // freshness vs query performance
  { improvingParam: 6, worseningParam: 10, suggestedPrinciples: [12, 6, 1] }, // freshness vs complexity
  { improvingParam: 6, worseningParam: 26, suggestedPrinciples: [12, 8, 9] }, // freshness vs perf overhead

  // ── Horizontal Scalability (7) improved ────────────────────────
  { improvingParam: 7, worseningParam: 2, suggestedPrinciples: [3, 9, 12] },  // scalability vs consistency
  { improvingParam: 7, worseningParam: 4, suggestedPrinciples: [11, 8, 1] },  // scalability vs cost
  { improvingParam: 7, worseningParam: 10, suggestedPrinciples: [1, 6, 13] }, // scalability vs complexity
  { improvingParam: 7, worseningParam: 16, suggestedPrinciples: [13, 15, 1] }, // scalability vs code quality
  { improvingParam: 7, worseningParam: 24, suggestedPrinciples: [3, 12, 9] }, // scalability vs sync
  { improvingParam: 7, worseningParam: 27, suggestedPrinciples: [1, 13, 6] }, // scalability vs multi-tenancy

  // ── Predictable Costs (8) improved ─────────────────────────────
  { improvingParam: 8, worseningParam: 1, suggestedPrinciples: [4, 9, 8] },   // predictable costs vs latency
  { improvingParam: 8, worseningParam: 3, suggestedPrinciples: [8, 11, 9] },  // predictable costs vs throughput
  { improvingParam: 8, worseningParam: 7, suggestedPrinciples: [8, 11, 1] },  // predictable costs vs scalability

  // ── Fault Tolerance (9) improved ───────────────────────────────
  { improvingParam: 9, worseningParam: 1, suggestedPrinciples: [14, 7, 9] },  // fault tol vs latency
  { improvingParam: 9, worseningParam: 3, suggestedPrinciples: [14, 7, 1] },  // fault tol vs throughput
  { improvingParam: 9, worseningParam: 4, suggestedPrinciples: [11, 7, 9] },  // fault tol vs cost
  { improvingParam: 9, worseningParam: 10, suggestedPrinciples: [7, 6, 15] }, // fault tol vs complexity
  { improvingParam: 9, worseningParam: 15, suggestedPrinciples: [7, 10, 15] }, // fault tol vs dev velocity

  // ── Infrastructure Complexity (10) improved ────────────────────
  { improvingParam: 10, worseningParam: 1, suggestedPrinciples: [13, 5, 4] }, // reduce complexity vs latency
  { improvingParam: 10, worseningParam: 7, suggestedPrinciples: [13, 1, 6] }, // reduce complexity vs scalability
  { improvingParam: 10, worseningParam: 9, suggestedPrinciples: [7, 13, 15] }, // reduce complexity vs fault tol

  // ── Authentication Strength (11) improved ──────────────────────
  { improvingParam: 11, worseningParam: 1, suggestedPrinciples: [4, 6, 5] },  // auth strength vs latency
  { improvingParam: 11, worseningParam: 12, suggestedPrinciples: [8, 6, 13] }, // auth strength vs user friction
  { improvingParam: 11, worseningParam: 15, suggestedPrinciples: [13, 6, 15] }, // auth strength vs dev velocity

  // ── User Friction (12) improved ────────────────────────────────
  { improvingParam: 12, worseningParam: 11, suggestedPrinciples: [8, 6, 13] }, // reduce friction vs auth strength
  { improvingParam: 12, worseningParam: 20, suggestedPrinciples: [2, 8, 6] }, // reduce friction vs privacy

  // ── Feature Completeness (13) improved ─────────────────────────
  { improvingParam: 13, worseningParam: 14, suggestedPrinciples: [15, 8, 9] }, // completeness vs UX simplicity
  { improvingParam: 13, worseningParam: 15, suggestedPrinciples: [1, 13, 15] }, // completeness vs dev velocity
  { improvingParam: 13, worseningParam: 22, suggestedPrinciples: [1, 15, 13] }, // completeness vs maintenance

  // ── UX Simplicity (14) improved ────────────────────────────────
  { improvingParam: 14, worseningParam: 13, suggestedPrinciples: [9, 8, 15] }, // simplicity vs completeness
  { improvingParam: 14, worseningParam: 28, suggestedPrinciples: [8, 13, 15] }, // simplicity vs customization

  // ── Development Velocity (15) improved ─────────────────────────
  { improvingParam: 15, worseningParam: 9, suggestedPrinciples: [10, 7, 15] }, // velocity vs fault tolerance
  { improvingParam: 15, worseningParam: 10, suggestedPrinciples: [13, 1, 6] }, // velocity vs complexity
  { improvingParam: 15, worseningParam: 16, suggestedPrinciples: [10, 15, 13] }, // velocity vs quality
  { improvingParam: 15, worseningParam: 22, suggestedPrinciples: [15, 13, 11] }, // velocity vs maintenance
  { improvingParam: 15, worseningParam: 29, suggestedPrinciples: [13, 8, 12] }, // velocity vs schema rigidity

  // ── Code Quality (16) improved ─────────────────────────────────
  { improvingParam: 16, worseningParam: 15, suggestedPrinciples: [10, 15, 13] }, // quality vs velocity
  { improvingParam: 16, worseningParam: 4, suggestedPrinciples: [10, 13, 15] }, // quality vs cost
  { improvingParam: 16, worseningParam: 30, suggestedPrinciples: [10, 7, 15] }, // quality vs deploy frequency

  // ── Model Accuracy (17) improved ───────────────────────────────
  { improvingParam: 17, worseningParam: 4, suggestedPrinciples: [11, 8, 5] }, // accuracy vs cost
  { improvingParam: 17, worseningParam: 18, suggestedPrinciples: [5, 1, 9] }, // accuracy vs inference latency
  { improvingParam: 17, worseningParam: 19, suggestedPrinciples: [13, 14, 8] }, // accuracy vs training data
  { improvingParam: 17, worseningParam: 20, suggestedPrinciples: [2, 5, 13] }, // accuracy vs privacy

  // ── Inference Latency (18) improved ────────────────────────────
  { improvingParam: 18, worseningParam: 4, suggestedPrinciples: [5, 11, 4] }, // inference vs cost
  { improvingParam: 18, worseningParam: 17, suggestedPrinciples: [1, 9, 5] }, // inference vs accuracy

  // ── Training Data Volume (19) improved ─────────────────────────
  { improvingParam: 19, worseningParam: 4, suggestedPrinciples: [11, 8, 13] }, // training data vs cost
  { improvingParam: 19, worseningParam: 20, suggestedPrinciples: [2, 5, 13] }, // training data vs privacy

  // ── Privacy Preservation (20) improved ─────────────────────────
  { improvingParam: 20, worseningParam: 6, suggestedPrinciples: [2, 9, 6] },  // privacy vs data freshness
  { improvingParam: 20, worseningParam: 12, suggestedPrinciples: [8, 2, 6] }, // privacy vs user friction
  { improvingParam: 20, worseningParam: 17, suggestedPrinciples: [2, 5, 13] }, // privacy vs accuracy

  // ── API Surface Area (21) improved ─────────────────────────────
  { improvingParam: 21, worseningParam: 11, suggestedPrinciples: [6, 13, 2] }, // API surface vs auth strength
  { improvingParam: 21, worseningParam: 22, suggestedPrinciples: [13, 15, 1] }, // API surface vs maintenance

  // ── Maintenance Burden (22) improved ───────────────────────────
  { improvingParam: 22, worseningParam: 13, suggestedPrinciples: [1, 15, 13] }, // maintenance vs features
  { improvingParam: 22, worseningParam: 15, suggestedPrinciples: [15, 13, 10] }, // maintenance vs velocity

  // ── Offline Capability (23) improved ───────────────────────────
  { improvingParam: 23, worseningParam: 2, suggestedPrinciples: [3, 9, 12] },  // offline vs consistency
  { improvingParam: 23, worseningParam: 24, suggestedPrinciples: [3, 9, 10] }, // offline vs sync complexity

  // ── Sync Complexity (24) improved ──────────────────────────────
  { improvingParam: 24, worseningParam: 2, suggestedPrinciples: [9, 3, 12] }, // reduce sync complexity vs consistency
  { improvingParam: 24, worseningParam: 6, suggestedPrinciples: [12, 9, 4] }, // reduce sync complexity vs freshness

  // ── Observability Depth (25) improved ──────────────────────────
  { improvingParam: 25, worseningParam: 4, suggestedPrinciples: [11, 8, 1] }, // observability vs cost
  { improvingParam: 25, worseningParam: 26, suggestedPrinciples: [8, 11, 1] }, // observability vs perf overhead

  // ── Performance Overhead (26) improved ─────────────────────────
  { improvingParam: 26, worseningParam: 25, suggestedPrinciples: [8, 11, 1] }, // reduce overhead vs observability
  { improvingParam: 26, worseningParam: 11, suggestedPrinciples: [4, 5, 6] }, // reduce overhead vs auth strength

  // ── Multi-tenancy Isolation (27) improved ──────────────────────
  { improvingParam: 27, worseningParam: 4, suggestedPrinciples: [1, 13, 11] }, // isolation vs cost
  { improvingParam: 27, worseningParam: 7, suggestedPrinciples: [1, 6, 13] }, // isolation vs scalability
  { improvingParam: 27, worseningParam: 10, suggestedPrinciples: [1, 6, 15] }, // isolation vs complexity

  // ── Customization Flexibility (28) improved ────────────────────
  { improvingParam: 28, worseningParam: 14, suggestedPrinciples: [8, 15, 13] }, // customization vs UX simplicity
  { improvingParam: 28, worseningParam: 22, suggestedPrinciples: [15, 13, 1] }, // customization vs maintenance

  // ── Schema Rigidity (29) improved ──────────────────────────────
  { improvingParam: 29, worseningParam: 5, suggestedPrinciples: [13, 3, 4] }, // schema rigidity vs query perf
  { improvingParam: 29, worseningParam: 15, suggestedPrinciples: [13, 8, 12] }, // schema rigidity vs dev velocity

  // ── Deployment Frequency (30) improved ─────────────────────────
  { improvingParam: 30, worseningParam: 9, suggestedPrinciples: [10, 7, 15] }, // deploy freq vs fault tolerance
  { improvingParam: 30, worseningParam: 16, suggestedPrinciples: [10, 15, 7] }, // deploy freq vs code quality
  { improvingParam: 30, worseningParam: 22, suggestedPrinciples: [10, 7, 11] }, // deploy freq vs maintenance
];

// ═══════════════════════════════════════════════════════════════════
// Helper: Look up principles for a given contradiction
// ═══════════════════════════════════════════════════════════════════
export function lookupContradiction(
  improvingId: number,
  worseningId: number
): SoftwareInventivePrinciple[] {
  const entry = CONTRADICTION_MATRIX.find(
    (e) => e.improvingParam === improvingId && e.worseningParam === worseningId
  );
  if (!entry) return [];
  return entry.suggestedPrinciples
    .map((pid) => SOFTWARE_PRINCIPLES.find((p) => p.id === pid))
    .filter((p): p is SoftwareInventivePrinciple => p !== undefined);
}

/** Get parameter by ID */
export function getParameterById(id: number): SoftwareParameter | undefined {
  return SOFTWARE_PARAMETERS.find((p) => p.id === id);
}

/** Get principle by ID */
export function getPrincipleById(id: number): SoftwareInventivePrinciple | undefined {
  return SOFTWARE_PRINCIPLES.find((p) => p.id === id);
}

/** Get all parameter categories for grouping */
export function getParametersByCategory(): Record<string, SoftwareParameter[]> {
  const groups: Record<string, SoftwareParameter[]> = {};
  for (const param of SOFTWARE_PARAMETERS) {
    if (!groups[param.category]) groups[param.category] = [];
    groups[param.category].push(param);
  }
  return groups;
}
