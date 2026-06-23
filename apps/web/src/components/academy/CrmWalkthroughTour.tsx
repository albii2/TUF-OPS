import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CrmWalkthroughTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(() => localStorage.getItem('tuf_combine_sandbox_active') === 'true');
  const [step, setStep] = useState(1);
  const [oppUpdateTick, setOppUpdateTick] = useState(0);

  // Sync state if sandbox active status changes in storage
  useEffect(() => {
    const handleStorageChange = () => {
      setActive(localStorage.getItem('tuf_combine_sandbox_active') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen to opportunity updates to dynamically check/advance walkthrough step
  useEffect(() => {
    const handleUpdate = () => setOppUpdateTick((prev) => prev + 1);
    window.addEventListener('tuf:opportunity-updated', handleUpdate);
    return () => window.removeEventListener('tuf:opportunity-updated', handleUpdate);
  }, []);

  // Get current opportunity stage if we are on the opportunity detail page
  const path = location.pathname;
  let currentOppStage = 'LEAD_ENGAGED';
  if (path.match(/^\/opportunities\/[^/]+$/)) {
    const id = path.split('/').pop();
    if (id) {
      try {
        const localOpps = JSON.parse(localStorage.getItem('tuf_ops_opportunities_v2') || '[]') as any[];
        const opp = localOpps.find((o) => o.id === id);
        if (opp) {
          currentOppStage = opp.stage;
        }
      } catch (e) {}
    }
  }

  // Automatically determine step based on location path and opportunity updates
  useEffect(() => {
    if (!active) return;
    const currentPath = location.pathname;

    if (currentPath === '/training' || currentPath === '/dashboard') {
      setStep(1);
    } else if (currentPath === '/organizations') {
      setStep(2);
    } else if (currentPath.match(/^\/organizations\/[^/]+$/)) {
      setStep(3);
    } else if (currentPath === '/opportunities' || currentPath === '/my-opportunities') {
      setStep(4);
    } else if (currentPath === '/opportunities/new') {
      setStep(5);
    } else if (currentPath.match(/^\/opportunities\/[^/]+$/)) {
      const id = currentPath.split('/').pop();
      if (id) {
        try {
          const localOpps = JSON.parse(localStorage.getItem('tuf_ops_opportunities_v2') || '[]') as any[];
          const opp = localOpps.find((o) => o.id === id);
          if (opp) {
            if (opp.stage === 'LEAD_ENGAGED') {
              setStep(6);
            } else {
              setStep(7);
            }
          } else {
            setStep(6);
          }
        } catch (e) {
          setStep(6);
        }
      } else {
        setStep(6);
      }
    }
  }, [location.pathname, active, oppUpdateTick]);

  const startTour = () => {
    localStorage.setItem('tuf_combine_sandbox_active', 'true');
    setActive(true);
    navigate('/organizations');
  };

  const endTour = () => {
    localStorage.removeItem('tuf_combine_sandbox_active');
    setActive(false);
    navigate('/training');
  };

  if (!active) {
    const isCertified = localStorage.getItem('tuf_ops_user_v3') 
      ? JSON.parse(localStorage.getItem('tuf_ops_user_v3') || '{}').isCertified 
      : false;

    if (isCertified) return null;

    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={startTour}
          className="glow-blue flex items-center gap-2 rounded-full border border-cyan-400/40 bg-slate-950/90 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-300 shadow-xl backdrop-blur transition hover:scale-105 active:scale-95"
        >
          <span>🎯</span> Start CRM Pipeline Action Guide
        </button>
      </div>
    );
  }

  const steps = [
    {
      title: '1. Navigate to Organizations',
      desc: "Let's start by opening the Organizations page to find your assigned schools.",
      action: 'Click "Organizations" in the sidebar menu.'
    },
    {
      title: '2. Select a School',
      desc: 'Find one of your assigned schools in the list and click its name to open the details.',
      action: 'Click on any school in the table.'
    },
    {
      title: '3. Open Opportunities Page',
      desc: 'Let\'s look at the active deals. Click "My Opportunities" in the sidebar menu to view all opportunities.',
      action: 'Click "My Opportunities" in the sidebar menu.'
    },
    {
      title: '4. Register a Deal',
      desc: 'Create an opportunity: click "New Opportunity" in the pipeline opportunities view.',
      action: 'Click "New Opportunity" button.'
    },
    {
      title: '5. Create Opportunity',
      desc: 'Fill in one of your assigned schools as the organization, select Football as the sport, and enter a value (e.g., 15000), then click "Create Opportunity".',
      action: 'Create the opportunity and save details.'
    },
    {
      title: '6. Log Outreach/Contact',
      desc: currentOppStage !== 'LEAD_ENGAGED'
        ? 'Initial contact successfully logged! The opportunity stage has advanced to Discovery.'
        : 'In the Opportunity Detail view under "Next Action Console", click the primary action button to log your initial contact with the lead.',
      action: currentOppStage !== 'LEAD_ENGAGED'
        ? 'Proceed to step 7.'
        : 'Click the primary action button (e.g. "Contact coach") in the console.'
    },
    {
      title: '7. Request Mockup',
      desc: ['MOCKUP_STAGE', 'INVOICE_SENT', 'CLOSED_WON'].includes(currentOppStage)
        ? 'Outstanding job! You have successfully requested a mockup and advanced the opportunity stage. Your walkthrough is now complete!'
        : 'Now that contact has been made, we must request a mockup. Click "Open Stage Advancement Drawer", fill in mockup details (sport, lane, design notes), and submit to complete your walkthrough.',
      action: ['MOCKUP_STAGE', 'INVOICE_SENT', 'CLOSED_WON'].includes(currentOppStage)
        ? 'Click "Finish Tour" below to exit the walkthrough.'
        : 'Click "Open Stage Advancement Drawer" and advance stage.'
    }
  ];

  const currentStep = steps[step - 1] || steps[0];

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-cyan-400/45 bg-[#050b12]/95 p-4 shadow-2xl shadow-cyan-950/40 backdrop-blur-md">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">CRM Pipeline Action Guide</span>
        <button onClick={endTour} className="text-slate-400 hover:text-slate-200 text-xs">✕ Stop</button>
      </div>

      <div className="mt-3 space-y-2">
        <h4 className="text-sm font-black text-white">{currentStep.title}</h4>
        <p className="text-xs text-slate-300 leading-relaxed">{currentStep.desc}</p>
        
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-2.5 text-[11px] font-medium text-cyan-200">
          <span className="font-bold">Next Action:</span> {currentStep.action}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800/40 pt-3">
        <div className="flex gap-1">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 w-3 rounded-full transition-all ${
                idx + 1 === step 
                  ? 'w-6 bg-cyan-400 shadow-[0_0_6px_rgba(31,182,255,0.5)]' 
                  : idx + 1 < step 
                    ? 'bg-emerald-400' 
                    : 'bg-slate-850'
              }`}
            />
          ))}
        </div>
        
        <div className="flex gap-2">
          {step > 1 && (
            <button
              onClick={() => setStep((prev) => prev - 1)}
              className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
            >
              Back
            </button>
          )}
          {step < 7 ? (
            <button
              onClick={() => setStep((prev) => prev + 1)}
              className="rounded bg-cyan-500/20 border border-cyan-400/50 px-2 py-1 text-[10px] font-bold text-cyan-100 hover:bg-cyan-500/30"
            >
              Skip
            </button>
          ) : (
            <button
              onClick={endTour}
              className="rounded bg-emerald-500/25 border border-emerald-400/50 px-2.5 py-1 text-[10px] font-black text-emerald-100 hover:bg-emerald-500/40 shadow-lg shadow-emerald-950/30"
            >
              Finish Tour
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
