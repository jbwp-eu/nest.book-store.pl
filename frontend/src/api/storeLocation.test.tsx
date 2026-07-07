import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect, useState } from "react";
import { fetchStoreLocation } from "@/api/storeLocation";

const MOCK_NAME = "Rondo Dmowskiego 10, 00-590 Warszawa, Poland";
const MOCK_LAT = 52.23;
const MOCK_LNG = 21.01;

function StoreLocationProbe() {
  const [line, setLine] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const location = await fetchStoreLocation("pl");
        if (!cancelled) {
          setLine(
            `${location.name}:${location.latitude}:${location.longitude}`,
          );
        }
      } catch {
        if (!cancelled) setLine("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <span data-testid="store-location-line">{line}</span>;
}

describe("store location API (pairs with backend /api/store-location)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            name: MOCK_NAME,
            latitude: MOCK_LAT,
            longitude: MOCK_LNG,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps REST store location JSON to UI", async () => {
    render(<StoreLocationProbe />);

    await waitFor(() => {
      expect(screen.getByTestId("store-location-line")).toHaveTextContent(
        `${MOCK_NAME}:${MOCK_LAT}:${MOCK_LNG}`,
      );
    });
    expect(fetch).toHaveBeenCalled();
  });
});
