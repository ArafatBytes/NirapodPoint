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
import PhotonSearchBar from "../components/PhotonSearchBar";
import { isInBangladeshPolygon } from "../utils/bangladeshPolygon";

const crimeTypeColors = {
  murder: "#FF0000",
  rape: "#FF1493",
  kidnap: "#8A2BE2",
  assault: "#FF8C00",
  robbery: "#008080",
  harassment: "#FFD700",
  theft: "#00CED1",
  others: "#808080",
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
      if (!isInBangladeshPolygon(e.latlng.lat, e.latlng.lng)) {
        toast.error("Please select a location within Bangladesh.");
        return;
      }
      onSelect(e.latlng);
    },
  });
  return null;
}

const MapPage = () => {
  const [crimes, setCrimes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [bounds, setBounds] = useState(null);
  const [selectedLatLng, setSelectedLatLng] = useState(null);
  const [route, setRoute] = useState([]); 
  const [selectingRoute, setSelectingRoute] = useState(false);
  const [routePoints, setRoutePoints] = useState([]); 
  const [networkType, setNetworkType] = useState("drive"); 
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [showRouteInstruction, setShowRouteInstruction] = useState(false);
  const [mapCenter, setMapCenter] = useState([23.685, 90.3563]);
  const [searchMode, setSearchMode] = useState("source"); 
  const mapRef = useRef();
  const navigate = useNavigate();
  const { jwt } = useUser();

  
  const sourceToastId = useRef(null);
  const destToastId = useRef(null);


  const fetchCrimesInBounds = async (bounds, type = filter) => {
    if (!bounds) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/crimes/bounds?minLat=${bounds._southWest.lat}&maxLat=${bounds._northEast.lat}&minLng=${bounds._southWest.lng}&maxLng=${bounds._northEast.lng}&type=${type}`,
        {
          headers: { Authorization: jwt ? `Bearer ${jwt}` : undefined },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch crimes");
      const data = await res.json();
      setCrimes(
        data.crimes.map((c) => ({
          ...c,
          lat: c.location?.coordinates?.[1],
          lng: c.location?.coordinates?.[0],
        }))
      );
    } catch (err) {
      console.error("Error fetching crimes:", err);
      setCrimes([]);
    } finally {
      setLoading(false);
    }
  };


  const handleBoundsChange = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const newBounds = map.getBounds();
    setBounds(newBounds);
    fetchCrimesInBounds(newBounds);
  };


  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    if (bounds) {
      fetchCrimesInBounds(bounds, newFilter);
    }
  };


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

  const handleSearch = (place) => {
    setMapCenter([place.lat, place.lng]);
    if (mapRef.current) {
      mapRef.current.setView([place.lat, place.lng], 15);
    }
  };

  
  const handleMapClick = async (latlng) => {
    if (!isInBangladeshPolygon(latlng.lat, latlng.lng)) {
      toast.error("Please select a location within Bangladesh.");
      return;
    }

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
          console.error("Route calculation error:", err);
          setRouteError("Failed to calculate route");
        } finally {
          setRouteLoading(false);
        }
      }
    }
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
      <div className="flex-1 relative">
      
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto auto",
            alignItems: "center",
            justifyContent: "space-between",
            margin: "0 auto",
            marginTop: 80,
            marginBottom: 10,
            zIndex: 10,
            padding: "0px 32px",
            position: "relative",
          }}
        >
       
          <div
            style={{
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(12px)",
              borderRadius: 18,
              boxShadow: "0 4px 24px #0002",
              border: "1.5px solid #e5e7eb",
              padding: "18px 32px",
              fontWeight: 700,
              fontSize: 26,
              color: "#111",
              textAlign: "left",
              minWidth: 340,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 18,
              justifyContent: "space-between",
            }}
          >
            <span
              style={{ fontSize: 26, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              Bangladesh Crime Map
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontWeight: 500,
                fontSize: 16,
                marginLeft: 18,
              }}
            >
              <label style={{ color: "#2563eb" }}>Crime Type:</label>
              <select
                value={filter}
                onChange={handleFilterChange}
                style={{
                  borderRadius: 8,
                  padding: "6px 12px",
                  border: "1.5px solid #cbd5e1",
                  background: "rgba(255,255,255,0.7)",
                  fontSize: 15,
                  fontWeight: 500,
                  outline: "none",
                }}
              >
                <option value="all">All</option>
                <option value="murder">Murder</option>
                <option value="rape">Rape</option>
                <option value="kidnap">Kidnap</option>
                <option value="assault">Assault</option>
                <option value="robbery">Robbery</option>
                <option value="harassment">Harassment</option>
                <option value="theft">Theft</option>
                <option value="others">Others</option>
              </select>
            </div>
          </div>
        
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              onClick={startRouteSelection}
              style={{
                padding: "12px 32px",
                borderRadius: 16,
                background: "rgba(59,130,246,0.12)",
                color: "#2563eb",
                fontWeight: 700,
                fontSize: 18,
                border: "1.5px solid #cbd5e1",
                boxShadow: "0 2px 12px #0001",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              Safest Route
            </button>
          </div>
         
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            <PhotonSearchBar
              placeholder="Search for a place..."
              onSelect={handleSearch}
            />
          </div>
        </div>
        <MapContainer
          center={mapCenter}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          className="z-0"
          whenReady={(map) => {
         
            setBounds(map.target.getBounds());
            fetchCrimesInBounds(map.target.getBounds());
          }}
          onMoveEnd={handleBoundsChange}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {loading && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                <span className="text-glassyblue-600">Loading crimes...</span>
              </div>
            </div>
          )}
          {crimes.map((crime) => (
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
     
        <div
          style={{
            position: "fixed",
            top: "50%",
            transform: "translateY(-50%)",
            right: 32,
            zIndex: 40,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            boxShadow: "0 4px 24px #0002",
            border: "1.5px solid #e5e7eb",
            padding: "18px 24px",
            minWidth: 220,
            fontSize: 16,
            color: "#222",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
            Marker
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
              alt="Source"
              width={22}
              height={36}
            />
            <span>Source</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
              alt="Destination"
              width={22}
              height={36}
            />
            <span>Destination</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 22, height: 36 }}>
              <svg width="22" height="36" viewBox="0 0 40 60">
                <line
                  x1="20"
                  y1="24"
                  x2="20"
                  y2="58"
                  stroke="#888"
                  strokeWidth="2.5"
                />
                <circle
                  cx="20"
                  cy="18"
                  r="14"
                  fill="#FF0000"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <ellipse
                  cx="15"
                  cy="13"
                  rx="5"
                  ry="2.5"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </span>
            <span>Murder</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 22, height: 36 }}>
              <svg width="22" height="36" viewBox="0 0 40 60">
                <line
                  x1="20"
                  y1="24"
                  x2="20"
                  y2="58"
                  stroke="#888"
                  strokeWidth="2.5"
                />
                <circle
                  cx="20"
                  cy="18"
                  r="14"
                  fill="#FF1493"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <ellipse
                  cx="15"
                  cy="13"
                  rx="5"
                  ry="2.5"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </span>
            <span>Rape</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 22, height: 36 }}>
              <svg width="22" height="36" viewBox="0 0 40 60">
                <line
                  x1="20"
                  y1="24"
                  x2="20"
                  y2="58"
                  stroke="#888"
                  strokeWidth="2.5"
                />
                <circle
                  cx="20"
                  cy="18"
                  r="14"
                  fill="#8A2BE2"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <ellipse
                  cx="15"
                  cy="13"
                  rx="5"
                  ry="2.5"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </span>
            <span>Kidnap</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 22, height: 36 }}>
              <svg width="22" height="36" viewBox="0 0 40 60">
                <line
                  x1="20"
                  y1="24"
                  x2="20"
                  y2="58"
                  stroke="#888"
                  strokeWidth="2.5"
                />
                <circle
                  cx="20"
                  cy="18"
                  r="14"
                  fill="#FF8C00"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <ellipse
                  cx="15"
                  cy="13"
                  rx="5"
                  ry="2.5"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </span>
            <span>Assault</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 22, height: 36 }}>
              <svg width="22" height="36" viewBox="0 0 40 60">
                <line
                  x1="20"
                  y1="24"
                  x2="20"
                  y2="58"
                  stroke="#888"
                  strokeWidth="2.5"
                />
                <circle
                  cx="20"
                  cy="18"
                  r="14"
                  fill="#008080"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <ellipse
                  cx="15"
                  cy="13"
                  rx="5"
                  ry="2.5"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </span>
            <span>Robbery</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 22, height: 36 }}>
              <svg width="22" height="36" viewBox="0 0 40 60">
                <line
                  x1="20"
                  y1="24"
                  x2="20"
                  y2="58"
                  stroke="#888"
                  strokeWidth="2.5"
                />
                <circle
                  cx="20"
                  cy="18"
                  r="14"
                  fill="#FFD700"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <ellipse
                  cx="15"
                  cy="13"
                  rx="5"
                  ry="2.5"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </span>
            <span>Harassment</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 22, height: 36 }}>
              <svg width="22" height="36" viewBox="0 0 40 60">
                <line
                  x1="20"
                  y1="24"
                  x2="20"
                  y2="58"
                  stroke="#888"
                  strokeWidth="2.5"
                />
                <circle
                  cx="20"
                  cy="18"
                  r="14"
                  fill="#00CED1"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <ellipse
                  cx="15"
                  cy="13"
                  rx="5"
                  ry="2.5"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </span>
            <span>Theft</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "inline-block", width: 22, height: 36 }}>
              <svg width="22" height="36" viewBox="0 0 40 60">
                <line
                  x1="20"
                  y1="24"
                  x2="20"
                  y2="58"
                  stroke="#888"
                  strokeWidth="2.5"
                />
                <circle
                  cx="20"
                  cy="18"
                  r="14"
                  fill="#808080"
                  stroke="#fff"
                  strokeWidth="2"
                />
                <ellipse
                  cx="15"
                  cy="13"
                  rx="5"
                  ry="2.5"
                  fill="white"
                  opacity="0.5"
                />
              </svg>
            </span>
            <span>Others</span>
          </div>
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              width: "100%",
              margin: "10px 0 4px 0",
            }}
          />
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
            Route Type
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-block",
                width: 32,
                height: 0,
                borderTop: "5px solid #22c55e",
                borderRadius: 3,
              }}
            ></span>
            <span>Drive</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "inline-block",
                width: 32,
                height: 0,
                borderTop: "5px solid purple",
                borderRadius: 3,
              }}
            ></span>
            <span>Walk</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;