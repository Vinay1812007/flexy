# Flexy — Cloud-Only Deployment (no terminal, no local dev tools)

This walks you through deploying the entire Flexy project using **only your web
browser**. You don't need to install Node.js, git, pnpm, wrangler, or anything
else. Everything happens on GitHub.com and Dash.Cloudflare.com.

> **Time required:** ~45 minutes the first time.
> **What you'll need beforehand:**
> - A computer with a modern browser (Chrome, Firefox, Edge, Safari).
> - The ability to unzip a file (built into Windows/macOS/Linux).
> - An email address.
> - A Google account (used to get a free Gemini API key).
> - A credit/debit card for Cloudflare verification (you'll stay on the **free** tier).

---

## Map of what we're going to do

```
1. Sign up for free accounts                  →  GitHub, Cloudflare, Google AI
2. Upload the project code to GitHub          →  one drag-and-drop
3. Create cloud storage in Cloudflare         →  KV, D1, R2 (all free tier)
4. Paste the storage IDs into one file        →  via GitHub's web editor
5. Set 2 secrets on GitHub + 2 on Cloudflare  →  copy-paste
6. Push a button → GitHub deploys the API     →  the backend ("Worker")
7. Connect Cloudflare Pages to your repo × 2  →  the web app and the admin app
8. Initialize the database                    →  paste SQL into the dashboard
9. Open the site and play music.              →
```

There is **no step where you type a command in a terminal**. Promise.

---

## Step 0 — Get the project zip onto your computer

You have the `flexy.zip` from earlier. Save it somewhere you can find it
(Desktop is fine). Right-click it and choose **Extract All / Unzip**.
You should end up with a folder named `flexy` containing `apps/`,
`packages/`, `services/`, `README.md`, etc.

We won't open any of these files — we're just going to drag the folder into
GitHub's website in step 2.

---

## Step 1 — Create the three free accounts

If you already have these, skip ahead.

### 1a. GitHub  ·  https://github.com/signup

Pick any username, e-mail and password. Verify your e-mail. You're done.

### 1b. Cloudflare  ·  https://dash.cloudflare.com/sign-up

Same drill — email, password, verify. The free Workers + Pages + KV + D1 + R2
plan covers everything Flexy uses for normal traffic.

### 1c. Google AI Studio  ·  https://aistudio.google.com/app/apikey

Sign in with any Google account, click **Create API key**, copy the key
somewhere safe (Notes / sticky / paste into a text file). It looks like
`AIza...`. This is your **GEMINI_API_KEY**.

---

## Step 2 — Upload the project to GitHub

1. Open https://github.com/new
2. **Repository name:** `flexy`
3. Set it to **Public** (free private repos work too, but Cloudflare Pages
   on the free plan integrates more easily with public repos).
4. **Don't** tick "Add a README" — we already have one.
5. Click **Create repository**.

GitHub will now show you an empty repo. Look for the line that says
**"uploading an existing file"** and click it.

Now open the `flexy` folder you extracted in step 0 in your file manager,
select **all** the items inside it (Ctrl/Cmd-A), and **drag** them into the
GitHub page. GitHub will queue every file (including subfolders).

> If your browser refuses to upload subfolders, try Chrome — it handles
> recursive folder drops reliably. As a fallback, upload the zip itself
> and use the "Decompress" feature inside github.dev (see Appendix A).

Scroll to the bottom of the GitHub upload page, type a commit message
("initial commit"), and click **Commit changes**.

Wait until the page reloads — you should see `apps`, `packages`, `services`,
`README.md`, etc. **Your code is now in the cloud.** ✨

---

## Step 3 — Create the Cloudflare storage (KV, D1, R2)

Everything in this step is done at https://dash.cloudflare.com.

### 3a. Note your Cloudflare Account ID

Click **Workers & Pages** in the left sidebar. On the right, you'll see
**Account ID** with a copy button. Copy it. Paste it into your sticky/notes
file as `CLOUDFLARE_ACCOUNT_ID`.

### 3b. Create the two KV namespaces

1. **Workers & Pages → KV** in the sidebar.
2. Click **Create a namespace**, name it `flexy-catalog`, **Create**.
3. Click **Create a namespace** again, name it `flexy-ops`, **Create**.

You'll see both listed. Click each one and copy the long **ID** string
into your notes file. Label them:

- `CATALOG_ID = ...`
- `OPS_ID = ...`

### 3c. Create the D1 database

1. **Workers & Pages → D1** in the sidebar.
2. Click **Create database**, name it `flexy-analytics`, **Create**.
3. On the database page, copy the **Database ID** into your notes:
   `D1_ID = ...`

### 3d. Create the R2 bucket

1. **R2** in the sidebar.
2. Click **Create bucket**, name it `flexy-covers`, **Create**.
   (No ID needed — Wrangler refers to R2 buckets by name.)

If R2 asks you to verify with a card, do so — you stay on the free tier
(10 GB included).

### 3e. Create a Cloudflare API token (for GitHub to deploy with)

1. Click your **profile icon** (top right) → **My Profile** → **API Tokens**.
2. Click **Create Token**.
3. Use the template **"Edit Cloudflare Workers"**. Click **Use template**.
4. The defaults are fine — scroll down, **Continue to summary**, **Create**.
5. **Copy the token NOW** — it's shown only once. Paste into your notes as
   `CLOUDFLARE_API_TOKEN`.

You should now have these five strings in your notes:

```
CLOUDFLARE_ACCOUNT_ID = ...
CLOUDFLARE_API_TOKEN  = ...
CATALOG_ID            = ...
OPS_ID                = ...
D1_ID                 = ...
GEMINI_API_KEY        = AIza...
```

---

## Step 4 — Paste the IDs into wrangler.toml (GitHub web editor)

Back on GitHub:

1. Open your `flexy` repo on github.com.
2. Click into `services` → `workers` → `wrangler.toml`.
3. Click the **pencil icon** (top right) to edit in the browser.
4. Replace the placeholders. You're looking for lines like:

```toml
[[kv_namespaces]]
binding = "CATALOG"
id = "REPLACE_WITH_KV_ID"
preview_id = "REPLACE_WITH_PREVIEW_KV_ID"
```

   Change them to:

```toml
[[kv_namespaces]]
binding = "CATALOG"
id = "<paste CATALOG_ID here>"
preview_id = "<paste CATALOG_ID here again>"
```

   Do the same for the **OPS** namespace and the **D1** binding:

```toml
[[kv_namespaces]]
binding = "OPS"
id = "<paste OPS_ID here>"
preview_id = "<paste OPS_ID here>"

[[d1_databases]]
binding = "DB"
database_name = "flexy-analytics"
database_id = "<paste D1_ID here>"
```

5. Scroll to the bottom, click **Commit changes…**, then **Commit changes**
   on the dialog. (Stay on the `main` branch.)

---

## Step 5 — Add secrets to GitHub

Still on github.com:

1. In your repo, click **Settings** (top tab).
2. Left sidebar → **Secrets and variables** → **Actions**.
3. Click **New repository secret** and add each of these (paste the values
   from your notes):

   | Name                     | Value                          |
   | ------------------------ | ------------------------------ |
   | `CLOUDFLARE_API_TOKEN`   | the token from step 3e         |
   | `CLOUDFLARE_ACCOUNT_ID`  | your Cloudflare account ID     |

   That's it for GitHub. `GEMINI_API_KEY` and `ADMIN_TOKEN` will live
   inside Cloudflare instead (step 7).

---

## Step 6 — Deploy the API (Worker) via GitHub Actions

1. In your GitHub repo, click the **Actions** tab.
2. You'll see a yellow banner: "Workflows aren't being run on this forked
   repository." Click **I understand, enable workflows**. (Skip if you don't
   see this banner.)
3. On the left, click the workflow named **"Deploy Workers (API)"**.
4. On the right, click **Run workflow** → **Run workflow** (leave the branch
   set to `main`).
5. Watch it run. It takes about 2 minutes.
6. When it finishes (green check ✅), it has deployed your API.

Find the URL:
- Go back to **dash.cloudflare.com** → **Workers & Pages**.
- You'll see `flexy-api` listed. Click it.
- Copy the URL at the top (something like
  `https://flexy-api.<your-subdomain>.workers.dev`).

Verify it works by pasting `<that-url>/health` into your browser address bar.
You should see:

```json
{ "ok": true, "ts": 1715... }
```

---

## Step 7 — Add the Worker's two secrets in Cloudflare

The Worker needs the Gemini key and a long admin token. We set them inside
Cloudflare (not GitHub), because Cloudflare stores them encrypted and the
Worker reads them at runtime.

1. **Workers & Pages → flexy-api → Settings → Variables and secrets**.
2. Click **Add variable** twice and add:

   | Name             | Value                                    | Type        |
   | ---------------- | ---------------------------------------- | ----------- |
   | `GEMINI_API_KEY` | the `AIza...` key from step 1c           | **Secret**  |
   | `ADMIN_TOKEN`    | invent a long random string (40+ chars)  | **Secret**  |

   Tick the **Encrypt** checkbox for each one so they're stored as secrets,
   not plain variables. Save the page when done.

   **Save the `ADMIN_TOKEN` value in your notes** — you'll need it to sign
   into the admin dashboard.

The Worker auto-reloads — no redeploy needed.

---

## Step 8 — Connect Cloudflare Pages to your GitHub repo (web app)

This sets up auto-deploy for the user-facing site: every time you push to
`main`, Cloudflare rebuilds and publishes it.

1. **Workers & Pages → Create application → Pages → Connect to Git**.
2. Click **Authorize Cloudflare Pages** and pick your `flexy` repo. **Begin setup**.
3. Build settings:

   | Field                         | Value                          |
   | ----------------------------- | ------------------------------ |
   | Project name                  | `flexy`                        |
   | Production branch             | `main`                         |
   | Framework preset              | **None** (leave it)            |
   | Build command                 | `pnpm install && pnpm --filter @flexy/web build` |
   | Build output directory        | `apps/web/dist`                |
   | Root directory (advanced)     | leave blank                    |

4. Expand **Environment variables (advanced)** and add:

   | Name             | Value                                 |
   | ---------------- | ------------------------------------- |
   | `VITE_API_BASE`  | the Worker URL from step 6            |
   | `NODE_VERSION`   | `20`                                  |

5. Click **Save and Deploy**.

The first build takes about 3 minutes. When it finishes, Cloudflare shows you
your URL, like `https://flexy.pages.dev`. Open it.

---

## Step 9 — Connect Cloudflare Pages for the admin app

Same again, different folder:

1. **Workers & Pages → Create application → Pages → Connect to Git**.
2. Pick the same `flexy` repo. **Begin setup**.
3. Build settings:

   | Field                  | Value                                            |
   | ---------------------- | ------------------------------------------------ |
   | Project name           | `flexy-admin`                                    |
   | Production branch      | `main`                                           |
   | Framework preset       | **None**                                         |
   | Build command          | `pnpm install && pnpm --filter @flexy/admin build` |
   | Build output directory | `apps/admin/dist`                                |

4. Env vars:

   | Name             | Value                                 |
   | ---------------- | ------------------------------------- |
   | `VITE_API_BASE`  | the Worker URL from step 6            |
   | `NODE_VERSION`   | `20`                                  |

5. **Save and Deploy.**

Admin URL will be `https://flexy-admin.pages.dev`. Don't open it yet — we
need to init the database first.

---

## Step 10 — Initialize the D1 database (one-time, paste SQL)

The Worker logs analytics into D1, so we need to create the tables.
No terminal needed — we paste SQL straight into the Cloudflare dashboard.

1. **Workers & Pages → D1 → flexy-analytics → Console** (tab at the top).
2. Open the file `services/workers/d1-migrations.sql` in your GitHub repo
   in another browser tab. Copy its entire contents.
3. Paste it into the D1 console. Click **Execute**.
4. You should see a green "Success" message.

(You can re-run this any time — the SQL uses `CREATE TABLE IF NOT EXISTS`.)

---

## Step 11 — Allow your domains in the Worker's CORS list

The Worker only accepts API calls from origins it knows about. We need to
add your two Pages URLs.

1. In your GitHub repo, edit `services/workers/wrangler.toml`.
2. Find the line:

   ```toml
   ALLOWED_ORIGINS = "https://flexy.pages.dev,http://localhost:5173,http://localhost:5174"
   ```

3. Replace it with **your actual Pages URLs**, e.g.:

   ```toml
   ALLOWED_ORIGINS = "https://flexy.pages.dev,https://flexy-admin.pages.dev"
   ```

4. Commit.

The push to `main` triggers the **Deploy Workers (API)** workflow you set up
in step 6, so the Worker re-deploys automatically with the new origin list
(2–3 minutes).

---

## Step 12 — Try it out

- **User app**  → `https://flexy.pages.dev`
  Search "anirudh", "telugu hits", "shubh"… the player at the bottom should
  start streaming.

- **Admin app** → `https://flexy-admin.pages.dev`
  It will ask for your **admin token** — paste the one you saved in step 7.
  Then check the **API Health** tab; you should see 4 adapters with status.

- **Discover page** → on the user app, click **Discover** in the sidebar
  and try "Play sad Telugu songs". This exercises the Gemini integration.

🎉 You're live.

---

## Day-2: how to make changes (still cloud-only)

Any change you want to make — color, copy, a new playlist on the home page —
is done by editing files on github.com. Every commit to `main` triggers:

- Pages rebuilds the affected app automatically (2–3 min).
- The Worker is rebuilt by the GitHub Action **only if you touched a file
  inside `services/workers/` or `packages/types/`**.

To pin a hero banner on the home page or feature a playlist, use the
**Content** tab in the admin dashboard — no code needed.

---

## Custom domains (optional, ~5 min if you own a domain)

If you own e.g. `myflexy.com`:

1. Cloudflare dashboard → add the domain as a Cloudflare site (free plan).
   Update the nameservers at your registrar (Cloudflare gives you the values).
2. **flexy** Pages project → **Custom domains** → add `myflexy.com`.
3. **flexy-admin** Pages project → **Custom domains** → add `admin.myflexy.com`.
4. **flexy-api** Worker → **Triggers → Custom domains** → add `api.myflexy.com`.
5. Update **VITE_API_BASE** in both Pages projects' env vars → re-deploy each.
6. Update **ALLOWED_ORIGINS** in `wrangler.toml` to include the new domains.

---

## Troubleshooting

| Symptom                                                  | Fix |
| -------------------------------------------------------- | --- |
| GitHub Action "Deploy Workers" fails with "binding not found" | You didn't paste a real KV/D1 ID into `wrangler.toml`. Recheck step 4. |
| Worker `/health` returns 1101 / "Worker threw exception"  | Open **Workers → flexy-api → Logs** in real time and reload the page. Usually a missing binding. |
| Pages build fails with `pnpm: command not found`         | Add env var `NODE_VERSION=20`. Cloudflare's modern builder includes pnpm. |
| Web app loads but every search shows "Couldn't load results" | CORS — your Pages URL isn't in `ALLOWED_ORIGINS`. Step 11. |
| Admin "Unauthorized"                                     | Wrong `ADMIN_TOKEN`. Re-check the value you set in step 7. |
| AI buttons all error                                     | `GEMINI_API_KEY` missing or invalid. Step 7. |
| Audio plays then stops                                   | Upstream API is rate-limiting. The adapter layer will pick another upstream automatically on the next song. |

To roll back a bad deploy:
- **Pages**: project → **Deployments** → click an older one → **Rollback to this deployment**.
- **Worker**: dash → **flexy-api → Deployments** → **Rollback** next to a prior version.

---

## Appendix A — uploading via github.dev (if drag-and-drop fails)

1. Open your empty repo on github.com.
2. Press the **`.`** (dot) key on your keyboard. GitHub opens VS Code in
   the browser at `github.dev/<you>/flexy`.
3. Drag the unzipped `flexy` folder into the file explorer on the left.
4. Click the **Source Control** icon (3rd from top), type "initial commit",
   click **Commit & Push**.

## Appendix B — what each Cloudflare resource costs

All of these are inside the **free tier** for normal Flexy traffic:

| Resource              | Free per day                |
| --------------------- | --------------------------- |
| Workers requests      | 100,000                     |
| KV reads / writes     | 100k reads, 1k writes       |
| D1 rows read/written  | 5M reads, 100k writes       |
| R2 storage            | 10 GB total                 |
| Pages builds          | 500 / month                 |
| Gemini Flash          | 1,500 req/day on the free key |

You only pay if you go viral. Even then, the at-scale costs are small —
Workers is $5/month for 10M requests after the free 100k/day.
