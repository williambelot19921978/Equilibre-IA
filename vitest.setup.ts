/**
 * Force UTC in unit tests so date/time helpers behave deterministically
 * across developer machines and GitHub Actions (ubuntu-latest).
 */
process.env.TZ = "UTC";
