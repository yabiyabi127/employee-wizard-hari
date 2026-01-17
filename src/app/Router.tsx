import { createBrowserRouter } from "react-router-dom";
import { WizardPage } from "../pages/WizardPage/WizardPage";
import { EmployeesPage } from "../pages/Employees/EmployeesPage";

export const router = createBrowserRouter([
  { path: "/", element: <WizardPage /> },
  { path: "/wizard", element: <WizardPage /> },
  { path: "/employees", element: <EmployeesPage /> },
]);