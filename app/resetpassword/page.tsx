"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useModal } from "@/components/ModalContext";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useModal();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // On mount, verify the token from the URL
  useEffect(() => {
    async function verifyToken() {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (tokenHash && type) {
        // Verify OTP token from the WhatsApp link
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });

        if (error) {
          console.error("[Reset Password] Token verification failed:", error);
          setVerifyError(
            "This reset link is invalid or has expired. Please request a new one."
          );
          setVerifying(false);
          return;
        }

        setVerified(true);
        setVerifying(false);
      } else {
        // Check if the user already has an active session
        // (e.g., from Supabase's built-in redirect flow)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setVerified(true);
        } else {
          setVerifyError(
            "No reset token found. Please use the link sent to your WhatsApp."
          );
        }
        setVerifying(false);
      }
    }

    verifyToken();
  }, [searchParams]);

  const handleResetPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showAlert("Error", "Passwords do not match", "error");
      return;
    }

    if (newPassword.length < 6) {
      showAlert("Warning", "Password must be at least 6 characters", "warning");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      showAlert("Error", error.message, "error");
      return;
    }

    showAlert("Success", "Password updated successfully!", "success");
    router.push("/login");
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)]/40 p-5 relative z-10 font-['Montserrat']">
        <div className="w-10 h-10 border-4 border-[var(--color-gold)]/30 border-t-[var(--color-gold)] rounded-full animate-spin"></div>
        <h2 className="mt-5 tracking-wide font-semibold text-[var(--color-text-main)] text-lg">
          Verifying Reset Link...
        </h2>
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]/40 p-5 relative z-10 font-['Montserrat']">
        <div className="w-full max-w-md bg-white/40 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-red-500/30 shadow-2xl relative overflow-hidden text-center">
          <div className="text-5xl mb-5">⚠️</div>
          <h2 className="text-red-500 mb-4 font-bold text-2xl font-['Playfair_Display']">
            Link Expired or Invalid
          </h2>
          <p className="text-[var(--color-text-main)] leading-relaxed mb-8">
            {verifyError}
          </p>
          <a
            href="/forgetpassword"
            className="block w-full py-4 rounded-xl bg-[var(--color-text-main)] text-white font-semibold uppercase tracking-wider text-sm hover:bg-[var(--color-gold)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Request New Reset Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]/40 p-5 relative z-10 font-['Montserrat']">
      <div className="w-full max-w-md bg-white/40 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-[var(--color-gold)]/30 shadow-2xl relative overflow-hidden text-[var(--color-text-main)]">
        
        {/* Shimmer Effect */}
        <div className="absolute top-0 left-[-100%] w-[60%] h-full bg-gradient-to-r from-transparent via-[var(--color-gold)]/10 to-transparent animate-[shimmer_4s_infinite] pointer-events-none" />
        
        {/* Top Gold Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[var(--color-gold)] rounded-b-md animate-pulse" />

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center text-3xl shadow-sm">
            🔒
          </div>
          <h1 className="text-3xl font-bold mb-2 font-['Playfair_Display'] drop-shadow-sm text-[var(--color-text-main)]">
            Reset Password
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm font-light">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl border border-[var(--color-border)] bg-white/60 text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-4 focus:ring-[var(--color-gold)]/10 transition-all font-light"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl border border-[var(--color-border)] bg-white/60 text-[var(--color-text-main)] placeholder-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-gold)] focus:ring-4 focus:ring-[var(--color-gold)]/10 transition-all font-light"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-xl bg-[var(--color-text-main)] text-white font-semibold uppercase tracking-wider text-sm hover:bg-[var(--color-gold)] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[var(--color-gold)]">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}