import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapLayerFactory } from "@vgrid/react-leaflet-heatmap-layer";
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


const HeatmapLayer = HeatmapLayerFactory();

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


function debounce(func, wait) {
  let timeout;
  let currentPromise = null;

  return function executedFunction(...args) {
    if (currentPromise) {
      return currentPromise;
    }

    return new Promise((resolve) => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          currentPromise = func(...args);
          const result = await currentPromise;
          resolve(result);
        } finally {
          currentPromise = null;
        }
      }, wait);
    });
  };
}


function MapEvents({ onBoundsChange }) {
  const map = useMap();
  const isInitialMount = useRef(true);
  const debouncedBoundsChange = useRef(
    debounce(async (bounds) => {
      await onBoundsChange(bounds);
    }, 500)
  ).current;

  useEffect(() => {
    if (!map) return;

    const handleMoveEnd = () => {
      
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      const boundsObj = {
        _southWest: {
          lat: sw.lat,
          lng: sw.lng,
        },
        _northEast: {
          lat: ne.lat,
          lng: ne.lng,
        },
      };

      debouncedBoundsChange(boundsObj);
    };

    map.on("moveend", handleMoveEnd);

    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [map, debouncedBoundsChange]);

  return null;
}

export default function RiskAnalysisPage() {
  const { jwt } = useUser();
  const [crimes, setCrimes] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [bounds, setBounds] = useState(null);
  const [stats, setStats] = useState({
    dangerousDistricts: [],
    safestDistricts: [],
    hourlyStats: [],
    dailyStats: [],
    crimeTypeStats: [],
  });

  const previousBounds = useRef(null);
  const isInitialFetch = useRef(true);
  const currentFetch = useRef(null);

  
  const areBoundsDifferent = (oldBounds, newBounds) => {
    if (!oldBounds || !newBounds) return true;

    const threshold = 0.0001; 
    return (
      Math.abs(oldBounds._southWest.lat - newBounds._southWest.lat) >
        threshold ||
      Math.abs(oldBounds._southWest.lng - newBounds._southWest.lng) >
        threshold ||
      Math.abs(oldBounds._northEast.lat - newBounds._northEast.lat) >
        threshold ||
      Math.abs(oldBounds._northEast.lng - newBounds._northEast.lng) > threshold
    );
  };

  
  const fetchCrimesInBounds = useCallback(
    async (mapBounds, type = typeFilter) => {
      if (!mapBounds || !mapBounds._southWest || !mapBounds._northEast) {
        return;
      }

      const { _southWest: sw, _northEast: ne } = mapBounds;
      if (!sw.lat || !sw.lng || !ne.lat || !ne.lng) {
        return;
      }

      
      if (!areBoundsDifferent(previousBounds.current, mapBounds)) {
        return;
      }

      
      if (currentFetch.current) {
        currentFetch.current.abort();
      }

      
      const abortController = new AbortController();
      currentFetch.current = abortController;

      
      if (isInitialFetch.current) {
        setInitialLoading(true);
      } else {
        setUpdating(true);
      }

      try {
        const [crimesRes, statsRes] = await Promise.all([
          fetch(
            `/api/crimes/bounds?minLat=${sw.lat}&maxLat=${ne.lat}&minLng=${sw.lng}&maxLng=${ne.lng}&type=${type}`,
            {
              headers: { Authorization: jwt ? `Bearer ${jwt}` : undefined },
              signal: abortController.signal,
            }
          ),
          fetch("/api/crimes/district-stats", {
            headers: { Authorization: jwt ? `Bearer ${jwt}` : undefined },
            signal: abortController.signal,
          }),
        ]);

        if (!crimesRes.ok || !statsRes.ok) {
          throw new Error(
            `Failed to fetch data: Crimes ${crimesRes.status}, Stats ${statsRes.status}`
          );
        }

        const [crimesData, statsData] = await Promise.all([
          crimesRes.json(),
          statsRes.json(),
        ]);

        
        previousBounds.current = mapBounds;

        if (!crimesData || !Array.isArray(crimesData.crimes)) {
          throw new Error("Invalid crimes data format");
        }

        setCrimes(
          crimesData.crimes.map((c) => ({
            ...c,
            lat: c.location?.coordinates?.[1],
            lng: c.location?.coordinates?.[0],
            type: c.type?.toLowerCase(),
          }))
        );

        setStats(statsData);
      } catch (error) {
        
        if (error.name !== "AbortError") {
          setCrimes([]);
          setStats({
            dangerousDistricts: [],
            safestDistricts: [],
            hourlyStats: [],
            dailyStats: [],
            crimeTypeStats: [],
          });
        }
      } finally {
        
        if (currentFetch.current === abortController) {
          if (isInitialFetch.current) {
            setInitialLoading(false);
            isInitialFetch.current = false;
          } else {
            setUpdating(false);
          }
          currentFetch.current = null;
        }
      }
    },
    [jwt, typeFilter]
  );

  
  useEffect(() => {
    const initialBounds = {
      _southWest: { lat: 23.685 - 0.5, lng: 90.3563 - 0.5 },
      _northEast: { lat: 23.685 + 0.5, lng: 90.3563 + 0.5 },
    };
    fetchCrimesInBounds(initialBounds);


    return () => {
      if (currentFetch.current) {
        currentFetch.current.abort();
      }
    };
  }, [fetchCrimesInBounds]);

  
  const handleBoundsChange = useCallback(
    async (newBounds) => {
      setBounds(newBounds);
      await fetchCrimesInBounds(newBounds);
    },
    [fetchCrimesInBounds]
  );

  
  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setTypeFilter(newFilter);
    if (bounds) {
      fetchCrimesInBounds(bounds, newFilter);
    }
  };

  
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
      {initialLoading ? (
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
                onChange={handleFilterChange}
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
            <div className="relative">
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
                <MapEvents onBoundsChange={handleBoundsChange} />
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
              {updating && (
                <div className="absolute top-2 right-2 bg-white/80 px-3 py-1 rounded-full text-sm text-glassyblue-600 shadow-md">
                  Updating...
                </div>
              )}
            </div>
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