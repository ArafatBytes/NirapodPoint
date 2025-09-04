import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "../context/UserContext";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { HeatmapLayerFactory } from "@vgrid/react-leaflet-heatmap-layer";
import {
  Box,
  Flex,
  Text,
  Select,
  SimpleGrid,
  useColorModeValue,
  Icon,
  Spinner,
} from "@chakra-ui/react";
import Card from "../components/card/Card";
import {
  MdLocationOn,
  MdOutlineWarning,
  MdSecurity,
  MdTimeline,
} from "react-icons/md";
import IconBox from "../components/icons/IconBox";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import FixedPlugin from "../components/fixedPlugin/FixedPlugin";

// Create the HeatmapLayer component from the factory
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

// Purple shades from Horizon UI theme
const purpleShades = [
  "#E9E3FF", // brand.100
  "#7551FF", // brand.400
  "#422AFB", // brand.500
  "#3311DB", // brand.600
  "#190793", // brand.800
  "#11047A", // brand.900
  "#a259ec", // custom
  "#6c47ff", // custom
  "#b39ddb", // custom
  "#9575cd", // custom
  "#7e57c2", // custom
  "#5e35b1", // custom
  "#512da8", // custom
  "#4527a0", // custom
  "#311b92", // custom
  "#ede7f6", // custom
  "#d1c4e9", // custom
  "#b39ddb", // custom
  "#9575cd", // custom
  "#7e57c2", // custom
  "#5e35b1", // custom
  "#512da8", // custom
  "#4527a0", // custom
  "#311b92", // custom
];

// Debounce function with promise support
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

// Add MapEvents component to handle map movements
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
      // Skip if this is the initial mount
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

// Animation variants
const fadeDown = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};
const staggerGrid = {
  visible: { transition: { staggerChildren: 0.15 } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};
const pulse = {
  animate: {
    opacity: [1, 0.7, 1],
    transition: { repeat: Infinity, duration: 1.2 },
  },
};

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

  // Function to check if bounds are significantly different
  const areBoundsDifferent = (oldBounds, newBounds) => {
    if (!oldBounds || !newBounds) return true;

    const threshold = 0.0001; // About 11 meters at the equator
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

  // Function to fetch crimes within bounds
  const fetchCrimesInBounds = useCallback(
    async (mapBounds, type = typeFilter) => {
      if (!mapBounds || !mapBounds._southWest || !mapBounds._northEast) {
        return;
      }

      const { _southWest: sw, _northEast: ne } = mapBounds;
      if (!sw.lat || !sw.lng || !ne.lat || !ne.lng) {
        return;
      }

      // Check if the bounds have changed significantly
      if (!areBoundsDifferent(previousBounds.current, mapBounds)) {
        return;
      }

      // Cancel any ongoing fetch
      if (currentFetch.current) {
        currentFetch.current.abort();
      }

      // Create new abort controller for this fetch
      const abortController = new AbortController();
      currentFetch.current = abortController;

      // Set appropriate loading state
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

        // Update previous bounds after successful fetch
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
        // Only handle error if it's not an abort error
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
        // Only update loading states if this is still the current fetch
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

  // Add initial data fetch when component mounts
  useEffect(() => {
    const initialBounds = {
      _southWest: { lat: 23.685 - 0.5, lng: 90.3563 - 0.5 },
      _northEast: { lat: 23.685 + 0.5, lng: 90.3563 + 0.5 },
    };
    fetchCrimesInBounds(initialBounds);

    // Cleanup function to abort any ongoing fetch when component unmounts
    return () => {
      if (currentFetch.current) {
        currentFetch.current.abort();
      }
    };
  }, [fetchCrimesInBounds]);

  // Handle bounds change
  const handleBoundsChange = useCallback(
    async (newBounds) => {
      setBounds(newBounds);
      await fetchCrimesInBounds(newBounds);
    },
    [fetchCrimesInBounds]
  );

  // Handle filter change
  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setTypeFilter(newFilter);
    if (bounds) {
      fetchCrimesInBounds(bounds, newFilter);
    }
  };

  // Filtered crimes for heatmap
  const filteredCrimes =
    typeFilter === "all" ? crimes : crimes.filter((c) => c.type === typeFilter);

  // Heatmap points: [lat, lng, intensity]
  const heatmapPoints = filteredCrimes
    .filter((c) => c.lat && c.lng)
    .map((c) => [c.lat, c.lng, 1]);

  // Chakra Color Mode
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const cardBg = useColorModeValue("white", "navy.700");
  const cardShadow = useColorModeValue(
    "0px 18px 40px rgba(112, 144, 176, 0.12)",
    "unset"
  );

  return (
    <Box
      pt={{ base: "130px", md: "80px", xl: "80px" }}
      mt={12}
      mb={12}
      ml={12}
      mr={12}
    >
      <motion.div variants={fadeDown} initial="hidden" animate="visible">
        <Text
          textAlign="center"
          fontSize="3xl"
          fontWeight="extrabold"
          color={textColor}
          mb="8"
          dropShadow="lg"
        >
          Risk Analysis
        </Text>
      </motion.div>
      {initialLoading ? (
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color="brand.500" thickness="4px" speed="0.65s" />
        </Flex>
      ) : (
        <motion.div variants={staggerGrid} initial="hidden" animate="visible">
          {/* Main Grid */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="20px" mb="20px">
            {/* Map Card */}
            <motion.div variants={scaleIn}>
              <Card>
                <Flex direction="column" mb="40px">
                  <Flex align="center" mb="20px">
                    <IconBox
                      w="56px"
                      h="56px"
                      bg={boxBg}
                      icon={
                        <Icon
                          w="32px"
                          h="32px"
                          as={MdLocationOn}
                          color={brandColor}
                        />
                      }
                    />
                    <Text
                      ms="16px"
                      fontSize="2xl"
                      fontWeight="700"
                      color={textColor}
                    >
                      Crime Heatmap
                    </Text>
                  </Flex>
                  <Flex direction="column">
                    <Flex align="center" mb={4}>
                      <Text
                        fontSize="md"
                        fontWeight="500"
                        color={textColor}
                        me={2}
                      >
                        Crime Type:
                      </Text>
                      <Select
                        value={typeFilter}
                        onChange={handleFilterChange}
                        w="200px"
                        variant="filled"
                        bg={boxBg}
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
                      </Select>
                    </Flex>
                    <Box
                      position="relative"
                      h="400px"
                      borderRadius="16px"
                      overflow="hidden"
                    >
                      <motion.div
                        variants={scaleIn}
                        initial="hidden"
                        animate="visible"
                        style={{ height: "100%" }}
                      >
                        <MapContainer
                          center={[23.685, 90.3563]}
                          zoom={7}
                          style={{ width: "100%", height: "100%", zIndex: 1 }}
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
                      </motion.div>
                      <AnimatePresence>
                        {updating && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            style={{ position: "absolute", top: 8, right: 8 }}
                          >
                            <motion.div variants={pulse} animate="animate">
                              <Flex
                                bg="whiteAlpha.900"
                                px={3}
                                py={1}
                                borderRadius="full"
                                align="center"
                                shadow="md"
                              >
                                <Spinner size="sm" color="brand.500" mr={2} />
                                <Text fontSize="sm" color="gray.600">
                                  Updating...
                                </Text>
                              </Flex>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </Flex>
                </Flex>
              </Card>
            </motion.div>

            {/* Statistics Cards */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="20px">
              {/* Dangerous Districts Card */}
              <motion.div
                variants={fadeLeft}
                initial="hidden"
                animate="visible"
              >
                <Card>
                  <Flex direction="column">
                    <Flex align="center" mb="20px">
                      <IconBox
                        w="56px"
                        h="56px"
                        bg={boxBg}
                        icon={
                          <Icon
                            w="32px"
                            h="32px"
                            as={MdOutlineWarning}
                            color="red.500"
                          />
                        }
                      />
                      <Text
                        ms="16px"
                        fontSize="lg"
                        fontWeight="700"
                        color={textColor}
                      >
                        High Risk Areas
                      </Text>
                    </Flex>
                    <Box>
                      <AnimatePresence>
                        {stats.dangerousDistricts.map((district, index) => (
                          <motion.div
                            key={district.district}
                            variants={fadeLeft}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ delay: index * 0.08 }}
                          >
                            <Flex
                              justify="space-between"
                              align="center"
                              mb={2}
                              p={3}
                              bg={boxBg}
                              borderRadius="12px"
                            >
                              <Box>
                                <Text fontWeight="600" color={textColor}>
                                  {district.district}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  Most common: {district.mostCommonCrime}
                                </Text>
                              </Box>
                              <Box textAlign="right">
                                <Text fontWeight="600" color="red.500">
                                  {district.crimeCount} crimes
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  Risk: {district.severityScore.toFixed(1)}
                                </Text>
                              </Box>
                            </Flex>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </Box>
                  </Flex>
                </Card>
              </motion.div>

              {/* Safest Districts Card */}
              <motion.div
                variants={fadeRight}
                initial="hidden"
                animate="visible"
              >
                <Card>
                  <Flex direction="column">
                    <Flex align="center" mb="20px">
                      <IconBox
                        w="56px"
                        h="56px"
                        bg={boxBg}
                        icon={
                          <Icon
                            w="32px"
                            h="32px"
                            as={MdSecurity}
                            color="green.500"
                          />
                        }
                      />
                      <Text
                        ms="16px"
                        fontSize="lg"
                        fontWeight="700"
                        color={textColor}
                      >
                        Safe Areas
                      </Text>
                    </Flex>
                    <Box>
                      <AnimatePresence>
                        {stats.safestDistricts.map((district, index) => (
                          <motion.div
                            key={district.district}
                            variants={fadeRight}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            transition={{ delay: index * 0.08 }}
                          >
                            <Flex
                              justify="space-between"
                              align="center"
                              mb={2}
                              p={3}
                              bg={boxBg}
                              borderRadius="12px"
                            >
                              <Box>
                                <Text fontWeight="600" color={textColor}>
                                  {district.district}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  Most common: {district.mostCommonCrime}
                                </Text>
                              </Box>
                              <Box textAlign="right">
                                <Text fontWeight="600" color="green.500">
                                  {district.crimeCount} crimes
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  Risk: {district.severityScore.toFixed(1)}
                                </Text>
                              </Box>
                            </Flex>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </Box>
                  </Flex>
                </Card>
              </motion.div>
            </SimpleGrid>
          </SimpleGrid>

          {/* Charts Grid */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap="20px">
            {/* Hourly Stats Card */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <Card>
                <Flex direction="column">
                  <Flex align="center" mb="20px">
                    <IconBox
                      w="56px"
                      h="56px"
                      bg={boxBg}
                      icon={
                        <Icon
                          w="32px"
                          h="32px"
                          as={MdTimeline}
                          color={brandColor}
                        />
                      }
                    />
                    <Text
                      ms="16px"
                      fontSize="lg"
                      fontWeight="700"
                      color={textColor}
                    >
                      Hourly Crime Trends
                    </Text>
                  </Flex>
                  <Box h="240px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.hourlyStats}>
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {stats.hourlyStats.map((entry, idx) => (
                            <Cell
                              key={`cell-hour-${idx}`}
                              fill={purpleShades[idx % purpleShades.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Flex>
              </Card>
            </motion.div>

            {/* Daily Stats Card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
            >
              <Card>
                <Flex direction="column">
                  <Flex align="center" mb="20px">
                    <IconBox
                      w="56px"
                      h="56px"
                      bg={boxBg}
                      icon={
                        <Icon
                          w="32px"
                          h="32px"
                          as={MdTimeline}
                          color={brandColor}
                        />
                      }
                    />
                    <Text
                      ms="16px"
                      fontSize="lg"
                      fontWeight="700"
                      color={textColor}
                    >
                      Daily Crime Patterns
                    </Text>
                  </Flex>
                  <Box h="240px">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.dailyStats}>
                        <XAxis dataKey="day" />
                        <YAxis />
                        <RechartsTooltip />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {stats.dailyStats.map((entry, idx) => (
                            <Cell
                              key={`cell-day-${idx}`}
                              fill={purpleShades[idx % purpleShades.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Flex>
              </Card>
            </motion.div>

            {/* Crime Type Distribution Card */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <Card>
                <Flex direction="column">
                  <Flex align="center" mb="20px">
                    <IconBox
                      w="56px"
                      h="56px"
                      bg={boxBg}
                      icon={
                        <Icon
                          w="32px"
                          h="32px"
                          as={MdTimeline}
                          color={brandColor}
                        />
                      }
                    />
                    <Text
                      ms="16px"
                      fontSize="lg"
                      fontWeight="700"
                      color={textColor}
                    >
                      Crime Type Distribution
                    </Text>
                  </Flex>
                  <Box h="240px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.crimeTypeStats}
                          dataKey="count"
                          nameKey="type"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
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
                          wrapperStyle={{
                            fontSize: "12px",
                            paddingTop: "10px",
                          }}
                        />
                        <RechartsTooltip
                          formatter={(value, name) => [value, typeLabels[name]]}
                          contentStyle={{
                            backgroundColor: cardBg,
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Flex>
              </Card>
            </motion.div>
          </SimpleGrid>
        </motion.div>
      )}
      <FixedPlugin />
    </Box>
  );
}