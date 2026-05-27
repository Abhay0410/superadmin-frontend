import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Schools() {
  const [schools, setSchools] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    code: '',
    email: '',
    subdomain: '',
    phone: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both schools and plans in parallel
        const [schoolsRes, plansRes] = await Promise.all([
          api.get('/schools'),
          api.get('/plans')
        ]);
        
        const fetchedSchools = schoolsRes.data?.data?.schools || schoolsRes.data?.data || schoolsRes.data;
        const fetchedPlans = plansRes.data?.data?.plans || plansRes.data?.data || plansRes.data;
        setSchools(Array.isArray(fetchedSchools) ? fetchedSchools : []);
        setPlans(Array.isArray(fetchedPlans) ? fetchedPlans : []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.post('/schools', formData);
      setIsModalOpen(false);
      setFormData({ schoolName: '', code: '', email: '', subdomain: '', phone: '' });
      setRefreshTrigger((prev) => prev + 1); // Refresh the list
    } catch (err) {
      console.error('Error creating school:', err);
      alert(err.response?.data?.message || 'Failed to provision new school.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg = newStatus === 'SUSPENDED' 
      ? 'Are you sure you want to SUSPEND this school? They will lose all access immediately.'
      : 'Are you sure you want to ACTIVATE this school?';
      
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await api.patch(`/schools/${id}/status`, { status: newStatus });
      // Update local state to avoid a full page re-fetch
      setSchools(schools.map(s => s._id === id ? { ...s, status: newStatus } : s));

      // ✅ If the school was just activated, pop up the Admin ID!
      if (newStatus === 'ACTIVE' && response.data?.data?.adminDetails) {
        const { adminID, email, name } = response.data.data.adminDetails;
        alert(`✅ School Activated Successfully!\n\nPrincipal: ${name}\nLogin ID: ${adminID}\nEmail: ${email}\n\n(Note: Password is known only to the user)`);
      } else {
        alert(`School status updated to ${newStatus}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update school status.');
    }
  };

  const handleAssignPlan = async (schoolId, planId) => {
    if (!planId) return;
    if (!window.confirm('Are you sure you want to change the subscription plan for this school?')) return;
    
    try {
      await api.patch(`/plans/assign/${schoolId}`, { planId });
      setRefreshTrigger((prev) => prev + 1); // Refresh to get the updated plan details
    } catch (err) {
      console.error('Error assigning plan:', err);
      alert('Failed to update school plan.');
    }
  };

  const handleImpersonate = async (id) => {
    // 1. Open a blank window IMMEDIATELY to bypass popup blockers
    const impersonateWindow = window.open('', '_blank');
    
    if (impersonateWindow) {
      impersonateWindow.document.write('<div style="font-family: sans-serif; padding: 2rem; text-align: center;">Authenticating... Please wait.</div>');
    } else {
      alert('Please allow pop-ups for this site to use the impersonation feature.');
      return;
    }

    try {
      const response = await api.post(`/schools/${id}/impersonate`);
      // The token is nested in the standard backend response
      const token = response.data?.data?.token;
      
      if (!token) {
        throw new Error("Impersonation token not received from server.");
      }

      // 2. Redirect the newly opened window to the tenant app!
      impersonateWindow.location.href = `http://localhost:5173/auto-login?token=${token}`;
      
    } catch (err) {
      console.error('Error impersonating:', err);
      if (impersonateWindow) impersonateWindow.close();
      alert('Failed to generate impersonation token.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tenant Management</h1>
          <p className="text-slate-600 mt-1">Manage schools, subscriptions, and platform access.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          + Add New School
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow-sm font-medium">
          {error}
        </div>
      )}

      {/* Master Roster Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">School / Tenant</th>
                <th className="px-6 py-4 font-medium">Subdomain</th>
                <th className="px-6 py-4 font-medium">Plan</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {schools.length > 0 ? schools.map((school) => (
                <tr key={school._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{school.schoolName}</div>
                    <div className="text-slate-500 text-xs mt-1">Code: {school.code} | {school.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                    {school.subdomain}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={school.subscription?.plan?._id || school.subscription?.plan || ''}
                      onChange={(e) => handleAssignPlan(school._id, e.target.value)}
                    >
                      <option value="" disabled>No Plan Assigned</option>
                      {plans.map((plan) => (
                        <option key={plan._id} value={plan._id}>
                          {plan.name} (${plan.monthlyPrice})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                      school.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => handleImpersonate(school._id)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                      title="Login to this tenant's dashboard"
                    >
                      Impersonate
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={() => handleToggleStatus(school._id, school.status)}
                      className={`${school.status === 'ACTIVE' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} font-medium text-sm transition-colors`}
                    >
                      {school.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    No schools provisioned yet. Click "Add New School" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add School Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Provision New School</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleCreateSchool} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                <input type="text" name="schoolName" required value={formData.schoolName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Greenfield High" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Code</label>
                  <input type="text" name="code" required value={formData.code} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. GFH01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subdomain</label>
                  <input type="text" name="subdomain" required value={formData.subdomain} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="greenfield" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="admin@greenfield.edu" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="text" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="1234567890" />
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{submitLoading ? 'Provisioning...' : 'Provision School'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}