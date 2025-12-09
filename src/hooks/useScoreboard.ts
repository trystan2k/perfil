import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { navigateWithLocale } from '@/i18n/locales';
import { forcePersist, useGameStore } from '@/stores/gameStore';
import type { Player } from '@/types/models';
import { useTranslate } from '../components/TranslateProvider';

export interface RankedPlayer extends Player {
  rank: number;
}

type ActionState = {
  error: string | null;
};

export interface UseScoreboardReturn {
  // State
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Pending states for actions
  isNewGamePending: boolean;
  isSamePlayersPending: boolean;
  isRestartGamePending: boolean;

  // Data
  rankedPlayers: RankedPlayer[];
  category?: string;

  // Actions
  handleNewGame: () => void;
  handleSamePlayers: () => void;
  handleRestartGame: () => void;
  handleRetry: () => Promise<void>;

  // Translation
  t: (key: string, options?: Record<string, string | number>) => string;
}

export function useScoreboard(sessionId?: string): UseScoreboardReturn {
  const { t } = useTranslate();

  // Game store state
  const id = useGameStore((state) => state.id);
  const status = useGameStore((state) => state.status);
  const players = useGameStore((state) => state.players);
  const category = useGameStore((state) => state.category);
  const profiles = useGameStore((state) => state.profiles);
  const loadProfiles = useGameStore((state) => state.loadProfiles);
  const numberOfRounds = useGameStore((state) => state.numberOfRounds);
  const selectedCategories = useGameStore((state) => state.selectedCategories);
  const loadFromStorage = useGameStore((state) => state.loadFromStorage);
  const resetGame = useGameStore((state) => state.resetGame);
  const createGame = useGameStore((state) => state.createGame);
  const startGame = useGameStore((state) => state.startGame);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've already loaded this session to prevent reloading on state changes
  const loadedSessionRef = useRef<string | null>(null);

  // useActionState for new game action
  const [_newGameState, newGameAction, isNewGamePending] = useActionState<ActionState, FormData>(
    async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => {
      try {
        resetGame();
        navigateWithLocale('/');
        return { error: null };
      } catch (err) {
        console.error('Failed to start new game:', err);
        return { error: 'scoreboard.error.newGameFailed' };
      }
    },
    { error: null }
  );

  // useActionState for same players action
  const [_samePlayersState, samePlayersAction, isSamePlayersPending] = useActionState<
    ActionState,
    FormData
  >(
    async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => {
      try {
        const samePlayers = true;
        await resetGame(samePlayers);
        const newId = useGameStore.getState().id;
        navigateWithLocale(`/game-setup/${newId}`);
        return { error: null };
      } catch (err) {
        console.error('Failed to restart with same players:', err);
        return { error: 'scoreboard.error.samePlayersFailed' };
      }
    },
    { error: null }
  );

  // useActionState for restart game action
  const [_restartGameState, restartGameAction, isRestartGamePending] = useActionState<
    ActionState,
    FormData
  >(
    async (_prevState: ActionState, _formData: FormData): Promise<ActionState> => {
      try {
        const resetPlayers: string[] = players.map((player) => player.name);
        await createGame(resetPlayers);
        loadProfiles(profiles);
        startGame(selectedCategories, numberOfRounds);
        await forcePersist();
        const newSessionId = useGameStore.getState().id;
        navigateWithLocale(`/game/${newSessionId}`);
        return { error: null };
      } catch (err) {
        console.error('Failed to restart game:', err);
        return { error: 'scoreboard.error.restartGameFailed' };
      }
    },
    { error: null }
  );

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Load game session on mount
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setError('scoreboard.error.noSessionId');
        return;
      }

      // If we've already loaded this session, don't reload
      if (loadedSessionRef.current === sessionId) {
        return;
      }

      // If we already have this session loaded and it's completed, no need to reload
      if (id === sessionId && status === 'completed') {
        loadedSessionRef.current = sessionId;
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const success = await loadFromStorage(sessionId);
        if (!success) {
          setError('scoreboard.error.sessionNotFound');
        } else {
          loadedSessionRef.current = sessionId;
        }
      } catch (_err) {
        setError('scoreboard.error.loadFailed');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId, id, status, loadFromStorage]);

  // Compute ranked players from game state
  const rankedPlayers = useMemo<RankedPlayer[]>(() => {
    if (!players || players.length === 0) return [];

    // Sort players by score (descending) and assign ranks with ties
    const sorted = [...players].sort((a, b) => b.score - a.score);

    // Assign ranks with ties: players with the same score get the same rank
    let currentRank = 1;
    let prevScore: number | null = null;

    return sorted.map((player, index) => {
      if (prevScore === null || player.score !== prevScore) {
        currentRank = index + 1;
      }
      prevScore = player.score;

      return {
        ...player,
        rank: currentRank,
      };
    });
  }, [players]);

  // Handler: Start new fresh game - triggers action
  const handleNewGame = () => {
    newGameAction(new FormData());
  };

  // Handler: Start game with same players - triggers action
  const handleSamePlayers = () => {
    samePlayersAction(new FormData());
  };

  // Handler: Restart game - triggers action
  const handleRestartGame = () => {
    restartGameAction(new FormData());
  };

  // Handler: Retry loading
  const handleRetry = async () => {
    if (!sessionId) return;

    // Reset the loaded session ref to allow reloading
    loadedSessionRef.current = null;

    setIsLoading(true);
    setError(null);

    try {
      const success = await loadFromStorage(sessionId);
      if (!success) {
        setError('scoreboard.error.sessionNotFound');
      } else {
        loadedSessionRef.current = sessionId;
      }
    } catch (err) {
      console.error('Failed to load game session:', err);
      setError('scoreboard.error.loadFailed');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    isLoading,
    isHydrated,
    error,

    // Pending states for actions
    isNewGamePending,
    isSamePlayersPending,
    isRestartGamePending,

    // Data
    rankedPlayers,
    category,

    // Actions
    handleNewGame,
    handleSamePlayers,
    handleRestartGame,
    handleRetry,

    // Translation
    t,
  };
}
