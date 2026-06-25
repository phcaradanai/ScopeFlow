# Rules

### ScopeFlow UI Design Patterns
When building or refactoring UI components and modals in this project, adhere to the following established patterns:
- **Avoid Basic Forms**: Do not use standard vertical forms with basic select dropdowns when presenting multiple choices or complex inputs.
- **Rich Selection**: Use responsive card grids with Lucide icons, distinct Tailwind color accents, and short descriptions for choice selections.
- **Contextual Help**: Use side-by-side layouts for complex inputs (like textareas), providing helpful tips and clickable examples on the side that can auto-fill the form.
- **Interactive Elements**: Ensure interactive elements have smooth hover transitions, inner shadows, and focus rings to maintain a dynamic and premium feel.
- **Data Lists**: Avoid standard data tables. Use responsive grids with rich data cards containing status badges, lock icons, and contextual text snippets (excerpts) for easy scanning.
- **Workflow State**: Avoid static text blocks for workflow actions. Use visual, interactive steppers with clear connecting lines, disabled future states, and glowing, interactive active states.
- **Navigation Trees**: Avoid generic text-only trees. Use distinct visual tiers to communicate hierarchy (e.g., bold accents for top level, glowing pill-shapes for mid level, and muted text with grouping borders for leaf nodes).
- **Global Actions**: Avoid crowding headers with multiple small icon buttons. Move global app settings and tools to clean, pinned footer sections where possible.
