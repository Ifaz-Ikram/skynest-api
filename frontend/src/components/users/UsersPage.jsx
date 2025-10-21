import { useState, useEffect } from 'react';
import { Users, UserCircle, AlertTriangle } from 'lucide-react';
import { LuxuryPageHeader } from '../common';

export const UsersPage = () => {
  return (
    <div className="min-h-screen bg-surface-tertiary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Employee Management"
          description="Create and manage employee accounts (Admin/Manager)"
          icon={Users}
          stats={[
            { label: 'Total Users', value: '—', trend: 'Not implemented' },
            { label: 'Admins', value: '—', trend: 'Not implemented' },
            { label: 'Managers', value: '—', trend: 'Not implemented' },
          ]}
        />

        <div className="bg-surface-secondary rounded-xl shadow-md p-6 border border-border">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Feature Not Implemented</h3>
          <p className="text-slate-300 mb-4">
            Employee management functionality is not implemented in the current database schema.
          </p>
          <p className="text-sm text-slate-400">
            This feature would require user_account table management endpoints in the backend.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};
