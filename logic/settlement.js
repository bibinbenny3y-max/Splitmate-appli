// logic/settlement.js
// ---------------------------------------------------------------------------
// THE TRANSFORMATION. Turns a raw list of "who paid what for whom" into the
// minimum number of person-to-person transactions that settle every debt.
//
// Two approaches were considered:
//
//   1. NAIVE PAIRWISE
//        For every (A,B) pair, sum what A owes B and B owes A, settle the
//        difference. Always correct, simple to reason about, but verbose:
//        an n-person household can need up to n*(n-1)/2 transactions.
//
//   2. GREEDY MAX-CREDITOR vs MAX-DEBTOR (chosen)
//        Compute each person's *net* balance once. Then repeatedly:
//          a. find the person owed the most  (max creditor)
//          b. find the person who owes the most (max debtor)
//          c. settle the smaller of their absolute balances between them
//        Yields at most n-1 transactions. Not provably optimal in
//        pathological cases (the general "Minimum Cash Flow" problem is
//        NP-hard), but for households of 4-10 people it produces the same
//        answer as exhaustive search and is straightforward to demo.
//
// Floats are rounded to 2dp at every boundary to avoid £0.0001 ghost
// transactions caused by IEEE-754 noise.
// ---------------------------------------------------------------------------

const EPS = 0.005;
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Compute net balance per person.
 *   balance > 0  =>  others owe them
 *   balance < 0  =>  they owe others
 *   balance ~ 0  =>  square
 *
 * @param {Array<{id:string}>} people
 * @param {Array<{paidBy:string, splitAmong:string[], amount:number}>} expenses
 * @returns {Object<string, number>} map of personId -> net balance in £
 */
export function computeBalances(people, expenses) {
  const balances = {};
  people.forEach((p) => { balances[p.id] = 0; });

  expenses.forEach((exp) => {
    const splitCount = exp.splitAmong?.length || 0;
    if (splitCount === 0) return;
    const share = exp.amount / splitCount;

    if (balances[exp.paidBy] !== undefined) {
      balances[exp.paidBy] += exp.amount;
    }
    exp.splitAmong.forEach((pid) => {
      if (balances[pid] !== undefined) balances[pid] -= share;
    });
  });

  Object.keys(balances).forEach((k) => { balances[k] = round2(balances[k]); });
  return balances;
}

/**
 * Greedy minimum-transactions settlement.
 * @param {Object<string, number>} balances
 * @returns {Array<{from:string, to:string, amount:number}>}
 */
export function minimiseTransactions(balances) {
  const creditors = [];
  const debtors   = [];

  Object.entries(balances).forEach(([pid, bal]) => {
    if      (bal >  EPS) creditors.push({ id: pid, amount:  bal });
    else if (bal < -EPS) debtors  .push({ id: pid, amount: -bal });
  });

  const transactions = [];

  while (creditors.length && debtors.length) {
    creditors.sort((a, b) => b.amount - a.amount);
    debtors  .sort((a, b) => b.amount - a.amount);

    const c = creditors[0];
    const d = debtors[0];
    const settle = round2(Math.min(c.amount, d.amount));

    if (settle <= 0) break; // safety net against an edge case

    transactions.push({ from: d.id, to: c.id, amount: settle });

    c.amount = round2(c.amount - settle);
    d.amount = round2(d.amount - settle);

    if (c.amount < EPS) creditors.shift();
    if (d.amount < EPS) debtors.shift();
  }

  return transactions;
}

/** Quick top-line totals for the dashboard. */
export function summary(balances) {
  let totalOwed = 0;
  let totalDue  = 0;
  Object.values(balances).forEach((v) => {
    if (v > 0) totalOwed += v;
    if (v < 0) totalDue  += -v;
  });
  return {
    totalOwed: round2(totalOwed),
    totalDue:  round2(totalDue),
  };
}

/**
 * Bonus: also expose the naive pairwise algorithm so the
 * Architecture & Tradeoffs video can demonstrate the difference live.
 */
export function naivePairwise(people, expenses) {
  const owe = {}; // owe[A][B] = how much A owes B
  people.forEach((a) => {
    owe[a.id] = {};
    people.forEach((b) => { if (a.id !== b.id) owe[a.id][b.id] = 0; });
  });

  expenses.forEach((exp) => {
    const splitCount = exp.splitAmong?.length || 0;
    if (splitCount === 0) return;
    const share = exp.amount / splitCount;
    exp.splitAmong.forEach((pid) => {
      if (pid !== exp.paidBy) owe[pid][exp.paidBy] += share;
    });
  });

  const txns = [];
  const ids = people.map((p) => p.id);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = ids[i], b = ids[j];
      const net = round2(owe[a][b] - owe[b][a]);
      if      (net >  EPS) txns.push({ from: a, to: b, amount: net });
      else if (net < -EPS) txns.push({ from: b, to: a, amount: -net });
    }
  }
  return txns;
}
