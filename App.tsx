
import React, { useState, useEffect } from 'react';
import { INITIAL_PARKS } from './constants';
import { Park, Task, ViewState, TaskStatus } from './types';
import { ParkCard } from './components/ParkCard';
import { Assistant } from './components/Assistant';
import { Button } from './components/Button';
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
  MapPin as MapPinIcon
} from 'lucide-react';

// --- Sub-components defined here for simplicity of file structure ---

const Header: React.FC<{ 
  currentView: ViewState, 
  setView: (v: ViewState) => void 
}> = ({ currentView, setView }) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer" 
        onClick={() => setView(ViewState.HOME)}
      >
        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
          <Sprout size={20} />
        </div>
        <span className="text-xl font-bold text-stone-800 tracking-tight">Community Roots</span>
      </div>
      
      <nav className="hidden md:flex items-center gap-6">
        <button 
          onClick={() => setView(ViewState.HOME)}
          className={`text-sm font-medium transition-colors ${currentView === ViewState.HOME ? 'text-emerald-600' : 'text-stone-600 hover:text-stone-900'}`}
        >
          Home
        </button>
        <button 
          onClick={() => setView(ViewState.PARKS)}
          className={`text-sm font-medium transition-colors ${currentView === ViewState.PARKS ? 'text-emerald-600' : 'text-stone-600 hover:text-stone-900'}`}
        >
          Explore Parks
        </button>
        <button 
          onClick={() => setView(ViewState.ASSISTANT)}
          className={`text-sm font-medium transition-colors ${currentView === ViewState.ASSISTANT ? 'text-emerald-600' : 'text-stone-600 hover:text-stone-900'}`}
        >
          Garden Sage
        </button>
      </nav>

      <div className="md:hidden">
         {/* Mobile menu placeholder - simplifying for this demo */}
         <Button size="sm" onClick={() => setView(ViewState.PARKS)}>Start Helping</Button>
      </div>
    </div>
  </header>
);

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

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.HOME);
  const [parks, setParks] = useState<Park[]>(INITIAL_PARKS);
  const [selectedParkId, setSelectedParkId] = useState<string | null>(null);
  const [newObservation, setNewObservation] = useState('');
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Derive selected park
  const selectedPark = parks.find(p => p.id === selectedParkId);

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
    setParks(prev => prev.map(park => {
      if (park.id !== parkId) return park;
      return {
        ...park,
        tasks: park.tasks.map(task => {
          if (task.id !== taskId) return task;
          return { ...task, status: TaskStatus.COMPLETED };
        })
      };
    }));
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
      // Auto navigate to parks view to see results
      setView(ViewState.PARKS);
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
                  className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none text-stone-800 placeholder-stone-400"
                  value={searchQuery}
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
            <h2 className="text-3xl font-bold text-stone-900">Featured Parks</h2>
            <p className="text-stone-500 mt-2">These spaces need your help the most right now.</p>
          </div>
          <Button variant="outline" onClick={() => setView(ViewState.PARKS)}>View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {parks.slice(0,3).map(park => (
            <ParkCard key={park.id} park={park} onClick={() => handleParkClick(park.id)} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderParkList = () => (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Explore Parks</h1>
          <p className="text-stone-600">
            {parks.length} parks found. Select a park to view maintenance tasks.
          </p>
        </div>
        <Button variant="outline" onClick={() => setView(ViewState.HOME)}>
          <Search size={16} className="mr-2" /> Search Again
        </Button>
      </div>
      
      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400 h-[300px] bg-stone-50 rounded-xl border border-stone-200 border-dashed">
           <div className="w-8 h-8 border-2 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-4" />
           <p>Updating results...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {parks.length > 0 ? (
            parks.map(park => (
              <ParkCard key={park.id} park={park} onClick={() => handleParkClick(park.id)} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-300">
              No parks found. Try searching for a different location on the home page.
            </div>
          )}
        </div>
      )}
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
              onClick={() => setView(ViewState.PARKS)} 
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-2"
                            title="Mark as Complete"
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
                            <span className="text-stone-600 line-through decoration-emerald-500/50">{task.title}</span>
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
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans">
      <Header currentView={view} setView={setView} />
      
      <main className="flex-grow">
        {view === ViewState.HOME && renderHome()}
        {view === ViewState.PARKS && renderParkList()}
        {view === ViewState.PARK_DETAIL && renderParkDetail()}
        {view === ViewState.ASSISTANT && renderAssistantView()}
      </main>

      <Footer />
    </div>
  );
}
