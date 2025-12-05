// frontend/lib/api.ts - ORGANIZED VERSION

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return data.accessToken;
      }

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requireAuth = true, headers = {}, ...fetchOptions } = options;

    if (requireAuth) {
      const token = await this.getAccessToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    let response = await fetch(`${this.baseURL}${endpoint}`, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    if (response.status === 401 && requireAuth) {
      const newToken = await this.refreshAccessToken();
      if (newToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${this.baseURL}${endpoint}`, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        });
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // ============================================
  // CORE HTTP METHODS
  // ============================================

  get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // ============================================
  // V2 API METHODS (Multi-Tenant)
  // We'll add these as we build features
  // ============================================

  // AUTH
  async getProfile() {
    return this.get<{ user: any }>('/auth/me');
  }

  // HOSPITALS
  async getMyHospital() {
    return this.get<{ data: any }>('/hospitals/my-hospital');
  }

  async getHospitalStats() {
    return this.get<{ data: any }>('/hospitals/my-hospital/stats');
  }

  // DEPARTMENTS
  async getDepartments() {
    return this.get<{ count: number; data: any[] }>('/departments');
  }

  async getDepartment(id: string) {
    return this.get<{ data: any }>(`/departments/${id}`);
  }

  // MEDICAL RECORDS (Updated for V2)
  async getPatientMedicalRecords(patientId: string, hospitalId?: string) {
    const query = hospitalId ? `?hospitalId=${hospitalId}` : '';
    return this.get<{ count: number; data: any[] }>(`/medical-records/patient/${patientId}${query}`);
  }

  // PRESCRIPTIONS (Updated for V2)
  async getPatientPrescriptions(patientId: string, hospitalId?: string) {
    const query = hospitalId ? `?hospitalId=${hospitalId}` : '';
    return this.get<{ count: number; data: any[] }>(`/prescriptions/patient/${patientId}${query}`);
  }

  // ADMIN
  async getPendingApprovals() {
    return this.get<{ count: number; data: any[] }>('/admin/pending-approvals');
  }

  async approveUser(userId: string, departmentId?: string) {
    return this.post<{ message: string; data: any }>(`/admin/approve/${userId}`, { departmentId });
  }

  async rejectUser(userId: string, reason: string) {
    return this.post<{ message: string; data: any }>(`/admin/reject/${userId}`, { reason });
  }

 
 // TEST ORDERS
  async getPatientTestOrders(patientId: string) {
    return this.get<{ count: number; data: any[] }>(`/test-orders/patient/${patientId}`);
  }

  async createTestOrder(data: any) {
    return this.post<{ message: string; data: any }>('/test-orders', data);
  }

  async updateTestOrderPayment(orderId: string, data: any) {
    return this.post<{ message: string; data: any }>(`/test-orders/${orderId}/payment`, data);
  }

  async uploadTestResult(orderId: string, formData: FormData) {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/test-orders/${orderId}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
  }

  async getDepartmentPendingTests() {
    return this.get<{ count: number; data: any[] }>('/test-orders/department/pending');
  }

  async getDepartmentReadyTests() {
    return this.get<{ count: number; data: any[] }>('/test-orders/department/ready');
  }

  async getDepartmentCompletedTests() {
    return this.get<{ count: number; data: any[] }>('/test-orders/department/completed');
  }

  // PATIENTS SEARCH
  async searchPatients(query: string) {
    return this.get<{ count: number; data: any[] }>(`/patients/search?q=${encodeURIComponent(query)}`);
  }

  async getPatient(patientId: string) {
    return this.get<{ data: any }>(`/patients/${patientId}`);
  }




}

export const api = new ApiClient(API_URL);
export const apiClient = api;
export default api;











