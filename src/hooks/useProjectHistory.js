import { useState, useCallback, useRef } from 'react';

export function useProjectHistory(initialState) {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback((newState) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    
    setHistory((prev) => {
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Prevent saving identical adjacent states
      if (JSON.stringify(newHistory[newHistory.length - 1]) === JSON.stringify(newState)) {
        return prev;
      }
      
      newHistory.push(newState);
      // Keep memory light, limit to 30 actions
      if (newHistory.length > 30) {
        newHistory.shift();
      }
      return newHistory;
    });
    
    setCurrentIndex((prev) => {
      const nextIdx = prev + 1;
      return nextIdx >= 30 ? 29 : nextIdx;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      isUndoRedoAction.current = true;
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (canRedo) {
      isUndoRedoAction.current = true;
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [canRedo, currentIndex, history]);

  const resetHistory = useCallback((state) => {
    setHistory([state]);
    setCurrentIndex(0);
    isUndoRedoAction.current = false;
  }, []);

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory
  };
}
