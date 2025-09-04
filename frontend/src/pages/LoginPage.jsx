import React, { useState } from "react";
import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box,
  Button,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  useDisclosure,
} from "@chakra-ui/react";
import DefaultAuth from "../layouts/auth/Default";
import Nft5 from "../assets/img/nfts/Nft5.png";
import { MdEmail, MdLock, MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import { FiPhone } from "react-icons/fi";

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

export default function LoginPage() {
  const { login } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({ emailOrPhone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  // Reset password states
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetNew, setResetNew] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  function validate() {
    const errs = {};
    if (!form.emailOrPhone) errs.emailOrPhone = "Email or phone is required";
    if (!form.password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const ok = await login(form);
    setLoading(false);
    if (ok) navigate("/");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  const handleResetPassword = () => {
    setResetStep(1);
    setResetEmail("");
    setResetOtp("");
    setResetNew("");
    setResetConfirm("");
    setResetError("");
    setResetSuccess("");
    onOpen();
  };

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
                Sign In
              </Heading>
              <Text
                mb="36px"
                ms="4px"
                color={useColorModeValue("gray.400", "gray.400")}
                fontWeight="400"
                fontSize="md"
              >
                Enter your email and password to sign in!
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
                      Email or Phone
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
                          name="emailOrPhone"
                          value={form.emailOrPhone}
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
                    {errors.emailOrPhone && (
                      <Text color="red.500" fontSize="sm">
                        {errors.emailOrPhone}
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
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        variant="link"
                        color="brand.500"
                        fontSize="sm"
                        fontWeight="400"
                        onClick={handleResetPassword}
                        _hover={{
                          textDecoration: "underline",
                          color: "brand.600",
                        }}
                        p={0}
                        h="auto"
                        minH="auto"
                      >
                        Forgot password?
                      </Button>
                    </motion.div>
                  </FormControl>
                </motion.div>

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
                    {loading ? "Signing in..." : "Sign In"}
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
                    Not registered yet?{" "}
                    <motion.a
                      href="/register"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        color: "#7551FF",
                        textDecoration: "underline",
                        fontWeight: "600",
                      }}
                    >
                      Create an Account
                    </motion.a>
                  </Text>
                </Flex>
              </motion.div>
            </Flex>
          </motion.div>
        </Flex>
      </motion.div>

      {/* Reset Password Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay backdropFilter="blur(6px)" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <ModalContent maxW="md">
            <ModalHeader>Reset Password</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {resetStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormControl mb="20px">
                    <FormLabel fontWeight="500">Email</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={MdEmail} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email"
                        _focus={{
                          boxShadow: "0 0 0 1px #7551FF",
                          borderColor: "#7551FF",
                        }}
                      />
                    </InputGroup>
                  </FormControl>
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      colorScheme="brand"
                      w="100%"
                      isLoading={resetLoading}
                      disabled={!resetEmail}
                      onClick={async () => {
                        setResetLoading(true);
                        setResetError("");
                        setResetSuccess("");
                        try {
                          const res = await fetch("/api/auth/request-reset", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: resetEmail }),
                          });
                          if (!res.ok) throw new Error(await res.text());
                          setResetStep(2);
                          setResetSuccess(
                            "OTP sent to your email (valid for 5 minutes)"
                          );
                          toast.success(
                            "OTP sent to your email (valid for 5 minutes)"
                          );
                        } catch (err) {
                          setResetError(err.message || "Failed to send OTP");
                          toast.error(err.message || "Failed to send OTP");
                        } finally {
                          setResetLoading(false);
                        }
                      }}
                    >
                      {resetLoading ? "Sending..." : "Send OTP"}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {resetStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormControl mb="20px">
                    <FormLabel fontWeight="500">OTP</FormLabel>
                    <Input
                      type="text"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="Enter OTP"
                      _focus={{
                        boxShadow: "0 0 0 1px #7551FF",
                        borderColor: "#7551FF",
                      }}
                    />
                  </FormControl>
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      colorScheme="brand"
                      w="100%"
                      isLoading={resetLoading}
                      disabled={!resetOtp}
                      onClick={async () => {
                        setResetLoading(true);
                        setResetError("");
                        setResetSuccess("");
                        try {
                          setResetStep(3);
                          setResetSuccess(
                            "OTP verified! Please set your new password."
                          );
                          toast.success(
                            "OTP verified! Please set your new password."
                          );
                        } catch (err) {
                          setResetError(
                            err.message || "Invalid or expired OTP"
                          );
                          toast.error(err.message || "Invalid or expired OTP");
                        } finally {
                          setResetLoading(false);
                        }
                      }}
                    >
                      {resetLoading ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {resetStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormControl mb="20px">
                    <FormLabel fontWeight="500">New Password</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={MdLock} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="password"
                        value={resetNew}
                        onChange={(e) => setResetNew(e.target.value)}
                        placeholder="New password"
                        _focus={{
                          boxShadow: "0 0 0 1px #7551FF",
                          borderColor: "#7551FF",
                        }}
                      />
                    </InputGroup>
                  </FormControl>
                  <FormControl mb="20px">
                    <FormLabel fontWeight="500">Confirm New Password</FormLabel>
                    <InputGroup size="lg">
                      <InputLeftElement pointerEvents="none">
                        <Icon as={MdLock} color="gray.400" />
                      </InputLeftElement>
                      <Input
                        type="password"
                        value={resetConfirm}
                        onChange={(e) => setResetConfirm(e.target.value)}
                        placeholder="Confirm new password"
                        _focus={{
                          boxShadow: "0 0 0 1px #7551FF",
                          borderColor: "#7551FF",
                        }}
                      />
                    </InputGroup>
                  </FormControl>
                  <motion.div
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <Button
                      colorScheme="brand"
                      w="100%"
                      isLoading={resetLoading}
                      disabled={!resetNew || resetNew !== resetConfirm}
                      onClick={async () => {
                        setResetLoading(true);
                        setResetError("");
                        setResetSuccess("");
                        try {
                          const res = await fetch("/api/auth/reset-password", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              email: resetEmail,
                              otp: resetOtp,
                              newPassword: resetNew,
                            }),
                          });
                          if (!res.ok) throw new Error(await res.text());
                          setResetSuccess(
                            "Password reset successful! You can now log in."
                          );
                          toast.success(
                            "Password reset successful! You can now log in."
                          );
                          setTimeout(() => {
                            onClose();
                          }, 2000);
                        } catch (err) {
                          setResetError(
                            err.message || "Failed to reset password"
                          );
                          if (
                            (err.message || "").includes(
                              "same as the old password"
                            )
                          ) {
                            toast.error(
                              "New password cannot be the same as the old password."
                            );
                          } else {
                            toast.error(
                              err.message || "Failed to reset password"
                            );
                          }
                        } finally {
                          setResetLoading(false);
                        }
                      }}
                    >
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {resetError && (
                <Text
                  color="red.500"
                  textAlign="center"
                  fontWeight="medium"
                  mt={4}
                >
                  {resetError}
                </Text>
              )}
              {resetSuccess && (
                <Text
                  color="green.600"
                  textAlign="center"
                  fontWeight="medium"
                  mt={4}
                >
                  {resetSuccess}
                </Text>
              )}
            </ModalBody>
          </ModalContent>
        </motion.div>
      </Modal>
    </DefaultAuth>
  );
}
