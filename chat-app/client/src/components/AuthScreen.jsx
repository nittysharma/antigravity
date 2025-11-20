import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const AuthScreen = ({ onCreateRoom, onJoinRoom }) => {
    const [isJoining, setIsJoining] = useState(true);
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [pin, setPin] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!username || !roomId || !pin) return;

        if (isJoining) {
            onJoinRoom({ username, roomId, pin });
        } else {
            onCreateRoom({ username, roomId, pin });
        }
    };

    return (
        <div className="h-[100dvh] flex flex-col items-center bg-[#111b21] relative overflow-hidden">
            {/* Green Header Strip */}
            <div className="w-full h-32 bg-[#00a884] absolute top-0 left-0 z-0">
                <div className="max-w-5xl mx-auto p-5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 33 33" width="20" height="20" className="" fill="#00a884"><path d="M16.6 0C7.4 0 0 7.5 0 16.7c0 3 .8 5.9 2.3 8.4L.6 33l8.2-2.2c2.4 1.3 5.1 2 7.8 2 9.2 0 16.6-7.5 16.6-16.7S25.8 0 16.6 0zm0 27.8c-2.5 0-4.9-.7-7-1.9l-.5-.3-5.2 1.4 1.4-5.1-.3-.5C3.9 19.3 3.2 16.9 3.2 14.4c0-7.4 6-13.4 13.4-13.4s13.4 6 13.4 13.4-6 13.4-13.4 13.4z"></path></svg>
                    </div>
                    <span className="text-white font-semibold text-sm tracking-wide uppercase">MyChat Web</span>
                </div>
            </div>

            <div className="z-10 w-full max-w-4xl mt-8 flex-1 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-[#111b21] w-full max-w-md rounded shadow-lg overflow-hidden border border-[#222d34] relative">

                    {/* Card Content */}
                    <div className="p-10 bg-[#202c33]">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-light text-[#e9edef] mb-2">
                                {isJoining ? 'Use MyChat on your computer' : 'Create a secure room'}
                            </h1>
                            <p className="text-[#8696a0] text-base">
                                {isJoining ? 'Join an existing room with your PIN' : 'Set up a new private chat room'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] border-none rounded-lg py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                                    placeholder="Display Name"
                                />
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    className="w-full bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] border-none rounded-lg py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                                    placeholder="Room ID"
                                />
                            </div>

                            <div>
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    maxLength={6}
                                    className="w-full bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] border-none rounded-lg py-3 px-4 focus:outline-none focus:ring-1 focus:ring-[#00a884] tracking-widest"
                                    placeholder="PIN (6 digits)"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] font-semibold py-3 rounded-full transition-colors mt-4 flex items-center justify-center gap-2"
                            >
                                {isJoining ? 'Start Chatting' : 'Create Room'}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setIsJoining(!isJoining)}
                                className="text-[#00a884] text-sm hover:underline"
                            >
                                {isJoining ? 'Need to create a room?' : 'Already have a room?'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
