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
import Card from "../components/card/Card";
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  useColorModeValue,
  Icon,
  List,
  ListItem,
  Spinner,
  InputGroup,
  InputRightElement,
  Input,
  InputLeftElement,
  Select,
  Button,
  Divider,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import { AnimatePresence } from "framer-motion";
import FixedPlugin from "../components/fixedPlugin/FixedPlugin";

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

// Custom icon for markers
const getCrimeIcon = (type) => {
  const color = crimeTypeColors[type?.toLowerCase()] || "gray";
  // SVG for a modern pin: thin pin, solid colored ball, white highlight
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
    iconAnchor: [20, 58], // tip of the pin
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

// MapSearchBar (Chakra UI style, ported from ReportPage)
function MapSearchBar({ placeholder, onSelect }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef();
  const timeoutRef = useRef();

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(
          q
        )}&limit=5&bbox=88.0,20.5,92.7,26.7`
      );
      const data = await res.json();
      setSuggestions(
        (data.features || []).map((f) => ({
          name:
            f.properties.name || f.properties.city || f.properties.country || q,
          desc: f.properties.country
            ? `${f.properties.city ? f.properties.city + ", " : ""}${
                f.properties.country
              }`
            : "",
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }))
      );
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowDropdown(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (s) => {
    setQuery(s.name);
    setShowDropdown(false);
    setSuggestions([]);
    onSelect && onSelect(s);
  };

  React.useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const bg = useColorModeValue("secondaryGray.300", "navy.900");
  const border = useColorModeValue("secondaryGray.400", "whiteAlpha.300");
  const dropdownBg = useColorModeValue("white", "navy.800");
  const highlight = useColorModeValue("brand.100", "brand.700");
  const textColor = useColorModeValue("gray.700", "white");
  const descColor = useColorModeValue("gray.500", "gray.300");
  const shadow = useColorModeValue("lg", "dark-lg");

  return (
    <Box ref={inputRef} w={{ base: "90vw", md: "320px" }} position="relative">
      <InputGroup size="lg">
        <InputLeftElement pointerEvents="none">
          <Icon as={SearchIcon} color="brand.400" boxSize={6} />
        </InputLeftElement>
        <Input
          value={query}
          onChange={handleChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder || "Search for a place..."}
          borderRadius="30px"
          borderWidth="2px"
          borderColor={border}
          bg={bg}
          color={textColor}
          fontWeight={500}
          fontSize={"lg"}
          boxShadow={shadow}
          _hover={{ borderColor: "brand.400" }}
          _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 2px #7551FF" }}
          pr={12}
        />
        {loading && (
          <InputRightElement width="2.5rem" pr={2}>
            <Spinner size="sm" color="brand.400" />
          </InputRightElement>
        )}
      </InputGroup>
      {showDropdown && suggestions.length > 0 && (
        <Box
          position="absolute"
          top={14}
          left={0}
          w="100%"
          minW={0}
          zIndex={100}
          bg={dropdownBg}
          borderRadius="2xl"
          boxShadow={shadow}
          borderWidth="2px"
          borderColor={border}
          mt={2}
          py={2}
        >
          <List spacing={1}>
            {suggestions.map((s, i) => (
              <ListItem
                key={i}
                px={4}
                py={3}
                borderRadius="xl"
                cursor="pointer"
                bg={i === 0 ? highlight : "transparent"}
                _hover={{ bg: highlight }}
                transition="background 0.15s"
                onClick={() => handleSelect(s)}
                onMouseDown={(e) => e.preventDefault()}
                display="flex"
                alignItems="center"
              >
                <Text fontWeight={600} color={textColor} fontSize="md">
                  {s.name}
                </Text>
                {s.desc && (
                  <Text color={descColor} fontSize="sm" ml={2}>
                    {s.desc}
                  </Text>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}

const MapPage = () => {
  const [crimes, setCrimes] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [bounds, setBounds] = useState(null);
  const [selectedLatLng, setSelectedLatLng] = useState(null);
  const [route, setRoute] = useState([]); // Array of latlngs
  const [selectingRoute, setSelectingRoute] = useState(false);
  const [routePoints, setRoutePoints] = useState([]); // [start, end]
  const [networkType, setNetworkType] = useState("drive"); // 'drive' or 'walk'
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [showRouteInstruction, setShowRouteInstruction] = useState(false);
  const [routeInstruction, setRouteInstruction] = useState("");
  const [mapCenter, setMapCenter] = useState([23.685, 90.3563]);
  const [searchMode, setSearchMode] = useState("source"); // "source" or "destination"
  const [isMobileLegendOpen, setIsMobileLegendOpen] = useState(false);
  const mapRef = useRef();
  const navigate = useNavigate();
  const { jwt } = useUser();

  // Dark mode colors
  const bgColor = useColorModeValue("gray.100", "navy.900");
  const cardBg = useColorModeValue("white", "navy.700");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const headingColor = useColorModeValue("brand.500", "white");
  const borderColor = useColorModeValue("secondaryGray.400", "whiteAlpha.300");
  const selectBg = useColorModeValue("whiteAlpha.800", "navy.800");
  const mapBg = useColorModeValue("white", "navy.700");
  const loadingBg = useColorModeValue("whiteAlpha.700", "blackAlpha.700");
  const legendBg = useColorModeValue("white", "navy.700");
  const legendTextColor = useColorModeValue("secondaryGray.900", "white");
  const legendHeadingColor = useColorModeValue("brand.500", "white");

  // Function to fetch crimes within current map bounds
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

  // Update crimes when map bounds change
  const handleBoundsChange = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const newBounds = map.getBounds();
    setBounds(newBounds);
    fetchCrimesInBounds(newBounds);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const newFilter = e.target.value;
    setFilter(newFilter);
    if (bounds) {
      fetchCrimesInBounds(bounds, newFilter);
    }
  };

  // Handle network type change
  const handleNetworkTypeChange = (e) => setNetworkType(e.target.value);

  // Handle start route selection
  const startRouteSelection = () => {
    setRouteModalOpen(true);
    setSelectingRoute(false);
    setRoutePoints([]);
    setRoute([]);
    setRouteError("");
    setShowRouteInstruction(false);
  };

  const beginSelectingRoute = () => {
    setSelectingRoute(true);
    setRoutePoints([]);
    setRoute([]);
    setRouteError("");
    setShowRouteInstruction(true);
    setRouteInstruction("Click on the map to select source (green marker).");
    setRouteModalOpen(false);
  };

  const resetRouteSelection = () => {
    setSelectingRoute(false);
    setRoutePoints([]);
    setRoute([]);
    setRouteModalOpen(false);
    setRouteError("");
    setShowRouteInstruction(false);
    setRouteInstruction("");
  };

  const handleSearch = (place) => {
    setMapCenter([place.lat, place.lng]);
    if (mapRef.current) {
      mapRef.current.setView([place.lat, place.lng], 15);
    }
  };

  // Handle map click for route selection
  const handleMapClick = async (latlng) => {
    if (!isInBangladeshPolygon(latlng.lat, latlng.lng)) {
      toast.error("Please select a location within Bangladesh.");
      return;
    }

    if (selectingRoute) {
      if (routePoints.length === 0) {
        // First click - set source point
        setRoutePoints([latlng]);
        // Update instruction to show destination selection
        setRouteInstruction(
          "Click on the map to select destination (red marker)."
        );
      } else if (routePoints.length === 1) {
        // Second click - set destination point and calculate route
        setRoutePoints([routePoints[0], latlng]);
        // Clear instruction as route calculation starts
        setRouteInstruction("");
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
    <Box w="full" minH="100vh" bg={bgColor} mt={8}>
      <Box maxW="7xl" mx="auto" pt={{ base: 24, md: 28 }} pb={6} px={2}>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card p={6} mb={6} bg={cardBg}>
            <Flex
              direction={{ base: "column", md: "row" }}
              align="center"
              justify="space-between"
              gap={6}
            >
              <Flex align="center" gap={4} flex={1}>
                <Text fontSize="2xl" fontWeight="bold" color={headingColor}>
                  Bangladesh Crime Map
                </Text>
                <Flex align="center" gap={2}>
                  <Text color="brand.400" fontWeight={600}>
                    Crime Type:
                  </Text>
                  <Select
                    value={filter}
                    onChange={handleFilterChange}
                    w="150px"
                    borderRadius="md"
                    bg={selectBg}
                    fontWeight={500}
                    fontSize="md"
                    borderColor={borderColor}
                    _focus={{ borderColor: "brand.400" }}
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
              </Flex>
              <motion.div
                whileHover={{ scale: 1.06, boxShadow: "0 0 0 4px #7551FF33" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Button
                  bgGradient="linear(to-r, #7551FF, #422AFB)"
                  color="white"
                  borderRadius="xl"
                  px={8}
                  fontWeight={700}
                  size="lg"
                  onClick={startRouteSelection}
                  shadow="md"
                  _hover={{
                    bgGradient: "linear(to-r, #422AFB, #7551FF)",
                    boxShadow: "xl",
                  }}
                  _active={{ bgGradient: "linear(to-r, #7551FF, #422AFB)" }}
                >
                  Safest Route
                </Button>
              </motion.div>
              <Box flex={1} display="flex" justifyContent="flex-end">
                <MapSearchBar
                  placeholder="Search for a place..."
                  onSelect={handleSearch}
                />
              </Box>
            </Flex>
          </Card>
        </motion.div>
      </Box>
      {/* Loading overlay for route calculation */}
      {routeLoading && (
        <Box
          position="fixed"
          inset={0}
          bg={loadingBg}
          backdropFilter="blur(20px)"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          zIndex={100}
          pointerEvents="all"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Box
                bg={cardBg}
                borderRadius="2xl"
                boxShadow="2xl"
                p={8}
                display="flex"
                flexDirection="column"
                alignItems="center"
                border="1px solid"
                borderColor={borderColor}
                maxW="md"
                w="90%"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.2,
                    ease: "linear",
                  }}
                  mb={4}
                >
                  <Spinner
                    size="xl"
                    color="brand.500"
                    thickness="4px"
                    speed="0.65s"
                  />
                </motion.div>
                <Text
                  fontSize="xl"
                  fontWeight="semibold"
                  color={textColor}
                  mb={2}
                  textAlign="center"
                >
                  Calculating safest route...
                </Text>
                <Text
                  color={useColorModeValue("gray.600", "gray.300")}
                  fontSize="sm"
                  textAlign="center"
                >
                  Please wait while we analyze all possible paths for you.
                </Text>
              </Box>
            </motion.div>
          </motion.div>
        </Box>
      )}
      <Box maxW="7xl" mx="auto" px={2} pb={8}>
        <Flex direction="row" gap={8} align="flex-start">
          {/* Map Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7 }}
            style={{ flex: 1, width: "100%" }}
          >
            {/* Mobile Legend Toggle Button */}
            <Flex
              display={{ base: "flex", md: "none" }}
              justify="flex-end"
              mb={4}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileLegendOpen(!isMobileLegendOpen)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold shadow-lg border border-purple-400/30 flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                Marker
              </motion.button>
            </Flex>
            <Box
              position="relative"
              borderRadius="2xl"
              overflow="hidden"
              boxShadow="xl"
              bg={mapBg}
              minH="600px"
            >
              {/* Crimes loading spinner */}
              {loading && (
                <Flex
                  position="absolute"
                  top={0}
                  left={0}
                  w="full"
                  h="full"
                  align="center"
                  justify="center"
                  zIndex={10}
                  bg={loadingBg}
                >
                  <Spinner
                    size="xl"
                    color="brand.500"
                    thickness="4px"
                    speed="0.65s"
                  />
                </Flex>
              )}
              <MapContainer
                center={mapCenter}
                zoom={7}
                style={{ height: "600px", width: "100%" }}
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
                {/* ...markers, polylines, etc... */}
                <AnimatePresence>
                  {crimes.map((crime) => (
                    <motion.div
                      key={crime.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.4 }}
                    >
                      <Marker
                        position={[crime.lat, crime.lng]}
                        icon={getCrimeIcon(crime.type)}
                      >
                        <Popup>
                          <Box>
                            <Text fontWeight="bold">
                              {crime.type.charAt(0).toUpperCase() +
                                crime.type.slice(1)}
                            </Text>
                            <Text>{crime.description}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(crime.time).toLocaleString()}
                            </Text>
                          </Box>
                        </Popup>
                      </Marker>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {/* ...rest of the map overlays... */}
                {route.length > 1 && (
                  <Polyline
                    positions={route.map((p) => [p.lat, p.lng])}
                    color={networkType === "walk" ? "purple" : "green"}
                  />
                )}
                {/* Show source/destination markers while selecting or after route is shown */}
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
              {/* Route Selection Instructions - positioned on top of map */}
              {showRouteInstruction && routeInstruction && (
                <Box
                  position="absolute"
                  top="20px"
                  left="50%"
                  transform="translateX(-50%)"
                  zIndex={1000}
                  maxW="400px"
                  w="90%"
                >
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box
                      bg="whiteAlpha.900"
                      backdropFilter="blur(20px)"
                      border="1px solid"
                      borderColor="whiteAlpha.300"
                      borderRadius="2xl"
                      px={6}
                      py={4}
                      boxShadow="2xl"
                      textAlign="center"
                    >
                      <Flex align="center" justify="center" gap={3}>
                        <Box
                          w="3"
                          h="3"
                          borderRadius="full"
                          bg={
                            routePoints.length === 0 ? "green.500" : "red.500"
                          }
                        />
                        <Text
                          fontWeight="semibold"
                          fontSize="md"
                          color="gray.800"
                        >
                          {routeInstruction}
                        </Text>
                      </Flex>
                    </Box>
                  </motion.div>
                </Box>
              )}
            </Box>
          </motion.div>
          {/* Legend Sidebar */}
          {/* Desktop Legend */}
          <Box display={{ base: "none", md: "block" }}>
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              style={{ minWidth: "180px", maxWidth: "260px" }}
            >
              <Card
                minW={{ base: "180px", md: "240px" }}
                maxW="260px"
                p={6}
                position="sticky"
                top="120px"
                alignSelf="flex-start"
                boxShadow="2xl"
                borderRadius="2xl"
                bg={legendBg}
                zIndex={40}
              >
                <Text
                  fontWeight={700}
                  fontSize="lg"
                  mb={2}
                  color={legendHeadingColor}
                >
                  Marker
                </Text>
                <Divider mb={3} />
                <Flex direction="column" gap={3}>
                  <Flex align="center" gap={2}>
                    <img
                      src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
                      alt="Source"
                      width={18}
                      height={30}
                    />
                    <Text color={legendTextColor}>Source</Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <img
                      src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
                      alt="Destination"
                      width={18}
                      height={30}
                    />
                    <Text color={legendTextColor}>Destination</Text>
                  </Flex>
                  <Divider />
                  {/* Crime type icons */}
                  {Object.entries(crimeTypeColors).map(([type, color]) => (
                    <Flex align="center" gap={2} key={type}>
                      <Box
                        as="span"
                        display="inline-block"
                        w="18px"
                        h="18px"
                        borderRadius="full"
                        bg={color}
                        border="2px solid #fff"
                        boxShadow="md"
                      />
                      <Text
                        fontSize="sm"
                        textTransform="capitalize"
                        color={legendTextColor}
                      >
                        {type}
                      </Text>
                    </Flex>
                  ))}
                  <Divider />
                  <Text
                    fontWeight={700}
                    fontSize="md"
                    mt={2}
                    mb={1}
                    color={legendHeadingColor}
                  >
                    Route Type
                  </Text>
                  <Flex align="center" gap={2}>
                    <Box w="28px" h="4px" borderRadius="md" bg="#22c55e" />
                    <Text color={legendTextColor}>Drive</Text>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Box w="28px" h="4px" borderRadius="md" bg="purple.500" />
                    <Text color={legendTextColor}>Walk</Text>
                  </Flex>
                </Flex>
              </Card>
            </motion.div>
          </Box>
        </Flex>

        {/* Mobile Legend Sidebar */}
        {isMobileLegendOpen && (
          <Box
            position="fixed"
            inset={0}
            zIndex={9999}
            display={{ base: "block", md: "none" }}
          >
            {/* Backdrop */}
            <Box
              position="absolute"
              inset={0}
              bg="blackAlpha.200"
              backdropFilter="blur(4px)"
              onClick={() => setIsMobileLegendOpen(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Box
                position="absolute"
                right={0}
                top={0}
                h="full"
                w="320px"
                bg={useColorModeValue("whiteAlpha.950", "gray.800")}
                backdropFilter="blur(20px)"
                borderLeft="1px solid"
                borderColor={useColorModeValue(
                  "whiteAlpha.200",
                  "whiteAlpha.300"
                )}
                boxShadow="2xl"
              >
                <Flex direction="column" h="full">
                  {/* Header */}
                  <Flex
                    justify="space-between"
                    align="center"
                    p={6}
                    borderBottom="1px solid"
                    borderColor={useColorModeValue(
                      "whiteAlpha.200",
                      "whiteAlpha.300"
                    )}
                  >
                    <Text fontSize="xl" fontWeight="bold" color={textColor}>
                      Marker
                    </Text>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => setIsMobileLegendOpen(false)}
                    >
                      <Box
                        p={2}
                        borderRadius="lg"
                        bgGradient="linear(to-r, purple.500, purple.700)"
                        border="1px solid"
                        borderColor="purple.400"
                        boxShadow="lg"
                      >
                        <Icon
                          as="svg"
                          w={5}
                          h={5}
                          color="white"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </Icon>
                      </Box>
                    </motion.button>
                  </Flex>

                  {/* Legend Content */}
                  <Box flex={1} p={6} spacing={4}>
                    <Box>
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        color={legendHeadingColor}
                        mb={3}
                      >
                        Point
                      </Text>
                      <Flex direction="column" gap={3}>
                        <Flex align="center" gap={3}>
                          <img
                            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
                            alt="Source"
                            width={18}
                            height={30}
                          />
                          <Text color={legendTextColor}>Source</Text>
                        </Flex>
                        <Flex align="center" gap={3}>
                          <img
                            src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png"
                            alt="Destination"
                            width={18}
                            height={30}
                          />
                          <Text color={legendTextColor}>Destination</Text>
                        </Flex>
                      </Flex>
                    </Box>

                    <Divider my={4} borderColor={borderColor} />

                    <Box>
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        color={legendHeadingColor}
                        mb={3}
                      >
                        Crime Types
                      </Text>
                      <Flex direction="column" gap={3}>
                        {Object.entries(crimeTypeColors).map(
                          ([type, color]) => (
                            <Flex key={type} align="center" gap={3}>
                              <Box
                                w="16px"
                                h="16px"
                                borderRadius="full"
                                bg={color}
                                border="2px solid"
                                borderColor={useColorModeValue(
                                  "white",
                                  "whiteAlpha.200"
                                )}
                                boxShadow="md"
                              />
                              <Text
                                color={legendTextColor}
                                textTransform="capitalize"
                              >
                                {type}
                              </Text>
                            </Flex>
                          )
                        )}
                      </Flex>
                    </Box>

                    <Divider my={4} borderColor={borderColor} />

                    <Box>
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        color={legendHeadingColor}
                        mb={3}
                      >
                        Route Type
                      </Text>
                      <Flex direction="column" gap={3}>
                        <Flex align="center" gap={3}>
                          <Box
                            w="28px"
                            h="4px"
                            borderRadius="md"
                            bg="green.500"
                          />
                          <Text color={legendTextColor}>Drive</Text>
                        </Flex>
                        <Flex align="center" gap={3}>
                          <Box
                            w="28px"
                            h="4px"
                            borderRadius="md"
                            bg="purple.500"
                          />
                          <Text color={legendTextColor}>Walk</Text>
                        </Flex>
                      </Flex>
                    </Box>
                  </Box>
                </Flex>
              </Box>
            </motion.div>
          </Box>
        )}
      </Box>
      {/* Safest Route Modal - moved outside MapContainer for z-index fix */}
      {routeModalOpen && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={50}
        >
          <Box
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="2xl"
            maxW="md"
            w="full"
            p={6}
            position="relative"
            border="1px solid"
            borderColor={borderColor}
          >
            <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>
              Find Safest Route
            </Text>
            <Text mb={2} fontWeight="medium" color={textColor}>
              Route Type:
            </Text>
            <Select
              value={networkType}
              onChange={handleNetworkTypeChange}
              mb={4}
              w="full"
              borderRadius="md"
              bg={selectBg}
              borderColor={borderColor}
              color={textColor}
              _focus={{ borderColor: "brand.400" }}
            >
              <option value="drive">Drive</option>
              <option value="walk">Walk</option>
            </Select>
            <Box mb={4}>
              <Text mb={1} color={textColor}>
                Instructions:
              </Text>
              <Box as="ul" listStyleType="disc" pl={6} fontSize="sm">
                <Box as="li" color={textColor} mb={1}>
                  After clicking 'Start Selecting', click on the map to select{" "}
                  <Text as="span" fontWeight="semibold">
                    source
                  </Text>{" "}
                  (green marker).
                </Box>
                <Box as="li" color={textColor}>
                  Then click to select{" "}
                  <Text as="span" fontWeight="semibold">
                    destination
                  </Text>{" "}
                  (red marker).
                </Box>
              </Box>
            </Box>
            <Flex justify="flex-end" gap={2}>
              <Button
                onClick={resetRouteSelection}
                colorScheme="gray"
                variant="outline"
                borderRadius="md"
                fontWeight="semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={beginSelectingRoute}
                bgGradient="linear(to-r, #7551FF, #422AFB)"
                color="white"
                borderRadius="md"
                fontWeight="semibold"
                _hover={{
                  bgGradient: "linear(to-r, #422AFB, #7551FF)",
                }}
              >
                Start Selecting
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
      {/* Floating instruction while selecting route */}
      {/* (Removed, replaced by hot toasts) */}
      <FixedPlugin />
    </Box>
  );
};

export default MapPage;
