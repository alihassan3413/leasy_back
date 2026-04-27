# LeasyBack Web — Vue 3 Frontend

> **Migration status:** Flutter → Vue 3 + Vite + TypeScript  
> **Current branch:** `feature/vue-migration`  
> **Backend:** unchanged — same REST API used by both Flutter and Vue

---

## Table of Contents

1. [What is LeasyBack?](#what-is-leasyback)
2. [User Roles](#user-roles)
3. [Tech Stack — and Why](#tech-stack--and-why)
4. [Project Structure Explained](#project-structure-explained)
5. [How Data Flows](#how-data-flows)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Available Scripts](#available-scripts)
9. [Git Workflow](#git-workflow)
10. [Naming Conventions](#naming-conventions)
11. [Module Roadmap](#module-roadmap)

---

## What is LeasyBack?

LeasyBack is a B2B/B2C SaaS platform for **vehicle lease return management** (Fahrzeugrückgabe). It connects three parties:

- **B2C users** (Leasingnehmer) — individuals returning a leased vehicle
- **B2B users** (Firmenkunden) — companies managing a fleet of leased vehicles
- **Workshop users** (Werkstatt) — garages that receive, inspect, and process returned vehicles

---

## User Roles

| Role | German | What they do |
|------|--------|--------------|
| B2C | Leasingnehmer | Start return, upload docs, book appointment |
| B2B | Firmenkunde | Manage fleet, view return status per vehicle |
| Workshop | Werkstatt | Receive appointments, write damage reports, manage invoices |
| Admin | Admin | Platform management (internal) |

---

## Tech Stack — and Why

| Tool | Purpose | Why we chose it |
|------|---------|-----------------|
| **Vue 3** | UI framework | Component-based, reactive, great TypeScript support |
| **Vite** | Build tool | 10–100x faster than Webpack for dev server + HMR |
| **TypeScript** | Type safety | Catches bugs before runtime, self-documenting code |
| **Vue Router 4** | Client-side routing | Official Vue router, lazy-loading built-in |
| **Pinia** | State management | Official Vue store, simpler than Vuex, DevTools support |
| **Axios** | HTTP client | Interceptors for auth tokens, error normalization |
| **vue-i18n v11** | Translations | German/English support, future-proof for more languages |
| **vee-validate + yup** | Form validation | Schema-based validation, works great with Vue 3 |
| **dayjs** | Date handling | 2KB alternative to moment.js |
| **Vitest** | Unit testing | Same config as Vite, very fast |
| **Playwright** | E2E testing | Cross-browser, reliable for form flows |

---

## Project Structure Explained

```
src/
├── api/                    ← ALL network calls live here, nowhere else
│   ├── client.ts           ← Axios instance with auth token + 401 retry
│   ├── auth.service.ts     ← login(), register(), logout(), refresh()
│   ├── vehicle.service.ts  ← getAll(), getById(), create(), update()
│   ├── return.service.ts   ← startReturn(), uploadDamage(), getStatus()
│   ├── payment.service.ts  ← getInvoices(), getDirectDebit()
│   └── appointment.service.ts ← getSlots(), bookSlot(), cancel()
│
├── assets/                 ← Images, fonts, global CSS (not component-specific)
│
├── components/             ← Reusable UI pieces (NOT full pages)
│   ├── base/               ← BaseInput, BaseButton, BaseModal, BaseAlert
│   │                          (generic, no business logic)
│   ├── vehicle/            ← VehicleCard, VehicleForm, AddVehicleModal
│   ├── return/             ← ReturnWizard, DamageReport, UploadZone
│   ├── payment/            ← InvoiceTable, DirectDebitForm
│   ├── appointment/        ← AppointmentPicker, CalendarSlot
│   └── layout/             ← AppSidebar, AppHeader, AppBreadcrumb
│
├── composables/            ← Reusable logic (like custom React hooks)
│   │                          useAuth.ts, useVehicles.ts, useReturn.ts
│   │                          A composable = a function that uses Vue reactivity
│
├── router/
│   ├── index.ts            ← Creates the router, registers all routes
│   ├── guards.ts           ← beforeEach: checks login state + role
│   └── routes/             ← One file per module (keeps index.ts clean)
│       ├── auth.routes.ts
│       ├── dashboard.routes.ts
│       └── ...
│
├── stores/                 ← Pinia stores = global reactive state
│   ├── authStore.ts        ← user, token, role, login(), logout()
│   ├── vehicleStore.ts     ← vehicles[], selectedVehicle
│   └── returnStore.ts      ← returnProcess, currentStep
│
├── types/                  ← TypeScript interfaces — mirror your API DTOs
│   └── index.ts            ← User, Vehicle, ReturnProcess, Invoice...
│
├── views/                  ← Full pages — one per route
│   ├── auth/               ← LoginView.vue, RegisterView.vue, ForgotPasswordView.vue
│   ├── dashboard/          ← DashboardB2C.vue, DashboardB2B.vue, DashboardWorkshop.vue
│   ├── return/             ← ReturnWizardStep.vue
│   ├── account/            ← AccountView.vue
│   └── payment/            ← PaymentHistoryView.vue
│
├── i18n/
│   ├── de.json             ← German strings (primary language)
│   └── en.json             ← English strings
│
└── main.ts                 ← App entry point — mounts Vue, registers plugins
```

### The golden rule of this structure

```
views/     use → composables/   which use → stores/   which use → api/
                                                            ↓
                                                         types/
```

**Views never call `api/` directly.** They always go through composables → stores → api.  
This keeps views simple and makes testing easy.

---

## How Data Flows

Here is a full example — loading the B2C dashboard vehicles:

```
1. DashboardB2C.vue mounts
      ↓
2. calls useVehicles() composable
      ↓
3. composable calls vehicleStore.fetchVehicles()
      ↓
4. store calls vehicleService.getAll()
      ↓
5. service calls axios client → GET /api/v1/vehicles
      ↓
6. response flows back up: store updates vehicles[]
      ↓
7. composable exposes vehicles as computed ref
      ↓
8. view re-renders automatically (Vue reactivity)
```

---

## Getting Started

### Prerequisites

- Node.js v20+ (you have v24 — perfect)
- Git

### Installation

```bash
git clone https://bitbucket.org/metrudevelopment/leasyback_web.git
cd leasyback_web
git checkout feature/vue-migration
npm install
```

### Run development server

```bash
npm run dev
```

Open http://localhost:5173

### Build for production

```bash
npm run build
```

Output goes to `dist/` folder — ready for Nginx/CDN deployment.

---

## Environment Variables

All env vars must start with `VITE_` — only then does Vite expose them to the browser.

| Variable | Dev value | Prod value | Purpose |
|----------|-----------|------------|---------|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | `https://api.leasyback.com/` | Backend base URL |
| `VITE_APP_ENV` | `development` | `production` | Feature flags |

Access them in code: `import.meta.env.VITE_API_URL`

---

## Available Scripts

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build locally
npm run type-check   # TypeScript check without building
npm run test         # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
```

---

## Git Workflow

### Branch structure

```
main                          ← Flutter MVP (never touch this)
  └── feature/vue-migration   ← Your main migration branch
        ├── feature/vm-auth
        ├── feature/vm-dashboard
        ├── feature/vm-return
        └── feature/vm-payments
```

### Rules

1. **Never commit directly to `main`**
2. **Never commit directly to `feature/vue-migration`** — always use sub-branches
3. Every sub-branch gets a PR → reviewed → squash-merged into `feature/vue-migration`
4. `feature/vue-migration` → `main` only when 100% production ready

### Commit message format (Conventional Commits)

```
feat(auth):     add login + registration flow
fix(vehicles):  correct German plate validation
chore(api):     add interceptor for 401 refresh
test(return):   add wizard step unit tests
style(ui):      adjust dashboard card spacing
refactor(store):simplify authStore token handling
docs:           update README with env variables
```

Format: `type(scope): description`

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| View files | PascalCase + `View.vue` | `LoginView.vue` |
| Component files | PascalCase, domain-prefixed | `VehicleCard.vue` |
| Composables | camelCase, `use` prefix | `useVehicles.ts` |
| Stores | camelCase + `Store` | `authStore.ts` |
| Services | camelCase + `.service.ts` | `vehicle.service.ts` |
| Types/interfaces | PascalCase | `interface Vehicle {}` |
| i18n keys | snake_case | `dashboard.welcome_message` |
| CSS classes | kebab-case | `vehicle-card__status` |

---

## Module Roadmap

| Phase | Module | Ticket | Status |
|-------|--------|--------|--------|
| 0 | Project setup & architecture | DEV-4098 | ✅ Done |
| 1 | Authentication (all 4 roles) | DEV-4100 | 🔄 In progress |
| 2 | B2C Dashboard | — | ⏳ Pending |
| 3 | B2B Dashboard | — | ⏳ Pending |
| 4 | Workshop Dashboard | — | ⏳ Pending |
| 5 | Return wizard | — | ⏳ Pending |
| 6 | My Account + Bank data | — | ⏳ Pending |
| 7 | Payment history | — | ⏳ Pending |
| 8 | i18n + a11y + QA | — | ⏳ Pending |

---

## Key Business Logic Notes

- **Bank data (IBAN/SEPA)** lives in `userProfile`, not in `paymentMethods` — deliberate privacy decision. The API field is `bankData` inside the user profile endpoint.
- **B2C has two registration paths**: normal signup AND registration-during-return-process (from landing page). Both use the same store action, different redirect logic.
- **"User ≠ Lessee"**: the vehicle driver can differ from the contract holder. This creates a sub-user model — `vehicle.lessee` vs `vehicle.driver`.
- **Workshop dashboard** is role-gated — a user with role `WORKSHOP` sees a completely different layout from B2C/B2B.

---

*LeasyBack Web — built with Vue 3 + Vite. For questions, contact the dev team.*