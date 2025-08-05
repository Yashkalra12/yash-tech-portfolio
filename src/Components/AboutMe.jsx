import React from 'react';

const PortfolioGrid = ({ sectionRef }) => {
  return (
    <div ref={sectionRef} className="min-h-screen p-4 md:p-8 flex items-center justify-center mt-[10%]" id="about">
      <div
        className="max-w-7xl mx-auto w-full rounded-3xl p-4 md:p-8"
        style={{ perspective: '1200px' }}
      >
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Grid 1 - Developer Card */}
          <div className="group relative bg-gradient-to-br from-[#010320]/80 to-[#111325]/80 backdrop-blur-md shadow-2xl rounded-2xl border-2 border-[#CBACF9]/60 transition-all duration-500 hover:scale-105 hover:-rotate-x-3 hover:-rotate-y-2 hover:shadow-3xl hover:border-[#CBACF9]/90"
            style={{ transform: 'translateZ(40px)' }}
          >
            <div className="space-y-4 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#CBACF9] to-[#8B5CF6] flex items-center justify-center shadow-lg border-2 border-[#CBACF9]/40 shadow-[#CBACF9]/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#CBACF9] animate-pulse"></div>
                <div className="w-1 h-1 rounded-full bg-[#8B5CF6] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              </div>
              <p className="text-white text-lg leading-relaxed font-medium">
                A driven <span className="text-gradient">full stack developer</span>, everyday learner, and hybrid athlete. I craft end-to-end AI-powered applications, thrive in fast-paced teams, and love building products that matter.
              </p>
              <div className="flex gap-2 mt-6">
                <div className="px-3 py-1 bg-[#CBACF9]/20 text-[#CBACF9] text-sm rounded-full border border-[#CBACF9]/30">
                  AI-Powered
                </div>
                <div className="px-3 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] text-sm rounded-full border border-[#8B5CF6]/30">
                  Full Stack
                </div>
              </div>
            </div>
          </div>

          {/* Grid 2 - Relocation Card */}
          <div className="group relative bg-gradient-to-br from-[#010320]/80 to-[#111325]/80 backdrop-blur-md shadow-2xl rounded-2xl border-2 border-[#38BDF8]/60 transition-all duration-500 hover:scale-105 hover:rotate-x-2 hover:rotate-y-3 hover:shadow-3xl hover:border-[#38BDF8]/90"
            style={{ transform: 'translateZ(30px)' }}
          >
            <div className="space-y-4 p-8">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-[#38BDF8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[#38BDF8] text-sm font-medium">Location Flexible</span>
              </div>
              <h3 className="text-xl font-semibold text-white">
                Open to relocate across <span className="text-gradient">The World</span>
              </h3>
              <p className="text-gray-400 text-sm">
                Ready for new opportunities and adventures
              </p>
              <div className="flex gap-2 mt-6">
                <div className="px-3 py-1 bg-[#38BDF8]/20 text-[#38BDF8] text-sm rounded-full border border-[#38BDF8]/30">
                  Remote Ready
                </div>
                <div className="px-3 py-1 bg-[#CBACF9]/20 text-[#CBACF9] text-sm rounded-full border border-[#CBACF9]/30">
                  Travel Friendly
                </div>
              </div>
            </div>
          </div>

          {/* Grid 3 - Learning Card */}
          <div className="group relative bg-gradient-to-br from-[#010320]/80 to-[#111325]/80 backdrop-blur-md shadow-2xl rounded-2xl border-2 border-[#8B5CF6]/60 transition-all duration-500 hover:scale-105 hover:rotate-x-2 hover:-rotate-y-2 hover:shadow-3xl hover:border-[#8B5CF6]/90"
            style={{ transform: 'translateZ(20px)' }}
          >
            <div className="space-y-4 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#CBACF9] flex items-center justify-center shadow-md border-2 border-[#8B5CF6]/40 shadow-[#8B5CF6]/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-[#8B5CF6] text-sm font-medium">The Inside Scoop</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Currently Learning
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-[#8B5CF6]/10 rounded-lg border border-[#8B5CF6]/20">
                  <p className="text-white font-medium">LLM Application Integrations</p>
                </div>
                <div className="p-3 bg-[#CBACF9]/10 rounded-lg border border-[#CBACF9]/20">
                  <p className="text-white font-medium">LangChain</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-600/50">
                <div className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse"></div>
                <span className="text-gray-400 text-sm">Always evolving</span>
              </div>
            </div>
          </div>

          {/* Grid 4 - Vision Card */}
          <div className="group relative bg-gradient-to-br from-[#010320]/80 to-[#111325]/80 backdrop-blur-md shadow-2xl rounded-2xl border-2 border-[#CBACF9]/60 transition-all duration-500 hover:scale-105 hover:-rotate-x-2 hover:rotate-y-2 hover:shadow-3xl hover:border-[#CBACF9]/90"
            style={{ transform: 'translateZ(10px)' }}
          >
            <div className="space-y-4 p-8 relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CBACF9] via-[#8B5CF6] to-[#38BDF8] flex items-center justify-center shadow-lg border-2 border-[#CBACF9]/40 shadow-[#CBACF9]/20">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex gap-1">
                  <div className="w-1 h-6 bg-[#CBACF9] rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-[#8B5CF6] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-5 bg-[#38BDF8] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white leading-tight">
                I can create your <span className="text-gradient">Vision/Business</span> into life<br />via my coding capabilities
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Transforming ideas into powerful digital solutions
              </p>
              <div className="grid grid-cols-2 gap-2 mt-6">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#CBACF9]"></div>
                  <span>Web Apps</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]"></div>
                  <span>Mobile Apps</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></div>
                  <span>AI Solutions</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#CBACF9]"></div>
                  <span>Cloud Services</span>
                </div>
              </div>
            </div>
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CBACF9]/3 via-transparent to-[#8B5CF6]/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioGrid;
