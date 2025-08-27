Summary of index fix
--------------------

What I changed
- Replaced the existing `index.html` in `AIDIFY NEW START V1` with a minimal redirect to `landing_page.html` so Netlify serves the intended landing page as the site root.
- Preserved the original footer content by moving it into `footer.html` and keeping a small footer in the redirecting `index.html` for parity.

Why
- Netlify serves the `index.html` file at the site root. The previous `index.html` contained only footer markup, causing the footer to appear instead of the landing page.

How to revert
- If you prefer to make `landing_page.html` the index directly, you can replace the contents of `index.html` with the contents of `landing_page.html` or rename files and push.

Notes
- This is a minimal, non-invasive fix. If you want a different behavior (direct copy, server-side rewrite, or Netlify configuration change), tell me which option and I will apply it.
