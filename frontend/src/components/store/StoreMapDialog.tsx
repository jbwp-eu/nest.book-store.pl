import { useTranslation } from "react-i18next";
import StoreMap from "@/components/store/StoreMap";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StoreLocation } from "@/types/storeLocation";

type StoreMapDialogProps = {
  open: boolean;
  onClose: () => void;
  storeLocation: StoreLocation | null;
};

function StoreMapDialog({
  open,
  onClose,
  storeLocation,
}: StoreMapDialogProps) {
  const { t } = useTranslation();
  const hasLocation =
    !!storeLocation &&
    typeof storeLocation.latitude === "number" &&
    typeof storeLocation.longitude === "number";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="border bg-card text-card-foreground shadow-xl sm:max-w-lg [&_[data-slot=dialog-close]]:text-foreground [&_[data-slot=dialog-close]]:opacity-100">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {t("storeMap.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground underline">
            {t("storeMap.comingSoon")}
          </DialogDescription>
        </DialogHeader>

        {hasLocation ? (
          <StoreMap
            lat={storeLocation.latitude}
            lng={storeLocation.longitude}
            title={storeLocation.name}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("storeMap.unavailable")}
          </p>
        )}

        <p className="text-sm text-foreground underline decoration-destructive underline-offset-2">
          {t("storeMap.hint")}
        </p>

        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            {t("storeMap.close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StoreMapDialog;
