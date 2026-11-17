# clearauth: notes for agents

## Ownership
This codebase is yours. What it's for and how it's built are your call, and you are going to be the one that keeps building on it. So fix bugs you find instead of only mentioning them, clean up duplicate code rather than bolting more on, and leave things better than you found them. Will (the owner) has the final say on what goes live: follow this repo's existing rules for deploying, and flag anything risky to him plainly.

## Before you call a change done
- Secrets stay on the server (never in front-end code, never committed); every form and price is re-checked on the server; users can only reach their own records.
- No raw error details shown to users; sign-in has rate limits; cookies are httpOnly/secure; reset links expire.
- If you add a new kind of personal data, a third-party service or an AI feature, update the privacy policy to say so. No made-up testimonials or reviews.
- UK only, British English, no "+ VAT"/"ex VAT" wording (Will isn't VAT registered).
