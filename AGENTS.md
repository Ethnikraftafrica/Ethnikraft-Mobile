# Ethnikraft-Mobile — Agent Guidelines & Architecture Rules

This file governs all AI coding agents working on `Ethnikraft-Mobile`. Adhere strictly to these rules.

---

## 1. UI & Modal Layout Standards (CRITICAL)

Modals and bottom sheets must strictly follow the established application-wide pattern:

1. **Transparent Status Bar (`statusBarTranslucent`)**:
   - Every `<Modal>` must include `statusBarTranslucent={true}`.
   - Do **NOT** render nested or conflicting `<StatusBar>` components inside modal dialogs.
   - The status bar color must remain transparent so the dimmed backdrop seamlessly covers the full screen including the status bar area.

2. **Modal Backdrops & Bottom Sheets**:
   - Use standard translucent dark backdrop (`rgba(0, 0, 0, 0.5)` or theme backdrop).
   - Sheet container: rounded top corners (`borderTopLeftRadius: 24`, `borderTopRightRadius: 24`), top pull indicator handle centered if swipeable.
   - Modal headers: consistent horizontal layout with title on the left/center and close button (`X`) pinned cleanly without awkward custom margins.

---

## 2. Component & Layout Conventions

1. **Summary Cards (Metrics / Counters)**:
   - **Grid Standard**: Always arrange metric/summary cards in a balanced **2 by 2 grid** (never compress 3 or 4 cards across a single horizontal row).
   - **Icon Sizing**: All summary card icons must use a uniform size (e.g. `size={16}` or `size={14}`). Prevent icon size divergence (e.g. arrow icons rendering larger than other badges).

2. **Action Buttons in Cards / Lists**:
   - When placing buttons side by side (e.g., "Decline", "Accept", "Update Progress"):
     - Maintain uniform height across all sibling buttons (e.g. `minHeight: 40` or standard padding).
     - Keep content horizontal: `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'center'`.
     - Do not stack button icon and label vertically if it forces sibling height mismatches.

3. **Design Tokens & Theming**:
   - Always consume `useAppTheme()` or established theme constants — do not scatter raw hex values.
   - Brand Palette: Primary `#662502`, Accent `#D1995A`, Background `#FCF4E1` / theme card backgrounds.
   - Fonts: Cormorant Garamond for prominent headings/brand accents, Poppins for UI text and inputs.

---

## 3. Web & Backend Parity (Ethnikraft-Vendor & Ethnikraft-BE)

1. **Feature Verification**:
   - Before implementing complex vendor flows (e.g. progress updates, image uploads, milestone completions), **cross-reference `Ethnikraft-Vendor` (web) and `Ethnikraft-BE`**.
   - Do not guess payload structures or omit multi-step requirements (such as optional/required photo uploads or milestone statuses).

2. **Route Separation**:
   - Maintain clean distinction between buyer routes `(user)` and artisan/vendor routes `(vendor)`.
   - Never bleed vendor management features into user consumer screens and vice-versa.

---

## 4. Hardware & Safe Execution Rules

- **OS**: Windows with PowerShell terminal syntax only (`Get-ChildItem`, `Remove-Item`, forward slashes in code paths).
- **Concurrency**: CPU is an Intel i7-8650U (15W ULV). Run tests sequentially and use single-worker limits (`--runInBand` / `maxWorkers: 1`). Never run parallel test tasks.
- **Expo Docs**: This project runs Expo SDK 52. Consult versioned docs at `https://docs.expo.dev/versions/v52.0.0/` when using Expo APIs.
