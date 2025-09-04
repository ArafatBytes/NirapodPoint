import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import CrimeReportForm from "../components/CrimeReportForm";
// import PhotonSearchBar from "../components/PhotonSearchBar";
import toast from "react-hot-toast";
import { isInBangladeshPolygon } from "../utils/bangladeshPolygon";
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
} from "@chakra-ui/react";
import Card from "../components/card/Card";
import IconBox from "../components/icons/IconBox";
import { MdLocationOn, MdReport } from "react-icons/md";
import { motion } from "framer-motion";
import { SearchBar } from "../components/navbar/searchBar/SearchBar";
import { SearchIcon } from "@chakra-ui/icons";
import FixedPlugin from "../components/fixedPlugin/FixedPlugin";

// Bangladesh bounding box
const BD_BOUNDS = {
  minLat: 20.59,
  maxLat: 26.63,
  minLng: 88.01,
  maxLng: 92.68,
};

function LocationPicker({ onSelect, selectedLatLng }) {
  useMapEvents({
    click(e) {
      if (!isInBangladeshPolygon(e.latlng.lat, e.latlng.lng)) {
        toast.error("Please select a location within Bangladesh.");
        return;
      }
      onSelect(e.latlng);
    },
  });
  return selectedLatLng ? (
    <Marker
      position={[selectedLatLng.lat, selectedLatLng.lng]}
      icon={
        new L.Icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      }
    />
  ) : null;
}

// --- MapSearchBar: Horizon UI style + dropdown suggestions ---
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

  // Hide dropdown on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (!inputRef.current?.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Theming
  const bg = useColorModeValue("secondaryGray.300", "navy.900");
  const border = useColorModeValue("secondaryGray.400", "whiteAlpha.300"); // neutral by default
  const dropdownBg = useColorModeValue("white", "navy.800");
  const highlight = useColorModeValue("brand.100", "brand.700");
  const textColor = useColorModeValue("gray.700", "white");
  const descColor = useColorModeValue("gray.500", "gray.300");
  const shadow = useColorModeValue("lg", "dark-lg");

  return (
    <Box
      ref={inputRef}
      position="relative"
      w={{ base: "90vw", md: "320px" }}
      ml="auto"
      zIndex={50}
    >
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
          right={0}
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

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
};
const staggerGrid = {
  visible: { transition: { staggerChildren: 0.18 } },
};

export default function ReportPage() {
  const [selectedLatLng, setSelectedLatLng] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.685, 90.3563]);
  const [mapZoom, setMapZoom] = useState(12);
  const mapRef = useRef();

  // Loading spinner state
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Simulate loading for demonstration; replace with real data loading if needed
    const timer = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const textColor = useColorModeValue("secondaryGray.900", "white");

  const handlePhotonSelect = (place) => {
    setMapCenter([place.lat, place.lng]);
    setMapZoom(16);
    if (mapRef.current) {
      mapRef.current.setView([place.lat, place.lng], 16);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <Spinner size="xl" color="brand.500" thickness="4px" speed="0.65s" />
      </Flex>
    );
  }

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, glassyblue.100, white, glassyblue.200)"
      pt={{ base: 8, md: 24 }}
      pb={12}
      px={2}
      mt={12}
    >
      <motion.div variants={staggerGrid} initial="hidden" animate="visible">
        <SimpleGrid
          columns={{ base: 1, md: 2 }}
          gap="28px"
          maxW="7xl"
          mx="auto"
        >
          {/* Map and Search */}
          <motion.div variants={scaleIn}>
            <Card p={{ base: 4, md: 8 }} position="relative">
              <Flex align="center" mb={4} gap={3}>
                <IconBox
                  w="48px"
                  h="48px"
                  bg={boxBg}
                  icon={
                    <Icon
                      w="28px"
                      h="28px"
                      as={MdLocationOn}
                      color={brandColor}
                    />
                  }
                />
                <Text fontSize="xl" fontWeight="700" color={textColor}>
                  Select Location
                </Text>
              </Flex>
              <Box
                w="100%"
                h={{ base: "72", md: "500px" }}
                borderRadius="16px"
                overflow="hidden"
                boxShadow="md"
                position="relative"
              >
                {/* Search bar inside the map, top-right */}
                <Box
                  position="absolute"
                  top={4}
                  right={4}
                  zIndex={1000}
                  w={{ base: "90vw", md: "320px" }}
                  ml="auto"
                >
                  <MapSearchBar
                    placeholder="Search for a place..."
                    onSelect={handlePhotonSelect}
                  />
                </Box>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  style={{ height: "100%" }}
                >
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ width: "100%", height: "100%", zIndex: 1 }}
                    ref={mapRef}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPicker
                      onSelect={setSelectedLatLng}
                      selectedLatLng={selectedLatLng}
                    />
                  </MapContainer>
                </motion.div>
              </Box>
            </Card>
          </motion.div>

          {/* Form */}
          <motion.div variants={fadeUp}>
            <Card p={{ base: 4, md: 8 }}>
              <Flex align="center" mb={4} gap={3}>
                <IconBox
                  w="48px"
                  h="48px"
                  bg={boxBg}
                  icon={
                    <Icon w="28px" h="28px" as={MdReport} color={brandColor} />
                  }
                />
                <Text fontSize="xl" fontWeight="700" color={textColor}>
                  Report a Crime
                </Text>
              </Flex>
              <Box>
                <CrimeReportForm
                  lat={selectedLatLng?.lat}
                  lng={selectedLatLng?.lng}
                />
              </Box>
            </Card>
          </motion.div>
        </SimpleGrid>
      </motion.div>
      <FixedPlugin />
    </Box>
  );
}