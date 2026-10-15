const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta?: {
    requestId: string;
  };
}

class ApiClient {
  private organizationId: string = "00000000-0000-0000-0000-000000000001";

  setOrganizationId(id: string) {
    this.organizationId = id;
  }

  getOrganizationId() {
    return this.organizationId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    headers.set("X-Organization-Id", this.organizationId);

    if (!(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error?.message || "An API error occurred");
      }
      return json.data;
    }

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    return (await res.blob()) as unknown as T;
  }

  // --- Auth & Org ---
  async getMe() {
    return this.request<any>("/me");
  }

  async getOrganizations() {
    return this.request<any[]>("/organizations");
  }

  // --- AI Capabilities ---
  async getAiCapabilities() {
    return this.request<any>("/ai/capabilities");
  }

  // --- Profiles ---
  async getProfiles() {
    return this.request<any[]>("/profiles");
  }

  async getProfile(id: string) {
    return this.request<any>(`/profiles/${id}`);
  }

  async createProfile(data: any) {
    return this.request<any>("/profiles", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // --- Assets ---
  async uploadAsset(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<any>("/assets/upload", {
      method: "POST",
      body: formData,
    });
  }

  async getAssets() {
    return this.request<any[]>("/assets");
  }

  async getAsset(id: string) {
    return this.request<any>(`/assets/${id}`);
  }

  // --- Inspections ---
  async getInspections() {
    return this.request<any[]>("/inspections");
  }

  async getInspection(id: string) {
    return this.request<any>(`/inspections/${id}`);
  }

  async getInspectionStatus(id: string) {
    return this.request<any>(`/inspections/${id}/status`);
  }

  async createInspection(data: {
    name: string;
    profileId: string;
    assetId: string;
    objective?: string;
    priority?: string;
  }) {
    return this.request<any>("/inspections", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async runInspection(id: string) {
    return this.request<any>(`/inspections/${id}/run`, {
      method: "POST",
    });
  }

  // --- Findings ---
  async reviewFinding(
    id: string,
    decision: "confirmed" | "rejected" | "corrected",
    options?: { correctedCategory?: string; correctedSeverity?: string; reviewerNotes?: string }
  ) {
    return this.request<any>(`/findings/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ decision, ...options }),
    });
  }

  // --- Incidents ---
  async getIncidents() {
    return this.request<any[]>("/incidents");
  }

  async createIncident(data: {
    findingId: string;
    title: string;
    description?: string;
    severity: string;
    status?: string;
    recommendedAction?: string;
  }) {
    return this.request<any>("/incidents", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateIncident(id: string, data: { status?: string; resolutionNotes?: string }) {
    return this.request<any>(`/incidents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  // --- Analytics & Reports ---
  async getAnalyticsOverview() {
    return this.request<any>("/analytics/overview");
  }

  getExportCsvUrl() {
    return `${API_BASE_URL}/reports/export-csv`;
  }
}

export const api = new ApiClient();
