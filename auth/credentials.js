// auth/credentials.js
// ---------------------------------------------------------------------------
// Pre-built demo accounts. The brief explicitly forbids a sign-up flow:
//   "The app should not require a 'signup/register' process. Any logins/
//    passwords should be created in advance and appear on the screen
//    where they are to be used."
// So all valid credentials live here, and LoginScreen renders them visibly.
// `id` matches a person id from data/initialData.js so the logged-in user
// is also a household member.
// ---------------------------------------------------------------------------

export const DEMO_ACCOUNTS = [
  {
    id: 'p1',
    email: 'alice@splitmate.demo',
    password: 'password123',
    displayName: 'Alice',
  },
  {
    id: 'p2',
    email: 'bibin@splitmate.demo',
    password: 'password123',
    displayName: 'Bibin',
  },
];

export function findAccount(email, password) {
  const trimmed = (email || '').trim().toLowerCase();
  return (
    DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === trimmed && a.password === password,
    ) || null
  );
}
