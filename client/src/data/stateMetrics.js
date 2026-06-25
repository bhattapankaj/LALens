/** Chart and headline data — index/demo series unless labeled public source in UI. */

export const ENROLLMENT_TREND_INDEX = [
  { year: "2020", enrollmentIndex: 100, graduationContext: 96 },
  { year: "2021", enrollmentIndex: 99, graduationContext: 97 },
  { year: "2022", enrollmentIndex: 98, graduationContext: 98 },
  { year: "2023", enrollmentIndex: 97, graduationContext: 99 },
  { year: "2024", enrollmentIndex: 96, graduationContext: 100 },
  { year: "2025", enrollmentIndex: 98, graduationContext: 101 }
];

export const WORKFORCE_GAP_BY_SECTOR = [
  { sector: "Healthcare", gap: 25 },
  { sector: "Petrochemical", gap: 35 },
  { sector: "Information Technology", gap: 42 },
  { sector: "Advanced Manufacturing", gap: 38 },
  { sector: "Construction Trades", gap: 28 },
  { sector: "Education (Teachers)", gap: 22 }
];

export const INVESTMENT_FOCUS_MIX = [
  { name: "Teacher support", value: 32, color: "#14b8a6" },
  { name: "Facilities & infrastructure", value: 22, color: "#d97706" },
  { name: "Technology & resources", value: 18, color: "#ef4444" },
  { name: "Special education", value: 16, color: "#8b5cf6" },
  { name: "Student services", value: 12, color: "#22c55e" }
];

/** Platform KPI strip — mix of public facts and catalog metadata */
export const PLATFORM_KPI_CARDS = [
  { key: "mapped", value: "64", label: "Parishes mapped", hint: "Public geography layer", badge: "public" },
  { key: "sample", value: "64", label: "Parishes scored", hint: "Prototype model", badge: "model" },
  { key: "mastery", value: "35%", label: "Grades 3–8 Mastery+", hint: "LDOE public source", badge: "public", trend: "2024–2025" },
  { key: "grad", value: "83%+", label: "Graduation rate", hint: "LDOE public source", badge: "public", trend: "2022–2023" },
  { key: "health", value: "320K", label: "Healthcare workers", hint: "LWC public source", badge: "public", trend: "State employer scale" },
  { key: "factors", value: "5", label: "Score factors", hint: "Transparent model", badge: "model" }
];
