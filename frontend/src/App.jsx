
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
import DebugCrimeRouteDemo from "./pages/DebugCrimeRouteDemo";
import { ChakraProvider } from "@chakra-ui/react";
import { Box, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import theme from "./theme/theme";
import FixedPlugin from "./components/fixedPlugin/FixedPlugin";
import Card from "./components/card/Card";

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
    title: "Smart Route Planning",
    desc: "Get intelligent route suggestions that automatically find the safest path while avoiding high-risk areas.",
    icon: "🧭",
  },
  {
    title: "Time-based Risk Analysis",
    desc: "See when and where crime risk peaks in your city.",
    icon: "📊",
  },
];

function ProtectedRoute({ children, context = "" }) {
  const { user, loading, refreshUser } = useUser();
  const location = useLocation();
  React.useEffect(() => {
    refreshUser && refreshUser();
  }, []);
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  if (context === "admin" && !(user.admin === true || user.admin === "true")) {
    return <Navigate to="/" replace />;
  }
  
  if (
    context !== "account" &&
    context !== "admin" &&
    !(user.verified === true || user.verified === "true")
  ) {
    let message =
      "Your account is pending admin verification. You cannot access this page until verified.";
    if (context === "map")
      message =
        "Your account is pending admin verification. You cannot access the map until verified.";
    if (context === "report")
      message =
        "Your account is pending admin verification. You cannot report crimes until verified.";
    if (context === "history")
      message =
        "Your account is pending admin verification. You cannot view your history until verified.";
    if (context === "risk")
      message =
        "Your account is pending admin verification. You cannot view risk analysis until verified.";
    if (context === "debug")
      message =
        "Your account is pending admin verification. You cannot access the debug tools until verified.";
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
          <p className="text-glassyblue-600 text-center">{message}</p>
        </motion.div>
      </div>
    );
  }
  return children;
}

function Navbar() {
  const { user, logout } = useUser();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  
  const navbarTextColor = useColorModeValue("#1a202c", "white");
  const navbarTextHoverColor = useColorModeValue("#000000", "white");
  const logoTextColor = useColorModeValue("#000000", "white");
  const mobileMenuTextColor = useColorModeValue("#1a202c", "white");
  const mobileMenuTextHoverColor = useColorModeValue("#000000", "white");
  const mobileMenuHeaderTextColor = useColorModeValue("#000000", "white");

  
  const getSelectedMenu = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path === "/report") return "report";
    if (path === "/map") return "map";
    if (path === "/history") return "history";
    if (path === "/risk") return "risk";
    if (path === "/account") return "account";
    if (path === "/admin") return "admin";
    return "home"; 
  };

  const selectedMenu = getSelectedMenu();

  
  const menuItems = [
    { key: "home", label: "Home", path: "/" },
    { key: "report", label: "Report Crime", path: "/report" },
    { key: "map", label: "Map", path: "/map" },
    { key: "history", label: "History", path: "/history" },
    { key: "risk", label: "Risk Analysis", path: "/risk" },
  ];

  
  if (user) {
    menuItems.push({ key: "account", label: "My Account", path: "/account" });
  }
  if (user && user.admin) {
    menuItems.push({ key: "admin", label: "Admin Panel", path: "/admin" });
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] w-[90%] max-w-6xl">
        <div className="relative">
        
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl" />

        
          <div className="relative flex justify-between items-center px-8 py-4">
            
            <span
              className="text-2xl font-bold tracking-tight drop-shadow-sm"
              style={{ color: logoTextColor }}
            >
              Nirapod Point
            </span>

            
            <div className="hidden md:flex items-center space-x-8 relative">
              {menuItems.map((item) => (
                <div key={item.key} className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={item.path}
                      className="font-medium transition-all duration-200 px-2 py-1"
                      style={{
                        color: navbarTextColor,
                        ":hover": { color: navbarTextHoverColor },
                      }}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                  
                  {selectedMenu === item.key && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-4 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-700 rounded-full"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            
            <div className="hidden md:flex items-center">
              {user ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={logout}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-purple-400/30"
                >
                  Logout
                </motion.button>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to="/login"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-purple-400/30"
                  >
                    Login
                  </Link>
                </motion.div>
              )}
            </div>

            
            <div className="md:hidden">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 border border-purple-400/30 shadow-lg"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />

          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-80 bg-white/10 backdrop-blur-xl border-l border-white/20 shadow-2xl"
          >
            <div className="flex flex-col h-full">
              
              <div className="flex justify-between items-center p-6 border-b border-white/20">
                <span
                  className="text-xl font-bold"
                  style={{ color: mobileMenuHeaderTextColor }}
                >
                  Menu
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 border border-purple-400/30 shadow-lg"
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </motion.button>
              </div>

              
              <div className="flex-1 p-6 space-y-4">
                {menuItems.map((item) => (
                  <div key={item.key} className="relative">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        to={item.path}
                        onClick={toggleMobileMenu}
                        className="block font-medium transition-all duration-200 py-3 px-4 rounded-lg hover:bg-black/10"
                        style={{
                          color: mobileMenuTextColor,
                          ":hover": { color: mobileMenuTextHoverColor },
                        }}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                    
                    {selectedMenu === item.key && (
                      <motion.div
                        layoutId="mobile-navbar-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-purple-700 rounded-full"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              
              <div className="p-6 border-t border-white/20">
                {user ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => {
                      logout();
                      toggleMobileMenu();
                    }}
                    className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-purple-400/30"
                  >
                    Logout
                  </motion.button>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to="/login"
                      onClick={toggleMobileMenu}
                      className="block w-full px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border border-purple-400/30 text-center"
                    >
                      Login
                    </Link>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
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
  const cardBg = useColorModeValue("white", "#111c44");
  const borderColor = useColorModeValue("glassyblue-100", "whiteAlpha.300");

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
          className="backdrop-blur-lg border rounded-2xl shadow-lg p-6 flex flex-col items-center text-center hover:scale-105 hover:shadow-2xl transition-transform duration-300"
          style={{
            backgroundColor: cardBg,
            borderColor: borderColor,
          }}
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
  const cardBg = useColorModeValue("white", "#111c44");
  const borderColor = useColorModeValue("glassyblue-200/40", "whiteAlpha.300");
  const buttonTextColor = useColorModeValue("black", "white");

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-glassyblue-100 via-white to-glassyblue-200 flex flex-col items-center justify-center pt-24 pb-12 px-2 overflow-x-hidden">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="backdrop-blur-xl border shadow-2xl rounded-3xl p-10 max-w-2xl w-full mx-4 flex flex-col items-center mt-8"
        style={{
          backgroundColor: cardBg,
          borderColor: borderColor,
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)",
        }}
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
          className="px-8 py-3 rounded-full bg-glassyblue-500 font-semibold shadow-lg hover:bg-glassyblue-600 transition-colors duration-200 backdrop-blur-md border border-white/20"
          style={{ color: buttonTextColor }}
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
    <ChakraProvider theme={theme} resetCSS>
      <UserProvider>
        <Router>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                zIndex: 10000,
                marginTop: "80px",
                marginLeft: "auto",
                marginRight: "auto",
              },
            }}
          />
          <style>
            {`
              /* Ensure Leaflet elements don't overlap navbar */
              .leaflet-popup {
                z-index: 1000 !important;
              }
              .leaflet-control {
                z-index: 1000 !important;
              }
              .leaflet-top,
              .leaflet-bottom {
                z-index: 1000 !important;
              }
              .leaflet-pane {
                z-index: 1 !important;
              }
              
              /* Ensure toast messages appear above navbar */
              .react-hot-toast {
                z-index: 10000 !important;
                position: fixed !important;
                top: 120px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
              }
              
              /* Toast container positioning */
              .react-hot-toast__toast {
                z-index: 10000 !important;
                margin-top: 0 !important;
                margin-left: auto !important;
                margin-right: auto !important;
              }
              
              /* Toast container wrapper */
              .react-hot-toast__container {
                z-index: 10000 !important;
                position: fixed !important;
                top: 120px !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
              }
              
              /* Ensure modals appear above navbar but below toast */
              .chakra-modal__overlay {
                z-index: 10001 !important;
              }
              .chakra-modal__content {
                z-index: 10001 !important;
              }
            `}
          </style>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/account"
              element={
                <ProtectedRoute context="account">
                  <AccountPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute context="admin">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute context="report">
                  <ReportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute context="map">
                  <MapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute context="history">
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/risk"
              element={
                <ProtectedRoute context="risk">
                  <RiskAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/debug-crime-route"
              element={
                <ProtectedRoute context="debug">
                  <DebugCrimeRouteDemo />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </UserProvider>
      <FixedPlugin />
    </ChakraProvider>
  );
}