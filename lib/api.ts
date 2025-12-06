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



  async getAllUsers(params?: { 
    role?: string; 
    limit?: number; 
    offset?: number;
    search?: string;
    departmentId?: string;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/admin/users?${queryString}` : '/admin/users';
    
    return this.get<{ count: number; data: any[] }>(endpoint);
  }


  async updateUserStatus(userId: string, isActive: boolean) {
    return this.put<{ message: string; data: any }>(`/admin/users/${userId}/status`, { isActive });
  }

  async deleteUser(userId: string) {
    return this.delete<{ message: string }>(`/admin/users/${userId}`);
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



   async getPatientPrescriptions(patientId: string, hospitalId?: string) {
    const query = hospitalId ? `?hospitalId=${hospitalId}` : '';
    return this.get<{ count: number; data: any[] }>(`/prescriptions/patient/${patientId}${query}`);
  }

  async createPrescription(data: {
    patientId: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    notes?: string;
    refillable?: boolean;
    refillsAllowed?: number;
  }) {
    return this.post<{ message: string; data: any }>('/prescriptions', data);
  }

  async getPrescription(prescriptionId: string) {
    return this.get<{ data: any }>(`/prescriptions/${prescriptionId}`);
  }

  async updatePrescriptionStatus(prescriptionId: string, status: 'active' | 'completed' | 'cancelled', reason?: string) {
    return this.put<{ message: string; data: any }>(`/prescriptions/${prescriptionId}/status`, { status, reason });
  }

  async requestPrescriptionRefill(prescriptionId: string) {
    return this.post<{ message: string; data: any }>(`/prescriptions/${prescriptionId}/refill`, {});
  }

  // ============================================
  // MEDICAL RECORDS
  // ============================================

  async getPatientMedicalRecords(patientId: string, hospitalId?: string) {
    const query = hospitalId ? `?hospitalId=${hospitalId}` : '';
    return this.get<{ count: number; data: any[] }>(`/medical-records/patient/${patientId}${query}`);
  }

  async createMedicalRecord(data: {
    patientId: string;
    diagnosis: string;
    symptoms?: string;
    treatment?: string;
    notes?: string;
    visitDate: string;
    visitType?: string;
    vitalSigns?: any;
  }) {
    return this.post<{ message: string; data: any }>('/medical-records', data);
  }

  async getMedicalRecord(recordId: string) {
    return this.get<{ data: any }>(`/medical-records/${recordId}`);
  }

  async updateMedicalRecord(recordId: string, data: any) {
    return this.put<{ message: string; data: any }>(`/medical-records/${recordId}`, data);
  }

  async getHospitalMedicalRecords(params?: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    doctorId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.departmentId) queryParams.append('departmentId', params.departmentId);
    if (params?.doctorId) queryParams.append('doctorId', params.doctorId);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/medical-records/hospital/all?${queryString}` : '/medical-records/hospital/all';
    
    return this.get<{ count: number; total: number; page: number; pages: number; data: any[] }>(endpoint);
  }



// ============================================
  // TEST RESULTS
  // ============================================

  async getPatientTestResults(patientId: string, hospitalId?: string) {
    const query = hospitalId ? `?hospitalId=${hospitalId}` : '';
    return this.get<{ count: number; data: any[] }>(`/test-results/patient/${patientId}${query}`);
  }

  async createTestResult(data: {
    patientId: string;
    testName: string;
    testType: string;
    testDate: string;
    result: string;
    hospitalName: string;
    normalRange?: string;
    notes?: string;
    abnormalFlag?: boolean;
  }) {
    return this.post<{ message: string; data: any }>('/test-results', data);
  }

  async getTestResult(testId: string) {
    return this.get<{ data: any }>(`/test-results/${testId}`);
  }

  async updateTestResult(testId: string, data: any) {
    return this.put<{ message: string; data: any }>(`/test-results/${testId}`, data);
  }

  async deleteTestResult(testId: string) {
    return this.delete<{ message: string }>(`/test-results/${testId}`);
  }

  async uploadTestFile(testId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = await this.getAccessToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}/test-results/${testId}/upload`, {
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





  async uploadTestResultFile(orderId: string, file: File, notes?: string) {
  const formData = new FormData();
  formData.append('file', file);
  if (notes) formData.append('notes', notes);

  const token = await this.getAccessToken();
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${this.baseURL}/test-orders/${orderId}/upload-result`, {
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


}

export const api = new ApiClient(API_URL);
export const apiClient = api;
export default api;











