import React, { useState, useEffect } from 'react';
import { DailyReportRow } from '../types/attendance';
import {
  Download,
  Search,
  Filter,
  Eye,
  X,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  UserX,
  MapPin,
  RefreshCw,
  Printer,
  Phone,
} from 'lucide-react';

export const DailyReportView: React.FC = () => {
  const [rows, setRows] = useState<DailyReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [selectedSelfie, setSelectedSelfie] = useState<DailyReportRow | null>(null);
  const [currentDate, setCurrentDate] = useState('01-10-2026');
  const [summaryStats, setSummaryStats] = useState({
    totalEmployees: 0,
    activeCount: 0,
    inactiveCount: 0,
  });

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/daily?date=${currentDate}`);
      const data = await res.json();
      setRows(data.rows || []);
      setSummaryStats({
        totalEmployees: data.totalEmployees || (data.rows ? data.rows.length : 0),
        activeCount: data.activeCount || (data.rows ? data.rows.filter((r: any) => r.employeeStatus !== 'inactive').length : 0),
        inactiveCount: data.inactiveCount || (data.rows ? data.rows.filter((r: any) => r.employeeStatus === 'inactive').length : 0),
      });
    } catch (e) {
      console.error('Failed to load daily report', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, [currentDate]);

  const filteredRows = rows.filter((r) => {
    const matchSearch =
      r.empId.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase());
    const matchDept =
      departmentFilter === 'ALL' || r.department === departmentFilter;
    const matchStatus =
      userStatusFilter === 'ALL' ||
      (userStatusFilter === 'active' && r.employeeStatus !== 'inactive') ||
      (userStatusFilter === 'inactive' && r.employeeStatus === 'inactive');
    return matchSearch && matchDept && matchStatus;
  });

  const presentCount = rows.filter((r) => r.status === 'Present').length;
  const lateCount = rows.filter((r) => r.status === 'Late').length;
  const absentCount = rows.filter((r) => r.status === 'Absent').length;

  const exportCSV = () => {
    const headers = [
      'Employee ID,Employee Name,Phone Number,User Status,Department,Office,Date,Check-in Time,Distance (m),Attendance Status',
    ];
    const csvRows = rows.map(
      (r) =>
        `"${r.empId}","${r.employeeName}","${r.phone || ''}","${r.employeeStatus || 'active'}","${r.department}","${r.office}","${r.date}","${r.checkInTime}","${r.distance}","${r.status}"`
    );
    const blob = new Blob([[...headers, ...csvRows].join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily_Report_${currentDate}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls matching Document 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
            Daily Report
          </h2>
          <p className="text-xs text-neutral-400">
            Official staff attendance registry based on 50m geofence & selfie verification
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchDailyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards (Total Employees, Active Users, Inactive Users, Present, Late, Absent) */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <p className="text-[10px] text-neutral-400 font-medium">Total Staff</p>
          <p className="text-lg font-bold text-white mt-0.5">{summaryStats.totalEmployees || rows.length}</p>
        </div>
        <div className="bg-neutral-900 border border-green-900/40 rounded-xl p-3">
          <p className="text-[10px] text-green-400 font-medium">Active Users</p>
          <p className="text-lg font-bold text-green-300 mt-0.5">{summaryStats.activeCount}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <p className="text-[10px] text-neutral-400 font-medium">Inactive Users</p>
          <p className="text-lg font-bold text-neutral-300 mt-0.5">{summaryStats.inactiveCount}</p>
        </div>
        <div className="bg-neutral-900 border border-green-900/40 rounded-xl p-3">
          <p className="text-[10px] text-green-400 font-medium flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> Present
          </p>
          <p className="text-lg font-bold text-green-300 mt-0.5">{presentCount}</p>
        </div>
        <div className="bg-neutral-900 border border-amber-900/40 rounded-xl p-3">
          <p className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Late
          </p>
          <p className="text-lg font-bold text-amber-300 mt-0.5">{lateCount}</p>
        </div>
        <div className="bg-neutral-900 border border-red-900/40 rounded-xl p-3">
          <p className="text-[10px] text-red-400 font-medium flex items-center gap-1">
            <UserX className="w-2.5 h-2.5" /> Absent
          </p>
          <p className="text-lg font-bold text-red-300 mt-0.5">{absentCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee ID, name, or department..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Active vs Inactive Filter */}
          <select
            value={userStatusFilter}
            onChange={(e) => setUserStatusFilter(e.target.value as any)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white text-xs outline-none cursor-pointer"
          >
            <option value="ALL">All Accounts</option>
            <option value="active">Active Users Only</option>
            <option value="inactive">Inactive Users Only</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-transparent text-white text-xs outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-neutral-900">All Depts</option>
              <option value="IT" className="bg-neutral-900">IT</option>
              <option value="HR" className="bg-neutral-900">HR</option>
              <option value="Accounts" className="bg-neutral-900">Accounts</option>
              <option value="Marketing" className="bg-neutral-900">Marketing</option>
            </select>
          </div>

          <input
            type="text"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            title="Date (DD-MM-YYYY)"
            className="w-28 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
          />
        </div>
      </div>

      {/* Exact Table Matching User Document 2 */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#185FA5] text-white font-semibold">
                <th className="py-3 px-3.5 border-b border-blue-700">Employee ID</th>
                <th className="py-3 px-3.5 border-b border-blue-700">Employee Name</th>
                <th className="py-3 px-3.5 border-b border-blue-700">User Status</th>
                <th className="py-3 px-3.5 border-b border-blue-700">Department</th>
                <th className="py-3 px-3.5 border-b border-blue-700">Office</th>
                <th className="py-3 px-3.5 border-b border-blue-700">Date</th>
                <th className="py-3 px-3.5 border-b border-blue-700">Check-in Time</th>
                <th className="py-3 px-3.5 border-b border-blue-700 text-center">Distance (m)</th>
                <th className="py-3 px-3.5 border-b border-blue-700 text-center">Selfie</th>
                <th className="py-3 px-3.5 border-b border-blue-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-neutral-400">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.empId}
                    className={`hover:bg-neutral-850/80 transition-colors ${
                      row.employeeStatus === 'inactive' ? 'opacity-70 bg-neutral-950/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3.5 font-mono font-medium text-white">
                      {row.empId}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-neutral-200">
                      <div>{row.employeeName}</div>
                      {row.phone && (
                        <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{row.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      {row.employeeStatus === 'inactive' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                          Inactive User
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-950 text-green-300 border border-green-800">
                          Active User
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[11px]">
                        {row.department}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-neutral-300">{row.office}</td>
                    <td className="py-3 px-3.5 text-neutral-400 font-mono">
                      {row.date}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-neutral-200 font-medium">
                      {row.checkInTime}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono">
                      {typeof row.distance === 'number' ? (
                        <span
                          className={`font-semibold ${
                            row.distance <= 50 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {row.distance}
                        </span>
                      ) : (
                        <span className="text-neutral-500">--</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {row.selfieUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedSelfie(row)}
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline font-medium"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      ) : (
                        <span className="text-neutral-500">--</span>
                      )}
                    </td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          row.status === 'Present'
                            ? 'bg-green-950 text-green-300 border border-green-800'
                            : row.status === 'Late'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selfie Preview Modal */}
      {selectedSelfie && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-700 rounded-3xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Biometric Attendance Selfie
                </h3>
                <p className="text-xs text-neutral-400">
                  {selectedSelfie.employeeName} ({selectedSelfie.empId})
                </p>
              </div>
              <button
                onClick={() => setSelectedSelfie(null)}
                className="w-7 h-7 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-square border border-neutral-700 bg-neutral-950 mb-3 shadow-inner">
              <img
                src={selectedSelfie.selfieUrl}
                alt="Selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md rounded-xl p-2 text-[11px] text-white flex justify-between items-center border border-white/10">
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified Inside Geofence
                </span>
                <span className="font-mono text-neutral-300">
                  {selectedSelfie.distance} m away
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-800/60 p-3 rounded-xl border border-neutral-700/60 mb-3">
              <div>
                <p className="text-neutral-400 text-[10px]">Time Logged</p>
                <p className="font-semibold text-white">
                  {selectedSelfie.checkInTime}
                </p>
              </div>
              <div>
                <p className="text-neutral-400 text-[10px]">Department</p>
                <p className="font-semibold text-white">
                  {selectedSelfie.department}
                </p>
              </div>
              <div>
                <p className="text-neutral-400 text-[10px]">Office</p>
                <p className="font-semibold text-white">{selectedSelfie.office}</p>
              </div>
              <div>
                <p className="text-neutral-400 text-[10px]">Status</p>
                <p
                  className={`font-semibold ${
                    selectedSelfie.status === 'Present'
                      ? 'text-green-400'
                      : 'text-amber-400'
                  }`}
                >
                  {selectedSelfie.status}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedSelfie(null)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
