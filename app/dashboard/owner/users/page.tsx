"use client";

import { useEffect, useState } from "react";
import { FaUserShield, FaPlus, FaUser, FaBuilding, FaSpinner, FaEdit, FaTrash } from "react-icons/fa";
import { useModal } from "@/components/ModalContext";
import { useBranch } from "@/lib/BranchContext";

export default function UsersPage() {
  const { showAlert, showConfirm } = useModal();
  const { availableBranches } = useBranch();
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [addForm, setAddForm] = useState({
    email: "",
    password: "",
    role: "receptionist",
    branch: "rospa",
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    email: "",
    password: "", // Optional
    role: "receptionist",
    branch: "rospa",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Error fetching users:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.email || !addForm.password) {
      showAlert("Error", "Please fill in all required fields.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addForm.email,
          password: addForm.password,
          role: addForm.role,
          branch: addForm.role === 'owner' ? null : addForm.branch
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Success", "User added successfully!", "success");
        setIsAddModalOpen(false);
        setAddForm({
          email: "",
          password: "",
          role: "receptionist",
          branch: "rospa",
        });
        fetchUsers();
      } else {
        showAlert("Error", data.error || "Failed to add user", "error");
      }
    } catch (e) {
      showAlert("Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id || !editForm.role) {
      showAlert("Error", "Missing required fields.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editForm.id,
          email: editForm.email,
          password: editForm.password || undefined,
          role: editForm.role,
          branch: (editForm.role === 'owner' || editForm.role === 'super_admin') ? null : editForm.branch
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAlert("Success", "User updated successfully!", "success");
        setIsEditModalOpen(false);
        fetchUsers();
      } else {
        showAlert("Error", data.error || "Failed to update user", "error");
      }
    } catch (e) {
      showAlert("Error", "Server connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    showConfirm(
      "Delete System User",
      `Are you sure you want to delete user "${userEmail}"? This will permanently remove their access and delete their account from the database.`,
      async () => {
        try {
          const res = await fetch(`/api/admin/users?id=${userId}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.success) {
            showAlert("Success", `User ${userEmail} deleted successfully!`, "success");
            fetchUsers();
          } else {
            showAlert("Error", data.error || "Failed to delete user", "error");
          }
        } catch (err: any) {
          showAlert("Error", err.message || "Failed to delete user", "error");
        }
      },
      "danger"
    );
  };

  return (
    <div className="min-h-screen bg-[#fff9eb] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#3a4a35] flex items-center gap-3">
              <FaUserShield className="text-[#c29957]" />
              System Users
            </h1>
            <p className="text-[#64745e] mt-2 max-w-2xl text-sm">
              Manage owners and receptionists who have access to the dashboard.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#3a4a35] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#2c3828] transition-colors flex items-center gap-2 shadow-sm"
          >
            <FaPlus className="text-sm" /> Add User
          </button>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e6dccb] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#fcfaf7] border-b border-[#e6dccb] text-[11px] uppercase tracking-wider text-[#c29957] font-bold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Branch</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6dccb]/50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#64745e]">
                      <FaSpinner className="animate-spin text-2xl mx-auto text-[#c29957] mb-2" />
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#64745e] italic">
                      No system users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#fff9eb]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#f3efe6] flex items-center justify-center text-[#c29957]">
                            <FaUser />
                          </div>
                          <span className="font-medium text-[#3a4a35]">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${
                          user.role === 'owner' ? 'bg-[#c29957]/10 text-[#c29957]' : 'bg-[#3a4a35]/10 text-[#3a4a35]'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#64745e]">
                        {user.branch ? (
                          <span className="flex items-center gap-1.5 capitalize">
                            <FaBuilding className="text-[#c29957]" /> {user.branch.toLowerCase().includes('salon') ? user.branch : `${user.branch} Salon`}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#64745e]">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditForm({
                                id: user.id,
                                email: user.email,
                                password: "",
                                role: user.role,
                                branch: user.branch || "rospa"
                              });
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 text-[#c29957] hover:bg-[#c29957]/10 rounded-lg transition-colors inline-flex items-center"
                            title="Edit User"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                            title="Delete User"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[#3a4a35]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[#e6dccb] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#e6dccb] bg-[#fcfaf7]">
              <h2 className="text-xl font-bold text-[#3a4a35]">Add System User</h2>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[#c29957] uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full bg-white border border-[#e6dccb] rounded-lg px-4 py-2.5 text-[#3a4a35] text-sm focus:outline-none focus:border-[#c29957] focus:ring-1 focus:ring-[#c29957]"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-[#c29957] uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full bg-white border border-[#e6dccb] rounded-lg px-4 py-2.5 text-[#3a4a35] text-sm focus:outline-none focus:border-[#c29957] focus:ring-1 focus:ring-[#c29957]"
                  placeholder="Enter secure password"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#c29957] uppercase tracking-wider mb-1.5">Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full bg-white border border-[#e6dccb] rounded-lg px-4 py-2.5 text-[#3a4a35] text-sm focus:outline-none focus:border-[#c29957]"
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              {addForm.role === 'receptionist' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#c29957] uppercase tracking-wider mb-1.5">Assigned Branch</label>
                  <select
                    required
                    value={addForm.branch}
                    onChange={(e) => setAddForm({ ...addForm, branch: e.target.value })}
                    className="w-full bg-white border border-[#e6dccb] rounded-lg px-4 py-2.5 text-[#3a4a35] text-sm focus:outline-none focus:border-[#c29957]"
                  >
                    {availableBranches.map(b => (
                      <option key={b.id} value={b.slug}>{b.name} Salon</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#64745e] mt-2">
                    The receptionist will only be able to view and manage bookings for this branch.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-[#e6dccb] text-[#3a4a35] rounded-lg font-medium hover:bg-[#f3efe6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#c29957] text-white rounded-lg font-medium hover:bg-[#b0894b] transition-colors disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#3a4a35]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-[#e6dccb] animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#e6dccb] bg-[#fcfaf7] flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#3a4a35]">Edit System User</h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  handleDeleteUser(editForm.id, editForm.email);
                }}
                disabled={saving}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium disabled:opacity-50"
                title="Delete User"
              >
                <FaTrash /> Delete
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[#c29957] uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full bg-white border border-[#e6dccb] rounded-lg px-4 py-2.5 text-[#3a4a35] text-sm focus:outline-none focus:border-[#c29957] focus:ring-1 focus:ring-[#c29957]"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-[#c29957] uppercase tracking-wider mb-1.5">New Password</label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full bg-white border border-[#e6dccb] rounded-lg px-4 py-2.5 text-[#3a4a35] text-sm focus:outline-none focus:border-[#c29957] focus:ring-1 focus:ring-[#c29957]"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#c29957] uppercase tracking-wider mb-1.5">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-white border border-[#e6dccb] rounded-lg px-4 py-2.5 text-[#3a4a35] text-sm focus:outline-none focus:border-[#c29957]"
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="owner">Owner</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {editForm.role === 'receptionist' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#c29957] uppercase tracking-wider mb-1.5">Assigned Branch</label>
                  <select
                    required
                    value={editForm.branch}
                    onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
                    className="w-full bg-white border border-[#e6dccb] rounded-lg px-4 py-2.5 text-[#3a4a35] text-sm focus:outline-none focus:border-[#c29957]"
                  >
                    {availableBranches.map(b => (
                      <option key={b.id} value={b.slug}>{b.name} Salon</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-[#e6dccb] text-[#3a4a35] rounded-lg font-medium hover:bg-[#f3efe6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-[#c29957] text-white rounded-lg font-medium hover:bg-[#b0894b] transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
