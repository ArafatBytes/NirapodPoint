import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  useColorModeValue,
  Spinner,
  Card,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
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
    // eslint-disable-next-line
  }, [user, jwt]);

  const cardBg = useColorModeValue("white", "navy.700");
  const cardShadow = useColorModeValue("xl", "dark-lg");
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const accent = useColorModeValue("brand.500", "brand.200");

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, glassyblue.100, white, glassyblue.200)"
      pt={24}
      pb={12}
      px={2}
      mt={12}
    >
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Text
          fontSize={{ base: "2xl", md: "4xl" }}
          fontWeight="extrabold"
          color={textColor}
          mb={8}
          textAlign="center"
          dropShadow="lg"
        >
          My Crime Reports
        </Text>
      </motion.div>
      {loading ? (
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color="brand.500" thickness="4px" speed="0.65s" />
        </Flex>
      ) : crimes.length === 0 ? (
        <Flex justify="center" align="center" minH="40vh">
          <Text fontSize="xl" color="brand.400" fontWeight={600}>
            You have not reported any crimes yet.
          </Text>
        </Flex>
      ) : (
        <SimpleGrid
          columns={{ base: 1, sm: 2, lg: 3 }}
          gap={8}
          maxW="6xl"
          mx="auto"
        >
          <AnimatePresence>
            {crimes.map((crime, idx) => (
              <motion.div
                key={crime.id}
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.97 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 8px 32px 0 #7551FF33",
                }}
              >
                <Card
                  bg={cardBg}
                  boxShadow={cardShadow}
                  borderRadius="2xl"
                  p={0}
                  overflow="hidden"
                  _hover={{ boxShadow: "2xl" }}
                  transition="box-shadow 0.2s, transform 0.2s"
                  minH="370px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                >
                  {/* Map as card cover */}
                  {crime.lat && crime.lng && (
                    <Box
                      w="full"
                      h="180px"
                      borderTopRadius="2xl"
                      overflow="hidden"
                    >
                      <MapContainer
                        center={[crime.lat, crime.lng]}
                        zoom={14}
                        style={{
                          width: "100%",
                          height: "100%",
                          minHeight: 160,
                        }}
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
                    </Box>
                  )}
                  <Box
                    p={6}
                    pt={4}
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    flex={1}
                  >
                    <Flex align="center" gap={2} mb={1}>
                      <Box as="span">
                        <img
                          src={getCrimeIcon(crime.type).options.iconUrl}
                          alt={crime.type}
                          width={28}
                          height={40}
                          style={{
                            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.10))",
                          }}
                        />
                      </Box>
                      <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color={accent}
                        textTransform="capitalize"
                      >
                        {crime.type}
                      </Text>
                    </Flex>
                    <Text
                      fontSize="sm"
                      color="gray.400"
                      mb={1}
                      fontWeight={500}
                    >
                      {crime.time
                        ? new Date(crime.time).toLocaleString()
                        : "No time"}
                    </Text>
                    <Text
                      fontSize="md"
                      color={textColor}
                      mb={2}
                      fontWeight={600}
                    >
                      {crime.description}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mt="auto">
                      <b>Location:</b>{" "}
                      {addresses[crime.id] ? (
                        <>
                          {addresses[crime.id]} <br />
                          <span style={{ color: "#64748b" }}>
                            ({crime.lat?.toFixed(5)}, {crime.lng?.toFixed(5)})
                          </span>
                        </>
                      ) : (
                        <span style={{ color: "#64748b" }}>
                          Fetching address...
                        </span>
                      )}
                    </Text>
                  </Box>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </SimpleGrid>
      )}
      <FixedPlugin />
    </Box>
  );
}