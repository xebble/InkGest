'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useReminders } from '@/hooks/useReminders';

interface ReminderStatsProps {
  storeId: string;
}

interface DateRange {
  label: string;
  startDate: Date;
  endDate: Date;
}

const getDateRanges = (): DateRange[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [
    {
      label: 'Last 7 days',
      startDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: now
    },
    {
      label: 'Last 30 days',
      startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: now
    },
    {
      label: 'Last 3 months',
      startDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
      endDate: now
    },
    {
      label: 'This year',
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: now
    }
  ];
};

export default function ReminderStats({ storeId }: ReminderStatsProps) {
  const { getReminderStats, loading, error } = useReminders();
  const [stats, setStats] = useState<any>(null);
  const [selectedRange, setSelectedRange] = useState<DateRange>(getDateRanges()[1] as DateRange); // Last 30 days
  const [refreshing, setRefreshing] = useState(false);

  const dateRanges = getDateRanges();

  const loadStats = async () => {
    try {
      const data = await getReminderStats(storeId, selectedRange.startDate, selectedRange.endDate);
      setStats(data);
    } catch (err) {
      console.error('Failed to load reminder stats:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  useEffect(() => {
    if (storeId) {
      loadStats();
    }
  }, [storeId, selectedRange]);

  const renderTypeStats = (type: '24h' | '2h' | 'confirmation', data: any) => {
    const typeLabels = {
      '24h': '24 Hours Before',
      '2h': '2 Hours Before',
      'confirmation': 'Confirmation'
    };

    const typeIcons = {
      '24h': Clock,
      '2h': Clock,
      'confirmation': MessageSquare
    };

    const Icon = typeIcons[type];
    const successRate = data.scheduled > 0 ? (data.sent / data.scheduled) * 100 : 0;

    return (
      <Card key={type}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium">{typeLabels[type]}</CardTitle>
            </div>
            <Badge variant={successRate >= 90 ? 'default' : successRate >= 70 ? 'secondary' : 'destructive'}>
              {successRate.toFixed(1)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{data.scheduled}</div>
              <div className="text-xs text-gray-600">Scheduled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{data.sent}</div>
              <div className="text-xs text-gray-600">Sent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{data.failed}</div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Success Rate</span>
              <span>{successRate.toFixed(1)}%</span>
            </div>
            <Progress value={successRate} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Reminder Statistics</h2>
            <p className="text-gray-600">Track the performance of your reminder system</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-3">
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-2 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Reminder Statistics</h2>
            <p className="text-gray-600">Track the performance of your reminder system</p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Statistics</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reminder Statistics</h2>
          <p className="text-gray-600">Track the performance of your reminder system</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedRange.label}
            onValueChange={(value) => {
              const range = dateRanges.find(r => r.label === value);
              if (range) setSelectedRange(range);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map((range) => (
                <SelectItem key={range.label} value={range.label}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {stats && (
        <>
          {/* Overall Statistics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalScheduled}</div>
                <p className="text-xs text-gray-600">Reminders scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Successfully Sent</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalSent}</div>
                <p className="text-xs text-gray-600">Reminders delivered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Failed</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
                <p className="text-xs text-gray-600">Delivery failures</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                <Progress value={stats.successRate} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* By Type Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance by Reminder Type</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {renderTypeStats('24h', stats.byType['24h'])}
              {renderTypeStats('2h', stats.byType['2h'])}
              {renderTypeStats('confirmation', stats.byType.confirmation)}
            </div>
          </div>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insights & Recommendations</CardTitle>
              <CardDescription>
                Based on your reminder performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.successRate < 70 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800">Low Success Rate</p>
                      <p className="text-sm text-red-700">
                        Your overall success rate is below 70%. Consider checking your WhatsApp and email configurations.
                      </p>
                    </div>
                  </div>
                )}
                
                {stats.byType.confirmation.scheduled > 0 && stats.byType.confirmation.sent / stats.byType.confirmation.scheduled < 0.8 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Confirmation Issues</p>
                      <p className="text-sm text-yellow-700">
                        Confirmation reminders have a lower success rate. This might affect appointment confirmations.
                      </p>
                    </div>
                  </div>
                )}

                {stats.successRate >= 90 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Excellent Performance</p>
                      <p className="text-sm text-green-700">
                        Your reminder system is performing excellently with a {stats.successRate.toFixed(1)}% success rate.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}