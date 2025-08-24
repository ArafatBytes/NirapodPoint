import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const crimeTypeColors = {
  robbery: "#ef4444",
  assault: "#a21caf",
  harassment: "#eab308",
  theft: "#2563eb",
  other: "#64748b",
};

const typeLabels = {
  robbery: "Robbery",
  assault: "Assault",
  harassment: "Harassment",
  theft: "Theft",
  other: "Other",
};

export default function RiskAnalysisPage() {
  const { jwt } = useUser();
  const [crimes, setCrimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    async function fetchCrimes() {
      setLoading(true);
      try {
        const res = await fetch("/api/crimes", {
          headers: { Authorization: jwt ? `Bearer ${jwt}` : undefined },
        });
        if (!res.ok) throw new Error("Failed to fetch crimes");
        const data = await res.json();
        setCrimes(
          data.map((c) => ({
            ...c,
            lat: c.location?.coordinates?.[1],
            lng: c.location?.coordinates?.[0],
            type: c.type?.toLowerCase(),
          }))
        );
      } catch {
        setCrimes([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCrimes();
  }, [jwt]);

  const filteredCrimes =
    typeFilter === "all" ? crimes : crimes.filter((c) => c.type === typeFilter);

  const heatmapPoints = filteredCrimes
    .filter((c) => c.lat && c.lng)
    .map((c) => [c.lat, c.lng, 1]);

  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    count: 0,
  }));
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayData = dayNames.map((day) => ({ day, count: 0 }));
  const typeData = Object.keys(crimeTypeColors).map((type) => ({
    type: typeLabels[type],
    count: 0,
    color: crimeTypeColors[type],
  }));
  const districtCounts = {};
  filteredCrimes.forEach((c) => {
    if (c.time) {
      const d = new Date(c.time);
      hourData[d.getHours()].count++;
      dayData[d.getDay()].count++;
    }
    const t = c.type;
    if (t && crimeTypeColors[t]) {
      const idx = Object.keys(crimeTypeColors).indexOf(t);
      if (idx !== -1) typeData[idx].count++;
    }
    if (c.district) {
      districtCounts[c.district] = (districtCounts[c.district] || 0) + 1;
    }
  });
  const topDistricts = Object.entries(districtCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const safeDistricts = Object.entries(districtCounts)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-glassyblue-100 via-white to-glassyblue-200 pt-24 pb-12 px-2">
      <h1 className="text-3xl md:text-4xl font-extrabold text-glassyblue-700 mb-8 text-center drop-shadow-lg">
        Risk Analysis
      </h1>
      {loading ? (
        <div className="text-center text-lg text-glassyblue-600">
          Loading...
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          <div className="lg:w-2/3 w-full rounded-3xl shadow-xl bg-white/30 backdrop-blur-xl border border-glassyblue-200/40 p-4 mb-6 lg:mb-0">
            <div className="flex flex-row items-center mb-4 gap-4">
              <label className="font-medium text-glassyblue-700">
                Crime Type:
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
              >
                <option value="all">All</option>
                <option value="robbery">Robbery</option>
                <option value="assault">Assault</option>
                <option value="harassment">Harassment</option>
                <option value="theft">Theft</option>
                <option value="other">Other</option>
              </select>
            </div>
            <MapContainer
              center={[23.685, 90.3563]}
              zoom={7}
              style={{ width: "100%", height: "400px" }}
              className="rounded-2xl z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {heatmapPoints.length > 0 && (
                <HeatmapLayer
                  fitBoundsOnLoad
                  fitBoundsOnUpdate
                  points={heatmapPoints}
                  longitudeExtractor={(m) => m[1]}
                  latitudeExtractor={(m) => m[0]}
                  intensityExtractor={(m) => m[2]}
                  radius={20}
                  blur={18}
                  max={2}
                />
              )}
            </MapContainer>
          </div>
          <div className="lg:w-1/3 w-full flex flex-col gap-6">
            <div className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6">
              <h2 className="font-semibold mb-2 text-glassyblue-700">
                Crimes by Hour
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={hourData.filter((h) => h.count > 0)}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6">
              <h2 className="font-semibold mb-2 text-glassyblue-700">
                Crimes by Day
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dayData.filter((d) => d.count > 0)}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6">
              <h2 className="font-semibold mb-2 text-glassyblue-700">
                Crime Type Distribution
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={typeData.filter((t) => t.count > 0)}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label
                  >
                    {typeData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6">
              <h2 className="font-semibold mb-2 text-glassyblue-700">
                Top 5 Dangerous Districts
              </h2>
              <ul className="list-disc list-inside text-glassyblue-700">
                {topDistricts.length === 0 ? (
                  <li>No data</li>
                ) : (
                  topDistricts.map(([district, count]) => (
                    <li key={district}>
                      <span className="font-bold">{district}</span>: {count}{" "}
                      crimes
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6">
              <h2 className="font-semibold mb-2 text-glassyblue-700">
                Top 5 Safest Districts
              </h2>
              <ul className="list-disc list-inside text-glassyblue-700">
                {safeDistricts.length === 0 ? (
                  <li>No data</li>
                ) : (
                  safeDistricts.map(([district, count]) => (
                    <li key={district}>
                      <span className="font-bold">{district}</span>: {count}{" "}
                      crimes
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
