export type BasicInfo = {
  id?: number;
  fullName: string;
  email: string;
  department: string;
  role: "Ops" | "Admin" | "Engineer" | "Finance";
  employeeId: string;
};

export type Details = {
  id?: number;
  email?: string;
  employeeId?: string;
  photoBase64?: string;
  employmentType?: "Full-time" | "Part-time" | "Contract" | "Intern";
  officeLocation?: string;
  notes?: string;
};

export type EmployeeRow = {
  key: string;
  fullName?: string;
  department?: string;
  role?: string;
  officeLocation?: string;
  photoBase64?: string;
};

export function mergeEmployees(basic: BasicInfo[], details: Details[]): EmployeeRow[] {
  const keyOf = (x: { email?: string; employeeId?: string }) => x.email ?? x.employeeId ?? "";
  const map = new Map<string, EmployeeRow>();

  for (const b of basic) {
    const key = keyOf({ email: b.email, employeeId: b.employeeId });
    if (!key) continue;
    map.set(key, {
      key,
      fullName: b.fullName,
      department: b.department,
      role: b.role,
    });
  }
  for (const d of details) {
    const key = keyOf(d);
    if (!key) continue;
    const cur = map.get(key) ?? { key };
    map.set(key, {
      ...cur,
      officeLocation: d.officeLocation ?? cur.officeLocation,
      photoBase64: d.photoBase64 ?? cur.photoBase64,
    });
  }
  return Array.from(map.values());
}
