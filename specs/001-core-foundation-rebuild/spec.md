# Feature Specification: Core Foundation Rebuild

**Feature Branch**: `001-core-foundation-rebuild`
**Created**: 2026-01-14
**Status**: Draft
**Input**: User description: "Rebuild the core features from the @archive project (Welcome Screen, Auth Flow, Vision Camera integration), but fully compliant with our new Constitution."

## Overview

This specification defines the rebuild of LEVEL's foundational features from the archived codebase, ensuring full compliance with the ratified Constitution v1.0.0. The rebuild establishes the architectural patterns, data layers, and UI foundations that all future features will build upon.

**Scope**: Welcome experience, authentication flows, and real-time vision camera integration for exercise form detection.

**Out of Scope**: Nutrition features, social network, e-commerce, AI coaching chat (these will be separate features built on this foundation).

## Clarifications

### Session 2026-01-14

- Q: Should data schema be explicitly defined in spec? → A: Yes, include SQLite DDL and Firestore structure for future AI Agent support
- Q: What AI-ready fields should be included? → A: Embeddings (768-dim vectors), ai_coach_notes, ai_rationale, anomaly_score, mood tracking
- Q: How should offline sync be structured? → A: Sync queue table with retry logic, cloud_version for optimistic locking
- Q: Should telemetry be stored locally or cloud-only? → A: Both - local SQLite for immediate access, Firestore subcollection for long-term analysis

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First Launch Experience (Priority: P1)

A new user downloads the LEVEL app for the first time. They are greeted with a premium, animated welcome screen that establishes the brand identity and guides them toward account creation.

**Why this priority**: First impressions determine user retention. A polished welcome experience sets expectations for app quality and motivates users to complete onboarding.

**Independent Test**: Can be fully tested by launching the app as a new user and verifying smooth animations, brand consistency, and clear call-to-action. Delivers immediate visual value.

**Acceptance Scenarios**:

1. **Given** the app is launched for the first time, **When** the splash screen completes, **Then** user sees an animated welcome screen with brand imagery, tagline, and "Get Started" button within 2 seconds
2. **Given** the welcome screen is displayed, **When** user interacts with any element, **Then** micro-animations provide immediate visual feedback (within 100ms)
3. **Given** the app is launched on any supported device, **When** the welcome screen loads, **Then** animations run at minimum 60fps without frame drops

---

### User Story 2 - Account Creation (Priority: P1)

A new user creates an account using their preferred authentication method (Google, Apple, or Email/Password) to access personalized fitness features.

**Why this priority**: Authentication is the gateway to all personalized features. Without accounts, users cannot save progress, sync data, or access premium features.

**Independent Test**: Can be fully tested by completing signup with each auth method and verifying account creation, profile initialization, and successful login state.

**Acceptance Scenarios**:

1. **Given** user taps "Get Started", **When** auth options are displayed, **Then** user sees Google Sign-In, Apple Sign-In, and Email options clearly presented
2. **Given** user selects Google Sign-In, **When** OAuth flow completes successfully, **Then** user is authenticated and redirected to onboarding within 3 seconds
3. **Given** user selects Apple Sign-In on iOS, **When** Face ID/Touch ID completes, **Then** user is authenticated seamlessly
4. **Given** user selects Email signup, **When** they enter valid email and password (8+ chars, 1 uppercase, 1 number), **Then** account is created and verification email is sent
5. **Given** user enters invalid credentials, **When** they submit the form, **Then** specific, helpful error messages appear inline (not generic errors)

---

### User Story 3 - Returning User Login (Priority: P1)

A returning user logs back into the app to continue their fitness journey, with their previous session state restored.

**Why this priority**: Seamless re-authentication encourages daily app usage. Friction at login causes user churn.

**Independent Test**: Can be fully tested by logging out and logging back in, verifying session restoration and data persistence.

**Acceptance Scenarios**:

1. **Given** user has previously logged in, **When** app launches, **Then** user is automatically authenticated (session persisted) without re-entering credentials
2. **Given** session has expired, **When** user opens app, **Then** they see login screen with pre-filled email (if previously used email auth)
3. **Given** user is offline, **When** they attempt to login, **Then** cached credentials allow access to offline-available features with clear offline indicator
4. **Given** user taps "Forgot Password", **When** they enter their email, **Then** password reset email is sent within 30 seconds

---

### User Story 4 - Real-Time Exercise Form Detection (Priority: P2)

A user performs a squat exercise while the camera provides real-time visual and audio feedback on their form, counting reps and detecting common mistakes.

**Why this priority**: Form detection is LEVEL's core differentiator. After authentication, this is the primary value proposition.

**Independent Test**: Can be fully tested by performing squats in front of the camera and verifying skeleton overlay, rep counting accuracy, and form feedback.

**Acceptance Scenarios**:

1. **Given** user starts a workout, **When** camera activates, **Then** pose skeleton overlay appears on their body within 500ms
2. **Given** user is in frame, **When** they perform a squat, **Then** the rep counter increments when they return to standing position
3. **Given** user's knees cave inward during squat, **When** detected for 3+ consecutive frames, **Then** audio feedback plays: "Keep your knees out"
4. **Given** user doesn't reach proper depth, **When** they begin ascending early, **Then** audio feedback plays: "Go deeper"
5. **Given** user has poor lighting, **When** pose confidence drops below threshold, **Then** visual indicator shows "Adjust lighting or position"
6. **Given** user completes target reps, **When** set finishes, **Then** celebratory audio and visual feedback plays, rest timer begins

---

### User Story 5 - Offline Workout Capability (Priority: P2)

A user performs a workout without internet connection, with all data syncing automatically when connectivity is restored.

**Why this priority**: Users often work out in gyms or outdoor locations with poor connectivity. Offline support prevents workout interruption.

**Independent Test**: Can be fully tested by enabling airplane mode, completing a workout, then restoring connectivity and verifying data sync.

**Acceptance Scenarios**:

1. **Given** user has no internet connection, **When** they start a workout, **Then** all camera-based features work normally with "Offline" indicator visible
2. **Given** workout completes offline, **When** connectivity is restored, **Then** workout data syncs to cloud within 60 seconds automatically
3. **Given** user logs in offline with cached session, **When** they access the app, **Then** previously downloaded workout plans are available

---

### User Story 6 - Device Calibration (Priority: P3)

A user positions themselves correctly before a workout so the AI can accurately detect their movements throughout the session.

**Why this priority**: Accurate calibration ensures reliable form detection. Poor calibration leads to frustrating false positives/negatives.

**Independent Test**: Can be fully tested by going through calibration flow and verifying position guidance and "ready" state detection.

**Acceptance Scenarios**:

1. **Given** user starts workout, **When** calibration begins, **Then** visual guide shows ideal body positioning (full body in frame)
2. **Given** user's face is not visible, **When** calibration runs, **Then** prompt appears: "Step back so your full body is visible"
3. **Given** user's feet are cut off, **When** calibration runs, **Then** prompt appears: "Ensure your feet are in frame"
4. **Given** user is properly positioned, **When** 30 stable frames are captured, **Then** "Ready!" indicator appears and workout can begin

---

### Edge Cases

- What happens when camera permission is denied? → Show permission explanation screen with "Open Settings" button
- What happens when user's device doesn't support required camera features? → Show graceful fallback with manual rep counting option
- What happens when multiple people are in frame? → Focus on the person closest to camera center, ignore others
- What happens during network timeout during OAuth? → Retry automatically up to 3 times, then show "Try Again" with offline option
- What happens when user force-closes app mid-workout? → Resume workout from last known state on next launch (within 30 min window)
- What happens when device battery is critically low? → Reduce camera frame rate to conserve battery, notify user

## Requirements *(mandatory)*

### Functional Requirements

**Authentication Domain:**
- **FR-001**: System MUST allow users to create accounts using Google OAuth
- **FR-002**: System MUST allow users to create accounts using Apple Sign-In (iOS native, web fallback for Android)
- **FR-003**: System MUST allow users to create accounts using email and password
- **FR-004**: System MUST validate passwords meet security requirements (minimum 8 characters, 1 uppercase, 1 number)
- **FR-005**: System MUST persist authentication sessions securely across app restarts
- **FR-006**: System MUST support biometric authentication (Face ID, Touch ID, Fingerprint) for returning users
- **FR-007**: System MUST allow users to sign out and clear session data
- **FR-008**: System MUST support password reset via email

**Welcome & Onboarding Domain:**
- **FR-009**: System MUST display animated splash screen on app launch
- **FR-010**: System MUST display welcome screen with brand imagery and clear call-to-action
- **FR-011**: System MUST provide smooth transitions between all onboarding screens (60fps minimum)
- **FR-012**: System MUST support dark mode as default with light mode option

**Vision Camera Domain:**
- **FR-013**: System MUST capture real-time camera frames for pose detection
- **FR-014**: System MUST detect and visualize 17-point skeletal pose on user's body
- **FR-015**: System MUST count exercise repetitions based on body position state changes
- **FR-016**: System MUST detect common form errors (knee valgus, insufficient depth, poor posture)
- **FR-017**: System MUST provide audio feedback for form corrections with priority queuing
- **FR-018**: System MUST adapt AI model selection based on device capability (performance vs accuracy tradeoff)
- **FR-019**: System MUST display calibration guidance before workout begins
- **FR-020**: System MUST work fully offline for core workout features

**Data Persistence Domain:**
- **FR-021**: System MUST store user profile data locally with encryption
- **FR-022**: System MUST sync user data to cloud when connectivity is available
- **FR-023**: System MUST resolve sync conflicts using last-write-wins strategy with user notification
- **FR-024**: System MUST cache workout plans for offline access
- **FR-025**: System MUST store workout history and statistics
- **FR-026**: System MUST maintain a sync queue for offline changes pending upload
- **FR-027**: System MUST store telemetry data locally for post-workout analysis
- **FR-028**: System MUST support soft-delete for data recovery scenarios
- **FR-029**: System MUST track cloud version numbers for optimistic locking
- **FR-030**: System MUST store vector embeddings for future AI personalization

### Key Entities

- **User**: Unique identifier, email, display name, profile photo URL, auth provider, created date, last login
- **AuthSession**: User reference, access token, refresh token, expiry timestamp, device ID
- **WorkoutPlan**: Unique identifier, name, difficulty level, description, exercise blocks
- **ExerciseBlock**: Exercise reference, target sets, target reps, rest duration
- **Exercise**: Unique identifier, name, description, form cues, video URL (optional)
- **WorkoutSession**: User reference, workout plan reference, start time, end time, status, sets completed
- **SetResult**: Session reference, exercise reference, set number, reps completed, form score, duration
- **FormFeedback**: Timestamp, feedback type, severity, audio played
- **UserPreferences**: Theme preference, audio enabled, haptics enabled, language, units (metric/imperial)

## Data Schema *(mandatory for this feature)*

This section defines the concrete data structures for offline persistence (SQLite) and cloud synchronization (Firestore). All schemas include fields to support future AI Agent capabilities.

### SQLite Tables (Offline Persistence)

The following DDL defines local database tables for offline-first functionality:

```sql
-- ============================================
-- USERS TABLE
-- Primary user identity and profile data
-- ============================================
CREATE TABLE users (
    id                      TEXT PRIMARY KEY,           -- Firebase UID or generated UUID
    email                   TEXT NOT NULL UNIQUE,
    display_name            TEXT,
    photo_url               TEXT,
    auth_provider           TEXT NOT NULL,              -- 'google' | 'apple' | 'email'

    -- Profile & Fitness Data
    fitness_level           TEXT DEFAULT 'beginner',    -- 'beginner' | 'intermediate' | 'advanced'
    height_cm               REAL,
    weight_kg               REAL,
    date_of_birth           TEXT,                       -- ISO 8601 date

    -- AI Agent Support Fields
    ai_coach_persona        TEXT DEFAULT 'default',     -- Selected AI coach personality
    ai_coach_notes          TEXT,                       -- JSON: AI-generated observations about user
    user_embedding          BLOB,                       -- Vector embedding for personalization (768-dim float32)
    ai_interaction_count    INTEGER DEFAULT 0,          -- Track AI engagement for model training

    -- Sync & Metadata
    created_at              TEXT NOT NULL,              -- ISO 8601 timestamp
    updated_at              TEXT NOT NULL,
    last_login_at           TEXT,
    sync_status             TEXT DEFAULT 'pending',     -- 'synced' | 'pending' | 'conflict'
    cloud_version           INTEGER DEFAULT 0,          -- For conflict resolution
    is_deleted              INTEGER DEFAULT 0           -- Soft delete flag
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_sync_status ON users(sync_status);

-- ============================================
-- AUTH_SESSIONS TABLE
-- Secure session management
-- ============================================
CREATE TABLE auth_sessions (
    id                      TEXT PRIMARY KEY,
    user_id                 TEXT NOT NULL,
    device_id               TEXT NOT NULL,

    -- Token Storage (encrypted at rest)
    access_token_hash       TEXT,                       -- Hashed, not plaintext
    refresh_token_hash      TEXT,
    token_expiry            TEXT NOT NULL,              -- ISO 8601 timestamp

    -- Session Metadata
    created_at              TEXT NOT NULL,
    last_activity_at        TEXT,
    is_biometric_enabled    INTEGER DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_sessions_device ON auth_sessions(device_id);

-- ============================================
-- WORKOUT_PLANS TABLE
-- Predefined and custom workout templates
-- ============================================
CREATE TABLE workout_plans (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    description             TEXT,
    difficulty_level        TEXT NOT NULL,              -- 'beginner' | 'intermediate' | 'advanced'
    estimated_duration_min  INTEGER,

    -- AI Agent Support Fields
    ai_generated            INTEGER DEFAULT 0,          -- Was this plan AI-created?
    ai_rationale            TEXT,                       -- JSON: Why AI recommended this plan
    plan_embedding          BLOB,                       -- Vector embedding for similarity search
    effectiveness_score     REAL,                       -- AI-calculated based on user outcomes

    -- Sync & Metadata
    created_at              TEXT NOT NULL,
    updated_at              TEXT NOT NULL,
    created_by              TEXT,                       -- User ID or 'system'
    is_template             INTEGER DEFAULT 0,          -- System template vs user-created
    sync_status             TEXT DEFAULT 'synced'
);

CREATE INDEX idx_plans_difficulty ON workout_plans(difficulty_level);

-- ============================================
-- EXERCISES TABLE
-- Exercise definitions and form guidance
-- ============================================
CREATE TABLE exercises (
    id                      TEXT PRIMARY KEY,
    name                    TEXT NOT NULL,
    description             TEXT,
    muscle_groups           TEXT,                       -- JSON array: ['quadriceps', 'glutes']
    equipment_required      TEXT,                       -- JSON array: ['none'] or ['barbell', 'rack']

    -- Form Detection Config
    form_cues               TEXT,                       -- JSON array of coaching cues
    keypoint_config         TEXT,                       -- JSON: Which pose keypoints to track
    depth_threshold_degrees REAL,                       -- Angle for "proper depth"

    -- AI Agent Support Fields
    exercise_embedding      BLOB,                       -- Vector embedding for exercise similarity
    ai_form_tips            TEXT,                       -- JSON: AI-generated personalized tips
    difficulty_modifier     REAL DEFAULT 1.0,           -- AI-adjusted difficulty factor

    -- Media
    video_url               TEXT,
    thumbnail_url           TEXT,

    -- Metadata
    created_at              TEXT NOT NULL,
    updated_at              TEXT NOT NULL
);

CREATE INDEX idx_exercises_name ON exercises(name);

-- ============================================
-- WORKOUT_LOGS TABLE
-- Completed workout session records
-- ============================================
CREATE TABLE workout_logs (
    id                      TEXT PRIMARY KEY,
    user_id                 TEXT NOT NULL,
    workout_plan_id         TEXT,

    -- Session Timing
    started_at              TEXT NOT NULL,              -- ISO 8601 timestamp
    completed_at            TEXT,
    duration_seconds        INTEGER,

    -- Session Status
    status                  TEXT DEFAULT 'in_progress', -- 'in_progress' | 'completed' | 'abandoned'
    completion_percentage   REAL DEFAULT 0,

    -- Aggregated Metrics
    total_reps              INTEGER DEFAULT 0,
    total_sets              INTEGER DEFAULT 0,
    avg_form_score          REAL,                       -- 0.0 - 1.0
    calories_burned         REAL,

    -- AI Agent Support Fields
    ai_coach_notes          TEXT,                       -- JSON: AI observations during workout
    ai_performance_summary  TEXT,                       -- AI-generated workout summary
    session_embedding       BLOB,                       -- Vector embedding for session similarity
    ai_suggested_next       TEXT,                       -- JSON: AI recommendation for next workout
    mood_before             TEXT,                       -- User-reported or AI-inferred
    mood_after              TEXT,
    perceived_exertion      INTEGER,                    -- RPE 1-10 scale

    -- Environment Context (for AI learning)
    device_model            TEXT,
    os_version              TEXT,
    lighting_quality        TEXT,                       -- 'good' | 'fair' | 'poor'

    -- Sync & Metadata
    created_at              TEXT NOT NULL,
    updated_at              TEXT NOT NULL,
    sync_status             TEXT DEFAULT 'pending',
    cloud_version           INTEGER DEFAULT 0,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id)
);

CREATE INDEX idx_logs_user ON workout_logs(user_id);
CREATE INDEX idx_logs_status ON workout_logs(status);
CREATE INDEX idx_logs_sync ON workout_logs(sync_status);
CREATE INDEX idx_logs_date ON workout_logs(started_at);

-- ============================================
-- SET_RESULTS TABLE
-- Individual set performance within a workout
-- ============================================
CREATE TABLE set_results (
    id                      TEXT PRIMARY KEY,
    workout_log_id          TEXT NOT NULL,
    exercise_id             TEXT NOT NULL,

    -- Set Details
    set_number              INTEGER NOT NULL,
    target_reps             INTEGER,
    actual_reps             INTEGER NOT NULL,

    -- Form Analysis
    form_score              REAL,                       -- 0.0 - 1.0 overall form quality
    form_errors             TEXT,                       -- JSON array of detected errors
    best_rep_score          REAL,                       -- Highest single rep score
    worst_rep_score         REAL,                       -- Lowest single rep score

    -- Timing
    started_at              TEXT NOT NULL,
    completed_at            TEXT,
    duration_seconds        INTEGER,
    rest_duration_seconds   INTEGER,

    -- AI Agent Support Fields
    ai_rep_analysis         TEXT,                       -- JSON: Per-rep AI analysis
    ai_form_feedback        TEXT,                       -- AI-generated coaching feedback
    improvement_delta       REAL,                       -- Change from previous set

    FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE INDEX idx_sets_workout ON set_results(workout_log_id);
CREATE INDEX idx_sets_exercise ON set_results(exercise_id);

-- ============================================
-- TELEMETRY TABLE
-- Real-time pose and form data capture
-- ============================================
CREATE TABLE telemetry (
    id                      TEXT PRIMARY KEY,
    workout_log_id          TEXT NOT NULL,
    set_result_id           TEXT,

    -- Timing
    timestamp               TEXT NOT NULL,              -- ISO 8601 with milliseconds
    frame_number            INTEGER,

    -- Pose Data
    keypoints               TEXT NOT NULL,              -- JSON: 17-point skeleton data
    pose_confidence         REAL,                       -- Overall detection confidence
    bounding_box            TEXT,                       -- JSON: {x, y, width, height}

    -- Form Analysis (per-frame)
    exercise_state          TEXT,                       -- 'idle' | 'descending' | 'bottom' | 'ascending'
    current_angle           REAL,                       -- Primary joint angle (e.g., knee)
    form_violations         TEXT,                       -- JSON array of current violations

    -- AI Agent Support Fields
    ai_confidence           REAL,                       -- AI model confidence for this frame
    anomaly_score           REAL,                       -- Deviation from expected movement
    embedding_delta         BLOB,                       -- Compact frame embedding for analysis

    -- Audio Feedback Triggered
    audio_cue_played        TEXT,                       -- Which audio cue was triggered, if any

    FOREIGN KEY (workout_log_id) REFERENCES workout_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (set_result_id) REFERENCES set_results(id)
);

CREATE INDEX idx_telemetry_workout ON telemetry(workout_log_id);
CREATE INDEX idx_telemetry_timestamp ON telemetry(timestamp);

-- ============================================
-- USER_PREFERENCES TABLE
-- App settings and personalization
-- ============================================
CREATE TABLE user_preferences (
    user_id                 TEXT PRIMARY KEY,

    -- Display Settings
    theme                   TEXT DEFAULT 'dark',        -- 'dark' | 'light' | 'system'
    language                TEXT DEFAULT 'en',
    units                   TEXT DEFAULT 'metric',      -- 'metric' | 'imperial'

    -- Audio Settings
    audio_enabled           INTEGER DEFAULT 1,
    audio_volume            REAL DEFAULT 0.8,
    haptics_enabled         INTEGER DEFAULT 1,

    -- AI Coach Settings
    ai_coach_enabled        INTEGER DEFAULT 1,
    ai_verbosity            TEXT DEFAULT 'normal',      -- 'minimal' | 'normal' | 'verbose'
    ai_voice_style          TEXT DEFAULT 'encouraging', -- 'encouraging' | 'strict' | 'calm'

    -- Privacy Settings
    analytics_enabled       INTEGER DEFAULT 1,
    crash_reporting         INTEGER DEFAULT 1,
    cloud_sync_enabled      INTEGER DEFAULT 1,

    -- Sync
    updated_at              TEXT NOT NULL,
    sync_status             TEXT DEFAULT 'pending',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- SYNC_QUEUE TABLE
-- Pending changes for cloud synchronization
-- ============================================
CREATE TABLE sync_queue (
    id                      TEXT PRIMARY KEY,
    table_name              TEXT NOT NULL,
    record_id               TEXT NOT NULL,
    operation               TEXT NOT NULL,              -- 'create' | 'update' | 'delete'
    payload                 TEXT NOT NULL,              -- JSON of changes
    created_at              TEXT NOT NULL,
    retry_count             INTEGER DEFAULT 0,
    last_error              TEXT
);

CREATE INDEX idx_sync_table ON sync_queue(table_name);
CREATE INDEX idx_sync_created ON sync_queue(created_at);
```

### Firestore Collection Structure

Cloud database for cross-device sync and future AI processing:

```
firestore/
├── users/                              # User profiles (1 doc per user)
│   └── {userId}/
│       ├── email: string
│       ├── displayName: string
│       ├── photoUrl: string
│       ├── authProvider: 'google' | 'apple' | 'email'
│       ├── fitnessLevel: 'beginner' | 'intermediate' | 'advanced'
│       ├── heightCm: number
│       ├── weightKg: number
│       ├── dateOfBirth: timestamp
│       │
│       ├── # AI Agent Fields
│       ├── aiCoachPersona: string
│       ├── aiCoachNotes: map              # AI observations
│       │   ├── strengthAreas: string[]
│       │   ├── improvementAreas: string[]
│       │   ├── preferredExercises: string[]
│       │   └── lastAssessment: timestamp
│       ├── userEmbedding: bytes           # 768-dim vector for personalization
│       ├── aiInteractionCount: number
│       │
│       ├── # Metadata
│       ├── createdAt: timestamp
│       ├── updatedAt: timestamp
│       ├── lastLoginAt: timestamp
│       └── version: number                # Optimistic locking
│
├── users/{userId}/preferences/         # Subcollection for settings
│   └── settings/
│       ├── theme: 'dark' | 'light'
│       ├── language: string
│       ├── units: 'metric' | 'imperial'
│       ├── audioEnabled: boolean
│       ├── aiCoachEnabled: boolean
│       ├── aiVerbosity: 'minimal' | 'normal' | 'verbose'
│       └── updatedAt: timestamp
│
├── users/{userId}/workoutLogs/         # Subcollection for workout history
│   └── {logId}/
│       ├── workoutPlanId: string
│       ├── startedAt: timestamp
│       ├── completedAt: timestamp
│       ├── durationSeconds: number
│       ├── status: 'in_progress' | 'completed' | 'abandoned'
│       ├── completionPercentage: number
│       ├── totalReps: number
│       ├── totalSets: number
│       ├── avgFormScore: number
│       ├── caloriesBurned: number
│       │
│       ├── # AI Agent Fields
│       ├── aiCoachNotes: map
│       │   ├── highlights: string[]       # Notable achievements
│       │   ├── concerns: string[]         # Areas needing attention
│       │   ├── recommendation: string     # Next workout suggestion
│       │   └── generatedAt: timestamp
│       ├── aiPerformanceSummary: string
│       ├── sessionEmbedding: bytes
│       ├── aiSuggestedNext: map
│       │   ├── planId: string
│       │   ├── rationale: string
│       │   └── confidence: number
│       ├── moodBefore: string
│       ├── moodAfter: string
│       ├── perceivedExertion: number      # RPE 1-10
│       │
│       ├── # Context
│       ├── deviceModel: string
│       ├── lightingQuality: string
│       └── version: number
│
├── users/{userId}/workoutLogs/{logId}/sets/  # Set-level data
│   └── {setId}/
│       ├── exerciseId: string
│       ├── setNumber: number
│       ├── targetReps: number
│       ├── actualReps: number
│       ├── formScore: number
│       ├── formErrors: string[]
│       ├── durationSeconds: number
│       ├── aiRepAnalysis: map[]           # Per-rep breakdown
│       └── aiFormFeedback: string
│
├── workoutPlans/                       # Global workout templates
│   └── {planId}/
│       ├── name: string
│       ├── description: string
│       ├── difficultyLevel: string
│       ├── estimatedDurationMin: number
│       ├── exerciseBlocks: map[]
│       │   ├── exerciseId: string
│       │   ├── targetSets: number
│       │   ├── targetReps: number
│       │   └── restSeconds: number
│       ├── aiGenerated: boolean
│       ├── aiRationale: string
│       ├── planEmbedding: bytes
│       ├── effectivenessScore: number
│       ├── createdBy: string
│       ├── isTemplate: boolean
│       └── createdAt: timestamp
│
├── exercises/                          # Exercise library
│   └── {exerciseId}/
│       ├── name: string
│       ├── description: string
│       ├── muscleGroups: string[]
│       ├── equipmentRequired: string[]
│       ├── formCues: string[]
│       ├── keypointConfig: map
│       ├── depthThresholdDegrees: number
│       ├── exerciseEmbedding: bytes
│       ├── aiFormTips: map
│       ├── videoUrl: string
│       └── thumbnailUrl: string
│
└── telemetry/{userId}/sessions/{logId}/  # High-frequency telemetry (separate for performance)
    └── frames/
        └── {frameId}/
            ├── timestamp: timestamp
            ├── frameNumber: number
            ├── keypoints: map[]           # 17-point skeleton
            ├── poseConfidence: number
            ├── exerciseState: string
            ├── currentAngle: number
            ├── formViolations: string[]
            ├── aiConfidence: number
            ├── anomalyScore: number
            └── audioCuePlayed: string
```

### Entity Field Specifications

#### User Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Firebase UID or UUID |
| email | string | Yes | Unique email address |
| displayName | string | No | User's display name |
| photoUrl | string | No | Profile photo URL |
| authProvider | enum | Yes | 'google', 'apple', or 'email' |
| fitnessLevel | enum | No | 'beginner', 'intermediate', 'advanced' |
| heightCm | number | No | Height in centimeters |
| weightKg | number | No | Weight in kilograms |
| dateOfBirth | date | No | For age-appropriate recommendations |
| aiCoachPersona | string | No | Selected AI personality |
| aiCoachNotes | object | No | AI-generated user observations |
| userEmbedding | bytes | No | 768-dim float32 vector for personalization |
| aiInteractionCount | number | No | Track AI engagement metrics |
| createdAt | timestamp | Yes | Account creation time |
| updatedAt | timestamp | Yes | Last modification time |
| lastLoginAt | timestamp | No | Most recent login |

#### WorkoutLog Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique log identifier |
| userId | string | Yes | Reference to user |
| workoutPlanId | string | No | Reference to workout plan |
| startedAt | timestamp | Yes | Session start time |
| completedAt | timestamp | No | Session end time |
| durationSeconds | number | No | Total workout duration |
| status | enum | Yes | 'in_progress', 'completed', 'abandoned' |
| completionPercentage | number | No | 0-100 progress |
| totalReps | number | No | Aggregate rep count |
| totalSets | number | No | Aggregate set count |
| avgFormScore | number | No | 0.0-1.0 average form quality |
| caloriesBurned | number | No | Estimated calories |
| aiCoachNotes | object | No | AI observations during workout |
| aiPerformanceSummary | string | No | AI-generated summary |
| sessionEmbedding | bytes | No | Vector for session similarity |
| aiSuggestedNext | object | No | AI next workout recommendation |
| moodBefore | string | No | Pre-workout mood |
| moodAfter | string | No | Post-workout mood |
| perceivedExertion | number | No | RPE 1-10 scale |
| deviceModel | string | No | Device info for analytics |
| lightingQuality | enum | No | 'good', 'fair', 'poor' |

#### Telemetry Entity

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique frame identifier |
| workoutLogId | string | Yes | Parent workout session |
| setResultId | string | No | Parent set if applicable |
| timestamp | timestamp | Yes | Frame capture time (ms precision) |
| frameNumber | number | No | Sequential frame index |
| keypoints | array | Yes | 17-point skeleton [{name, x, y, score}] |
| poseConfidence | number | No | Overall detection confidence 0-1 |
| boundingBox | object | No | User bounding box {x, y, w, h} |
| exerciseState | enum | No | 'idle', 'descending', 'bottom', 'ascending' |
| currentAngle | number | No | Primary joint angle in degrees |
| formViolations | array | No | Current frame violations |
| aiConfidence | number | No | AI model confidence 0-1 |
| anomalyScore | number | No | Deviation from expected movement |
| embeddingDelta | bytes | No | Compact frame embedding |
| audioCuePlayed | string | No | Audio feedback triggered |

### AI Agent Integration Points

The schema includes specific fields designed for future AI Agent capabilities:

1. **Embeddings** (768-dim float32 vectors):
   - `userEmbedding`: Personalization and user similarity
   - `sessionEmbedding`: Workout pattern recognition
   - `planEmbedding`: Exercise plan similarity search
   - `exerciseEmbedding`: Exercise recommendation
   - `embeddingDelta`: Frame-level movement analysis

2. **AI Coach Notes** (structured JSON):
   - Per-user observations and preferences
   - Per-session highlights and concerns
   - Progress tracking over time

3. **Recommendation Fields**:
   - `aiSuggestedNext`: Next workout recommendations
   - `aiRationale`: Explanation for AI decisions
   - `effectivenessScore`: Plan effectiveness tracking

4. **Behavioral Data**:
   - `aiInteractionCount`: Engagement metrics
   - `perceivedExertion`: Subjective effort data
   - `moodBefore`/`moodAfter`: Emotional context
   - `anomalyScore`: Unusual movement detection

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New users complete account creation within 60 seconds of first launch (90% of users)
- **SC-002**: Returning users are authenticated automatically within 2 seconds of app launch
- **SC-003**: Welcome screen animations maintain 60fps on all supported devices (iOS 15+, Android 12+)
- **SC-004**: Pose detection skeleton appears within 500ms of camera activation
- **SC-005**: Rep counting achieves 95% accuracy compared to manual count (tested across 100+ workout sessions)
- **SC-006**: Form feedback audio plays within 200ms of detecting form error
- **SC-007**: Offline workouts sync successfully within 60 seconds of connectivity restoration (99% success rate)
- **SC-008**: App launches to interactive state within 3 seconds on target devices
- **SC-009**: Users can complete a full 10-rep squat set with accurate counting and form feedback
- **SC-010**: Zero authentication-related crashes in production (tracked via crash reporting)

## Assumptions

1. **Device Capability**: Users have devices meeting minimum requirements (iOS 15+ / Android 12+) with functional front-facing cameras
2. **Lighting Conditions**: Users perform workouts in reasonably well-lit environments (typical indoor lighting)
3. **Network Availability**: Users have periodic internet access for account creation and data sync (not required for workouts)
4. **Single User Focus**: The app serves one user per session; multi-user households use separate accounts
5. **Language**: Initial release supports English only; i18n infrastructure exists for future expansion
6. **Exercise Scope**: This phase supports squat exercises only; the architecture supports extension to other exercises
7. **Audio Output**: Users' devices have functional speakers or connected audio devices for feedback
8. **Portrait Orientation**: Workouts are performed with device in portrait orientation, mounted or held stable

## Dependencies

- Firebase Authentication service availability
- Apple App Store and Google Play OAuth configuration
- Device camera and microphone permissions granted by user
- TensorFlow Lite models for pose detection (bundled with app)
- Pre-recorded audio files for coaching feedback (bundled with app)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth provider outage | Users cannot create accounts | Provide email/password fallback, queue social signups |
| Pose detection accuracy varies by body type | Some users get poor form feedback | Test across diverse body types, provide calibration tips |
| Older devices may struggle with real-time processing | Poor user experience, frame drops | Adaptive model selection, graceful degradation |
| Privacy concerns with camera data | User trust issues, negative reviews | Clear privacy policy, no cloud upload of video, local processing only |
