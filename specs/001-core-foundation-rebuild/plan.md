# Implementation Plan: Core Foundation Rebuild

**Branch**: `001-core-foundation-rebuild` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `spec.md` (Rebuild of Welcome, Auth, Vision Camera with Constitution v1.0.0 compliance).

## Summary

This plan outlines the engineering approach to rebuild the user's "Core Foundation" (Welcome Screen, Authentication, and Vision Camera). We will establish the "Feature-Based" folder structure, implement the Offline-First Data Layer (SQLite + Sync), and rebuild the UI using Skia/Reanimated for a premium "Form First" experience.

## Technical Context

**Language/Version**: TypeScript 5.x (Strict Mode), Expo SDK 54+
**Primary Dependencies**: 
- `mobx-state-tree` (State)
- `react-native-reanimated`, `@shopify/react-native-skia` (UI/Graphics)
- `react-native-vision-camera`, `react-native-fast-tflite` (AI/CV)
- `expo-sqlite` + `drizzle-orm` (Data + Encryption)
- `expo-av`, `expo-speech` (Audio Feedback)
**Target Platform**: iOS 15+, Android 12+ (Mobile Only)
**Performance Goals**: 
- App Load < 3s
- Animation FPS: 60fps (Soft), 120fps (Target)
- Pose Latency: < 500ms
**Constraints**: Network-Resilience: Critical workout data must be queued locally if server is unreachable.

## Constitution Check

*   **Feature-Based Architecture**: ✅ Plan enforces `features/auth`, `features/vision` structure.
*   **Form First Aesthetics**: ✅ Skia/Reanimated mandated for Welcome/Vision screens.
*   **TDD**: ✅ Jest + Maestro testing strategy defined.
*   **Strict Typing**: ✅ Enforced via tsconfig and EZ-Schema/Zod.
*   **Privacy**: ✅ Local-first processing of vision data (no video upload).

## Project Structure

### Source Code Architecture

```text
app/
├── features/
│   ├── auth/
│   │   ├── components/     # LoginForm, SocialAuthButton
│   │   ├── screens/        # LoginScreen, SignupScreen
│   │   ├── services/       # FirebaseAuthService
│   │   └── models/         # AuthStore (MST)
│   │
│   ├── welcome/
│   │   ├── components/     # AnimatedBackground (Skia)
│   │   ├── screens/        # WelcomeScreen, OnboardingScreen
│   │   └── models/         # OnboardingStore
│   │
│   └── vision/
│       ├── components/     # CameraView, PoseOverlay (Skia)
│       ├── services/       # PoseDetectionService (TFLite), AudioFeedbackService (TTS)
│       ├── models/         # VisionStore, CalibrationStore
│       └── utils/          # GeometryUtils
│
├── shared/
│   ├── services/
│   │   ├── local-db/       # SQLiteService (Drizzle ORM)
│   │   ├── sync/           # FirestoreSyncService (Queue logic)
│   │   └── api/            # Base API client
│   │
│   ├── stores/             # RootStore (MST)
│   └── theme/              # Colors, Typography, Layout
│
└── app/                    # Expo Router (Navigation)
    ├── index.tsx           # Redirect logic
    ├── (auth)/             # Auth routes
    └── (main)/             # Main app tabs
```

## Implementation Phases

### Phase 1: Foundation & Data Layer
1.  **Project Shell**: Initialize Expo + Ignite boilerplate cleanup.
2.  **Navigation**: Set up Expo Router with "AuthGuard" logic.
3.  **Data Layer**: 
    -   Setup SQLite migrations for `users`, `workout_plans`, `logs`.
    -   Implement `SyncQueue` logic.
    -   Setup MST RootStore.

### Phase 2: Authentication & Welcome
1.  **Welcome UI**: Skia-based background animation.
2.  **Auth Service**: Firebase Auth integration (Google/Apple).
3.  **Session Mgmt**: Secure storage of tokens + Offline persistent session restore.

### Phase 3: Vision Engine (Core)
1.  **Camera**: Vision Camera integration with frame processor.
2.  **Model**: TFLite model loading (MoveNet).
3.  **Overlay**: Skia canvas for skeleton drawing (60fps).
4.  **Loop**: Frame -> Detect -> keypoints -> Render.

### Phase 4: Integration & Sync
1.  **Sync Logic**: Background worker to push `offline_changes` to Firestore.
2.  **Maestro Tests**: E2E flows for Login -> Permission -> Camera.

## Testing Strategy

*   **Unit Tests (Jest)**: 
    -   `AuthStore`: Session persistence, login logic.
    -   `SyncQueue`: FIFO processing, retry logic.
    -   `GeometryUtils`: Angle calculations for pose detection.
*   **Integration (Maestro)**:
    -   `login_flow.yaml`: Full auth lifecycle.
    -   `offline_mode.yaml`: Toggle airplane mode, verify app launch.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Custom Sync Engine | Data Safety Requirement | We need a reliable "Store & Forward" queue to ensure workout data isn't lost during connection drops. |
| MobX State Tree | Deep object tree & references | Redux/Zustand require manual normalization for complex nested workout data. |
