# Learning Management System - Design Guidelines

## Design Approach: Material Design System for Educational Platforms

**Rationale:** This LMS is a utility-focused, information-dense productivity application requiring clarity, efficiency, and learnability across four distinct user roles. Material Design provides the structured framework needed for complex data visualization, form interactions, and role-based navigation while maintaining visual consistency.

**Reference Inspiration:** Google Classroom, Canvas LMS, Moodle - professional educational platforms that prioritize function and clarity.

## Core Design Elements

### Color Palette

**Light Mode:**
- Primary: 220 85% 50% (Professional Blue - trust and education)
- Primary Hover: 220 85% 45%
- Secondary: 160 75% 45% (Success Green - completion/approval)
- Background: 0 0% 98% (Clean white base)
- Surface: 0 0% 100% (Card backgrounds)
- Border: 220 15% 88%
- Text Primary: 220 20% 15%
- Text Secondary: 220 15% 45%

**Dark Mode:**
- Primary: 220 80% 60%
- Primary Hover: 220 80% 55%
- Secondary: 160 70% 50%
- Background: 220 20% 10%
- Surface: 220 18% 14%
- Border: 220 15% 22%
- Text Primary: 0 0% 95%
- Text Secondary: 220 10% 65%

**Status Colors (Light/Dark):**
- Success: 160 75% 45% / 160 70% 50%
- Warning: 40 95% 55% / 40 90% 60%
- Error: 0 75% 55% / 0 70% 60%
- Info: 200 85% 55% / 200 80% 60%

**Role Identification Colors:**
- Admin: 280 65% 50% (Purple accent)
- Sales Consultant: 30 85% 55% (Orange accent)
- Trainer: 260 70% 50% (Indigo accent)
- Student: 220 85% 50% (Primary blue)

### Typography

**Font Families:**
- Primary: 'Inter', system-ui, sans-serif (via Google Fonts)
- Monospace: 'JetBrains Mono', monospace (for code/IDs)

**Type Scale:**
- Display: text-4xl font-bold (36px) - Portal titles
- H1: text-3xl font-semibold (30px) - Page headers
- H2: text-2xl font-semibold (24px) - Section headers
- H3: text-xl font-medium (20px) - Card titles
- Body Large: text-base (16px) - Primary content
- Body: text-sm (14px) - Secondary content, table cells
- Caption: text-xs (12px) - Metadata, timestamps

### Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Tight spacing: p-2, gap-2 (form fields, compact lists)
- Standard spacing: p-4, gap-4 (cards, buttons)
- Section spacing: p-6, py-8 (page sections)
- Large spacing: p-12, py-16 (major divisions)

**Grid System:**
- Dashboard cards: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Student lists: grid grid-cols-1 gap-4
- Course modules: Two-column on desktop (8-4 split), stack on mobile
- Admin tables: Full-width with responsive scroll

**Container Widths:**
- Main content: max-w-7xl mx-auto
- Forms: max-w-2xl
- Reading content: max-w-4xl

### Component Library

**Navigation:**
- Fixed sidebar (240px) with role indicator at top showing role name with role color accent
- Collapsible mobile drawer
- Top bar with user profile, notifications, theme toggle
- Breadcrumb navigation for deep pages

**Dashboard Cards:**
- White/dark surface with subtle shadow (shadow-sm)
- Rounded corners (rounded-lg)
- Padding p-6
- Icon + metric + label layout
- Hover effect (hover:shadow-md transition)

**Data Tables:**
- Striped rows for readability
- Sticky header on scroll
- Action column (right-aligned)
- Row hover state
- Pagination at bottom
- Sort indicators on headers

**Course Cards:**
- Thumbnail placeholder (aspect-video bg-gradient-to-br from-primary to-secondary)
- Course title (text-lg font-semibold)
- Module count badge
- Progress bar (if student view)
- CTA button at bottom

**Progress Indicators:**
- Linear progress: Full-width bar with percentage
- Circular progress: For module completion (96px diameter)
- Module list: Checkmark icons for completed, outline for pending
- Color-coded: Green for complete, gray for incomplete, blue for in-progress

**Forms:**
- Full-width inputs with labels above
- Consistent height (h-10 for text inputs)
- Border on all sides with focus ring
- Error states below input in red
- Submit buttons: Primary color, full-width on mobile
- File upload: Drag-drop zone with dashed border

**Task Cards:**
- Two-column layout: Task details left, submission status right
- File download icon for attached files
- Status badge (Pending/Submitted/Approved/Needs Revision)
- Comment section expandable
- Upload zone visible only when task active

**Schedule View:**
- Week grid: 7 columns for days
- Time slots as rows
- Color-coded by role (trainer sessions get trainer color)
- Student/course name in cell
- Responsive: Stack on mobile

**Query/Comment System:**
- Thread-style layout
- Avatar + name + timestamp
- Indented replies
- "Resolved" toggle for trainers
- Textarea with submit at bottom

**Modals/Dialogs:**
- Centered with backdrop blur
- Max width: max-w-2xl
- Close button top-right
- Action buttons bottom-right (Cancel gray, Primary colored)

**Buttons:**
- Primary: bg-primary text-white with hover state
- Secondary: border with text-primary
- Icon buttons: rounded-full p-2 for actions
- Destructive: bg-red-600 for delete actions
- Loading state: Spinner replaces text

**Status Badges:**
- Rounded-full px-3 py-1 text-xs font-medium
- Color-coded backgrounds with darker text
- Completed: bg-green-100 text-green-800 (dark: bg-green-900/30 text-green-300)

### Images

**Where Images Enhance UX:**
- Course thumbnails: Use gradient placeholders (from-primary to-secondary at varying degrees) or generic educational imagery
- Student/Trainer avatars: Initials-based colored circles as placeholders
- No hero images needed - this is a utility application
- Module icons: Use Heroicons throughout

### Animations

**Minimal, Purposeful Motion:**
- Page transitions: Fade in (200ms)
- Hover states: Scale 1.02 or shadow change (150ms)
- Loading: Spinner rotation only
- NO scroll-triggered animations
- NO complex transitions

### Accessibility

- Maintain WCAG AA contrast ratios (4.5:1 minimum)
- Consistent dark mode across all form inputs
- Focus indicators visible on all interactive elements
- Screen reader labels on icon buttons
- Skip navigation link for keyboard users
- Aria labels on progress indicators

### Portal-Specific Design Notes

**Admin Portal:** Compact, data-dense tables with powerful filtering. Multi-action dropdowns. Bulk selection capabilities.

**Sales Consultant Portal:** Balanced between student management and course exploration. Quick enrollment flows. Search-prominent.

**Trainer Portal:** Task review workflow optimized. Student progress at-a-glance. Module marking with single click.

**Student Portal:** Progress visualization central. Course content readable (max-w-4xl for text). Task submission clear with drag-drop. Query button visible on each module.

### Responsive Breakpoints

- Mobile: < 768px (single column, hamburger menu, stacked cards)
- Tablet: 768px - 1024px (2-column grids, visible sidebar)
- Desktop: > 1024px (3-column grids, fixed sidebar, full tables)