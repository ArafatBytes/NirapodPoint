// eslint-disable-next-line
import React from "react";
import { motion } from "framer-motion";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import { Toaster } from "react-hot-toast";
import CrimeReportForm from "./components/CrimeReportForm";
import AccountPage from "./pages/AccountPage";
import AdminPage from "./pages/AdminPage";
import MapPage from "./pages/MapPage";
import ReportPage from "./pages/ReportPage";
import HistoryPage from "./pages/HistoryPage";
import RiskAnalysisPage from "./pages/RiskAnalysisPage";

const features = [
  {
    title: "Report Crimes Instantly",
    desc: "Submit crime reports with location, type, and time in seconds.",
    icon: "📝",
  },
  {
    title: "Interactive Safety Map",
    desc: "Visualize crime-prone zones and safe routes on a live map.",
    icon: "🗺️",
  },
  {
    title: "AI-Powered Safe Routes",
    desc: "Get route suggestions that avoid high-risk areas.",
    icon: "🤖",
  },
  {
    title: "Time-based Risk Analysis",
    desc: "See when and where crime risk peaks in your city.",
    icon: "📊",
  },
];

function ProtectedRoute({ children }) {
  const { user, loading, refreshUser } = useUser();
  const location = useLocation();
  React.useEffect(() => {
    refreshUser && refreshUser();
    // eslint-disable-next-line
  }, []);
  console.log("ProtectedRoute user:", user);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!(user.verified === true || user.verified === "true")) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-glassyblue-100 via-white to-glassyblue-200 flex flex-col items-center justify-center pt-24 pb-12 px-2 overflow-x-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-8 max-w-lg w-full mx-4 flex flex-col items-center mt-8"
          style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-glassyblue-700 mb-2 text-center">
            Account Not Verified
          </h2>
          <p className="text-glassyblue-600 text-center">
            Your account is pending admin verification. You cannot report crimes
            until verified.
          </p>
        </motion.div>
      </div>
    );
  }
  return children;
}

function Navbar() {
  const { user, logout } = useUser();
  return (
    <nav className="w-full flex justify-between items-center px-8 py-4 bg-white/70 backdrop-blur-md shadow-md fixed top-0 left-0 z-20">
      <span className="text-2xl font-bold text-glassyblue-600 tracking-tight">
        Nirapod Point
      </span>
      <div className="space-x-6 hidden md:flex items-center">
        <Link
          to="/"
          className="text-glassyblue-700 hover:text-glassyblue-500 font-medium transition"
        >
          Home
        </Link>
        <Link
          to="/report"
          className="text-glassyblue-700 hover:text-glassyblue-500 font-medium transition"
        >
          Report Crime
        </Link>
        <Link
          to="/map"
          className="text-glassyblue-700 hover:text-glassyblue-500 font-medium transition"
        >
          Map
        </Link>
        <Link
          to="/history"
          className="text-glassyblue-700 hover:text-glassyblue-500 font-medium transition"
        >
          History
        </Link>
        <Link
          to="/risk"
          className="text-glassyblue-700 hover:text-glassyblue-500 font-medium transition"
        >
          Risk Analysis
        </Link>
        {user && (
          <Link
            to="/account"
            className="text-glassyblue-700 hover:text-glassyblue-500 font-medium transition"
          >
            My Account
          </Link>
        )}
        {user && user.admin && (
          <Link
            to="/admin"
            className="text-glassyblue-700 hover:text-glassyblue-500 font-medium transition"
          >
            Admin Panel
          </Link>
        )}
        {user ? (
          <button
            onClick={logout}
            className="ml-4 px-4 py-2 rounded-full bg-glassyblue-500 text-black font-semibold shadow hover:bg-glassyblue-600 transition-colors duration-200"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="ml-4 px-4 py-2 rounded-full bg-glassyblue-500 text-black font-semibold shadow hover:bg-glassyblue-600 transition-colors duration-200"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.25, scale: 1 }}
        transition={{ duration: 1.5 }}
        className="w-[800px] h-[800px] bg-glassyblue-200 rounded-full blur-3xl absolute -top-40 -left-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.18, scale: 1 }}
        transition={{ duration: 1.8, delay: 0.2 }}
        className="w-[600px] h-[600px] bg-glassyblue-100 rounded-full blur-2xl absolute top-1/2 right-0 -translate-y-1/2"
      />
    </div>
  );
}

export { AnimatedBackground };

function FeatureCards() {
  return (
    <div
      id="features"
      className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl mx-auto"
    >
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.1 }}
          className="bg-white/30 backdrop-blur-lg border border-glassyblue-100 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 hover:shadow-2xl transition-transform duration-300"
        >
          <span className="text-4xl mb-2">{f.icon}</span>
          <h3 className="text-xl font-semibold text-glassyblue-700 mb-1">
            {f.title}
          </h3>
          <p className="text-glassyblue-600 text-base">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}

function HomePage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-glassyblue-100 via-white to-glassyblue-200 flex flex-col items-center justify-center pt-24 pb-12 px-2 overflow-x-hidden">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-10 max-w-2xl w-full mx-4 flex flex-col items-center mt-8"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
      >
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-glassyblue-700 mb-4 text-center drop-shadow-lg"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          Nirapod Point
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl text-glassyblue-600 mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          Visualizing crime, protecting lives – one point at a time.
        </motion.p>
        <motion.a
          href="#features"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.97 }}
          className="px-8 py-3 rounded-full bg-glassyblue-500 text-black font-semibold shadow-lg hover:bg-glassyblue-600 transition-colors duration-200 backdrop-blur-md border border-white/20"
        >
          Explore Features
        </motion.a>
      </motion.div>
      <FeatureCards />
      <footer className="mt-16 text-glassyblue-500 text-sm text-center opacity-80">
        &copy; {new Date().getFullYear()} Nirapod Point. All rights reserved.
      </footer>
    </div>
  );
}

function GlassyPage({ title }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-glassyblue-100 via-white to-glassyblue-200 flex flex-col items-center justify-center pt-24 pb-12 px-2 overflow-x-hidden">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="backdrop-blur-xl bg-white/30 border border-glassyblue-200/40 shadow-2xl rounded-3xl p-10 max-w-2xl w-full mx-4 flex flex-col items-center mt-8"
        style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)" }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-glassyblue-700 mb-4 text-center drop-shadow-lg">
          {title}
        </h1>
        <p className="text-glassyblue-600 text-center">
          This page is under construction.
        </p>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <Router>
        <Toaster position="top-center" />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route path="/map" element={<MapPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/risk" element={<RiskAnalysisPage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}
