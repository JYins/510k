"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const AVATARS = [
  "😎", "🤠", "🧑‍💻", "👨‍🎤", "🧑‍🚀", "🦊",
  "🐱", "🐶", "🐼", "🦄", "🐸", "🦁",
  "👩‍🎤", "👩‍💻", "🧙‍♀️", "🧝‍♂️", "🤖", "👻",
];

const SPRING = { type: "spring" as const, stiffness: 350, damping: 28 };

export default function AuthPage() {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("请填写邮箱和密码");
      return;
    }
    if (mode === "register" && !displayName.trim()) {
      setError("请填写用户名");
      return;
    }
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await signUp(email.trim(), password, displayName.trim(), avatar);
      } else {
        await signIn(email.trim(), password);
      }
      router.push("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "操作失败";
      if (msg.includes("email-already-in-use")) {
        setError("该邮箱已注册");
      } else if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("邮箱或密码错误");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-ios-purple/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-ios-blue/20 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full px-6 relative z-10 pt-16">
        {/* Back button */}
        <motion.button
          className="absolute top-4 left-6 text-white/60 text-[15px] font-medium"
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/")}
        >
          ← 返回
        </motion.button>

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
        >
          <h1 className="text-[28px] font-bold text-white">
            {mode === "login" ? "欢迎回来" : "加入 510K"}
          </h1>
          <p className="text-[15px] text-white/50 mt-1">
            {mode === "login" ? "登录你的账号" : "创建新账号开始游戏"}
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          className="bg-ios-gray-500/50 backdrop-blur-ios rounded-xl p-1 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex relative">
            <motion.div
              className="absolute inset-y-1 bg-ios-gray-400 rounded-lg shadow-ios"
              layoutId="authTab"
              style={{ width: "50%", left: mode === "login" ? "0%" : "50%" }}
              transition={SPRING}
            />
            <button
              className={`flex-1 py-2.5 text-[15px] font-semibold rounded-lg relative z-10 transition-colors ${
                mode === "login" ? "text-white" : "text-white/50"
              }`}
              onClick={() => { setMode("login"); setError(""); }}
            >
              登录
            </button>
            <button
              className={`flex-1 py-2.5 text-[15px] font-semibold rounded-lg relative z-10 transition-colors ${
                mode === "register" ? "text-white" : "text-white/50"
              }`}
              onClick={() => { setMode("register"); setError(""); }}
            >
              注册
            </button>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                {/* Display Name */}
                <div>
                  <label className="text-[13px] text-white/50 mb-1.5 block">用户名</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="你的游戏昵称"
                    maxLength={12}
                    className="w-full h-12 bg-ios-gray-500/40 rounded-xl text-white text-[15px] px-4 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-ios-blue/50 border border-white/5"
                  />
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="text-[13px] text-white/50 mb-2 block">选择头像</label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATARS.map((a) => (
                      <motion.button
                        key={a}
                        className={`w-full aspect-square rounded-xl flex items-center justify-center text-[24px] transition-all ${
                          avatar === a
                            ? "bg-ios-blue/30 ring-2 ring-ios-blue"
                            : "bg-ios-gray-500/40 hover:bg-ios-gray-400/40"
                        }`}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setAvatar(a)}
                      >
                        {a}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div>
            <label className="text-[13px] text-white/50 mb-1.5 block">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full h-12 bg-ios-gray-500/40 rounded-xl text-white text-[15px] px-4 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-ios-blue/50 border border-white/5"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-[13px] text-white/50 mb-1.5 block">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少6位"
              className="w-full h-12 bg-ios-gray-500/40 rounded-xl text-white text-[15px] px-4 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-ios-blue/50 border border-white/5"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="text-[13px] text-red-400 text-center"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            className="w-full py-4 rounded-2xl bg-ios-blue text-white font-semibold text-[17px] shadow-float flex items-center justify-center mt-2 disabled:opacity-60"
            onClick={handleSubmit}
            disabled={loading}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <motion.div
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <span>{mode === "login" ? "登录" : "注册"}</span>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
