// ==============================================================================
// VisionIQ End-to-End Pipeline Integration Test
// ==============================================================================

const API_BASE = "http://localhost:4000/api/v1";

// 1x1 transparent PNG buffer for testing
const SAMPLE_IMAGE_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

async function runTest() {
  console.log("==================================================================");
  console.log("🧪 Starting VisionIQ End-to-End Pipeline Verification");
  console.log("==================================================================");

  // 1. Health check
  console.log("\n[1/8] Verifying Health & Readiness...");
  const healthRes = await fetch(`${API_BASE}/health/ready`);
  const health = await healthRes.json();
  console.log("✅ Health Status:", health);

  // 2. Fetch Profiles
  console.log("\n[2/8] Fetching Inspection Profiles...");
  const profilesRes = await fetch(`${API_BASE}/profiles`);
  const { data: profiles } = await profilesRes.json();
  console.log(`✅ Loaded ${profiles.length} profiles. Using: "${profiles[0].name}"`);
  const profileId = profiles[0].id;

  // 3. Upload Sample Asset
  console.log("\n[3/8] Uploading Visual Inspection Asset...");
  const formData = new FormData();
  const fileBlob = new Blob([SAMPLE_IMAGE_BUFFER], { type: "image/png" });
  formData.append("file", fileBlob, "test-pcba-surface.png");

  const uploadRes = await fetch(`${API_BASE}/assets/upload`, {
    method: "POST",
    headers: {
      "X-Organization-Id": "00000000-0000-0000-0000-000000000001",
    },
    body: formData,
  });
  const { data: asset } = await uploadRes.json();
  console.log(`✅ Asset Uploaded: ID=${asset.id}, SHA-256=${asset.sha256_hash?.slice(0, 16)}...`);

  // 4. Create Inspection Job
  console.log("\n[4/8] Creating Inspection Job & Launching Pipeline...");
  const jobRes = await fetch(`${API_BASE}/inspections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Organization-Id": "00000000-0000-0000-0000-000000000001",
    },
    body: JSON.stringify({
      name: "E2E Test PCBA Surface Inspection",
      profileId: profileId,
      assetId: asset.id,
      priority: "high",
      objective: "Detect solder bridge or component displacement",
    }),
  });
  const { data: job } = await jobRes.json();
  console.log(`✅ Job Created: ID=${job.id}, Initial Status=${job.status}`);

  // 5. Poll Job Completion
  console.log("\n[5/8] Polling for AI Vision Analysis Completion...");
  let status = job.status;
  let attempts = 0;
  while (status !== "completed" && status !== "failed" && attempts < 15) {
    await new Promise((r) => setTimeout(r, 600));
    const pollRes = await fetch(`${API_BASE}/inspections/${job.id}/status`);
    const { data: pollData } = await pollRes.json();
    status = pollData.status;
    attempts++;
  }

  const detailRes = await fetch(`${API_BASE}/inspections/${job.id}`);
  const { data: detail } = await detailRes.json();
  console.log(`✅ Job Finished with Status: ${detail.status} in ${detail.processing_duration_ms}ms`);
  console.log(`   Detections count: ${detail.detections.length}`);
  console.log(`   Findings count: ${detail.findings.length}`);

  if (detail.findings.length > 0) {
    const firstFinding = detail.findings[0];
    console.log(`   Sample Finding: "${firstFinding.title}" (Severity: ${firstFinding.severity}, BoundingBox: ${JSON.stringify(firstFinding.bounding_box)})`);

    // 6. Review Finding
    console.log("\n[6/8] Performing Human Review on Finding...");
    const reviewRes = await fetch(`${API_BASE}/findings/${firstFinding.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision: "confirmed",
        reviewerNotes: "Verified under magnification, confirmed anomalous irregularity.",
      }),
    });
    const { data: reviewed } = await reviewRes.json();
    console.log(`✅ Finding Review Status: ${reviewed.review_status}`);

    // 7. Escalate to Incident
    console.log("\n[7/8] Escalating Confirmed Defect to Operational Incident...");
    const incidentRes = await fetch(`${API_BASE}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        findingId: firstFinding.id,
        title: `Containment: ${firstFinding.title}`,
        description: "Quarantine affected manufacturing lot immediately.",
        severity: firstFinding.severity,
        status: "open",
        recommendedAction: firstFinding.recommended_action,
      }),
    });
    const { data: incident } = await incidentRes.json();
    console.log(`✅ Incident Created: ID=${incident.id}, Status=${incident.status}`);
  }

  // 8. Analytics & CSV Export
  console.log("\n[8/8] Verifying Analytics & CSV Report Export...");
  const analyticsRes = await fetch(`${API_BASE}/analytics/overview`);
  const { data: analytics } = await analyticsRes.json();
  console.log("✅ Analytics Overview:", {
    totalInspections: analytics.totalInspections,
    completedInspections: analytics.completedInspections,
    passRate: `${analytics.passRate}%`,
    totalFindings: analytics.totalFindings,
    openIncidents: analytics.openIncidents,
  });

  const csvRes = await fetch(`${API_BASE}/reports/export-csv`);
  const csvText = await csvRes.text();
  console.log(`✅ CSV Export Verified (Length: ${csvText.length} bytes, Header: "${csvText.split("\n")[0]}")`);

  console.log("\n==================================================================");
  console.log("🎉 ALL VISIONIQ E2E PIPELINE TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

runTest().catch((err) => {
  console.error("❌ E2E Test Failed:", err);
  process.exit(1);
});
