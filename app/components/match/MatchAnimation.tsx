"use client";

import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { useUser } from "@/context/UserContext";
import { MessageCircle } from "lucide-react";

interface MatchAnimationProps {
    isOpen: boolean;
    onClose: () => void;
    matchedUser: any;
    onMessageNow?: () => void;
}

const MatchAnimation: React.FC<MatchAnimationProps> = ({ isOpen, onClose, matchedUser, onMessageNow }) => {
    const { user } = useUser();
    const [_, setLocation] = useLocation();

    // Close animation after certain time if not closed by user
    useEffect(() => {
        if (isOpen) {
            const timeout = setTimeout(() => {
                onClose();
            }, 5000);

            return () => clearTimeout(timeout);
        }
    }, [isOpen, onClose]);

    const handleMessageNow = () => {
        // If onMessageNow callback is provided, use it
        if (onMessageNow) {
            onMessageNow();
            return;
        }

        // Otherwise use default behavior, navigate to matches view
        onClose();
        setLocation('/?view=matches');
    };

    if (!matchedUser) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-gradient-to-br from-primary/90 to-purple-900/90 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Confetti Effect */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {Array.from({ length: 50 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-3 h-3 rounded-full"
                                style={{
                                    background: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`,
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                }}
                                initial={{
                                    y: -20,
                                    opacity: 0,
                                    scale: Math.random() * 0.5 + 0.5
                                }}
                                animate={{
                                    y: Math.random() * 600 + 200,
                                    opacity: [0, 1, 0],
                                    scale: 0
                                }}
                                transition={{
                                    duration: Math.random() * 2 + 2,
                                    ease: "easeOut",
                                    delay: Math.random() * 0.5
                                }}
                            />
                        ))}
                    </motion.div>

                    <motion.div
                        className="flex flex-col items-center justify-center bg-white p-10 rounded-3xl shadow-2xl"
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                    >
                        <motion.div
                            className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-8"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring" }}
                        >
                            It's a Match!
                        </motion.div>

                        <div className="flex items-center justify-center mb-8 relative">
                            {/* Pulsing circle behind avatars */}
                            <motion.div
                                className="absolute rounded-full bg-primary/10"
                                style={{ width: '160px', height: '160px' }}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            <motion.div
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center mr-5 border-4 border-white shadow-lg z-10"
                                initial={{ x: -70, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6, type: "spring", bounce: 0.6 }}
                            >
                                <span className="text-white text-2xl font-bold">{user?.avatarInitials || "You"}</span>
                            </motion.div>

                            <motion.div
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center ml-5 border-4 border-white shadow-lg z-10"
                                initial={{ x: 70, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6, type: "spring", bounce: 0.6 }}
                            >
                                <span className="text-white text-2xl font-bold">{matchedUser.avatarInitials}</span>
                            </motion.div>
                        </div>

                        <motion.div
                            className="text-center mb-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <div className="mb-3 text-lg font-medium text-gray-800">You and <span className="text-primary font-bold">{matchedUser.displayName}</span> want to trade with each other!</div>
                            <div className="text-base text-gray-600">Start a conversation to discuss the details and make a successful trade.</div>
                        </motion.div>

                        <motion.div
                            className="flex gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                        >
                            <Button
                                variant="outline"
                                className="px-6 py-6 rounded-2xl text-base border-2 hover:bg-gray-50 transition-all duration-300"
                                onClick={onClose}
                            >
                                Keep Swiping
                            </Button>

                            <Button
                                className="px-8 py-6 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-all duration-300 shadow-md"
                                onClick={handleMessageNow}
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Message Now
                            </Button>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MatchAnimation; 