
import React, { useState, useEffect, useRef } from "react";
import { useUser } from "../context/UserContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function AccountPage() {
  const { user, refreshUser } = useUser();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoHover, setPhotoHover] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess("Account updated successfully!");
      refreshUser && refreshUser();
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setPhotoPreview(dataUrl);
      setShowCamera(false);
      setPhotoLoading(true);
 
      try {
        const res = await fetch("/api/users/me", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
          body: JSON.stringify({ photo: dataUrl }),
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success("Photo updated!");
        refreshUser && refreshUser();
      } catch (err) {
        toast.error("Failed to update photo");
      } finally {
        setPhotoLoading(false);
      }
    
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const cancelCamera = () => {
    setShowCamera(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  if (!user) return <div className="pt-24 text-center">Loading...</div>;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-glassyblue-100 via-white to-glassyblue-200 flex flex-col items-center justify-center pt-24 pb-12 px-2 overflow-x-hidden">
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        onSubmit={handleSubmit}
        className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-8 max-w-lg w-full mx-4 flex flex-col gap-4 mt-8"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div
            style={{ position: "relative", width: 96, height: 96 }}
            onMouseEnter={() => setPhotoHover(true)}
            onMouseLeave={() => setPhotoHover(false)}
            tabIndex={0}
            onFocus={() => setPhotoHover(true)}
            onBlur={() => setPhotoHover(false)}
          >
            {photoPreview || user.photo ? (
              <img
                src={photoPreview || user.photo}
                alt="User Photo"
                className="w-24 h-24 object-cover rounded-full border-2 border-glassyblue-300 shadow bg-white/60 mb-1"
                style={{ boxShadow: "0 2px 12px #0002", width: 96, height: 96 }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full bg-gradient-to-br from-glassyblue-200 to-glassyblue-400 flex items-center justify-center text-3xl font-bold text-white mb-1"
                style={{ width: 96, height: 96 }}
              >
                {user.name?.[0] || "U"}
              </div>
            )}
            {/* Edit overlay on hover */}
            <div
              onClick={startCamera}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 96,
                height: 96,
                borderRadius: "50%",
                background: "rgba(30,41,59,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
                fontWeight: 700,
                fontSize: 22,
                cursor: photoLoading ? "not-allowed" : "pointer",
                opacity: photoHover ? 1 : 0,
                transition: "opacity 0.2s",
                zIndex: 2,
              }}
              title={photoLoading ? "Updating..." : "Edit Photo"}
            >
              <svg
                width="32"
                height="32"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 019 17H7v-2a2 2 0 01.586-1.414z"
                />
              </svg>
            </div>
          </div>
        </div>
        {showCamera && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white/90 rounded-2xl p-6 flex flex-col items-center gap-4 shadow-xl">
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
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="rounded-lg bg-green-500 text-white px-4 py-2 shadow hover:bg-green-600 transition"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={cancelCamera}
                  className="rounded-lg bg-red-500 text-white px-4 py-2 shadow hover:bg-red-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-glassyblue-700 mb-2 text-center">
          My Account
        </h2>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
          />
        </div>
        {error && (
          <div className="text-red-500 text-center font-medium">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-center font-medium">
            {success}
          </div>
        )}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading}
          className="mt-2 px-8 py-3 rounded-full bg-glassyblue-500 text-black font-semibold shadow-lg hover:bg-glassyblue-600 transition-colors duration-200 backdrop-blur-md border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Update Account"}
        </motion.button>
      </motion.form>
      <motion.form
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setPwError("");
          setPwSuccess("");
          setPwLoading(true);
          if (!pwCurrent || !pwNew || pwNew !== pwConfirm) {
            setPwError(
              "Please fill all fields and make sure new passwords match."
            );
            setPwLoading(false);
            toast.error(
              "Please fill all fields and make sure new passwords match."
            );
            return;
          }
          try {
            const res = await fetch("/api/users/me/change-password", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
              },
              body: JSON.stringify({
                currentPassword: pwCurrent,
                newPassword: pwNew,
              }),
            });
            if (!res.ok) throw new Error(await res.text());
            setPwSuccess("Password changed successfully!");
            toast.success("Password changed successfully!");
            setPwCurrent("");
            setPwNew("");
            setPwConfirm("");
          } catch (err) {
            setPwError(err.message || "Failed to change password");
            toast.error(err.message || "Failed to change password");
          } finally {
            setPwLoading(false);
          }
        }}
        className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-8 max-w-lg w-full mx-4 flex flex-col gap-4 mt-8"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
      >
        <h3 className="text-xl font-bold text-glassyblue-700 mb-2 text-center">
          Change Password
        </h3>
        <input
          type="password"
          value={pwCurrent}
          onChange={(e) => setPwCurrent(e.target.value)}
          placeholder="Current password"
          className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
        />
        <input
          type="password"
          value={pwNew}
          onChange={(e) => setPwNew(e.target.value)}
          placeholder="New password"
          className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
        />
        <input
          type="password"
          value={pwConfirm}
          onChange={(e) => setPwConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
        />
        {pwError && (
          <div className="text-red-500 text-center font-medium">{pwError}</div>
        )}
        {pwSuccess && (
          <div className="text-green-600 text-center font-medium">
            {pwSuccess}
          </div>
        )}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          disabled={pwLoading}
          className="mt-2 px-8 py-3 rounded-full bg-glassyblue-500 text-black font-semibold shadow-lg hover:bg-glassyblue-600 transition-colors duration-200 backdrop-blur-md border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pwLoading ? "Changing..." : "Change Password"}
        </motion.button>
      </motion.form>
    </div>
  );
}