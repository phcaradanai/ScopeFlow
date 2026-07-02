# Scope Workshop QA Checklist

## Setup
1. [ ] Start the app and ensure a project exists.
2. [ ] Open the project in the Project Overview.
3. [ ] Verify that the heavy `CustomerAnswerIntakePanel`, `CustomerChangeIntakePanel`, and `BriefScopeQualityPanel` are removed.
4. [ ] Verify there is a new "ห้องทำ Scope (Scope Workshop)" card in the Project Overview.
5. [ ] Expand the project in the left sidebar and verify the new `Sparkles` icon "ห้องทำ Scope" button is visible.

## Scope Loop Functionality
1. [ ] Click on "ห้องทำ Scope" from the sidebar or the Project Overview card.
2. [ ] Verify the UI is a spacious 3-column layout on desktop.
3. [ ] Verify the UI stacks on mobile without horizontal scroll (no overflow).
4. [ ] Paste an initial customer request in the left textarea.
5. [ ] Click "วิเคราะห์ Brief/Scope" (Analyze Brief/Scope).
6. [ ] Wait for analysis and verify that the delta summary appears.
7. [ ] Verify that missing questions are shown with an option to create a Follow-up.
8. [ ] Click to update the Brief or Scope. Verify the action triggers document creation.
9. [ ] Paste a customer answer to a follow-up. Analyze again.
10. [ ] Paste a changed requirement when the scope is locked/approved (set status manually in frontmatter). Verify it recommends a Change Request instead of direct overwrite.
11. [ ] Verify that long Thai text wraps correctly in the Center and Right columns without pushing the layout off-screen.
12. [ ] Click "ยอมรับ Scope นี้" (Accept this Scope) and verify the status changes.
13. [ ] Click "ปิดรอบการทำ Scope" (Close Scope Loop) and verify the textarea disables.

## Safety and Guardrails
1. [ ] Verify the system never states the customer approved it, only "Accepted by user".
2. [ ] Verify locked scopes recommend Change Requests.

## Thai Language Rules
1. [ ] Check UI elements for proper Thai translation.
2. [ ] Ensure no technical jargon (e.g. file, slug, markdown) leaks into the main Scope Workshop UI.
