/** Keep the verified desktop development workflow; all production builds fail closed. */
export function isLiveBillingQueryEnabled(): boolean {
  return process.env.NODE_ENV === "development" && process.env.VERCEL !== "1";
}
