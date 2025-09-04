import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Box,
  Flex,
  SimpleGrid,
  Text,
  Avatar,
  Badge,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  Image,
  useColorModeValue,
} from "@chakra-ui/react";
import Banner from "../views/admin/profile/components/Banner";
import avatar4 from "../assets/img/avatars/avatar4.png";
import bannerImg from "../assets/img/auth/banner.png";
import FixedPlugin from "../components/fixedPlugin/FixedPlugin";

const statusOptions = [
  { label: "All", value: "all" },
  { label: "Verified", value: "true" },
  { label: "Unverified", value: "false" },
];

export default function AdminPage() {
  const { user, jwt } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState("");
  const [modalImg, setModalImg] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [userToDelete, setUserToDelete] = useState(null);
  const [approveAllLoading, setApproveAllLoading] = useState(false);
  const [userCrimeCounts, setUserCrimeCounts] = useState({});
  const textColor = useColorModeValue("secondaryGray.900", "white");
  
  const modalBg = useColorModeValue("whiteAlpha.900", "navy.800");
  const modalBorderColor = useColorModeValue("gray.200", "whiteAlpha.300");
  const modalTextColor = useColorModeValue("gray.600", "gray.300");
  const modalHeadingColor = useColorModeValue("secondaryGray.900", "white");

  useEffect(() => {
    if (!user || !user.admin) return;
    fetchUsers();
    
  }, [status, user]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users?verified=${status}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const usersData = await res.json();
      setUsers(usersData);
      
      const countsRes = await fetch(`/api/users/crime-counts`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      let counts = {};
      if (countsRes.ok) {
        counts = await countsRes.json();
      } else {
        
        usersData.forEach((u) => {
          counts[u.id] = 0;
        });
      }
      setUserCrimeCounts(counts);
    } catch (err) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, approve) => {
    setActionLoading(id + approve);
    setError("");
    try {
      const res = await fetch(`/api/users/${id}/verify?approve=${approve}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      fetchUsers();
      
      const user = users.find((u) => u.id === id);
      if (approve) {
        if (data.verified) {
          toast.success(
            data.message ||
              `Approved ${user?.name || "user"}'s account and sent email.`
          );
        } else {
          toast.error(
            data.message || `User not verified. ${user?.name || "user"}`
          );
        }
      } else {
        toast.success(
          `Disapproved ${
            user?.name || "user"
          }'s account, sent email, and deleted their crimes.`
        );
      }
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setActionLoading("");
    }
  };

  if (!user || !user.admin) {
    return (
      <Box pt={32} textAlign="center">
        <Text fontSize="2xl" fontWeight="bold" color="purple.700">
          Access Denied: Admins Only
        </Text>
      </Box>
    );
  }

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
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}
      >
        <Text
          fontSize={{ base: "2xl", md: "3xl" }}
          fontWeight="extrabold"
          color={textColor}
          mb={8}
          textAlign="center"
          dropShadow="lg"
        >
          Admin Panel
        </Text>
        <Flex
          direction={{ base: "column", md: "row" }}
          align={{ md: "center" }}
          justify={{ md: "space-between" }}
          gap={4}
          mb={8}
        >
          <Flex gap={2} justify="center">
            {statusOptions.map((opt) => (
              <Button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                variant={status === opt.value ? "solid" : "outline"}
                bgGradient={
                  status === opt.value
                    ? "linear(to-r, #7551FF, #422AFB)"
                    : undefined
                }
                color={status === opt.value ? "white" : "purple.700"}
                borderColor="purple.300"
                rounded="full"
                size="md"
                fontWeight="bold"
                _hover={{
                  bgGradient: "linear(to-r, #422AFB, #7551FF)",
                  color: "white",
                }}
                transition="all 0.2s"
              >
                {opt.label}
              </Button>
            ))}
          </Flex>
          {status === "false" && users.length > 0 && (
            <Button
              onClick={async () => {
                setApproveAllLoading(true);
                setError("");
                const unverifiedUsers = users.filter((u) => !u.verified);
                let approved = 0,
                  failed = 0;
                const batchSize = 5;
                const processBatch = async (batch) => {
                  await Promise.all(
                    batch.map(async (u) => {
                      try {
                        const res = await fetch(
                          `/api/users/${u.id}/verify?approve=true`,
                          {
                            method: "PATCH",
                            headers: { Authorization: `Bearer ${jwt}` },
                          }
                        );
                        if (!res.ok) throw new Error(await res.text());
                        const data = await res.json();
                        if (data.verified) {
                          toast.success(
                            data.message || `Approved ${u.name || "user"}`
                          );
                          approved++;
                        } else {
                          toast.error(
                            data.message ||
                              `User not verified: ${u.name || "user"}`
                          );
                          failed++;
                        }
                      } catch (err) {
                        toast.error(
                          err.message || `Failed to approve ${u.name || "user"}`
                        );
                        failed++;
                      }
                    })
                  );
                };
                for (let i = 0; i < unverifiedUsers.length; i += batchSize) {
                  const batch = unverifiedUsers.slice(i, i + batchSize);
                  await processBatch(batch);
                }
                setApproveAllLoading(false);
                fetchUsers();
                toast(
                  `Approve All complete: ${approved} approved, ${failed} failed.`,
                  { duration: 6000 }
                );
              }}
              isLoading={approveAllLoading}
              loadingText="Approving All..."
              bgGradient="linear(to-r, #38A169, #805AD5)"
              color="white"
              rounded="full"
              shadow="lg"
              size="md"
              fontWeight="bold"
              _hover={{ bgGradient: "linear(to-r, #805AD5, #38A169)" }}
              transition="all 0.2s"
              ml={{ md: "auto" }}
            >
              Approve All
            </Button>
          )}
        </Flex>
        {error && (
          <Alert status="error" mb={4} rounded="md" justifyContent="center">
            <AlertIcon />
            {error}
          </Alert>
        )}
        {loading ? (
          <Flex justify="center" align="center" minH="40vh">
            <Spinner
              size="xl"
              color="purple.500"
              thickness="4px"
              speed="0.65s"
            />
          </Flex>
        ) : users.length === 0 ? (
          <Text textAlign="center" fontSize="lg" color="purple.600">
            No users found.
          </Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              >
                <Banner
                  banner={bannerImg}
                  avatar={u.photo || avatar4}
                  name={u.name}
                  job={u.email}
                  posts={userCrimeCounts[u.id] ?? 0}
                  followers={undefined}
                  following={undefined}
                  onAvatarClick={
                    u.photo
                      ? () => {
                          setModalImg({
                            src: u.photo,
                            alt: `Photo of ${u.name}`,
                          });
                          onOpen();
                        }
                      : undefined
                  }
                >
                  <Flex direction="column" align="center" w="100%" mt={2}>
                    <Text color="purple.700" fontSize="md" fontWeight="bold">
                      {u.phone}
                    </Text>
                    <Text
                      fontSize="sm"
                      color="purple.700"
                      fontWeight="bold"
                      mt={1}
                    >
                      Joined: {u.createdAt?.slice(0, 10)}
                    </Text>
                    <Flex gap={2} mt={2} justify="center">
                      <Badge
                        colorScheme={u.verified ? "purple" : "yellow"}
                        bgGradient={
                          u.verified
                            ? "linear(to-r, #7551FF, #422AFB)"
                            : undefined
                        }
                        color={u.verified ? "white" : "yellow.800"}
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontWeight="bold"
                        fontSize="xs"
                      >
                        {u.verified ? "Verified" : "Unverified"}
                      </Badge>
                      {u.isAdmin && (
                        <Badge
                          colorScheme="blue"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontWeight="bold"
                          fontSize="xs"
                        >
                          Admin
                        </Badge>
                      )}
                    </Flex>
                    {(u.nidFront || u.nidBack) && (
                      <Flex w="100%" mt={4} gap={4} justify="center">
                        {u.nidFront && (
                          <Image
                            src={`data:image/jpeg;base64,${u.nidFront}`}
                            alt="NID Front"
                            width="48%"
                            height="140px"
                            objectFit="cover"
                            borderRadius="lg"
                            borderWidth={2}
                            borderColor="purple.200"
                            boxShadow="md"
                            bg="whiteAlpha.700"
                            cursor="pointer"
                            onClick={() => {
                              setModalImg({
                                src: `data:image/jpeg;base64,${u.nidFront}`,
                                alt: `NID Front of ${u.name}`,
                              });
                              onOpen();
                            }}
                            title="NID Front"
                          />
                        )}
                        {u.nidBack && (
                          <Image
                            src={`data:image/jpeg;base64,${u.nidBack}`}
                            alt="NID Back"
                            width="48%"
                            height="140px"
                            objectFit="cover"
                            borderRadius="lg"
                            borderWidth={2}
                            borderColor="purple.200"
                            boxShadow="md"
                            bg="whiteAlpha.700"
                            cursor="pointer"
                            onClick={() => {
                              setModalImg({
                                src: `data:image/jpeg;base64,${u.nidBack}`,
                                alt: `NID Back of ${u.name}`,
                              });
                              onOpen();
                            }}
                            title="NID Back"
                          />
                        )}
                      </Flex>
                    )}
                  </Flex>
                </Banner>
                <Flex justify="center" gap={2} mt={2}>
                  {!u.verified ? (
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button
                        onClick={() => handleVerify(u.id, true)}
                        isLoading={actionLoading === u.id + true}
                        loadingText="Approving..."
                        bgGradient="linear(to-r, #38A169, #805AD5)"
                        color="white"
                        rounded="full"
                        shadow="md"
                        size="sm"
                        fontWeight="bold"
                        _hover={{
                          bgGradient: "linear(to-r, #805AD5, #38A169)",
                        }}
                        transition="all 0.2s"
                      >
                        Approve
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Button
                        onClick={() => handleVerify(u.id, false)}
                        isLoading={actionLoading === u.id + false}
                        loadingText="Disapproving..."
                        bgGradient="linear(to-r, #F56565, #805AD5)"
                        color="white"
                        rounded="full"
                        shadow="md"
                        size="sm"
                        fontWeight="bold"
                        _hover={{
                          bgGradient: "linear(to-r, #805AD5, #F56565)",
                        }}
                        transition="all 0.2s"
                      >
                        Disapprove
                      </Button>
                    </motion.div>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      onClick={() => setUserToDelete(u)}
                      isLoading={actionLoading === u.id + "delete"}
                      loadingText="Deleting..."
                      bgGradient="linear(to-r, #718096, #805AD5)"
                      color="white"
                      rounded="full"
                      shadow="md"
                      size="sm"
                      fontWeight="bold"
                      _hover={{ bgGradient: "linear(to-r, #805AD5, #718096)" }}
                      transition="all 0.2s"
                    >
                      Delete
                    </Button>
                  </motion.div>
                </Flex>
              </motion.div>
            ))}
          </SimpleGrid>
        )}
      </motion.div>
      {/* Photo Modal */}
      {modalImg && (
        <>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            zIndex={10001}
            onClick={() => setModalImg(null)}
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
              <Box position="relative">
                <Button
                  position="absolute"
                  top={2}
                  right={2}
                  onClick={() => setModalImg(null)}
                  color="white"
                  bg="blackAlpha.600"
                  _hover={{ bg: "blackAlpha.700" }}
                  borderRadius="full"
                  zIndex={10003}
                  size="sm"
                  minW="40px"
                  h="40px"
                >
                  ✕
                </Button>
                <Image
                  src={modalImg?.src}
                  alt={modalImg?.alt || "Full size"}
                  maxH="90vh"
                  maxW="90vw"
                  objectFit="contain"
                  borderRadius="lg"
                  boxShadow="2xl"
                />
              </Box>
            </motion.div>
          </Box>
        </>
      )}
      {userToDelete && (
        <>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            zIndex={10001}
            onClick={() => setUserToDelete(null)}
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
                bg={modalBg}
                borderRadius="2xl"
                boxShadow="2xl"
                maxW="sm"
                overflow="hidden"
                border="1px"
                borderColor={modalBorderColor}
              >
                <Flex
                  justify="space-between"
                  align="center"
                  p={4}
                  borderBottom="1px"
                  borderColor={modalBorderColor}
                >
                  <Text
                    fontWeight="bold"
                    fontSize="lg"
                    color={modalHeadingColor}
                  >
                    Confirm Deletion
                  </Text>
                  <Button
                    onClick={() => setUserToDelete(null)}
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
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    mb={2}
                    color={modalHeadingColor}
                  >
                    Are you sure you want to delete user '{userToDelete?.name}'
                    and all their crime reports?
                  </Text>
                  <Text color={modalTextColor} mb={4} textAlign="center">
                    This action cannot be undone.
                  </Text>
                  <Flex gap={4} mt={2}>
                    <Button
                      onClick={() => setUserToDelete(null)}
                      colorScheme="gray"
                      variant="outline"
                      rounded="full"
                    >
                      Cancel
                    </Button>
                    <Button
                      colorScheme="red"
                      rounded="full"
                      isLoading={actionLoading === userToDelete?.id + "delete"}
                      loadingText="Deleting..."
                      onClick={async () => {
                        setActionLoading(userToDelete.id + "delete");
                        setError("");
                        try {
                          const res = await fetch(
                            `/api/users/${userToDelete.id}`,
                            {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${jwt}` },
                            }
                          );
                          if (!res.ok) throw new Error(await res.text());
                          const data = await res.json();
                          toast.success(
                            data.message ||
                              `Deleted user '${userToDelete.name}' and their crimes.`
                          );
                          setUserToDelete(null);
                          fetchUsers();
                        } catch (err) {
                          toast.error(
                            err.message ||
                              `Failed to delete user '${userToDelete.name}'.`
                          );
                          setError(
                            err.message ||
                              `Failed to delete user '${userToDelete.name}'.`
                          );
                        } finally {
                          setActionLoading("");
                        }
                      }}
                    >
                      Confirm Delete
                    </Button>
                  </Flex>
                </Box>
              </Box>
            </motion.div>
          </Box>
        </>
      )}
      <FixedPlugin />
    </Box>
  );
}