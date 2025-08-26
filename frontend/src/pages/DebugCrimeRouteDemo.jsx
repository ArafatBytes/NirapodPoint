import React, { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcons = {
  crime: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  start: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
  end: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  }),
};

function MapClickHandler({ onCrime, onStart, onEnd, mode }) {
  useMapEvents({
    click(e) {
      if (mode === "crime") onCrime(e.latlng);
      if (mode === "start") onStart(e.latlng);
      if (mode === "end") onEnd(e.latlng);
    },
  });
  return null;
}

export default function DebugCrimeRouteDemo() {
  const [crime, setCrime] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [mode, setMode] = useState("crime");
  const [networkType, setNetworkType] = useState("drive");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [route, setRoute] = useState([]);
  const [edgeWeights, setEdgeWeights] = useState([]);
  const [allPaths, setAllPaths] = useState([]);
  const [allPathScores, setAllPathScores] = useState([]);
  const [altPaths, setAltPaths] = useState([]);
  const [altPathScores, setAltPathScores] = useState([]);

  const pathColors = ["#22c55e", "#f59e42", "#a21caf", "#2563eb", "#eab308"]; // green, orange, purple, blue, yellow

  const handleSubmit = async () => {
    setResult("");
    setError("");
    setRoute([]);
    if (!crime || !start || !end) {
      setError("Please select all points on the map.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/routes/debug-crime-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crimeLat: crime.lat,
          crimeLng: crime.lng,
          startLat: start.lat,
          startLng: start.lng,
          endLat: end.lat,
          endLng: end.lng,
          networkType,
        }),
      });
      const data = await res.json();
      setResult(data.result);
      setRoute(data.route || []);
      setEdgeWeights(data.edgeWeights || []);
      setAllPaths(data.allPaths || []);
      setAllPathScores(data.allPathScores || []);
      setAltPaths(data.altPaths || []);
      setAltPathScores(data.altPathScores || []);
    } catch (e) {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "40px auto",
        padding: 24,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px #0001",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 16 }}>
        Debug Crime Route Demo
      </h2>
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 8,
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => setMode("crime")}
          style={{
            background: mode === "crime" ? "#ef4444" : "#eee",
            color: mode === "crime" ? "#fff" : "#222",
            border: 0,
            borderRadius: 6,
            padding: "6px 16px",
          }}
        >
          Set Crime
        </button>
        <button
          onClick={() => setMode("start")}
          style={{
            background: mode === "start" ? "#22c55e" : "#eee",
            color: mode === "start" ? "#fff" : "#222",
            border: 0,
            borderRadius: 6,
            padding: "6px 16px",
          }}
        >
          Set Start
        </button>
        <button
          onClick={() => setMode("end")}
          style={{
            background: mode === "end" ? "#a21caf" : "#eee",
            color: mode === "end" ? "#fff" : "#222",
            border: 0,
            borderRadius: 6,
            padding: "6px 16px",
          }}
        >
          Set End
        </button>
        <select
          value={networkType}
          onChange={(e) => setNetworkType(e.target.value)}
          style={{
            borderRadius: 6,
            padding: "6px 12px",
            border: "1px solid #ccc",
          }}
        >
          <option value="drive">Drive</option>
          <option value="walk">Walk</option>
        </select>
      </div>
      <div style={{ height: 350, marginBottom: 16 }}>
        <MapContainer
          center={[23.75, 90.39]}
          zoom={16}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {crime && (
            <Marker
              position={[crime.lat, crime.lng]}
              icon={markerIcons.crime}
            />
          )}
          {start && (
            <Marker
              position={[start.lat, start.lng]}
              icon={markerIcons.start}
            />
          )}
          {end && (
            <Marker position={[end.lat, end.lng]} icon={markerIcons.end} />
          )}
          {route.length > 1 && (
            <Polyline
              positions={route.map((p) => [p.lat, p.lng])}
              color={pathColors[0]}
              weight={6}
            />
          )}
          {altPaths.map((alt, idx) =>
            alt.length > 0 ? (
              <Polyline
                key={idx}
                positions={[
                  [alt[0].fromLat, alt[0].fromLng],
                  ...alt.map((e) => [e.toLat, e.toLng]),
                ]}
                color={pathColors[(idx + 1) % pathColors.length]}
                weight={4}
                dashArray="8 8"
              />
            ) : null
          )}
          <MapClickHandler
            onCrime={setCrime}
            onStart={setStart}
            onEnd={setEnd}
            mode={mode}
          />
        </MapContainer>
      </div>
      <div style={{ marginBottom: 12, fontSize: 15 }}>
        <div>
          Crime:{" "}
          {crime ? (
            `${crime.lat.toFixed(6)}, ${crime.lng.toFixed(6)}`
          ) : (
            <span style={{ color: "#aaa" }}>Not set</span>
          )}
        </div>
        <div>
          Start:{" "}
          {start ? (
            `${start.lat.toFixed(6)}, ${start.lng.toFixed(6)}`
          ) : (
            <span style={{ color: "#aaa" }}>Not set</span>
          )}
        </div>
        <div>
          End:{" "}
          {end ? (
            `${end.lat.toFixed(6)}, ${end.lng.toFixed(6)}`
          ) : (
            <span style={{ color: "#aaa" }}>Not set</span>
          )}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%",
          background: "#2563eb",
          color: "#fff",
          border: 0,
          borderRadius: 8,
          padding: "10px 0",
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 10,
        }}
      >
        {loading ? "Checking..." : "Check if route passes near crime"}
      </button>
      {result && (
        <div
          style={{
            textAlign: "center",
            fontSize: 18,
            fontWeight: 600,
            color: result === "yes" ? "#ef4444" : "#22c55e",
          }}
        >
          {result === "yes"
            ? "Route passes near the crime!"
            : "Route avoids the crime."}
        </div>
      )}
      {error && (
        <div style={{ color: "#ef4444", textAlign: "center", marginTop: 8 }}>
          {error}
        </div>
      )}
      {edgeWeights.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h4 style={{ fontWeight: 600, marginBottom: 6 }}>
            A* Path (Optimal):
          </h4>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            Total Crime Score:{" "}
            <span
              style={{
                color:
                  edgeWeights.reduce((a, b) => a + b.weight, 0) > 0
                    ? "#ef4444"
                    : "#22c55e",
                fontWeight: 600,
              }}
            >
              {edgeWeights.reduce((a, b) => a + b.weight, 0).toFixed(3)}
            </span>
          </div>
          <ul
            style={{
              fontSize: 15,
              background: "#f8fafc",
              borderRadius: 8,
              padding: 12,
              border: "1px solid #e5e7eb",
            }}
          >
            {edgeWeights.map((e, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                <span style={{ color: "#2563eb" }}>
                  ({e.fromLat.toFixed(5)}, {e.fromLng.toFixed(5)}) → (
                  {e.toLat.toFixed(5)}, {e.toLng.toFixed(5)})
                </span>
                {": "}
                <span
                  style={{
                    color: e.weight > 0 ? "#ef4444" : "#222",
                    fontWeight: e.weight > 0 ? 600 : 400,
                  }}
                >
                  {e.weight.toFixed(3)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {altPaths.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <h4 style={{ fontWeight: 600, marginBottom: 6 }}>
            Alternative Paths:
          </h4>
          {altPaths.map((path, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: 12,
                padding: 10,
                background: "#f1f5f9",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                Path {idx + 1} — Total Crime Score:{" "}
                <span
                  style={{
                    color: altPathScores[idx] > 0 ? "#ef4444" : "#22c55e",
                    fontWeight: 600,
                  }}
                >
                  {altPathScores[idx].toFixed(3)}
                </span>
              </div>
              <ul style={{ fontSize: 15, marginLeft: 8 }}>
                {path.map((e, i) => (
                  <li key={i} style={{ marginBottom: 2 }}>
                    <span style={{ color: "#2563eb" }}>
                      ({e.fromLat.toFixed(5)}, {e.fromLng.toFixed(5)}) → (
                      {e.toLat.toFixed(5)}, {e.toLng.toFixed(5)})
                    </span>
                    {": "}
                    <span
                      style={{
                        color: e.weight > 0 ? "#ef4444" : "#222",
                        fontWeight: e.weight > 0 ? 600 : 400,
                      }}
                    >
                      {e.weight.toFixed(3)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}