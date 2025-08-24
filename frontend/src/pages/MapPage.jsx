import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CrimeReportForm from "../components/CrimeReportForm";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

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

function LocationMarker({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
}

const MapPage = () => {
  const [crimes, setCrimes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedLatLng, setSelectedLatLng] = useState(null);
  const [route, setRoute] = useState([]);
  const [selectingRoute, setSelectingRoute] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [networkType, setNetworkType] = useState("drive");
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [showRouteInstruction, setShowRouteInstruction] = useState(false);
  const mapRef = useRef();
  const navigate = useNavigate();
  const { jwt } = useUser();

  const sourceToastId = useRef(null);
  const destToastId = useRef(null);

  useEffect(() => {
    async function fetchCrimes() {
      try {
        const res = await fetch("/api/crimes", {
          headers: { Authorization: jwt ? `Bearer ${jwt}` : undefined },
        });
        if (!res.ok) throw new Error("Failed to fetch crimes");
        const data = await res.json();
        const crimesWithLatLng = data.map((c) => ({
          ...c,
          lat: c.location?.coordinates?.[1],
          lng: c.location?.coordinates?.[0],
        }));
        setCrimes(crimesWithLatLng);
      } catch (err) {
        setCrimes([]);
      }
    }
    fetchCrimes();
  }, [jwt]);

  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    count: 0,
  }));
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayData = dayNames.map((day) => ({ day, count: 0 }));
  crimes.forEach((c) => {
    if (c.time) {
      const d = new Date(c.time);
      const hour = d.getHours();
      hourData[hour].count++;
      const day = d.getDay();
      dayData[day].count++;
    }
  });

  const filteredCrimes =
    filter === "all"
      ? crimes
      : crimes.filter((c) => c.type.toLowerCase() === filter);

  const handleMapClick = async (latlng) => {
    if (selectingRoute) {
      if (routePoints.length === 0) {
        setRoutePoints([latlng]);
        if (sourceToastId.current) toast.dismiss(sourceToastId.current);
        destToastId.current = toast.custom(
          (t) => (
            <div
              className="backdrop-blur-xl bg-white/40 border border-glassyblue-200/40 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 text-glassyblue-800 font-semibold text-base animate-fade-in"
              style={{
                boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
                minWidth: 320,
              }}
            >
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
              Click on the map to select{" "}
              <span className="font-bold ml-1">destination</span> (red marker).
            </div>
          ),
          { id: "dest-toast", duration: Infinity, position: "top-center" }
        );
      } else if (routePoints.length === 1) {
        setRoutePoints([routePoints[0], latlng]);
        if (destToastId.current) toast.dismiss(destToastId.current);
        setRouteLoading(true);
        setRouteError("");
        setRoute([]);
        try {
          const res = await fetch("/api/routes/safest", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: jwt ? `Bearer ${jwt}` : undefined,
            },
            body: JSON.stringify({
              startLat: routePoints[0].lat,
              startLng: routePoints[0].lng,
              endLat: latlng.lat,
              endLng: latlng.lng,
              networkType: networkType,
            }),
          });
          if (!res.ok) throw new Error("Failed to fetch route");
          const data = await res.json();
          if (data.route && data.route.length > 1) {
            setRoute(data.route.map((pt) => ({ lat: pt.lat, lng: pt.lng })));
            setRouteError("");
          } else {
            setRoute([]);
            setRouteError("No safe route found for the selected points.");
          }
          setSelectingRoute(false);
          setShowRouteInstruction(false);
        } catch (err) {
          setRouteError("Failed to fetch route");
        } finally {
          setRouteLoading(false);
        }
      }
    }
  };

  const handleFilterChange = (e) => setFilter(e.target.value);

  const handleNetworkTypeChange = (e) => setNetworkType(e.target.value);

  const startRouteSelection = () => {
    setRouteModalOpen(true);
    setSelectingRoute(false);
    setRoutePoints([]);
    setRoute([]);
    setRouteError("");
    setShowRouteInstruction(false);
  };

  const beginSelectingRoute = () => {
    setRouteModalOpen(false);
    setSelectingRoute(true);
    setRoutePoints([]);
    setRoute([]);
    setRouteError("");
    setShowRouteInstruction(true);
    if (sourceToastId.current) toast.dismiss(sourceToastId.current);
    if (destToastId.current) toast.dismiss(destToastId.current);
    sourceToastId.current = toast.custom(
      (t) => (
        <div
          className="backdrop-blur-xl bg-white/40 border border-glassyblue-200/40 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 text-glassyblue-800 font-semibold text-base animate-fade-in"
          style={{
            boxShadow: "0 8px 32px 0 rgba(31,38,135,0.18)",
            minWidth: 320,
          }}
        >
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          Click on the map to select{" "}
          <span className="font-bold ml-1">source</span> (green marker).
        </div>
      ),
      { id: "source-toast", duration: Infinity, position: "top-center" }
    );
  };

  const resetRouteSelection = () => {
    setSelectingRoute(false);
    setRoutePoints([]);
    setRoute([]);
    setRouteModalOpen(false);
    setRouteError("");
    setShowRouteInstruction(false);
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-100">
      {routeLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl"
          style={{ pointerEvents: "all" }}
        >
          <motion.div
            className="rounded-2xl bg-white/40 shadow-xl p-8 flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-16 h-16 mb-4 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
            >
              <svg className="w-16 h-16" viewBox="0 0 50 50">
                <circle
                  className="text-glassyblue-400 opacity-30"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                />
                <motion.circle
                  className="text-glassyblue-600"
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray="100"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                  animate={{
                    strokeDashoffset: [60, 0, 60],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    ease: "easeInOut",
                  }}
                />
              </svg>
            </motion.div>
            <div className="text-xl font-semibold text-glassyblue-700 mb-2">
              Calculating safest route...
            </div>
            <div className="text-glassyblue-500 text-sm">
              Please wait while we analyze all possible paths for you.
            </div>
          </motion.div>
        </motion.div>
      )}
      <div
        className="flex flex-row items-center justify-between p-6 mt-20 mx-auto max-w-4xl rounded-2xl bg-white/30 backdrop-blur-md border border-glassyblue-200/40 shadow-2xl z-20 mb-2"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
      >
        <h1 className="text-2xl md:text-3xl font-extrabold text-glassyblue-700 tracking-tight drop-shadow-lg mr-8 whitespace-nowrap">
          Bangladesh Crime Map
        </h1>
        <div className="flex flex-row items-center gap-4 flex-1 justify-end">
          <label className="font-medium text-glassyblue-700">Crime Type:</label>
          <select
            value={filter}
            onChange={handleFilterChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
          >
            <option value="all">All</option>
            <option value="robbery">Robbery</option>
            <option value="assault">Assault</option>
            <option value="harassment">Harassment</option>
            <option value="theft">Theft</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={startRouteSelection}
            className="ml-4 px-6 py-2 rounded-full bg-glassyblue-500 text-black font-semibold shadow-lg hover:bg-glassyblue-600 transition-colors duration-200 backdrop-blur-md border border-white/20"
          >
            Safest Route
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <MapContainer
          center={[23.685, 90.3563]}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredCrimes.map((crime) => (
            <Marker
              key={crime.id}
              position={[crime.lat, crime.lng]}
              icon={getCrimeIcon(crime.type)}
            >
              <Popup>
                <div>
                  <strong>
                    {crime.type.charAt(0).toUpperCase() + crime.type.slice(1)}
                  </strong>
                  <br />
                  {crime.description}
                  <br />
                  <span className="text-xs text-gray-500">
                    {new Date(crime.time).toLocaleString()}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
          {route.length > 1 && (
            <Polyline
              positions={route.map((p) => [p.lat, p.lng])}
              color={networkType === "walk" ? "purple" : "green"}
            />
          )}
          {(routePoints[0] || (route.length > 1 && routePoints[0])) && (
            <Marker
              position={[
                routePoints[0]?.lat ?? route[0]?.lat,
                routePoints[0]?.lng ?? route[0]?.lng,
              ]}
              icon={
                new L.Icon({
                  iconUrl:
                    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })
              }
            />
          )}
          {(routePoints[1] ||
            (route.length > 1 && routePoints[route.length - 1])) && (
            <Marker
              position={[
                routePoints[1]?.lat ?? route[route.length - 1]?.lat,
                routePoints[1]?.lng ?? route[route.length - 1]?.lng,
              ]}
              icon={
                new L.Icon({
                  iconUrl:
                    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                })
              }
            />
          )}
          <LocationMarker onSelect={handleMapClick} />
        </MapContainer>
        {routeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
              <h2 className="text-xl font-bold mb-4">Find Safest Route</h2>
              <label className="block mb-2 font-medium">Route Type:</label>
              <select
                value={networkType}
                onChange={handleNetworkTypeChange}
                className="border rounded px-2 py-1 mb-4 w-full"
              >
                <option value="drive">Drive</option>
                <option value="walk">Walk</option>
              </select>
              <div className="mb-4">
                <p className="mb-1">Instructions:</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  <li>
                    After clicking 'Start Selecting', click on the map to select{" "}
                    <span className="font-semibold">source</span> (green
                    marker).
                  </li>
                  <li>
                    Then click to select{" "}
                    <span className="font-semibold">destination</span> (red
                    marker).
                  </li>
                </ul>
              </div>
              <div className="flex flex-row justify-end gap-2">
                <button
                  onClick={resetRouteSelection}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={beginSelectingRoute}
                  className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                >
                  Start Selecting
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
