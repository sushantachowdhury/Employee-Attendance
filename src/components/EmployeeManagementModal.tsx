import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Plus,
  Check,
  Shield,
  Briefcase,
  Mail,
  Phone,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Employee, UserStatus } from '../types/attendance';

interface EmployeeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmployeeUpdated?: () => void;
}

export const EmployeeManagementModal: React.FC<EmployeeManagementModalProps> = ({
  isOpen,
  onClose,
  onEmployeeUpdated,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  // New Employee Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmpId, setNewEmpId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('IT');
  const [newPhone, setNewPhone] = useState('');
  const [newStatus, setNewStatus] = useState<UserStatus>('active');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data);
    } catch (e) {
      console.error('Failed to load employees', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const handleToggleStatus = async (empId: string, currentStatus: UserStatus) => {
    const nextStatus: UserStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/employees/${empId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setEmployees((prev) =>
          prev.map((e) => (e.empId === empId ? { ...e, status: nextStatus } : e))
        );
        if (onEmployeeUpdated) onEmployeeUpdated();
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empId: newEmpId.toUpperCase().trim(),
          name: newName.trim(),
          department: newDept,
          phone: newPhone.trim() || undefined,
          role: 'employee',
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add employee');
      }

      setEmployees((prev) => [...prev, data.employee]);
      setNewEmpId('');
      setNewName('');
      setNewPhone('');
      setShowAddForm(false);
      if (onEmployeeUpdated) onEmployeeUpdated();
    } catch (err: any) {
      setAddError(err.message || 'Error creating employee');
    } finally {
      setAddLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalEmployees = employees.filter((e) => e.role !== 'admin').length;
  const activeUsers = employees.filter((e) => e.role !== 'admin' && e.status === 'active').length;
  const inactiveUsers = employees.filter((e) => e.role !== 'admin' && e.status === 'inactive').length;

  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.empId.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'ALL' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="w-full max-w-3xl bg-neutral-900 border border-neutral-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Employee Management (Active vs Inactive Users)
              </h2>
              <p className="text-xs text-neutral-400">
                Manage staff accounts, attendance permissions, and active/inactive roster status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-neutral-900/60 border-b border-neutral-800 text-xs">
          <div className="bg-neutral-850 border border-neutral-800 rounded-xl p-3 text-center">
            <p className="text-neutral-400 font-medium">Total Staff</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalEmployees}</p>
          </div>
          <div className="bg-neutral-850 border border-green-900/40 rounded-xl p-3 text-center">
            <p className="text-green-400 font-medium flex items-center justify-center gap-1">
              <UserCheck className="w-3.5 h-3.5" />
              Active Users
            </p>
            <p className="text-xl font-bold text-green-300 mt-0.5">{activeUsers}</p>
          </div>
          <div className="bg-neutral-850 border border-neutral-700/60 rounded-xl p-3 text-center">
            <p className="text-neutral-400 font-medium flex items-center justify-center gap-1">
              <UserX className="w-3.5 h-3.5 text-neutral-400" />
              Inactive Users
            </p>
            <p className="text-xl font-bold text-neutral-300 mt-0.5">{inactiveUsers}</p>
          </div>
        </div>

        {/* Controls: Search, Filter, Add Employee */}
        <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Employee ID, Name, or Department..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-2 pl-9 pr-3 text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-white outline-none cursor-pointer text-xs"
            >
              <option value="ALL">All Statuses ({totalEmployees})</option>
              <option value="active">Active Only ({activeUsers})</option>
              <option value="inactive">Inactive Only ({inactiveUsers})</option>
            </select>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition active:scale-95 text-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Staff
            </button>
          </div>
        </div>

        {/* Add Employee Form Drawer */}
        {showAddForm && (
          <form
            onSubmit={handleAddEmployee}
            className="p-4 bg-neutral-950 border-b border-neutral-800 text-xs space-y-3 animate-fade-in"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                Add New Staff Member
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-2 bg-red-950/70 border border-red-800 text-red-300 rounded-lg text-xs">
                {addError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Employee ID (e.g. EMP005)"
                value={newEmpId}
                onChange={(e) => setNewEmpId(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white outline-none text-xs"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white outline-none text-xs"
                required
              />
              <input
                type="tel"
                placeholder="Mobile (+91 98000 12345)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white outline-none text-xs"
              />
              <select
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white outline-none text-xs"
              >
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Accounts">Accounts</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
              </select>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as UserStatus)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white outline-none text-xs"
              >
                <option value="active">Active (Can Check In)</option>
                <option value="inactive">Inactive (Blocked)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addLoading}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition disabled:opacity-50"
              >
                {addLoading ? 'Saving...' : 'Create Employee'}
              </button>
            </div>
          </form>
        )}

        {/* Employee Table */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-850 text-neutral-300 font-semibold border-b border-neutral-700">
                  <th className="py-2.5 px-3">Emp ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Mobile / Phone</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-400">
                      No employees found matching the filter.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp.empId}
                      className={`hover:bg-neutral-800/40 transition-colors ${
                        emp.status === 'inactive' ? 'opacity-70 bg-neutral-950/40' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono font-medium text-white">
                        {emp.empId}
                      </td>
                      <td className="py-3 px-3 font-medium text-neutral-200">
                        {emp.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {emp.phone ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-500" />
                            {emp.phone}
                          </span>
                        ) : (
                          <span className="text-neutral-500">--</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-neutral-400">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[11px]">
                          {emp.department}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-neutral-400 capitalize">
                        {emp.role}
                      </td>
                      <td className="py-3 px-3">
                        {emp.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-green-950 text-green-300 border border-green-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            Active User
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                            Inactive User
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {emp.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(emp.empId, emp.status)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ml-auto ${
                              emp.status === 'active'
                                ? 'bg-neutral-800 hover:bg-red-950/60 text-neutral-300 hover:text-red-300 border border-neutral-700'
                                : 'bg-green-950/60 hover:bg-green-900/60 text-green-300 border border-green-800'
                            }`}
                            title={
                              emp.status === 'active'
                                ? 'Deactivate employee (Block attendance)'
                                : 'Activate employee (Enable attendance)'
                            }
                          >
                            {emp.status === 'active' ? (
                              <>
                                <UserX className="w-3.5 h-3.5 text-neutral-400" />
                                <span>Set Inactive</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 text-green-400" />
                                <span>Set Active</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800 flex justify-between items-center text-xs">
          <span className="text-neutral-400">
            Active users can sign in & clock attendance • Inactive users are locked out
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
