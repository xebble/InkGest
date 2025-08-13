'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CommissionCalculation, CommissionBreakdown } from '@/types';

interface CommissionReportProps {
  commission: CommissionCalculation;
  onExport?: (format: 'pdf' | 'excel') => void;
  onSendNotification?: () => void;
  isLoading?: boolean;
}

const CommissionReport: React.FC<CommissionReportProps> = ({
  commission,
  onExport,
  onSendNotification,
  isLoading = false
}) => {
  const t = useTranslations('artists');
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }, []);

  const formatPercentage = useCallback((rate: number): string => {
    return `${Math.round(rate * 100)}%`;
  }, []);

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{t('commissionReport')}</h3>
            <p className="text-sm text-gray-600">
              {formatDate(commission.period.startDate)} - {formatDate(commission.period.endDate)}
            </p>
          </div>
          <div className="flex space-x-2">
            {onSendNotification && (
              <button
                onClick={onSendNotification}
                disabled={isLoading}
                className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {t('sendNotification')}
              </button>
            )}
            {onExport && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onExport(e.target.value as 'pdf' | 'excel');
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="">{t('export')}</option>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-600">{t('totalRevenue')}</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(commission.totalRevenue)}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-600">{t('commissionAmount')}</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(commission.commissionAmount)}
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-600">{t('commissionRate')}</div>
            <div className="text-2xl font-bold text-purple-900">
              {formatPercentage(commission.commissionRate)}
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-600">{t('appointmentCount')}</div>
            <div className="text-2xl font-bold text-orange-900">
              {commission.appointmentCount}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{t('averageServicePrice')}</span>
            <span className="text-sm text-gray-900">
              {formatCurrency(commission.averageServicePrice)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{t('averageCommissionPerAppointment')}</span>
            <span className="text-sm text-gray-900">
              {formatCurrency(commission.appointmentCount > 0 ? commission.commissionAmount / commission.appointmentCount : 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown Toggle */}
      <div className="px-6 py-4 border-t border-gray-200">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-gray-700">{t('appointmentBreakdown')}</span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showBreakdown ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Breakdown Table */}
      {showBreakdown && (
        <div className="px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('date')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('client')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('service')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('servicePrice')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('commission')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {commission.breakdown.map((item: CommissionBreakdown) => (
                  <tr key={item.appointmentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(item.appointmentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.serviceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {formatCurrency(item.servicePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                      {formatCurrency(item.commissionAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {commission.breakdown.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noAppointments')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('noAppointmentsDescription')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommissionReport;