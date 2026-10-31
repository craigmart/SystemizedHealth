# Systemized Pipeline

React/Vite app deployed on Netlify at [shpipeline.netlify.app](https://shpipeline.netlify.app). It is the browser editor for the Supabase `videos` table. Python scripts are a separate, server-side client and are not configured here.

The app signs in with Supabase Auth (email and password). There is no sign-up screen. Visitors who are not signed in see only the sign-in form; video rows are not requested until a session exists. The session is stored in the browser (`localStorage`) and refreshed automatically, so a signed-in user stays signed in across reloads. `?video=<code>` is left on the URL through sign-in, and the pipeline opens that video once the session is ready.

Forgot-password mail returns to this site. The link opens a new-password form before the pipeline.

## Environment variables

Vite inlines these at **build** time. Changing them in Netlify does nothing until the next deploy.

| Variable | Value |
| :--- | :--- |
| `VITE_SUPABASE_URL` | Project URL, `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_KEY` | **Publishable** key (`sb_publishable_…`). The legacy anon JWT (`role` `anon`) also works. |

`VITE_SUPABASE_KEY` is the name the app and the current Netlify site already use. Put the publishable key in that variable. Do not add a second key variable.

The app refuses to start when that value is a JWT whose payload `role` is `service_role`, or when it starts with `sb_secret_`. `npm run build` exits before writing `dist`, so an admin key is not emitted into the bundle. `npm run dev` strips the key out of the served JavaScript and shows the same error on screen. No video requests are made in that state.

Local values live in `pipeline/.env`. That file is gitignored (`pipeline/.gitignore` ignores `.env` and `.env.*`). Do not commit it.

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_KEY=sb_publishable_...
```

[Pull request #1](https://github.com/craigmart/SystemizedHealth/pull/1) adds `pipeline/.env.example` with these same two names (placeholder `your-anon-key`) and lets that example be committed. This change does not edit `.gitignore` or that example, so the two branches do not both rewrite those files. Read the example's key as the publishable key, or the legacy anon key. A `service_role` value there will fail the build.

## What the signed-in client touches

Every Supabase call goes through `pipeline/src/supabase.js`. After sign-in, that client sends the user's access token on each request. The publishable key is only the `apikey`.

The app uses a single table, `videos`:

- `select('*')`
- `insert`
- `update`
- `delete`

It does not query `video_stats`, `video_keywords`, or `video_tasks`. Those tables still need their own policies if other clients use them. The separate database change that limits all four tables to Craig's authenticated user covers this app as long as `videos` allows select, insert, update, and delete for that signed-in user.

## Netlify

`netlify.toml` builds from `pipeline/` (`npm run build`, publish `dist`). In the Netlify site settings, set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY` = the publishable key

Then deploy. A failed build leaves the previous publish in place.

## Deploy order

Do this before revoking the admin key that the old bundle was built with. A signed-in request uses the `authenticated` role. A policy that names only `anon` does not apply to that session. Policies for `public` do.

1. In Supabase Auth, create Craig's email/password user. Turn off new sign-ups. Set the site URL to `https://shpipeline.netlify.app`. Add redirect URLs `https://shpipeline.netlify.app` and `http://localhost:5173` so the reset email can return to the app.
2. Grant that authenticated user full access on `videos` (select, insert, update, delete). Keep the current public read policy in place so the already published site still loads. The separate change for `video_stats`, `video_keywords`, and `video_tasks` can land in the same database update; this UI does not call them.
3. Set the two Netlify variables above. Deploy **this** build and confirm sign-in, a `?video=<code>` link, an edit, a reload that stays signed in, and sign-out.
4. Remove the public/anon policies once that check passes. Revoke or rotate the service-role key that was stored in Netlify as `VITE_SUPABASE_KEY`. The Python scripts keep using their own server-side key; this app does not read that key.

Until step 3 is live, leave the old public read rule in place. Step 2 has to be in place before step 3, or the new session can sign in and then have its `videos` calls rejected.

## Local

```bash
cd pipeline
npm install
npm run dev
```

Open `http://localhost:5173/?video=<code>` while signed out. The sign-in form is the only screen, and the address still has `video`. After sign-in, that video opens.
