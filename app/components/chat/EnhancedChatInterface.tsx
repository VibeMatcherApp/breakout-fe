"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import { useUser } from "@/context/UserContext";
import { useWallet } from '@/context/WalletContext';
import { fetchChatMessages, sendChatMessage } from '@/lib/api';

interface EnhancedChatInterfaceProps {
    matchId: string;
    matchedUser: {
        id: number | string;
        displayName: string;
        avatarInitials: string;
        activeStatus: string;
    };
    onBack: () => void;
    isFriendChat?: boolean;
    onChatComplete?: (message: string, isFromUser: boolean) => void;
    chatId?: string;
}

export const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
    matchId,
    matchedUser,
    onBack,
    isFriendChat = false,
    onChatComplete,
    chatId
}) => {
    const { user } = useUser();
    const { walletAddress } = useWallet();
    const [messages, setMessages] = useState<Array<{
        id: number;
        content: string;
        isFromUser: boolean;
        sentAt: string;
    }>>([
        // Initial system message
        {
            id: 0,
            content: isFriendChat
                ? 'Private conversation with a friend. You can safely discuss any topics.'
                : 'Welcome to your new match conversation! You can now safely discuss transaction details.',
            isFromUser: false,
            sentAt: new Date().toISOString()
        },
        // Initial welcome message
        {
            id: 1,
            content: isFriendChat
                ? `Hello! Nice to meet you. How can I help you?`
                : `Yooo hows its going brother! I'm betting that you are the G to RIZZ me up so i can start AURA farming! Help a brother out!`,
            isFromUser: false,
            sentAt: new Date().toISOString()
        }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch chat history
    useEffect(() => {
        if (chatId) {
            const fetchMessages = async () => {
                try {
                    setIsLoading(true);
                    const data = await fetchChatMessages(chatId);

                    if (data && Array.isArray(data.messages)) {
                        // Convert API response messages to component format
                        const formattedMessages = data.messages.map((msg: any, index: number) => ({
                            id: index,
                            content: msg.content,
                            isFromUser: msg.sender === walletAddress,
                            sentAt: msg.timestamp || new Date().toISOString()
                        }));

                        // If there are message records, replace initial messages with API returned messages
                        if (formattedMessages.length > 0) {
                            setMessages(formattedMessages);
                        }
                    }
                } catch (error) {
                    console.error('Error retrieving chat history:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchMessages();
        }
    }, [chatId, walletAddress]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (newMessage.trim()) {
            const message = {
                id: Date.now(),
                content: newMessage.trim(),
                isFromUser: true,
                sentAt: new Date().toISOString()
            };

            // Add message to the interface first
            setMessages(prev => [...prev, message]);
            setNewMessage('');

            // Call callback function to update chat history
            if (onChatComplete) {
                onChatComplete(message.content, true);
            }

            // Show the other person is typing...
            setIsTyping(true);

            try {
                // If there's a chat room ID, send message to API
                if (chatId) {
                    await sendChatMessage(chatId, walletAddress || '', message.content);
                    // After successful sending, retrieve the latest messages
                    const data = await fetchChatMessages(chatId);

                    if (data && Array.isArray(data.messages)) {
                        const formattedMessages = data.messages.map((msg: any, index: number) => ({
                            id: index,
                            content: msg.content,
                            isFromUser: msg.sender === walletAddress,
                            sentAt: msg.timestamp || new Date().toISOString()
                        }));

                        if (formattedMessages.length > 0) {
                            setMessages(formattedMessages);
                        }
                    }
                } else {
                    // No chat room ID, simulate a reply
                    setTimeout(() => {
                        setIsTyping(false);

                        const response = {
                            id: Date.now() + 1,
                            content: isFriendChat
                                ? "Hello! How can I help you? Or do you want to share something new?"
                                : "LFG!!!!!! Much appreciated bro!",
                            isFromUser: false,
                            sentAt: new Date().toISOString()
                        };

                        setMessages(prev => [...prev, response]);

                        // Call callback function to update chat history
                        if (onChatComplete) {
                            onChatComplete(response.content, false);
                        }
                    }, 2500);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            } finally {
                // Regardless of success or failure, end typing status
                setTimeout(() => {
                    setIsTyping(false);
                }, 1000);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f9f9ff]">
            {/* Chat header */}
            <div className="bg-gradient-to-r from-[#6728ff] to-[#8c5aff] p-5 flex items-center justify-between text-white shadow-md">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="text-white hover:bg-white/10 mr-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                            {matchedUser.avatarInitials}
                        </div>
                        <div className="ml-3">
                            <div className="font-medium">{matchedUser.displayName}</div>
                            <div className="text-sm text-white/80">
                                {matchedUser.activeStatus === 'online' ? 'Online' : 'Offline'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat message area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                            {messages.map((message) => (
                                message.content.includes('Private conversation') || message.content.includes('Welcome to your new match') ? (
                                    // System message style
                                    <div
                                        key={message.id}
                                        className="bg-[rgba(103,40,255,0.1)] text-[#6728ff] p-3 rounded-lg text-center text-sm mx-auto max-w-[80%]"
                                    >
                                        {message.content}
                                    </div>
                                ) : (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {!message.isFromUser && (
                                            <div className="w-10 h-10 rounded-full bg-[#6728ff] text-white flex items-center justify-center font-bold mr-2">
                                                {matchedUser.avatarInitials}
                                            </div>
                                        )}
                                        <div
                                            className={`max-w-[70%] rounded-lg p-3 ${message.isFromUser
                                                ? 'bg-gradient-to-r from-[#5dc887] to-[#42b976] text-white rounded-tr-sm'
                                                : 'bg-white text-gray-900 shadow-sm rounded-tl-sm'
                                                }`}
                                        >
                                            {message.content}
                                        </div>
                                        {message.isFromUser && (
                                            <div className="w-10 h-10 rounded-full bg-[#5dc887] text-white flex items-center justify-center font-bold ml-2">
                                                {user?.avatarInitials || "You"}
                                            </div>
                                        )}
                                    </div>
                                )
                            ))}

                            {/* Typing indicator */}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="w-10 h-10 rounded-full bg-[#6728ff] text-white flex items-center justify-center font-bold mr-2">
                                        {matchedUser.avatarInitials}
                                    </div>
                                    <div className="bg-[rgba(0,0,0,0.05)] p-3 rounded-lg w-16 flex justify-around">
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: "0s" }}></span>
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></span>
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></span>
                                    </div>
                                </div>
                            )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input area */}
            <div className="p-4 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSendMessage();
                            }
                        }}
                        placeholder="Enter message..."
                        className="flex-1 p-3 border-2 border-[rgba(103,40,255,0.2)] rounded-3xl focus:outline-none focus:border-[rgba(103,40,255,0.5)] text-gray-800"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isLoading}
                        className="bg-gradient-to-r from-[#6728ff] to-[#8c5aff] hover:opacity-90 px-6 py-6 rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}; 