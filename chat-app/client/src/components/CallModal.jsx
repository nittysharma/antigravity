import React, { useEffect, useRef } from 'react';
import { Phone, Mic, MicOff, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CallModal = ({
    callState,
    callerName,
    localStream,
    remoteStream,
    onAccept,
    onReject,
    onEnd,
    isMuted,
    toggleMute
}) => {
    const remoteAudioRef = useRef(null);
    const [callDuration, setCallDuration] = React.useState(0);

    // Set remote stream when it changes
    useEffect(() => {
        console.log('Remote stream changed:', remoteStream);
        if (remoteAudioRef.current && remoteStream) {
            console.log('Setting remote audio srcObject');
            remoteAudioRef.current.srcObject = remoteStream;
            console.log('Remote stream tracks:', remoteStream.getTracks());
        }
    }, [remoteStream]);

    // Call duration timer
    useEffect(() => {
        let interval;
        if (callState === 'connected') {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => clearInterval(interval);
    }, [callState]);

    // Format duration as MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (callState === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-gradient-to-br from-[#0b141a] via-[#1a2730] to-[#0b141a] flex flex-col items-center justify-center"
            >
                {/* Hidden audio element for remote stream */}
                <audio ref={remoteAudioRef} autoPlay playsInline />

                {/* Incoming Call UI */}
                {callState === 'incoming' && (
                    <div className="flex flex-col items-center gap-8">
                        {/* Animated Avatar */}
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-40 h-40 rounded-full bg-gradient-to-br from-[#00a884] to-[#008f6f] flex items-center justify-center shadow-2xl"
                        >
                            <div className="w-36 h-36 rounded-full bg-[#202c33] flex items-center justify-center">
                                <Phone className="w-20 h-20 text-[#00a884]" />
                            </div>
                        </motion.div>

                        <div className="text-center">
                            <h2 className="text-[#e9edef] text-3xl font-medium mb-2">{callerName}</h2>
                            <p className="text-[#8696a0] text-lg">Incoming Audio Call...</p>
                        </div>

                        <div className="flex gap-16 mt-8">
                            <button
                                onClick={onReject}
                                className="flex flex-col items-center gap-3 group"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-20 h-20 rounded-full bg-[#f15c6d] flex items-center justify-center shadow-2xl group-hover:bg-[#d13f50] transition-colors"
                                >
                                    <PhoneOff className="w-10 h-10 text-white" />
                                </motion.div>
                                <span className="text-[#8696a0] text-sm font-medium">Decline</span>
                            </button>

                            <button
                                onClick={onAccept}
                                className="flex flex-col items-center gap-3 group"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-20 h-20 rounded-full bg-[#00a884] flex items-center justify-center shadow-2xl group-hover:bg-[#008f6f] transition-colors"
                                >
                                    <Phone className="w-10 h-10 text-white" />
                                </motion.div>
                                <span className="text-[#8696a0] text-sm font-medium">Accept</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Active/Calling UI */}
                {(callState === 'calling' || callState === 'connected') && (
                    <div className="flex flex-col items-center gap-8 w-full max-w-md px-8">
                        {/* Animated Avatar */}
                        <motion.div
                            animate={callState === 'connected' ? {
                                scale: [1, 1.02, 1],
                                boxShadow: [
                                    '0 0 0 0 rgba(0, 168, 132, 0.4)',
                                    '0 0 0 20px rgba(0, 168, 132, 0)',
                                    '0 0 0 0 rgba(0, 168, 132, 0)'
                                ]
                            } : {}}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-48 h-48 rounded-full bg-gradient-to-br from-[#00a884] to-[#008f6f] flex items-center justify-center shadow-2xl"
                        >
                            <div className="w-44 h-44 rounded-full bg-[#202c33] flex items-center justify-center">
                                <Phone className="w-24 h-24 text-[#00a884]" />
                            </div>
                        </motion.div>

                        {/* Caller Info */}
                        <div className="text-center">
                            <h2 className="text-[#e9edef] text-3xl font-medium mb-3">
                                {callerName || 'Unknown'}
                            </h2>
                            <p className="text-[#8696a0] text-lg">
                                {callState === 'calling' && 'Calling...'}
                                {callState === 'connected' && formatDuration(callDuration)}
                            </p>
                        </div>

                        {/* Audio Indicator */}
                        {callState === 'connected' && (
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                height: isMuted ? '4px' : ['4px', '16px', '4px'],
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                repeat: Infinity,
                                                delay: i * 0.1,
                                            }}
                                            className="w-1 bg-[#00a884] rounded-full"
                                            style={{ height: '4px' }}
                                        />
                                    ))}
                                </div>
                                <span className="text-[#8696a0] text-sm ml-2">
                                    {isMuted ? 'Muted' : 'Active'}
                                </span>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-8 mt-8">
                            <button
                                onClick={toggleMute}
                                className={`p-5 rounded-full transition-all ${isMuted
                                        ? 'bg-[#e9edef] text-[#0b141a] shadow-lg'
                                        : 'bg-[#37404a] text-[#e9edef] hover:bg-[#404d57]'
                                    }`}
                            >
                                {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                            </button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={onEnd}
                                className="p-6 rounded-full bg-[#f15c6d] hover:bg-[#d13f50] transition-colors text-white shadow-2xl"
                            >
                                <PhoneOff className="w-9 h-9" />
                            </motion.button>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default CallModal;
