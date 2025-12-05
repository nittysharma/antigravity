import React, { useEffect, useState, useRef } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import CallModal from './CallModal';
import { MoreVertical, Search, Phone, Video, ArrowLeft, Lock } from 'lucide-react';

const ChatRoom = ({ socket, username, roomId, onLock }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [typingUser, setTypingUser] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    // Call State
    const [callState, setCallState] = useState('idle'); // idle, incoming, calling, connected
    const [caller, setCaller] = useState('');
    const [callerSignal, setCallerSignal] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);

    const connectionRef = useRef();
    const localStreamRef = useRef();
    const candidatesQueue = useRef([]);

    useEffect(() => {
        // Request user list immediately on mount
        socket.emit('get_users', { roomId });

        socket.on('receive_message', (data) => {
            setMessages((prev) => [...prev, { ...data, reactions: {} }]);
        });

        socket.on('load_messages', (history) => {
            setMessages(history);
        });

        socket.on('user_list', (userList) => {
            setUsers(userList);
        });

        socket.on('user_typing', ({ username, isTyping }) => {
            setTypingUser(isTyping ? username : '');
        });

        socket.on('message_reaction', ({ messageId, reaction, username }) => {
            console.log('Received reaction:', messageId, reaction, username);
            setMessages((prev) => prev.map(msg => {
                if (msg.id === messageId) {
                    const newReactions = { ...msg.reactions };
                    // Simple toggle or add logic. For MVP, let's just add/overwrite user's reaction
                    // If we want to count, we'd structure differently. Let's store: { [username]: emoji }
                    newReactions[username] = reaction;
                    return { ...msg, reactions: newReactions };
                }
                return msg;
            }));
        });

        // WebRTC Listeners
        socket.on('call_user', ({ from, name, signal, isVideo }) => {
            setCallState('incoming');
            setCaller(name);
            setCallerSignal({ from, signal, isVideo });
        });

        socket.on('call_accepted', (signal) => {
            setCallState('connected');
            const sessionDesc = new RTCSessionDescription(signal);
            connectionRef.current.setRemoteDescription(sessionDesc)
                .then(() => {
                    // Process queued candidates
                    while (candidatesQueue.current.length > 0) {
                        const candidate = candidatesQueue.current.shift();
                        connectionRef.current.addIceCandidate(candidate).catch(e => console.error("Error adding queued candidate:", e));
                    }
                })
                .catch(e => console.error("Error setting remote description:", e));
        });

        socket.on('ice_candidate', (candidate) => {
            if (connectionRef.current && connectionRef.current.remoteDescription) {
                connectionRef.current.addIceCandidate(candidate).catch(e => console.error("Error adding candidate:", e));
            } else {
                // Queue candidate if PC not ready or remote desc not set
                candidatesQueue.current.push(candidate);
            }
        });

        socket.on('end_call', () => {
            endCall();
        });

        return () => {
            socket.off('receive_message');
            socket.off('load_messages');
            socket.off('user_list');
            socket.off('user_typing');
            socket.off('message_reaction');
            socket.off('call_user');
            socket.off('call_accepted');
            socket.off('ice_candidate');
            socket.off('end_call');
        };
    }, [socket]);

    const sendMessage = (content, type = 'text') => {
        // Helper to generate UUID with fallback for non-secure contexts
        const generateUUID = () => {
            if (window.crypto && window.crypto.randomUUID) {
                return window.crypto.randomUUID();
            }
            // Fallback for non-secure contexts (HTTP)
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        };

        const messageId = generateUUID();
        const messageData = {
            id: messageId,
            roomId,
            author: socket.id,
            username: username,
            message: content,
            type: type,
            time: new Date().toISOString(),
            replyTo: replyingTo ? { id: replyingTo.id, username: replyingTo.username, message: replyingTo.message } : null,
            reactions: {}
        };

        socket.emit('send_message', messageData);
        setMessages((prev) => [...prev, messageData]);
        setReplyingTo(null); // Clear reply after sending
    };

    const handleTyping = (isTyping) => {
        socket.emit('typing', { roomId, username, isTyping });
    };

    const handleReaction = (messageId, emoji) => {
        console.log('handleReaction called:', messageId, emoji);
        socket.emit('add_reaction', { roomId, messageId, reaction: emoji, username });
    };

    const handleReply = (message) => {
        setReplyingTo(message);
    };

    // WebRTC Functions
    const startCall = async (video = false) => {
        const targetUser = users.find(u => u.username !== username);
        if (!targetUser) return alert("No one else in the room!");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: video, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;
            setIsVideoEnabled(video);
            setCallState('calling');

            const peer = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            });
            connectionRef.current = peer;

            stream.getTracks().forEach(track => peer.addTrack(track, stream));

            // Handle negotiation needed for adding tracks later (e.g., toggling video)
            peer.onnegotiationneeded = async () => {
                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('call_user', {
                        userToCall: targetUser.id,
                        signalData: offer,
                        from: socket.id,
                        name: username,
                        isVideo: video
                    });
                } catch (err) {
                    console.error("Error during negotiation:", err);
                }
            };

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate to:', targetUser.id);
                    socket.emit('ice_candidate', { to: targetUser.id, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {
                console.log('Received remote track:', event.streams[0]);
                setRemoteStream(event.streams[0]);
            };

            peer.onconnectionstatechange = () => {
                console.log('Connection state:', peer.connectionState);
            };

            peer.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', peer.iceConnectionState);
            };

            // Initial offer creation (might be redundant if onnegotiationneeded fires, but safe to keep for initial setup)
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            socket.emit('call_user', {
                userToCall: targetUser.id,
                signalData: offer,
                from: socket.id,
                name: username,
                isVideo: video
            });

        } catch (err) {
            console.error("Error starting call:", err);
        }
    };

    const answerCall = async () => {
        try {
            setCallState('connected');
            const isVideoCall = callerSignal.isVideo;
            const stream = await navigator.mediaDevices.getUserMedia({ video: isVideoCall, audio: true });
            setLocalStream(stream);
            localStreamRef.current = stream;
            setIsVideoEnabled(isVideoCall);

            const peer = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            });
            connectionRef.current = peer;

            stream.getTracks().forEach(track => peer.addTrack(track, stream));

            // Handle negotiation needed
            peer.onnegotiationneeded = async () => {
                try {
                    const offer = await peer.createOffer();
                    await peer.setLocalDescription(offer);
                    socket.emit('call_user', {
                        userToCall: callerSignal.from,
                        signalData: offer,
                        from: socket.id,
                        name: username,
                        isVideo: isVideoCall
                    });
                } catch (err) {
                    console.error("Error during negotiation:", err);
                }
            };

            peer.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate to:', callerSignal.from);
                    socket.emit('ice_candidate', { to: callerSignal.from, candidate: event.candidate });
                }
            };

            peer.ontrack = (event) => {
                console.log('Received remote track:', event.streams[0]);
                setRemoteStream(event.streams[0]);
            };

            peer.onconnectionstatechange = () => {
                console.log('Connection state:', peer.connectionState);
            };

            peer.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', peer.iceConnectionState);
            };

            await peer.setRemoteDescription(callerSignal.signal);

            // Process queued candidates
            while (candidatesQueue.current.length > 0) {
                const candidate = candidatesQueue.current.shift();
                peer.addIceCandidate(candidate).catch(e => console.error("Error adding queued candidate:", e));
            }

            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit('answer_call', { signal: answer, to: callerSignal.from });

        } catch (err) {
            console.error("Error answering call:", err);
        }
    };

    const endCall = () => {
        setCallState('idle');
        if (connectionRef.current) connectionRef.current.close();
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setRemoteStream(null);

        // Notify other party (simple broadcast to room for MVP or target specific if stored)
        // For now, let's just emit to the room or rely on the other person clicking end
        // Better: emit to the peer. I need to store peerId.
        // Quick fix: emit 'end_call' to the room? No, that ends everyone's call.
        // Let's assume the other person also clicks end or we handle it better later.
        // Actually, I can emit to the callerSignal.from OR the targetUser.
        // Let's just emit to the room for now as it's 1-on-1 per room effectively.
        // Or better, iterate users and send to the other one.
        const targetUser = users.find(u => u.username !== username);
        if (targetUser) {
            socket.emit('end_call', { to: targetUser.id });
        }
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);

        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !newMutedState);
        }
    };

    const toggleVideo = async () => {
        const newVideoState = !isVideoEnabled;

        if (newVideoState) {
            // Turning video ON
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                const videoTrack = videoStream.getVideoTracks()[0];

                // Add track to local stream
                if (localStreamRef.current) {
                    localStreamRef.current.addTrack(videoTrack);
                    setLocalStream(new MediaStream(localStreamRef.current.getTracks())); // Trigger re-render
                }

                // Add track to PeerConnection
                if (connectionRef.current) {
                    const senders = connectionRef.current.getSenders();
                    const videoSender = senders.find(s => s.track && s.track.kind === 'video');

                    if (videoSender) {
                        videoSender.replaceTrack(videoTrack);
                    } else {
                        connectionRef.current.addTrack(videoTrack, localStreamRef.current);
                    }
                }
                setIsVideoEnabled(true);
            } catch (err) {
                console.error("Error enabling video:", err);
            }
        } else {
            // Turning video OFF
            if (localStreamRef.current) {
                const videoTracks = localStreamRef.current.getVideoTracks();
                videoTracks.forEach(track => {
                    track.stop();
                    localStreamRef.current.removeTrack(track);
                });
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
            }

            if (connectionRef.current) {
                const senders = connectionRef.current.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');
                if (videoSender) {
                    videoSender.replaceTrack(null); // Stop sending video
                }
            }
            setIsVideoEnabled(false);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-[#0b141a] relative">

            {/* Header - Fixed height */}
            <div className="flex-none bg-[#202c33] px-4 py-2.5 flex items-center justify-between z-20 border-b border-[#222d34] shadow-sm">
                <div className="flex items-center gap-4 cursor-pointer" onClick={onLock}>
                    {/* Avatar Placeholder */}
                    <div className="w-10 h-10 rounded-full bg-[#202c33] overflow-hidden">
                        <img src={`https://picsum.photos/seed/${roomId}/200`} alt="Room" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex flex-col justify-center">
                        <h2 className="text-[#e9edef] text-base font-normal leading-tight">
                            {roomId}
                        </h2>
                        <p className="text-[#8696a0] text-xs leading-tight mt-0.5 truncate">
                            {typingUser ? (
                                <span className="text-[#00a884] font-medium">typing...</span>
                            ) : (
                                `${users.map(u => u.username).join(', ')}`
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-[#aebac1]">
                    <Video
                        onClick={() => startCall(true)}
                        className="w-5 h-5 cursor-pointer hover:text-white transition-colors"
                    />
                    <Phone
                        onClick={() => startCall(false)}
                        className="w-5 h-5 cursor-pointer hover:text-white transition-colors"
                    />
                    <div className="w-[1px] h-6 bg-[#37404a] mx-1"></div>
                    <button onClick={onLock} title="Lock Room">
                        <Lock className="w-5 h-5 cursor-pointer hover:text-[#f15c6d] transition-colors" />
                    </button>
                    <Search className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                    <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                </div>
            </div>

            <CallModal
                callState={callState}
                callerName={caller}
                localStream={localStream}
                remoteStream={remoteStream}
                onAccept={answerCall}
                onReject={endCall}
                onEnd={endCall}
                isMuted={isMuted}
                toggleMute={toggleMute}
                isVideoEnabled={isVideoEnabled}
                toggleVideo={toggleVideo}
            />

            {/* Messages - Flexible area with background */}
            <div className="flex-1 relative overflow-hidden">
                {/* Chat Area Background */}
                <div className="absolute inset-0 z-0 bg-[#0b141a]">
                    <div className="wa-doodle-bg"></div>
                </div>

                {/* Messages */}
                <div className="relative z-10 h-full flex flex-col">
                    <MessageList
                        messages={messages}
                        currentUser={socket.id}
                        onReaction={handleReaction}
                        onReply={handleReply}
                    />
                </div>
            </div>

            {/* Input Area - Fixed height */}
            <div className="flex-none z-20">
                <MessageInput
                    onSendMessage={sendMessage}
                    onTyping={handleTyping}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                />
            </div>
        </div>
    );
};

export default ChatRoom;
