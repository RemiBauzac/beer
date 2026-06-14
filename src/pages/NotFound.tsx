import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">404 — Page not found</h1>
      <Link to="/library" className="text-primary underline">
        Back to library
      </Link>
    </div>
  );
}
