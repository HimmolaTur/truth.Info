"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslations } from "next-intl";
import { Link } from "@/navigation";

export type MapEventRow = {
  id: number;
  lat: number;
  lng: number;
  title: string;
  description: string;
  news_id?: number | null;
};

export default function MapComponent({ events }: { events: MapEventRow[] }) {
  const t = useTranslations("Map");
  const tc = useTranslations("Common");
  const [isMounted, setIsMounted] = useState(false);
  const [icon, setIcon] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    // Dynamic import for leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      const customIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      setIcon(customIcon);
    });
  }, []);

  if (!isMounted || !icon) return <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">{t("loading")}</div>;

  return (
    <MapContainer center={[55.7558, 37.6173]} zoom={10} className="w-full h-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((event) => (
        <Marker key={event.id} position={[Number(event.lat), Number(event.lng)]} icon={icon}>
          <Popup>
            <div className="font-bold mb-1">{event.title}</div>
            <div className="text-sm">{event.description}</div>
            {event.news_id != null ? (
              <Link
                href={`/news/${event.news_id}`}
                className="text-blue-600 text-sm font-semibold mt-2 inline-block hover:underline"
              >
                {tc("relatedNews")}
              </Link>
            ) : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}