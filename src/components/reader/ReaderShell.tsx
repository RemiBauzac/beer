import { Progress } from '@/components/ui/progress';
import { TopBar } from './TopBar';

interface ReaderShellProps {
  title: string;
  progress: number;
  tocOpen: boolean;
  settingsOpen: boolean;
  onToc: () => void;
  onSettings: () => void;
  children: React.ReactNode;
}

export function ReaderShell({ title, progress, onToc, onSettings, children }: ReaderShellProps) {
  return (
    <div className="fixed inset-0 flex flex-col">
      <TopBar title={title} onToc={onToc} onSettings={onSettings} />

      <div className="flex-1 overflow-hidden mt-12">{children}</div>

      <Progress value={progress} className="fixed bottom-0 inset-x-0 h-1 rounded-none" />
    </div>
  );
}
