export type Txn = {
  id: string;
  merchant: string;
  category: string;
  city: string;
  date: string;
  amount: number;
  currency: string;
  converted: number;
};

export const transactions: Txn[] = [
  { id: "t1", merchant: "Sakura Ramen", category: "Food", city: "Tokyo", date: "12 Jul 2026", amount: 3400, currency: "JPY", converted: 20.1 },
  { id: "t2", merchant: "JR Rail Pass", category: "Transport", city: "Tokyo", date: "11 Jul 2026", amount: 29650, currency: "JPY", converted: 175.4 },
  { id: "t3", merchant: "Hotel Kanra", category: "Stay", city: "Kyoto", date: "10 Jul 2026", amount: 41200, currency: "JPY", converted: 243.7 },
  { id: "t4", merchant: "Blue Bottle Coffee", category: "Food", city: "Kyoto", date: "10 Jul 2026", amount: 980, currency: "JPY", converted: 5.8 },
  { id: "t5", merchant: "Teamlab Planets", category: "Activity", city: "Tokyo", date: "09 Jul 2026", amount: 4800, currency: "JPY", converted: 28.4 },
  { id: "t6", merchant: "Don Quijote", category: "Shopping", city: "Osaka", date: "08 Jul 2026", amount: 12300, currency: "JPY", converted: 72.8 },
  { id: "t7", merchant: "Airport Taxi", category: "Transport", city: "Osaka", date: "07 Jul 2026", amount: 8600, currency: "JPY", converted: 50.9 },
];

export const spendByCategory = [
  { name: "Stay", value: 243.7, color: "var(--color-chart-1)" },
  { name: "Transport", value: 226.3, color: "var(--color-chart-2)" },
  { name: "Food", value: 125.9, color: "var(--color-chart-3)" },
  { name: "Shopping", value: 72.8, color: "var(--color-chart-4)" },
  { name: "Activity", value: 28.4, color: "var(--color-chart-5)" },
];

export const spendTrend = [
  { day: "Mon", spend: 62 },
  { day: "Tue", spend: 118 },
  { day: "Wed", spend: 74 },
  { day: "Thu", spend: 156 },
  { day: "Fri", spend: 98 },
  { day: "Sat", spend: 184 },
  { day: "Sun", spend: 132 },
];

export const rates = [
  { pair: "EUR → JPY", rate: "169.24", change: "+0.42%", up: true },
  { pair: "EUR → USD", rate: "1.0842", change: "-0.18%", up: false },
  { pair: "EUR → GBP", rate: "0.8471", change: "+0.09%", up: true },
  { pair: "EUR → THB", rate: "39.61", change: "+0.65%", up: true },
];

export const currencies = ["EUR", "USD", "JPY", "GBP", "THB", "CHF", "AUD"];

export const notifications = [
  { id: "n1", title: "Receipt translated", body: "Sakura Ramen receipt is ready in History.", time: "2m ago", tone: "success" as const, unread: true },
  { id: "n2", title: "Rate alert", body: "EUR → JPY crossed your 168.00 target.", time: "1h ago", tone: "brand" as const, unread: true },
  { id: "n3", title: "Weekly budget", body: "You've used 78% of your Japan trip budget.", time: "5h ago", tone: "warning" as const, unread: false },
  { id: "n4", title: "New device sign-in", body: "MacBook Pro · Lisbon, Portugal.", time: "Yesterday", tone: "muted" as const, unread: false },
];
