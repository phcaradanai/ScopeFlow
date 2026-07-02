# QA Checklist: Document Preview Space Utilization Repair V0.8.4b

## Manual Test Instructions

1. **Wide Preview Layout for Structured Documents:**
   - [ ] Open a structured document (e.g. `scope-v1.0.md`) in preview mode.
   - [ ] Confirm the preview utilizes available width better than before (should expand up to 1280px on desktop screens).
   - [ ] Confirm the right side of the screen is not mostly dead empty space.
   - [ ] Confirm there is no unnecessary horizontal scrollbar.

2. **Bottom Status Bar Removal:**
   - [ ] Check the bottom of the MarkdownEditor screen.
   - [ ] Confirm that the technical file path / status bar is completely removed.
   - [ ] Confirm that the top toolbar now displays the line count (e.g. "150 บรรทัด") and approval status ("อนุมัติแล้ว") when applicable.
   - [ ] Ensure long document names in the top toolbar are safely truncated (`max-w-[200px] sm:max-w-md`) and do not squeeze the action buttons.

3. **Non-Technical Thai Wording in Forms:**
   - [ ] Open `scope-v1.0.md` or a Quotation/Invoice document and switch to **Form Mode**.
   - [ ] Scroll to the bottom and confirm the main call-to-action button says "สร้างเอกสาร" or "สร้างเอกสารจากฟอร์ม" (and not "สร้าง Markdown").

4. **Responsive Layouts:**
   - [ ] **Desktop (1366px / 1280px):** Verify the wide canvas is used correctly and is centered nicely.
   - [ ] **Tablet Width:** Ensure content remains readable and margin/padding adjusts cleanly.
   - [ ] **Mobile/Narrow:** Confirm the layout collapses to a single column cleanly, with no horizontal overflow and no clipped text.

5. **Text Wrapping:**
   - [ ] Confirm long Thai text paragraphs wrap properly in the expanded preview.
   - [ ] Confirm long English strings or URLs wrap properly without breaking the layout.
