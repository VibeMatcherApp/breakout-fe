import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';

interface ChatInterfaceProps {
    matchId: number;
    matchedUser: {
        id: number;
        displayName: string;
        avatarInitials: string;
        activeStatus: string;
    };
    onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ matchId, matchedUser, onBack }) => {
    const [messages, setMessages] = useState<Array<{
        id: number;
        content: string;
        isFromUser: boolean;
        sentAt: string;
    }>>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (newMessage.trim()) {
            const message = {
                id: Date.now(),
                content: newMessage.trim(),
                isFromUser: true,
                sentAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, message]);
            setNewMessage('');

            // Simulate response after 1 second
            setTimeout(() => {
                const response = {
                    id: Date.now() + 1,
                    content: "Great! I was looking for exactly what you have. When would you like to set up the trade?",
                    isFromUser: false,
                    sentAt: new Date().toISOString()
                };
                setMessages(prev => [...prev, response]);
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
            {/* Chat Header */}
            <div className="bg-white p-4 border-b flex items-center justify-between">
                <div className="flex items-center">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="ml-4">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
                                {matchedUser.avatarInitials}
                            </div>
                            <div className="ml-3">
                                <div className="font-medium">{matchedUser.displayName}</div>
                                <div className="text-sm text-gray-500">
                                    {matchedUser.activeStatus === 'online' ? 'Online' : 'Offline'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg p-3 ${message.isFromUser
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 text-gray-900'
                                }`}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSendMessage();
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}; 