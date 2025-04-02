// src/components/common/Sidebar.jsx - Updated structure
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTokenSubmenuOpen, setIsTokenSubmenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  const toggleTokenSubmenu = () => {
    setIsTokenSubmenuOpen(!isTokenSubmenuOpen);
  };

  return (
    <>
      {/* Mobile menu button - only visible on small screens */}
      <div className="md:hidden fixed top-0 left-0 z-50 p-4">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-gray-800 text-white"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>
      
      {/* Sidebar container - responsive for mobile and desktop */}
      <aside 
        className={`bg-gray-800 text-white shadow-lg z-40 transition-all duration-300 ease-in-out
                    ${isMobileMenuOpen ? 'fixed inset-y-0 left-0 w-64' : 'hidden md:block w-64'}`}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold">PageDAO Hub</h2>
          <p className="text-gray-400 text-sm mt-1">Digital Publishing Dashboard</p>
        </div>
        
        <nav className="mt-6">
          <ul>
            {/* Collections - Prioritized at the top */}
            <li>
              <NavLink 
                to="/collections" 
                className={({ isActive }) => 
                  `flex items-center py-3 px-6 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                  </svg>
                </span>
                Collections
              </NavLink>
            </li>
            
            {/* Collapsible Token Menu - Now includes Dashboard, TVL, and Network Comparison */}
            <li>
              <button 
                className={`w-full flex items-center justify-between py-3 px-6 hover:bg-gray-700 ${
                  window.location.pathname === '/' || 
                  window.location.pathname.includes('/token/') || 
                  window.location.pathname === '/tvl' || 
                  window.location.pathname === '/networks' 
                    ? 'bg-gray-700' : ''
                }`}
                onClick={toggleTokenSubmenu}
              >
                <div className="flex items-center">
                  <span className="mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </span>
                  $PAGE Token
                </div>
                {isTokenSubmenuOpen ? (
                  <ChevronDownIcon className="h-5 w-5" />
                ) : (
                  <ChevronRightIcon className="h-5 w-5" />
                )}
              </button>
              
              {/* Expanded submenu for tokens - Now includes Dashboard, TVL, and Network Comparison */}
              <div className={`pl-6 ${isTokenSubmenuOpen ? 'block' : 'hidden'}`}>
                {/* Main Dashboard */}
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `flex items-center py-2 px-6 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                  end
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400 mr-3"></span>
                  Dashboard
                </NavLink>
                
                {/* TVL Analytics */}
                <NavLink 
                  to="/tvl" 
                  className={({ isActive }) => 
                    `flex items-center py-2 px-6 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-3"></span>
                  TVL Analytics
                </NavLink>
                
                {/* Network Comparison */}
                <NavLink 
                  to="/networks" 
                  className={({ isActive }) => 
                    `flex items-center py-2 px-6 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400 mr-3"></span>
                  Network Comparison
                </NavLink>
                
                {/* Networks submenu header */}
                <div className="px-6 py-2 text-xs text-gray-400 uppercase mt-2">Networks</div>
                
                {/* Network specific links */}
                <NavLink 
                  to="/token/ethereum" 
                  className={({ isActive }) => 
                    `flex items-center py-2 px-6 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-400 mr-3"></span>
                  Ethereum
                </NavLink>
                <NavLink 
                  to="/token/optimism" 
                  className={({ isActive }) => 
                    `flex items-center py-2 px-6 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 mr-3"></span>
                  Optimism
                </NavLink>
                <NavLink 
                  to="/token/base" 
                  className={({ isActive }) => 
                    `flex items-center py-2 px-6 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 mr-3"></span>
                  Base
                </NavLink>
                <NavLink 
                  to="/token/osmosis" 
                  className={({ isActive }) => 
                    `flex items-center py-2 px-6 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
                  }
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="w-2 h-2 rounded-full bg-purple-400 mr-3"></span>
                  Osmosis
                </NavLink>
              </div>
            </li>
            
            {/* Registry Manager */}
            <li>
              <NavLink 
                to="/registry" 
                className={({ isActive }) => 
                  `flex items-center py-3 px-6 hover:bg-gray-700 ${isActive ? 'bg-gray-700' : ''}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </span>
                Registry Manager
              </NavLink>
            </li>
          </ul>
        </nav>
        
        {/* Mobile close button at the bottom */}
        <div className="md:hidden mt-8 px-6">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center px-4 py-2 bg-gray-700 rounded text-sm w-full justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close Menu
          </button>
        </div>
      </aside>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

export default Sidebar;