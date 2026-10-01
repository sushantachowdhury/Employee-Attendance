import React, { useState, useEffect } from 'react';
import { MonthlyReportRow } from '../types/attendance';
import {
  CalendarDays,
  Download,
  Search,
  Printer,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const MonthlyReportView: React.FC = () => {
  const [rows, setRows] = useState<MonthlyReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('Oct 2026');
  const [search, setSearch] = useState('');

  const fetchMonthlyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${encodeURIComponent(selectedMonth)}`);
      const data = await res.json();
      setRows(data.rows || []);
    } catch (e) {
      console.error('Failed to load monthly report', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
  }, [selectedMonth]);

  const filteredRows = rows.filter((r) => {
    return (
      r.empId.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
    );
  });

  const exportCSV = () => {
    const headers = [
      'Employee ID,Employee Name,Department,Month,Working Days,Present,Late,Absent,Attendance %',
    ];
    const csvRows = rows.map(
      (r) =>
        `"${r.empId}","${r.employeeName}","${r.department}","${r.month}","${r.workingDays}","${r.present}","${r.late}","${r.absent}","${r.attendancePercentage}"`
    );
    const blob = new Blob([[...headers, ...csvRows].join('\n')], {
      type: 'text/csv',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Monthly_Report_${selectedMonth.replace(' ', '_')}.csv`;
    a.click();
  };

  // Average company attendance rate
  const avgAttendance =
    rows.length > 0
      ? (
          rows.reduce((acc, r) => acc + parseFloat(r.attendancePercentage || '0'), 0) /
          rows.length
        ).toFixed(1) + '%'
      : '0%';

  return (
    <div className="space-y-4">
      {/* Header and Controls matching Document 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-400" />
            Monthly Report
          </h2>
          <p className="text-xs text-neutral-400">
            Monthly aggregate attendance calculation (<span className="text-blue-300 font-mono italic">Attendance % = Present / Working Days</span>)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchMonthlyReport}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <p className="text-[11px] text-neutral-400 font-medium">Selected Month</p>
          <p className="text-xl font-bold text-white mt-0.5">{selectedMonth}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3">
          <p className="text-[11px] text-neutral-400 font-medium">Working Days</p>
          <p className="text-xl font-bold text-white mt-0.5">26 Days</p>
        </div>
        <div className="bg-neutral-900 border border-green-900/40 rounded-xl p-3">
          <p className="text-[11px] text-green-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Avg. Attendance
          </p>
          <p className="text-xl font-bold text-green-300 mt-0.5">{avgAttendance}</p>
        </div>
        <div className="bg-neutral-900 border border-blue-900/40 rounded-xl p-3">
          <p className="text-[11px] text-blue-400 font-medium flex items-center gap-1">
            <Percent className="w-3 h-3" />
            Formula Standard
          </p>
          <p className="text-xs font-mono text-blue-200 mt-1">
            Present / 26 * 100
          </p>
        </div>
      </div>

      {/* Filter and Month Picker */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee ID, name, department..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-neutral-400 whitespace-nowrap">
            Month:
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
          >
            <option value="Oct 2026">Oct 2026 (Document 4)</option>
            <option value="Nov 2026">Nov 2026</option>
            <option value="Dec 2026">Dec 2026</option>
          </select>
        </div>
      </div>

      {/* Exact Table Matching User Document 4 */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#185FA5] text-white font-semibold">
                <th className="py-3 px-3.5 border-b border-blue-700">Employee ID</th>
                <th className="py-3 px-3.5 border-b border-blue-700">Employee Name</th>
                <th className="py-3 px-3.5 border-b border-blue-700">Department</th>
                <th className="py-3 px-3.5 border-b border-blue-700">Month</th>
                <th className="py-3 px-3.5 border-b border-blue-700 text-center">Working Days</th>
                <th className="py-3 px-3.5 border-b border-blue-700 text-center">Present</th>
                <th className="py-3 px-3.5 border-b border-blue-700 text-center">Late</th>
                <th className="py-3 px-3.5 border-b border-blue-700 text-center">Absent</th>
                <th className="py-3 px-3.5 border-b border-blue-700 text-right">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-neutral-400">
                    No monthly records found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.empId}
                    className="hover:bg-neutral-850/80 transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono font-medium text-white">
                      {row.empId}
                    </td>
                    <td className="py-3 px-3.5 font-medium text-neutral-200">
                      {row.employeeName}
                    </td>
                    <td className="py-3 px-3.5 text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[11px]">
                        {row.department}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-neutral-300 font-mono">
                      {row.month}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono text-neutral-300 font-medium">
                      {row.workingDays}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono text-green-400 font-semibold">
                      {row.present}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono text-amber-400 font-medium">
                      {row.late}
                    </td>
                    <td className="py-3 px-3.5 text-center font-mono text-red-400 font-medium">
                      {row.absent}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-white text-sm">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-lg ${
                          parseFloat(row.attendancePercentage) >= 90
                            ? 'bg-green-950/80 text-green-300 border border-green-800'
                            : parseFloat(row.attendancePercentage) >= 80
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {row.attendancePercentage}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer formula note from Document 4 page 1 */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 text-[11px] text-neutral-400 italic">
          * Attendance % = Present / Working Days.
        </div>
      </div>
    </div>
  );
};
