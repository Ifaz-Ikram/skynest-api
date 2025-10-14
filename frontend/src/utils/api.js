const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class ApiService {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Auth
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return data;
  }

  async register(registrationData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  // Bookings
  async getBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/bookings${query ? `?${query}` : ''}`);
  }

  async createBooking(bookingData) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async updateBookingStatus(id, status) {
    return this.request(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Rooms
  async getRooms() {
    return this.request('/api/rooms');
  }

  // Services
  async getServices() {
    return this.request('/api/services');
  }

  async createService(serviceData) {
    return this.request('/api/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  // Payments
  async getPayments(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/payments${query ? `?${query}` : ''}`);
  }

  async createPayment(paymentData) {
    return this.request('/api/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Reports
  async getReports(type, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/reports/${type}?${query}`);
  }

  // Users
  async getUsers() {
    return this.request('/api/admin/users');
  }

  async createUser(userData) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getEmployees() {
    return this.request('/api/admin/employees');
  }

  async getAllowedRoles() {
    return this.request('/api/admin/allowed-roles');
  }

  // Pre-bookings
  async getPreBookings() {
    return this.request('/api/prebookings');
  }

  async createPreBooking(data) {
    return this.request('/api/prebookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Invoices
  async getInvoices() {
    return this.request('/api/invoices');
  }

  async generateInvoice(bookingId) {
    return this.request(`/api/invoices/generate/${bookingId}`, {
      method: 'POST',
    });
  }

  // Guests
  async getGuests() {
    return this.request('/api/guests');
  }

  async createGuest(guestData) {
    return this.request('/api/guests', {
      method: 'POST',
      body: JSON.stringify(guestData),
    });
  }

  // Branches
  async getBranches() {
    return this.request('/api/branches');
  }

  async createBranch(branchData) {
    return this.request('/api/branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
  }

  async updateBranch(id, branchData) {
    return this.request(`/api/branches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(branchData),
    });
  }

  async deleteBranch(id) {
    return this.request(`/api/branches/${id}`, {
      method: 'DELETE',
    });
  }

  // Audit Log
  async getAuditLog(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/audit${query ? `?${query}` : ''}`);
  }
}

export const api = new ApiService();
export default api;
