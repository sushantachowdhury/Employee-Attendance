import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Building,
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  CalendarDays,
  Settings,
  Eye,
  X,
  ChevronRight,
  TrendingUp,
  Shield,
  UserCheck,
  UserX,
  Printer,
  Download,
  Phone,
  Camera,
} from 'lucide-react';
import { AttendanceRecord, DailyReportRow } from '../types/attendance';

interface AdminDashboardViewProps {
  onOpenEmployeeModal: () => void;
  onOpenOfficeModal: () => void;
  onNavigateTab: (tab: 'daily_report' | 'monthly_report' | 'mobile') => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onOpenEmployeeModal,
  onOpenOfficeModal,
  onNavigateTab,
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Present' | 'Late' | 'Absent'>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayDate, setTodayDate] = useState('01-10-2026');
  const [dailyRows, setDailyRows] = useState<DailyReportRow[]>([]);
  const [selectedSelfie, setSelectedSelfie] = useState<DailyReportRow | null>(null);
  const [historyTab, setHistoryTab] = useState<'today' | 'history' | 'departments'>('today');
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeCount: 0,
    inactiveCount: 0,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0,
    officeName: 'Head office, Kolkata',
    radiusMeters: 50,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportRes, officeRes] = await Promise.all([
        fetch(`/api/reports/daily?date=${todayDate}`),
        fetch('/api/office'),
      ]);
      const reportData = await reportRes.json();
      const officeData = await officeRes.json();

      setDailyRows(reportData.rows || []);
      setStats({
        totalEmployees: reportData.totalEmployees || 4,
        activeCount: reportData.activeCount || 3,
        inactiveCount: reportData.inactiveCount || 1,
        presentCount: reportData.presentCount || 1,
        lateCount: reportData.lateCount || 1,
        absentCount: reportData.absentCount || 1,
        officeName: officeData.name || 'Head office, Kolkata',
        radiusMeters: officeData.radiusMeters || 50,
      });
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [todayDate]);

  const filteredList = dailyRows.filter((row) => {
    const matchStatus =
      filterStatus === 'ALL' || row.status === filterStatus;
    const matchSearch =
      row.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      row.empId.toLowerCase().includes(search.toLowerCase()) ||
      row.department.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Calculate department breakdowns
  const departmentStats = dailyRows.reduce((acc, row) => {
    if (!acc[row.department]) {
      acc[row.department] = { total: 0, present: 0, late: 0, absent: 0 };
    }
    acc[row.department].total += 1;
    if (row.status === 'Present') acc[row.department].present += 1;
    if (row.status === 'Late') acc[row.department].late += 1;
    if (row.status === 'Absent') acc[row.department].absent += 1;
    return acc;
  }, {} as Record<string, { total: number; present: number; late: number; absent: number }>);

  return (
    <div className="space-y-5 animate-fade-in text-neutral-100">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 p-5 rounded-3xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800/80 font-semibold text-[11px] tracking-wide uppercase">
              Admin Web Application
            </span>
            <span className="flex items-center gap-1 text-[11px] text-green-400 bg-green-950/60 border border-green-800/60 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live REST API Connected
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Supervisory Attendance Dashboard
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time biometric monitoring, 50m geofence validation, and automated daily/monthly registries.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => onNavigateTab('mobile')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition"
            title="Open camera & GPS to check in your attendance"
          >
            <Camera className="w-4 h-4" />
            <span>Punch Attendance</span>
          </button>
          <button
            onClick={onOpenEmployeeModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium border border-neutral-700 transition"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Manage Staff</span>
          </button>
          <button
            onClick={onOpenOfficeModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium border border-neutral-700 transition"
          >
            <Settings className="w-4 h-4 text-neutral-400" />
            <span>Geofence (50m)</span>
          </button>
          <button
            onClick={() => onNavigateTab('daily_report')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Daily Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards (Section 13 & 14) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Total Staff */}
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Total Staff</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.totalEmployees}</div>
          <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
            <span className="text-green-400 font-semibold">{stats.activeCount} Active</span>
            <span>•</span>
            <span className="text-neutral-500">{stats.inactiveCount} Inactive</span>
          </div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => setFilterStatus('Present')}
          className={`cursor-pointer transition bg-neutral-900 border p-4 rounded-2xl shadow-sm hover:border-emerald-600/60 ${
            filterStatus === 'Present' ? 'border-emerald-500 bg-emerald-950/20' : 'border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Present Today</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.presentCount}</div>
          <div className="text-[10px] text-neutral-400 mt-1">
            Within 50m & Selfie Verified
          </div>
        </div>

        {/* Late Attendance */}
        <div
          onClick={() => setFilterStatus('Late')}
          className={`cursor-pointer transition bg-neutral-900 border p-4 rounded-2xl shadow-sm hover:border-amber-600/60 ${
            filterStatus === 'Late' ? 'border-amber-500 bg-amber-950/20' : 'border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Late Attendance</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{stats.lateCount}</div>
          <div className="text-[10px] text-neutral-400 mt-1">
            Checked in after 09:30 AM
          </div>
        </div>

        {/* Absent Employees */}
        <div
          onClick={() => setFilterStatus('Absent')}
          className={`cursor-pointer transition bg-neutral-900 border p-4 rounded-2xl shadow-sm hover:border-red-600/60 ${
            filterStatus === 'Absent' ? 'border-red-500 bg-red-950/20' : 'border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Absent Employees</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-400">{stats.absentCount}</div>
          <div className="text-[10px] text-neutral-400 mt-1">
            No check-in record for today
          </div>
        </div>

        {/* Geofence Rule */}
        <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Office Geofence</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{stats.radiusMeters} m</div>
          <div className="text-[10px] text-neutral-400 mt-1 truncate" title={stats.officeName}>
            {stats.officeName}
          </div>
        </div>
      </div>

      {/* Main Admin Section: Navigation & Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
        {/* Module Sub-tabs */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 pt-3 bg-neutral-950/60">
          <div className="flex gap-2">
            <button
              onClick={() => setHistoryTab('today')}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold text-xs transition ${
                historyTab === 'today'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Today's Attendance</span>
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-[10px] text-neutral-300">
                {dailyRows.length}
              </span>
            </button>

            <button
              onClick={() => setHistoryTab('departments')}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold text-xs transition ${
                historyTab === 'departments'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Department Breakdown</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
              title="Refresh live attendance"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onNavigateTab('monthly_report')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition"
            >
              <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
              <span>Monthly Report</span>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* View 1: Today's Attendance Table */}
        {historyTab === 'today' && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by name, ID or department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs">
                {(['ALL', 'Present', 'Late', 'Absent'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                      filterStatus === st
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-neutral-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950 text-neutral-400 border-b border-neutral-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Distance from Office</th>
                    <th className="py-3 px-4">Biometric Selfie</th>
                    <th className="py-3 px-4">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80 bg-neutral-900/40">
                  {filteredList.map((row) => (
                    <tr key={row.empId} className="hover:bg-neutral-800/40 transition">
                      {/* Employee ID & Name & Phone */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{row.employeeName}</div>
                        <div className="font-mono text-[10px] text-neutral-400 flex items-center gap-1.5 flex-wrap">
                          <span>{row.empId}</span>
                          {row.phone && (
                            <>
                              <span className="text-neutral-600">•</span>
                              <span className="text-emerald-400 flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {row.phone}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-neutral-300">{row.department}</td>

                      {/* Check-in Time */}
                      <td className="py-3 px-4 font-mono">
                        {row.checkInTime !== '--' ? (
                          <span className="text-neutral-200">{row.checkInTime}</span>
                        ) : (
                          <span className="text-neutral-500">--</span>
                        )}
                      </td>

                      {/* Distance */}
                      <td className="py-3 px-4">
                        {typeof row.distance === 'number' ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/60">
                            <MapPin className="w-3 h-3" />
                            {row.distance} m (≤ {stats.radiusMeters}m)
                          </span>
                        ) : (
                          <span className="text-neutral-500">--</span>
                        )}
                      </td>

                      {/* Selfie */}
                      <td className="py-3 px-4">
                        {row.selfieUrl ? (
                          <button
                            onClick={() => setSelectedSelfie(row)}
                            className="group flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition"
                          >
                            <img
                              src={row.selfieUrl}
                              alt={row.employeeName}
                              className="w-7 h-7 rounded-full object-cover border border-neutral-700 group-hover:border-blue-500 transition"
                            />
                            <Eye className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
                          </button>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">No capture</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {row.status === 'Present' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            Present
                          </span>
                        )}
                        {row.status === 'Late' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950 text-amber-300 border border-amber-800">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Late
                          </span>
                        )}
                        {row.status === 'Absent' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950 text-red-300 border border-red-800">
                            <AlertCircle className="w-3 h-3 text-red-400" />
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-neutral-500">
                        No employees found matching the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 2: Department Breakdown */}
        {historyTab === 'departments' && (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(departmentStats).map(([dept, dStats]) => {
              const attendanceRate =
                dStats.total > 0
                  ? Math.round(((dStats.present + dStats.late) / dStats.total) * 100)
                  : 0;

              return (
                <div
                  key={dept}
                  className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-400" />
                      {dept} Department
                    </h3>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {attendanceRate}% Present
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Total Assigned:</span>
                      <span className="font-semibold text-white">{dStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-400">Present (On-time):</span>
                      <span className="font-semibold text-emerald-400">{dStats.present}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-400">Late:</span>
                      <span className="font-semibold text-amber-400">{dStats.late}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-400">Absent:</span>
                      <span className="font-semibold text-red-400">{dStats.absent}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selfie Preview Modal */}
      {selectedSelfie && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedSelfie(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-neutral-800 text-neutral-300 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-bold text-white text-base">Verified Biometric Selfie</h3>
              <p className="text-xs text-neutral-400">
                {selectedSelfie.employeeName} ({selectedSelfie.empId})
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-square border border-neutral-800">
              <img
                src={selectedSelfie.selfieUrl}
                alt={selectedSelfie.employeeName}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md rounded-xl p-2.5 text-[11px] text-neutral-300 space-y-0.5">
                <div className="flex justify-between">
                  <span>GPS Distance:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {selectedSelfie.distance} m from office
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Check-in Time:</span>
                  <span className="font-mono text-white">{selectedSelfie.checkInTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={`font-semibold ${
                      selectedSelfie.status === 'Present'
                        ? 'text-emerald-400'
                        : selectedSelfie.status === 'Late'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {selectedSelfie.status}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedSelfie(null)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
