<!--
SYNC IMPACT REPORT
==================
Version Change: 0.0.0 → 1.0.0 (MAJOR - Initial ratification)
Modified Principles: N/A (new constitution)
Added Sections:
  - Technical Stack
  - Core Principles (7 principles)
  - Feature Domains
  - Development Workflow
  - Governance
Removed Sections: All template placeholders
Templates Requiring Updates:
  - .specify/templates/spec-template.md ⚠️ pending (add domain context)
  - .specify/templates/plan-template.md ⚠️ pending (add tech stack reference)
  - .specify/templates/tasks-template.md ⚠️ pending (add TDD checklist)
Follow-up TODOs:
  - Configure Firebase project credentials
  - Set up Stripe account and keys
  - Configure Vertex AI project
  - Set up Crashlytics dashboard
-->

# LEVEL App Constitution

This document establishes the non-negotiable principles and technical standards for the **LEVEL** fitness super-app. All AI-generated code and technical designs MUST strictly adhere to these rules.

## Technical Stack

### Framework & Language
- **Framework**: Expo SDK 54+ (React Native 0.76+) with Expo Router
- **Language**: TypeScript (Strict Mode enabled, no `any` types)
- **Minimum OS Support**: iOS 15+, Android 12+ (API 31+)
- **Target Platforms**: iOS, Android, Web (PWA)

### State Management & Data
- **Global State**: MobX State Tree (MST) for data models and persistence
- **Local State**: React useState/useReducer for component-level state
- **Async Storage**: MMKV for fast key-value persistence
- **Database**: SQLite (encrypted) for structured local data

### Backend Services (Firebase)
- **Authentication**: Firebase Auth (Google, Apple, Email/Password)
- **Database**: Cloud Firestore for user profiles, workouts, social data
- **AI Services**: Vertex AI (Generative AI for coaching, meal plans, recommendations)
- **Error Reporting**: Firebase Crashlytics
- **Analytics**: Firebase Analytics (future)
- **Storage**: Firebase Storage for user media, product images

### Payments & Subscriptions
- **Mobile**: Native In-App Purchases (Apple App Store, Google Play)
- **Web**: Stripe for web subscriptions
- **Tiers**: Three subscription tiers (Free Trial, Standard, Pro)

### Graphics & Animations
- **Canvas Graphics**: Shopify Skia for performance-critical UI and pose overlays
- **Animations**: React Native Reanimated 3 for all interactive transitions
- **Gestures**: React Native Gesture Handler

### AI & Computer Vision
- **Camera**: Vision Camera for frame capture
- **Pose Detection**: TensorFlow Lite (MoveNet Lightning/Thunder) for real-time form detection
- **Model Selection**: Adaptive based on device RAM (Lightning <5.5GB, Thunder ≥5.5GB)
- **Generative AI**: Vertex AI for chat coaching, meal plans, workout recommendations

### Health Integration
- **iOS**: Apple HealthKit (read/write workouts, heart rate, calories)
- **Android**: Health Connect (read/write exercise sessions, heart rate)

### Styling
- **Method**: Vanilla React Native StyleSheets (no Tailwind)
- **Typography**: Space Grotesk (primary), system fonts (fallback)
- **Color System**: VOLT brand palette (primary: #CCFF00)
- **Spacing**: 8-point grid system
- **Theming**: Dark/Light mode with system sync

## Core Principles

### I. Feature-Based Architecture
All code MUST be organized by feature domain, not by technical layer.

**Structure:**
```
app/
├── features/
│   ├── auth/           # Authentication domain
│   ├── workouts/       # Workout tracking domain
│   ├── nutrition/      # Nutrition & meal planning
│   ├── social/         # Social network features
│   ├── store/          # E-commerce domain
│   ├── coach/          # AI coaching domain
│   └── profile/        # User profile & settings
├── shared/
│   ├── components/     # Reusable UI components
│   ├── services/       # Cross-cutting services
│   ├── hooks/          # Shared custom hooks
│   └── utils/          # Utility functions
└── app/                # Expo Router routes
```

**Rules:**
- Each feature MUST be self-contained with its own components, services, and stores
- Cross-feature dependencies MUST go through shared services
- No circular dependencies between features

### II. "Form First" Aesthetics
The UI MUST feel premium and polished at all times.

**Requirements:**
- Dark mode as default with light mode support
- Space Grotesk typography throughout
- Fluid micro-animations on all interactions (min 60fps)
- Ken Burns effect for background images where appropriate
- Every screen MUST have clear entry and exit animation states
- Loading states MUST use skeleton screens, not spinners
- Empty states MUST be designed and meaningful

### III. Test-Driven Development (NON-NEGOTIABLE)
All business logic MUST follow TDD: Tests written → Tests fail → Implementation → Tests pass.

**Requirements:**
- Unit tests for all services, utilities, and business logic (Jest)
- Integration tests for critical user flows (Maestro E2E)
- Test coverage target: 80% for business logic, 100% for payment/auth flows
- Tests MUST be written BEFORE implementation code
- No PR merges with failing tests

**Critical Paths Requiring Full Coverage:**
- Authentication flows (login, signup, OAuth, logout)
- Payment processing (subscription, purchase, refund)
- Data synchronization (Firestore, Health Connect)
- Form validation logic (pose detection, nutrition)

### IV. Strict Typing
TypeScript strict mode MUST be enforced with zero escape hatches.

**Rules:**
- No `any` types (use `unknown` with type guards if needed)
- Interfaces MUST be defined for all props, state, and API responses
- Zod schemas for runtime validation of external data
- No `@ts-ignore` or `@ts-expect-error` without documented justification
- All API responses MUST be validated against schemas

### V. Absolute Imports
All imports MUST use path aliases for clarity and refactoring safety.

**Configuration:**
```typescript
// tsconfig.json paths
"@/*": ["app/*"],
"@features/*": ["app/features/*"],
"@shared/*": ["app/shared/*"],
"@assets/*": ["assets/*"]
```

**Example:**
```typescript
// CORRECT
import { Button } from "@shared/components"
import { useAuth } from "@features/auth/hooks"

// INCORRECT
import { Button } from "../../../shared/components"
```

### VI. Error Handling & Observability
All errors MUST be handled gracefully with user feedback and logging.

**Requirements:**
- Firebase Crashlytics for crash reporting (all platforms)
- User-friendly error messages (no technical jargon)
- Automatic retry for transient network failures (max 3 attempts)
- Error boundaries for all feature screens
- Structured logging for debugging (Reactotron in dev)

**Error Response Pattern:**
```typescript
interface AppError {
  code: string           // Machine-readable error code
  message: string        // User-friendly message
  details?: unknown      // Debug info (dev only)
  recoverable: boolean   // Can user retry?
}
```

### VII. Offline-First for Core Features
Core workout functionality MUST work without internet connection.

**Offline Requirements:**
- Workout tracking MUST work fully offline
- Data MUST sync automatically when connection restored
- Cached workouts, exercises, and user preferences
- Clear offline indicator in UI
- Conflict resolution: Last-write-wins with user notification

**Online-Only Features:**
- Social feed and messaging
- E-commerce purchases
- AI coaching chat
- Nutrition photo scanning

## Feature Domains

### Authentication
- Firebase Auth with Google, Apple, Email/Password
- Session persistence via secure storage
- Biometric unlock option (Face ID, Touch ID, Fingerprint)

### Workouts
- Real-time pose detection with form feedback
- Rep counting with state machine logic
- Audio coaching (TTS + pre-recorded)
- Workout plans by difficulty (Beginner, Intermediate, Advanced)
- Health Connect/HealthKit sync for completed workouts

### Nutrition
- Manual meal logging with macro tracking
- AI-generated personalized meal plans (Vertex AI)
- Food photo scanning for nutritional info
- Recipe database with search and favorites
- Daily/weekly nutrition summaries

### Social Network
- User profiles with workout history
- Follow/follower relationships
- Activity feed with workout posts
- Group challenges with leaderboards
- Community groups by fitness interest
- Real-time messaging (1:1 and group)

### E-Commerce (Physical Products)
- Product catalog (supplements, equipment, apparel)
- Shopping cart and checkout flow
- Inventory management integration
- Order tracking and history
- Shipping address management

### AI Coaching
- Chat interface for conversational coaching
- Voice assistant during workouts
- Contextual tips at appropriate moments
- Personalized recommendations based on history
- Multi-modal: text, voice, and visual cues

### Subscriptions
- **Free Trial**: 7 days full access
- **Standard**: Workouts, basic nutrition logging, limited AI
- **Pro**: Full AI coaching, advanced nutrition, social features, store discounts

## DevOps & Security

### Secrets Management
**⚠️ CRITICAL: NO SECRETS IN CODE OR CONSTITUTION**
- All API keys, credentials, and service accounts MUST be stored in:
  - Local: `.env.local` (git-ignored)
  - CI/CD: GitHub Actions Secrets / EAS Secrets
  - Production: Cloud Key Management / EAS Environment Variables
- Public keys (e.g., Firebase Config) allow in code but prefer `.env` injection.
- **NEVER** commit `google-services.json` or `GoogleService-Info.plist` with sensitive keys.

### CI/CD Strategy
- **Build System**: Expo Application Services (EAS) Build
  - `eas.json` defines build profiles (dev, preview, production)
- **Pipeline**: GitHub Actions
  - Lint/Test on PR
  - Auto-publish to "Preview" on merge to `develop`
  - Auto-submit to Stores on merge to `main` (via EAS Submit)
- **Firebase Deploy**:
  - `firebase deploy` via GitHub Actions for Functions/Firestore rules
  - `firebaserc` linked to `level-fitness-prod` / `level-fitness-dev` projects

## Development Workflow

### Spec-Driven Development
No code MUST be written before `spec.md` and `plan.md` are approved.

**Process:**
1. `/speckit.specify` - Define what and why
2. `/speckit.clarify` - Resolve ambiguities
3. `/speckit.plan` - Technical architecture
4. `/speckit.tasks` - Granular implementation steps
5. `/speckit.implement` - Code execution

### Code Quality Gates
- All public functions MUST have JSDoc comments
- All components MUST have prop interface documentation
- Prettier formatting enforced (pre-commit hook)
- ESLint rules enforced (no warnings allowed)
- Dependency cruiser for architecture violations

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/###-name` - Feature branches (from develop)
- `hotfix/###-name` - Critical fixes (from main)

## Data Privacy & Compliance

### GDPR Requirements
- Explicit consent for data collection
- Right to access personal data (export feature)
- Right to deletion (account deletion with data purge)
- Data minimization (collect only necessary data)
- Privacy policy acceptance during onboarding

### Health Data
- Health data stored locally by default
- Cloud sync requires explicit user consent
- No sharing of health data with third parties
- Encrypted at rest and in transit

## Governance

### Constitution Authority
This constitution supersedes all other development practices. Any conflict between this document and other guidelines MUST be resolved in favor of this constitution.

### Amendment Process
1. Proposed change documented with rationale
2. Impact analysis on existing code
3. Migration plan for breaking changes
4. Approval required before implementation
5. Version increment following semver

### Compliance Verification
- All PRs MUST verify compliance with constitution
- Architecture decisions MUST reference relevant principles
- Complexity MUST be justified against "Form First" and simplicity goals

**Version**: 1.0.0 | **Ratified**: 2026-01-14 | **Last Amended**: 2026-01-14
