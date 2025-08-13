'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArtistPerformanceReport, ServicePerformance, MonthlyTrend } from '@/types';

interface PerformanceReportProps {
  report: ArtistPerformanceReport;
  onExport?: (format: 'pdf' | 'excel') => void;
  isLoading?: boolean;
}

const PerformanceReport: React.FC<PerformanceReportProps> = ({
  report,
  onExport,
  isLoading = false
}) => {
  const t = useTranslations('artists');
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'trends'>('overview');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(1)}%`;
  };

  const formatMonth = (monthStr: string): string => {
    const [year, month] = monthStr.split('-');
    if (!year || !month) return monthStr;
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long'
    }).format(date);
  };

  const getCompletionRate = (): number => {
    const { totalAppointments, completedAppointments } = report.metrics;
    return totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0;
  };

  const getCancellationRate = (): number => {
    const { totalAppointments, cancelledAppointments, noShowAppointments } = report.metrics;
    return totalAppointments > 0 ? ((cancelledAppointments + noShowAppointments) / totalAppointments) * 100 : 0;
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{t('performanceReport')}</h3>
            <p className="text-sm text-gray-600">
              {report.artistName} - {formatDate(report.period.startDate)} - {formatDate(report.period.endDate)}
            </p>
          </div>
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { key: 'overview', label: t('overview') },
            { key: 'services', label: t('topServices') },
            { key: 'trends', label: t('monthlyTrends') }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-600">{t('totalAppointments')}</div>
                <div className="text-2xl font-bold text-blue-900">
                  {report.metrics.totalAppointments}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-600">{t('completedAppointments')}</div>
                <div className="text-2xl font-bold text-green-900">
                  {report.metrics.completedAppointments}
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-600">{t('totalRevenue')}</div>
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(report.metrics.totalRevenue)}
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm font-medium text-orange-600">{t('commissionEarned')}</div>
                <div className="text-2xl font-bold text-orange-900">
                  {formatCurrency(report.metrics.commissionEarned)}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600">{t('averageServicePrice')}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(report.metrics.averageServicePrice)}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600">{t('completionRate')}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatPercentage(getCompletionRate())}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600">{t('cancellationRate')}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatPercentage(getCancellationRate())}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600">{t('clientRetentionRate')}</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatPercentage(report.metrics.clientRetentionRate)}
                </div>
              </div>
            </div>

            {/* Appointment Status Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">{t('appointmentStatusBreakdown')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('completed')}</span>
                  <span className="text-sm font-medium text-green-600">
                    {report.metrics.completedAppointments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('cancelled')}</span>
                  <span className="text-sm font-medium text-red-600">
                    {report.metrics.cancelledAppointments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('noShow')}</span>
                  <span className="text-sm font-medium text-orange-600">
                    {report.metrics.noShowAppointments}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">{t('topServices')}</h4>
            {report.topServices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('service')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('appointments')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('totalRevenue')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('averagePrice')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.topServices.map((service: ServicePerformance, index: number) => (
                      <tr key={service.serviceId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">{index + 1}</span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{service.serviceName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {service.appointmentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(service.totalRevenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(service.averagePrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noServicesData')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('noServicesDataDescription')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">{t('monthlyTrends')}</h4>
            {report.monthlyTrends.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('month')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('appointments')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('revenue')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('commission')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.monthlyTrends.map((trend: MonthlyTrend) => (
                      <tr key={trend.month} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatMonth(trend.month)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {trend.appointmentCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(trend.revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">
                          {formatCurrency(trend.commission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noTrendsData')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('noTrendsDataDescription')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceReport;