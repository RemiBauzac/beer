import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

const LibraryPage = lazy(() =>
  import('@/pages/LibraryPage').then((m) => ({ default: m.LibraryPage })),
);
const ReaderPage = lazy(() =>
  import('@/pages/ReaderPage').then((m) => ({ default: m.ReaderPage })),
);
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })));

function FullscreenSkeleton() {
  return (
    <div className="flex flex-col h-screen gap-4 p-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="flex-1 w-full" />
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/library" replace /> },
  {
    path: '/library',
    element: (
      <Suspense fallback={<FullscreenSkeleton />}>
        <LibraryPage />
      </Suspense>
    ),
  },
  {
    path: '/reader/:bookId',
    element: (
      <Suspense fallback={<FullscreenSkeleton />}>
        <ReaderPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<FullscreenSkeleton />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
