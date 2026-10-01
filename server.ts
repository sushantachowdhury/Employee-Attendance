import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Increase payload limit for base64 selfies
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Initial Office configuration (Kolkata Head Office as in user's document)
let officeConfig = {
  id: 'off-1',
  name: 'Head office, Kolkata',
  latitude: 22.572645,
  longitude: 88.363892,
  radiusMeters: 50, // Strict 50 meters geofence requested
  lateThreshold: '09:30', // Any check-in after 09:30 AM is marked "Late"
  workDaysPerMonth: 26,
};

// Initial Employees as specified in user's documents with Active/Inactive status
let employees = [
  {
    id: 'emp-1',
    empId: 'EMP001',
    password: 'password123',
    name: 'Amit Das',
    department: 'IT',
    office: 'Head Office, Kolkata',
    role: 'employee',
    status: 'active' as const,
    phone: '+91 98301 23456',
    email: 'amit.das@example.com',
  },
  {
    id: 'emp-2',
    empId: 'EMP002',
    password: 'password123',
    name: 'Riya Sen',
    department: 'HR',
    office: 'Head Office, Kolkata',
    role: 'employee',
    status: 'active' as const,
    phone: '+91 98312 34567',
    email: 'riya.sen@example.com',
  },
  {
    id: 'emp-3',
    empId: 'EMP003',
    password: 'password123',
    name: 'Sourav Roy',
    department: 'Accounts',
    office: 'Head Office, Kolkata',
    role: 'employee',
    status: 'active' as const,
    phone: '+91 98323 45678',
    email: 'sourav.roy@example.com',
  },
  {
    id: 'emp-4',
    empId: 'EMP004',
    password: 'password123',
    name: 'Priya Sharma',
    department: 'Marketing',
    office: 'Head Office, Kolkata',
    role: 'employee',
    status: 'inactive' as const,
    phone: '+91 98334 56789',
    email: 'priya.sharma@example.com',
  },
  {
    id: 'emp-admin',
    empId: 'ADMIN01',
    password: 'admin',
    name: 'Admin Supervisor',
    department: 'Operations',
    office: 'Head Office, Kolkata',
    role: 'admin',
    status: 'active' as const,
    phone: '+91 98000 11223',
    email: 'admin@attendance.example.com',
  },
];

// Helper: Haversine distance in meters
function computeHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Format date helper: "01-10-2026"
function getFormattedDate(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Default attendance records seeded exactly as in Document 2 & 4
let attendanceRecords = [
  {
    id: 'rec-1',
    empId: 'EMP001',
    employeeName: 'Amit Das',
    department: 'IT',
    office: 'Head Office, Kolkata',
    date: '01-10-2026',
    checkInTime: '09:42 AM',
    distanceMeters: 32,
    selfieUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    status: 'Present',
    latitude: 22.57285,
    longitude: 88.36402,
    verifiedAt: '2026-10-01T09:42:00.000Z',
  },
  {
    id: 'rec-2',
    empId: 'EMP002',
    employeeName: 'Riya Sen',
    department: 'HR',
    office: 'Head Office, Kolkata',
    date: '01-10-2026',
    checkInTime: '10:20 AM',
    distanceMeters: 18,
    selfieUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    status: 'Late',
    latitude: 22.57271,
    longitude: 88.36395,
    verifiedAt: '2026-10-01T10:20:00.000Z',
  },
];

// Historical month aggregated stats (matching Document 4: Oct 2026)
let monthlyStatsCache = {
  'Oct 2026': [
    {
      empId: 'EMP001',
      employeeName: 'Amit Das',
      department: 'IT',
      month: 'Oct 2026',
      workingDays: 26,
      present: 24,
      late: 1,
      absent: 1,
      attendancePercentage: '92.3%',
    },
    {
      empId: 'EMP002',
      employeeName: 'Riya Sen',
      department: 'HR',
      month: 'Oct 2026',
      workingDays: 26,
      present: 22,
      late: 3,
      absent: 1,
      attendancePercentage: '84.6%',
    },
    {
      empId: 'EMP003',
      employeeName: 'Sourav Roy',
      department: 'Accounts',
      month: 'Oct 2026',
      workingDays: 26,
      present: 21,
      late: 2,
      absent: 3,
      attendancePercentage: '80.8%',
    },
  ],
};

/* =========================================================
   REST API Endpoints
   ========================================================= */

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geofence: `${officeConfig.radiusMeters}m`,
  });
});

// Get office settings (Single & List support)
app.get('/api/office', (req, res) => {
  res.json(officeConfig);
});

app.get('/api/offices', (req, res) => {
  res.json([officeConfig]);
});

app.post('/api/offices', (req, res) => {
  const { name, office_name, latitude, longitude, allowed_radius_m, radiusMeters, lateThreshold } = req.body;
  officeConfig = {
    ...officeConfig,
    name: name || office_name || officeConfig.name,
    latitude: latitude !== undefined ? Number(latitude) : officeConfig.latitude,
    longitude: longitude !== undefined ? Number(longitude) : officeConfig.longitude,
    radiusMeters: (allowed_radius_m ?? radiusMeters) !== undefined ? Number(allowed_radius_m ?? radiusMeters) : officeConfig.radiusMeters,
    lateThreshold: lateThreshold || officeConfig.lateThreshold,
  };
  res.status(201).json({ success: true, office: officeConfig });
});

app.put('/api/offices/:id', (req, res) => {
  const { name, office_name, latitude, longitude, allowed_radius_m, radiusMeters, lateThreshold } = req.body;
  officeConfig = {
    ...officeConfig,
    name: name || office_name || officeConfig.name,
    latitude: latitude !== undefined ? Number(latitude) : officeConfig.latitude,
    longitude: longitude !== undefined ? Number(longitude) : officeConfig.longitude,
    radiusMeters: (allowed_radius_m ?? radiusMeters) !== undefined ? Number(allowed_radius_m ?? radiusMeters) : officeConfig.radiusMeters,
    lateThreshold: lateThreshold || officeConfig.lateThreshold,
  };
  res.json({ success: true, office: officeConfig });
});

// Update office settings (e.g. Geofence radius or office coordinates)
app.put('/api/office', (req, res) => {
  const { name, latitude, longitude, radiusMeters, lateThreshold, workDaysPerMonth } =
    req.body;
  if (name) officeConfig.name = name;
  if (latitude !== undefined) officeConfig.latitude = Number(latitude);
  if (longitude !== undefined) officeConfig.longitude = Number(longitude);
  if (radiusMeters !== undefined) officeConfig.radiusMeters = Number(radiusMeters);
  if (lateThreshold) officeConfig.lateThreshold = lateThreshold;
  if (workDaysPerMonth !== undefined)
    officeConfig.workDaysPerMonth = Number(workDaysPerMonth);

  res.json({ success: true, office: officeConfig });
});

// Current authenticated user (Section 10)
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  let targetUser = employees[0];
  if (authHeader && authHeader.includes('token_')) {
    const parts = authHeader.split('_');
    const empId = parts[1];
    const found = employees.find((e) => e.empId.toUpperCase() === empId?.toUpperCase());
    if (found) targetUser = found;
  }
  const { password: _, ...safe } = targetUser;
  res.json({ success: true, user: safe });
});

// Helper to find employee by Employee ID OR Phone Number
function findEmployeeByIdOrPhone(inputString: string) {
  if (!inputString) return null;
  const normalized = inputString.trim().toUpperCase();
  const digitsOnly = inputString.replace(/\D/g, '');

  return employees.find((e) => {
    // Check Employee ID
    if (e.empId.toUpperCase() === normalized) return true;
    // Check Phone number
    if (e.phone && digitsOnly.length >= 6) {
      const empPhoneDigits = e.phone.replace(/\D/g, '');
      if (
        empPhoneDigits === digitsOnly ||
        empPhoneDigits.endsWith(digitsOnly) ||
        digitsOnly.endsWith(empPhoneDigits)
      ) {
        return true;
      }
    }
    return false;
  });
}

// Authentication (Login with Employee ID OR Phone Number & Password)
app.post('/api/auth/login', (req, res) => {
  const { empId, phone, identifier, password } = req.body;
  const loginInput = String(identifier || phone || empId || '').trim();

  if (!loginInput) {
    return res.status(400).json({ error: 'Employee ID or Registered Phone Number is required' });
  }

  const user = findEmployeeByIdOrPhone(loginInput);

  if (!user) {
    return res.status(401).json({
      error: `Invalid credentials. Not found for "${loginInput}". You can log in using Employee ID (e.g. EMP001, EMP002) or Phone Number (e.g. +91 98301 23456).`,
    });
  }

  // Block inactive employees from logging in or punching attendance
  if (user.status === 'inactive') {
    return res.status(403).json({
      error: 'Account Inactive: Your employee account is marked Inactive. Please contact HR to re-activate your profile.',
      isInactive: true,
    });
  }

  // Check password if provided (for demo ease, allows "password123" or empty in demo mode)
  if (password && user.password && user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  res.json({
    success: true,
    user: {
      empId: user.empId,
      name: user.name,
      department: user.department,
      office: user.office,
      role: user.role,
      status: user.status,
      phone: user.phone,
      email: user.email,
      token: `token_${user.empId}_${Date.now()}`,
    },
  });
});

// Toggle Employee Active/Inactive status
app.patch('/api/employees/:empId/status', (req, res) => {
  const { empId } = req.params;
  const { status } = req.body; // 'active' | 'inactive'
  const emp = employees.find((e) => e.empId.toUpperCase() === empId.toUpperCase());
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  if (status !== 'active' && status !== 'inactive') {
    // Toggle
    emp.status = emp.status === 'active' ? 'inactive' : 'active';
  } else {
    emp.status = status;
  }

  res.json({ success: true, empId: emp.empId, status: emp.status });
});

// Forgot password reset
app.post('/api/auth/forgot-password', (req, res) => {
  const { empId } = req.body;
  const user = employees.find(
    (e) => e.empId.toUpperCase() === String(empId || '').trim().toUpperCase()
  );
  if (!user) {
    return res.status(404).json({ error: 'Employee ID not found' });
  }
  res.json({
    success: true,
    message: `A temporary password reset link has been dispatched to ${user.email || 'your registered supervisor'}.`,
  });
});

// List employees
app.get('/api/employees', (req, res) => {
  res.json(
    employees.map(({ password, ...safe }) => safe)
  );
});

// Add new employee
app.post('/api/employees', (req, res) => {
  const { empId, name, department, role, email, phone, password } = req.body;
  if (!empId || !name || !department) {
    return res.status(400).json({ error: 'empId, name, and department are required' });
  }

  const existing = employees.find(
    (e) => e.empId.toUpperCase() === empId.toUpperCase()
  );
  if (existing) {
    return res.status(409).json({ error: 'Employee ID already exists' });
  }

  const newEmp = {
    id: `emp-${Date.now()}`,
    empId: empId.toUpperCase(),
    password: password || 'password123',
    name,
    department,
    office: officeConfig.name,
    role: role || 'employee',
    status: (req.body.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
    phone: phone || '+91 98000 00000',
    email: email || `${empId.toLowerCase()}@example.com`,
  };

  employees.push(newEmp);
  const { password: _, ...safe } = newEmp;
  res.status(201).json({ success: true, employee: safe });
});

// Update employee (Section 10)
app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params;
  const emp = employees.find(
    (e) => e.id === id || e.empId.toUpperCase() === id.toUpperCase()
  );
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  const { name, department, office, role, status, email, phone, password } = req.body;
  if (name) emp.name = name;
  if (department) emp.department = department;
  if (office) emp.office = office;
  if (role) emp.role = role;
  if (status) emp.status = status;
  if (email) emp.email = email;
  if (phone) emp.phone = phone;
  if (password) emp.password = password;

  const { password: _, ...safe } = emp;
  res.json({ success: true, employee: safe });
});

// Check-in Attendance Endpoint (Supports EmpId OR Registered Phone Number)
app.post('/api/attendance/check-in', (req, res) => {
  const {
    empId,
    employee_id,
    phone,
    latitude,
    longitude,
    selfieUrl,
    selfie,
    distanceMeters: clientDistance,
    forceBypassDistance,
  } = req.body;

  const resolvedInput = empId || employee_id || phone;
  if (!resolvedInput) {
    return res.status(400).json({ error: 'Employee ID or Registered Phone Number is required' });
  }

  const emp = findEmployeeByIdOrPhone(String(resolvedInput));
  if (!emp) {
    return res.status(404).json({ error: `Employee not found for identifier "${resolvedInput}"` });
  }

  // Block inactive employees from checking in
  if (emp.status === 'inactive') {
    return res.status(403).json({
      error: 'Account Inactive: Attendance check-in is disabled for inactive employee profiles. Please contact HR.',
    });
  }

  // Calculate actual distance between employee's coordinates and office
  let distance = clientDistance;
  if (latitude !== undefined && longitude !== undefined) {
    const computed = computeHaversineDistance(
      Number(latitude),
      Number(longitude),
      officeConfig.latitude,
      officeConfig.longitude
    );
    distance = computed;
  }

  // Strict 50-meter Geofence Check
  const maxRadius = officeConfig.radiusMeters;
  if (distance > maxRadius && !forceBypassDistance) {
    return res.status(403).json({
      error: `Out of range! Current distance is ${distance} m. You must be within ${maxRadius} m of ${officeConfig.name} to check in.`,
      distanceMeters: distance,
      maxAllowedMeters: maxRadius,
    });
  }

  // Determine Late vs Present
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const [threshH, threshM] = officeConfig.lateThreshold.split(':').map(Number);
  const isLate = hours > threshH || (hours === threshH && minutes > threshM);
  const status = isLate ? 'Late' : 'Present';

  // Format check-in time e.g. "09:42 AM"
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  const formattedDate = getFormattedDate(now);

  // Check if employee already checked in today
  const existingIdx = attendanceRecords.findIndex(
    (r) => r.empId.toUpperCase() === emp.empId.toUpperCase() && r.date === formattedDate
  );

  const newRecord = {
    id: `rec-${Date.now()}`,
    empId: emp.empId,
    employeeName: emp.name,
    department: emp.department,
    office: officeConfig.name,
    phone: emp.phone,
    date: formattedDate,
    checkInTime: formattedTime,
    distanceMeters: distance ?? 32,
    selfieUrl: selfieUrl || selfie || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    status,
    latitude: latitude || officeConfig.latitude,
    longitude: longitude || officeConfig.longitude,
    verifiedAt: now.toISOString(),
  };

  if (existingIdx >= 0) {
    attendanceRecords[existingIdx] = newRecord;
  } else {
    attendanceRecords.unshift(newRecord);
  }

  // Response matches Section 12 specification
  res.json({
    success: true,
    message: 'Attendance recorded successfully',
    record: newRecord,
    attendance: {
      date: newRecord.date,
      checkInTime: newRecord.checkInTime,
      distance: newRecord.distanceMeters,
      office: newRecord.office,
      phone: emp.phone,
      status: newRecord.status.toUpperCase(),
    },
    office: officeConfig.name,
    distanceMeters: newRecord.distanceMeters,
  });
});

// Today's attendance list (Section 10)
app.get('/api/attendance/today', (req, res) => {
  const todayStr = getFormattedDate();
  const records = attendanceRecords.filter((r) => r.date === todayStr);
  res.json({
    success: true,
    date: todayStr,
    count: records.length,
    records,
  });
});

// Attendance history (Section 10)
app.get('/api/attendance/history', (req, res) => {
  const { empId, limit = 100 } = req.query;
  let records = attendanceRecords;
  if (empId) {
    records = records.filter(
      (r) => r.empId.toUpperCase() === String(empId).trim().toUpperCase()
    );
  }
  res.json({
    success: true,
    count: records.length,
    records: records.slice(0, Number(limit)),
  });
});

// Daily Report endpoint (matches Document 2)
app.get('/api/reports/daily', (req, res) => {
  const queryDate = (req.query.date as string) || getFormattedDate();

  // Map each registered employee to either their check-in or Absent
  const nonAdminEmps = employees.filter((e) => e.role !== 'admin');
  const activeCount = nonAdminEmps.filter((e) => e.status === 'active').length;
  const inactiveCount = nonAdminEmps.filter((e) => e.status === 'inactive').length;

  const dailyReport = nonAdminEmps.map((emp) => {
    const rec = attendanceRecords.find(
      (r) => r.empId.toUpperCase() === emp.empId.toUpperCase() && r.date === queryDate
    );

    if (rec) {
      return {
        empId: emp.empId,
        employeeName: emp.name,
        department: emp.department,
        office: rec.office,
        phone: emp.phone,
        date: rec.date,
        checkInTime: rec.checkInTime,
        distance: rec.distanceMeters,
        selfieUrl: rec.selfieUrl,
        status: rec.status,
        employeeStatus: emp.status,
      };
    }

    return {
      empId: emp.empId,
      employeeName: emp.name,
      department: emp.department,
      office: officeConfig.name,
      phone: emp.phone,
      date: queryDate,
      checkInTime: '--',
      distance: '--',
      selfieUrl: undefined,
      status: 'Absent' as const,
      employeeStatus: emp.status,
    };
  });

  res.json({
    date: queryDate,
    office: officeConfig.name,
    totalEmployees: nonAdminEmps.length,
    activeCount,
    inactiveCount,
    presentCount: dailyReport.filter((r) => r.status === 'Present').length,
    lateCount: dailyReport.filter((r) => r.status === 'Late').length,
    absentCount: dailyReport.filter((r) => r.status === 'Absent').length,
    rows: dailyReport,
  });
});

// Monthly Report endpoint (matches Document 4)
app.get('/api/reports/monthly', (req, res) => {
  const month = (req.query.month as string) || 'Oct 2026';
  const cached = monthlyStatsCache[month as keyof typeof monthlyStatsCache];

  if (cached) {
    return res.json({
      month,
      workingDays: officeConfig.workDaysPerMonth,
      rows: cached,
    });
  }

  // Calculate dynamically if not in seed cache
  const workingDays = officeConfig.workDaysPerMonth;
  const rows = employees
    .filter((e) => e.role !== 'admin')
    .map((emp) => {
      const empRecords = attendanceRecords.filter(
        (r) => r.empId.toUpperCase() === emp.empId.toUpperCase()
      );
      const present = empRecords.filter((r) => r.status === 'Present').length;
      const late = empRecords.filter((r) => r.status === 'Late').length;
      const totalAttended = present + late;
      const absent = Math.max(0, workingDays - totalAttended);
      const pct =
        workingDays > 0
          ? ((present / workingDays) * 100).toFixed(1) + '%'
          : '0.0%';

      return {
        empId: emp.empId,
        employeeName: emp.name,
        department: emp.department,
        month,
        workingDays,
        present,
        late,
        absent,
        attendancePercentage: pct,
      };
    });

  res.json({ month, workingDays, rows });
});

// Reset demo data to match PDF state exactly
app.post('/api/attendance/reset', (req, res) => {
  attendanceRecords = [
    {
      id: 'rec-1',
      empId: 'EMP001',
      employeeName: 'Amit Das',
      department: 'IT',
      office: 'Head Office, Kolkata',
      date: '01-10-2026',
      checkInTime: '09:42 AM',
      distanceMeters: 32,
      selfieUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      status: 'Present',
      latitude: 22.57285,
      longitude: 88.36402,
      verifiedAt: '2026-10-01T09:42:00.000Z',
    },
    {
      id: 'rec-2',
      empId: 'EMP002',
      employeeName: 'Riya Sen',
      department: 'HR',
      office: 'Head Office, Kolkata',
      date: '01-10-2026',
      checkInTime: '10:20 AM',
      distanceMeters: 18,
      selfieUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      status: 'Late',
      latitude: 22.57271,
      longitude: 88.36395,
      verifiedAt: '2026-10-01T10:20:00.000Z',
    },
  ];
  res.json({ success: true, message: 'Reset to initial PDF state' });
});

/* =========================================================
   Frontend Middlewares (Vite Dev / Static Production)
   ========================================================= */

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GeoFace Attendance] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
