import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";

const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

function RegisterPage() {
  const { register, login } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    nidFront: null,
    nidBack: null,
    photo: null,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();
  const [photoPreview, setPhotoPreview] = useState(null);

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
  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setForm((f) => ({ ...f, photo: dataUrl }));
      setPhotoPreview(dataUrl);
      setShowCamera(false);

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

  function validate() {
    const errs = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.email) errs.email = "Email is required";
    else if (!form.email.includes("@")) errs.email = "Invalid email";
    if (!form.phone) errs.phone = "Phone is required";
    else if (!bdPhoneRegex.test(form.phone))
      errs.phone = "Invalid BD phone number";
    if (!form.password || form.password.length < 6)
      errs.password = "Password must be at least 6 characters";
    if (!form.nidFront) errs.nidFront = "NID front image required";
    if (!form.nidBack) errs.nidBack = "NID back image required";
    if (!form.photo) errs.photo = "Real-time photo required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    const ok = await register(formData);
    if (ok) {
      await login({
        emailOrPhone: form.email || form.phone,
        password: form.password,
      });
      navigate("/");
    }
    setLoading(false);
  }

  function handleChange(e) {
    const { name, value, files } = e.target;
    setForm((f) => ({ ...f, [name]: files ? files[0] : value }));
  }

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
        <h2 className="text-2xl md:text-3xl font-bold text-glassyblue-700 mb-2 text-center">
          Create an Account
        </h2>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">
            Name<span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
          />
          {errors.name && (
            <span className="text-red-500 text-sm">{errors.name}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">
            Email<span className="text-red-500">*</span>
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
          />
          {errors.email && (
            <span className="text-red-500 text-sm">{errors.email}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">
            Phone (BD)<span className="text-red-500">*</span>
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
            placeholder="01XXXXXXXXX"
          />
          {errors.phone && (
            <span className="text-red-500 text-sm">{errors.phone}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">
            Password<span className="text-red-500">*</span>
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
          />
          {errors.password && (
            <span className="text-red-500 text-sm">{errors.password}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">
            NID Front Image<span className="text-red-500">*</span>
          </label>
          <input
            name="nidFront"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
          />
          {errors.nidFront && (
            <span className="text-red-500 text-sm">{errors.nidFront}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">
            NID Back Image<span className="text-red-500">*</span>
          </label>
          <input
            name="nidBack"
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="rounded-lg border border-glassyblue-200 p-2 bg-white/60 focus:outline-none focus:ring-2 focus:ring-glassyblue-400"
          />
          {errors.nidBack && (
            <span className="text-red-500 text-sm">{errors.nidBack}</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="font-medium text-glassyblue-700">
            Your Image <span className="text-red-500">*</span>
          </label>
          {photoPreview ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={photoPreview}
                alt="Preview"
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 12,
                  objectFit: "cover",
                  boxShadow: "0 2px 12px #0002",
                }}
              />
              <button
                type="button"
                onClick={startCamera}
                className="rounded-lg bg-glassyblue-500 text-black px-4 py-2 mt-1 shadow hover:bg-glassyblue-600 transition"
              >
                Retake Photo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={startCamera}
              className="rounded-lg bg-glassyblue-500 text-black px-4 py-2 shadow hover:bg-glassyblue-600 transition"
            >
              Take Photo
            </button>
          )}
          {errors.photo && (
            <span className="text-red-500 text-sm">{errors.photo}</span>
          )}
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
        <motion.button
          type="submit"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading}
          className="mt-2 px-8 py-3 rounded-full bg-glassyblue-500 text-black font-semibold shadow-lg hover:bg-glassyblue-600 transition-colors duration-200 backdrop-blur-md border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Registering..." : "Register"}
        </motion.button>
        <div className="text-center mt-2 text-glassyblue-600">
          Already have an account?{" "}
          <a href="/login" className="underline hover:text-glassyblue-700">
            Login
          </a>
        </div>
      </motion.form>
      <div
        className="mt-6 max-w-lg mx-auto"
        style={{
          background: "#eaf2fe",
          borderRadius: 16,
          boxShadow: "0 2px 12px #0001",
          padding: "18px 24px",
          fontSize: 15,
          color: "#334155",
          border: "1.5px solid #cbd5e1",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            fontSize: 17,
            marginBottom: 2,
          }}
        >
          <span
            style={{
              color: "#2563eb",
              fontSize: 22,
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#2563eb"
                strokeWidth="2"
                fill="#eaf2fe"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4h.01"
              />
            </svg>
          </span>
          <span>Why do we need your NID and real-time photo?</span>
        </div>
        <ul className="list-disc pl-5 mt-2 mb-1">
          <li>
            <b>Identity Verification:</b> We require your National ID (NID) and
            a real-time photo to ensure that every account on Nirapod Point is
            genuine and to prevent misuse of the platform.
          </li>
          <li>
            <b>Community Safety:</b> This helps us maintain a safe and
            trustworthy environment for all users, and ensures that crime
            reports are credible.
          </li>
          <li>
            <b>Data Privacy:</b> Your documents and photos are securely stored,
            encrypted, and never shared with third parties. They are used solely
            for verification and are only accessible to authorized admin
            personnel.
          </li>
          <li>
            <b>Your Rights:</b> We respect your privacy and comply with all
            applicable data protection laws. You may request deletion of your
            data at any time.
          </li>
        </ul>
        <span className="text-xs text-glassyblue-500">
          If you have any questions about how your data is used, please contact
          our{" "}
          <a
            href="mailto:hello3210bye@gmail.com"
            style={{ color: "#2563eb", textDecoration: "underline" }}
          >
            support team
          </a>
          .
        </span>
      </div>
    </div>
  );
}

export default RegisterPage;
