# Project-Scoped Agent Rules

- **Animations**: Only create animations and complex visual transitions on the user-facing side (home, services, gallery, auth). Do not apply animations to the dashboard interfaces (`/app/dashboard/*`). Dashboards should remain fast, snappy, and functionally focused without decorative animations.

- **Category Standardisation**:
  - Always use exact unified category names in database records and component mappings: `"Hair Care"` (for all hair services), `"Nails & Spa"` (for all nail services), and `"Facials"` (for facial services).
  - Never split or duplicate categories (e.g., do not introduce separate `"Hair"` or `"Nails"` category strings alongside `"Hair Care"` or `"Nails & Spa"`).
  - Always ensure staff service lists in database include `"Hair Care"` and `"Nails & Spa"` so staff filtering lists all available stylists for every service.

- **CSS & Flash of Unstyled Content (FOUC) Prevention**:
  - In `app/globals.css`, use `@import "tailwindcss";` (Tailwind v4 directive). Do NOT append legacy `@tailwind base; @tailwind components; @tailwind utilities;` directives as combining them causes CSS parsing conflicts and page refresh unstyled rendering flashes.
  - Maintain font preconnect resource links in layout `<head>` to ensure instant font & style rendering upon page refresh.

