import type {
  InterestCategory,
  InterestTag,
  TRIZPrinciple,
  SITTemplate,
  CKPrompts,
  SprintPhaseConfig,
  PatentMatrixDimension,
  SessionModeConfig,
} from "./types";

// ═══════════════════════════════════════════════════════════════════
// ENGINEERING INTEREST TAGS
// ═══════════════════════════════════════════════════════════════════
export const INTEREST_CATEGORIES: Record<string, InterestCategory> = {
  "AI & ML": {
    color: "#8b5cf6",
    tags: [
      "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
      "Reinforcement Learning", "Generative AI", "Federated Learning",
      "MLOps", "Neural Architecture", "Transfer Learning", "GANs", "Transformers",
    ],
  },
  "Cloud & Infra": {
    color: "#3b82f6",
    tags: [
      "Cloud Architecture", "Cloud Security", "Kubernetes", "Serverless",
      "Microservices", "Edge-Cloud Hybrid", "Distributed Systems",
      "API Design", "Service Mesh", "Multi-Cloud",
    ],
  },
  "DevOps & Platform": {
    color: "#0ea5e9",
    tags: [
      "CI/CD", "Terraform", "Ansible", "GitOps",
      "SRE", "Observability", "Infrastructure as Code",
      "Container Orchestration", "Chaos Engineering", "Feature Flags",
    ],
  },
  "Frontend & Mobile": {
    color: "#a855f7",
    tags: [
      "React", "React Native", "Flutter", "Swift/iOS",
      "Android/Kotlin", "WebAssembly", "Progressive Web Apps",
      "Accessibility", "Design Systems", "Performance Optimization",
    ],
  },
  "Databases & Storage": {
    color: "#14b8a6",
    tags: [
      "PostgreSQL", "Redis", "Cassandra", "Graph Databases",
      "Time-Series DBs", "Vector Databases", "Data Lakes",
      "Object Storage", "NewSQL", "Database Sharding",
    ],
  },
  "Networking & Protocols": {
    color: "#6366f1",
    tags: [
      "HTTP/3", "gRPC", "WebSocket", "GraphQL",
      "Software-Defined Networking", "Service Mesh", "Protocol Buffers",
      "API Gateway", "CDN Architecture", "DNS Engineering",
    ],
  },
  "Security & Crypto": {
    color: "#ef4444",
    tags: [
      "Encryption", "Zero-Knowledge Proofs", "Homomorphic Encryption",
      "Blockchain", "Cybersecurity", "Post-Quantum Crypto",
      "Secure Multi-Party Computation", "Identity & Access Management",
    ],
  },
  Quantum: {
    color: "#ec4899",
    tags: [
      "Quantum Computing", "Quantum ML", "Quantum Cryptography",
      "Quantum Simulation", "Quantum Error Correction", "NISQ Algorithms",
    ],
  },
  "IoT & Edge": {
    color: "#f59e0b",
    tags: [
      "IoT Systems", "Edge Computing", "Embedded Systems", "Sensor Fusion",
      "NILM", "Smart Home", "Mesh Networks", "MQTT/CoAP",
    ],
  },
  "Energy & Power": {
    color: "#10b981",
    tags: [
      "Power Systems", "Demand Response", "HVAC Optimization", "Grid Analytics",
      "Battery/Storage", "Renewables", "Load Disaggregation", "Virtual Power Plants",
    ],
  },
  "Data & Analytics": {
    color: "#06b6d4",
    tags: [
      "Data Engineering", "Data Science", "Signal Processing", "Time Series",
      "Anomaly Detection", "Real-time Analytics", "Data Pipelines",
      "ETL/ELT", "Data Governance", "Business Intelligence",
    ],
  },
  "Hardware & Embedded": {
    color: "#78716c",
    tags: [
      "FPGA", "ASIC Design", "RISC-V", "Firmware Development",
      "PCB Design", "Hardware-Software Co-design", "Robotics",
      "3D Printing", "Chip Architecture",
    ],
  },
  "Compliance & Legal Tech": {
    color: "#dc2626",
    tags: [
      "GDPR", "HIPAA", "SOC 2", "IP Law",
      "Privacy Engineering", "Regulatory Compliance", "Data Residency",
      "Audit Automation", "Risk Assessment",
    ],
  },
  "Sustainability & Green Tech": {
    color: "#16a34a",
    tags: [
      "Carbon Accounting", "Green Computing", "Circular Design",
      "Energy-Efficient Algorithms", "Sustainable Infrastructure",
      "ESG Reporting", "Carbon-Aware Computing",
    ],
  },
  "Business & Strategy": {
    color: "#f97316",
    tags: [
      "Product Management", "UX Research", "Patent Strategy", "IP Landscape",
      "Market Analysis", "Prior Art Research", "Technical Writing",
      "Go-to-Market", "Pricing Strategy", "Product-Led Growth",
    ],
  },
};

export const ALL_INTERESTS: InterestTag[] = Object.entries(INTEREST_CATEGORIES).flatMap(
  ([cat, { tags, color }]) =>
    tags.map((t) => ({
      tag: t,
      category: cat,
      color,
    }))
);

// ═══════════════════════════════════════════════════════════════════
// FRAMEWORKS DATA
// ═══════════════════════════════════════════════════════════════════
export const TRIZ_PRINCIPLES: TRIZPrinciple[] = [
  { id: 1, name: "Segmentation", hint: "Microservices, modular components, divide into independent parts" },
  { id: 2, name: "Extraction", hint: "Separate the disturbing part or the necessary part from an object" },
  { id: 10, name: "Preliminary Action", hint: "Pre-caching, predictive loading, arrange objects in advance" },
  { id: 15, name: "Dynamicity", hint: "Adaptive algorithms, ML models, make object adaptable" },
  { id: 19, name: "Periodic Action", hint: "Scheduled vs. continuous polling, pulsed instead of continuous" },
  { id: 24, name: "Intermediary", hint: "API gateways, protocol bridges, use an intermediate carrier" },
  { id: 28, name: "Mechanics Substitution", hint: "Software-defined everything, replace mechanical with other fields" },
  { id: 35, name: "Parameter Changes", hint: "Dynamic rates, adaptive thresholds, change physical state" },
  { id: 40, name: "Composite Materials", hint: "Sensor fusion, multi-source data, composite structures" },
];

export const SIT_TEMPLATES: SITTemplate[] = [
  { id: "subtraction", name: "Subtraction", icon: "minus", prompt: "What if we REMOVED a seemingly essential component?", example: "Remove thermostat display -> Voice/app-only control" },
  { id: "division", name: "Division", icon: "scissors", prompt: "What if we SEPARATED and RELOCATED a function?", example: "Split auth from lock -> Phone becomes key" },
  { id: "multiplication", name: "Multiplication", icon: "copy", prompt: "What if we COPIED a component with modification?", example: "Multiple temp sensors -> Multi-zone awareness" },
  { id: "task_unification", name: "Task Unification", icon: "link", prompt: "What if an existing component took on ADDITIONAL function?", example: "Occupancy sensor -> Also controls HVAC + security" },
  { id: "attr_dependency", name: "Attribute Dependency", icon: "arrow-right-left", prompt: "What if we LINKED two previously unlinked variables?", example: "Light color <-> Time of day -> Circadian support" },
];

export const CK_PROMPTS: CKPrompts = {
  concept: "What ideas can we imagine that we CANNOT yet prove true or false?",
  knowledge: "What do we KNOW to be true? What's proven, emerging, or a gap?",
  expansion: "Where do concepts meet knowledge gaps? That's your patent opportunity.",
};

export const SPRINT_PHASES: SprintPhaseConfig[] = [
  { key: "foundation", label: "Foundation", weeks: "1-4", target: "20 raw concepts", targetCount: 20, color: "#f59e0b", icon: "diamond" },
  { key: "validation", label: "Validation", weeks: "5-12", target: "10 validated ideas", targetCount: 10, color: "#3b82f6", icon: "circle-dot" },
  { key: "filing", label: "Filing", weeks: "13-30", target: "5 filed patents", targetCount: 5, color: "#10b981", icon: "play" },
];

export const PATENT_MATRIX: PatentMatrixDimension[] = [
  {
    key: "inventiveStep", label: "Inventive Step", icon: "zap",
    levels: [
      { score: 1, label: "Weak", desc: "2-3x improvement over prior art" },
      { score: 2, label: "Moderate", desc: "5-10x improvement or new capability" },
      { score: 3, label: "Strong", desc: "10x+ or enables the impossible" },
    ],
  },
  {
    key: "defensibility", label: "Defensibility", icon: "shield",
    levels: [
      { score: 1, label: "Weak", desc: "Obvious combination of known techniques" },
      { score: 2, label: "Moderate", desc: "Non-obvious but similar approaches exist" },
      { score: 3, label: "Strong", desc: "Novel mechanism with no clear workaround" },
    ],
  },
  {
    key: "productFit", label: "Product-Fit", icon: "target",
    levels: [
      { score: 1, label: "Weak", desc: "Nice-to-have, no roadmap commitment" },
      { score: 2, label: "Moderate", desc: "Aligns with roadmap, 12-24 month horizon" },
      { score: 3, label: "Strong", desc: "Critical differentiator, competitors will copy" },
    ],
  },
];

export const SESSION_MODES: SessionModeConfig[] = [
  {
    key: "quantity", label: "Quantity", icon: "waves", color: "#3b82f6",
    rules: ["No criticism allowed", "No 'but' or 'however'", "Wild ideas encouraged", "Build on others' ideas", "Defer ALL judgment"],
    target: "50+ ideas",
  },
  {
    key: "quality", label: "Quality", icon: "scale", color: "#f59e0b",
    rules: ["Constructive criticism OK", "Use 3x3 scoring matrix", "Debate pros and cons", "Prioritize top 20%", "Document reasoning"],
    target: "Top 10",
  },
  {
    key: "destroy", label: "Destroy", icon: "skull", color: "#ef4444",
    rules: ["Attack mercilessly", "\"This will fail because...\"", "Find every weakness", "No sacred cows", "Survivors get filed"],
    target: "5 patent-ready",
  },
];

// ═══════════════════════════════════════════════════════════════════
// TECH STACK OPTIONS (for tag input)
// ═══════════════════════════════════════════════════════════════════
export const TECH_STACK_OPTIONS: string[] = [
  "Distributed Systems", "Kubernetes", "ML Inference", "Data Pipelines",
  "Cloud Architecture", "Serverless", "Edge Computing", "Microservices",
  "Real-time Systems", "Streaming", "Graph Databases", "Vector Databases",
  "LLMs", "Computer Vision", "NLP", "Reinforcement Learning",
  "Federated Learning", "Blockchain", "IoT", "MQTT",
  "gRPC", "GraphQL", "REST APIs", "WebSockets",
  "PostgreSQL", "Redis", "Kafka", "RabbitMQ",
  "Docker", "Terraform", "CI/CD", "Observability",
  "Authentication", "Encryption", "Zero-Trust", "API Gateway",
];
