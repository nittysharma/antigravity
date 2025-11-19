import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

const MessageItem = ({ msg, isCurrentUser, onReaction, onReply }) => {
    const [showReactions, setShowReactions] = useState(false);
    const longPressTimer = useRef(null);
    const x = useMotionValue(0);
    const opacity = useTransform(x, [0, 50, 100], [0, 1, 1]);

    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            setShowReactions(true);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    const handleDragEnd = (event, info) => {
        if (info.offset.x > 50) {
            onReply(msg);
        }
    };

    const reactionsList = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    return (
        <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-3 relative group`}>

            {/* Reply Indicator (Swipe) */}
            <motion.div
                style={{ opacity, x: -40 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8696a0]"
            >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"></path></svg>
            </motion.div>

            <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 100 }}
                onDragEnd={handleDragEnd}
                dragElastic={0.1}
                onContextMenu={(e) => { e.preventDefault(); setShowReactions(true); }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                className={`relative max-w-[65%] rounded-lg p-2 shadow-sm ${isCurrentUser ? 'bg-[#005c4b] rounded-tr-none' : 'bg-[#202c33] rounded-tl-none'
                    }`}
            >
                {/* Reaction Picker */}
                <AnimatePresence>
                    {showReactions && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowReactions(false)}></div>
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                className="absolute -top-12 left-0 bg-[#202c33] rounded-full p-1 flex gap-1 shadow-lg z-50 border border-[#222d34]"
                            >
                                {reactionsList.map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('Emoji clicked:', emoji, 'Message ID:', msg.id);
                                            onReaction(msg.id, emoji);
                                            setShowReactions(false);
                                        }}
                                        className="hover:bg-[#37404a] p-1.5 rounded-full transition-colors text-xl"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Reply Context */}
                {msg.replyTo && (
                    <div className="bg-[#00000033] rounded-md p-1 mb-1 border-l-4 border-[#00a884] text-xs cursor-pointer">
                        <p className="text-[#00a884] font-medium mb-0.5">{msg.replyTo.username}</p>
                        <p className="text-[#d1d7db] truncate line-clamp-1">{msg.replyTo.message}</p>
                    </div>
                )}

                {/* Message Content */}
                <div className="text-[#e9edef] text-[14.2px] leading-[19px] break-words">
                    {msg.type === 'image' ? (
                        <img src={msg.message} alt="Shared" className="rounded-lg max-w-full mb-1" />
                    ) : msg.type === 'video' ? (
                        <video src={msg.message} controls className="rounded-lg max-w-full mb-1" />
                    ) : (
                        msg.message
                    )}
                </div>

                <div className="flex justify-between items-end gap-2 mt-1">
                    {/* Reactions Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex -space-x-1 bg-[#202c33] rounded-full px-1 py-0.5 border border-[#0b141a] shadow-sm">
                            {Object.values(msg.reactions).slice(0, 3).map((r, i) => (
                                <span key={i} className="text-[10px]">{r}</span>
                            ))}
                            {Object.keys(msg.reactions).length > 1 && (
                                <span className="text-[10px] text-[#8696a0] ml-1">{Object.keys(msg.reactions).length}</span>
                            )}
                        </div>
                    )}

                    <span className="flex items-end gap-0.5 text-[11px] text-[#8696a0] ml-auto">
                        {format(new Date(msg.time), 'HH:mm')}
                        {isCurrentUser && (
                            <span className="text-[#53bdeb]">
                                <CheckCheck className="w-3.5 h-3.5" />
                            </span>
                        )}
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

const MessageList = ({ messages, currentUser, onReaction, onReply }) => {
    const messagesEndRef = useRef(null);

    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {messages.map((msg, index) => (
                <MessageItem
                    key={index}
                    msg={msg}
                    isCurrentUser={msg.author === currentUser}
                    onReaction={onReaction}
                    onReply={onReply}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
