import React, { useEffect, useRef, useState } from 'react';
import { Phone, Mic, MicOff, PhoneOff, Volume2, Bluetooth } from 'lucide-react';
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
    const [callDuration, setCallDuration] = useState(0);
    const [audioDevices, setAudioDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [showDeviceList, setShowDeviceList] = useState(false);
    const [supportsSetSinkId, setSupportsSetSinkId] = useState(false);

    // Check support and list devices
    useEffect(() => {
        const checkSupport = async () => {
            const element = document.createElement('audio');
            const isSupported = typeof element.setSinkId !== 'undefined';
            setSupportsSetSinkId(isSupported);

            if (isSupported) {
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const outputs = devices.filter(d => d.kind === 'audiooutput');
                    setAudioDevices(outputs);

                    // Auto-select earpiece/receiver if available
                    const earpiece = outputs.find(d =>
                        d.label.toLowerCase().includes('earpiece') ||
                        d.label.toLowerCase().includes('receiver') ||
                        d.label.toLowerCase().includes('handset')
                    );

                    if (earpiece) {
                        setSelectedDeviceId(earpiece.deviceId);
                    } else if (outputs.length > 0) {
                        setSelectedDeviceId(outputs[0].deviceId);
                    }
                } catch (err) {
                    console.error("Error listing audio devices:", err);
                }
            }
        };

        if (callState === 'connected') {
            checkSupport();
        }
    }, [callState]);

    // Set remote stream when it changes or device selection updates
    useEffect(() => {
        if (remoteAudioRef.current && remoteStream) {
            // Only update srcObject if it has actually changed to avoid resetting audio pipeline
            if (remoteAudioRef.current.srcObject !== remoteStream) {
                console.log('Setting remote audio srcObject');
                remoteAudioRef.current.srcObject = remoteStream;
            }

            // Apply selected device if any
            if (selectedDeviceId && supportsSetSinkId) {
                console.log('Applying audio device:', selectedDeviceId);
                remoteAudioRef.current.setSinkId(selectedDeviceId)
                    .then(() => console.log('Successfully set audio device to:', selectedDeviceId))
                    .catch(e => console.error("Error setting sink ID:", e));
            }
        }
    }, [remoteStream, selectedDeviceId, supportsSetSinkId]);

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

    const handleDeviceSelect = (deviceId) => {
        setSelectedDeviceId(deviceId);
        setShowDeviceList(false);
        // The useEffect will handle the actual device switching
    };

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
                    <div className="flex flex-col items-center gap-8 w-full max-w-md px-8 relative">
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
                        <div className="flex items-center justify-center gap-6 mt-8 w-full">
                            {/* Audio Output Selector (Only if supported) */}
                            {supportsSetSinkId && callState === 'connected' && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDeviceList(!showDeviceList)}
                                        className={`p-5 rounded-full transition-all ${showDeviceList
                                            ? 'bg-[#00a884] text-white shadow-lg'
                                            : 'bg-[#37404a] text-[#e9edef] hover:bg-[#404d57]'
                                            }`}
                                    >
                                        <Volume2 className="w-7 h-7" />
                                    </button>

                                    {/* Device List Dropdown */}
                                    <AnimatePresence>
                                        {showDeviceList && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 w-64 bg-[#202c33] rounded-xl shadow-2xl border border-[#37404a] overflow-hidden z-50"
                                            >
                                                <div className="p-3 border-b border-[#37404a]">
                                                    <span className="text-[#8696a0] text-xs uppercase tracking-wider font-medium">Select Audio Output</span>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto">
                                                    {audioDevices.map(device => (
                                                        <button
                                                            key={device.deviceId}
                                                            onClick={() => handleDeviceSelect(device.deviceId)}
                                                            className={`w-full text-left p-3 text-sm flex items-center gap-3 hover:bg-[#111b21] transition-colors ${selectedDeviceId === device.deviceId ? 'text-[#00a884]' : 'text-[#e9edef]'
                                                                }`}
                                                        >
                                                            {device.label.toLowerCase().includes('bluetooth') ? (
                                                                <Bluetooth className="w-4 h-4" />
                                                            ) : (
                                                                <Volume2 className="w-4 h-4" />
                                                            )}
                                                            <span className="truncate">{device.label || `Device ${device.deviceId.slice(0, 5)}...`}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

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
