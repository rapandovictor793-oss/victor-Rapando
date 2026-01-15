
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trophy, Share2, Trash2, History, MessageSquare, FlagTriangleRight, AlertTriangle, X, ChevronUp, ChevronDown, Edit2, Info } from 'lucide-react';
import { Player, ScoreEntry } from './types';
import { generateLeagueSummary } from './services/geminiService';

const App: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('golf-league-players');
    return saved ? JSON.parse(saved) : [];
  });
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiCommentary, setAiCommentary] = useState('');
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  useEffect(() => {
    localStorage.setItem('golf-league-players', JSON.stringify(players));
  }, [players]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: newPlayerName.trim(),
      scores: []
    };
    setPlayers([...players, newPlayer]);
    setNewPlayerName('');
  };

  const startEditingName = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditingNameValue(player.name);
  };

  const saveName = (id: string) => {
    if (!editingNameValue.trim()) {
      setEditingPlayerId(null);
      return;
    }
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, name: editingNameValue.trim() } : p));
    setEditingPlayerId(null);
  };

  const addScore = (playerId: string, scoreStr: string) => {
    const scoreVal = parseInt(scoreStr);
    if (isNaN(scoreVal)) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        const newScore: ScoreEntry = {
          id: crypto.randomUUID(),
          value: scoreVal,
          date: new Date().toISOString()
        };
        return { ...p, scores: [...p.scores, newScore] };
      }
      return p;
    }));
  };

  const confirmDeletePlayer = () => {
    if (playerToDelete) {
      setPlayers(prev => prev.filter(p => p.id !== playerToDelete.id));
      setPlayerToDelete(null);
    }
  };

  const removeScore = (playerId: string, scoreId: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, scores: p.scores.filter(s => s.id !== scoreId) };
      }
      return p;
    }));
  };

  const sortedPlayers = useMemo(() => {
    const getBestTwoSum = (p: Player) => {
      const sorted = [...p.scores].map(s => s.value).sort((n1, n2) => n1 - n2);
      if (sorted.length === 0) return 999;
      if (sorted.length === 1) return sorted[0] + 999; // Penalty for only 1 game
      return sorted[0] + sorted[1];
    };

    return [...players].sort((a, b) => {
      const sumA = getBestTwoSum(a);
      const sumB = getBestTwoSum(b);
      return sortDirection === 'asc' ? sumA - sumB : sumB - sumA;
    });
  }, [players, sortDirection]);

  const toggleSort = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const formatForWhatsApp = () => {
    let text = "⛳ *Alumni Golf League - Top 2 Standings* ⛳\n\n";
    sortedPlayers.forEach((p, i) => {
      const sorted = [...p.scores].map(s => s.value).sort((n1, n2) => n1 - n2);
      const bestTwo = sorted.slice(0, 2);
      const total = bestTwo.reduce((a, b) => a + b, 0);
      const avg = p.scores.length > 0 
        ? (p.scores.reduce((acc, curr) => acc + curr.value, 0) / p.scores.length).toFixed(1)
        : 'N/A';
      const emoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "•";
      
      text += `${emoji} *${p.name}* (${p.scores.length} played)\n`;
      text += `   Total (Best 2): ${bestTwo.length >= 2 ? total : 'N/A'}\n`;
      text += `   Average: ${avg}\n`;
      text += `   Scores: ${p.scores.length > 0 ? p.scores.map(s => s.value).join(', ') : 'None'}\n\n`;
    });
    
    if (aiCommentary) {
      text += `🤖 *AI Commentary:*\n_${aiCommentary}_`;
    }

    navigator.clipboard.writeText(text);
    alert('Leaderboard copied to clipboard! Paste it into your WhatsApp group.');
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    const summary = await generateLeagueSummary(players);
    setAiCommentary(summary);
    setIsGeneratingAI(false);
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {/* Header */}
      <header className="bg-emerald-700 text-white p-4 sm:p-6 shadow-lg sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Trophy size={24} className="sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">Alumni Golf</h1>
              <p className="text-emerald-100 text-[10px] sm:text-xs font-medium uppercase tracking-widest">Best 2 Tracker</p>
            </div>
          </div>
          <button 
            onClick={formatForWhatsApp}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-semibold transition-all shadow-sm active:scale-95"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="sm:hidden text-sm">Share</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6">
        {/* Add Player Form */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Roster Management</h2>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter player name..."
              className="flex-1 border border-slate-200 bg-slate-50/50 rounded-lg px-4 py-2.5 text-sm sm:text-base focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            />
            <button 
              onClick={addPlayer}
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 font-bold shadow-sm shadow-emerald-100 active:scale-95"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Player</span>
            </button>
          </div>
        </section>

        {/* AI Insight */}
        {players.length > 0 && (
          <section className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 transition-all hover:bg-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs sm:text-sm">
                <MessageSquare size={16} />
                <span>AI League Commentary</span>
              </div>
              <button 
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="text-[10px] sm:text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-all font-bold shadow-sm shadow-indigo-100"
              >
                {isGeneratingAI ? 'Thinking...' : aiCommentary ? 'Regenerate' : 'Generate Summary'}
              </button>
            </div>
            {aiCommentary ? (
              <p className="text-indigo-900 italic text-sm sm:text-base leading-relaxed">"{aiCommentary}"</p>
            ) : (
              <p className="text-indigo-400 text-[10px] sm:text-xs uppercase tracking-wider font-medium">Get an AI-generated roast or shoutout for the group!</p>
            )}
          </section>
        )}

        {/* Leaderboard Table Container */}
        <section className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 font-bold text-slate-700 text-sm sm:text-base">
                <Trophy size={18} className="text-amber-500" />
                Championship Standings
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                <Info size={12} />
                Note: Please enter your Gross Scores only
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter sm:hidden self-end">
              Swipe right to see more →
            </div>
          </div>
          
          <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <th className="px-3 sm:px-6 py-4 sticky left-0 z-20 bg-slate-50/95 backdrop-blur-sm border-r border-slate-100 min-w-[140px] sm:min-w-0">Player</th>
                  <th className="px-3 sm:px-6 py-4 min-w-[120px]">Gross Scores</th>
                  <th className="px-3 sm:px-6 py-4 whitespace-nowrap">Avg</th>
                  <th 
                    className="px-3 sm:px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors group/header select-none whitespace-nowrap"
                    onClick={toggleSort}
                  >
                    <div className="flex items-center gap-1">
                      Best 2
                      <span className="text-slate-300 group-hover/header:text-emerald-600 transition-colors">
                        {sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPlayers.map((player, index) => {
                  const sortedScores = [...player.scores].map(s => s.value).sort((a, b) => a - b);
                  const bestTwo = sortedScores.slice(0, 2);
                  const bestTwoSum = bestTwo.reduce((a, b) => a + b, 0);
                  const avgScore = player.scores.length > 0 
                    ? (player.scores.reduce((acc, curr) => acc + curr.value, 0) / player.scores.length).toFixed(1)
                    : '-';

                  return (
                    <tr key={player.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-3 sm:px-6 py-4 sticky left-0 z-10 bg-white group-hover:bg-slate-50 transition-colors border-r border-slate-50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] sm:shadow-none">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs ${
                            sortDirection === 'asc' && index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            sortDirection === 'asc' && index === 1 ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            sortDirection === 'asc' && index === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                            'bg-slate-50 text-slate-400 border border-slate-100'
                          }`}>
                            {sortDirection === 'asc' ? index + 1 : sortedPlayers.length - index}
                          </span>
                          <div className="flex flex-col min-w-0">
                            {editingPlayerId === player.id ? (
                              <input
                                autoFocus
                                className="border-b-2 border-emerald-500 bg-transparent font-bold text-slate-800 outline-none w-full max-w-[100px] text-sm sm:text-base"
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                onBlur={() => saveName(player.id)}
                                onKeyDown={(e) => e.key === 'Enter' && saveName(player.id)}
                              />
                            ) : (
                              <div 
                                className="flex items-center gap-1.5 cursor-pointer group/name truncate"
                                onClick={() => startEditingName(player)}
                              >
                                <span className="font-bold text-slate-800 text-sm sm:text-base truncate">{player.name}</span>
                                <Edit2 size={10} className="text-slate-300 opacity-0 group-hover/name:opacity-100 transition-opacity flex-shrink-0" />
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Played: {player.scores.length}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px] sm:max-w-none">
                          {player.scores.map((s) => {
                            const isBest = bestTwo.includes(s.value) && sortedScores.indexOf(s.value) < 2;
                            return (
                              <span 
                                key={s.id} 
                                className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-all ${
                                  isBest 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold shadow-sm shadow-emerald-50' 
                                  : 'bg-slate-50 text-slate-500 border-slate-100'
                                }`}
                              >
                                {s.value}
                                <button 
                                  onClick={() => removeScore(player.id, s.id)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </span>
                            );
                          })}
                          <ScoreInput onAdd={(val) => addScore(player.id, val)} />
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="text-xs sm:text-sm font-bold text-slate-500">{avgScore}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        {player.scores.length >= 2 ? (
                          <div className="flex flex-col">
                            <span className="text-base sm:text-lg font-black text-emerald-600 leading-none">{bestTwoSum}</span>
                            <span className="text-[9px] font-bold text-emerald-400 uppercase">Total</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold italic">Need {2 - player.scores.length} more</span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-right">
                        <button 
                          onClick={() => setPlayerToDelete(player)}
                          className="text-slate-200 hover:text-red-500 transition-all p-2 rounded-lg hover:bg-red-50 active:scale-90"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {players.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-50 rounded-full">
                          <FlagTriangleRight size={40} className="text-slate-200" />
                        </div>
                        <p className="font-bold text-slate-400 uppercase tracking-widest text-xs">No Players Drafted</p>
                        <p className="text-sm">Start by adding your alumni golfers above!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Mobile Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 p-3 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] sm:hidden z-40">
        <div className="flex items-center justify-around text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
          <div className="flex flex-col items-center gap-0.5">
             <span className="text-emerald-600 text-sm">{players.length}</span>
             <span>Players</span>
          </div>
          <div className="w-px h-6 bg-slate-100"></div>
          <div className="flex flex-col items-center gap-0.5">
             <span className="text-emerald-600 text-sm">{players.reduce((a, b) => a + b.scores.length, 0)}</span>
             <span>Rounds</span>
          </div>
        </div>
      </footer>

      {/* Confirmation Modal */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-600 mb-4 mx-auto border-4 border-white shadow-sm">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 text-center mb-2">Cut from the Roster?</h3>
              <p className="text-slate-500 text-center text-sm mb-6 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-slate-800">"{playerToDelete.name}"</span>? 
                This will delete <span className="font-bold text-slate-800">{playerToDelete.scores.length}</span> scores and can't be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPlayerToDelete(null)}
                  className="flex-1 px-4 py-3 border-2 border-slate-100 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs"
                >
                  Keep
                </button>
                <button 
                  onClick={confirmDeletePlayer}
                  className="flex-1 px-4 py-3 bg-red-600 rounded-xl font-bold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-200 active:scale-95 uppercase tracking-widest text-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
            <button 
              onClick={() => setPlayerToDelete(null)}
              className="absolute top-4 right-4 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface ScoreInputProps {
  onAdd: (val: string) => void;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ onAdd }) => {
  const [val, setVal] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val) {
      onAdd(val);
      setVal('');
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md border-2 border-dashed border-slate-200 text-slate-400 hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-50/30 transition-all font-bold uppercase"
      >
        + Add
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input 
        autoFocus
        type="number" 
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => !val && setIsEditing(false)}
        className="w-10 sm:w-12 text-[10px] sm:text-xs border-2 border-emerald-500 rounded px-1.5 py-0.5 outline-none bg-white font-bold"
        placeholder="Gross"
      />
    </form>
  );
};

export default App;
