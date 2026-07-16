import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        // Assuming your backend route is /api/superadmin/metrics/dashboard
        const response = await api.get('/metrics/dashboard');
        setMetrics(response.data.data.metrics);
      } catch (err) {
        console.error('Error fetching metrics:', err);
        setError('Failed to load dashboard metrics. Ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow-sm">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  // Fallback defaults in case the backend returns empty data initially
  const data = {
    totalSchools: metrics?.schools?.total || 0,
    activeSchools: metrics?.schools?.active || 0,
    suspendedSchools: metrics?.schools?.suspended || 0,
    totalMRR: metrics?.revenue?.mrr || 0,
    totalStudents: metrics?.students?.totalActive || 0,
    totalStorageMB: metrics?.resources?.totalStorageUsedMB || 0,
    recentSchools: metrics?.recentSchools || [],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Analytics</h1>
        <p className="text-slate-600 mt-1">Live SaaS Metrics Overview</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Total Schools</h3>
          <p className="text-3xl font-bold text-slate-900 mt-2">{data.totalSchools}</p>
          <div className="mt-2 text-sm">
            <span className="text-green-600 font-medium">{data.activeSchools} Active</span>
            <span className="text-slate-300 mx-2">|</span>
            <span className="text-red-500 font-medium">{data.suspendedSchools} Suspended</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Platform MRR</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">₹{data.totalMRR}</p>
          <p className="mt-2 text-sm text-slate-500">Monthly Recurring Revenue</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Total Students</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{data.totalStudents}</p>
          <p className="mt-2 text-sm text-slate-500">Active across all tenants</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500">Storage Used</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{data.totalStorageMB} MB</p>
          <p className="mt-2 text-sm text-slate-500">Total platform consumption</p>
        </div>
      </div>

      {/* Recently Registered Schools Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Recently Registered Schools</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-6 py-3 font-medium">School Name</th>
                <th className="px-6 py-3 font-medium">Subdomain</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {data.recentSchools?.length > 0 ? (
                data.recentSchools.map((school) => (
                  <tr key={school._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{school.schoolName}</td>
                    <td className="px-6 py-4 text-slate-500">{school.subdomain}.yourdomain.com</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${school.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {school.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(school.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    No schools registered recently.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}