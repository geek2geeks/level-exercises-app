# GitHub Spec Kit: Workflow & Best Practices

This guide outlines the "Spec-Driven Development" (SDD) workflow using the GitHub Spec Kit (`specify-cli`). This approach ensures that your AI coding assistant produces high-quality, maintainable code by following a structured "Specify → Plan → Task → Implement" loop.

## 🚀 The Core Workflow (Four Phases)

Follow this cycle for every new feature or significant change.

### 1. SPECIFY (Define the Vision)
**Goal:** Describe *what* you want to build and *why*, avoiding technical implementation details for now.
*   **Command:** `/speckit.specify`
*   **Result:** Generates or updates `spec.md`.
*   **What to do:**
    *   Write a high-level natural language description.
    *   Focus on user value, high-level behavior, and business logic.
    *   *Tip:* If the prompt is ambiguous, the tool might ask for clarification.

### 2. PLAN (Architect the Solution)
**Goal:** Translate the specification into a technical architecture and implementation strategy.
*   **Command:** `/speckit.plan`
*   **Result:** Generates or updates `plan.md`.
*   **What to do:**
    *   Review the generated plan carefully.
    *   Ensure it aligns with your project's `constitution.md`.
    *   Verify technical decisions (libraries, database schema, API signatures).
*   **Optional Helper:** `/speckit.clarify` can be run *before* planning to ask structured questions and de-risk the requirements.

### 3. TASKS (Break It Down)
**Goal:** Convert the technical plan into granular, step-by-step actions for the AI.
*   **Command:** `/speckit.tasks`
*   **Result:** Updates `task.md` (or `tasks.md`).
*   **What to do:**
    *   Ensure tasks are small, atomic, and verifiable.
    *   Each task should ideally correspond to one PR or one logical block of work.
    *   *Best Practice:* Checks for existing tests or validation steps are included here.

### 4. IMPLEMENT (Execute)
**Goal:** The AI writes the code based on the rigorous preparation above.
*   **Command:** `/speckit.implement`
*   **Result:** Code changes in your project files.
*   **What to do:**
    *   The AI will pick up the next active task from `tasks.md`.
    *   It will write code, run tests, and verify its work.
    *   You review the output. If it's wrong, *don't just fix the code*. Fix the Spec or the Plan, then re-run the implementation. This keeps your documentation true.

---

## 📜 The Constitution (Your Project's DNA)
Before starting major work, you must define the "rules of the road."
*   **Command:** `/speckit.constitution`
*   **Result:** `constitution.md`
*   **Why:** This file contains non-negotiable rules (e.g., "Always use TypeScript," "Test coverage must be 100%," "Use Tailwind CSS"). The AI reads this *every time* it generates code.

---

## 🛠️ Advanced Commands & Tips

| Command | Usage |
| :--- | :--- |
| `/speckit.clarify` | Run this if your idea is vague. The AI will interview you to tighten the scope. |
| `/speckit.checklist` | Generates a QA checklist to ensure your Spec/Plan covers all bases (security, performance, etc.). |
| `/speckit.analyze` | Checks consistency between your Spec, Plan, and Tasks. |

### "Vibe Coding" vs. Spec-Driven Development
*   **Vibe Coding:** Loose prompts ("Make it look cool"). Fast but prone to bugs and technical debt.
*   **SDD (Spec Kit):** Structured. You might spend 5 minutes writing a Spec, but you save hours of debugging because the AI knows *exactly* what to do.

## 🔁 Iteration Loop
1.  **New Idea?** Run `/speckit.specify`.
2.  **Plan changed?** Update `plan.md` manually or run `/speckit.plan` again.
3.  **Stuck?** Use `/speckit.clarify` to have the AI help you figure out what you missed.

---
**Get Started:**
Run `specify init .` (if you haven't already) to set up the scaffolding, then start with `/speckit.constitution`.