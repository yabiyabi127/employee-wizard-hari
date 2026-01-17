import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WizardPage } from "./WizardPage";

describe("Wizard role access", () => {
  test("ops goes directly to Step 2 and does not render Step 1", () => {
    render(
      <MemoryRouter initialEntries={["/wizard?role=ops"]}>
        <WizardPage />
      </MemoryRouter>
    );

    // ✅ Step 2 content should appear
    expect(
      screen.getByText(/Details & Submit/i)
    ).toBeInTheDocument();

    // ✅ Step 1 fields should NOT exist
    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Email/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Basic Info/i)).not.toBeInTheDocument();

    // ✅ Ops should not have Next button
    expect(
      screen.queryByRole("button", { name: /Next/i })
    ).not.toBeInTheDocument();

    // ✅ Ops should have Submit button
    expect(
      screen.getByRole("button", { name: /Submit/i })
    ).toBeInTheDocument();
  });
});
