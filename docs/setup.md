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
   Restart the backend API (`npm.cmd run dev:api`). VisionIQ will automatically connect to remote Supabase and enforce Row Level Security!

---

## Configuring Google Gemini AI Vision Model

1. Visit [Google AI Studio](https://aistudio.google.com/) and generate an API key.
2. In your `.env`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   GEMINI_MODEL=gemini-2.5-flash
   ```
3. Restart the API. The engine badge on the dashboard will display **Gemini 2.5 Flash (Active)**.
