import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

const crimeTypeColors = {
  robbery: "red",
  assault: "purple",
  harassment: "gold",
  theft: "blue",
  other: "gray",
};

const getCrimeIcon = (type) => {
  const color = crimeTypeColors[type?.toLowerCase()] || "gray";
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='40' height='60' viewBox='0 0 40 60'>
      <line x1='20' y1='24' x2='20' y2='58' stroke='#888' stroke-width='2.5'/>
      <circle cx='20' cy='18' r='14' fill='${color}' stroke='#fff' stroke-width='2'/>
      <ellipse cx='15' cy='13' rx='5' ry='2.5' fill='white' opacity='0.5'/>
    </svg>
  `;
  return new L.Icon({
    iconUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    iconSize: [40, 60],
    iconAnchor: [20, 58],
    popupAnchor: [0, -30],
  });
};

export default function HistoryPage() {
  const { user, jwt } = useUser();
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState({});

  const fetchAddress = async (lat, lng, crimeId) => {
    try {
      const res = await fetch(
        `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`
      );
      const data = await res.json();
      let address = "Unknown area";
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        address =
          props.name ||
          props.street ||
          props.suburb ||
          props.city ||
          props.state ||
          props.country ||
          "Unknown area";
        if (props.city && props.city !== address) address += ", " + props.city;
        if (props.country && props.country !== address)
          address += ", " + props.country;
      }
      setAddresses((prev) => ({ ...prev, [crimeId]: address }));
    } catch {
      setAddresses((prev) => ({ ...prev, [crimeId]: "Unknown area" }));
    }
  };

  useEffect(() => {
    if (!user) return;
    async function fetchCrimes() {
      setLoading(true);
      try {
        const res = await fetch("/api/crimes", {
          headers: { Authorization: jwt ? `Bearer ${jwt}` : undefined },
        });
        if (!res.ok) throw new Error("Failed to fetch crimes");
        const data = await res.json();
        const userCrimes = data
          .filter((c) => c.reporter === user.id)
          .map((c) => ({
            ...c,
            lat: c.location?.coordinates?.[1],
            lng: c.location?.coordinates?.[0],
          }));
        setCrimes(userCrimes);
        userCrimes.forEach((crime) => {
          if (crime.lat && crime.lng && !addresses[crime.id]) {
            fetchAddress(crime.lat, crime.lng, crime.id);
          }
        });
      } catch {
        setCrimes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCrimes();
  }, [user, jwt]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-glassyblue-100 via-white to-glassyblue-200 pt-24 pb-12 px-2">
      <h1 className="text-3xl md:text-4xl font-extrabold text-glassyblue-700 mb-8 text-center drop-shadow-lg">
        My Crime Reports
      </h1>
      {loading ? (
        <div className="text-center text-lg text-glassyblue-600">
          Loading...
        </div>
      ) : crimes.length === 0 ? (
        <div className="text-center text-xl text-glassyblue-500 font-semibold mt-16">
          You have not reported any crimes yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {crimes.map((crime) => (
            <div
              key={crime.id}
              className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6 flex flex-col gap-4 transition-transform hover:scale-105 hover:shadow-2xl"
              style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-block">
                  <span
                    style={{ display: "inline-block", verticalAlign: "middle" }}
                  >
                    <img
                      src={getCrimeIcon(crime.type).options.iconUrl}
                      alt={crime.type}
                      width={32}
                      height={48}
                      style={{
                        filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.10))",
                      }}
                    />
                  </span>
                </span>
                <span className="text-lg font-bold text-glassyblue-700 capitalize">
                  {crime.type}
                </span>
              </div>
              <div className="text-sm text-glassyblue-600 mb-1">
                {crime.time ? new Date(crime.time).toLocaleString() : "No time"}
              </div>
              <div className="text-base text-gray-800 mb-2">
                {crime.description}
              </div>
              <div className="text-xs text-glassyblue-500 mb-1">
                <b>Location:</b>{" "}
                {addresses[crime.id] ? (
                  <>
                    {addresses[crime.id]} <br />
                    <span style={{ color: "#64748b" }}>
                      ({crime.lat?.toFixed(5)}, {crime.lng?.toFixed(5)})
                    </span>
                  </>
                ) : (
                  <span style={{ color: "#64748b" }}>Fetching address...</span>
                )}
              </div>
              {crime.lat && crime.lng && (
                <div className="rounded-xl overflow-hidden border border-glassyblue-200/40 shadow-md h-40">
                  <MapContainer
                    center={[crime.lat, crime.lng]}
                    zoom={14}
                    style={{ width: "100%", height: "100%", minHeight: 160 }}
                    attributionControl={false}
                    className="z-0"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[crime.lat, crime.lng]}
                      icon={getCrimeIcon(crime.type)}
                    />
                  </MapContainer>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
