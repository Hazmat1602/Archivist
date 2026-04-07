const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...getAuthHeaders(), ...options?.headers },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Session expired — please log in again");
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// --- Types ---

export interface AuditFields {
  created_by: number | null;
  modified_by: number | null;
  modified_at: string | null;
}

export interface Category extends AuditFields {
  id: number;
  name: string;
  is_subcategory: boolean;
  parent_id: number | null;
}

export interface RetentionCode extends AuditFields {
  id: number;
  category_id: number;
  code: string;
  name: string;
  code_description: string;
  period_description: string;
  period: number | null;
  m_period: number | null;
  date: string | null;
}

export interface Location extends AuditFields {
  id: number;
  code: string;
  description: string;
  local_storage: boolean;
}

export interface Archive extends AuditFields {
  id: number;
  code: string;
  name: string;
  address: string | null;
}

export interface Box extends AuditFields {
  id: number;
  code: string;
  name: string | null;
  created_date: string;
  expiry_date: string | null;
  location_id: number | null;
  archive_id: number | null;
  folder_count: number;
}

export interface Folder extends AuditFields {
  id: number;
  retention_id: string;
  code: string;
  name: string;
  created_date: string;
  start_date: string;
  expiry_date: string | null;
  box_id: number | null;
  retention_code_id: number | null;
}

export interface DashboardStats {
  total_folders: number;
  total_boxes: number;
  total_codes: number;
  total_locations: number;
  unassigned_folders: number;
  expiring_soon: number;
  expired: number;
}

// --- API functions ---

export const api = {
  // Stats
  getStats: () => request<DashboardStats>("/api/stats/"),

  // Categories
  listCategories: () => request<Category[]>("/api/categories/"),
  createCategory: (data: { name: string; is_subcategory?: boolean; parent_id?: number | null }) =>
    request<Category>("/api/categories/", { method: "POST", body: JSON.stringify(data) }),
  deleteCategory: (id: number) =>
    request<void>(`/api/categories/${id}`, { method: "DELETE" }),

  // Retention Codes
  listCodes: () => request<RetentionCode[]>("/api/codes/"),
  createCode: (data: Omit<RetentionCode, "id" | keyof AuditFields>) =>
    request<RetentionCode>("/api/codes/", { method: "POST", body: JSON.stringify(data) }),
  updateCode: (id: number, data: Partial<RetentionCode>) =>
    request<RetentionCode>(`/api/codes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCode: (id: number) =>
    request<void>(`/api/codes/${id}`, { method: "DELETE" }),

  // Locations
  listLocations: () => request<Location[]>("/api/locations/"),
  createLocation: (data: Omit<Location, "id" | keyof AuditFields>) =>
    request<Location>("/api/locations/", { method: "POST", body: JSON.stringify(data) }),
  updateLocation: (id: number, data: Partial<Location>) =>
    request<Location>(`/api/locations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteLocation: (id: number) =>
    request<void>(`/api/locations/${id}`, { method: "DELETE" }),

  // Archives
  listArchives: () => request<Archive[]>("/api/archives/"),
  createArchive: (data: Omit<Archive, "id" | keyof AuditFields>) =>
    request<Archive>("/api/archives/", { method: "POST", body: JSON.stringify(data) }),
  updateArchive: (id: number, data: Partial<Archive>) =>
    request<Archive>(`/api/archives/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteArchive: (id: number) =>
    request<void>(`/api/archives/${id}`, { method: "DELETE" }),

  // Boxes
  listBoxes: () => request<Box[]>("/api/boxes/"),
  createBox: (data: { name: string; location_id?: number | null; expiry_date?: string | null }) =>
    request<Box>("/api/boxes/", { method: "POST", body: JSON.stringify(data) }),
  updateBox: (id: number, data: Partial<Box>) =>
    request<Box>(`/api/boxes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBox: (id: number) =>
    request<void>(`/api/boxes/${id}`, { method: "DELETE" }),

  // Folders
  listFolders: (unassigned?: boolean) =>
    request<Folder[]>(`/api/folders/${unassigned ? "?unassigned=true" : ""}`),
  createFolder: (data: { code: string; name: string; start_date: string; box_id?: number | null }) =>
    request<Folder>("/api/folders/", { method: "POST", body: JSON.stringify(data) }),
  updateFolder: (id: number, data: Partial<Folder>) =>
    request<Folder>(`/api/folders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteFolder: (id: number) =>
    request<void>(`/api/folders/${id}`, { method: "DELETE" }),
  assignFolder: (folderId: number, boxId: number) =>
    request<Folder>(`/api/folders/${folderId}/assign/${boxId}`, { method: "POST" }),
  unassignFolder: (folderId: number) =>
    request<Folder>(`/api/folders/${folderId}/unassign`, { method: "POST" }),
};
