# QA Checklist: Brief/Scope Evolution

This document contains manual QA steps to verify the Brief/Scope Evolution flow in ScopeFlow V0.8.4.

## Pre-requisites
- Ensure you are running the app with a fresh workspace or test project.
- Open the **Scope Workshop** for a project.

## 1. Initial State
- [ ] Verify the Scope Workshop loads without errors.
- [ ] The **Evolution History Timeline** at the bottom should show the empty state: "ยังไม่มีข้อมูลประวัติการเปลี่ยนแปลง เริ่มต้นโดยการวางข้อความลูกค้าและวิเคราะห์".
- [ ] The "Current Brief" and "Current Scope" columns should show structured lists (Goal, Business Context, In Scope, Deliverables) and display "ยังไม่มีข้อมูล" if the project is empty.

## 2. First Iteration
- [ ] Paste a new customer requirement into the "Paste customer message" text area (e.g., "We need a new dashboard for admin users.").
- [ ] Click "Analyze Brief/Scope".
- [ ] **Verify Analysis Result:**
  - The Recommended Next Action should be "Update Brief" or "Update Scope".
  - Missing questions should be listed if the requirement is vague.
- [ ] **Verify Timeline:**
  - A new card appears in the Evolution History as Iteration 1.
  - The card is expandable and shows "What changed", and the exact customer message summary.

## 3. Subsequent Changes
- [ ] Paste another customer requirement (e.g., "The dashboard must be dark mode only.").
- [ ] Click "Analyze Brief/Scope".
- [ ] **Verify Analysis Result:**
  - The previous changes are maintained in history.
  - Iteration 2 appears at the top of the timeline.
  - The brief/scope impact is correctly highlighted.

## 4. Applying Changes
- [ ] Click the "Apply" button below the Recommended Next Action.
- [ ] Verify that the document creation flow is triggered appropriately to mutate the underlying Markdown documents safely.

## 5. Conflict & Locking Rules
- [ ] Ensure the Project's Scope document is marked as `approved` or `locked` (via manual file edit or mock).
- [ ] Paste a new requirement that changes the scope.
- [ ] Click "Analyze".
- [ ] **Verify Guardrail:** The Recommended Next Action MUST be "Create Change Request", preventing direct Scope mutation.
- [ ] The history card should show a warning/note indicating that the scope is locked.

## 6. Non-Impactful Clarifications
- [ ] Paste a message that is purely a clarification (e.g., "Yes, that looks correct.").
- [ ] Click "Analyze".
- [ ] **Verify:** The Recommended Next Action should be "No document update needed".
- [ ] The history card should show "No Impact on Scope".

## 7. Scope Acceptance
- [ ] Click the "Accept this Scope" button in the header.
- [ ] Verify the session status changes to "Accepted by user".
- [ ] Note: This is user acceptance for scoping purposes, not customer approval.

## 8. Closing the Loop
- [ ] Click "Close Scope Loop" in the header.
- [ ] Verify the session status changes to "Closed".
- [ ] Verify the input area and analysis button are disabled.

## 9. Layout and UI/UX Verification
- [ ] Resize the window. Ensure there is **no horizontal scrolling** in the main workflow.
- [ ] On narrow/mobile screens, ensure the layout wraps to a single column cleanly.
- [ ] Check that long Thai strings wrap correctly and do not overflow their containers.
- [ ] Verify the UI space is used sensibly without large blurred or empty areas.
