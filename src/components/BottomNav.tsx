import React from 'react';
import { Home, MousePointer, Monitor, Keyboard, Grid } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

export type NavTab = 'home' | 'touchpad' | 'desktop' | 'keyboard' | 'more';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hapticsEnabled?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  hapticsEnabled = true,
}) => {
  const navItems: Array<{ id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'touchpad', label: 'Touchpad', icon: MousePointer },
    { id: 'desktop', label: 'Desktop', icon: Monitor },
    { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
    { id: 'more', label: 'More', icon: Grid },
  ];

  const handleTabClick = (tab: NavTab) => {
    hapticFeedback.selection(hapticsEnabled);
    onSelectTab(tab);
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/98 backdrop-blur-lg border-t border-white/8 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      <div className="flex items-stretch justify-around h-14 max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex-1 flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 transition-colors relative group ${
                isActive ? 'text-sky-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              {/* Subtle top indicator bar */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-sky-500 rounded-full" />
              )}

              {/* Icon container with strict 24x24 box */}
              <div className="w-5 h-5 flex items-center justify-center shrink-0 mb-1">
                <Icon className={`w-4 h-4 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
              </div>

              {/* Label */}
              <span className={`text-[10px] tracking-tight font-medium ${isActive ? 'font-semibold text-white' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
