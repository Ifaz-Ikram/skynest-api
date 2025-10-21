import React from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import { LuxuryPageHeader } from '../common';

const InvoicesPage = () => {
  return (
    <div className="min-h-screen bg-surface-tertiary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <LuxuryPageHeader
          title="Invoices"
          description="Manage billing and invoices"
          icon={FileText}
          stats={[
            { label: 'Total Invoices', value: '—', trend: 'Not implemented' },
            { label: 'Paid', value: '—', trend: 'Not implemented' },
            { label: 'Unpaid', value: '—', trend: 'Not implemented' },
          ]}
        />

        <div className="bg-surface-secondary rounded-xl shadow-md p-6 border border-border">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">Feature Not Implemented</h3>
          <p className="text-text-secondary mb-4">
            Invoice management functionality is not implemented in the current database schema.
          </p>
          <p className="text-sm text-text-tertiary">
            This feature would require invoice table management endpoints in the backend.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default InvoicesPage;