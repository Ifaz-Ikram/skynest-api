// frontend/src/components/manager/ManagerTools.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Target,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  Star,
  Bed,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Globe,
  Calculator,
  PieChart,
  Activity,
  Zap,
  Settings,
  FileText,
  Send
} from 'lucide-react';
import api from '../../utils/api';
import { format, addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';

const ManagerTools = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [groupBookings, setGroupBookings] = useState([]);
  const [ratePlans, setRatePlans] = useState([]);
  // REMOVED: const [forecastData, setForecastData] = useState(null); - Phase 3 feature (Q2 2026)
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()).toISOString().split('T')[0],
    end: endOfMonth(new Date()).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadManagerData();
  }, [dateRange]);

  const loadManagerData = async () => {
    setLoading(true);
    try {
      const [groupData, rateData] = await Promise.all([
        api.getGroupBookings(dateRange),
        api.getRatePlans()
        // REMOVED: api.getForecastData(dateRange) - Phase 3 feature (Q2 2026)
      ]);
      
      setGroupBookings(groupData);
      setRatePlans(rateData);
      // REMOVED: setForecastData(forecastData); - Phase 3 feature (Q2 2026)
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createGroupBooking = async (groupData) => {
    try {
      await api.createGroupBooking(groupData);
      await loadManagerData();
      setShowGroupModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateGroupBooking = async (groupId, groupData) => {
    try {
      await api.updateGroupBooking(groupId, groupData);
      await loadManagerData();
      setShowGroupModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const createRatePlan = async (rateData) => {
    try {
      await api.createRatePlan(rateData);
      await loadManagerData();
      setShowRateModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateRatePlan = async (rateId, rateData) => {
    try {
      await api.updateRatePlan(rateId, rateData);
      await loadManagerData();
      setShowRateModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // REMOVED: exportForecast function - Phase 3 feature (Q2 2026)
  // const exportForecast = async (format) => {
  //   try {
  //     await api.exportForecast(dateRange, format);
  //   } catch (err) {
  //     setError(err.message);
  //   }
  // };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface-secondary border border-border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-800/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-300">Group Bookings</p>
              <p className="text-2xl font-bold text-white">
                {groupBookings.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-secondary border border-border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-800/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-300">Group Revenue</p>
              <p className="text-2xl font-bold text-white">
                Rs {groupBookings.reduce((sum, g) => sum + g.total_revenue, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-secondary border border-border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-800/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-300">Rate Plans</p>
              <p className="text-2xl font-bold text-white">
                {ratePlans.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface-secondary border border-border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-800/30 rounded-lg">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-300">Rate Plans</p>
              <p className="text-2xl font-bold text-white">
                {ratePlans.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Group Bookings */}
      <div className="bg-surface-secondary border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Group Bookings</h3>
          <button
            onClick={() => setShowGroupModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Group</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-surface-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Group Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Rooms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Check-in
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {groupBookings.slice(0, 5).map((group, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{group.group_name}</div>
                    <div className="text-sm text-slate-400">{group.event_type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{group.contact_name}</div>
                    <div className="text-sm text-slate-400">{group.contact_email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {group.room_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {format(new Date(group.check_in_date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    Rs {group.total_revenue.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      group.status === 'confirmed' ? 'bg-green-800/30 text-green-200' :
                      group.status === 'pending' ? 'bg-yellow-800/30 text-yellow-800' :
                      'bg-red-800/30 text-red-200'
                    }`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowGroupModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowGroupModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate Plans Overview */}
      <div className="bg-surface-secondary border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Active Rate Plans</h3>
          <button
            onClick={() => setShowRateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Rate Plan</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ratePlans.slice(0, 6).map((rate, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{rate.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rate.status === 'active' ? 'bg-green-800/30 text-green-200' :
                  'bg-slate-800 text-white'
                }`}>
                  {rate.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Base Rate:</span>
                  <span className="font-medium">${rate.base_rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Discount:</span>
                  <span className="font-medium">{rate.discount_percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Bookings:</span>
                  <span className="font-medium">{rate.booking_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGroupBookings = () => (
    <div className="space-y-6">
      {/* Group Bookings Management */}
      <div className="bg-surface-secondary border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Group Bookings Management</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowGroupModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Group</span>
            </button>
            {/* REMOVED: Export button - Phase 3 feature (Q2 2026) */}
            {/* <button
              onClick={() => exportForecast('excel')}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button> */}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-surface-tertiary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Group Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Contact Information
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Booking Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Financial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {groupBookings.map((group, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{group.group_name}</div>
                    <div className="text-sm text-slate-400">{group.event_type}</div>
                    <div className="text-sm text-slate-400">{group.group_size} guests</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{group.contact_name}</div>
                    <div className="text-sm text-slate-400">{group.contact_email}</div>
                    <div className="text-sm text-slate-400">{group.contact_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{group.room_count} rooms</div>
                    <div className="text-sm text-slate-400">
                      {format(new Date(group.check_in_date), 'dd/MM')} - {format(new Date(group.check_out_date), 'dd/MM')}
                    </div>
                    <div className="text-sm text-slate-400">{group.nights} nights</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">Rs {group.total_revenue.toLocaleString()}</div>
                    <div className="text-sm text-slate-400">Rs {group.avg_rate}/room</div>
                    <div className="text-sm text-slate-400">{group.discount_percent}% discount</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      group.status === 'confirmed' ? 'bg-green-800/30 text-green-200' :
                      group.status === 'pending' ? 'bg-yellow-800/30 text-yellow-800' :
                      group.status === 'cancelled' ? 'bg-red-800/30 text-red-200' :
                      'bg-slate-800 text-white'
                    }`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowGroupModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedGroup(group);
                          setShowGroupModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRateManagement = () => (
    <div className="space-y-6">
      {/* Rate Plans Management */}
      <div className="bg-surface-secondary border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Rate Plans Management</h3>
          <button
            onClick={() => setShowRateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Rate Plan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ratePlans.map((rate, index) => (
            <div key={index} className="border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{rate.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rate.status === 'active' ? 'bg-green-800/30 text-green-200' :
                  'bg-slate-800 text-white'
                }`}>
                  {rate.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Base Rate:</span>
                  <span className="font-medium text-white">${rate.base_rate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Discount:</span>
                  <span className="font-medium text-white">{rate.discount_percent}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Final Rate:</span>
                  <span className="font-medium text-white">${rate.final_rate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Bookings:</span>
                  <span className="font-medium text-white">{rate.booking_count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Revenue:</span>
                  <span className="font-medium text-white">Rs {rate.revenue.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRate(rate);
                      setShowRateModal(true);
                    }}
                    className="flex-1 btn-secondary text-sm"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button className="flex-1 btn-secondary text-sm text-red-600 hover:text-red-300">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rate Performance Analytics */}
      <div className="bg-surface-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Rate Performance Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-white">Top Performing Rates</h4>
            <div className="space-y-2">
              {ratePlans.slice(0, 5).map((rate, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-surface-tertiary rounded">
                  <span className="text-sm text-white">{rate.name}</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">{rate.booking_count} bookings</div>
                    <div className="text-xs text-slate-400">Rs {rate.revenue.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-white">Rate Utilization</h4>
            <div className="space-y-2">
              {ratePlans.map((rate, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{rate.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(rate.booking_count / Math.max(...ratePlans.map(r => r.booking_count))) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{rate.booking_count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // REMOVED: Forecasting functionality - Phase 3 feature (Q2 2026)
  // const renderForecasting = () => (
  //   <div className="space-y-6">
  //     {/* Forecast Overview */}
  //     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  //       <div className="bg-surface-secondary border border-border rounded-lg p-6">
  //         <div className="flex items-center">
  //           <div className="p-2 bg-blue-800/30 rounded-lg">
  //             <TrendingUp className="w-6 h-6 text-blue-600" />
  //           </div>
  //           <div className="ml-4">
  //             <p className="text-sm font-medium text-slate-300">Next Week Forecast</p>
  //             <p className="text-2xl font-bold text-white">
  //               ${forecastData?.next_week || 0}
  //             </p>
  //           </div>
  //         </div>
  //       </div>
  //       {/* ... rest of forecasting content ... */}
  //     </div>
  //   </div>
  // );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'group-bookings':
        return renderGroupBookings();
      case 'rate-management':
        return renderRateManagement();
      // REMOVED: case 'forecasting' - Phase 3 feature (Q2 2026)
      // case 'forecasting':
      //   return renderForecasting();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manager Tools</h1>
          <p className="text-slate-300">Group bookings and rate management</p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-3 py-2 border border-border dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={loadManagerData}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'group-bookings', name: 'Group Bookings', icon: Users },
            { id: 'rate-management', name: 'Rate Management', icon: DollarSign }
            // REMOVED: { id: 'forecasting', name: 'Forecasting', icon: TrendingUp } - Phase 3 feature (Q2 2026)
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-300 hover:text-slate-100 hover:border-border dark:border-slate-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-300">Loading manager data...</p>
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
};

export default ManagerTools;
