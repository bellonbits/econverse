export interface Player {
  id: string;
  name: string;
  age: number;
  country: string;
  education: string;
  money: number;
  savings: number;
  debt: number;
  happiness: number;
  health: number;
  educationLevel: number;
  reputation: number;
  netWorth: number;
  employment: string;
  salary: number;
  gameDay: number;
  skills?: PlayerSkill[];
}

export interface PlayerSkill {
  id: string;
  name: string;
  level: number;
  category: string;
}

export interface Economy {
  id: string;
  gdp: number;
  gdpGrowth: number;
  inflation: number;
  unemployment: number;
  interestRate: number;
  populationGrowth: number;
  consumerConfidence: number;
  stockMarketIndex: number;
  housingIndex: number;
  taxRevenue: number;
  governmentSpending: number;
  tradeBalance: number;
  gameDay: number;
}

export interface Business {
  id: string;
  playerId: string;
  name: string;
  category: BusinessCategory;
  revenue: number;
  expenses: number;
  profit: number;
  cashFlow: number;
  customers: number;
  inventory: number;
  level: number;
  isActive: boolean;
  price: number;
  demand: number;
  startCost: number;
  employees?: Employee[];
  createdAt: string;
}

export type BusinessCategory =
  | "grocery"
  | "clothing"
  | "electronics"
  | "restaurant"
  | "tech_startup"
  | "logistics"
  | "marketplace"
  | "manufacturing";

export interface Employee {
  id: string;
  businessId: string;
  name: string;
  role: string;
  skillLevel: number;
  salary: number;
  productivity: number;
  motivation: number;
  experience: number;
}

export interface Property {
  id: string;
  playerId: string;
  name: string;
  type: PropertyType;
  purchasePrice: number;
  currentValue: number;
  monthlyRent: number;
  isRented: boolean;
  city: string;
}

export type PropertyType = "house" | "apartment" | "commercial" | "land";

export interface Investment {
  id: string;
  playerId: string;
  type: InvestmentType;
  symbol: string;
  name: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export type InvestmentType = "stock" | "etf" | "bond" | "startup" | "commodity";

export interface Loan {
  id: string;
  playerId: string;
  type: LoanType;
  amount: number;
  remaining: number;
  interestRate: number;
  monthlyPayment: number;
  termMonths: number;
  paidMonths: number;
  isPaid: boolean;
}

export type LoanType = "personal" | "mortgage" | "business" | "student";

export interface BankAccount {
  id: string;
  playerId: string;
  type: AccountType;
  balance: number;
  interestRate: number;
}

export type AccountType = "checking" | "savings" | "money_market";

export interface Transaction {
  id: string;
  playerId: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  balance: number;
  gameDay: number;
  createdAt: string;
}

export type TransactionType =
  | "income"
  | "expense"
  | "investment"
  | "loan"
  | "tax"
  | "rent"
  | "salary"
  | "transfer"
  | "business"
  | "interest";

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  type: string;
  price: number;
  previousPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  impacts: EventImpact[];
  severity: number;
  gameDay: number;
  isActive: boolean;
}

export type EventType =
  | "recession"
  | "boom"
  | "crash"
  | "pandemic"
  | "drought"
  | "tech_boom"
  | "housing_boom"
  | "policy_change"
  | "trade_war"
  | "natural_disaster";

export interface EventImpact {
  metric: string;
  change: number;
  description: string;
}

export interface Government {
  id: string;
  incomeTaxRate: number;
  businessTaxRate: number;
  salesTaxRate: number;
  propertyTaxRate: number;
  totalRevenue: number;
  totalSpending: number;
  deficit: number;
  infrastructureScore: number;
}

export interface DailyExpenses {
  food: number;
  rent: number;
  transportation: number;
  utilities: number;
  healthcare: number;
  entertainment: number;
  total: number;
}

export interface CareerPath {
  id: string;
  title: string;
  category: string;
  baseSalary: number;
  growthRate: number;
  stressLevel: number;
  demandLevel: number;
  requiredEducation: string;
  requiredSkills: string[];
  promotionPaths: string[];
  description: string;
}

export interface MentorMessage {
  id: string;
  trigger: string;
  title: string;
  explanation: string;
  principle: string;
  example: string;
  timestamp: number;
}

export interface Citizen {
  id: string;
  name: string;
  age: number;
  income: number;
  expenses: number;
  savings: number;
  employment: string;
  happiness: number;
  posX: number;
  posZ: number;
}

export interface CityStats {
  totalBuildings: number;
  totalCitizens: number;
  businessDistrict: number;
  residentialArea: number;
  industrialZone: number;
  economicHealth: number;
}

export interface NetWorthHistory {
  day: number;
  netWorth: number;
  cash: number;
  investments: number;
  businessValue: number;
  propertyValue: number;
  debt: number;
}
