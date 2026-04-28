# SplitMate

A household expense settler. Tracks who paid for what, then computes the
**minimum number of person-to-person transactions** needed to settle every
debt. Built in React Native as an Expo Snack for the Mobile Computing
final assignment.

## Features

**Core**
- Pre-built login (no sign-up flow per the brief), credentials shown on screen
- Multi-screen navigation with native back arrows everywhere
- AsyncStorage persistence across app reloads
- Search, filter, sort, paginate, pull-to-refresh, swipe-to-delete, long-press menu

**Screens (13)**
- **Login** — Demo accounts, help/info icons, password show/hide, shake-on-error
- **Home** — Dashboard with KPIs, spending-by-category bar, balances, settle CTA, quick actions
- **Expenses** — Searchable, filterable, sortable, paginated list with swipe-delete and long-press edit
- **Add/Edit Expense** — Dual-mode form with validation, chip selectors for category/payer/splitters
- **Settle Up** — The transformation: 6 naive transactions → 3 greedy with side-by-side counter
- **People (Household)** — Per-person breakdown with MVP / debtor badges, drill-into-detail
- **Person Detail** — Per-person stats, expenses paid for, expenses on the hook for, settle-up shortcut
- **Profile** — Avatar, contact, bio, member-since, personal stats grid, quick actions
- **Edit Profile** — Display name, accent color picker, email, phone, bio with live preview
- **Activity** — Chronological feed with filters (All / Mine / Edits)
- **Statistics** — KPIs, top contributors bars, category breakdown, biggest expenses, monthly chart
- **Settings** — Account, data management (reset/reload), preferences, about, help link
- **Help** — Three-section FAQ (Getting started, How settle-up works, Tips)

## Stack

- React Native 0.x (Expo SDK)
- React Navigation v6 (native-stack + bottom-tabs)
- AsyncStorage for persistence
- @expo/vector-icons (Ionicons) for professional iconography
- react-native-gesture-handler for Swipeable
- Greedy minimum-cash-flow algorithm for settlement

## Project structure

```
App.js                       Root: navigation graph, auth gate, gesture root
package.json                 Snack-friendly dependencies (all "*")

data/initialData.js          Seed: 4 people, 15 expenses, 8 categories with icons + colors
auth/credentials.js          Pre-built demo accounts

logic/storage.js             AsyncStorage wrappers (auth, people, expenses, prefs, profiles, activity)
logic/settlement.js          Greedy + naive cash-flow algorithms (with documented tradeoffs)

components/
  Avatar.js                  Reusable circular avatar
  BalanceTile.js             Per-person balance card
  ExpenseCard.js             Swipe-to-delete + long-press menu
  FilterChips.js             Generic chip-strip selector
  SpendingBar.js             Horizontal stacked-bar visualisation
  EmptyState.js              Centred empty placeholder

screens/                     13 screens (see Features above)
```

## Demo accounts

Both pre-loaded; visible on the login screen. Both passwords are `password123`.

| Name  | Email                  |
|-------|------------------------|
| Alice | alice@splitmate.demo   |
| Bibin | bibin@splitmate.demo   |

## Algorithm note

`logic/settlement.js` exports both `minimiseTransactions` (greedy) and
`naivePairwise` (verbose). The Settle Up screen displays both counts side
by side so the value of the chosen approach is visible to the user.

For households of 4-10 people, greedy produces the same number of
transactions as exhaustive search. The general "Minimum Cash Flow" problem
is NP-hard, so we accept that pathological cases (>~12 people with
intricate cross-debts) might be one-or-two transactions sub-optimal in
exchange for O(n²) runtime and explainable behaviour.
