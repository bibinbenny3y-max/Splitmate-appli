// data/initialData.js
// ---------------------------------------------------------------------------
// Seed data shipped with the app. On first launch this is loaded into
// AsyncStorage by storage.seedIfNeeded(); after that the app reads/writes
// the persisted copy. Keeping the seed here (and not inline in screens)
// means there is exactly one place to change "starting state" of the app.
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  'Groceries',
  'Rent',
  'Utilities',
  'Eating Out',
  'Transport',
  'Entertainment',
  'Household',
  'Other',
];

export const CATEGORY_ICONS = {
  Groceries:     '🛒',
  Rent:          '🏠',
  Utilities:     '💡',
  'Eating Out':  '🍽️',
  Transport:     '🚆',
  Entertainment: '🎬',
  Household:     '🧺',
  Other:         '📦',
};

// Used by the spending-by-category bar on Home and the legend beneath it.
// Picked to be visually distinct without clashing with the brand purple.
export const CATEGORY_COLORS = {
  Groceries:     '#74b9ff',
  Rent:          '#6c5ce7',
  Utilities:     '#fdcb6e',
  'Eating Out':  '#fd79a8',
  Transport:     '#00b894',
  Entertainment: '#e17055',
  Household:     '#a29bfe',
  Other:         '#b2bec3',
};

// Four-person household. Colour is used as a per-person accent throughout
// the UI (avatar circle, tile border, balance pill).
export const DEFAULT_PEOPLE = [
  { id: 'p1', name: 'Alice',   color: '#6c5ce7' },
  { id: 'p2', name: 'Bibin',   color: '#00b894' },
  { id: 'p3', name: 'Charlie', color: '#e17055' },
  { id: 'p4', name: 'Dana',    color: '#fdcb6e' },
];

// 15 sample expenses spanning the four payers, every category, four weeks
// of dates, and three different split-groups (whole house, just two, three
// of four). Plenty of variety to demonstrate sort / filter / paginate.
export const DEFAULT_EXPENSES = [
  { id: 'e01', title: 'Tesco weekly shop',      amount: 64.20,  paidBy: 'p1', splitAmong: ['p1','p2','p3','p4'], category: 'Groceries',     date: '2026-04-02', notes: '' },
  { id: 'e02', title: 'April rent',             amount: 1800.00, paidBy: 'p2', splitAmong: ['p1','p2','p3','p4'], category: 'Rent',          date: '2026-04-01', notes: 'split equally' },
  { id: 'e03', title: 'Octopus electricity',    amount: 92.40,  paidBy: 'p3', splitAmong: ['p1','p2','p3','p4'], category: 'Utilities',     date: '2026-04-04', notes: '' },
  { id: 'e04', title: 'Pizza Friday',           amount: 38.00,  paidBy: 'p4', splitAmong: ['p1','p2','p3','p4'], category: 'Eating Out',    date: '2026-04-05', notes: '' },
  { id: 'e05', title: 'Train to London',        amount: 24.50,  paidBy: 'p1', splitAmong: ['p1','p2'],          category: 'Transport',     date: '2026-04-09', notes: 'just us two' },
  { id: 'e06', title: 'Cleaning supplies',      amount: 18.75,  paidBy: 'p3', splitAmong: ['p1','p2','p3','p4'], category: 'Household',     date: '2026-04-10', notes: '' },
  { id: 'e07', title: 'Netflix',                amount: 17.99,  paidBy: 'p2', splitAmong: ['p1','p2','p3','p4'], category: 'Entertainment', date: '2026-04-12', notes: 'monthly' },
  { id: 'e08', title: 'Sainsbury\'s top-up',    amount: 22.10,  paidBy: 'p4', splitAmong: ['p1','p2','p3','p4'], category: 'Groceries',     date: '2026-04-14', notes: '' },
  { id: 'e09', title: 'Internet bill',          amount: 36.00,  paidBy: 'p1', splitAmong: ['p1','p2','p3','p4'], category: 'Utilities',     date: '2026-04-15', notes: '' },
  { id: 'e10', title: 'Pub night',              amount: 54.00,  paidBy: 'p3', splitAmong: ['p2','p3','p4'],     category: 'Eating Out',    date: '2026-04-19', notes: 'Alice was away' },
  { id: 'e11', title: 'Lightbulbs + batteries', amount: 12.40,  paidBy: 'p2', splitAmong: ['p1','p2','p3','p4'], category: 'Household',     date: '2026-04-20', notes: '' },
  { id: 'e12', title: 'Cinema tickets',         amount: 32.00,  paidBy: 'p4', splitAmong: ['p1','p2','p3','p4'], category: 'Entertainment', date: '2026-04-22', notes: '' },
  { id: 'e13', title: 'Costco bulk shop',       amount: 78.65,  paidBy: 'p1', splitAmong: ['p1','p2','p3','p4'], category: 'Groceries',     date: '2026-04-24', notes: '' },
  { id: 'e14', title: 'Uber from airport',      amount: 28.50,  paidBy: 'p2', splitAmong: ['p1','p2'],          category: 'Transport',     date: '2026-04-25', notes: '' },
  { id: 'e15', title: 'Coffee meet',            amount: 11.20,  paidBy: 'p3', splitAmong: ['p1','p3'],          category: 'Eating Out',    date: '2026-04-26', notes: '' },
];
