## Issues Identified
- Email validation triggers “Enter a valid email” during signup even for valid inputs, likely due to untrimmed values or missing submit prevention.
- The “Create account” view appears below the welcome/login card instead of replacing it, because the login card remains visible when showing the signup card.

## Planned Fixes
### Validation & Submit Handling
- Trim inputs before validation:
  - Login: `email = document.getElementById('loginEmail').value.trim()` in js/core/app.js:84.
  - Signup: `email = document.getElementById('signupEmail').value.trim()` in js/core/app.js:114.
  - Reset: `email = document.getElementById('resetEmail').value.trim()` in js/core/app.js:147.
- Prevent native form submit and rely on JS handlers:
  - Update `attachAuthHandlers()` to accept the event object and call `event.preventDefault()` in all three form submit handlers (js/core/app.js:83, 113, 146).
- Reset errors on view switch:
  - Hide `#signupError`, `#authError`, `#resetError` when toggling views to avoid stale messages.

### Auth View Toggle
- Add `id="loginCard"` to the login card container (index.html, the first auth card inside `#authView`).
- Ensure only one card is visible at a time:
  - On “Create account” click (js/core/app.js:70–76): hide `#loginCard`, show `#signupCard`, hide `#resetCard`.
  - On “Back to sign in” click (js/core/app.js:74–76): show `#loginCard`, hide `#signupCard` and `#resetCard`.
  - On “Forgot password” click (js/core/app.js:77–82): hide `#loginCard`, show `#resetCard`, hide `#signupCard`.
  - On “Back to sign in” from reset (js/core/app.js:80–82): show `#loginCard`, hide others.
- Focus management:
  - After showing signup, focus `#signupEmail`.
  - After showing login, focus `#loginEmail`.

### UX Polish
- Clear field-level errors on input focus for a cleaner experience.
- Keep accessible color contrast and focus rings consistent with existing styling.

### Verification
- Manual: reproduce with valid and invalid emails; ensure signup shows as a replacement view and validation behaves correctly.
- Unit tests: extend `tests/auth-validation.test.js` with trim-aware checks to ensure valid emails with leading/trailing spaces pass after trimming.

## Deliverables
- Updated `index.html` to tag the login card with `id="loginCard"`.
- Updated `js/core/app.js` to trim inputs, prevent default submits, and correctly toggle between login/signup/reset views with focus.
- Minor test extension for trimmed email validation.