// frontend/src/components/housekeeping/HousekeepingManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  RefreshCw,
  Filter,
  Search,
  Eye,
  Edit,
  Save,
  X,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  Shield,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Settings,
  Bell,
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Home,
  Car,
  Wifi,
  Coffee,
  Utensils,
  Dumbbell,
  Waves,
  Sparkles
} from 'lucide-react';
import api from '../../utils/api';
import { format } from 'date-fns';
import SearchableDropdown from '../common/SearchableDropdown';

const HousekeepingManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    floor: '',
    room_type: '',
    assigned_to: ''
  });

  useEffect(() => {
    // Check if user is authenticated before loading data
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to access housekeeping management');
      setLoading(false);
      return;
    }
    loadHousekeepingData();
  }, [filters]);

  const loadHousekeepingData = async () => {
    setLoading(true);
    setError(null);
    try {
      // REMOVED: Task management - not implemented in backend
      // const [roomsData, tasksData] = await Promise.all([
      //   api.getRoomsWithStatus(),
      //   api.getHousekeepingTasks(filters)
      // ]);
      
      const roomsData = await api.getRoomsWithStatus();
      
      setRooms(roomsData);
      // REMOVED: setHousekeepingTasks(tasksData); - not implemented
    } catch (err) {
      console.error('Housekeeping data load error:', err);
      if (err.status === 401) {
        setError('Please log in to access housekeeping management');
      } else if (err.status === 403) {
        setError('You do not have permission to access housekeeping management');
      } else if (err.message && err.message.includes('Missing auth token')) {
        setError('Please log in to access housekeeping management');
      } else if (err.message && err.message.includes('Invalid or expired token')) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError('Failed to load housekeeping data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (roomId, status) => {
    try {
      await api.updateRoomStatus(roomId, status);
      await loadHousekeepingData();
    } catch (err) {
      setError(err.message);
    }
  };

  // REMOVED: Task management functions - not implemented in backend
  // const createHousekeepingTask = async (taskData) => {
  //   try {
  //     await api.createHousekeepingTask(taskData);
  //     setShowTaskModal(false);
  //     await loadHousekeepingData();
  //   } catch (err) {
  //     setError(err.message);
  //   }
  // };

  // const updateTaskStatus = async (taskId, status) => {
  //   try {
  //     await api.updateHousekeepingTaskStatus(taskId, status);
  //     await loadHousekeepingData();
  //   } catch (err) {
  //     setError(err.message);
  //   }
  // };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Clean': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Dirty': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Inspected': return <Shield className="w-5 h-5 text-blue-600" />;
      case 'Maintenance': return <Settings className="w-5 h-5 text-purple-600" />;
      default: return <Clock className="w-5 h-5 text-text-secondary" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Clean': return 'bg-green-100 text-green-800';
      case 'Dirty': return 'bg-red-100 text-red-800';
      case 'Inspected': return 'bg-blue-100 text-blue-800';
      case 'Maintenance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRoomGrid = () => (
    <div className="bg-surface-secondary border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Room Status Grid</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTaskModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
          <button
            onClick={loadHousekeepingData}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room, index) => (
          <div key={index} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Bed className="w-5 h-5 text-text-secondary" />
                <span className="font-medium text-text-primary">Room {room.room_number}</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(room.status)}`}>
                {room.status}
              </span>
            </div>

            <div className="space-y-2 text-sm text-text-secondary mb-4">
              <div className="flex justify-between">
                <span>Type:</span>
                <span>{room.room_type}</span>
              </div>
              <div className="flex justify-between">
                <span>Floor:</span>
                <span>{room.floor}</span>
              </div>
              {room.guest_name && (
                <div className="flex justify-between">
                  <span>Guest:</span>
                  <span className="truncate">{room.guest_name}</span>
                </div>
              )}
              {room.check_out_date && (
                <div className="flex justify-between">
                  <span>Check-out:</span>
                  <span>{room.check_out_date ? (() => {
                    try {
                      return format(new Date(room.check_out_date), 'dd/MM');
                    } catch (e) {
                      return room.check_out_date;
                    }
                  })() : 'N/A'}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => updateRoomStatus(room.room_id, 'Clean')}
                className={`flex-1 px-2 py-1 text-xs rounded ${
                  room.status === 'Clean' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-200'
                }`}
              >
                Clean
              </button>
              <button
                onClick={() => updateRoomStatus(room.room_id, 'Dirty')}
                className={`flex-1 px-2 py-1 text-xs rounded ${
                  room.status === 'Dirty' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200'
                }`}
              >
                Dirty
              </button>
              <button
                onClick={() => updateRoomStatus(room.room_id, 'Inspected')}
                className={`flex-1 px-2 py-1 text-xs rounded ${
                  room.status === 'Inspected' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200'
                }`}
              >
                Inspected
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTasksList = () => (
    <div className="bg-surface-secondary border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Housekeeping Tasks</h3>
        <div className="flex space-x-2">
          <SearchableDropdown
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            value={filters.status}
            onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            placeholder="All Status"
            searchPlaceholder="Search status..."
            className="px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            displayKey="label"
            valueKey="value"
            searchKeys={['label']}
            renderOption={(option) => (
              <div className="flex items-center space-x-2">
                {option.value === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                {option.value === 'in_progress' && <Activity className="w-4 h-4 text-blue-500" />}
                {option.value === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {option.value === 'cancelled' && <XCircle className="w-4 h-4 text-red-500" />}
                <span>{option.label}</span>
              </div>
            )}
            renderSelected={(option) => (
              <div className="flex items-center space-x-2">
                {option.value === 'pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                {option.value === 'in_progress' && <Activity className="w-4 h-4 text-blue-500" />}
                {option.value === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {option.value === 'cancelled' && <XCircle className="w-4 h-4 text-red-500" />}
                <span>{option.label}</span>
              </div>
            )}
            emptyMessage="No status found"
          />
        </div>
      </div>

      <div className="space-y-4">
        {housekeepingTasks.map((task, index) => (
          <div key={index} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {getStatusIcon(task.status)}
                <div>
                  <div className="font-medium text-text-primary">Room {task.room_number}</div>
                  <div className="text-sm text-text-tertiary">{task.task_type}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {task.status}
                </span>
                <span className="text-xs text-text-tertiary">
                  {task.created_at ? (() => {
                    try {
                      return format(new Date(task.created_at), 'dd/MM HH:mm');
                    } catch (e) {
                      return task.created_at;
                    }
                  })() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-sm text-text-secondary">Priority</div>
                <div className="font-medium">{task.priority}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Assigned To</div>
                <div className="font-medium">{task.assigned_to || 'Unassigned'}</div>
              </div>
              <div>
                <div className="text-sm text-text-secondary">Due Time</div>
                <div className="font-medium">
                  {task.due_time ? (() => {
                    try {
                      return format(new Date(task.due_time), 'HH:mm');
                    } catch (e) {
                      return task.due_time || 'N/A';
                    }
                  })() : 'N/A'}
                </div>
              </div>
            </div>

            {task.description && (
              <div className="mb-3">
                <div className="text-sm text-text-secondary">Description</div>
                <div className="text-sm text-text-primary">{task.description}</div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={() => updateTaskStatus(task.task_id, 'in_progress')}
                disabled={task.status === 'completed'}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start
              </button>
              <button
                onClick={() => updateTaskStatus(task.task_id, 'completed')}
                disabled={task.status === 'completed'}
                className="px-3 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Complete
              </button>
              <button
                onClick={() => updateTaskStatus(task.task_id, 'cancelled')}
                disabled={task.status === 'completed'}
                className="px-3 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTaskModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-surface-secondary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-2xl font-bold text-text-primary">Create Housekeeping Task</h2>
          <button onClick={() => setShowTaskModal(false)} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-6 h-6" />
          </button>
        </div>

        <HousekeepingTaskForm
          rooms={rooms}
          onSave={createHousekeepingTask}
          onCancel={() => setShowTaskModal(false)}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Housekeeping Management</h1>
            <p className="text-text-secondary">Manage room status and housekeeping tasks</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury-gold"></div>
            <span className="text-text-secondary">Loading housekeeping data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Housekeeping Management</h1>
          <p className="text-text-secondary">Manage room status and housekeeping tasks</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadHousekeepingData}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
            {error.includes('log in') && (
              <button
                onClick={() => window.location.href = '/login'}
                className="btn-primary text-sm"
              >
                Go to Login
              </button>
            )}
          </div>
        </div>
      )}

      {/* Room Status Grid */}
      {renderRoomGrid()}

      {/* Housekeeping Tasks */}
      {renderTasksList()}

      {/* Task Modal */}
      {showTaskModal && renderTaskModal()}
    </div>
  );
};

// Housekeeping Task Form Component
const HousekeepingTaskForm = ({ rooms, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    room_id: '',
    task_type: '',
    priority: 'medium',
    description: '',
    due_time: '',
    assigned_to: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Room</label>
          <SearchableDropdown
            options={rooms || []}
            value={formData.room_id}
            onChange={(value) => setFormData(prev => ({ ...prev, room_id: value }))}
            placeholder="Select Room"
            searchPlaceholder="Search rooms..."
            className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            displayKey="room_display"
            valueKey="room_id"
            searchKeys={['room_number', 'room_type']}
            renderOption={(room) => (
              <div className="flex justify-between items-center w-full">
                <div>
                  <div className="font-medium">Room {room.room_number}</div>
                  <div className="text-sm text-text-secondary">{room.room_type}</div>
                </div>
                <div className="text-xs text-text-tertiary">
                  {room.status}
                </div>
              </div>
            )}
            renderSelected={(room) => (
              <div className="flex justify-between items-center w-full">
                <span className="font-medium">Room {room.room_number}</span>
                <span className="text-sm text-text-secondary">{room.room_type}</span>
              </div>
            )}
            emptyMessage="No rooms found"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Task Type</label>
          <SearchableDropdown
            options={[
              { value: 'Cleaning', label: 'Cleaning' },
              { value: 'Maintenance', label: 'Maintenance' },
              { value: 'Inspection', label: 'Inspection' },
              { value: 'Setup', label: 'Setup' },
              { value: 'Deep Clean', label: 'Deep Clean' }
            ]}
            value={formData.task_type}
            onChange={(value) => setFormData(prev => ({ ...prev, task_type: value }))}
            placeholder="Select Task Type"
            searchPlaceholder="Search task types..."
            className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            displayKey="label"
            valueKey="value"
            searchKeys={['label']}
            renderOption={(option) => (
              <div className="flex items-center space-x-2">
                {option.value === 'Cleaning' && <Sparkles className="w-4 h-4 text-purple-500" />}
                {option.value === 'Maintenance' && <Wrench className="w-4 h-4 text-orange-500" />}
                {option.value === 'Inspection' && <Eye className="w-4 h-4 text-blue-500" />}
                {option.value === 'Setup' && <Home className="w-4 h-4 text-green-500" />}
                {option.value === 'Deep Clean' && <Activity className="w-4 h-4 text-red-500" />}
                <span>{option.label}</span>
              </div>
            )}
            renderSelected={(option) => (
              <div className="flex items-center space-x-2">
                {option.value === 'Cleaning' && <Sparkles className="w-4 h-4 text-purple-500" />}
                {option.value === 'Maintenance' && <Wrench className="w-4 h-4 text-orange-500" />}
                {option.value === 'Inspection' && <Eye className="w-4 h-4 text-blue-500" />}
                {option.value === 'Setup' && <Home className="w-4 h-4 text-green-500" />}
                {option.value === 'Deep Clean' && <Activity className="w-4 h-4 text-red-500" />}
                <span>{option.label}</span>
              </div>
            )}
            emptyMessage="No task types found"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Priority</label>
          <SearchableDropdown
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
            value={formData.priority}
            onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            placeholder="Select Priority"
            searchPlaceholder="Search priorities..."
            className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            displayKey="label"
            valueKey="value"
            searchKeys={['label']}
            renderOption={(option) => (
              <div className="flex items-center space-x-2">
                {option.value === 'low' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {option.value === 'medium' && <Clock className="w-4 h-4 text-yellow-500" />}
                {option.value === 'high' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                {option.value === 'urgent' && <XCircle className="w-4 h-4 text-red-500" />}
                <span>{option.label}</span>
              </div>
            )}
            renderSelected={(option) => (
              <div className="flex items-center space-x-2">
                {option.value === 'low' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {option.value === 'medium' && <Clock className="w-4 h-4 text-yellow-500" />}
                {option.value === 'high' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                {option.value === 'urgent' && <XCircle className="w-4 h-4 text-red-500" />}
                <span>{option.label}</span>
              </div>
            )}
            emptyMessage="No priorities found"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">Due Time</label>
          <input
            type="time"
            name="due_time"
            value={formData.due_time}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-secondary text-text-primary placeholder:text-text-tertiary dark:bg-slate-700 dark:text-slate-100"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          placeholder="Task description and special instructions..."
          className="w-full px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-surface-secondary text-text-primary placeholder:text-text-tertiary dark:bg-slate-700 dark:text-slate-100 bg-surface-secondary text-text-primary dark:bg-slate-700 dark:text-slate-100 placeholder:text-text-tertiary"
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-border dark:border-slate-600 rounded-md text-text-secondary hover:bg-surface-tertiary focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Create Task</span>
        </button>
      </div>
    </form>
  );
};

export default HousekeepingManagement;
