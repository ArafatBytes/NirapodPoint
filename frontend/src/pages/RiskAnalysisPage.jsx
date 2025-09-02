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
  murder: "#FF0000",
  harassment: "#FFD700",
  rape: "#FF1493",
  kidnap: "#8A2BE2",
  assault: "#FF8C00",
  robbery: "#008080",
  theft: "#00CED1",
  others: "#808080",
};

const typeLabels = {
  murder: "murder",
  harassment: "harassment",
  rape: "rape",
  kidnap: "kidnap",
  assault: "assault",
  robbery: "robbery",
  theft: "theft",
  others: "others",
};

export default function RiskAnalysisPage() {
  const { jwt } = useUser();
  const [crimes, setCrimes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [stats, setStats] = useState({
    dangerousDistricts: [],
    safestDistricts: [],
    hourlyStats: [],
    dailyStats: [],
    crimeTypeStats: [],
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [crimesRes, statsRes] = await Promise.all([
          fetch("/api/crimes", {
            headers: { Authorization: jwt ? `Bearer ${jwt}` : undefined },
          }),
          fetch("/api/crimes/district-stats", {
            headers: { Authorization: jwt ? `Bearer ${jwt}` : undefined },
          }),
        ]);

        if (!crimesRes.ok || !statsRes.ok)
          throw new Error("Failed to fetch data");

        const [crimesData, statsData] = await Promise.all([
          crimesRes.json(),
          statsRes.json(),
        ]);

        setCrimes(
          crimesData.map((c) => ({
            ...c,
            lat: c.location?.coordinates?.[1],
            lng: c.location?.coordinates?.[0],
            type: c.type?.toLowerCase(),
          }))
        );

        setStats(statsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setCrimes([]);
        setStats({
          dangerousDistricts: [],
          safestDistricts: [],
          hourlyStats: [],
          dailyStats: [],
          crimeTypeStats: [],
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [jwt]);

  
  const filteredCrimes =
    typeFilter === "all" ? crimes : crimes.filter((c) => c.type === typeFilter);

 
  const heatmapPoints = filteredCrimes
    .filter((c) => c.lat && c.lng)
    .map((c) => [c.lat, c.lng, 1]);

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
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6 text-center">
                <h2 className="font-semibold mb-2 text-glassyblue-700">
                  Top 5 Dangerous Districts
                </h2>
                <ul className="list-disc list-inside text-glassyblue-700">
                  {stats.dangerousDistricts.length === 0 ? (
                    <li>No data</li>
                  ) : (
                    stats.dangerousDistricts.map((district, index) => (
                      <li key={district.district} className="mb-2">
                        <span className="font-bold">{district.district}</span>:{" "}
                        <span className="text-red-600 font-semibold">
                          {district.crimeCount} crimes
                        </span>
                        <div className="text-sm text-gray-600 ml-5">
                          Most common: {district.mostCommonCrime}
                          <br />
                          Risk score: {district.severityScore.toFixed(1)}
                        </div>
                        {index === 0 && (
                          <span className="ml-2 text-red-500">
                            🔴 Highest Risk
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6 text-center">
                <h2 className="font-semibold mb-2 text-glassyblue-700">
                  Top 5 Safest Districts
                </h2>
                <ul className="list-disc list-inside text-glassyblue-700">
                  {stats.safestDistricts.length === 0 ? (
                    <li>No data</li>
                  ) : (
                    stats.safestDistricts.map((district, index) => (
                      <li key={district.district} className="mb-2">
                        <span className="font-bold">{district.district}</span>:{" "}
                        <span className="text-green-600 font-semibold">
                          {district.crimeCount} crimes
                        </span>
                        <div className="text-sm text-gray-600 ml-5">
                          Most common: {district.mostCommonCrime}
                          <br />
                          Risk score: {district.severityScore.toFixed(1)}
                        </div>
                        {index === 0 && (
                          <span className="ml-2 text-green-500">✅ Safest</span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
       
          <div className="lg:w-1/3 w-full flex flex-col gap-6">
            <div className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6">
              <h2 className="font-semibold mb-2 text-glassyblue-700">
                Crimes by Hour
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.hourlyStats}>
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
                <BarChart data={stats.dailyStats}>
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
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stats.crimeTypeStats}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    label={({ type }) => typeLabels[type]}
                  >
                    {stats.crimeTypeStats.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={crimeTypeColors[entry.type] || "#808080"}
                      />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => typeLabels[value]}
                    wrapperStyle={{ paddingTop: "10px" }}
                  />
                  <Tooltip
                    formatter={(value, name) => [value, typeLabels[name]]}
                    wrapperStyle={{ zIndex: 100 }}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      padding: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}