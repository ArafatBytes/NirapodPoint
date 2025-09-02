import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

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
  const [userToDelete, setUserToDelete] = useState(null);
  const [approveAllLoading, setApproveAllLoading] = useState(false);

  useEffect(() => {
    if (!user || !user.admin) return;
    fetchUsers();
    // eslint-disable-next-line
  }, [status, user]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/users?verified=${status}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers(await res.json());
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
      <div className="pt-32 text-center text-2xl text-glassyblue-700 font-bold">
        Access Denied: Admins Only
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-glassyblue-100 via-white to-glassyblue-200 flex flex-col items-center pt-24 pb-12 px-2 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-6xl mx-auto"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-glassyblue-700 mb-6 text-center drop-shadow-lg">
          Admin Panel
        </h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex gap-2 justify-center">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatus(opt.value)}
                className={`px-4 py-2 rounded-full font-semibold border transition-colors duration-200 backdrop-blur-md ${
                  status === opt.value
                    ? "bg-glassyblue-500 text-black border-glassyblue-600"
                    : "bg-white/40 text-glassyblue-700 border-glassyblue-200 hover:bg-glassyblue-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Approve All button, only for unverified filter and if there are users */}
          {status === "false" && users.length > 0 && (
            <button
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
              disabled={approveAllLoading}
              className="ml-auto px-6 py-2 rounded-full bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {approveAllLoading ? "Approving All..." : "Approve All"}
            </button>
          )}
        </div>
        {error && (
          <div className="text-red-500 text-center font-medium mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <div className="text-center text-lg text-glassyblue-600">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="text-center text-lg text-glassyblue-600">
            No users found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="backdrop-blur-xl bg-white/40 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-6 flex flex-col gap-3 items-center"
                style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
              >
                {/* User real-time photo */}
                {u.photo ? (
                  <img
                    src={u.photo}
                    alt="User Photo"
                    className="w-20 h-20 object-cover rounded-full border-2 border-glassyblue-300 shadow bg-white/60 cursor-pointer mb-2"
                    title="User Photo"
                    onClick={() =>
                      setModalImg({ src: u.photo, alt: `Photo of ${u.name}` })
                    }
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-glassyblue-200 to-glassyblue-400 flex items-center justify-center text-2xl font-bold text-white mb-2">
                    {u.name?.[0] || "U"}
                  </div>
                )}
                <div className="text-lg font-semibold text-glassyblue-700 text-center">
                  {u.name}
                </div>
                <div className="text-glassyblue-600 text-sm break-all">
                  {u.email}
                </div>
                <div className="text-glassyblue-600 text-sm">{u.phone}</div>
                <div className="text-xs text-glassyblue-500">
                  Joined: {u.createdAt?.slice(0, 10)}
                </div>
                <div className="flex gap-2 mt-2">
                  {u.nidFront && (
                    <img
                      src={`data:image/jpeg;base64,${u.nidFront}`}
                      alt="NID Front"
                      className="w-20 h-14 object-cover rounded-lg border-2 border-glassyblue-200 shadow bg-white/60 cursor-pointer"
                      title="NID Front"
                      onClick={() =>
                        setModalImg({
                          src: `data:image/jpeg;base64,${u.nidFront}`,
                          alt: `NID Front of ${u.name}`,
                        })
                      }
                    />
                  )}
                  {u.nidBack && (
                    <img
                      src={`data:image/jpeg;base64,${u.nidBack}`}
                      alt="NID Back"
                      className="w-20 h-14 object-cover rounded-lg border-2 border-glassyblue-200 shadow bg-white/60 cursor-pointer"
                      title="NID Back"
                      onClick={() =>
                        setModalImg({
                          src: `data:image/jpeg;base64,${u.nidBack}`,
                          alt: `NID Back of ${u.name}`,
                        })
                      }
                    />
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  {u.verified ? (
                    <span className="px-3 py-1 rounded-full bg-green-200 text-green-800 text-xs font-bold">
                      Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-yellow-200 text-yellow-800 text-xs font-bold">
                      Unverified
                    </span>
                  )}
                  {u.isAdmin && (
                    <span className="px-3 py-1 rounded-full bg-blue-200 text-blue-800 text-xs font-bold">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  {!u.verified ? (
                    <button
                      onClick={() => handleVerify(u.id, true)}
                      disabled={actionLoading === u.id + true}
                      className="px-4 py-2 rounded-full bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionLoading === u.id + true
                        ? "Approving..."
                        : "Approve"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerify(u.id, false)}
                      disabled={actionLoading === u.id + false}
                      className="px-4 py-2 rounded-full bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {actionLoading === u.id + false
                        ? "Disapproving..."
                        : "Disapprove"}
                    </button>
                  )}
                  <button
                    onClick={() => setUserToDelete(u)}
                    disabled={actionLoading === u.id + "delete"}
                    className="px-4 py-2 rounded-full bg-gray-400 text-white font-semibold shadow hover:bg-gray-600 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {actionLoading === u.id + "delete"
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
      {/* Modal for NID image */}
      {modalImg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setModalImg(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "90vw", maxHeight: "90vh" }}
          >
            <img
              src={modalImg.src}
              alt={modalImg.alt}
              className="max-w-[80vw] max-h-[70vh] rounded-xl border-4 border-glassyblue-300 shadow-xl"
              style={{ objectFit: "contain" }}
            />
            <button
              onClick={() => setModalImg(null)}
              className="mt-4 px-6 py-2 rounded-full bg-glassyblue-500 text-black font-semibold shadow hover:bg-glassyblue-600 transition-colors duration-200"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
      {/* Modal for delete confirmation */}
      {userToDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setUserToDelete(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 flex flex-col items-center max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z"
                />
              </svg>
              Confirm Deletion
            </div>
            <div className="text-glassyblue-700 text-center mb-4">
              Are you sure you want to{" "}
              <span className="font-bold text-red-600">delete</span> user{" "}
              <span className="font-semibold">'{userToDelete.name}'</span> and{" "}
              <span className="font-bold text-red-600">
                all their crime reports
              </span>
              ?<br />
              This action cannot be undone.
            </div>
            <div className="flex gap-4 mt-2">
              <button
                className="px-5 py-2 rounded-full bg-gray-300 text-black font-semibold shadow hover:bg-gray-400 transition-colors duration-200"
                onClick={() => setUserToDelete(null)}
                disabled={actionLoading === userToDelete.id + "delete"}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 rounded-full bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={async () => {
                  setActionLoading(userToDelete.id + "delete");
                  setError("");
                  try {
                    const res = await fetch(`/api/users/${userToDelete.id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${jwt}` },
                    });
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
                disabled={actionLoading === userToDelete.id + "delete"}
              >
                {actionLoading === userToDelete.id + "delete"
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
