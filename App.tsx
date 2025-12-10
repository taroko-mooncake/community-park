
import React, { useState, useEffect } from 'react';
import { INITIAL_PARKS } from './constants';
import { Park, Task, ViewState, TaskStatus } from './types';
import { ParkCard } from './components/ParkCard';
import { Assistant } from './components/Assistant';
import { Button } from './components/Button';
import { ParkMap } from './components/ParkMap';
import { suggestTasksFromDescription, findLocalParks } from './services/geminiService';
import { 
  Sprout, 
  Map, 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Sparkles,
  Leaf,
  Users,
  Search,
  Navigation,
  Trash2,
  Check,
  MapPin as MapPinIcon,
  Trophy,
  Award,
  X,
  History,
  TrendingUp
} from 'lucide-react';

// --- Sub-components defined here for simplicity of file structure ---

const Header: React.FC<{ 
  currentView: ViewState, 
  setView: (v: ViewState) => void,
  userPoints: number,
  onOpenHistory: () => void
}> = ({ currentView, setView, userPoints, onOpenHistory }) => {
  const level = Math.floor(userPoints / 100);
  const progressToNext = userPoints % 100;
  
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setView(ViewState.HOME)}
        >
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Sprout size={20} />
          </div>
          <span className="hidden sm:inline text-xl font-bold text-stone-800 tracking-tight">Community Roots</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => setView(ViewState.HOME)}
            className={`text-sm font-medium transition-colors ${currentView === ViewState.HOME ? 'text-emerald-600' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Home
          </button>
          <button 
            onClick={() => setView(ViewState.ASSISTANT)}
            className={`text-sm font-medium transition-colors ${currentView === ViewState.ASSISTANT ? 'text-emerald-600' : 'text-stone-600 hover:text-stone-900'}`}
          >
            Garden Sage
          </button>
        </nav>
  
        <div className="flex items-center gap-4">
          <div 
            onClick={onOpenHistory}
            className="bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer rounded-full pl-1 pr-4 py-1 flex items-center gap-3 border border-emerald-100 group"
            title="View Points History"
          >
             <div className="w-8 h-8 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors flex items-center justify-center text-emerald-700">
               <Trophy size={14} />
             </div>
             <div className="flex flex-col">
               <div className="flex justify-between items-baseline gap-2">
                 <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Root Depth</span>
                 <span className="text-xs font-bold text-emerald-600">{level}m</span>
               </div>
               <div className="w-24 h-1.5 bg-emerald-200 rounded-full mt-0.5 overflow-hidden">
                 <div 
                   className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                   style={{ width: `${progressToNext}%` }}
                 />
               </div>
               <span className="text-[10px] text-emerald-600 leading-none mt-0.5 text-right">{userPoints} pts</span>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const Footer = () => (
  <footer className="bg-stone-900 text-stone-400 py-12">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <div className="flex justify-center items-center gap-2 mb-4">
        <Sprout size={24} className="text-emerald-500" />
        <span className="text-xl font-bold text-stone-100">Community Roots</span>
      </div>
      <p className="mb-4 text-sm">Empowering local communities to reclaim and beautify their shared green spaces.</p>
      <div className="text-xs text-stone-600">
        © 2024 Community Roots. Powered by Gemini.
      </div>
    </div>
  </footer>
);

interface HistoryItem {
  id: string;
  action: string;
  points: number;
  date: string;
}

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [parks, setParks] = useState<Park[]>(INITIAL_PARKS);
  const [selectedParkId, setSelectedParkId] = useState<string | null>(null);
  const [newObservation, setNewObservation] = useState('');
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  
  // Gamification state
  const [userPoints, setUserPoints] = useState(40); // Start with some points for demo
  const [notification, setNotification] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<HistoryItem[]>([
    { id: 'init', action: 'Joined Community Roots', points: 40, date: new Date(Date.now() - 86400000 * 2).toLocaleDateString() }
  ]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('Columbia Heights, DC');
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Derive selected park
  const selectedPark = parks.find(p => p.id === selectedParkId);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleParkClick = (id: string) => {
    setSelectedParkId(id);
    setView(ViewState.PARK_DETAIL);
    window.scrollTo(0,0);
  };

  const handleVolunteer = (parkId: string, taskId: string) => {
    // In a real app, this would be authenticated user.
    const volunteerName = "You"; 
    setParks(prev => prev.map(park => {
      if (park.id !== parkId) return park;
      return {
        ...park,
        tasks: park.tasks.map(task => {
          if (task.id !== taskId) return task;
          // Toggle logic for demo
          if (task.volunteers.includes(volunteerName)) {
             return { ...task, volunteers: task.volunteers.filter(v => v !== volunteerName) };
          }
          return { ...task, volunteers: [...task.volunteers, volunteerName] };
        })
      };
    }));
  };

  const handleDeleteTask = (parkId: string, taskId: string) => {
    setParks(prev => prev.map(park => {
      if (park.id !== parkId) return park;
      return {
        ...park,
        tasks: park.tasks.filter(t => t.id !== taskId)
      };
    }));
  };

  const handleCompleteTask = (parkId: string, taskId: string) => {
    let completedTaskTitle = '';
    setParks(prev => prev.map(park => {
      if (park.id !== parkId) return park;
      return {
        ...park,
        tasks: park.tasks.map(task => {
          if (task.id !== taskId) return task;
          completedTaskTitle = task.title;
          return { ...task, status: TaskStatus.COMPLETED };
        })
      };
    }));
    
    // Gamification reward
    const pointsAwarded = 10;
    setUserPoints(prev => prev + pointsAwarded);
    setPointsHistory(prev => [{
      id: Date.now().toString(),
      action: `Completed: ${completedTaskTitle}`,
      points: pointsAwarded,
      date: new Date().toLocaleDateString()
    }, ...prev]);
    setNotification(`Task Complete! +${pointsAwarded} Points Collected`);
  };

  const handleGenerateTasks = async () => {
    if (!newObservation.trim() || !selectedParkId) return;
    setIsGeneratingTasks(true);
    
    const suggestedTasks = await suggestTasksFromDescription(newObservation);
    
    if (suggestedTasks.length > 0) {
      const newTasks: Task[] = suggestedTasks.map((t, idx) => ({
        id: `gen-${Date.now()}-${idx}`,
        title: t.title || 'New Task',
        description: t.description || 'Description pending',
        status: TaskStatus.OPEN,
        volunteers: [],
        date: new Date().toISOString().split('T')[0],
        urgency: (t.urgency as any) || 'Medium'
      }));

      setParks(prev => prev.map(p => {
        if (p.id !== selectedParkId) return p;
        return {
          ...p,
          tasks: [...p.tasks, ...newTasks]
        };
      }));
      setNewObservation('');
    }
    setIsGeneratingTasks(false);
  };

  const handleSearch = async (useLocation: boolean = false) => {
    setIsSearching(true);
    setLocationError(null);
    let userLoc: {lat: number, lng: number} | undefined = undefined;
    let query = searchQuery;

    if (useLocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        query = "current location";
      } catch (err) {
        setLocationError("Please check browser permissions.");
        setIsSearching(false);
        return;
      }
    } else if (!query.trim()) {
      setIsSearching(false);
      return;
    }

    const foundParks = await findLocalParks(query, userLoc);
    
    if (foundParks.length > 0) {
      setParks(foundParks);
      // Stay on home, the list will update
    } else {
      setLocationError("No parks found.");
    }
    
    setIsSearching(false);
  };

  // --- Views ---

  const renderHome = () => (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <div className="relative text-white py-24 bg-emerald-900">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <span className="inline-block py-1 px-3 rounded-full bg-emerald-800 border border-emerald-700 text-emerald-300 text-sm font-semibold mb-6">
            Join the Movement
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Cultivate Your Community <br/>
            <span className="text-emerald-400">One Park at a Time</span>
          </h1>
          <p className="text-xl text-emerald-100 max-w-2xl mb-10">
            Connect with neighbors, organize cleanups, and maintain our shared green spaces. 
            Search below to get started.
          </p>
          
          {/* Search Box in Hero */}
          <div className="w-full max-w-2xl bg-white p-2 rounded-xl shadow-xl flex flex-col sm:flex-row gap-2">
             <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Enter city, neighborhood, or park name..."
                  className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none transition-colors ${
                    searchQuery === 'Columbia Heights, DC' ? 'italic text-stone-500' : 'text-stone-800 placeholder-stone-400'
                  }`}
                  value={searchQuery}
                  onFocus={() => {
                    if (searchQuery === 'Columbia Heights, DC') {
                      setSearchQuery('');
                    }
                  }}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(false)}
                />
             </div>
             <Button size="lg" onClick={() => handleSearch(false)} disabled={isSearching} className="whitespace-nowrap">
               {isSearching ? 'Searching...' : 'Find Parks'}
             </Button>
             <Button size="lg" variant="secondary" onClick={() => handleSearch(true)} disabled={isSearching} title="Use my location">
               <Navigation size={20} />
             </Button>
          </div>
          {locationError && (
             <div className="mt-4 bg-red-500/20 text-red-200 text-sm px-4 py-2 rounded-md border border-red-500/30">
               {locationError}
             </div>
          )}
        </div>
      </div>

      {/* Stats / Features */}
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm text-center">
           <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <Map size={24} />
           </div>
           <h3 className="text-lg font-bold mb-2">Local Impact</h3>
           <p className="text-stone-600">Find parks in your immediate neighborhood that need a little love and care.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm text-center">
           <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <Users size={24} />
           </div>
           <h3 className="text-lg font-bold mb-2">Community Driven</h3>
           <p className="text-stone-600">Join forces with neighbors. Track volunteer hours and see the difference you make together.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm text-center">
           <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <Sparkles size={24} />
           </div>
           <h3 className="text-lg font-bold mb-2">AI Assisted</h3>
           <p className="text-stone-600">Not sure what to do? Our AI Garden Sage suggests tasks based on what you see.</p>
        </div>
      </div>
      
      {/* Featured Parks */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-stone-900">Explore Local Parks</h2>
            <p className="text-stone-500 mt-2">
              {isSearching ? 'Results for your search' : 'These spaces need your help the most right now.'}
            </p>
          </div>
        </div>

        {/* Map Visualization */}
        <div className="mb-8">
          <ParkMap parks={parks} onParkClick={handleParkClick} />
        </div>

        {/* List of Parks */}
        {isSearching ? (
           <div className="flex flex-col items-center justify-center py-20 text-stone-400 h-[300px] bg-stone-50 rounded-xl border border-stone-200 border-dashed">
             <div className="w-8 h-8 border-2 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
             <p>Updating results...</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {parks.length > 0 ? (
              parks.map(park => (
                <ParkCard key={park.id} park={park} onClick={() => handleParkClick(park.id)} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                No parks found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderParkDetail = () => {
    if (!selectedPark) return null;

    const openTasks = selectedPark.tasks.filter(t => t.status === TaskStatus.OPEN);
    const completedTasks = selectedPark.tasks.filter(t => t.status === TaskStatus.COMPLETED);

    return (
      <div className="min-h-screen pb-12">
        {/* Header (No Image) */}
        <div className="bg-stone-900 text-white py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <button 
              onClick={() => setView(ViewState.HOME)} 
              className="flex items-center gap-2 text-stone-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Parks
            </button>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{selectedPark.name}</h1>
            <div className="flex items-center gap-2 text-emerald-400">
              <MapPinIcon className="w-5 h-5" />
              {selectedPark.location}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col: Info & Contribution */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Leaf className="text-emerald-600" size={20} />
                About this Park
              </h2>
              <p className="text-stone-600 leading-relaxed">{selectedPark.description}</p>
            </div>

            {/* AI Task Generator */}
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
              <h3 className="text-lg font-bold text-emerald-900 mb-2 flex items-center gap-2">
                <Sparkles size={18} />
                Spot something that needs doing?
              </h3>
              <p className="text-emerald-800 text-sm mb-4">
                Describe the issue (e.g., "The flower bed near the north gate is overgrown with weeds"). 
                Our AI will create a structured task for volunteers.
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  placeholder="Describe what you see..."
                  className="flex-1 px-4 py-2 rounded-lg border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateTasks()}
                />
                <Button onClick={handleGenerateTasks} disabled={isGeneratingTasks || !newObservation.trim()}>
                  {isGeneratingTasks ? 'Thinking...' : 'Add Task'}
                </Button>
              </div>
            </div>

            {/* Task List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-stone-900">Active Tasks</h2>
                 <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-semibold">
                   {openTasks.length} Open
                 </span>
              </div>
              
              <div className="space-y-4">
                {openTasks.length === 0 ? (
                  <div className="text-center py-12 bg-stone-50 rounded-xl border border-dashed border-stone-300 text-stone-500">
                    <p>No open tasks right now. Great job, team!</p>
                  </div>
                ) : (
                  openTasks.map(task => (
                    <div key={task.id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-200 transition-colors">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-stone-800">{task.title}</h3>
                          <div className="flex items-center gap-4 text-xs text-stone-500 mt-1">
                            <span className={`px-2 py-0.5 rounded-full ${
                              task.urgency === 'High' ? 'bg-red-100 text-red-700' :
                              task.urgency === 'Medium' ? 'bg-orange-100 text-orange-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {task.urgency} Priority
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> {task.date}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-emerald-600">
                              <Award size={12} /> 10 pts
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-2"
                            title="Mark as Complete (+10 pts)"
                            onClick={() => handleCompleteTask(selectedPark.id, task.id)}
                          >
                            <Check size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-500 border-red-200 hover:bg-red-50 px-2"
                            title="Delete Task"
                            onClick={() => handleDeleteTask(selectedPark.id, task.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant={task.volunteers.includes('You') ? "outline" : "primary"}
                            onClick={() => handleVolunteer(selectedPark.id, task.id)}
                          >
                            {task.volunteers.includes('You') ? 'Leave' : 'Volunteer'}
                          </Button>
                        </div>
                      </div>
                      <p className="text-stone-600 text-sm mb-4">{task.description}</p>
                      
                      {task.volunteers.length > 0 && (
                        <div className="flex -space-x-2 overflow-hidden py-1">
                          {task.volunteers.map((v, i) => (
                            <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-800" title={v}>
                              {v.charAt(0)}
                            </div>
                          ))}
                          <span className="ml-4 text-xs text-stone-500 self-center pl-2">
                             {task.volunteers.length} volunteer{task.volunteers.length !== 1 ? 's' : ''} signed up
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Completed Tasks Accordion (Simplified) */}
              {completedTasks.length > 0 && (
                <div className="mt-8 pt-8 border-t border-stone-200">
                   <h3 className="text-lg font-semibold text-stone-500 mb-4">Recently Completed</h3>
                   <div className="space-y-3 opacity-70">
                     {completedTasks.map(task => (
                       <div key={task.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-lg group">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="text-emerald-600" size={20} />
                            <div className="flex flex-col">
                              <span className="text-stone-600 line-through decoration-emerald-500/50">{task.title}</span>
                              <span className="text-xs text-emerald-600">+10 pts earned</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteTask(selectedPark.id, task.id)}
                            className="text-stone-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                            title="Delete Task"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contextual Assistant */}
            <div className="sticky top-24">
               <Assistant />
            </div>
          </div>

        </div>
      </div>
    );
  };

  const renderAssistantView = () => (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-[80vh]">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-4">Garden Sage</h1>
        <p className="text-stone-600 max-w-lg mx-auto">
          Your personal gardening expert. Ask about plant identification, seasonal maintenance, pest control, or how to organize a community event.
        </p>
      </div>
      <Assistant />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
          <h4 className="font-semibold text-emerald-900 mb-2">Plant Care</h4>
          <p className="text-xs text-emerald-700">"How often should we water the hydrangeas?"</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
          <h4 className="font-semibold text-emerald-900 mb-2">Planning</h4>
          <p className="text-xs text-emerald-700">"What tools do we need for a spring cleanup?"</p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
          <h4 className="font-semibold text-emerald-900 mb-2">Identification</h4>
          <p className="text-xs text-emerald-700">"What are good shade-tolerant plants for Zone 6?"</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans relative">
      <Header 
        currentView={view} 
        setView={setView} 
        userPoints={userPoints} 
        onOpenHistory={() => setShowHistory(true)}
      />
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl animate-bounce flex items-center gap-2">
          <Trophy size={20} className="text-yellow-300" />
          <span className="font-bold">{notification}</span>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowHistory(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all"
            onClick={e => e.stopPropagation()}
          >
             <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-emerald-50">
               <div>
                 <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                   <TrendingUp className="text-emerald-600" size={24} />
                   Impact History
                 </h2>
                 <p className="text-xs text-emerald-700 mt-1">Keep growing your roots!</p>
               </div>
               <button 
                 onClick={() => setShowHistory(false)}
                 className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-6">
                <div className="flex items-center justify-between mb-6 bg-stone-50 p-4 rounded-xl">
                   <div className="text-center">
                      <div className="text-xs text-stone-500 uppercase font-semibold">Total Points</div>
                      <div className="text-2xl font-bold text-emerald-600">{userPoints}</div>
                   </div>
                   <div className="h-8 w-px bg-stone-200" />
                   <div className="text-center">
                      <div className="text-xs text-stone-500 uppercase font-semibold">Root Depth</div>
                      <div className="text-2xl font-bold text-emerald-800">{Math.floor(userPoints/100)}m</div>
                   </div>
                </div>

                <h3 className="text-sm font-semibold text-stone-700 mb-3 uppercase tracking-wider">Recent Activity</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                   {pointsHistory.map((item) => (
                     <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-stone-100 hover:bg-stone-50 transition-colors">
                        <div className="flex flex-col">
                           <span className="font-medium text-stone-800 text-sm">{item.action}</span>
                           <span className="text-xs text-stone-400 flex items-center gap-1">
                             <Clock size={10} /> {item.date}
                           </span>
                        </div>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs">
                           +{item.points}
                        </span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      <main className="flex-grow">
        {view === ViewState.HOME && renderHome()}
        {view === ViewState.PARKS && renderHome()} {/* Fallback if needed, though view state removed */}
        {view === ViewState.PARK_DETAIL && renderParkDetail()}
        {view === ViewState.ASSISTANT && renderAssistantView()}
      </main>

      <Footer />
    </div>
  );
}
