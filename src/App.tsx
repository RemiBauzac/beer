import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { LibraryPage } from '@/pages/LibraryPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/library" replace />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/reader/:id" element={<div>Reader (coming soon)</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
