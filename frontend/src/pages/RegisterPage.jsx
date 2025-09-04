import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Text,
  useColorModeValue,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  Image as ChakraImage,
} from "@chakra-ui/react";
import { HSeparator } from "../components/separator/Separator";
import DefaultAuth from "../layouts/auth/Default";
import Nft5 from "../assets/img/nfts/Nft5.png";
import { FcGoogle } from "react-icons/fc";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import { FaUser } from "react-icons/fa";
import { MdEmail, MdLock, MdFileUpload, MdCameraAlt } from "react-icons/md";
import { FiPhone } from "react-icons/fi";

const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

// Add animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const buttonVariants = {
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  tap: {
    scale: 0.98,
  },
};

const inputVariants = {
  focus: {
    scale: 1.01,
    transition: {
      duration: 0.2,
    },
  },
};

export default function RegisterPage() {
  const { register } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "mdarafat1661@gmail.com",
    phone: "01XXXXXXXXX",
    password: "",
    nidFront: null,
    nidBack: null,
    photo: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const videoRef = useRef();
  const canvasRef = useRef();
  const [cameraStream, setCameraStream] = useState(null);

  // Handle video stream when modal opens
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
      };
    }
  }, [showCamera, cameraStream]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      // Store the stream and set the modal
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      toast.error("Could not access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convert canvas to base64
      const dataUrl = canvas.toDataURL("image/jpeg");
      setForm((f) => ({ ...f, photo: dataUrl }));
      setPhotoPreview(dataUrl);

      // Stop camera
      const stream = video.srcObject;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      // Also stop the stored stream
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      setShowCamera(false);
    }
  };

  const cancelCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
    }
    // Also stop the stored stream
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  function validate() {
    const errs = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.email) errs.email = "Email is required";
    if (!form.phone) errs.phone = "Phone is required";
    if (!form.password) errs.password = "Password is required";
    if (!form.nidFront) errs.nidFront = "NID front image is required";
    if (!form.nidBack) errs.nidBack = "NID back image is required";
    if (!form.photo) errs.photo = "Photo is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Convert form object to FormData
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("password", form.password);
    if (form.nidFront) formData.append("nidFront", form.nidFront);
    if (form.nidBack) formData.append("nidBack", form.nidBack);
    // If photo is a File, append as file; if string (base64), append as string
    if (form.photo) formData.append("photo", form.photo); // Always a base64 string now
    const ok = await register(formData);
    setLoading(false);
    if (ok) navigate("/");
  }

  function handleChange(e) {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      if (name === "photo" || name === "nidFront" || name === "nidBack") {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (name === "photo") {
            setForm((f) => ({ ...f, photo: reader.result }));
            setPhotoPreview(reader.result);
          } else {
            setForm((f) => ({ ...f, [name]: files[0] }));
          }
        };
        reader.readAsDataURL(files[0]);
      } else {
        setForm((f) => ({ ...f, [name]: files[0] }));
      }
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  return (
    <DefaultAuth
      illustrationBackground={Nft5}
      image={Nft5}
      illustrationProps={{ display: { base: "none", md: "block" } }}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Flex
          maxW={{ base: "100%", md: "max-content" }}
          w="100%"
          mx={{ base: "auto", lg: "unset" }}
          me="auto"
          h="100%"
          alignItems={{ base: "center", md: "start" }}
          justifyContent="center"
          mb={{ base: "20px", md: "60px" }}
          px={{ base: "25px", md: "0px" }}
          mt={{ base: "80px", md: 20 }}
          flexDirection="column"
        >
          <motion.div variants={itemVariants}>
            <Box me="auto">
              <Heading
                color={useColorModeValue("navy.700", "white")}
                fontSize="36px"
                mb="10px"
              >
                Create an Account
              </Heading>
              <Text
                mb="36px"
                ms="4px"
                color={useColorModeValue("gray.400", "gray.400")}
                fontWeight="400"
                fontSize="md"
              >
                Enter your details to register!
              </Text>
            </Box>
          </motion.div>
          <motion.div variants={itemVariants}>
            <Flex
              zIndex="2"
              direction="column"
              w={{ base: "100%", md: "420px" }}
              maxW="100%"
              background="transparent"
              borderRadius="15px"
              mx={{ base: "auto", lg: "unset" }}
              me="auto"
              mb={{ base: "20px", md: "auto" }}
            >
              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <motion.div variants={itemVariants}>
                  <FormControl mb="20px">
                    <FormLabel
                      color={useColorModeValue("navy.700", "white")}
                      fontWeight="500"
                    >
                      Name
                      <Text as="span" color="brand.500">
                        *
                      </Text>
                    </FormLabel>
                    <motion.div whileFocus="focus" variants={inputVariants}>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FaUser} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          variant="auth"
                          fontSize="sm"
                          pl="50px"
                          isRequired
                          _focus={{
                            boxShadow: "0 0 0 1px #7551FF",
                            borderColor: "#7551FF",
                          }}
                          _hover={{
                            borderColor: "#7551FF",
                          }}
                        />
                      </InputGroup>
                    </motion.div>
                    {errors.name && (
                      <Text color="red.500" fontSize="sm">
                        {errors.name}
                      </Text>
                    )}
                  </FormControl>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormControl mb="20px">
                    <FormLabel
                      color={useColorModeValue("navy.700", "white")}
                      fontWeight="500"
                    >
                      Email
                      <Text as="span" color="brand.500">
                        *
                      </Text>
                    </FormLabel>
                    <motion.div whileFocus="focus" variants={inputVariants}>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Icon as={MdEmail} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          variant="auth"
                          fontSize="sm"
                          pl="50px"
                          isRequired
                          _focus={{
                            boxShadow: "0 0 0 1px #7551FF",
                            borderColor: "#7551FF",
                          }}
                          _hover={{
                            borderColor: "#7551FF",
                          }}
                        />
                      </InputGroup>
                    </motion.div>
                    {errors.email && (
                      <Text color="red.500" fontSize="sm">
                        {errors.email}
                      </Text>
                    )}
                  </FormControl>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormControl mb="20px">
                    <FormLabel
                      color={useColorModeValue("navy.700", "white")}
                      fontWeight="500"
                    >
                      Phone (BD)
                      <Text as="span" color="brand.500">
                        *
                      </Text>
                    </FormLabel>
                    <motion.div whileFocus="focus" variants={inputVariants}>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Icon as={FiPhone} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          variant="auth"
                          fontSize="sm"
                          pl="50px"
                          isRequired
                          placeholder="01XXXXXXXXX"
                          _focus={{
                            boxShadow: "0 0 0 1px #7551FF",
                            borderColor: "#7551FF",
                          }}
                          _hover={{
                            borderColor: "#7551FF",
                          }}
                        />
                      </InputGroup>
                    </motion.div>
                    {errors.phone && (
                      <Text color="red.500" fontSize="sm">
                        {errors.phone}
                      </Text>
                    )}
                  </FormControl>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormControl mb="20px">
                    <FormLabel
                      color={useColorModeValue("navy.700", "white")}
                      fontWeight="500"
                    >
                      Password
                      <Text as="span" color="brand.500">
                        *
                      </Text>
                    </FormLabel>
                    <motion.div whileFocus="focus" variants={inputVariants}>
                      <InputGroup size="lg">
                        <InputLeftElement pointerEvents="none">
                          <Icon as={MdLock} color="gray.400" />
                        </InputLeftElement>
                        <Input
                          name="password"
                          type={show ? "text" : "password"}
                          value={form.password}
                          onChange={handleChange}
                          variant="auth"
                          fontSize="sm"
                          pl="50px"
                          isRequired
                          _focus={{
                            boxShadow: "0 0 0 1px #7551FF",
                            borderColor: "#7551FF",
                          }}
                          _hover={{
                            borderColor: "#7551FF",
                          }}
                        />
                        <InputRightElement
                          display="flex"
                          alignItems="center"
                          mt="4px"
                        >
                          <Icon
                            color={useColorModeValue("gray.400", "gray.400")}
                            _hover={{ cursor: "pointer" }}
                            as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                            onClick={() => setShow((s) => !s)}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </motion.div>
                    {errors.password && (
                      <Text color="red.500" fontSize="sm">
                        {errors.password}
                      </Text>
                    )}
                  </FormControl>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormControl mb="20px">
                    <FormLabel
                      color={useColorModeValue("navy.700", "white")}
                      fontWeight="500"
                    >
                      NID Front Image
                      <Text as="span" color="brand.500">
                        *
                      </Text>
                    </FormLabel>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Flex align="center" justify="center" gap={2}>
                        <input
                          id="nidFront"
                          name="nidFront"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleChange}
                        />
                        <Button
                          as="label"
                          htmlFor="nidFront"
                          variant="outline"
                          colorScheme="brand"
                          w="100%"
                          justifyContent="center"
                          cursor="pointer"
                          leftIcon={<Icon as={MdFileUpload} />}
                          _hover={{
                            bg: "brand.500",
                            color: "white",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(117, 81, 255, 0.3)",
                          }}
                          transition="all 0.2s"
                        >
                          {form.nidFront ? form.nidFront.name : "Choose File"}
                        </Button>
                      </Flex>
                    </motion.div>
                    {errors.nidFront && (
                      <Text color="red.500" fontSize="sm">
                        {errors.nidFront}
                      </Text>
                    )}
                  </FormControl>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormControl mb="20px">
                    <FormLabel
                      color={useColorModeValue("navy.700", "white")}
                      fontWeight="500"
                    >
                      NID Back Image
                      <Text as="span" color="brand.500">
                        *
                      </Text>
                    </FormLabel>
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <Flex align="center" justify="center" gap={2}>
                        <input
                          id="nidBack"
                          name="nidBack"
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={handleChange}
                        />
                        <Button
                          as="label"
                          htmlFor="nidBack"
                          variant="outline"
                          colorScheme="brand"
                          w="100%"
                          justifyContent="center"
                          cursor="pointer"
                          leftIcon={<Icon as={MdFileUpload} />}
                          _hover={{
                            bg: "brand.500",
                            color: "white",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(117, 81, 255, 0.3)",
                          }}
                          transition="all 0.2s"
                        >
                          {form.nidBack ? form.nidBack.name : "Choose File"}
                        </Button>
                      </Flex>
                    </motion.div>
                    {errors.nidBack && (
                      <Text color="red.500" fontSize="sm">
                        {errors.nidBack}
                      </Text>
                    )}
                  </FormControl>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormControl mb="20px">
                    <FormLabel
                      color={useColorModeValue("navy.700", "white")}
                      fontWeight="500"
                    >
                      Your Image
                      <Text as="span" color="brand.500">
                        *
                      </Text>
                    </FormLabel>
                    {photoPreview ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Flex direction="column" align="center" gap={2}>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChakraImage
                              src={photoPreview}
                              alt="Preview"
                              boxSize="120px"
                              borderRadius="12px"
                              objectFit="cover"
                              boxShadow="0 2px 12px #0002"
                            />
                          </motion.div>
                          <motion.div
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            <Button
                              type="button"
                              onClick={startCamera}
                              colorScheme="brand"
                              mt={1}
                              leftIcon={<Icon as={MdCameraAlt} />}
                              _hover={{
                                transform: "translateY(-2px)",
                                boxShadow: "0 4px 12px rgba(117, 81, 255, 0.3)",
                              }}
                              transition="all 0.2s"
                            >
                              Retake Photo
                            </Button>
                          </motion.div>
                        </Flex>
                      </motion.div>
                    ) : (
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          type="button"
                          onClick={startCamera}
                          colorScheme="brand"
                          leftIcon={<Icon as={MdCameraAlt} />}
                          w="100%"
                          _hover={{
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(117, 81, 255, 0.3)",
                          }}
                          transition="all 0.2s"
                        >
                          Take Photo
                        </Button>
                      </motion.div>
                    )}
                    {errors.photo && (
                      <Text color="red.500" fontSize="sm">
                        {errors.photo}
                      </Text>
                    )}
                  </FormControl>
                </motion.div>

                {showCamera && (
                  <>
                    <Box
                      position="fixed"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      bg="blackAlpha.600"
                      zIndex={10001}
                      onClick={cancelCamera}
                    />
                    <Box
                      position="fixed"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      zIndex={10002}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box
                          maxW="xs"
                          bg="white"
                          borderRadius="xl"
                          boxShadow="2xl"
                          overflow="hidden"
                        >
                          <Flex
                            justify="space-between"
                            align="center"
                            p={4}
                            borderBottom="1px"
                            borderColor="gray.200"
                          >
                            <Text fontWeight="bold" fontSize="lg">
                              Take a Photo
                            </Text>
                            <Button
                              onClick={cancelCamera}
                              variant="ghost"
                              size="sm"
                              borderRadius="full"
                              _hover={{ bg: "gray.100" }}
                            >
                              ✕
                            </Button>
                          </Flex>
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            p={6}
                          >
                            <video
                              ref={videoRef}
                              style={{
                                width: 320,
                                height: 240,
                                borderRadius: 12,
                                background: "#222",
                              }}
                              autoPlay
                            />
                            <canvas
                              ref={canvasRef}
                              style={{ display: "none" }}
                            />
                            <Flex gap={4} mt={2}>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  colorScheme="green"
                                  onClick={capturePhoto}
                                >
                                  Capture
                                </Button>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  colorScheme="red"
                                  onClick={cancelCamera}
                                >
                                  Cancel
                                </Button>
                              </motion.div>
                            </Flex>
                          </Box>
                        </Box>
                      </motion.div>
                    </Box>
                  </>
                )}

                <motion.div
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <Button
                    type="submit"
                    fontSize="sm"
                    variant="brand"
                    fontWeight="500"
                    w="100%"
                    h="50px"
                    mb="24px"
                    isLoading={loading}
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 25px rgba(117, 81, 255, 0.4)",
                    }}
                    transition="all 0.2s"
                  >
                    {loading ? "Registering..." : "Register"}
                  </Button>
                </motion.div>
              </form>

              <motion.div variants={itemVariants}>
                <Flex
                  direction="column"
                  justify="center"
                  align="start"
                  maxW="100%"
                  mt="0px"
                >
                  <Text
                    color={useColorModeValue("gray.400", "gray.400")}
                    fontWeight="400"
                    fontSize="14px"
                    mt="20px"
                    textAlign="center"
                    w="100%"
                  >
                    Already have an account?{" "}
                    <motion.a
                      href="/login"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        color: "#7551FF",
                        textDecoration: "underline",
                        fontWeight: "600",
                      }}
                    >
                      Log in
                    </motion.a>
                  </Text>
                </Flex>
              </motion.div>

              <motion.div
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Box
                  mt={6}
                  mb={10}
                  mx="auto"
                  maxW="lg"
                  bg={useColorModeValue("#eaf2fe", "whiteAlpha.200")}
                  borderRadius={"16px"}
                  boxShadow={"0 2px 12px #0001"}
                  p={{ base: 4, md: 6 }}
                  fontSize={15}
                  color={useColorModeValue("#334155", "gray.200")}
                  border={"1.5px solid #cbd5e1"}
                  backdropFilter={"blur(8px)"}
                  textAlign="left"
                  as={motion.div}
                  whileHover={{
                    scale: 1.02,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Flex
                    align="center"
                    gap={2}
                    fontWeight={600}
                    fontSize={17}
                    mb={2}
                  >
                    <Icon
                      as={MdOutlineRemoveRedEye}
                      color="brand.500"
                      boxSize={6}
                    />
                    <span>Why do we need your NID and real-time photo?</span>
                  </Flex>
                  <Box
                    as="ul"
                    pl={5}
                    mt={2}
                    mb={1}
                    style={{ listStyle: "disc" }}
                  >
                    <li>
                      <b>Identity Verification:</b> We require your National ID
                      (NID) and a real-time photo to ensure that every account
                      on Nirapod Point is genuine and to prevent misuse of the
                      platform.
                    </li>
                    <li>
                      <b>Community Safety:</b> This helps us maintain a safe and
                      trustworthy environment for all users, and ensures that
                      crime reports are credible.
                    </li>
                    <li>
                      <b>Data Privacy:</b> Your documents and photos are
                      securely stored, encrypted, and never shared with third
                      parties. They are used solely for verification and are
                      only accessible to authorized admin personnel.
                    </li>
                    <li>
                      <b>Your Rights:</b> We respect your privacy and comply
                      with all applicable data protection laws. You may request
                      deletion of your data at any time.
                    </li>
                  </Box>
                  <Text
                    fontSize="xs"
                    color={useColorModeValue("glassyblue.500", "gray.400")}
                  >
                    If you have any questions about how your data is used,
                    please contact our{" "}
                    <a
                      href="mailto:hello3210bye@gmail.com"
                      style={{ color: "#2563eb", textDecoration: "underline" }}
                    >
                      support team
                    </a>
                    .
                  </Text>
                </Box>
              </motion.div>
            </Flex>
          </motion.div>
        </Flex>
      </motion.div>
    </DefaultAuth>
  );
}