import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    monthlyPrice: '',
    yearlyPrice: '',
    maxStudents: '',
    maxStaff: '',
    maxStorageMB: '',
    features: '', // We'll handle this as a comma-separated string in the form
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get('/plans');
        const fetchedPlans = response.data?.data?.plans || response.data?.data || response.data;
        setPlans(Array.isArray(fetchedPlans) ? fetchedPlans : []);
      } catch (err) {
        console.error('Error fetching plans:', err);
        setError('Failed to load subscription plans.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [refreshTrigger]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (plan = null) => {
    if (plan) {
      setEditingId(plan._id);
      setFormData({
        name: plan.name || '',
        monthlyPrice: plan.monthlyPrice || '',
        yearlyPrice: plan.yearlyPrice || '',
        maxStudents: plan.limits?.maxStudents !== undefined ? plan.limits.maxStudents : '',
        maxStaff: plan.limits?.maxStaff !== undefined ? plan.limits.maxStaff : '',
        maxStorageMB: plan.limits?.maxStorageMB !== undefined ? plan.limits.maxStorageMB : '',
        features: plan.features ? plan.features.join(', ') : '',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', monthlyPrice: '', yearlyPrice: '', maxStudents: '', maxStaff: '', maxStorageMB: '', features: '' });
    }
    setIsModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        name: formData.name,
        monthlyPrice: Number(formData.monthlyPrice),
        yearlyPrice: Number(formData.yearlyPrice),
        limits: {
          maxStudents: Number(formData.maxStudents),
          maxStaff: Number(formData.maxStaff),
          maxStorageMB: Number(formData.maxStorageMB),
        },
        // Convert comma-separated string to array, trimming whitespace
        features: formData.features.split(',').map(f => f.trim()).filter(f => f),
      };

      if (editingId) {
        await api.put(`/plans/${editingId}`, payload);
      } else {
        await api.post('/plans', payload);
      }
      
      setIsModalOpen(false);
      setRefreshTrigger((prev) => prev + 1); // Refresh the list
    } catch (err) {
      console.error('Error saving plan:', err);
      alert(err.response?.data?.message || 'Failed to save plan.');
    } finally {
      setSubmitLoading(false);
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
          <h1 className="text-3xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-slate-600 mt-1">Manage SaaS pricing tiers, limits, and feature gating.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          + Create New Plan
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow-sm font-medium">
          {error}
        </div>
      )}

      {/* Pricing Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length > 0 ? plans.map((plan) => (
          <div key={plan._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-900 uppercase tracking-wide">{plan.name}</h3>
                <button 
                  onClick={() => openModal(plan)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Edit
                </button>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-slate-900">₹{plan.monthlyPrice}</span>
                <span className="text-slate-500 font-medium">/mo</span>
                {plan.yearlyPrice && <div className="text-sm text-slate-500 mt-1">or ₹{plan.yearlyPrice}/year</div>}
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-900">Limits:</p>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li className="flex items-center">
                    <span className="w-4 h-4 mr-2 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px]">✓</span>
                    {plan.limits?.maxStudents === -1 ? 'Unlimited Students' : `Up to ${plan.limits?.maxStudents?.toLocaleString() || 0} Students`}
                  </li>
                  <li className="flex items-center">
                    <span className="w-4 h-4 mr-2 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px]">✓</span>
                    {plan.limits?.maxStaff === -1 ? 'Unlimited Staff' : `Up to ${plan.limits?.maxStaff?.toLocaleString() || 0} Staff`}
                  </li>
                  <li className="flex items-center">
                    <span className="w-4 h-4 mr-2 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px]">✓</span>
                    {plan.limits?.maxStorageMB === -1 ? 'Unlimited Storage' : (plan.limits?.maxStorageMB ? `${(plan.limits.maxStorageMB / 1024).toFixed(1)} GB Storage` : '0 GB Storage')}
                  </li>
                </ul>

                <p className="text-sm font-semibold text-slate-900 mt-4 pt-4 border-t border-slate-100">Premium Modules Included:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {plan.features && plan.features.length > 0 ? plan.features.map((feature, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold tracking-wide">
                      {feature}
                    </span>
                  )) : (
                    <span className="text-sm text-slate-500">Standard modules only</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500">No subscription plans created yet. Click "Create New Plan" to set up your tiers.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">{editingId ? 'Edit Plan' : 'Create Subscription Plan'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSavePlan} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. BASIC, PRO, ENTERPRISE" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Price (₹)</label>
                  <input type="number" name="monthlyPrice" required value={formData.monthlyPrice} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Yearly Price (₹)</label>
                  <input type="number" name="yearlyPrice" value={formData.yearlyPrice} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Students</label>
                  <input type="number" name="maxStudents" required value={formData.maxStudents} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="-1 for Unlim." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Staff</label>
                  <input type="number" name="maxStaff" required value={formData.maxStaff} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="-1 for Unlim." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Storage (MB)</label>
                  <input type="number" name="maxStorageMB" required value={formData.maxStorageMB} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="-1 for Unlim." />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Premium Features (Comma Separated)</label>
                <input type="text" name="features" value={formData.features} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="TRANSPORT, INVENTORY, PAYROLL" />
                <p className="text-xs text-slate-500 mt-1">Leave blank for basic features only. Use backend enum values.</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">{submitLoading ? 'Saving...' : 'Save Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}