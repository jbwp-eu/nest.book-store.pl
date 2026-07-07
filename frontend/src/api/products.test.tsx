import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect, useState } from "react";
import { fetchFeaturedProducts } from "@/api/products";

/** Matches first seed product in backend seeder data. */
const SEED_PRODUCT_ID = "aptekarka";
const SEED_PRODUCT_TITLE = "Aptekarka";

function FeaturedProductsProbe() {
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const products = await fetchFeaturedProducts("pl");
        const found = products.find((p) => p.id === SEED_PRODUCT_ID);
        if (!cancelled) {
          setTitle(found?.title ?? "");
        }
      } catch {
        if (!cancelled) setTitle("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <span data-testid="seed-product-title">{title ?? ""}</span>;
}

describe("featured products API (pairs with backend /api/products/featured)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify([
            { id: SEED_PRODUCT_ID, title: SEED_PRODUCT_TITLE, price: 49.99 },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps REST featured products JSON to UI", async () => {
    render(<FeaturedProductsProbe />);

    await waitFor(() => {
      expect(screen.getByTestId("seed-product-title")).toHaveTextContent(
        SEED_PRODUCT_TITLE,
      );
    });
    expect(fetch).toHaveBeenCalled();
  });
});
