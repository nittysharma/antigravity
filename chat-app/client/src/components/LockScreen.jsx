import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const LockScreen = ({ onUnlock, onExit }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onUnlock(pin)) {
            setError('');
        } else {
            setError('Incorrect PIN');
            setPin('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111b21]/95 backdrop-blur-sm">
            <div className="w-full max-w-sm p-8 text-center">
                <div className="w-20 h-20 bg-[#202c33] rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-[#00a884]" />
                </div>

                <h2 className="text-2xl font-light text-[#e9edef] mb-2">MyChat Locked</h2>
                <p className="text-[#8696a0] mb-8 text-sm">Enter PIN to resume</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={6}
                        autoFocus
                        className="w-full bg-[#2a3942] border-none rounded-lg py-3 px-4 text-center text-2xl tracking-[0.5em] text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                        placeholder="••••"
                    />

                    {error && (
                        <p className="text-[#f15c6d] text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-[#00a884] hover:bg-[#008f6f] text-[#111b21] font-semibold py-3 rounded-full transition-colors"
                    >
                        Unlock
                    </button>
                </form>

                <button
                    onClick={onExit}
                    className="mt-6 text-[#8696a0] hover:text-[#e9edef] text-sm"
                >
                    Exit Room
                </button>
            </div>
        </div>
    );
};

export default LockScreen;
