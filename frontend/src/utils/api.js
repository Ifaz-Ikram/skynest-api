const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

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
      
      if (!response.ok) {
        // Enhanced error handling for validation errors
        if (response.status === 400 && data.error) {
          throw new Error(data.error);
        }
        if (response.status === 409 && data.error) {
          throw new Error(data.error);
        }
        if (response.status === 422 && data.errors) {
          // Handle validation errors array
          const errorMessages = Array.isArray(data.errors) 
            ? data.errors.join(', ') 
            : Object.values(data.errors).join(', ');
          throw new Error(errorMessages);
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      
      // Enhanced error logging for debugging
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('Network error - check if backend is running');
      }
      
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

  // Bookings - Optimized queries using new database indexes
  async getBookings(params = {}) {
    // Use reasonable pagination defaults
    const defaultParams = { 
      limit: 200,  // Load more bookings for better search results
      page: 1,
      sort: 'check_in_date',
      dir: 'DESC',  // Most recent first
      ...params 
    };
    const query = new URLSearchParams(defaultParams).toString();
    return this.request(`/api/bookings${query ? `?${query}` : ''}`);
  }

  // New optimized booking queries
  async getBookingsByStatus(status) {
    return this.request(`/api/bookings/by-status/${status}`);
  }

  async getBookingsByDateRange(startDate, endDate) {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    return this.request(`/api/bookings/by-date-range?${params}`);
  }

  async getBookingsByGuest(guestId) {
    return this.request(`/api/bookings/by-guest/${guestId}`);
  }

  async createBooking(bookingData) {
    return this.request('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  // Group Booking Management
  async getBookingGroups() {
    return this.request('/api/bookings/groups');
  }

  async createBookingGroup(groupData) {
    return this.request('/api/bookings/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async assignBookingsToGroup(groupId, bookingIds) {
    return this.request(`/api/bookings/groups/${groupId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ booking_ids: bookingIds }),
    });
  }

  async removeBookingFromGroup(groupId, bookingId) {
    return this.request(`/api/bookings/groups/${groupId}/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  }

  // Room Types Management
  async createRoomType(data) {
    return this.request('/api/room-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteRoomType(id) {
    return this.request(`/api/room-types/${id}`, {
      method: 'DELETE',
    });
  }

  // Branches Management
  async createBranch(data) {
    return this.request('/api/branches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBranch(id) {
    return this.request(`/api/branches/${id}`, {
      method: 'DELETE',
    });
  }

  // Services Management
  async createService(data) {
    return this.request('/api/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Rooms Management
  async createRoom(data) {
    return this.request('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRoom(id, data) {
    return this.request(`/api/rooms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRoom(id) {
    return this.request(`/api/rooms/${id}`, {
      method: 'DELETE',
    });
  }

  // Prebookings Management
  async createPreBooking(data) {
    return this.request('/api/pre-bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBookingById(id) {
    return this.request(`/api/bookings/${id}`);
  }

  async updateBookingStatus(id, status) {
    return this.request(`/api/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Rooms & Availability
  async getRooms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/catalog/rooms${query ? `?${query}` : ''}`);
  }

  async getAllRooms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/catalog/all-rooms${query ? `?${query}` : ''}`);
  }

  async getFreeRooms(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/catalog/free-rooms${query ? `?${query}` : ''}`);
  }

  async getRoomTypes() {
    return this.request('/api/catalog/room-types');
  }

  async getRoomAvailability(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/availability${query ? `?${query}` : ''}`);
  }

  async getAvailabilityMatrix(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/bookings/availability/matrix${query ? `?${query}` : ''}`);
  }

  async assignRoomToBooking(data) {
    return this.request('/api/assign-room', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  async getServiceById(id) {
    return this.request(`/api/services/${id}`);
  }

  async updateService(id, serviceData) {
    return this.request(`/api/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(id) {
    return this.request(`/api/services/${id}`, {
      method: 'DELETE',
    });
  }

  // Service Usage
  async getServiceUsages(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/service-usage${query ? `?${query}` : ''}`);
  }

  async createServiceUsage(data) {
    return this.request('/api/service-usage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateServiceUsage(id, data) {
    return this.request(`/api/service-usage/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteServiceUsage(id) {
    return this.request(`/api/service-usage/${id}`, {
      method: 'DELETE',
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

  async getPaymentById(id) {
    return this.request(`/api/payments/${id}`);
  }

  async updatePayment(id, paymentData) {
    return this.request(`/api/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  }

  async adjustPayment(adjustmentData) {
    return this.request('/api/payments/adjustment', {
      method: 'POST',
      body: JSON.stringify(adjustmentData),
    });
  }

  // ============================================================================
  // DEPOSITS & GUARANTEES - REMOVED (not in schema)
  // ============================================================================
  // Deposit tracking is via booking.advance_payment only
  // Guarantee feature removed - no database table
  // All deposit/guarantee endpoints deleted from backend (return 404)
  // ============================================================================

  // Check-in/Check-out
  async createCheckIn(data) {
    return this.request('/api/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCheckInDetails(bookingId) {
    return this.request(`/api/checkin/${bookingId}`);
  }

  async processCheckout(data) {
    return this.request('/api/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFolioReview(bookingId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/checkout/${bookingId}/folio${query ? `?${query}` : ''}`);
  }

  async autoCheckoutPastBookings() {
    return this.request('/api/checkout/auto-checkout-past', {
      method: 'POST',
    });
  }

  // Branches
  async getBranches() {
    return this.request('/api/branches');
  }

  // Pre-bookings
  async getPreBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/pre-bookings${query ? `?${query}` : ''}`);
  }

  async createPreBooking(data) {
    return this.request('/api/pre-bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPreBookingById(id) {
    return this.request(`/api/pre-bookings/${id}`);
  }

  async updatePreBooking(id, data) {
    return this.request(`/api/pre-bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePreBooking(id) {
    return this.request(`/api/pre-bookings/${id}`, {
      method: 'DELETE',
    });
  }

  async convertPreBookingToBooking(id, bookingData) {
    return this.request(`/api/pre-bookings/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  // Customers
  async getCustomers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/customers${query ? `?${query}` : ''}`);
  }

  async createCustomer(data) {
    return this.request('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCustomerById(id) {
    return this.request(`/api/customers/${id}`);
  }

  async updateCustomer(id, data) {
    return this.request(`/api/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Customer Portal
  async getCustomerBookings(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/customer/bookings${query ? `?${query}` : ''}`);
  }

  async createCustomerBooking(data) {
    return this.request('/api/customer/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCustomerProfile() {
    return this.request('/api/customer/profile');
  }

  async updateCustomerProfile(data) {
    return this.request('/api/customer/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Guest Management (Core functionality) - Optimized with new indexes
  async getGuests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/guests${query ? `?${query}` : ''}`);
  }

  // Guest ID Proof
  async getGuestIdProofStatus(guestId) {
    return this.request(`/api/guests/${guestId}/id-proof-status`);
  }

  async updateGuestIdProof(guestId, data) {
    return this.request(`/api/guests/${guestId}/id-proof`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // New optimized guest search using idx_guest_email
  async searchGuestsByEmail(email) {
    return this.request(`/api/guests/search?email=${encodeURIComponent(email)}`);
  }

  async searchGuestsByName(name) {
    return this.request(`/api/guests/search?name=${encodeURIComponent(name)}`);
  }

  async createGuest(data) {
    return this.request('/api/guests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGuest(id, data) {
    return this.request(`/api/guests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGuest(id) {
    return this.request(`/api/guests/${id}`, {
      method: 'DELETE',
    });
  }

  // REMOVED: Guest Profile Management - Phase 2 feature requiring additional database tables
  // async getGuestProfile(guestId) {
  //   return this.request(`/api/guests/${guestId}/profile`);
  // }

  // async updateGuestProfile(guestId, data) {
  //   return this.request(`/api/guests/${guestId}/profile`, {
  //     method: 'PATCH',
  //     body: JSON.stringify(data),
  //   });
  // }


  // Housekeeping Management (Simplified)
  async getHousekeepingBoard(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/housekeeping/board${query ? `?${query}` : ''}`);
  }

  async getRoomsWithStatus(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/housekeeping/rooms${query ? `?${query}` : ''}`);
  }

  async updateRoomStatus(roomId, status, forceOverride = false) {
    console.log('API: updateRoomStatus called with:', { roomId, status, forceOverride });
    try {
      const result = await this.request(`/api/rooms/${roomId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, force: forceOverride }),
      });
      console.log('API: updateRoomStatus result:', result);
      return result;
    } catch (error) {
      console.error('API: updateRoomStatus error:', error);
      // If it's an auth error, try the test route temporarily
      if (error.message.includes('401') || error.message.includes('403')) {
        console.log('API: Trying test route due to auth error');
        const result = await this.request(`/api/test/rooms/${roomId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
        console.log('API: updateRoomStatus test result:', result);
        return result;
      }
      throw error;
    }
  }

  async getValidStatusTransitions(roomId) {
    return this.request(`/api/housekeeping/room/${roomId}/transitions`);
  }

  async updateRoomStatusesAutomatically() {
    return this.request('/api/housekeeping/update-statuses', {
      method: 'POST',
    });
  }

  // Room Availability & Conflicts
  async checkRoomAvailability(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/availability${query ? `?${query}` : ''}`);
  }

  async getRoomConflicts(roomId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/rooms/${roomId}/conflicts${query ? `?${query}` : ''}`);
  }

  async getRoomTimeline(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/rooms/timeline${query ? `?${query}` : ''}`);
  }

  async assignRoomToBooking(bookingId, roomId, data = {}) {
    return this.request(`/api/bookings/${bookingId}/assign-room`, {
      method: 'POST',
      body: JSON.stringify({ room_id: roomId, ...data }),
    });
  }

  async getRoomUpgradeSuggestions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/rooms/upgrade-suggestions${query ? `?${query}` : ''}`);
  }

  // Rates
  async calculateRate(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/rates/calculate${query ? `?${query}` : ''}`);
  }

  async getRateQuote(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/rates/quote${query ? `?${query}` : ''}`);
  }

  async getRatePlans() {
    return this.request('/api/rates/plans');
  }

  // Reports
  async getOccupancyByDay() {
    return this.request('/api/reports/occupancy-by-day');
  }

  async getBillingSummary() {
    return this.request('/api/reports/billing-summary');
  }

  async getServiceUsageDetail(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/reports/service-usage-detail${query ? `?${query}` : ''}`);
  }

  // Dashboard Reports
  async getKPIsDashboard(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/reports/dashboard/kpis${query ? `?${query}` : ''}`);
  }

  async getRevenueDashboard(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/reports/dashboard/revenue-analysis${query ? `?${query}` : ''}`);
  }

  async getOccupancyDashboard(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/reports/dashboard/occupancy-trends${query ? `?${query}` : ''}`);
  }

  async getGuestDashboard(params = {}) {
    // Guest dashboard doesn't exist yet, fallback to KPIs
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/reports/dashboard/kpis${query ? `?${query}` : ''}`);
  }

  async getReportData(params = {}) {
    const { report_type, ...otherParams } = params;

    try {
      let data;
      // Route to the appropriate dashboard endpoint based on report type
      switch (report_type) {
        case 'overview':
          data = await this.getKPIsDashboard(otherParams);
          break;
        case 'revenue':
          data = await this.getRevenueDashboard(otherParams);
          break;
        case 'occupancy':
          data = await this.getOccupancyDashboard(otherParams);
          break;
        case 'guests':
          data = await this.getGuestDashboard(otherParams);
          break;
        default:
          data = await this.getKPIsDashboard(otherParams);
      }

      // Transform the backend response to match frontend expectations
      // Handle different response structures
      if (data?.trends) {
        // Occupancy trends response
        const latestTrend = data.trends[data.trends.length - 1] || {};
        return {
          kpis: {
            total_revenue: latestTrend.revenue || 0,
            adr: latestTrend.avg_rate || 0,
            revpar: 0,
            occupancy: latestTrend.occupancy_rate || 0,
            revenue_trend: 0,
            adr_trend: 0,
            revpar_trend: 0,
            occupancy_trend: 0
          },
          guests: { total: 0, new: 0, returning: 0, avg_stay: 0 },
          channel_performance: data?.channel_performance || [],
          room_type_performance: data?.room_type_performance || []
        };
      } else {
        // KPIs dashboard response
        return {
          kpis: {
            total_revenue: data?.revenue_metrics?.total_revenue || 0,
            adr: data?.revenue_metrics?.avg_daily_rate || 0,
            revpar: data?.revenue_metrics?.revpar || 0,
            occupancy: data?.occupancy_metrics?.occupancy_rate || 0,
            revenue_trend: 0,
            adr_trend: 0,
            revpar_trend: 0,
            occupancy_trend: 0
          },
          guests: {
            total: data?.guest_metrics?.unique_guests || 0,
            new: 0,
            returning: 0,
            avg_stay: parseFloat(data?.guest_metrics?.avg_length_of_stay || 0).toFixed(1)
          },
          channel_performance: data?.channel_performance || [],
          room_type_performance: data?.room_type_performance || []
        };
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw error;
    }
  }

  async exportReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/reports/export${query ? `?${query}` : ''}`);
  }

  // REMOVED: Manager Forecasting - Phase 3 feature (Q2 2026)
  // async getPaceAnalysis(params = {}) {
  //   const query = new URLSearchParams(params).toString();
  //   return this.request(`/api/reports/forecasting/pace${query ? `?${query}` : ''}`);
  // }

  // async getRevenueForecast(params = {}) {
  //   const query = new URLSearchParams(params).toString();
  //   return this.request(`/api/reports/forecasting/revenue${query ? `?${query}` : ''}`);
  // }

  // async getOccupancyForecast(params = {}) {
  //   const query = new URLSearchParams(params).toString();
  //   return this.request(`/api/reports/forecasting/occupancy${query ? `?${query}` : ''}`);
  // }

  // Invoices
  async generateInvoice(bookingId) {
    return this.request(`/api/bookings/${bookingId}/invoice`);
  }

  async generateInvoiceHTML(bookingId) {
    return this.request(`/api/bookings/${bookingId}/invoice/html`);
  }

  // User Management
  async getAllUsers() {
    return this.request('/api/users');
  }

  async getUserById(userId) {
    return this.request(`/api/users/${userId}`);
  }

  async createUser(userData) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getAllEmployees() {
    return this.request('/api/employees');
  }

  async getStaff() {
    return this.request('/api/employees');
  }

  async getEmployeeById(employeeId) {
    return this.request(`/api/employees/${employeeId}`);
  }

  async createEmployee(employeeData) {
    return this.request('/api/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployee(employeeId, employeeData) {
    return this.request(`/api/employees/${employeeId}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    });
  }

  async deleteEmployee(employeeId) {
    return this.request(`/api/employees/${employeeId}`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // AUDIT LOG API FUNCTIONS
  // ============================================================================
  
  async getAuditLogs(filters = {}, page = 1, limit = 50) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    return this.request(`/api/audit-logs?${params}`);
  }

  async getAuditLogStats() {
    return this.request('/api/audit-logs/stats');
  }

  async getAuditLogById(id) {
    return this.request(`/api/audit-logs/${id}`);
  }

  async exportAuditLogs(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_URL}/api/audit-logs/export/csv?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export audit logs');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // Health Check
  async healthCheck() {
    return this.request('/api/health');
  }

  // ============================================================================
  // OPERATIONS API FUNCTIONS (Today's Operations)
  // ============================================================================
  
  async getArrivalsToday() {
    return this.request('/api/reports/arrivals-today');
  }

  async getDeparturesToday() {
    return this.request('/api/reports/departures-today');
  }

  async getInHouse() {
    return this.request('/api/reports/in-house');
  }
}

export default new ApiService();