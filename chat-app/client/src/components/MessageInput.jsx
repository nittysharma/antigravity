import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Plus, Mic, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ onSendMessage, onTyping, replyingTo, onCancelReply }) => {
    const [message, setMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const emojiRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Determine type based on MIME type
                const type = file.type.startsWith('video/') ? 'video' : 'image';
                onSendMessage(reader.result, type);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setShowEmoji(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message, 'text');
            setMessage('');
            onTyping(false);
        }
    };

    const handleTyping = (e) => {
        setMessage(e.target.value);
        onTyping(true);
        const timeoutId = setTimeout(() => onTyping(false), 2000);
        return () => clearTimeout(timeoutId);
    };

    const onEmojiClick = (emojiObject) => {
        setMessage((prev) => prev + emojiObject.emoji);
    };

    return (
        <div className="bg-[#202c33] relative z-30">
            {replyingTo && (
                <div className="bg-[#202c33] px-2 pt-2">
                    <div className="bg-[#0b141a] rounded-lg p-2 flex justify-between items-center border-l-4 border-[#00a884]">
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[#00a884] text-xs font-bold mb-0.5">{replyingTo.username}</p>
                            <p className="text-[#d1d7db] text-xs truncate">{replyingTo.message}</p>
                        </div>
                        <button onClick={onCancelReply} className="p-1 hover:bg-[#37404a] rounded-full transition-colors">
                            <X className="w-5 h-5 text-[#8696a0]" />
                        </button>
                    </div>
                </div>
            )}

            <div className="px-4 py-2 flex items-center gap-3">
                {showEmoji && (
                    <div className="absolute bottom-16 left-4 z-50" ref={emojiRef}>
                        <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" />
                    </div>
                )}

                <div className="flex items-center gap-3 text-[#8696a0]">
                    <button
                        type="button"
                        onClick={() => setShowEmoji(!showEmoji)}
                        className="hover:text-[#aebac1] transition-colors"
                    >
                        <Smile className="w-6 h-6" />
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="hover:text-[#aebac1] transition-colors"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*,video/*"
                        className="hidden"
                    />
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-3">
                    <input
                        type="text"
                        value={message}
                        onChange={handleTyping}
                        placeholder="Type a message"
                        className="wa-input bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] rounded-lg py-2.5 px-4 focus:outline-none"
                    />

                    {message.trim() ? (
                        <button
                            type="submit"
                            className="text-[#8696a0] hover:text-[#aebac1] transition-colors"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="text-[#8696a0] hover:text-[#aebac1] transition-colors"
                        >
                            <Mic className="w-6 h-6" />
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default MessageInput;
