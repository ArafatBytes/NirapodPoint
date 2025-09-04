import React from "react";
import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useLocation } from "react-router-dom";
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  Flex,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
  Spinner,
} from "@chakra-ui/react";

function CrimeReportForm({ lat: propLat, lng: propLng, onSuccess, onCancel }) {
  const location = useLocation();
  // Prefer props, then location.state, then blank
  const [lat, setLat] = React.useState(
    propLat || (location.state && location.state.lat) || ""
  );
  const [lng, setLng] = React.useState(
    propLng || (location.state && location.state.lng) || ""
  );
  const [type, setType] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [time, setTime] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState("");
  const [error, setError] = React.useState("");
  const { jwt } = useUser();

  // If location.state changes (e.g. user navigates to /report with new coords), update state
  React.useEffect(() => {
    if (!propLat && location.state && location.state.lat)
      setLat(location.state.lat);
    if (!propLng && location.state && location.state.lng)
      setLng(location.state.lng);
  }, [location.state, propLat, propLng]);

  // Update lat/lng state when props change (for map selection in report page)
  React.useEffect(() => {
    if (propLat) setLat(propLat);
    if (propLng) setLng(propLng);
  }, [propLat, propLng]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!type || !description || !time || !lat || !lng) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/crimes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          type,
          description,
          time,
          location: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      setSuccess("Crime report submitted successfully!");
      setType("");
      setDescription("");
      setTime("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  const cardBg = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const labelColor = useColorModeValue("brand.700", "white");

  return (
    <motion.form
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      onSubmit={handleSubmit}
    >
      <Box
        bg={cardBg}
        borderRadius="2xl"
        boxShadow="xl"
        borderWidth="1px"
        borderColor={borderColor}
        p={{ base: 4, md: 8 }}
        maxW="lg"
        w="full"
        mx="auto"
      >
        <Text
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="bold"
          color={labelColor}
          mb={4}
          textAlign="center"
        >
          Report a Crime
        </Text>
        <FormControl mb={4} isRequired>
          <FormLabel color={labelColor}>Type</FormLabel>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="Select type"
            bg="whiteAlpha.700"
            borderColor={borderColor}
            _focus={{
              borderColor: "brand.400",
              boxShadow: "0 0 0 1px #7551FF",
            }}
          >
            <option value="murder">Murder</option>
            <option value="rape">Rape</option>
            <option value="kidnap">Kidnap</option>
            <option value="assault">Assault</option>
            <option value="robbery">Robbery</option>
            <option value="harassment">Harassment</option>
            <option value="theft">Theft</option>
            <option value="others">Others</option>
          </Select>
        </FormControl>
        <FormControl mb={4} isRequired>
          <FormLabel color={labelColor}>Description</FormLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the incident..."
            bg="whiteAlpha.700"
            borderColor={borderColor}
            _focus={{
              borderColor: "brand.400",
              boxShadow: "0 0 0 1px #7551FF",
            }}
          />
        </FormControl>
        <FormControl mb={4} isRequired>
          <FormLabel color={labelColor}>Date & Time</FormLabel>
          <Input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            bg="whiteAlpha.700"
            borderColor={borderColor}
            _focus={{
              borderColor: "brand.400",
              boxShadow: "0 0 0 1px #7551FF",
            }}
          />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel color={labelColor}>Location</FormLabel>
          <Flex gap={2}>
            <Input
              type="text"
              value={lat || ""}
              readOnly
              placeholder="Latitude"
              bg="whiteAlpha.700"
              borderColor={borderColor}
            />
            <Input
              type="text"
              value={lng || ""}
              readOnly
              placeholder="Longitude"
              bg="whiteAlpha.700"
              borderColor={borderColor}
            />
          </Flex>
        </FormControl>
        {!lat || !lng ? (
          <Alert status="error" mb={2} borderRadius="md">
            <AlertIcon />
            Please select a location on the map to report a crime.
          </Alert>
        ) : null}
        {error && (
          <Alert status="error" mb={2} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        {success && (
          <Alert status="success" mb={2} borderRadius="md">
            <AlertIcon />
            {success}
          </Alert>
        )}
        <Flex gap={4} justify="center" mt={4}>
          <Button
            type="submit"
            colorScheme="purple"
            size="lg"
            px={8}
            isLoading={loading}
            loadingText="Submitting..."
            isDisabled={loading || !lat || !lng}
            as={motion.button}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            borderRadius="full"
            fontWeight="bold"
            shadow="md"
          >
            Submit Report
          </Button>
          {onCancel && (
            <Button
              type="button"
              size="lg"
              px={8}
              onClick={onCancel}
              as={motion.button}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              borderRadius="full"
              fontWeight="bold"
              shadow="md"
              colorScheme="gray"
            >
              Cancel
            </Button>
          )}
        </Flex>
      </Box>
    </motion.form>
  );
}

export default CrimeReportForm;
