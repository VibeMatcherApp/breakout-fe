"use client";

import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuth } from "@/context/AuthContext";

interface WalletGatekeeperProps {
  children: React.ReactNode;
}

export function WalletGatekeeper({ children }: WalletGatekeeperProps) {
  const { ready, authenticated, login: privyLogin, logout: privyLogout, user } = usePrivy();
  const { wallets } = useWallets();
  const { login: authLogin, logout: authLogout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  const [nickname, setNickname] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const walletAddress = wallets?.[0]?.address;

  // 初始化检查
  useEffect(() => {
    if (ready && !hasInitialized) {
      const hasLoggedIn = localStorage.getItem('hasLoggedIn') === 'true';
      const userLoggedOut = localStorage.getItem('user_logged_out') === 'true';
      
      if (hasLoggedIn && !authenticated && !userLoggedOut) {
        console.log('Auto login triggered');
        privyLogin();
      }
      setHasInitialized(true);
    }
  }, [ready, authenticated, privyLogin, hasInitialized]);

  // 登入完成後觸發 → 檢查後端有無此 wallet
  useEffect(() => {
    console.log('WalletGatekeeper effect triggered:', { 
      ready, 
      authenticated, 
      walletAddress, 
      isCheckingUser,
      view,
      hasInitialized 
    });
    
    if (!ready || !authenticated || !walletAddress || isCheckingUser || !hasInitialized) {
      console.log('Missing required data or already checking:', { 
        ready, 
        authenticated, 
        walletAddress, 
        isCheckingUser,
        hasInitialized 
      });
      return;
    }

    setIsCheckingUser(true);

    // 保存登录状态
    localStorage.setItem('hasLoggedIn', 'true');
    localStorage.setItem('walletAddress', walletAddress);
    localStorage.removeItem('user_logged_out');

    const checkUser = async () => {
      try {
        console.log('Checking user with wallet address:', walletAddress);
        const res = await fetch(`http://43.207.147.137:3001/api/users/${walletAddress}`);
        console.log('User check response:', { status: res.status });
        
        if (res.status === 200) {
          // 已註冊，導入 discover
          console.log('User found, redirecting to discover');
          const userData = await res.json();
          // 调用 AuthContext 的 login
          authLogin(userData._id || walletAddress);
          if (view !== 'discover') {
            router.push("/?view=discover");
          }
        } else if (res.status === 404) {
          console.log('User not found, showing registration');
          setShowRegistration(true);
        } else {
          console.error("Unexpected status:", res.status);
        }
      } catch (err) {
        console.error("Failed to check user:", err);
      } finally {
        setIsCheckingUser(false);
      }
    };

    checkUser();
  }, [ready, authenticated, walletAddress, router, view, hasInitialized, authLogin]);

  // 處理註冊 nickname 流程
  const handleRegister = async () => {
    if (!nickname.trim()) {
      setErrorMsg("Please enter a nickname");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      console.log('Starting user registration with:', { walletAddress, nickname });
      const response = await fetch('http://43.207.147.137:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: walletAddress,
          nickname: nickname,
        }),
      });

      console.log('Registration response status:', response.status);
      const data = await response.json();
      console.log('Registration response data:', data);

      if (response.ok || response.status === 400 && data.message === "User already exists") {
        console.log('Registration successful or user exists, redirecting to discover');
        // 调用 AuthContext 的 login
        authLogin(data._id || walletAddress);
        router.push("/?view=discover");
      } else {
        console.error('Registration failed:', data);
        setErrorMsg(data.error || data.message || "Registration failed");
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMsg("Failed to register user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await privyLogout();
      authLogout(); // 调用 AuthContext 的 logout
      localStorage.removeItem('hasLoggedIn');
      localStorage.removeItem('walletAddress');
      localStorage.setItem('user_logged_out', 'true');
      localStorage.removeItem('walletconnected');
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // 登入中 loading 畫面
  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/90">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 還沒登入時，顯示登入按鈕
  if (!authenticated) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/90">
        <div className="w-[350px] bg-gray-900 border border-gray-800 text-white shadow-xl rounded-xl p-6 space-y-6">
          <h2 className="text-2xl font-bold text-purple-500 text-center">VibeMatcher</h2>
          <p className="text-center text-gray-300">
            Login to start trading with your wallet or social account
          </p>
          <Button
            onClick={privyLogin}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Login with Privy
          </Button>
        </div>
      </div>
    );
  }

  // 顯示註冊畫面
  if (authenticated && showRegistration) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/90">
        <div className="w-[350px] bg-gray-900 border border-gray-800 text-white shadow-xl rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-purple-500 text-center">Complete Your Profile</h2>
          <p className="text-sm text-center text-gray-400">Address: {walletAddress}</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                autoFocus
                required
                minLength={2}
                maxLength={20}
              />
              {errorMsg && (
                <p className="text-sm text-red-500">{errorMsg}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting || !nickname.trim()}
            >
              {isSubmitting ? "Registering..." : "Register and Continue"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}