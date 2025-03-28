import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Users, 
  History, 
  Database, 
  RefreshCw,
  Signal,
  Tag,
  Info
} from 'lucide-react';

function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [serverStatus, setServerStatus] = useState(null);
    const [topPlayers, setTopPlayers] = useState([]);
    const [playerHistory, setPlayerHistory] = useState([]);
    const [errorMessage, setErrorMessage] = useState(null);

    const fetchStatus = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const response = await fetch('http://localhost:3001/status');
            if (response.status === 429) {
                setErrorMessage('Rate limit exceeded. Please try again later.');
                return;
            }
            const data = await response.json();
            setServerStatus(data);
        } catch (error) {
            console.error('Error fetching server status:', error);
            setErrorMessage('Failed to load server status.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPlayerHistory = async () => {
        setErrorMessage(null);
        try {
            const response = await fetch('http://localhost:3001/player-history');
            if (response.status === 429) {
                setErrorMessage('Rate limit exceeded. Please try again later.');
                return;
            }
            const data = await response.json();
            setPlayerHistory(data.history);
            setTopPlayers(data.topPlayers);
        } catch (error) {
            console.error('Error fetching player history:', error);
            setErrorMessage('Failed to load player history.');
        }
    };

    useEffect(() => {
        fetchStatus();
        fetchPlayerHistory();
    }, []);

    if (errorMessage) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <h1 className="text-2xl font-bold">{errorMessage}</h1>
            </div>
        );
    }

    if (!serverStatus) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <h1 className="text-2xl font-bold">Loading...</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Server className="h-8 w-8 text-blue-400" />
                            <div>
                                <h1 className="text-2xl font-bold">FiveM Server Status</h1>
                                <div className="flex items-center mt-2 space-x-2">
                                    <div className={`h-3 w-3 rounded-full ${serverStatus.status === 'Online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span>{serverStatus.status}</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={fetchStatus}
                            className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200"
                        >
                            <RefreshCw className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="flex items-center space-x-3">
                            <Users className="h-5 w-5 text-blue-400" />
                            <span>{serverStatus.players} Players Online</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Signal className="h-5 w-5 text-blue-400" />
                            <span>{serverStatus.ping}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Tag className="h-5 w-5 text-blue-400" />
                            <div className="flex gap-2">
                                {serverStatus.tags.split(',').map((tag, index) => {
                                    const truncatedTag = tag.length > 10 ? `${tag.slice(0, 7)}...` : tag; // Truncate if tag is longer than 10 characters
                                    return (
                                        <span
                                            key={index}
                                            className="px-2 py-1 bg-blue-500 rounded-full text-sm flex items-center justify-center"
                                        >
                                            {truncatedTag}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                        <Users className="h-6 w-6 text-blue-400" />
                        <h2 className="text-xl font-bold">Top 5 Players</h2>
                    </div>
                    <div className="space-y-4">
                        {topPlayers.length > 0 ? (
                            topPlayers.map((player, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                                    <span className="font-medium">{player}</span>
                                </div>
                            ))
                        ) : (
                            <p>No players have been tracked yet.</p>
                        )}
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                    <div className="flex items-center space-x-3 mb-4">
                        <History className="h-6 w-6 text-blue-400" />
                        <h2 className="text-xl font-bold">Player History</h2>
                    </div>
                    <div className="space-y-3">
                        {playerHistory.length > 0 ? (
                            playerHistory.map((player, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                                    <span>{player.name}</span>
                                    <span className="text-gray-400">Last Seen: {player.lastSeen}</span>
                                </div>
                            ))
                        ) : (
                            <p>No player history available.</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center space-x-3 mb-4">
                            <Database className="h-6 w-6 text-blue-400" />
                            <h2 className="text-xl font-bold">Server Resources</h2>
                        </div>
                        <div className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                            <span>Active Resources</span>
                            <span className="text-blue-400 font-bold">{serverStatus.resources}</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                            <span>Server Version</span>
                            <span className="text-blue-400 font-bold">{serverStatus.serverVersion}</span>
                        </div>
                    </div>

                    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                        <div className="flex items-center space-x-3 mb-4">
                            <Info className="h-6 w-6 text-blue-400" />
                            <h2 className="text-xl font-bold">Server Description</h2>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{serverStatus.projectDescription}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;