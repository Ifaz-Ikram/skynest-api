// frontend/src/components/reports/BranchSelector.jsx
import React, { useState, useEffect } from 'react';
import { Building2, MapPin, TrendingUp, Bed, DollarSign, Users, BarChart3 } from 'lucide-react';
import api from '../../utils/api';

const BranchSelector = ({ onBranchSelect, selectedBranch }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from KPIs endpoint for each branch
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      // Fetch data for all branches
      const branchIds = ['all', 'colombo', 'galle', 'kandy', 'negombo'];
      const branchData = await Promise.all(
        branchIds.map(async (branchId) => {
          try {
            const data = await api.getKPIsDashboard({
              start_date: startDate,
              end_date: endDate,
              branch_id: branchId
            });
            
            return {
              id: branchId,
              data: data
            };
          } catch (err) {
            console.error(`Error loading data for ${branchId}:`, err);
            return {
              id: branchId,
              data: null
            };
          }
        })
      );

      const cityBranches = [
        {
          id: 'all',
          name: 'All Locations',
          location: 'Overall Report - All Cities',
          rooms: branchData[0]?.data?.occupancy_metrics?.total_rooms || 0,
          occupancy: branchData[0]?.data?.occupancy_metrics?.occupancy_rate || 0,
          revenue: branchData[0]?.data?.revenue_metrics?.total_revenue || 0,
          isOverall: true,
          icon: TrendingUp,
          color: 'from-blue-500 to-blue-600'
        },
        {
          id: 'colombo',
          name: 'Colombo Branch',
          location: 'Colombo, Western Province',
          rooms: branchData[1]?.data?.occupancy_metrics?.total_rooms || 0,
          occupancy: branchData[1]?.data?.occupancy_metrics?.occupancy_rate || 0,
          revenue: branchData[1]?.data?.revenue_metrics?.total_revenue || 0,
          isOverall: false,
          icon: Building2,
          color: 'from-purple-500 to-purple-600'
        },
        {
          id: 'galle',
          name: 'Galle Branch',
          location: 'Galle, Southern Province',
          rooms: branchData[2]?.data?.occupancy_metrics?.total_rooms || 0,
          occupancy: branchData[2]?.data?.occupancy_metrics?.occupancy_rate || 0,
          revenue: branchData[2]?.data?.revenue_metrics?.total_revenue || 0,
          isOverall: false,
          icon: Building2,
          color: 'from-green-500 to-green-600'
        },
        {
          id: 'kandy',
          name: 'Kandy Branch',
          location: 'Kandy, Central Province',
          rooms: branchData[3]?.data?.occupancy_metrics?.total_rooms || 0,
          occupancy: branchData[3]?.data?.occupancy_metrics?.occupancy_rate || 0,
          revenue: branchData[3]?.data?.revenue_metrics?.total_revenue || 0,
          isOverall: false,
          icon: Building2,
          color: 'from-orange-500 to-orange-600'
        },
        {
          id: 'negombo',
          name: 'Negombo Branch',
          location: 'Negombo, Western Province',
          rooms: branchData[4]?.data?.occupancy_metrics?.total_rooms || 0,
          occupancy: branchData[4]?.data?.occupancy_metrics?.occupancy_rate || 0,
          revenue: branchData[4]?.data?.revenue_metrics?.total_revenue || 0,
          isOverall: false,
          icon: Building2,
          color: 'from-pink-500 to-pink-600'
        }
      ];
      
      setBranches(cityBranches);
    } catch (err) {
      setError('Failed to load branch locations');
      console.error('Error loading branch locations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-blue-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <span className="mt-4 text-lg font-medium text-text-secondary">Loading branch data...</span>
        <span className="text-sm text-text-tertiary">Fetching real-time metrics</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <p className="text-lg font-semibold text-red-800">{error}</p>
          <button 
            onClick={loadBranches}
            className="mt-4 btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary mb-3 flex items-center">
          <BarChart3 className="w-8 h-8 mr-3 text-blue-600" />
          Select Branch Location
        </h2>
        <p className="text-text-secondary text-lg">Choose a branch to view detailed reports or select "All Locations" for overall analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => {
          const Icon = branch.icon;
          return (
            <div
              key={branch.id}
              onClick={() => onBranchSelect(branch)}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                selectedBranch?.id === branch.id
                  ? 'ring-4 ring-blue-400 shadow-2xl'
                  : 'shadow-lg hover:shadow-2xl'
              }`}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${branch.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
              
              {/* Card Content */}
              <div className="relative bg-white p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 bg-gradient-to-br ${branch.color} rounded-xl shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary text-lg">{branch.name}</h3>
                      <div className="flex items-center text-sm text-text-tertiary mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {branch.location}
                      </div>
                    </div>
                  </div>
                  {selectedBranch?.id === branch.id && (
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full shadow-lg animate-pulse">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                {!branch.isOverall ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg group-hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2">
                        <Bed className="w-4 h-4 text-text-tertiary" />
                        <span className="text-sm font-medium text-text-secondary">Rooms:</span>
                      </div>
                      <span className="font-bold text-text-primary text-lg">{branch.rooms}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg group-hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-text-secondary">Occupancy:</span>
                      </div>
                      <span className="font-bold text-green-600 text-lg">{branch.occupancy.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg group-hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-text-secondary">Revenue:</span>
                      </div>
                      <span className="font-bold text-blue-600 text-lg">Rs {branch.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <Users className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-sm font-medium text-text-secondary">Combined analytics from all branches</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="font-bold text-text-primary text-base">{branch.rooms}</div>
                        <div className="text-text-tertiary">Rooms</div>
                      </div>
                      <div>
                        <div className="font-bold text-green-600 text-base">{branch.occupancy.toFixed(1)}%</div>
                        <div className="text-text-tertiary">Occupancy</div>
                      </div>
                      <div>
                        <div className="font-bold text-blue-600 text-base">Rs {(branch.revenue / 1000).toFixed(1)}K</div>
                        <div className="text-text-tertiary">Revenue</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BranchSelector;
