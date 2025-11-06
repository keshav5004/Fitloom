"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        // Call logout API
        await fetch("/api/logout", {
          method: "POST",
        });

        // Clear local storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userName');
        }

        toast.success("Logged out successfully");
        router.push("/");
      } catch (err) {
        console.error("Logout error:", err);
        // Even if API fails, clear local storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('userName');
        }
        toast.success("Logged out successfully");
        router.push("/");
      }
    };

    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Logging out...</h1>
        <p className="text-gray-600 mt-2">Please wait while we log you out.</p>
      </div>
    </div>
  );
}
