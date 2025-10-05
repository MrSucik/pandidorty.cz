# Christmas Tasting Order Flow — LLM Implementation Guide

This document is a playbook for an LLM agent to implement the seasonal “Christmas tasting” order option inside the existing Pandí Dorty React Router project located at `/Users/xxx/p/pandidorty/pandidorty-react-router`. Follow the steps in order, verify preconditions before each section, and stop to ask for clarification if an assumption cannot be validated from the codebase or requirements below.

---

## 1. Goals & Constraints
- Create a dedicated Christmas tasting ordering experience (shorter form, limited options, QR payment instructions) separate from the standard order flow in `app/routes/objednavka.tsx`.
- Capture contact info, selected tasting boxes (cake box, sweetbar box, both), quantity per box, and optional pickup/delivery date depending on final business rules.
- After submission, display a confirmation screen with static QR payment details and send the usual admin/customer notification emails.
- Ensure seasonal orders are identifiable in the admin UI and stored with enough metadata for reporting.
- Avoid breaking existing order flow, admin features, and automated tests.

Key assumptions to confirm with the human before coding:
1. Pricing model: per-box fixed price vs. quantity-derived total.
2. Whether customers pick a fulfillment date or the date is fixed by the business.
3. Whether QR payment amount is static or computed from quantity.
4. Inventory caps (max quantity per box, overall limit) if any.
5. Campaign start/end handling (feature flag, scheduled removal, etc.).

Document unresolved decisions in PR description or developer notes.

---

## 2. Repository Orientation
Review these files first to understand baseline behavior:
- `app/routes/objednavka.tsx` — current long form order UI built with React Hook Form + Tanstack Query.
- `app/server/submit-order.server.ts` — backend handler for general orders, including Zod validation, DB persistence, and email delivery.
- `app/db/orders.ts` & `app/db/schema.ts` — Drizzle models and helper for saving orders plus photos.
- `app/routes/admin/orders.tsx` & `app/components/admin/OrderCard.tsx` — admin listing UI.
- `e2e/order-form-simple.spec.ts` — example Playwright test for order submission.

If the workspace differs (e.g., additional seasonal code already present), adjust instructions accordingly.

---

## 3. Database Layer Changes
1. **Schema update**
   - Add new columns to `orders` or create a dedicated seasonal table. Preferred approach: extend existing `orders` table with seasonal metadata to leverage admin tooling. Suggested columns:
     - `orderKind` (text or enum) to store values like `regular`, `christmas_tasting`.
     - `tastingCakeBoxQty` (integer, nullable).
     - `tastingSweetbarBoxQty` (integer, nullable).
     - `tastingNotes` (text, nullable) for internal notes if needed.
   - Create a new Drizzle migration in `/Users/xxx/p/pandidorty/pandidorty-react-router/drizzle` updating schema.
   - Update `app/db/schema.ts` to include new columns and keep TypeScript types synchronized.

2. **Form data typing**
   - Extend `OrderFormData` in `app/db/orders.ts` (or add a seasonal variant) with new fields.
   - Update `createOrderFromForm` to map seasonal fields when `orderKind === "christmas_tasting"` and keep legacy behavior for regular orders.
   - Ensure null checks maintain existing behavior for standard orders.

3. **Data separation (optional)**
   - If stakeholders want strict separation, create a new table `seasonal_orders`. That implies new Drizzle model, insert helper, admin fetch adjustments. Track this divergence clearly in code comments and commit description.

---

## 4. Backend Handler
1. Create dedicated server handler: `app/server/submit-christmas-order.server.ts`.
   - Copy structure from `submit-order.server.ts`, but customize fields, validation, and success message.
   - Use Zod schema requiring:
     - `name`, `email`, `phone` (re-use patterns from standard form).
     - At least one of `cakeBoxQty`, `sweetbarBoxQty` greater than zero.
     - Numeric validation with sensible min/max (confirm with product owner; default suggestion: 1–5).
     - Optional `pickupDate` if the business collects it. Apply same blocked dates logic if relevant.
   - Set `orderKind` to `christmas_tasting` before saving.

2. Persistence
   - Reuse `createOrderFromForm` (rename or refactor if needed) or create `createSeasonalOrder` to write to DB.

3. Emails
   - Reuse Resend integration, but adjust subject/body to highlight “Christmas tasting order”.
   - Include selected boxes and quantities in both admin and customer emails.
   - Mention payment instructions referencing QR code.

4. Response payload
   - Return JSON with `success`, `message`, and optionally `paymentAmount` or `paymentReference` if payment total is computed; the frontend will use this to render confirmation details.

---

## 5. API Route
1. Add new Remix route file: `app/routes/api.submit-christmas-order.ts` mirroring `api.submit-order.ts` but calling the new server handler.
2. Ensure it validates HTTP method, catches errors, and returns localized error messages.
3. If a feature flag is provided, check it before accepting submissions.

---

## 6. Christmas Order Form UI
1. Create new public route component: `app/routes/vanocni-ochutnavka.tsx` (adjust slug if business prefers different URL).
   - Base on `app/routes/objednavka.tsx`, but remove cake customization, photo uploads, dessert text area, etc.
   - Use React Hook Form with `zodResolver` referencing the backend schema.
   - Form fields:
     - Contact section (name, email, phone).
     - Optional date selector (reuse blocked dates loader if needed).
     - Selection inputs: radio or checkboxes for `Ochutnávková krabička dortů`, `Ochutnávková krabička sweetbar`, plus numeric inputs for quantity. If combination is allowed, use checkboxes with quantity inputs conditionally shown.
     - Optional notes field for special requests.
   - Display computed total or static pricing copy based on confirmed requirements.

2. Submission behavior
   - Use `useMutation` pointing to `/api/submit-christmas-order`.
   - On success, show confirmation view with:
     - Thank-you text.
     - QR code image stored at `public/payments/vanocni-qr.png` (add asset).
     - Payment instructions (amount, variable symbol/order number, due date).
     - Button linking back to `/`.

3. Styling
   - Follow existing tailwind classes / design language used in `objednavka.tsx`.
   - Ensure mobile-friendly layout.

4. Loader
   - If date availability applies, export a loader similar to `objednavka.tsx` to fetch blocked dates.
   - Otherwise omit loader to keep route simple.

---

## 7. Navigation & Marketing Copy
1. Home page (`app/routes/index.tsx`)
   - Add CTA block or hero mention linking to `/vanocni-ochutnavka`.
   - Provide short Czech description of the Christmas tasting offering.

2. Existing order page (`app/routes/objednavka.tsx`)
   - Optionally add banner or link to seasonal form for relevant visitors.

3. Footer or navigation component (check `app/components/Footer.tsx` if present) to include seasonal link while campaign is active.

---

## 8. Admin Interface Updates
1. `app/components/admin/OrderCard.tsx`
   - Display an identifying badge when `orderKind === "christmas_tasting"`.
   - Render seasonal quantity details in the order summary block.

2. `app/routes/admin/orders.tsx`
   - Consider adding filter by order kind (dropdown or query param `kind`), but keep existing defaults intact.
   - Ensure API that feeds orders includes new columns (check `app/server/get-orders.server.ts`).

3. Database query adjustments
   - Update selects in `getOrdersPaged` to retrieve new columns.
   - Update `Order` TypeScript definitions if necessary.

---

## 9. Assets & Localization
1. Place the QR code image (provided by client) under `public/payments/vanocni-qr.png`. Keep file size optimized (<300KB recommended).
2. Ensure alt text communicates payment purpose for accessibility.
3. All UI copy must be in Czech; reference existing tone in current order form.

---

## 10. Testing Strategy
1. **Unit-level / server tests**
   - If the project uses unit tests, add coverage for validation logic (Zod schema) and server handler success/failure.

2. **E2E tests**
   - Create Playwright spec (e.g., `e2e/christmas-order.spec.ts`) mirroring existing order flow tests.
   - Scenarios: happy path submission, validation errors (no selection, invalid quantity), blocked date if applicable.

3. **Manual QA checklist**
   - Verify form loads on desktop/mobile.
   - Submit with each combination of boxes.
   - Confirm success screen shows QR code and correct payment summary.
   - Check emails in development (use mock/test mode) to ensure seasonal content.
   - Verify admin list shows seasonal order badge and details.

4. **Regression checks**
   - Run existing Playwright suite (`npm run test:e2e` or relevant command).
   - Smoke test legacy order form to ensure no schema regressions.

---

## 11. Deployment & Cleanup
- If feature should auto-disable after campaign, introduce a config flag (env var or JSON) and document removal steps.
- Update documentation (e.g., project README) with instructions for seasonal campaign management.
- After the season, plan to hide navigation links while keeping data accessible in admin.

---

## 12. Acceptance Criteria Checklist
- [ ] Database schema supports identifying Christmas tasting orders and quantities.
- [ ] New API endpoint accepts seasonal submissions with validation and persists them.
- [ ] Seasonal form UI exists, localized, responsive, and submits successfully.
- [ ] Confirmation screen displays QR payment info and order number.
- [ ] Admin UI clearly marks seasonal orders and shows relevant data.
- [ ] Emails sent to admin and customer mention Christmas tasting details.
- [ ] Automated tests updated/passing; manual QA checklist executed.
- [ ] All new strings in Czech, no regressions in standard order flow.
- [ ] Documentation updated with campaign-specific instructions.

---

## 13. Notes for the Implementing Agent
- Favor incremental commits aligned with sections above.
- Keep code comments concise but explicit where seasonal logic diverges from regular flow.
- Respect existing lint/format rules (run `npm run lint` and `npm run format` if available).
- Do not remove or alter unrelated files. If unexpected diffs appear, halt and request human guidance.
- Before merging, ensure QR asset and copy have been confirmed with stakeholder.

This guide should be treated as the authoritative reference while implementing the Christmas tasting ordering feature. Update this document if requirements evolve.


