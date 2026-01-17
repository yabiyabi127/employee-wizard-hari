# Employee Wizard – Frontend Assignment

A modern, accessible multi-step employee form built with **React + Vite**, featuring role-based flow, autosave drafts, async submission simulation, and unit tests.

🔗 **Live Demo**: [Click Here  ](https://employee-wizard-hari.pages.dev/) 
📦 **Repository**: [GitHub repo](https://github.com/yabiyabi127/employee-wizard-hari)

## 🔔 Important Note for Reviewers
Please note:
When accessing the deployed application at
👉 https://employee-wizard-hari.pages.dev/

some functionalities will not work as expected.

This is because the backend (mock API) is not deployed.
API requests are still pointing to a local base URL (localhost), therefore no data can be retrieved in the deployed environment.

Based on the assignment requirements, backend deployment was not requested, so the backend is intentionally kept local.

To experience the full and accurate functionality of the application, please run the project locally by:

Cloning the repository

Installing dependencies

Running the frontend and mock API locally

Detailed steps are provided below.

---

## ✨ Features

- 🔐 **Role-based flow**
  - **Admin**: Step 1 (Basic Info) → Step 2 (Details & Submit)
  - **Ops**: Direct access to Step 2 only
- 🧭 **Multi-step Wizard**
  - Clear step navigation
  - Conditional buttons based on role
- 💾 **Draft Autosave**
  - Automatically saves progress to `localStorage` after 2s idle
  - Separate drafts per role (`draft_admin`, `draft_ops`)
- 🔍 **Accessible Autocomplete**
  - Keyboard navigation (Arrow / Enter / Escape)
  - Screen reader friendly (`combobox`, `listbox`, `option`)
  - Default suggestions on focus
- ⏳ **Async Submit Simulation**
  - Sequential API calls with progress logs
  - Artificial delay to simulate real backend behavior
- 🧪 **Unit Tests**
  - Wizard role access
  - Draft autosave
  - Autocomplete behavior
  - Submit flow

---

## 🛠 Tech Stack

- **React 18**
- **Vite**
- **TypeScript**
- **React Router**
- **Vitest + React Testing Library**
- **CSS**

---

## 🧩 Application Flow

### Admin
1. Fill **Step 1 – Basic Info**
2. Continue to **Step 2 – Details**
3. Submit → data sent sequentially

### Ops
1. Directly access **Step 2 – Details**
2. Submit → details only (cant effect to employee page list because only submit to detail Database json)

> Authentication is intentionally **not implemented**.  
> Roles are simulated via query parameter or internal toggle as required by the assignment.
---
## 💾 Draft Autosave

- Drafts are stored in **browser `localStorage`**
- Autosaved after **2 seconds of inactivity**
- Loaded automatically when returning to the wizard

Example keys:
- `draft_admin`
- `draft_ops`

> Backend draft persistence is out of scope for this assignment.
---
## 🌐 API / Backend

This project uses **mock APIs** for demonstration purposes.

- During local development: `json-server`

Endpoints used:
- `GET /departments`
- `GET /locations`
- `POST /basicInfo`
- `POST /details`
---
## 🚀 Getting Started (Local Development)

### 1. Local Running Development
```bash
git clone `https://github.com/yabiyabi127/employee-wizard-hari.git`
go to project
npm install
npm run dev <<< terminal 1 for front end
npm run api <<< terminal 2 for backend
open browser `http://localhost:5173/`
```

### 2. For Running Unit Test
```bash
npm run test
```
