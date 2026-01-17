import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { WizardPage } from "./WizardPage";

describe("Draft autosave", () => {
  test("saves draft_admin after 2s idle", async () => {
    const user = userEvent.setup();

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    render(
      <MemoryRouter initialEntries={["/wizard?role=admin"]}>
        <WizardPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Full Name"), "Anthony");

    // autosave dilakukan setelah 2 detik idle
    await waitFor(
      () => {
        const calls = setItemSpy.mock.calls;
        const hasDraftAdmin = calls.some(([key]) => key === "draft_admin");
        expect(hasDraftAdmin).toBe(true);
      },
      { timeout: 3500 } // 2s debounce + buffer
    );

    setItemSpy.mockRestore();
  }, 10000);
});
