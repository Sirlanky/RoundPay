/**
 * RoundPay uses Paystack in two ways:
 * - **Payouts (default on):** admin sends money directly to a member's bank (Transfer API).
 * - **Collect contributions (optional):** member pays in via Paystack checkout — off by default;
 *   most groups pay the admin by bank transfer and the admin records it in the app.
 */
export const paystackCollectContributions =
  process.env.EXPO_PUBLIC_PAYSTACK_COLLECT_CONTRIBUTIONS === 'true';

/** Paystack is used for direct bank payouts when the secret key is deployed. */
export function paystackPayoutsEnabled(): boolean {
  return true;
}
