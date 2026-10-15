# VisionIQ — AI-Powered Computer Vision & Visual Intelligence Platform

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8e75ff.svg)](https://aistudio.google.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_PostgreSQL-3ecf8e.svg)](https://supabase.com/)

**VisionIQ** is an enterprise-grade visual intelligence platform designed for **Industrial Quality Inspection and Anomaly Detection**. It ingests visual data (images, webcam snapshots), applies multimodal computer vision inference using the official `@google/genai` SDK, renders interactive sub-millimeter bounding box overlays, and enables human-in-the-loop review and operational incident containment.

---

## 🌟 Key Features

1. **Interactive Visual Intelligence Canvas**:
   - High-fidelity SVG/Canvas overlays rendering normalized `[0, 1]` bounding boxes.
   - Dynamic color-coding by defect severity (`critical` = rose, `high` = orange, `medium` = amber, `low` = blue).
   - Interactive hover tooltips (category, confidence rating, title) and click-to-focus synchronization with finding cards.
   - Full zoom controls (+, -, reset) and pan support.

2. **Multimodal AI Vision Pipeline (`@google/genai`)**:
   - Google Gemini 2.5 Flash visual intelligence engine.
   - Strict Zod schema validation on model outputs.
   - Sub-millimeter surface defect localization, missing component detection, and misalignment flagging.
   - Built-in benchmark test fixtures for offline / evaluation mode when `GEMINI_API_KEY` is not configured.

3. **Human-in-the-Loop Review Workflow**:
   - **Confirm Defect**: Validate genuine defects with auditor notes.
   - **Reject**: Mark false positives to maintain training calibration data.
   - **Correct**: Adjust category or severity.
   - **1-Click Incident Escalation**: Convert confirmed critical defects into operational containment tickets.

4. **Live Browser Camera Capture (`getUserMedia`)**:
   - Permitted webcam viewfinder with alignment reticle for real-time parts inspection.
   - High-resolution frame snap to canvas and direct submission into the inspection pipeline.

5. **Operational Analytics & Audit Reports**:
   - Yield pass rate, total defects detected, open incidents, and severity breakdown charts (Recharts).
   - Printable inspection report summaries and one-click CSV audit exports.

6. **Production Multi-Tenancy (Supabase & Local Fallback)**:
   - PostgreSQL Row Level Security (RLS) migrations committed in `supabase/migrations/`.
   - Automatic local file-backed persistence fallback (`./tmp/visioniq-store.json`) ensuring immediate functionality without remote database prerequisites.

---

## 🏗️ Architecture

```
Computer Vision & Visual Intelligence/
├── frontend/                    # React 18 + Vite + Tailwind CSS (Port 5173)
│   ├── src/
│   │   ├── app/                 # Router & Query Providers
│   │   ├── components/          # AnnotatedImageCanvas, AppLayout
│   │   ├── pages/               # Dashboard, Detail, NewInspection, LiveCapture, etc.
│   │   └── lib/                 # Typed API Client
│   ├── .env                     # Frontend environment variables
│   └── package.json
│
├── backend/                     # Node.js + Express + TypeScript API (Port 4000)
│   ├── src/
│   │   ├── config/              # Zod environment variable parsing
│   │   ├── middleware/          # Auth, Tenant context, Centralized error handler
│   │   ├── services/            # ai-vision.service.ts (@google/genai), db.service.ts, storage.service.ts
│   │   ├── routes/              # health, ai, assets, inspections, findings, incidents, analytics
│   │   └── server.ts            # Server entrypoint (Port 4000)
│   ├── .env                     # Private server secrets (Gemini & Supabase)
│   └── package.json
│
├── shared/                      # Monorepo shared package: Zod schemas, types, constants
├── supabase/
│   ├── migrations/              # Version-controlled PostgreSQL RLS migrations
│   └── seed.sql                 # Default profiles and demo organization seed
├── scripts/
│   └── test-e2e-pipeline.mjs    # Automated end-to-end integration test runner
├── .env.example                 # Environment configuration template
└── package.json                 # Monorepo root with npm workspaces
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### 1. Installation
Clone the repository and install dependencies across all workspaces:
```bash
npm.cmd install
```

### 2. Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

*(Optional)* To enable live Gemini multimodal vision inference:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
> **Note**: If `GEMINI_API_KEY` is omitted, VisionIQ runs in **Local Benchmark Mode**, analyzing assets using verified inspection fixtures.

### 3. Run Development Servers
Start both the backend API and frontend Vite servers concurrently:
```bash
# Terminal 1: Backend API (Port 4000)
npm.cmd run dev --workspace=@visioniq/api

# Terminal 2: Frontend Web App (Port 5173)
npm.cmd run dev --workspace=@visioniq/web
```

Access the application in your browser:
- **Web Application**: [http://localhost:5173](http://localhost:5173)
- **API Health Check**: [http://localhost:4000/api/v1/health/ready](http://localhost:4000/api/v1/health/ready)

### 4. Run Automated E2E Pipeline Verification
Execute the automated end-to-end integration test runner:
```bash
node scripts/test-e2e-pipeline.mjs
```

---

## 🔒 Security & Row Level Security (RLS)

- **Zero Client-Side Secrets**: Gemini API keys and Supabase service-role keys reside exclusively on the Express backend.
- **Strict Zod Boundaries**: Path params, query strings, multipart uploads, and AI responses are parsed and sanitized via Zod.
- **Tenant Isolation**: PostgreSQL queries and RLS policies guarantee Organization A cannot access Organization B's assets or findings.

---

## 📄 License
Licensed under the Apache License, Version 2.0.
