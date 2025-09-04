import React, { useState, useRef } from "react";
import {
  InputGroup,
  Input,
  InputLeftElement,
  Box,
  List,
  ListItem,
  Spinner,
  useColorModeValue,
  Text,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

export default function PhotonSearchBar({
  placeholder,
  onSelect,
  initialValue = "",
}) {
  const [query, setQuery] = useState(initialValue);
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
  const bg = useColorModeValue("white", "navy.700");
  const border = useColorModeValue("brand.200", "brand.400");
  const dropdownBg = useColorModeValue("white", "navy.800");
  const highlight = useColorModeValue("brand.100", "brand.700");
  const textColor = useColorModeValue("brand.700", "white");
  const descColor = useColorModeValue("gray.500", "gray.300");
  const shadow = useColorModeValue("lg", "dark-lg");

  return (
    <Box
      ref={inputRef}
      position="relative"
      w="100%"
      maxW={"420px"}
      mx="auto"
      zIndex={30}
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
          borderRadius="2xl"
          borderWidth="2px"
          borderColor={border}
          bg={bg}
          color={textColor}
          fontWeight={500}
          fontSize={"lg"}
          boxShadow={shadow}
          _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 2px #7551FF" }}
          pr={loading ? 12 : 4}
        />
        {loading && (
          <Spinner
            size="md"
            color="brand.400"
            position="absolute"
            right={4}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
          />
        )}
      </InputGroup>
      {showDropdown && suggestions.length > 0 && (
        <Box
          position="absolute"
          top={14}
          left={0}
          right={0}
          zIndex={50}
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
