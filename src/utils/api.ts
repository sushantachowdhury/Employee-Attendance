import { Employee, UserStatus } from '../types/attendance';

export const SEED_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    empId: 'EMP001',
    name: 'Amit Das',
    department: 'IT',
    office: 'Head Office, Kolkata',
    role: 'employee',
    status: 'active',
    phone: '+91 98301 23456',
    email: 'amit.das@example.com',
  },
  {
    id: 'emp-2',
    empId: 'EMP002',
    name: 'Riya Sen',
    department: 'HR',
    office: 'Head Office, Kolkata',
    role: 'employee',
    status: 'active',
    phone: '+91 98312 34567',
    email: 'riya.sen@example.com',
  },
  {
    id: 'emp-3',
    empId: 'EMP003',
    name: 'Sourav Roy',
    department: 'Accounts',
    office: 'Head Office, Kolkata',
    role: 'employee',
    status: 'active',
    phone: '+91 98323 45678',
    email: 'sourav.roy@example.com',
  },
  {
    id: 'emp-4',
    empId: 'EMP004',
    name: 'Priya Sharma',
    department: 'Marketing',
    office: 'Head Office, Kolkata',
    role: 'employee',
    status: 'inactive',
    phone: '+91 98334 56789',
    email: 'priya.sharma@example.com',
  },
  {
    id: 'emp-admin',
    empId: 'ADMIN01',
    name: 'Admin Supervisor',
    department: 'Operations',
    office: 'Head Office, Kolkata',
    role: 'admin',
    status: 'active',
    phone: '+91 98000 11223',
    email: 'admin@attendance.example.com',
  },
];

const LOCAL_STORAGE_KEY = 'geoface_employees_roster';

// Helper to safely parse API responses without throwing "Unexpected token <"
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const res = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          data: null,
          error: data?.error || `Request failed with status ${res.status}`,
        };
      }
      return { ok: true, status: res.status, data };
    }

    // Response is not JSON (e.g. HTML error, warmup page, or 502/404)
    const text = await res.text();
    let cleanMessage = `Server error (${res.status})`;
    if (text.includes('warmup') || text.includes('starts')) {
      cleanMessage = 'Server is currently warming up. Please retry in a few seconds.';
    } else if (res.status === 404) {
      cleanMessage = 'API endpoint not found (404).';
    } else if (res.status >= 500) {
      cleanMessage = 'Server temporary error (5xx).';
    } else if (text.length > 0 && text.length < 150 && !text.includes('<html')) {
      cleanMessage = text.trim();
    }

    return {
      ok: false,
      status: res.status,
      data: null,
      error: cleanMessage,
    };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { ok: false, status: 0, data: null, error: 'Connection timed out. Check your mobile network.' };
    }
    return { ok: false, status: 0, data: null, error: err.message || 'Network connection failed' };
  }
}

// Get employees with offline fallback
export function getLocalCachedEmployees(): Employee[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read from localStorage', e);
  }
  return SEED_EMPLOYEES;
}

export function saveLocalEmployees(list: Employee[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save to localStorage', e);
  }
}

// Robust employee fetching with local fallback
export async function fetchEmployeesRobust(): Promise<Employee[]> {
  const result = await safeFetchJson<Employee[]>('/api/employees');
  if (result.ok && Array.isArray(result.data) && result.data.length > 0) {
    saveLocalEmployees(result.data);
    return result.data;
  }

  // Network failed or returned HTML: fallback to localStorage cache or default seeds
  return getLocalCachedEmployees();
}

// Robust employee creation with offline resilience
export async function createEmployeeRobust(newEmpData: {
  empId: string;
  name: string;
  department: string;
  role?: 'employee' | 'admin' | 'hr';
  status: UserStatus;
  phone?: string;
  email?: string;
}): Promise<{ success: boolean; employee: Employee; error?: string; isOfflineSaved?: boolean }> {
  // Try sending to the backend server first
  const result = await safeFetchJson<{ success: boolean; employee: Employee }>('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newEmpData),
  });

  if (result.ok && result.data?.employee) {
    // Also update local storage cache
    const current = getLocalCachedEmployees();
    const filtered = current.filter((e) => e.empId.toUpperCase() !== newEmpData.empId.toUpperCase());
    const updated = [...filtered, result.data.employee];
    saveLocalEmployees(updated);
    return { success: true, employee: result.data.employee };
  }

  // If backend returned a clear validation error like "Employee ID already exists"
  if (result.status === 409 || (result.error && result.error.includes('already exists'))) {
    return {
      success: false,
      employee: null as any,
      error: result.error || 'Employee ID already exists. Please choose a different ID.',
    };
  }

  // If server is unreachable (offline / PWA without active connection / warmup):
  // Create locally in localStorage so the user is NOT blocked!
  const localEmp: Employee = {
    id: `emp-local-${Date.now()}`,
    empId: newEmpData.empId.toUpperCase(),
    name: newEmpData.name,
    department: newDeptOrFallback(newEmpData.department),
    office: 'Head Office, Kolkata',
    role: newEmpData.role || 'employee',
    status: newEmpData.status,
    phone: newEmpData.phone,
    email: newEmpData.email || `${newEmpData.empId.toLowerCase()}@example.com`,
  };

  const current = getLocalCachedEmployees();
  const existingIdx = current.findIndex((e) => e.empId.toUpperCase() === localEmp.empId.toUpperCase());
  if (existingIdx >= 0) {
    return {
      success: false,
      employee: null as any,
      error: `Employee with ID ${localEmp.empId} already exists in local roster.`,
    };
  }

  current.push(localEmp);
  saveLocalEmployees(current);

  return {
    success: true,
    employee: localEmp,
    isOfflineSaved: true,
  };
}

function newDeptOrFallback(dept: string): string {
  return dept && dept.trim() ? dept.trim() : 'IT';
}
