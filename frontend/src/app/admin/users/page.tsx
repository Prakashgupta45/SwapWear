'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../../../lib/api';
import { AdminUser, AdminPagination } from '../../../types/admin';
import { useAuth } from '../../../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Sparkles,
  Calendar,
  MapPin,
  Shirt,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspection & Role Modal states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (pageToLoad = 1) => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await api.getAdminUsers({
          page: pageToLoad,
          limit: 20,
          search: search.trim() || undefined,
          role: roleFilter,
        });

        if (res.success && res.data) {
          setUsers(res.data.users);
          setPagination(res.data.pagination);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load user accounts.');
      } finally {
        setIsLoading(false);
      }
    },
    [search, roleFilter]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleInspectUser = async (user: AdminUser) => {
    try {
      setSelectedUser(user);
      setInspectModalOpen(true);
      // Fetch full inspection data with closet items
      const res = await api.getAdminUserById(user.id);
      if (res.success && res.data?.user) {
        setSelectedUser(res.data.user);
      }
    } catch {
      // Keep basic user data on error
    }
  };

  const handleOpenRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setRoleModalOpen(true);
    setActionSuccess(null);
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser) return;
    const newRole = selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN';

    // Prevent accidental self-demotion
    if (selectedUser.id === currentUser?.id && newRole !== 'ADMIN') {
      alert('Security Protection: You cannot demote your own administrator account.');
      return;
    }

    try {
      setIsUpdatingRole(true);
      const res = await api.updateAdminUserRole(selectedUser.id, newRole);
      if (res.success) {
        setActionSuccess(`Role updated to ${newRole} for ${selectedUser.name}`);
        setRoleModalOpen(false);
        // Refresh list
        fetchUsers(pagination.page);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center">
            <Users className="h-6 w-6 mr-2 text-rose-400" />
            User Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory of registered community members, role permissions, and closet metrics.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls ───────────────────────────────────────── */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or city..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Roles</option>
            <option value="USER">Standard Users</option>
            <option value="ADMIN">Administrators</option>
          </select>

          <Button
            onClick={() => fetchUsers(1)}
            size="sm"
            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            Apply
          </Button>
        </div>
      </div>

      {/* ── Users Table ────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
            <p className="text-xs">Loading user records from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto" />
            <p className="text-xs">{error}</p>
            <Button onClick={() => fetchUsers(1)} variant="outline" size="sm" className="text-xs">
              Retry
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="h-8 w-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No users found</p>
            <p className="text-xs text-slate-500">Try adjusting your search criteria or role filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Closet / Activity</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isCurrentAdmin = u.id === currentUser?.id;
                  const joinedDate = new Date(u.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-rose-400">
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200">
                              {u.name}{' '}
                              {isCurrentAdmin && (
                                <span className="text-[10px] text-rose-400 font-normal">(You)</span>
                              )}
                            </p>
                            <p className="text-slate-400 font-mono text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {u.role === 'ADMIN' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/50">
                            <Sparkles className="h-3 w-3 mr-1" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            USER
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-300">
                        {u.city || u.state ? `${u.city || ''}, ${u.state || ''}` : '—'}
                      </td>

                      {/* Closet & Swap Counts */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
                          <span title="Listings in closet" className="flex items-center">
                            <Shirt className="h-3 w-3 mr-1 text-slate-500" />
                            {u._count.listings} items
                          </span>
                          <span>•</span>
                          <span title="Swap Requests sent/received" className="flex items-center">
                            <RefreshCw className="h-3 w-3 mr-1 text-slate-500" />
                            {u._count.sentSwapRequests + u._count.receivedSwapRequests} swaps
                          </span>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{joinedDate}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            onClick={() => handleInspectUser(u)}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Inspect
                          </Button>

                          <Button
                            onClick={() => handleOpenRoleModal(u)}
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Shield className="h-3.5 w-3.5 mr-1 text-rose-400" />
                            {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Bar ───────────────────────────────────────────────── */}
        {!isLoading && users.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {users.length} of {pagination.total} users (Page {pagination.page} of{' '}
              {pagination.totalPages})
            </span>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => fetchUsers(pagination.page - 1)}
                disabled={pagination.page <= 1}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={() => fetchUsers(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-slate-800 text-slate-300 hover:text-white disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Inspect User Modal ─────────────────────────────────────────────── */}
      {inspectModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-rose-400">
                  {selectedUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{selectedUser.name}</h3>
                  <p className="text-xs font-mono text-slate-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-0.5">Role Permission</span>
                <span className="font-bold text-rose-400">{selectedUser.role}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-0.5">User ID</span>
                <span className="font-mono text-slate-300 truncate block">{selectedUser.id}</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-0.5">Location</span>
                <span className="font-semibold text-slate-200">
                  {selectedUser.city || selectedUser.state
                    ? `${selectedUser.city || ''}, ${selectedUser.state || ''}`
                    : 'Not provided'}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block mb-0.5">Registered</span>
                <span className="font-mono text-slate-300">
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {selectedUser.bio && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                <span className="text-slate-400 block mb-1 font-semibold">Bio:</span>
                <p className="text-slate-300 italic">{selectedUser.bio}</p>
              </div>
            )}

            {/* Closet preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Recent Closet Items</span>
              {selectedUser.listings && selectedUser.listings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedUser.listings.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center space-x-2.5 text-xs"
                    >
                      {item.images?.[0]?.imageUrl ? (
                        <img
                          src={item.images[0].imageUrl}
                          alt={item.title}
                          className="h-10 w-10 object-cover rounded-lg bg-slate-800"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                          <Shirt className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-200 truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.status} • ${item.estimatedSwapValue || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No listings currently in closet.</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setInspectModalOpen(false)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Role Confirmation Modal ────────────────────────────────────────── */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-400">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold text-white">Privileged Role Modification</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to change the platform role for{' '}
              <span className="font-bold text-white">{selectedUser.name}</span> (
              <span className="font-mono text-slate-400">{selectedUser.email}</span>) from{' '}
              <span className="font-semibold text-rose-400">{selectedUser.role}</span> to{' '}
              <span className="font-semibold text-emerald-400">
                {selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN'}
              </span>
              ?
            </p>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-slate-200">Security Rule:</p>
              <p>Admin users have full access to platform analytics, user privileges, and listing moderation.</p>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                onClick={() => setRoleModalOpen(false)}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRoleChange}
                disabled={isUpdatingRole}
                size="sm"
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                {isUpdatingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                Confirm Role Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
