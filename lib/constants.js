// ═══════════════════════════════════════════════════════════════════
// ENGINEERING INTEREST TAGS
// ═══════════════════════════════════════════════════════════════════
export const INTEREST_CATEGORIES = {
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
      "Microservices", "DevOps", "CI/CD", "Edge-Cloud Hybrid",
      "Distributed Systems", "API Design",
    ],
  },
  Quantum: {
    color: "#ec4899",
    tags: [
      "Quantum Computing", "Quantum ML", "Quantum Cryptography",
      "Quantum Simulation", "Quantum Error Correction", "NISQ Algorithms",
    ],
  },
  "Security & Crypto": {
    color: "#ef4444",
    tags: [
      "Encryption", "Zero-Knowledge Proofs", "Homomorphic Encryption",
      "Blockchain", "Cybersecurity", "Post-Quantum Crypto",
      "Secure Multi-Party Computation",
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
    ],
  },
  "Product & Strategy": {
    color: "#f97316",
    tags: [
      "Product Management", "UX Research", "Patent Strategy", "IP Landscape",
      "Market Analysis", "Prior Art Research", "Technical Writing",
    ],
  },
};

export const ALL_INTERESTS = Object.entries(INTEREST_CATEGORIES).flatMap(
  ([cat, { tags }]) =>
    tags.map((t) => ({
      tag: t,
      category: cat,
      color: INTEREST_CATEGORIES[cat].color,
    }))
);

// ═══════════════════════════════════════════════════════════════════
// FRAMEWORKS DATA (from the patent workshop)
// ═══════════════════════════════════════════════════════════════════
export const TRIZ_PRINCIPLES = [
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

export const SIT_TEMPLATES = [
  { id: "subtraction", name: "Subtraction", icon: "➖", prompt: "What if we REMOVED a seemingly essential component?", example: "Remove thermostat display → Voice/app-only control" },
  { id: "division", name: "Division", icon: "✂️", prompt: "What if we SEPARATED and RELOCATED a function?", example: "Split auth from lock → Phone becomes key" },
  { id: "multiplication", name: "Multiplication", icon: "✖️", prompt: "What if we COPIED a component with modification?", example: "Multiple temp sensors → Multi-zone awareness" },
  { id: "task_unification", name: "Task Unification", icon: "🔗", prompt: "What if an existing component took on ADDITIONAL function?", example: "Occupancy sensor → Also controls HVAC + security" },
  { id: "attr_dependency", name: "Attribute Dependency", icon: "↔️", prompt: "What if we LINKED two previously unlinked variables?", example: "Light color ↔ Time of day → Circadian support" },
];

export const CK_PROMPTS = {
  concept: "What ideas can we imagine that we CANNOT yet prove true or false?",
  knowledge: "What do we KNOW to be true? What's proven, emerging, or a gap?",
  expansion: "Where do concepts meet knowledge gaps? That's your patent opportunity.",
};

export const SPRINT_PHASES = [
  { key: "foundation", label: "Foundation", weeks: "1–4", target: "20 raw concepts", color: "#f59e0b", icon: "◈" },
  { key: "validation", label: "Validation", weeks: "5–12", target: "10 validated ideas", color: "#3b82f6", icon: "◉" },
  { key: "filing", label: "Filing", weeks: "13–30", target: "5 filed patents", color: "#10b981", icon: "▶" },
];

export const PATENT_MATRIX = [
  {
    key: "inventive_step", label: "Inventive Step", icon: "⚡",
    levels: [
      { score: 1, label: "Weak", desc: "2–3× improvement over prior art" },
      { score: 2, label: "Moderate", desc: "5–10× improvement or new capability" },
      { score: 3, label: "Strong", desc: "10×+ or enables the impossible" },
    ],
  },
  {
    key: "defensibility", label: "Defensibility", icon: "🛡️",
    levels: [
      { score: 1, label: "Weak", desc: "Obvious combination of known techniques" },
      { score: 2, label: "Moderate", desc: "Non-obvious but similar approaches exist" },
      { score: 3, label: "Strong", desc: "Novel mechanism with no clear workaround" },
    ],
  },
  {
    key: "product_fit", label: "Product-Fit", icon: "🎯",
    levels: [
      { score: 1, label: "Weak", desc: "Nice-to-have, no roadmap commitment" },
      { score: 2, label: "Moderate", desc: "Aligns with roadmap, 12–24 month horizon" },
      { score: 3, label: "Strong", desc: "Critical differentiator, competitors will copy" },
    ],
  },
];

export const SESSION_MODES = [
  { key: "quantity", label: "Quantity", icon: "🌊", color: "#3b82f6", rules: ["No criticism allowed", 'No "but" or "however"', "Wild ideas encouraged", "Build on others' ideas", "Defer ALL judgment"], target: "50+ ideas" },
  { key: "quality", label: "Quality", icon: "⚖️", color: "#f59e0b", rules: ["Constructive criticism OK", "Use 3×3 scoring matrix", "Debate pros and cons", "Prioritize top 20%", "Document reasoning"], target: "Top 10" },
  { key: "destroy", label: "Destroy", icon: "💀", color: "#ef4444", rules: ["Attack mercilessly", '"This will fail because…"', "Find every weakness", "No sacred cows", "Survivors get filed"], target: "5 patent-ready" },
];
