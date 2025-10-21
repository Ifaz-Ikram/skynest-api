// frontend/src/components/checkin/CheckInModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  CreditCard, 
  FileText, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  X,
  Save,
  Clock,
  Bed,
  Shield,
  Phone,
  Mail
} from 'lucide-react';
import api from '../../utils/api';
import { format } from 'date-fns';
import SearchableDropdown from '../common/SearchableDropdown';

const CheckInModal = ({ booking, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Guest verification
    idType: '',
    idNumber: '',
    idVerified: false,
    
    // Deposit confirmation
    depositConfirmed: false,
    depositMethod: '',
    depositReference: '',
    depositAmount: 0,
    
    // Signature and compliance
    signature: null,
    termsAccepted: false,
    privacyAccepted: false,
    
    // Room assignment
    assignedRoom: '',
    roomNotes: '',
    upgradeOffered: false,
    upgradeReason: '',
    
    // Check-in details
    actualCheckInTime: new Date().toISOString(),
    checkInNotes: '',
    specialRequests: '',
    
    // Contact verification
    phoneVerified: false,
    emailVerified: false,
    emergencyContact: '',
    emergencyPhone: ''
  });

  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomConflicts, setRoomConflicts] = useState([]);

  const idTypeOptions = useMemo(
    () => [
      { id: 'passport', name: 'Passport' },
      { id: 'drivers_license', name: "Driver's License" },
      { id: 'national_id', name: 'National ID' },
      { id: 'other', name: 'Other' },
    ],
    [],
  );

  useEffect(() => {
    if (booking) {
      setFormData(prev => ({
        ...prev,
        depositAmount: booking.advance_payment || 0,
        assignedRoom: booking.room_number || '',
        actualCheckInTime: new Date().toISOString()
      }));
      loadAvailableRooms();
    }
  }, [booking]);

  const loadAvailableRooms = async () => {
    try {
      // Load available rooms for potential upgrades
      const rooms = await api.getAvailableRooms({
        check_in: booking.check_in_date,
        check_out: booking.check_out_date,
        room_type: booking.room_type_id
      });
      setAvailableRooms(rooms);
    } catch (err) {
      console.error('Error loading available rooms:', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSignatureCapture = () => {
    // Simulate signature capture - in real implementation, use a signature pad library
    const signature = `SIGNATURE_${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      signature
    }));
  };

  const handlePhotoCapture = () => {
    // Simulate photo capture - in real implementation, use camera API
    const photo = `PHOTO_${Date.now()}`;
    setFormData(prev => ({
      ...prev,
      photo
    }));
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1: // Guest Verification
        return formData.idType && formData.idNumber && formData.idVerified;
      case 2: // Payment Acknowledgment
        return formData.depositConfirmed; // Just needs confirmation, no tracking
      case 3: // Room Assignment
        return formData.assignedRoom && formData.termsAccepted;
      case 4: // Final Review
        return formData.signature && formData.privacyAccepted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    } else {
      setError('Please complete all required fields before proceeding');
    }
  };

  const handlePrevious = () => {
    setStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create check-in record
      const checkInData = {
        booking_id: booking.booking_id,
        check_in_time: formData.actualCheckInTime,
        id_type: formData.idType,
        id_number: formData.idNumber,
        id_verified: formData.idVerified,
        // Deposit tracking removed - not in schema (only advance_payment in booking table)
        // deposit_confirmed: formData.depositConfirmed,
        // deposit_method: formData.depositMethod,
        // deposit_reference: formData.depositReference,
        signature: formData.signature,
        assigned_room: formData.assignedRoom,
        room_notes: formData.roomNotes,
        check_in_notes: formData.checkInNotes,
        special_requests: formData.specialRequests,
        emergency_contact: formData.emergencyContact,
        emergency_phone: formData.emergencyPhone,
        phone_verified: formData.phoneVerified,
        email_verified: formData.emailVerified,
        terms_accepted: formData.termsAccepted,
        privacy_accepted: formData.privacyAccepted
      };

      await api.createCheckIn(checkInData);
      
      // Update booking status
      await api.updateBookingStatus(booking.booking_id, 'Checked-In');
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {[1, 2, 3, 4].map((stepNum) => (
        <React.Fragment key={stepNum}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            stepNum <= step 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-700 text-slate-200'
          }`}>
            {stepNum}
          </div>
          {stepNum < 4 && (
            <div className={`w-12 h-1 mx-2 ${
              stepNum < step ? 'bg-blue-600' : 'bg-slate-700'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderGuestVerification = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white">Guest Verification</h3>
        <p className="text-slate-300">Verify guest identity and contact information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ID Type *
          </label>
          <SearchableDropdown
            value={formData.idType}
            onChange={(value) => handleInputChange('idType', value)}
            options={idTypeOptions}
            placeholder="Select ID Type"
            clearable={false}
            hideSearch
            className="w-full"
            buttonClassName="!w-full !px-3 !py-2 !border border-border dark:border-slate-600 !rounded-md focus-visible:!ring-blue-500 focus-visible:!ring-offset-0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            ID Number *
          </label>
          <input
            type="text"
            value={formData.idNumber}
            onChange={(e) => handleInputChange('idNumber', e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter ID number"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleInputChange('idVerified', !formData.idVerified)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            formData.idVerified 
              ? 'bg-green-800/30 text-green-200' 
              : 'bg-slate-800 text-slate-200'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          <span>ID Verified</span>
        </button>

        <button
          onClick={handlePhotoCapture}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-800/30 text-blue-200 rounded-md hover:bg-blue-200"
        >
          <Camera className="w-5 h-5" />
          <span>Capture Photo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Emergency Contact
          </label>
          <input
            type="text"
            value={formData.emergencyContact}
            onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Emergency contact name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Emergency Phone
          </label>
          <input
            type="tel"
            value={formData.emergencyPhone}
            onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Emergency contact phone"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleInputChange('phoneVerified', !formData.phoneVerified)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            formData.phoneVerified 
              ? 'bg-green-800/30 text-green-200' 
              : 'bg-slate-800 text-slate-200'
          }`}
        >
          <Phone className="w-5 h-5" />
          <span>Phone Verified</span>
        </button>

        <button
          onClick={() => handleInputChange('emailVerified', !formData.emailVerified)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            formData.emailVerified 
              ? 'bg-green-800/30 text-green-200' 
              : 'bg-slate-800 text-slate-200'
          }`}
        >
          <Mail className="w-5 h-5" />
          <span>Email Verified</span>
        </button>
      </div>
    </div>
  );

  const renderDepositConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CreditCard className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white">Advance Payment</h3>
        <p className="text-slate-300">Review advance payment for this booking</p>
      </div>

      <div className="bg-surface-tertiary rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Advance Payment</span>
          <span className="text-lg font-bold text-white">
            ${formData.depositAmount.toFixed(2)}
          </span>
        </div>
        <div className="text-sm text-slate-400">
          {formData.depositAmount > 0 
            ? 'Advance payment recorded in booking' 
            : 'No advance payment for this booking'}
        </div>
      </div>

      {/* Simplified: Just acknowledge, no tracking (deposit feature removed from schema) */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleInputChange('depositConfirmed', !formData.depositConfirmed)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium ${
            formData.depositConfirmed 
              ? 'bg-green-600 text-white' 
              : 'bg-slate-700 text-slate-100'
          }`}
        >
          <CheckCircle className="w-5 h-5" />
          <span>Acknowledged</span>
        </button>
      </div>
    </div>
  );

  const renderRoomAssignment = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Bed className="w-12 h-12 text-purple-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white">Room Assignment</h3>
        <p className="text-slate-300">Assign room and check for conflicts</p>
      </div>

      <div className="bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Bed className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">Current Assignment</span>
        </div>
        <div className="text-sm text-blue-300">
          Room {booking.room_number} - {booking.room_type}
        </div>
      </div>

      {roomConflicts.length > 0 && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-900">Room Conflicts Detected</span>
          </div>
          <div className="text-sm text-red-300">
            {roomConflicts.map((conflict, index) => (
              <div key={index}>• {conflict}</div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Room Notes
        </label>
        <textarea
          value={formData.roomNotes}
          onChange={(e) => handleInputChange('roomNotes', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any special notes about the room assignment..."
        />
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleInputChange('upgradeOffered', !formData.upgradeOffered)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
            formData.upgradeOffered 
              ? 'bg-green-800/30 text-green-200' 
              : 'bg-slate-800 text-slate-200'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>Upgrade Offered</span>
        </button>
      </div>

      {formData.upgradeOffered && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Upgrade Reason
          </label>
          <input
            type="text"
            value={formData.upgradeReason}
            onChange={(e) => handleInputChange('upgradeReason', e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Reason for upgrade offer"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="terms"
          checked={formData.termsAccepted}
          onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border dark:border-slate-600 rounded"
        />
        <label htmlFor="terms" className="text-sm text-slate-300">
          I accept the terms and conditions *
        </label>
      </div>
    </div>
  );

  const renderFinalReview = () => (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white">Final Review</h3>
        <p className="text-slate-300">Review details and capture signature</p>
      </div>

      <div className="bg-surface-tertiary rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-slate-300">Guest:</span>
            <div className="text-white">{booking.guest_name}</div>
          </div>
          <div>
            <span className="font-medium text-slate-300">Room:</span>
            <div className="text-white">{formData.assignedRoom}</div>
          </div>
          <div>
            <span className="font-medium text-slate-300">Check-in Time:</span>
            <div className="text-white">
              {format(new Date(formData.actualCheckInTime), 'dd/MM/yyyy HH:mm')}
            </div>
          </div>
          <div>
            <span className="font-medium text-slate-300">Advance Payment:</span>
            <div className="text-white">
              ${formData.depositAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Check-in Notes
        </label>
        <textarea
          value={formData.checkInNotes}
          onChange={(e) => handleInputChange('checkInNotes', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any additional notes about the check-in process..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Special Requests
        </label>
        <textarea
          value={formData.specialRequests}
          onChange={(e) => handleInputChange('specialRequests', e.target.value)}
          rows={2}
          className="w-full px-4 py-3 border-2 border-slate-600 bg-slate-800/50 text-white placeholder-slate-400 border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Any special requests from the guest..."
        />
      </div>

      <div className="border-2 border-dashed border-border dark:border-slate-600 rounded-lg p-8 text-center">
        <button
          onClick={handleSignatureCapture}
          className="flex flex-col items-center space-y-2 text-slate-300 hover:text-white"
        >
          <FileText className="w-8 h-8" />
          <span className="text-sm font-medium">
            {formData.signature ? 'Signature Captured' : 'Capture Guest Signature'}
          </span>
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="privacy"
            checked={formData.privacyAccepted}
            onChange={(e) => handleInputChange('privacyAccepted', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-border dark:border-slate-600 rounded"
          />
          <label htmlFor="privacy" className="text-sm text-slate-300">
            I accept the privacy policy and data processing terms *
          </label>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderGuestVerification();
      case 2:
        return renderDepositConfirmation();
      case 3:
        return renderRoomAssignment();
      case 4:
        return renderFinalReview();
      default:
        return null;
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700/50" style={{minWidth: '600px'}}>
        <div className="px-6 py-5 border-b border-slate-700/50 bg-slate-800/60 backdrop-blur-lg sticky top-0 flex items-center justify-between" style={{ zIndex: 'var(--z-sticky)' }}>
          <div>
            <h2 className="text-2xl font-bold text-white">Check-In Process</h2>
            <p className="text-slate-300">Booking #{booking.booking_id} - {booking.guest_name}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg p-2 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {renderStepIndicator()}
          
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-300">{error}</span>
              </div>
            </div>
          )}

          {renderStepContent()}

          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
            <button
              onClick={handlePrevious}
              disabled={step === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={!validateStep(step)}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !validateStep(step)}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Complete Check-In</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;
