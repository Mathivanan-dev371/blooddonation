import { useState, useEffect } from 'react';
import { hospitalService, userService } from '../services/api';
import { formatDate } from '../utils/dateUtils';

const HospitalRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
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
        hospitalName: 'Generic Request', // Placeholder for modal creation
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

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Hospital Requests</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Create Request
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
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

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">My Requests ({requests.length})</h2>
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4">
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
