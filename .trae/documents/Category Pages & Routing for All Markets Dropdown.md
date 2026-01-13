## Goal
Enable each option in the “All Markets” dropdown to act like a dedicated page. When a user clicks a category (e.g., Politics, Sports), the app navigates to a category route and shows the Markets view filtered to that category, with URL-based routing and smooth UX.

## Current State
- Dropdown HTML exists with `data-category` options in `index.html` (id `categoryDropdown`, options include politics, sports, finance, etc.).
- Markets rendering and filtering live in `js/features/markets/markets-view.js`:
  - `renderMarkets()` builds the grid
  - `filterByCategory(category)` and `filterMarkets()` filter cards by `data-category`
- Navigation is view-based via `navigateTo(page)` in `js/features/navigation/navigation-view.js`.
- No hash routing for categories yet; `createPageUrl` returns `#<page>` for basic views.

## Implementation Steps
### 1) Hash Routing
- Add a simple router to `js/features/navigation/navigation-view.js`:
  - `routeByHash()` parses `location.hash`.
  - If hash matches `#category/<name>`, call `showMarkets()`, then `renderMarkets()` (if not rendered yet) and `filterByCategory(<name>)`.
  - Ensure `updateActiveNavItem('markets')` is set for visual consistency.
- Hook routing:
  - On load: call `routeByHash()` after initial app init.
  - On change: `window.addEventListener('hashchange', routeByHash)`.

### 2) Wire Dropdown Clicks
- In a small script (either at end of `markets-view.js` or `navigation-view.js`), attach event listeners to `.category-option` items in `#categoryDropdown`:
  - Read `data-category`
  - Set `location.hash = '#category/<category>'`
  - Optionally update label (`#selectedCategory`) to reflect the selected category title

### 3) Badge Navigation
- Make category badges on market cards clickable to navigate to `#category/<category>` so users can hop between categories from anywhere:
  - Update card template to add `onclick` on the category pill (without breaking existing `onclick` handlers).

### 4) UX Polish
- Update the dropdown’s currently selected display (`#selectedCategory`) when route changes so the label stays in sync.
- Keep the filtering case-insensitive and normalize category strings (lowercase).

### 5) Documentation
- Add a short section in `README.md` describing category routes:
  - Examples: `#category/politics`, `#category/sports`.
  - Behavior: Navigates to Markets and filters accordingly.

## Testing
- Start dev server, open `http://localhost:3001/`.
- Click the “All Markets” dropdown and select “Politics” → URL becomes `#category/politics`, Markets view shown with only politics.
- Manually navigate to `#category/finance` → same behavior.
- Click a category badge on a market card → navigates and filters.
- Verify that “All Markets” resets filter to `all`.

## Files to Update
- `js/features/navigation/navigation-view.js`: add hash router, attach `hashchange` listener.
- `js/features/markets/markets-view.js`: expose `renderMarkets` if needed globally, add event binding for dropdown options, make category pills clickable.
- `index.html`: no structural changes required; ensure IDs (`categoryDropdown`, `selectedCategory`) used by handlers exist.
- `README.md`: add category routing notes.

## Acceptance Criteria
- Each dropdown option acts as a navigable page via hash routes.
- Markets view reliably filters to the selected category and updates UI label.
- Direct links like `#category/technology` work on page load and refresh.
- No regressions to existing navigation or markets rendering.