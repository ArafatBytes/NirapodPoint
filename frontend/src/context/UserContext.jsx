import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [jwt, setJwt] = useState(() => localStorage.getItem("jwt") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (!jwt) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
          setJwt("");
          localStorage.removeItem("jwt");
        }
      } catch {
        setUser(null);
        setJwt("");
        localStorage.removeItem("jwt");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [jwt]);

  async function login({ emailOrPhone, password }) {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setJwt(data.token);
      localStorage.setItem("jwt", data.token);
      toast.success("Login successful!");

      const meRes = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      setUser(await meRes.json());
      return true;
    } catch (err) {
      toast.error(err.message || "Login failed");
      return false;
    }
  }

  function logout() {
    setUser(null);
    setJwt("");
    localStorage.removeItem("jwt");
    toast.success("Logged out successfully");
  }

  async function register(formData) {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(
        "Registration successful! Your account is under verification. Once it's verified by the admin team, you will receive an email and can enjoy all the features of Nirapod Point.",
        { duration: 9000 }
      );
      return true;
    } catch (err) {
      toast.error(err.message || "Registration failed");
      return false;
    }
  }

  async function refreshUser() {
    if (!jwt) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
        setJwt("");
        localStorage.removeItem("jwt");
      }
    } catch {
      setUser(null);
      setJwt("");
      localStorage.removeItem("jwt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <UserContext.Provider
      value={{ user, jwt, loading, login, logout, register, refreshUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
