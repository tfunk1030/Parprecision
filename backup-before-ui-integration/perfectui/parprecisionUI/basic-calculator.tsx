import React, { useState } from 'react';
import { Thermometer, Droplets, Mountain, Gauge, Club, Clock } from 'lucide-react';

const BasicCalculator = () => {
  const [tab, setTab] = useState('shot');
  const [conditions, setConditions] = useState({
    temperature: '',
    humidity: '',
    altitude: '',
    pressure: ''
  });
  const [shot, setShot] = useState({
    club: '',
    distance: '',
    height: ''
  });

  const tabs = [
    { id: 'shot', label: 'Shot', icon: Club },
    { id: 'conditions', label: 'Conditions', icon: Thermometer },
    { id: 'history', label: 'History', icon: Clock }
  ];

  const renderShotTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-md border border-gray-700/50">
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">Shot Details</h3>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-emerald-500 mb-1">Club Selection</label>
            <select 
              value={shot.club}
              onChange={(e) => setShot({...shot, club: e.target.value})}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select Club</option>
              <option value="driver">Driver</option>
              <option value="3-wood">3 Wood</option>
              <option value="5-iron">5 Iron</option>
              <option value="7-iron">7 Iron</option>
              <option value="pw">Pitching Wedge</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-emerald-500 mb-1">Distance (yards)</label>
            <input
              type="number"
              value={shot.distance}
              onChange={(e) => setShot({...shot, distance: e.target.value})}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter distance"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-md border border-gray-700/50">
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">Current Conditions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-lg">
            <Thermometer className="text-emerald-500" />
            <div>
              <p className="text-sm text-emerald-500">Temperature</p>
              <p className="text-lg text-white">{conditions.temperature || '--'}°F</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-lg">
            <Droplets className="text-emerald-500" />
            <div>
              <p className="text-sm text-emerald-500">Humidity</p>
              <p className="text-lg text-white">{conditions.humidity || '--'}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-lg">
            <Mountain className="text-emerald-500" />
            <div>
              <p className="text-sm text-emerald-500">Altitude</p>
              <p className="text-lg text-white">{conditions.altitude || '--'} ft</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-lg">
            <Gauge className="text-emerald-500" />
            <div>
              <p className="text-sm text-emerald-500">Pressure</p>
              <p className="text-lg text-white">{conditions.pressure || '--'} inHg</p>
            </div>
          </div>
        </div>
      </div>

      <button className="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-500 transition-colors">
        Calculate Shot
      </button>

      <div className="bg-yellow-500/10 rounded-xl p-4 flex items-center gap-4">
        <div className="bg-yellow-500/20 rounded-lg p-2">
          <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-yellow-500 font-medium">Upgrade to Pro</p>
          <p className="text-sm text-yellow-500/80">Get access to advanced wind calculations</p>
        </div>
        <button className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 transition-colors">
          Upgrade
        </button>
      </div>
    </div>
  );

  const renderConditionsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-md border border-gray-700/50">
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">Environmental Conditions</h3>
        <div className="grid gap-4">
          {Object.entries(conditions).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-emerald-500 mb-1">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setConditions({...conditions, [key]: e.target.value})}
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-emerald-300 focus:ring-2 focus:ring-emerald-500"
                placeholder={`Enter ${key}`}
              />
            </div>
          ))}
        </div>
      </div>

      <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-500 transition-colors">
        Get Current Conditions
      </button>
    </div>
  );

  const renderContent = () => {
    switch(tab) {
      case 'shot': return renderShotTab();
      case 'conditions': return renderConditionsTab();
      default: return renderShotTab();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-emerald-400">Shot Calculator</h1>
        </div>

        <div className="flex justify-between bg-gray-800/50 rounded-xl p-2 backdrop-blur-md mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                tab === id 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default BasicCalculator;