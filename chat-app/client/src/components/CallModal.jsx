import React, { useEffect, useRef } from 'react';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
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
    isVideoOff,
    toggleMute,
    toggleVideo
}) => {
    const remoteVideoRef = useRef(null);
    const localVideoRef = useRef(null);

    // Set remote stream when it changes
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Set local stream when it changes
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);
    if (callState === 'idle') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-[#0b141a] flex flex-col items-center justify-center"
            >
                {/* Incoming Call UI */}
                {callState === 'incoming' && (
                    <div className="flex flex-col items-center gap-8">
                        <div className="w-32 h-32 rounded-full bg-[#202c33] flex items-center justify-center">
                            <Phone className="w-16 h-16 text-[#8696a0]" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-[#e9edef] text-2xl font-medium mb-2">{callerName}</h2>
                            <p className="text-[#8696a0]">Incoming Video Call...</p>
                        </div>
                        <div className="flex gap-12 mt-8">
                            <button
                                onClick={onReject}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-16 h-16 rounded-full bg-[#f15c6d] flex items-center justify-center shadow-lg group-hover:bg-[#d13f50] transition-colors">
                                    <PhoneOff className="w-8 h-8 text-white" />
                                </div>
                                <span className="text-[#8696a0] text-sm">Decline</span>
                            </button>
                            <button
                                onClick={onAccept}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className="w-16 h-16 rounded-full bg-[#00a884] flex items-center justify-center shadow-lg group-hover:bg-[#008f6f] transition-colors">
                                    <Video className="w-8 h-8 text-white" />
                                </div>
                                <span className="text-[#8696a0] text-sm">Accept</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Active/Calling UI */}
                {(callState === 'calling' || callState === 'connected') && (
                    <div className="relative w-full h-full flex flex-col">
                        {/* Remote Video (Full Screen) */}
                        <div className="flex-1 relative bg-black overflow-hidden">
                            {remoteStream ? (
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-24 h-24 rounded-full bg-[#202c33] flex items-center justify-center mx-auto mb-4">
                                            <Phone className="w-12 h-12 text-[#8696a0]" />
                                        </div>
                                        <h2 className="text-[#e9edef] text-xl font-medium">{callerName}</h2>
                                        <p className="text-[#8696a0] mt-2">
                                            {callState === 'calling' ? 'Calling...' : 'Connecting...'}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Local Video (PIP) */}
                            <div className="absolute bottom-24 right-4 w-32 h-48 bg-[#202c33] rounded-lg overflow-hidden shadow-xl border border-[#37404a]">
                                {localStream && (
                                    <video
                                        ref={localVideoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="h-20 bg-[#202c33] flex items-center justify-center gap-8">
                            <button
                                onClick={toggleVideo}
                                className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-[#e9edef] text-[#0b141a]' : 'bg-[#37404a] text-[#e9edef]'}`}
                            >
                                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={onEnd}
                                className="p-4 rounded-full bg-[#f15c6d] hover:bg-[#d13f50] transition-colors text-white shadow-lg"
                            >
                                <PhoneOff className="w-8 h-8" />
                            </button>

                            <button
                                onClick={toggleMute}
                                className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-[#e9edef] text-[#0b141a]' : 'bg-[#37404a] text-[#e9edef]'}`}
                            >
                                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default CallModal;
