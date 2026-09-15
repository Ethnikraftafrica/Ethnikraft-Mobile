# Ethnikraft Profile API Integration Status & Roadmap

This document outlines the current architecture, integrated endpoints, and future backend implementation requirements for the **Ethnikraft Profile** module across **Ethnikraft-Mobile** and **Ethnikraft-BE**.

---

## 1. Executive Summary

| Profile Feature / Modal | Backend Status | Endpoint Path | Mobile State Strategy | Notes / Next Steps |
| :--- | :--- | :--- | :--- | :--- |
| **Get Full User Profile** | ✅ Implemented | `GET /api/v1/profile` | Redux Toolkit (`profileSlice`) + RTK Query (`profileApi.useGetProfileQuery`) | Decodes user identity, contact details, default address, and preferences. |
| **Edit Personal Details** | ✅ Implemented | `PATCH /api/v1/profile/contact-info` | RTK Query (`useUpdateContactInfoMutation`) + Redux sync | Supports `profileName`, `phoneNumber`, `gender`, `birthDate`, `address`, `city`, `country`. |
| **Saved Addresses** | ✅ Implemented | `GET /api/v1/profile/addresses`<br>`POST /api/v1/profile/addresses`<br>`PATCH /api/v1/profile/addresses/:id`<br>`POST /api/v1/profile/addresses/:id/set-default`<br>`DELETE /api/v1/profile/addresses/:id` | RTK Query (`addressesApi`) + optimistic Redux fallback | Full CRUD with default address management. |
| **Notification Settings** | ⚠️ Partial (Global toggle) | `PATCH /api/v1/profile/notifications` | RTK Query (`useUpdateNotificationsMutation`) + Redux sync | Backend supports global `notificationsEnabled: boolean`. Granular fields are stored locally. |
| **Recently Viewed Items** | ℹ️ Client-Side Session / Discovery fallback | Client-side Redux tracking + `GET /api/v1/artisan-showcase/feed` fallback | RTK Query (`catalogApi.useGetArtisanFeedQuery`) + Redux | Industry standard: browsing history is tracked client-side or populated from feed when empty. |
| **Change Password** | ⏳ Pending Backend | `PATCH /api/v1/auth/change-password` *(To be created)* | UI & Local validation ready | Auth controller only has forgot/reset OTP flow; authenticated change-password endpoint needed. |
| **Custom Bespoke Measurements** | ⏳ Pending Backend | `GET / PUT /api/v1/profile/measurements` *(To be created)* | Redux Toolkit (`profileSlice.measurements`) | Complete UI & 3-step wizard ready; requires `Measurement` Prisma schema model. |
| **Payment Methods / Cards** | 🔒 Gateway Tokenization | Paystack / Flutterwave Gateway | Redux Toolkit (`profileSlice.savedCards`) + local storage | PCI-DSS compliant design: card credentials must be tokenized via payment gateway SDK. |

---

## 2. Detailed Audit & Implementation Specifications

### 2.1. Change Password Modal
- **Component File**: [ChangePasswordModal.tsx](file:///C:/Users/sam/Documents/sparkz/Ethnikraft-Mobile/src/components/profile/ChangePasswordModal.tsx)
- **Current State**: Validates old password and new password (length 6-20, uppercase, digits, special characters) with UI checklist and animations.
- **Backend Requirement**:
  - Implement `PATCH /api/v1/auth/change-password` in `Ethnikraft-BE/src/modules/auth/auth.controller.ts`.
  - Guarded by `@UseGuards(JwtAuthGuard)`.
  - Request DTO:
    ```typescript
    export class ChangePasswordDto {
      @ApiProperty({ description: 'Current password' })
      @IsString()
      @IsNotEmpty()
      currentPassword: string;

      @ApiProperty({ description: 'New password', minLength: 6, maxLength: 20 })
      @IsString()
      @Length(6, 20)
      newPassword: string;
    }
    ```

---

### 2.2. Bespoke Fit & Custom Measurements
- **Component File**: [CompleteProfileModal.tsx](file:///C:/Users/sam/Documents/sparkz/Ethnikraft-Mobile/src/components/profile/CompleteProfileModal.tsx)
- **Current State**: 3-step wizard collecting cloth dimensions (shoulder, chest, sleeve, waist, hips, etc.) and footwear/accessory sizes. State is persisted in Redux `profile.measurements`.
- **Backend Requirement**:
  - Add `Measurement` model or `measurements Json?` to Prisma schema in `Ethnikraft-BE`.
  - Expose endpoints in `ProfileController`:
    - `GET /api/v1/profile/measurements`
    - `PUT /api/v1/profile/measurements`

---

### 2.3. Granular Notification Settings
- **Component File**: [NotificationSettingsModal.tsx](file:///C:/Users/sam/Documents/sparkz/Ethnikraft-Mobile/src/components/profile/NotificationSettingsModal.tsx)
- **Current State**: Global toggle syncs with `PATCH /api/v1/profile/notifications` (`{ notificationsEnabled: boolean }`). Granular preferences (`orderUpdates`, `promotions`, `newsletter`) are tracked in Redux state.
- **Backend Requirement**:
  - Expand Prisma `User` schema to include:
    - `orderUpdatesEnabled Boolean @default(true)`
    - `promotionsEnabled Boolean @default(false)`
    - `newsletterEnabled Boolean @default(false)`
  - Update `UpdateNotificationSettingsDto` in `Ethnikraft-BE`.

---

### 2.4. Payment Methods & Card Tokenization
- **Component File**: [PaymentMethodsModal.tsx](file:///C:/Users/sam/Documents/sparkz/Ethnikraft-Mobile/src/components/profile/PaymentMethodsModal.tsx)
- **Current State**: Supports card validation and formatting for **Verve** (16–19 digits), **Visa**, **Mastercard**, and **American Express**. Cards are securely masked and saved locally in Redux.
- **Backend Requirement & PCI-DSS Compliance**:
  - Raw card numbers and CVVs must **never** be stored on the application backend.
  - Implement gateway tokenization (e.g. Paystack / Flutterwave SDK) where the mobile app tokenizes the card directly with the payment provider and sends only the reusable authorization code / token to the backend.

---

## 3. Inline TODO Tracking Reference

The following inline TODO tags have been placed across the codebase for future task discovery:

1. `Ethnikraft-Mobile/src/components/profile/ChangePasswordModal.tsx`:
   ```typescript
   // TODO: Connect to backend PATCH /api/v1/auth/change-password endpoint once implemented in Ethnikraft-BE.
   ```
2. `Ethnikraft-Mobile/src/components/profile/CompleteProfileModal.tsx`:
   ```typescript
   // TODO: Persist custom cloth dimensions to backend once Measurement model or user.measurements field is added to Prisma schema in Ethnikraft-BE.
   // TODO: Persist bespoke shoe/accessory measurements and notes to backend once Measurement model is added to Ethnikraft-BE.
   ```
3. `Ethnikraft-Mobile/src/components/profile/NotificationSettingsModal.tsx`:
   ```typescript
   // TODO: Connect to backend once granular notification columns (promotionsEnabled, marketingEnabled) are added to Prisma User schema in Ethnikraft-BE.
   // TODO: Connect to backend once newsletter subscription model or user.newsletterEnabled is added to Ethnikraft-BE.
   ```
4. `Ethnikraft-Mobile/src/components/profile/PaymentMethodsModal.tsx`:
   ```typescript
   // TODO: Integrate payment gateway card tokenization via Paystack / Flutterwave SDK or backend tokenization service.
   ```
