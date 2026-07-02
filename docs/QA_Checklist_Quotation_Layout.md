# QA Checklist: Quotation & Invoice Layout

## Overview
This document serves as a manual QA checklist to prevent regressions related to text clipping, truncation, horizontal scrolling, and unresponsive container layouts in the form editors (Quotation, Invoice, Brief, etc.).

## 1. Quotation Editor Verification
- [ ] **Open `quotation-v1.0.md`** (or any quotation file) in Form Mode.
- [ ] **Line Items Clipping**: Confirm no text is clipped in line items description, quantity, unit, price, and total fields.
- [ ] **Totals/Summary Clipping**: Confirm no text is clipped in the summary/totals section (especially discount dropdowns and VAT percentages).
- [ ] **No Main Horizontal Scrollbar**: Confirm the entire editor workspace scrolls vertically without triggering a global horizontal scrollbar.
- [ ] **Sticky Footer Visibility**: Confirm the "สร้าง Markdown จากฟอร์ม" (Generate Markdown) footer remains visible at the bottom and does not permanently overlap or cover form content. The user should be able to scroll to the very bottom of the form smoothly.
- [ ] **Long Text Wrapping (Payment Terms)**: Paste a very long unbroken text block or long Thai paragraphs into "Payment Terms" and "Notes". Confirm it wraps correctly and does not break the container width.
- [ ] **Thai Text Wrapping**: Confirm long Thai text (without spaces) wraps correctly in Description inputs.
- [ ] **Mixed Text Wrapping**: Confirm mixed Thai and English text wraps gracefully.

## 2. Responsive Widths Validation
Test the editor across different viewport widths by resizing the browser window:

- [ ] **Wide Desktop (1280px+)**: 
  - The layout should display a clean 2-column structure (Main form on left, Totals/Settings on right).
  - Line items should display in a neat row grid.
- [ ] **Narrow Desktop / Tablet (768px - 1024px)**:
  - The right-side Totals/Summary section should gracefully wrap and move **below** the main form content, becoming full-width instead of staying squeezed.
  - The line item grid should compress column widths but remain perfectly readable.
- [ ] **Mobile / Narrow Width (320px - 640px)**:
  - The line items grid must convert into a stacked card layout.
  - Every column (Quantity, Unit, Price) should stack beautifully and labels should remain clear.
  - No horizontal overflow must occur; all content must fit inside the viewport.
  - No text should be unreadably compressed.

## 3. Regression Safeguards
- **Important Labels**: Critical labels (Totals, Document Name, Due Date) should never use `truncate` or `text-ellipsis` if it risks hiding important financial or business context. Use `break-words` or allow multi-line wrapping instead.
- **Flex Child Constraints**: Always use `min-w-0` on `flex-1` elements inside flex rows to ensure they can shrink below their intrinsic content width.
- **Scroll Overflows**: Prefer `overflow-x-hidden` on main form wrappers if horizontal scroll is definitively not required.
