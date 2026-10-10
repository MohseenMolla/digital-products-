# Manual payments (bKash / Nagad / Rocket)

There is no payment gateway. Customers send money to your own wallet numbers and submit the transaction ID (TrxID).

## Setup
0. Quickest start: put `BKASH_NUMBER=`, `NAGAD_NUMBER=`, `ROCKET_NUMBER=` in `backend/.env` and restart the backend. These are used whenever Admin > Settings has no number for a method.
1. Or log in as admin, open **Admin > Settings > Payment methods**.
2. Enter your receiving number for each method you use, pick the account type (normally *Send Money*), tick *Enabled*, save.
   Methods without a number are hidden from customers.
3. Choose the access mode (see below).

## Customer flow
Buy Now > checkout (name, email, phone; no login) > payment page (pick method, send money, paste TrxID and sender number) >
download page `/order/<orderNumber>?token=...` (also emailed). The token is private to the buyer.

## Access modes
**Instant access (default).** After submitting a TrxID the buyer gets the download page immediately. The order is **In review**
(`PROCESSING`): it is not counted as revenue until you approve it. Anyone can type a fake TrxID, so open
Admin > Orders > *Awaiting verification*, compare against your wallet statement/SMS, then **Approve** or **Reject**.
Reject removes access at once and lets the buyer resubmit.

**Approval first.** Untick instant access. Nothing unlocks until you approve; the buyer's page refreshes by itself and they are emailed the link.

## Built-in protections
* A TrxID can be used once, ever (unique index; a rejected ID cannot be reused on another order).
* One submission per order until rejected; amount is fixed server-side from the product price.
* Approve/reject are atomic and audit-logged (`ORDER_PAYMENT_APPROVED`, `ORDER_PAYMENT_REJECTED`).
* Revenue counts only `PAID` orders. Download limits/expiry still apply to instant access.

## Honest limits
The app cannot read your wallet, so it cannot confirm that money arrived. Verification is you comparing TrxID and amount with your
own statement. For high-value products turn instant access off.
