import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import SearchableDropdown from '../common/SearchableDropdown';

const CustomerPortal = () => {
  const [bookings, setBookings] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings');
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showPreferenceForm, setShowPreferenceForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, preferencesData, profileData] = await Promise.all([
        api.getCustomerBookings(),
        api.getCustomerPreferences(),
        api.getCustomerProfile()
      ]);
      
      setBookings(bookingsData);
      setPreferences(preferencesData);
      setProfile(profileData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnlineCheckIn = async (bookingId, checkInData) => {
    try {
      await api.processOnlineCheckIn(bookingId, checkInData);
      loadData();
      setShowCheckInModal(false);
      alert('Online check-in completed successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOnlineCheckOut = async (bookingId, checkOutData) => {
    try {
      await api.processOnlineCheckOut(bookingId, checkOutData);
      loadData();
      setShowCheckOutModal(false);
      alert('Online check-out completed successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddPreference = async (preferenceData) => {
    try {
      await api.addCustomerPreference(preferenceData);
      loadData();
      setShowPreferenceForm(false);
      alert('Preference added successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePreference = async (preferenceId, preferenceData) => {
    try {
      await api.updateCustomerPreference(preferenceId, preferenceData);
      loadData();
      alert('Preference updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePreference = async (preferenceId) => {
    try {
      await api.deleteCustomerPreference(preferenceId);
      loadData();
      alert('Preference deleted successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMakePayment = async (paymentData) => {
    try {
      await api.makeOnlinePayment(paymentData);
      alert('Payment processed successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Customer Portal</h1>
        <p className="text-text-secondary mt-2">Manage your bookings, check-in online, and update your preferences</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Profile Summary */}
      {profile && (
        <div className="bg-surface-secondary shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">{profile.full_name}</h2>
              <p className="text-text-secondary">{profile.email}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-text-tertiary">
                <span>{profile.total_stays} stays</span>
                <span>Rs {profile.total_spent.toLocaleString()} total spent</span>
                {profile.loyalty.membership_level && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {profile.loyalty.membership_level} Member
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-tertiary">Loyalty Points</p>
              <p className="text-2xl font-semibold text-text-primary">
                {profile.loyalty.current_points || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'bookings', name: 'My Bookings' },
            { id: 'preferences', name: 'Preferences' },
            { id: 'profile', name: 'Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-border dark:border-slate-600'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <BookingsManagement 
          bookings={bookings}
          onCheckIn={(booking) => {
            setSelectedBooking(booking);
            setShowCheckInModal(true);
          }}
          onCheckOut={(booking) => {
            setSelectedBooking(booking);
            setShowCheckOutModal(true);
          }}
          onViewDetails={(booking) => {
            setSelectedBooking(booking);
            // Show booking details modal
          }}
        />
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <PreferencesManagement 
          preferences={preferences}
          onAdd={handleAddPreference}
          onUpdate={handleUpdatePreference}
          onDelete={handleDeletePreference}
          showForm={showPreferenceForm}
          setShowForm={setShowPreferenceForm}
        />
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && profile && (
        <ProfileManagement profile={profile} />
      )}

      {/* Check-In Modal */}
      {showCheckInModal && selectedBooking && (
        <OnlineCheckInModal 
          booking={selectedBooking}
          onSubmit={(data) => handleOnlineCheckIn(selectedBooking.booking_id, data)}
          onCancel={() => setShowCheckInModal(false)}
        />
      )}

      {/* Check-Out Modal */}
      {showCheckOutModal && selectedBooking && (
        <OnlineCheckOutModal 
          booking={selectedBooking}
          onSubmit={(data) => handleOnlineCheckOut(selectedBooking.booking_id, data)}
          onCancel={() => setShowCheckOutModal(false)}
        />
      )}
    </div>
  );
};

// Bookings Management Component
const BookingsManagement = ({ bookings, onCheckIn, onCheckOut, onViewDetails }) => {
  const upcomingBookings = bookings.filter(b => b.status === 'Confirmed' && new Date(b.check_in_date) > new Date());
  const currentBookings = bookings.filter(b => b.status === 'Checked-In');
  const pastBookings = bookings.filter(b => b.status === 'Checked-Out');

  return (
    <div className="space-y-6">
      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="bg-surface-secondary shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Upcoming Bookings</h3>
          <div className="space-y-4">
            {upcomingBookings.map((booking) => (
              <div key={booking.booking_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{booking.room_type}</h4>
                    <p className="text-sm text-text-secondary">
                      {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-text-tertiary">Room {booking.room_number}</p>
                    <p className="text-sm font-medium">${booking.booked_rate.toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    {booking.can_checkin && (
                      <button
                        onClick={() => onCheckIn(booking)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Check In
                      </button>
                    )}
                    <button
                      onClick={() => onViewDetails(booking)}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Bookings */}
      {currentBookings.length > 0 && (
        <div className="bg-surface-secondary shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Current Stay</h3>
          <div className="space-y-4">
            {currentBookings.map((booking) => (
              <div key={booking.booking_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{booking.room_type}</h4>
                    <p className="text-sm text-text-secondary">
                      {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-text-tertiary">Room {booking.room_number}</p>
                    <p className="text-sm font-medium">${booking.booked_rate.toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    {booking.can_checkout && (
                      <button
                        onClick={() => onCheckOut(booking)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Check Out
                      </button>
                    )}
                    <button
                      onClick={() => onViewDetails(booking)}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Bookings */}
      {pastBookings.length > 0 && (
        <div className="bg-surface-secondary shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Past Bookings</h3>
          <div className="space-y-4">
            {pastBookings.slice(0, 5).map((booking) => (
              <div key={booking.booking_id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{booking.room_type}</h4>
                    <p className="text-sm text-text-secondary">
                      {new Date(booking.check_in_date).toLocaleDateString()} - {new Date(booking.check_out_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-text-tertiary">Room {booking.room_number}</p>
                    <p className="text-sm font-medium">${booking.booked_rate.toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onViewDetails(booking)}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="bg-surface-secondary shadow rounded-lg p-6 text-center">
          <p className="text-text-tertiary">No bookings found</p>
        </div>
      )}
    </div>
  );
};

// Preferences Management Component
const PreferencesManagement = ({ preferences, onAdd, onUpdate, onDelete, showForm, setShowForm }) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">My Preferences</h3>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Preference
          </button>
        </div>

        {showForm && (
          <PreferenceForm 
            onSubmit={onAdd}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="space-y-4">
          {preferences.map((preference) => (
            <div key={preference.preference_id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{preference.preference_type}</h4>
                  <p className="text-sm text-text-secondary">{preference.preference_value}</p>
                  <p className="text-xs text-text-tertiary">
                    Added {new Date(preference.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {/* Edit functionality */}}
                    className="text-blue-600 hover:text-blue-900 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(preference.preference_id)}
                    className="text-red-600 hover:text-red-900 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {preferences.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-tertiary">No preferences set yet</p>
            <p className="text-sm text-text-tertiary mt-2">Add your preferences to personalize your stay</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Preference Form Component
const PreferenceForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    preference_type: 'Room',
    preference_value: '',
    is_active: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="bg-surface-tertiary border rounded-lg p-4 mb-4">
      <h4 className="font-medium mb-4">Add New Preference</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Preference Type
          </label>
          <SearchableDropdown
            options={[
              { value: 'Room', label: 'Room' },
              { value: 'Dining', label: 'Dining' },
              { value: 'Amenities', label: 'Amenities' },
              { value: 'Communication', label: 'Communication' },
              { value: 'Service', label: 'Service' },
              { value: 'Other', label: 'Other' }
            ]}
            value={formData.preference_type}
            onChange={(value) => handleChange({ target: { name: 'preference_type', value } })}
            placeholder="Select preference type..."
            searchPlaceholder="Search preference types..."
            className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2"
            displayKey="label"
            valueKey="value"
            searchKeys={['label']}
            renderOption={(pref) => (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="font-medium">{pref.label}</div>
                </div>
              </div>
            )}
            renderSelected={(pref) => (
              <div className="flex justify-between items-center w-full">
                <span className="font-medium">{pref.label}</span>
              </div>
            )}
            emptyMessage="No preference types found"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Preference Description
          </label>
          <textarea
            name="preference_value"
            value={formData.preference_value}
            onChange={handleChange}
            rows="3"
            placeholder="Describe your preference..."
            className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2 bg-surface-secondary text-text-primary placeholder:text-text-tertiary dark:bg-slate-700 dark:text-slate-100 bg-surface-secondary text-text-primary dark:bg-slate-700 dark:text-slate-100 placeholder:text-text-tertiary"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm text-text-secondary">Active</label>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border dark:border-slate-600 rounded-md text-text-secondary hover:bg-surface-tertiary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Preference
          </button>
        </div>
      </form>
    </div>
  );
};

// Profile Management Component
const ProfileManagement = ({ profile }) => {
  return (
    <div className="space-y-6">
      <div className="bg-surface-secondary shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-text-primary mb-2">Personal Information</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Name:</span> {profile.full_name}</div>
              <div><span className="font-medium">Email:</span> {profile.email}</div>
              <div><span className="font-medium">Phone:</span> {profile.phone}</div>
              <div><span className="font-medium">Guest Type:</span> {profile.guest_type}</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-text-primary mb-2">Stay History</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Total Stays:</span> {profile.total_stays}</div>
              <div><span className="font-medium">Total Spent:</span> Rs {profile.total_spent.toLocaleString()}</div>
              <div><span className="font-medium">First Stay:</span> {profile.first_stay_date ? new Date(profile.first_stay_date).toLocaleDateString() : 'N/A'}</div>
              <div><span className="font-medium">Last Stay:</span> {profile.last_stay_date ? new Date(profile.last_stay_date).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {profile.loyalty.membership_level && (
        <div className="bg-surface-secondary shadow rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Loyalty Program</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-text-primary mb-2">Membership Level</h4>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                {profile.loyalty.membership_level}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-2">Current Points</h4>
              <p className="text-2xl font-semibold text-text-primary">
                {profile.loyalty.current_points || 0}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-text-primary mb-2">Member Since</h4>
              <p className="text-sm text-text-secondary">
                {profile.loyalty.enrollment_date ? new Date(profile.loyalty.enrollment_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Online Check-In Modal Component
const OnlineCheckInModal = ({ booking, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id_document_type: 'Passport',
    id_document_number: '',
    id_document_expiry: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    special_requests: '',
    arrival_time: '',
    vehicle_plate: '',
    dietary_restrictions: '',
    accessibility_needs: '',
    agree_terms: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agree_terms) {
      alert('Please agree to the terms and conditions');
      return;
    }
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium mb-4">Online Check-In</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                ID Document Type *
              </label>
              <SearchableDropdown
                options={[
                  { value: 'Passport', label: 'Passport' },
                  { value: 'Driver License', label: 'Driver License' },
                  { value: 'National ID', label: 'National ID' },
                  { value: 'Other', label: 'Other' }
                ]}
                value={formData.id_document_type}
                onChange={(value) => handleChange({ target: { name: 'id_document_type', value } })}
                placeholder="Select ID document type..."
                searchPlaceholder="Search document types..."
                className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2"
                required
                displayKey="label"
                valueKey="value"
                searchKeys={['label']}
                renderOption={(doc) => (
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <div className="font-medium">{doc.label}</div>
                    </div>
                  </div>
                )}
                renderSelected={(doc) => (
                  <div className="flex justify-between items-center w-full">
                    <span className="font-medium">{doc.label}</span>
                  </div>
                )}
                emptyMessage="No document types found"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                ID Document Number *
              </label>
              <input
                type="text"
                name="id_document_number"
                value={formData.id_document_number}
                onChange={handleChange}
                required
                className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Emergency Contact Name *
              </label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                required
                className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Emergency Contact Phone *
              </label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                required
                className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Special Requests
            </label>
            <textarea
              name="special_requests"
              value={formData.special_requests}
              onChange={handleChange}
              rows="3"
              className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2 bg-surface-secondary text-text-primary placeholder:text-text-tertiary dark:bg-slate-700 dark:text-slate-100 bg-surface-secondary text-text-primary dark:bg-slate-700 dark:text-slate-100 placeholder:text-text-tertiary"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="agree_terms"
              checked={formData.agree_terms}
              onChange={handleChange}
              className="mr-2"
              required
            />
            <label className="text-sm text-text-secondary">
              I agree to the terms and conditions *
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-border dark:border-slate-600 rounded-md text-text-secondary hover:bg-surface-tertiary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Complete Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Online Check-Out Modal Component
const OnlineCheckOutModal = ({ booking, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    checkout_method: 'Express',
    receipt_email: '',
    receipt_sms: '',
    feedback_rating: 5,
    feedback_comments: '',
    future_stay_preferences: '',
    marketing_consent: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <h3 className="text-lg font-medium mb-4">Online Check-Out</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Check-Out Method *
            </label>
            <SearchableDropdown
              options={[
                { value: 'Express', label: 'Express Check-Out' },
                { value: 'Standard', label: 'Standard Check-Out' }
              ]}
              value={formData.checkout_method}
              onChange={(value) => handleChange({ target: { name: 'checkout_method', value } })}
              placeholder="Select checkout method..."
              searchPlaceholder="Search checkout methods..."
              className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2"
              required
              displayKey="label"
              valueKey="value"
              searchKeys={['label']}
              renderOption={(method) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{method.label}</div>
                  </div>
                </div>
              )}
              renderSelected={(method) => (
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{method.label}</span>
                </div>
              )}
              emptyMessage="No checkout methods found"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Receipt Email
              </label>
              <input
                type="email"
                name="receipt_email"
                value={formData.receipt_email}
                onChange={handleChange}
                className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Receipt SMS
              </label>
              <input
                type="tel"
                name="receipt_sms"
                value={formData.receipt_sms}
                onChange={handleChange}
                className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Overall Rating
            </label>
            <SearchableDropdown
              options={[
                { value: 5, label: 'Excellent (5)' },
                { value: 4, label: 'Very Good (4)' },
                { value: 3, label: 'Good (3)' },
                { value: 2, label: 'Fair (2)' },
                { value: 1, label: 'Poor (1)' }
              ]}
              value={formData.feedback_rating}
              onChange={(value) => handleChange({ target: { name: 'feedback_rating', value } })}
              placeholder="Select rating..."
              searchPlaceholder="Search ratings..."
              className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2"
              displayKey="label"
              valueKey="value"
              searchKeys={['label']}
              renderOption={(rating) => (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <div className="font-medium">{rating.label}</div>
                  </div>
                </div>
              )}
              renderSelected={(rating) => (
                <div className="flex justify-between items-center w-full">
                  <span className="font-medium">{rating.label}</span>
                </div>
              )}
              emptyMessage="No ratings found"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Feedback Comments
            </label>
            <textarea
              name="feedback_comments"
              value={formData.feedback_comments}
              onChange={handleChange}
              rows="3"
              className="w-full border border-border dark:border-slate-600 rounded-md px-3 py-2 bg-surface-secondary text-text-primary placeholder:text-text-tertiary dark:bg-slate-700 dark:text-slate-100 bg-surface-secondary text-text-primary dark:bg-slate-700 dark:text-slate-100 placeholder:text-text-tertiary"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="marketing_consent"
              checked={formData.marketing_consent}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm text-text-secondary">
              I consent to receive marketing communications
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-border dark:border-slate-600 rounded-md text-text-secondary hover:bg-surface-tertiary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Complete Check-Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerPortal;