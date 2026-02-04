import { useState, useEffect } from 'react';
import { hospitalService, userService, requirementsService } from '../services/api';
import { formatDate } from '../utils/dateUtils';


const HospitalRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [arrangedRequirements, setArrangedRequirements] = useState<any[]>([]);
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDonorsModal, setShowDonorsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [newRequest, setNewRequest] = useState({
    bloodGroup: '',
    quantity: 1,
  });
  const [filters, setFilters] = useState({
    bloodGroup: '',
    available: 'true',
    minTrustScore: '50',
  });

  useEffect(() => {
    loadRequests();
    loadArrangedRequirements();
  }, []);

  useEffect(() => {
    if (filters.bloodGroup) {
      loadDonors();
    }
  }, [filters]);

  const loadRequests = async () => {
    try {
      const data = await hospitalService.getMyRequests();
      setRequests(data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArrangedRequirements = async () => {
    try {
      const data = await requirementsService.getAll();
      const arranged = (data || []).filter((req: any) => req.status === 'Arranged');
      setArrangedRequirements(arranged);
    } catch (error) {
      console.error('Failed to load arranged requirements:', error);
    }
  };

  const loadDonors = async () => {
    try {
      const data = await userService.getDonors(filters);
      setDonors(data || []);
    } catch (error) {
      console.error('Failed to load donors:', error);
    }
  };

  const handleCreateRequest = async () => {
    try {
      await hospitalService.createRequest({
        bloodGroup: newRequest.bloodGroup,
        quantity: newRequest.quantity,
        hospitalName: 'Generic Request',
        hospitalAddress: 'N/A',
        arrivalTime: new Date().toISOString()
      });
      setShowCreateModal(false);
      setNewRequest({ bloodGroup: '', quantity: 1 });
      await loadRequests();
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  const handleViewDonors = async (requestId: string) => {
    try {
      const data = await hospitalService.getEligibleDonors(requestId);
      setDonors(data || []);
      setSelectedRequest(requestId);
      setShowDonorsModal(true);
    } catch (error) {
      console.error('Failed to load eligible donors:', error);
    }
  };

  const handleAssignDonors = async (requestId: string, donorIds: string[]) => {
    try {
      await hospitalService.assignDonors(requestId, donorIds);
      setShowDonorsModal(false);
      await loadRequests();
    } catch (error) {
      console.error('Failed to assign donors:', error);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      await hospitalService.updateRequestStatus(requestId, status);
      await loadRequests();
    } catch (error) {
      console.error('Failed to update request status:', error);
    }
  };

  const getTimeSinceActive = (lastActive: string) => {
    if (!lastActive) return 'Unknown';
    const diff = Date.now() - new Date(lastActive).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Arranged Blood Requirements Section */}
      {arrangedRequirements.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 backdrop-blur-md rounded-3xl border border-emerald-700/50 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-emerald-700/50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-black text-emerald-300 uppercase tracking-widest">Arranged Blood Requirements</h2>
            </div>
            <span className="bg-emerald-700/30 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-600/30">
              {arrangedRequirements.length} Fulfilled
            </span>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {arrangedRequirements.map((req) => (
                <div key={req.id} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-emerald-700/30 p-5 hover:border-emerald-600/50 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-sm ring-2 ring-emerald-500/30">
                        {req.bloodGroup}
                      </span>
                      <div>
                        <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Arranged</p>
                        <p className="text-xs text-slate-500">#{req.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <span className="text-lg font-black text-emerald-400">{req.quantity} Units</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Patient Details</p>
                      <p className="text-sm font-bold text-white">{req.patientName || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{req.treatmentType || 'Emergency'}</p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contact</p>
                      <p className="text-xs font-mono text-slate-300">{req.contactNumber || 'No Contact'}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-700/50">
                      <p className="text-[10px] text-slate-500">Arranged {getTimeSinceActive(req.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">Hospital Requests</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 shadow-lg"
        >
          Create Request
        </button>
      </div>

      <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Filter Available Donors</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Blood Group</label>
            <select
              value={filters.bloodGroup}
              onChange={(e) => setFilters({ ...filters, bloodGroup: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Trust Score</label>
            <input
              type="number"
              value={filters.minTrustScore}
              onChange={(e) => setFilters({ ...filters, minTrustScore: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadDonors}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Search Donors
            </button>
          </div>
        </div>
        {filters.bloodGroup && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Found {donors.length} eligible donors</p>
          </div>
        )}
      </div>

      <div className="bg-white/95 backdrop-blur-sm shadow-xl rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">My Requests ({requests.length})</h2>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 bg-white/50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg text-indigo-800">
                    {request.hospitalName || 'Generic Request'}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">{request.hospitalAddress}</p>
                  <p className="font-semibold text-gray-800">
                    Blood Group: <span className="text-red-600">{request.bloodGroup}</span> | Units: <span className="text-red-600">{request.quantity}</span>
                  </p>
                  <p className="text-sm text-gray-600">Created: {formatDate(request.createdAt)}</p>
                  <p className="text-sm font-medium text-amber-600">
                    Arrival: {request.arrivalTime ? formatDate(request.arrivalTime) : 'Not specified'}
                  </p>
                  <p className="text-sm mt-1">
                    Status:{' '}
                    <span
                      className={`px-2 py-1 rounded ${request.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'ASSIGNED'
                          ? 'bg-blue-100 text-blue-800'
                          : request.status === 'CANCELLED'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {request.status}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-2">
                  {request.status === 'PENDING' && (
                    <button
                      onClick={() => handleViewDonors(request.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Donors
                    </button>
                  )}
                  {request.status === 'ASSIGNED' && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'COMPLETED')}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Mark Completed
                    </button>
                  )}
                  {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'CANCELLED')}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              {request.donationAttempts && request.donationAttempts.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Assigned Donors:</p>
                  <div className="space-y-2">
                    {request.donationAttempts.map((attempt: any) => (
                      <div key={attempt.id} className="bg-gray-50 p-2 rounded">
                        <p className="text-sm">
                          {attempt.user?.studentDetails?.name || attempt.user?.username} -{' '}
                          <span
                            className={`${attempt.status === 'SUCCESS'
                              ? 'text-green-600'
                              : attempt.status === 'FAILURE'
                                ? 'text-red-600'
                                : 'text-yellow-600'
                              }`}
                          >
                            {attempt.status}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-center py-4 text-gray-500">No requests yet</p>
          )}
        </div>
      </div>

      {/* Modals are kept inside the relative z-stack to appear above background */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Create Blood Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                <select
                  value={newRequest.bloodGroup}
                  onChange={(e) => setNewRequest({ ...newRequest, bloodGroup: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={newRequest.quantity}
                  onChange={(e) => setNewRequest({ ...newRequest, quantity: parseInt(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRequest({ bloodGroup: '', quantity: 1 });
                  }}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDonorsModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Eligible Donors</h3>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Trust Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Department
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {donors.map((donor) => (
                    <tr key={donor.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="rounded"
                          id={`donor-${donor.id}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {donor.studentDetails?.name || donor.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donor.trustScore}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donor.studentDetails?.phoneNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {donor.studentDetails?.department || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowDonorsModal(false);
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const selectedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                    .map((cb) => (cb as HTMLInputElement).id.replace('donor-', ''));
                  handleAssignDonors(selectedRequest, selectedIds);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Assign Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalRequests;
