import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { WizardPage } from "./WizardPage";

// make sleep instant
vi.mock("../../lib/sleep", () => ({
  sleep: () => Promise.resolve(),
}));

describe("Submit flow", () => {
  test("admin submits basicInfo then details sequentially and shows progress logs", async () => {
    const user = userEvent.setup();

    const originalFetch = globalThis.fetch;

    // fetch mock:
    // - GET /departments?name_like= -> return Engineering
    // - GET /basicInfo?department=Engineering -> return [] so seq -> 001
    // - POST -> ok
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (!init?.method || init.method === "GET") {
        if (url.includes("/departments?")) {
          return {
            ok: true,
            json: async () => [{ id: 4, name: "Engineering" }],
          } as any;
        }
        if (url.includes("/basicInfo?department=")) {
          return { ok: true, json: async () => [] } as any;
        }
        return { ok: true, json: async () => [] } as any;
      }

      return { ok: true, json: async () => ({}) } as any;
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(
      <MemoryRouter initialEntries={["/wizard?role=admin"]}>
        <WizardPage />
      </MemoryRouter>
    );

    // Step 1 minimal valid fields
    await user.type(screen.getByLabelText("Full Name"), "Hari");
    await user.type(screen.getByLabelText("Email"), "hari@mail.com");

    // Department: type then click the suggestion so onSelect runs
    const dept = screen.getByLabelText("Department");
    await user.type(dept, "Eng");

    // wait suggestion appears and click it
    const opt = await screen.findByRole("option", { name: "Engineering" });
    await user.click(opt);

    // after select, employeeId should become valid like ENG-001
    // (optional assert to ensure it's valid before Next)
    const employeeIdInput = screen.getByLabelText(/Employee ID/i) as HTMLInputElement;
    expect(employeeIdInput.value).toBe("ENG-001");

    // Next
    await user.click(screen.getByRole("button", { name: /Next/i }));

    // Step 2: assert by a field that definitely exists
    expect(screen.getByLabelText(/Employment Type/i)).toBeInTheDocument();

    // Submit
    await user.click(screen.getByRole("button", { name: /Submit/i }));

    // logs
    expect(await screen.findByText(/basicInfo saved/i)).toBeInTheDocument();
    expect(await screen.findByText(/details saved/i)).toBeInTheDocument();

    // verify POST order
    const postUrls = fetchMock.mock.calls
      .filter(([, init]) => init?.method === "POST")
      .map(([u]) => String(u));

    expect(postUrls[0]).toMatch(/4001\/basicInfo/);
    expect(postUrls[1]).toMatch(/4002\/details/);

    globalThis.fetch = originalFetch;
  }, 10000);
});
