# QA Checklist: ScopeFlow Editor Layout Repair V0.8.3

This document outlines the manual testing steps required to verify the layout fix for the Markdown Editor and Quotation Form.

## Environment Setup
- Checkout the `main` branch with the latest layout fixes applied.
- Run `npm install` and `npm run dev` to start the app.
- Ensure you have a demo workspace or a test project created.

## 1. Editor Modal Behavior
- [ ] Open any document (e.g., `brief-v1.0.md` or `quotation-v1.0.md`) from a project overview.
- [ ] **Verify**: The editor opens as a centered modal, not squeezed to the right side.
- [ ] **Verify**: The modal takes up most of the screen width (`max-w-[1440px]`) on large monitors.
- [ ] **Verify**: There is no excessive empty blurred space on the left side of the screen.

## 2. Quotation Form Layout
- [ ] Open a Quotation document and switch to **Form (ฟอร์ม)** mode.
- [ ] **Verify**: The overall form container is spacious (`max-w-[1200px]`).
- [ ] **Verify**: The "Line Items" (รายการ) table headers align correctly with the inputs below them.
- [ ] Add a new line item.
- [ ] Type a very long Thai string into the "รายละเอียดงาน" (Description) field.
- [ ] **Verify**: The Description field expands flexibly without causing a horizontal scrollbar.
- [ ] **Verify**: The Quantity (จำนวน), Unit (หน่วย), and Price (ราคา) fields have sane widths and are not squashed into unreadable slivers.
- [ ] Resize the browser window to a narrower width (tablet size).
- [ ] **Verify**: The line items stack into a mobile-friendly card layout without horizontal overflow.

## 3. Editor Header & Footer (Toolbar / Status Bar)
- [ ] In any editor mode (Form, Edit, Preview), look at the top header toolbar.
- [ ] **Verify**: The header wraps gracefully on smaller screens without compressing the action buttons.
- [ ] **Verify**: The Close button (X) is clearly visible on the right side of the header toolbar.
- [ ] Look at the bottom status bar.
- [ ] **Verify**: The file path shows only the base filename (e.g., `quotation-v1.0.md`).
- [ ] **Verify**: Hovering over the filename shows the full path in a tooltip.
- [ ] **Verify**: The status bar is compact and does not make the editor feel cramped.

## 4. General Usability
- [ ] **Verify**: No horizontal scrollbars appear in the main editor body at any time.
- [ ] **Verify**: The user experience feels like a primary workspace task, not an auxiliary side panel.
