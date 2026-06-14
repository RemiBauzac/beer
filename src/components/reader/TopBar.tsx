import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, List, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  title: string;
  onToc: () => void;
  onSettings: () => void;
}

export function TopBar({ title, onToc, onSettings }: TopBarProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const hoverRef = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (hoverRef.current) return;
      const y = window.scrollY;
      setVisible(y < lastScrollY.current || y < 60);
      lastScrollY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-20 h-12 flex items-center justify-between px-2 backdrop-blur bg-background/80 border-b transition-transform duration-200 ${visible ? 'translate-y-0' : '-translate-y-full'}`}
      onMouseEnter={() => {
        hoverRef.current = true;
        setVisible(true);
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
      }}
    >
      <Button variant="ghost" size="icon" onClick={() => void navigate('/library')}>
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <span className="flex-1 text-center text-sm font-medium truncate px-2">{title}</span>

      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={onToc}>
          <List className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onSettings}>
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
