import { useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
} from "@vis.gl/react-google-maps";
import { useTranslation } from "react-i18next";

type StoreMapProps = {
  lat: number;
  lng: number;
  title: string;
};

const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? "undefined";

function StoreMap({ lat, lng }: StoreMapProps) {
  const { t } = useTranslation();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [open, setOpen] = useState(false);

  if (!apiKey) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("storeMap.apiKeyMissing")}
      </p>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="h-[300px] w-full overflow-hidden rounded-lg border">
        <Map
          defaultZoom={15}
          defaultCenter={{ lat, lng }}
          mapId={mapId}
          style={{ width: "100%", height: "100%" }}
        >
          <AdvancedMarker position={{ lat, lng }} onClick={() => setOpen(true)}>
            <div className="flex -translate-x-1/2 -translate-y-full cursor-pointer flex-col items-center">
              <div className="rounded-full bg-gradient-to-br from-blue-600 to-sky-400 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-white shadow-lg">
                {t("storeMap.markerLabel")}
              </div>
              <div className="mt-[-1px] h-0 w-0 border-t-8 border-r-[7px] border-l-[7px] border-t-blue-600 border-r-transparent border-l-transparent drop-shadow-md" />
            </div>
          </AdvancedMarker>
          {open && (
            <InfoWindow position={{ lat, lng }} onCloseClick={() => setOpen(false)}>
              <p className="m-0 text-sm font-semibold text-neutral-900">
                {t("storeMap.infoWindow")}
              </p>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  );
}

export default StoreMap;
