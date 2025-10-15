
import React from 'react';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

export const Header: React.FC = () => {
    return (
        <header className="flex items-center p-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm z-10">
            <BrainCircuitIcon className="w-8 h-8 mr-3 text-cyan-400" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
                Knowledge-base Search Engine
            </h1>
        </header>
    );
};
