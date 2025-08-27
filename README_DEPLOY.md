This guide deploys the AIDIFY project: frontend to Netlify and backend to a Node host (Render/Railway).

Overview
- Frontend: static files in folder `AIDIFY NEW START V1` will be served by Netlify.
- Backend: Node/Express server in `Server.js` must be deployed to a Node host (Render, Railway, etc.).
- Netlify will proxy `/api/*` and `/uploads/*` to the backend so no frontend code changes are needed.

Files created for you
- `netlify.toml` (repo root) — set `publish = "AIDIFY NEW START V1"` and contains proxy redirects (edit the backend URL placeholder).
- `AIDIFY NEW START V1/_redirects` — same redirects in Netlify _redirects format (edit placeholder).

Step-by-step (I will tell you exactly when to run commands)

A. Prepare GitHub repo (you must create an empty repo on GitHub first)
1. In PowerShell, from project root (where package.json lives):
```powershell
git init
git add .
git commit -m "Prepare for Netlify+backend deploy"
# Replace the URL below with the GitHub repo URL you create
git remote add origin https://github.com/<your-user>/<your-repo>.git
git branch -M main
git push -u origin main
```

B. Deploy the backend (Render example)
1. Sign up at https://render.com and connect your GitHub account.
2. Create a new "Web Service" and choose your repo and the `main` branch.
3. Set the Start Command to: `node Server.js` (or `npm start` if present).
4. Set any build command blank (not needed for plain Node).
5. Environment variables (set these in Render dashboard -> Environment):
   - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
   - EMAIL_USER, EMAIL_PASS
   - (optional) NODE_ENV=production
6. Deploy. When deployed, note the service URL (e.g. `https://my-backend.onrender.com`).

C. Update redirect placeholders
1. Open `netlify.toml` and `AIDIFY NEW START V1/_redirects` and replace `REPLACE_WITH_BACKEND_URL` with your backend URL from Render.
2. Commit and push the change:
```powershell
git add netlify.toml AIDIFY\ NEW\ START\ V1\_redirects
git commit -m "Add Netlify redirects to backend"
git push
```

D. Deploy frontend to Netlify
1. Sign up or sign in at https://app.netlify.com
2. "New site from Git" -> connect GitHub -> pick your repo and branch `main`.
3. Set build command: (leave blank)
4. Set publish directory to: `AIDIFY NEW START V1`
5. Deploy site. Netlify will serve your static site and proxy `/api/*` to the backend URL via the redirects.

E. Test
- Open the Netlify URL, open DevTools Network, and confirm `/api/shops?ownerEmail=...` and `/api/products?shopId=...` are proxied to your backend URL.

If anything breaks at a step above, tell me exactly which command you ran and paste any error text. I will give exact next commands.

Notes
- The backend writes uploads to `public/uploads` — Render's filesystem is ephemeral. For persistent uploads use S3 and change Server.js to store uploaded files there.
- Do not commit secrets. Use the host's environment variables.

If you want, I can now:
- Create a `.gitignore` for you
- Prepare a sample `render` deployment note with exact env var names

Tell me which one you want me to do next.
