# VisionIQ Deployment & Integration Guide

## Connecting to Remote Supabase (Auth, PostgreSQL & Storage)

VisionIQ runs out-of-the-box in local development mode. When you are ready to connect to your live Supabase project:

1. **Create a Supabase Project**:
   - Go to [https://supabase.com](https://supabase.com) and create a new project.

2. **Execute Database Migrations**:
   - Navigate to the **SQL Editor** in your Supabase dashboard.
   - Run the contents of `supabase/migrations/20261015000000_visioniq_core.sql`.
   - Run the seed script `supabase/seed.sql` to populate default industrial inspection profiles.

3. **Create Storage Buckets**:
   - Go to **Storage** in the Supabase dashboard.
   - Create two private buckets:
     - `visioniq-originals`
     - `visioniq-derived`

4. **Update `.env`**:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
   Restart the backend API (`npm run dev:backend`). VisionIQ will automatically connect to remote Supabase and enforce Row Level Security!

---

## Configuring Google Gemini AI Vision Model

1. Visit [Google AI Studio](https://aistudio.google.com/) and generate an API key.
2. In your `.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-3.8-flash
   ```
3. Restart the API. The engine badge on the dashboard will display **Gemini 3.8 Flash (Active)**.

---

## Cloud Deployment (Render & Vercel)

### Backend to Render
1. Connect repository on [Render](https://dashboard.render.com).
2. Render uses `render.yaml` automatically to deploy `@visioniq/backend`.
3. Set environment variables (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

### Frontend to Vercel
1. Import repository on [Vercel](https://vercel.com/new).
2. Pre-configured via `vercel.json` (`npm run build:frontend`, output directory `frontend/dist`).
3. Set environment variables (`VITE_API_BASE_URL` to your Render backend URL, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

