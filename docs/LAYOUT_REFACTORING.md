# Website Layout Refactoring Documentation

## Overview
This document describes the layout refactoring implemented to create a consistent, minimalistic design system across all website sections using ShadCN UI and TailwindCSS.

## Layout Architecture

### 1. HomeLayout (`components/layouts/home-layout.tsx`)
**Purpose:** Layout for public-facing home pages

**Features:**
- Sticky navbar at the top with backdrop blur effect
- Logo and website name on the left
- Theme toggle button
- Conditional auth buttons on the right:
  - If user is NOT logged in: "Sign In" and "Sign Up" buttons
  - If user IS logged in: "Go to Dashboard" button
- No footer (content flows naturally)

**Used in:**
- `/` (Home page)
- Future public pages like `/about`, `/tos`, `/socials` can use this layout

**Example Usage:**
```tsx
import { HomeLayout } from "@/components/layouts/home-layout";

export default function Page() {
  return (
    <HomeLayout>
      {/* Page content here */}
    </HomeLayout>
  );
}
```

### 2. AuthLayout (`components/layouts/auth-layout.tsx`)
**Purpose:** Layout for authentication pages

**Features:**
- Centered layout with flex column
- "Back to Home" button in top-left corner (absolute positioning)
- No navbar or footer
- Simple, focused design for auth flows
- Background color from theme

**Used in:**
- `/auth/signin` (Sign In page)
- `/auth/signup` (Sign Up page)
- Can be used for `/auth/forgot-password`, `/auth/reset-password`, etc.

**Example Usage:**
```tsx
import { AuthLayout } from "@/components/layouts/auth-layout";

export default function SignInPage() {
  return (
    <AuthLayout>
      <Card>
        {/* Auth form here */}
      </Card>
    </AuthLayout>
  );
}
```

### 3. DashboardLayout (`components/layouts/dashboard-layout.tsx`)
**Purpose:** Layout for authenticated dashboard pages

**Features:**
- Sticky navbar at the top with backdrop blur effect
- Logo and dynamic title/description on the left
- Theme toggle button
- User information (name and email) displayed
- "Sign Out" button
- Main content area with container and padding
- Footer with copyright information

**Props:**
- `title?: string` - Title shown in navbar (default: "Dashboard")
- `description?: string` - Optional subtitle shown below title
- `children: ReactNode` - Page content

**Used in:**
- `/dashboard` (Main dashboard)
- `/admin` (Admin dashboard)
- `/teacher` (Teacher portal)
- `/student` (Student portal)
- All admin sub-pages (students, teachers, classrooms, subjects, timetable, classroom edit)

**Example Usage:**
```tsx
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function AdminPage() {
  return (
    <DashboardLayout title="Admin Portal" description="Amrita School Management">
      {/* Page content here */}
    </DashboardLayout>
  );
}
```

## Design System Consistency

### Typography
- All layouts use the Geist font family defined in root layout
- Consistent font weights and sizes
- Text color uses theme-aware foreground colors

### Spacing
- Container padding: `px-6 py-8` for main content
- Card spacing: `p-6` for content padding
- Vertical spacing: `space-y-6` for stacked elements
- Navbar padding: `px-6 py-4`

### Rounded Corners
- Cards: `rounded-2xl`
- Buttons: `rounded-xl`
- Icons containers: `rounded-xl` or `rounded-full`
- Input fields: `rounded-xl` (where applicable)

### Shadows
- Cards: `shadow-sm` for subtle depth
- Hover states: `hover:shadow-md` for interactive elements
- Navbar: Uses backdrop blur instead of shadow for modern look

### Colors
- Uses CSS variables defined by ShadCN theme
- Supports light and dark mode seamlessly
- Primary color for branding elements
- Muted colors for secondary text
- Border colors from theme

### Components Used
All layouts exclusively use ShadCN UI components:
- `Button` - For all clickable actions
- `Card`, `CardContent`, `CardHeader`, etc. - For content containers
- Icons from `lucide-react` - Consistent icon set
- Theme provider from `next-themes`

## Migration Notes

### Deprecated Components
- `SharedLayout` (`components/shared-layout.tsx`) - No longer used in any pages
  - Can be kept for backward compatibility or removed in future cleanup

### Breaking Changes
None - All existing pages were updated to use new layouts without breaking functionality.

### Smartboard Pages
As per requirements, all pages under `/smartboard/**` were left unchanged:
- `/smartboard/page.tsx`
- `/smartboard/login/page.tsx`
- `/smartboard/display/page.tsx`

## Responsive Design

All layouts include responsive design considerations:

1. **Mobile Navigation:**
   - User info in DashboardLayout is hidden on small screens (`hidden sm:flex`)
   - Buttons stack vertically on small screens where needed
   - Container padding adjusts for smaller viewports

2. **Content Adaptation:**
   - Grid layouts in pages use responsive columns (`md:grid-cols-2`, `lg:grid-cols-3`)
   - Cards stack on mobile, display side-by-side on larger screens

3. **Typography:**
   - Text sizes adjust using responsive modifiers
   - Headings scale appropriately (`text-2xl` to `text-5xl sm:text-6xl`)

## Theme Support

All layouts support both light and dark modes:
- Uses `next-themes` for theme management
- Theme toggle button in all authenticated layouts
- All colors use CSS variables that adapt to theme
- Icons and logos adjust opacity/color based on theme
- Background colors use `bg-background` for theme awareness

## Accessibility

Layouts include accessibility features:
- Semantic HTML (nav, main, footer elements)
- ARIA labels for icon-only buttons (`sr-only` text)
- Keyboard navigation support (native with button/link elements)
- Color contrast meets WCAG standards in both themes
- Focus states visible on interactive elements

## Performance Considerations

1. **Client-Side Only Where Needed:**
   - All layouts are client components (`"use client"`)
   - Required for auth session, theme toggle, and interactivity

2. **Optimized Imports:**
   - Tree-shakeable icon imports from lucide-react
   - Minimal dependencies in layout components

3. **Lazy Loading:**
   - Layout components don't block initial render
   - Session data fetched asynchronously

## Future Enhancements

Potential improvements for future iterations:

1. **Navigation Menus:**
   - Add dynamic navigation items based on user role
   - Implement breadcrumb navigation for nested pages
   - Add mobile hamburger menu for smaller screens

2. **Layout Variants:**
   - Create `MinimalLayout` for landing pages
   - Add `PrintLayout` for printable reports
   - Implement `FullScreenLayout` for presentations

3. **Customization:**
   - Allow pages to override navbar items
   - Support custom footer content
   - Add layout configuration options

4. **Analytics:**
   - Integrate analytics tracking in layouts
   - Add performance monitoring
   - Track theme preferences

## Testing Recommendations

When testing the refactored layouts:

1. **Visual Testing:**
   - Verify navbar appears on all expected pages
   - Check theme toggle works in all layouts
   - Ensure responsive design works across breakpoints

2. **Functional Testing:**
   - Test auth flows (sign in/out, redirects)
   - Verify "Back to Home" button on auth pages
   - Check session persistence across pages

3. **Cross-Browser Testing:**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify backdrop-blur support (or fallback)
   - Check sticky positioning works correctly

4. **Accessibility Testing:**
   - Use screen reader to navigate
   - Test keyboard-only navigation
   - Verify color contrast in both themes

## Maintenance

To maintain consistency when adding new pages:

1. **Identify the Section:**
   - Public page? Use `HomeLayout`
   - Auth page? Use `AuthLayout`
   - Dashboard page? Use `DashboardLayout`

2. **Follow Patterns:**
   - Use the same Card/Button components
   - Apply consistent spacing (p-6, space-y-6)
   - Use rounded-2xl for cards, rounded-xl for buttons

3. **Theme Awareness:**
   - Use theme colors (bg-background, text-foreground, etc.)
   - Test in both light and dark modes
   - Avoid hardcoded colors

4. **Responsive Design:**
   - Test on mobile, tablet, and desktop
   - Use responsive grid columns
   - Stack elements vertically on small screens
