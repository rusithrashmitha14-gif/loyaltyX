'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken, isAuthenticated } from '@/lib/auth-utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import AnalyticsCard from '@/components/analytics/AnalyticsCard';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import AnalyticsTable from '@/components/analytics/AnalyticsTable';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [summary, setSummary] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [timeseries, setTimeseries] = useState<any[]>([]);
  const [topRewards, setTopRewards] = useState<any[]>([]);
  const [atRiskCustomers, setAtRiskCustomers] = useState<any[]>([]);

  const router = useRouter();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [summaryRes, customersRes, timeseriesRes, rewardsRes, atRiskRes] = await Promise.all([
        fetch(`/api/analytics/summary?range=${dateRange}`, { headers }),
        fetch(`/api/analytics/top-customers?range=${dateRange}&limit=10`, { headers }),
        fetch(`/api/analytics/transactions-timeseries?range=${dateRange}&interval=day`, { headers }),
        fetch(`/api/analytics/top-rewards?range=${dateRange}&limit=10`, { headers }),
        fetch(`/api/analytics/at-risk-customers?inactive_days=60&limit=10`, { headers }),
      ]);

      const [summaryData, customersData, timeseriesData, rewardsData, atRiskData] = await Promise.all([
        summaryRes.json(),
        customersRes.json(),
        timeseriesRes.json(),
        rewardsRes.json(),
        atRiskRes.json(),
      ]);

      if (summaryData.success) setSummary(summaryData.data);
      if (customersData.success) setTopCustomers(customersData.data);
      if (timeseriesData.success) setTimeseries(timeseriesData.data);
      if (rewardsData.success) setTopRewards(rewardsData.data);
      if (atRiskData.success) setAtRiskCustomers(atRiskData.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, router]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchAnalytics();
  }, [dateRange, router, fetchAnalytics]);

  const formatCurrency = (value: number) => `LKR ${value.toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Track loyalty program performance</p>
              </div>
            </div>
            <DateRangePicker value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Points Issued"
            value={loading ? '...' : (summary?.totalPointsIssued || 0).toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
            color="green"
            subtitle="Total loyalty points awarded"
          />

          <AnalyticsCard
            title="Points Redeemed"
            value={loading ? '...' : (summary?.totalPointsRedeemed || 0).toLocaleString()}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            }
            color="purple"
            subtitle={`${loading ? '0' : (summary?.redemptionRate || 0).toFixed(1)}% redemption rate`}
          />

          <AnalyticsCard
            title="Active Customers"
            value={loading ? '...' : summary?.activeCustomers || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            }
            color="blue"
            subtitle={`of ${loading ? '0' : summary?.totalCustomers || 0} total`}
          />

          <AnalyticsCard
            title="Avg Spend"
            value={loading ? '...' : formatCurrency(summary?.avgSpendPerVisit || 0)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="yellow"
            subtitle="Per transaction"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Transactions Over Time */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transactions Over Time</h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeseries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="transactions"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Transactions"
                    dot={{ fill: '#3B82F6', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Revenue (LKR)"
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Points Issued vs Redeemed */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Points Issued vs Redeemed</h3>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeseries}>
                  <defs>
                    <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRedeemed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#9CA3AF"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="pointsIssued"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorIssued)"
                    name="Points Issued"
                  />
                  <Area
                    type="monotone"
                    dataKey="pointsRedeemed"
                    stroke="#8B5CF6"
                    fillOpacity={1}
                    fill="url(#colorRedeemed)"
                    name="Points Redeemed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Rewards Bar Chart */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Most Popular Rewards</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            </div>
          ) : topRewards.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No rewards redeemed in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRewards} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                <YAxis
                  type="category"
                  dataKey="title"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  width={150}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="redemptionCount" fill="#F59E0B" name="Redemptions" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Customers Table */}
          <AnalyticsTable
            title="Top Customers by Spend"
            loading={loading}
            columns={[
              {
                header: 'Customer',
                accessor: 'name',
                Cell: (value, row) => (
                  <div>
                    <div className="font-medium text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500">{row.email}</div>
                  </div>
                ),
              },
              {
                header: 'Spend',
                accessor: 'totalSpend',
                Cell: (value) => (
                  <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
                ),
              },
              {
                header: 'Points',
                accessor: 'points',
                Cell: (value) => (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {value} pts
                  </span>
                ),
              },
              {
                header: 'Visits',
                accessor: 'transactionCount',
              },
            ]}
            data={topCustomers}
          />

          {/* At-Risk Customers Table */}
          <AnalyticsTable
            title="At-Risk Customers (60+ Days Inactive)"
            loading={loading}
            columns={[
              {
                header: 'Customer',
                accessor: 'name',
                Cell: (value, row) => (
                  <div>
                    <div className="font-medium text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500">{row.email}</div>
                  </div>
                ),
              },
              {
                header: 'Points',
                accessor: 'points',
                Cell: (value) => (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {value} pts
                  </span>
                ),
              },
              {
                header: 'Days Inactive',
                accessor: 'daysSinceLastVisit',
                Cell: (value) => (
                  <span className="text-red-600 font-medium">
                    {value ? `${value} days` : 'Never'}
                  </span>
                ),
              },
            ]}
            data={atRiskCustomers}
          />
        </div>

        {/* Top Rewards Table */}
        <div className="mt-6">
          <AnalyticsTable
            title="Top Redeemed Rewards"
            loading={loading}
            columns={[
              {
                header: 'Reward',
                accessor: 'title',
                Cell: (value, row) => (
                  <div>
                    <div className="font-medium text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500">{row.description}</div>
                  </div>
                ),
              },
              {
                header: 'Points Required',
                accessor: 'pointsRequired',
                Cell: (value) => `${value} pts`,
              },
              {
                header: 'Redemptions',
                accessor: 'redemptionCount',
                Cell: (value) => (
                  <span className="font-semibold text-gray-900">{value}</span>
                ),
              },
              {
                header: 'Total Points Used',
                accessor: 'totalPointsUsed',
                Cell: (value) => (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {value.toLocaleString()} pts
                  </span>
                ),
              },
            ]}
            data={topRewards}
          />
        </div>

        {/* Additional Stats */}
        {!loading && summary && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <p className="text-sm font-medium text-blue-700">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">{formatCurrency(summary.totalRevenue)}</p>
              <p className="text-xs text-blue-600 mt-1">{summary.totalTransactions} transactions</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <p className="text-sm font-medium text-green-700">Net Points</p>
              <p className="text-2xl font-bold text-green-900 mt-2">{summary.netPoints.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">Issued - Redeemed</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <p className="text-sm font-medium text-purple-700">Redemption Rate</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">{summary.redemptionRate.toFixed(1)}%</p>
              <p className="text-xs text-purple-600 mt-1">{summary.totalRedemptions} redemptions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

