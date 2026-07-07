import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import { useAppDispatch } from "@/store/hooks";
import {
  removeItem,
  setQuantity,
  type CartItem,
} from "@/store/cartSlice";

type CartLineItemProps = {
  item: CartItem;
};

function lineTotal(item: CartItem): number {
  return (item.price ?? 0) * item.quantity;
}

function CartLineItem({ item }: CartLineItemProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const atMax =
    item.countInStock != null && item.quantity >= item.countInStock;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 pt-6">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="size-16 rounded-md border object-cover"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
            {t("productCard.noImage")}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {item.title ? (
            <>
              <p className="font-medium">{item.title}</p>
              <Link
                to={`/product/${item.productId}`}
                className="text-sm text-primary hover:underline"
              >
                {t("cart.viewProduct")}
              </Link>
            </>
          ) : (
            <Link
              to={`/product/${item.productId}`}
              className="font-medium text-primary hover:underline"
            >
              {t("cart.product")}
            </Link>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {item.price != null ? formatCurrency(item.price) : "—"}
        </p>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t("cart.decreaseQty")}
            onClick={() =>
              dispatch(
                setQuantity({
                  productId: item.productId,
                  quantity: item.quantity - 1,
                })
              )
            }
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="min-w-8 text-center text-sm">{item.quantity}</span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t("cart.increaseQty")}
            disabled={atMax}
            onClick={() =>
              dispatch(
                setQuantity({
                  productId: item.productId,
                  quantity: item.quantity + 1,
                })
              )
            }
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        <p className="min-w-24 text-right font-medium">
          {item.price != null ? formatCurrency(lineTotal(item)) : "—"}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("cart.removeFromCart")}
          className="text-destructive hover:text-destructive"
          onClick={() => dispatch(removeItem(item.productId))}
        >
          <Trash2 className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

export default CartLineItem;
