import { EventType, GameEvent, EventImpact } from "@/types/game";

interface EventTemplate {
  type: EventType;
  title: string;
  description: string;
  severity: number;
  probability: number; // per 100 days
  impacts: EventImpact[];
  duration: number; // days active
  mentorExplanation: string;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    type: "recession",
    title: "Economic Recession Hits",
    description: "The economy is contracting. GDP is shrinking, unemployment is rising, and consumer spending is falling.",
    severity: 5,
    probability: 3,
    impacts: [
      { metric: "gdp", change: -3, description: "GDP contracts sharply" },
      { metric: "unemployment", change: 3, description: "Job losses accelerate" },
      { metric: "confidence", change: -20, description: "Consumer confidence plunges" },
      { metric: "inflation", change: -1, description: "Prices may fall (deflation risk)" },
    ],
    duration: 180,
    mentorExplanation: "A recession is defined as two consecutive quarters of negative GDP growth. During recessions, businesses earn less, unemployment rises, and people spend less — creating a vicious cycle. This is why governments and central banks use fiscal and monetary policy to fight recessions.",
  },
  {
    type: "boom",
    title: "Economic Boom Begins",
    description: "The economy is booming! Record employment, rising wages, and strong consumer spending.",
    severity: 3,
    probability: 5,
    impacts: [
      { metric: "gdp", change: 4, description: "GDP surges" },
      { metric: "unemployment", change: -2, description: "Jobs are plentiful" },
      { metric: "confidence", change: 25, description: "Consumer confidence soars" },
      { metric: "inflation", change: 1.5, description: "Higher demand pushes prices up" },
    ],
    duration: 365,
    mentorExplanation: "Economic booms are periods of rapid growth. More jobs mean more spending, which creates more jobs — a virtuous cycle. However, booms often lead to inflation as demand exceeds supply, eventually requiring central banks to raise interest rates.",
  },
  {
    type: "crash",
    title: "Stock Market Crash",
    description: "Markets are in freefall. Panic selling has wiped out trillions in market value.",
    severity: 5,
    probability: 2,
    impacts: [
      { metric: "confidence", change: -30, description: "Confidence collapses" },
      { metric: "gdp", change: -2, description: "Wealth destruction hurts spending" },
      { metric: "unemployment", change: 1.5, description: "Financial sector layoffs" },
    ],
    duration: 90,
    mentorExplanation: "Market crashes are often triggered by panic and overleveraging — investors borrowed too much and are forced to sell. The key lesson: don't invest money you need short-term in volatile assets. Market crashes historically recover, rewarding patient, long-term investors.",
  },
  {
    type: "tech_boom",
    title: "Tech Sector Boom",
    description: "A wave of technological innovation is driving productivity gains and economic growth.",
    severity: 2,
    probability: 6,
    impacts: [
      { metric: "gdp", change: 2, description: "Innovation boosts productivity" },
      { metric: "unemployment", change: -1, description: "Tech jobs surge" },
      { metric: "confidence", change: 15, description: "Optimism rises" },
    ],
    duration: 200,
    mentorExplanation: "Technology booms drive what economists call 'supply-side growth' — innovation improves productivity, allowing more output with the same input. This is non-inflationary growth, which is why central banks welcome tech-driven GDP growth.",
  },
  {
    type: "pandemic",
    title: "Global Health Crisis",
    description: "A pandemic has disrupted supply chains, closed businesses, and caused economic uncertainty.",
    severity: 6,
    probability: 1,
    impacts: [
      { metric: "gdp", change: -5, description: "Economic activity collapses" },
      { metric: "unemployment", change: 6, description: "Mass job losses" },
      { metric: "confidence", change: -40, description: "Fear drives spending collapse" },
      { metric: "inflation", change: 2, description: "Supply disruptions raise prices" },
    ],
    duration: 365,
    mentorExplanation: "Pandemics cause both supply shocks (businesses can't operate) and demand shocks (people stop spending). This is economically devastating because traditional solutions don't work — you can't solve supply problems with stimulus alone.",
  },
  {
    type: "housing_boom",
    title: "Housing Market Surge",
    description: "Property values are skyrocketing. Homeowners are getting richer but buyers are struggling.",
    severity: 2,
    probability: 5,
    impacts: [
      { metric: "confidence", change: 10, description: "Homeowners feel wealthier" },
      { metric: "inflation", change: 0.8, description: "Construction costs rise" },
    ],
    duration: 180,
    mentorExplanation: "Housing booms create a 'wealth effect' — homeowners feel richer and spend more, boosting GDP. But rising housing costs hurt renters and first-time buyers, increasing inequality. This illustrates how asset inflation can diverge from wage growth.",
  },
  {
    type: "policy_change",
    title: "Government Tax Reform",
    description: "Major tax policy changes are reshaping incentives for businesses and individuals.",
    severity: 3,
    probability: 4,
    impacts: [
      { metric: "gdp", change: 1, description: "Business investment responds" },
      { metric: "confidence", change: 5, description: "Certainty improves planning" },
    ],
    duration: 365,
    mentorExplanation: "Tax policy directly shapes economic behavior. Lower business taxes can incentivize investment; lower income taxes boost consumer spending. This is fiscal policy — governments use taxation and spending to steer the economy.",
  },
  {
    type: "trade_war",
    title: "International Trade Tensions",
    description: "Rising tariffs and trade barriers are disrupting global supply chains and raising costs.",
    severity: 4,
    probability: 3,
    impacts: [
      { metric: "gdp", change: -1.5, description: "Trade restrictions hurt efficiency" },
      { metric: "inflation", change: 1.2, description: "Imported goods become expensive" },
      { metric: "confidence", change: -10, description: "Uncertainty dampens investment" },
    ],
    duration: 180,
    mentorExplanation: "Trade wars illustrate comparative advantage: countries benefit from trading goods they produce most efficiently. Tariffs protect some domestic jobs but raise prices for consumers and hurt export industries — creating winners and losers.",
  },
  {
    type: "natural_disaster",
    title: "Natural Disaster Strikes Region",
    description: "A major disaster has disrupted economic activity and required massive relief spending.",
    severity: 4,
    probability: 3,
    impacts: [
      { metric: "gdp", change: -1, description: "Destruction of productive capacity" },
      { metric: "unemployment", change: 1, description: "Business disruption" },
      { metric: "confidence", change: -8, description: "Uncertainty rises" },
      { metric: "inflation", change: 0.5, description: "Reconstruction demand" },
    ],
    duration: 120,
    mentorExplanation: "Natural disasters destroy capital stock — the physical assets an economy uses to produce goods. Recovery spending (reconstruction) can stimulate short-term activity but represents rebuilding what was lost, not creating new wealth.",
  },
];

export function generateRandomEvent(gameDay: number, currentEconomy: { gdpGrowth: number; unemployment: number }): EventTemplate | null {
  // Increase recession probability during economic weakness
  const adjustedTemplates = EVENT_TEMPLATES.map((t) => {
    let prob = t.probability;
    if (t.type === "recession" && currentEconomy.gdpGrowth < 1) prob *= 2;
    if (t.type === "recession" && currentEconomy.unemployment > 8) prob *= 1.5;
    if (t.type === "boom" && currentEconomy.gdpGrowth > 3) prob *= 1.5;
    return { ...t, probability: prob };
  });

  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const template of adjustedTemplates) {
    cumulative += template.probability;
    if (roll < cumulative) {
      return template;
    }
  }

  return null;
}

export function createGameEvent(template: EventTemplate, gameDay: number): Omit<GameEvent, "id"> {
  return {
    type: template.type,
    title: template.title,
    description: template.description,
    impacts: template.impacts,
    severity: template.severity,
    gameDay,
    isActive: true,
  };
}

export function getMentorExplanation(eventType: EventType): string {
  const template = EVENT_TEMPLATES.find((t) => t.type === eventType);
  return template?.mentorExplanation ?? "Economic events shape the financial landscape for everyone.";
}

export function getEconomicPrinciple(action: string): {
  title: string;
  explanation: string;
  principle: string;
} {
  const principles: Record<string, { title: string; explanation: string; principle: string }> = {
    save_money: {
      title: "The Power of Saving",
      explanation: "You've put money into savings. Saving is the foundation of wealth building — money saved is money available for investment and emergencies.",
      principle: "Pay Yourself First: Save before you spend, not after.",
    },
    take_loan: {
      title: "Leverage & Debt",
      explanation: "Borrowing money can amplify your results. If you invest borrowed money at a higher return than the interest rate, you profit. But debt also amplifies losses.",
      principle: "Leverage is a double-edged sword — use it for assets, not liabilities.",
    },
    start_business: {
      title: "Entrepreneurship & Risk",
      explanation: "Starting a business means taking calculated risk. You're betting that you can create more value than your costs — the profit motive drives economic growth.",
      principle: "Entrepreneurs are the economy's engines — they turn risk into opportunity.",
    },
    hire_employee: {
      title: "Labor Markets",
      explanation: "You just created a job. Employees trade their time and skills for wages. The wage you pay is set by supply and demand for that skill level.",
      principle: "Labor is a factor of production — alongside capital and land.",
    },
    raise_price: {
      title: "Law of Demand",
      explanation: "Raising prices typically reduces demand — customers buy less when things cost more. Finding the optimal price that maximizes revenue is called price optimization.",
      principle: "As price increases, quantity demanded decreases — this is the Law of Demand.",
    },
    lower_price: {
      title: "Price Elasticity",
      explanation: "Lowering prices increases demand. Whether this increases total revenue depends on price elasticity — how sensitive customers are to price changes.",
      principle: "Price elasticity measures how demand responds to price changes.",
    },
    buy_property: {
      title: "Real Estate & Appreciation",
      explanation: "Real estate historically appreciates over time, driven by scarcity, population growth, and inflation. Property generates both equity growth and rental income.",
      principle: "Real estate benefits from location, scarcity, and the leverage of mortgages.",
    },
    invest_stocks: {
      title: "Compound Growth",
      explanation: "Stock market investments compound over time — gains generate more gains. Over decades, the power of compounding turns small investments into large wealth.",
      principle: "Compound interest is the eighth wonder of the world — Einstein (attributed).",
    },
    pay_tax: {
      title: "Taxation & Public Goods",
      explanation: "Taxes fund roads, schools, police, and national defense — public goods the market underproduces. Your taxes contribute to the infrastructure that makes business possible.",
      principle: "Taxes are the price of civilization — and smart tax planning is legal and important.",
    },
    study: {
      title: "Human Capital Investment",
      explanation: "Education is an investment in yourself — human capital. Higher education typically leads to higher lifetime earnings, though it takes time to see returns.",
      principle: "Human capital is your most important asset — invest in it continuously.",
    },
  };

  return principles[action] ?? {
    title: "Economic Insight",
    explanation: "Every financial decision has consequences that ripple through the economy.",
    principle: "Understanding economics helps you make better financial decisions.",
  };
}
