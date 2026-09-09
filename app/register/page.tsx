"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import styles from "./register.module.css";

/* ─── PASSWORD STRENGTH UTILITY ─── */
function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: "Weak", key: "Weak" };
  if (score === 2) return { level: 2, label: "Fair", key: "Fair" };
  if (score === 3) return { level: 3, label: "Good", key: "Good" };
  return { level: 4, label: "Strong", key: "Strong" };
}

/* ─── ANIMATION VARIANTS ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ─── DERIVED STATE ─── */
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const strengthClass =
    strength.level === 1
      ? styles.strengthWeak
      : strength.level === 2
      ? styles.strengthFair
      : strength.level === 3
      ? styles.strengthGood
      : styles.strengthStrong;

  /* ─── HANDLE SUBMIT ─── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    /* Client validations */
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone,
        },
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/login?message=Account created! Please verify your email.");
  };

  return (
    <div className={styles.page}>
      <motion.div
        className={styles.card}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* ── HEADER ── */}
        <motion.div className={styles.header} variants={itemVariants}>
          <div className={styles.icon}>✦</div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>
            Join our luxury salon experience today
          </p>
        </motion.div>

        {/* ── ERROR / SUCCESS ── */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              className={styles.error}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              className={styles.success}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── FORM ── */}
        <form onSubmit={handleRegister} className={styles.form}>
          {/* Name Row */}
          <motion.div className={styles.nameRow} variants={itemVariants}>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>👤</span>
              <input
                id="register-first-name"
                type="text"
                className={styles.input}
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>👤</span>
              <input
                id="register-last-name"
                type="text"
                className={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
            </div>
          </motion.div>

          {/* Phone */}
          <motion.div className={styles.inputGroup} variants={itemVariants}>
            <span className={styles.inputIcon}>📞</span>
            <input
              id="register-phone"
              type="tel"
              className={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />
          </motion.div>

          {/* Email */}
          <motion.div className={styles.inputGroup} variants={itemVariants}>
            <span className={styles.inputIcon}>✉️</span>
            <input
              id="register-email"
              type="email"
              className={styles.input}
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </motion.div>

          {/* Password */}
          <motion.div variants={itemVariants}>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>🔒</span>
              <input
                id="register-password"
                type="password"
                className={styles.input}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            {/* Strength Meter */}
            {password.length > 0 && (
              <motion.div
                className={strengthClass}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.strengthBar}>
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className={`${styles.strengthSegment} ${
                        seg <= strength.level ? styles.active : ""
                      }`}
                    />
                  ))}
                </div>
                <div className={styles.strengthLabel}>{strength.label}</div>
              </motion.div>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div className={styles.inputGroup} variants={itemVariants}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              id="register-confirm-password"
              type="password"
              className={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </motion.div>

          {/* Terms */}
          <motion.div className={styles.termsRow} variants={itemVariants}>
            <input
              id="register-terms"
              type="checkbox"
              className={styles.checkbox}
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <label htmlFor="register-terms" className={styles.termsLabel}>
              I agree to the{" "}
              <a href="#" className={styles.termsLink}>
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className={styles.termsLink}>
                Privacy Policy
              </a>
            </label>
          </motion.div>

          {/* Submit */}
          <motion.button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
            variants={itemVariants}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? (
              <>
                <span className={styles.spinner} />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </form>

        {/* ── DIVIDER ── */}
        <motion.div className={styles.divider} variants={itemVariants}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>or sign up with</span>
          <span className={styles.dividerLine} />
        </motion.div>

        {/* ── SOCIAL ── */}
        <motion.div className={styles.socialRow} variants={itemVariants}>
          <button type="button" className={styles.socialBtn}>
            <span className={styles.socialIcon}>G</span>
            Google
          </button>
          <button type="button" className={styles.socialBtn}>
            <span className={styles.socialIcon}>f</span>
            Facebook
          </button>
        </motion.div>

        {/* ── FOOTER ── */}
        <motion.div className={styles.footer} variants={itemVariants}>
          <p className={styles.footerText}>
            Already have an account?
            <a href="/login" className={styles.footerLink}>
              Sign In
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}