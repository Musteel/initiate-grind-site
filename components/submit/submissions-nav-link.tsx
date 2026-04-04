// components/submit/submissions-nav-link.tsx
// Small helper — used in the Navbar to add a Submissions link for logged-in users.
// Also used in the app footer. Re-export from here to keep nav changes centralised.

export const SUBMISSIONS_LINKS = [
  { href: '/submissions',      label: 'My puzzles' },
  { href: '/submissions/vote', label: 'Vote on submissions' },
] as const
