export type AttendanceStatus = 'Present' | 'Late' | 'Absent';
export type UserStatus = 'active' | 'inactive';

export interface Employee {
  id: string;
  empId: string;
  name: string;
  department: string;
  office: string;
  role: 'employee' | 'admin' | 'hr';
  status: UserStatus; // 'active' | 'inactive'
  email?: string;
  phone?: string;
  avatarUrl?: string;
  lastActive?: string;
}

export interface OfficeConfig {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // typically 50m
  lateThreshold: string; // e.g. "09:30"
  workDaysPerMonth: number;
}

export interface AttendanceRecord {
  id: string;
  empId: string;
  employeeName: string;
  department: string;
  office: string;
  phone?: string;
  date: string; // "DD-MM-YYYY" or "YYYY-MM-DD"
  checkInTime: string; // e.g. "09:42 AM"
  distanceMeters: number; // e.g. 32
  selfieUrl: string; // base64 or image URL
  status: AttendanceStatus;
  latitude: number;
  longitude: number;
  verifiedAt: string;
}

export interface DailyReportRow {
  empId: string;
  employeeName: string;
  department: string;
  office: string;
  phone?: string;
  date: string;
  checkInTime: string;
  distance: number | string;
  selfieUrl?: string;
  status: AttendanceStatus;
  employeeStatus: UserStatus;
}

export interface MonthlyReportRow {
  empId: string;
  employeeName: string;
  department: string;
  phone?: string;
  month: string; // e.g. "Oct 2026"
  workingDays: number;
  present: number;
  late: number;
  absent: number;
  attendancePercentage: string; // e.g. "92.3%"
  employeeStatus: UserStatus;
}

export interface AuthUser {
  empId: string;
  name: string;
  department: string;
  office: string;
  phone?: string;
  email?: string;
  role: 'employee' | 'admin' | 'hr';
  status: UserStatus;
  token: string;
}

