import { useCallback, useEffect, useRef, useState } from 'react';
import { updateProgress } from '@/store/book-store';
import type { Book } from '@/model/book';

export type Theme = 'light' | 'dark' | 'sepia';
export type FontFamily = 'default' | 'serif' | 'sans' | 'mono';
export type Columns = 1 | 2;

interface ReaderSettings {
  theme: Theme;
  fontSize: number;
  fontFamily: FontFamily;
  columns: Columns;
  margin: number;
}

interface ReaderNav {
  spineIndex: number;
  cfi: string;
}

interface ReaderUI {
  tocOpen: boolean;
  settingsOpen: boolean;
  progress: number;
}

export interface ReaderState extends ReaderSettings, ReaderNav, ReaderUI {}

export interface ReaderActions {
  goToSpine: (index: number) => void;
  nextSpine: () => void;
  prevSpine: () => void;
  setCfi: (cfi: string, progress: number) => void;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: FontFamily) => void;
  setColumns: (cols: Columns) => void;
  setMargin: (margin: number) => void;
  toggleToc: () => void;
  toggleSettings: () => void;
}

const LS_KEY = 'beer:reader-settings';

function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return { ...defaultSettings(), ...(JSON.parse(raw) as Partial<ReaderSettings>) };
  } catch {
    // ignore
  }
  return defaultSettings();
}

function defaultSettings(): ReaderSettings {
  return { theme: 'light', fontSize: 100, fontFamily: 'default', columns: 1, margin: 2 };
}

function saveSettings(s: ReaderSettings): void {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

export function useReaderState(
  bookId: string,
  book: Book | null,
  initialCfi?: string,
): [ReaderState, ReaderActions] {
  const settings = loadSettings();
  const [state, setState] = useState<ReaderState>({
    ...settings,
    spineIndex: 0,
    cfi: initialCfi ?? '',
    tocOpen: false,
    settingsOpen: false,
    progress: 0,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist settings on change
  useEffect(() => {
    saveSettings({
      theme: state.theme,
      fontSize: state.fontSize,
      fontFamily: state.fontFamily,
      columns: state.columns,
      margin: state.margin,
    });
  }, [state.theme, state.fontSize, state.fontFamily, state.columns, state.margin]);

  const goToSpine = useCallback(
    (index: number) => {
      if (!book) return;
      const clamped = Math.max(0, Math.min(index, book.spineItems.length - 1));
      setState((s) => ({ ...s, spineIndex: clamped, cfi: book.spineItems[clamped]?.cfi ?? '' }));
    },
    [book],
  );

  const nextSpine = useCallback(() => {
    setState((s) => {
      if (!book) return s;
      const next = Math.min(s.spineIndex + 1, book.spineItems.length - 1);
      return { ...s, spineIndex: next, cfi: book.spineItems[next]?.cfi ?? '' };
    });
  }, [book]);

  const prevSpine = useCallback(() => {
    setState((s) => {
      if (!book) return s;
      const prev = Math.max(s.spineIndex - 1, 0);
      return { ...s, spineIndex: prev, cfi: book.spineItems[prev]?.cfi ?? '' };
    });
  }, [book]);

  const setCfi = useCallback(
    (cfi: string, progress: number) => {
      setState((s) => ({ ...s, cfi, progress }));
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void updateProgress(bookId, cfi, progress);
      }, 1000);
    },
    [bookId],
  );

  const setTheme = useCallback((theme: Theme) => setState((s) => ({ ...s, theme })), []);
  const setFontSize = useCallback((fontSize: number) => setState((s) => ({ ...s, fontSize })), []);
  const setFontFamily = useCallback(
    (fontFamily: FontFamily) => setState((s) => ({ ...s, fontFamily })),
    [],
  );
  const setColumns = useCallback((columns: Columns) => setState((s) => ({ ...s, columns })), []);
  const setMargin = useCallback((margin: number) => setState((s) => ({ ...s, margin })), []);
  const toggleToc = useCallback(
    () => setState((s) => ({ ...s, tocOpen: !s.tocOpen, settingsOpen: false })),
    [],
  );
  const toggleSettings = useCallback(
    () => setState((s) => ({ ...s, settingsOpen: !s.settingsOpen, tocOpen: false })),
    [],
  );

  const actions: ReaderActions = {
    goToSpine,
    nextSpine,
    prevSpine,
    setCfi,
    setTheme,
    setFontSize,
    setFontFamily,
    setColumns,
    setMargin,
    toggleToc,
    toggleSettings,
  };

  return [state, actions];
}
