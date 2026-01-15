---
description: "Task list for Core Foundation Rebuild feature"
---

# Tasks: Core Foundation Rebuild

**Input**: Design documents from `/specs/001-core-foundation-rebuild/`
**Prerequisites**: plan.md, spec.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Expo project structure & cleanup Ignite boilerplate
- [ ] T002 [P] Install dependencies: `mobx-state-tree`, `react-native-reanimated`, `@shopify/react-native-skia`, `expo-router`
- [ ] T003 [P] Configure strict `tsconfig.json` paths (`@features/*`, `@shared/*`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Setup Drizzle ORM + `expo-sqlite` with migrations folder structure
- [ ] T005 Create `users`, `auth_sessions`, `sync_queue` tables (DDL)
- [ ] T006 [P] Setup MST `RootStore` and base `AuthStore`
- [ ] T007 [P] Configure Expo Router root layout with `AuthGuard`
- [ ] T008 [P] Setup `AudioService` (wrapping `expo-av`/`expo-speech`)
- [ ] T009 [P] Setup `FirestoreSyncService` skeleton

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - First Launch Experience (Priority: P1)

**Goal**: Polished welcome screen with Skia animations

**Independent Test**: Launch app, verify 60fps animations and branding

### Implementation for User Story 1

- [ ] T010 [P] [US1] Create `WelcomeScreen` in `app/features/welcome/screens/WelcomeScreen.tsx`
- [ ] T011 [P] [US1] Implement `AnimatedBackground` component using Skia
- [ ] T012 [US1] Implement "Get Started" flow logic in `OnboardingStore`
- [ ] T013 [US1] Connect `WelcomeScreen` to Router and Store

---

## Phase 4: User Story 2 - Account Creation (Priority: P1)

**Goal**: Google/Apple/Email Auth flow

**Independent Test**: Complete signup and verify user is created in SQLite and Firebase Auth

### Implementation for User Story 2

- [ ] T014 [P] [US2] Create `LoginScreen` and `SignupScreen` in `app/features/auth/screens/`
- [ ] T015 [P] [US2] Implement `FirebaseAuthService` (Google/Apple/Email logic)
- [ ] T016 [US2] Update `AuthStore` to handle login/signup actions
- [ ] T017 [US2] Integrate `FirebaseAuthService` into `AuthStore`
- [ ] T018 [US2] Implement form validation (Zod) for Email signup

---

## Phase 5: User Story 3 - Returning User Login (Priority: P1)

**Goal**: Session persistence and biometrics

**Independent Test**: Restart app, verify auto-login. Toggle biometrics.

### Implementation for User Story 3

- [ ] T019 [P] [US3] Implement `SessionService` (SecureStore + SQLite `auth_sessions`)
- [ ] T020 [US3] Add `autoLogin` action to `AuthStore` (check local token)
- [ ] T021 [US3] Implement Biometric prompt logic using `expo-local-authentication`

---

## Phase 6: User Story 4 - Vision Engine (Priority: P2)

**Goal**: Real-time pose detection and simple rep counting

**Independent Test**: Camera opens, skeleton matches body, squat counts 1..2..3

### Implementation for User Story 4

- [ ] T022 [P] [US4] Install & Config `react-native-vision-camera` + `react-native-fast-tflite`
- [ ] T023 [P] [US4] Create `PoseDetectionService` (Load MoveNet model)
- [ ] T024 [US4] Create `CameraView` component with `useFrameProcessor`
- [ ] T025 [US4] Implement `GeometryUtils` (angle calculation)
- [ ] T026 [US4] Implement `RepCounter` logic (State machine: Idle -> Descending -> Bottom -> Ascending)
- [ ] T027 [US4] Implement `PoseOverlay` component (Skia drawing of keypoints)

---

## Phase 7: User Story 5 - Offline Capability (Priority: P2)

**Goal**: Data safety via "Store & Forward" queue

**Independent Test**: Create data offline, reconnect, verify SyncQueue flushes to Firestore

### Implementation for User Story 5

- [ ] T028 [P] [US5] Implement `SyncQueue` logic in `SQLiteService`
- [ ] T029 [US5] Implement `flushQueue` in `FirestoreSyncService`
- [ ] T030 [US5] Add `NetworkStatus` listener to trigger flush on reconnect

---

## Phase 8: User Story 6 - Calibration (Priority: P3)

**Goal**: User positioning guidance

**Independent Test**: Stand too close -> Warning. Stand correct -> "Ready"

### Implementation for User Story 6

- [ ] T031 [P] [US6] Create `CalibrationStore` (State: Searching -> BadPosition -> Ready)
- [ ] T032 [US6] Add "Distance/Centering" checks to `PoseDetectionService`
- [ ] T033 [US6] Implement UI overlay for Calibration feedback

