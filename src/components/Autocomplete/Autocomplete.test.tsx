import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Autocomplete } from "./Autocomplete";

describe("Autocomplete", () => {
  test("fetches suggestions and filters by typed prefix", async () => {
    const user = userEvent.setup();

    const originalFetch = globalThis.fetch;

    const fetchMock = vi.fn(async () => {
      return {
        ok: true,
        json: async () => [
          { id: 1, name: "Lending" },
          { id: 2, name: "Funding" },
          { id: 3, name: "Operations" },
          { id: 4, name: "Engineering" }
        ],
      } as any;
    });

    globalThis.fetch = fetchMock as any;

    function Wrapper() {
      const [val, setVal] = React.useState("");
      return (
        <Autocomplete
          id="dept"
          value={val}
          onChange={setVal}
          fetchUrl={(q) => `http://x/departments?name_like=${encodeURIComponent(q)}`}
        />
      );
    }

    render(<Wrapper />);

    await user.type(screen.getByRole("combobox"), "En");

    // tunggu debounce + fetch selesai
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    // tunggu option muncul
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Engineering" })).toBeInTheDocument();
    });

    // pastikan yang tidak match prefix tidak muncul (butuh filter startsWith di Autocomplete.tsx)
    expect(screen.queryByRole("option", { name: "Funding" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Lending" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Operations" })).not.toBeInTheDocument();

    globalThis.fetch = originalFetch;
  }, 10000);
});
