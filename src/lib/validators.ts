import { z } from "zod";

export const step1Schema = z.object({
  fullName: z.string().min(2, "Minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  department: z.string().min(2, "Pilih department"),
  role: z.enum(["Ops", "Admin", "Engineer", "Finance"]),
  employeeId: z.string().regex(/^[A-Z]{3}-\d{3}$/, "Format ID harus ABC-001"),
});
