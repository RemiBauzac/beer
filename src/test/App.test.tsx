import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('@/store/book-store', () => ({
  listBooks: vi.fn().mockResolvedValue([]),
  deleteBook: vi.fn().mockResolvedValue(undefined),
  addBook: vi.fn().mockResolvedValue('mock-id'),
  getBook: vi.fn().mockResolvedValue(undefined),
  getCover: vi.fn().mockResolvedValue(undefined),
  storeCover: vi.fn().mockResolvedValue(undefined),
  getBookBlob: vi.fn().mockResolvedValue(undefined),
  updateProgress: vi.fn().mockResolvedValue(undefined),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

import App from '../App';

describe('App', () => {
  it('renders library page', () => {
    render(<App />);
    expect(screen.getByText('BEER')).toBeInTheDocument();
  });
});
