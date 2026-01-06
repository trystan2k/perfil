import { useEffect, useRef, useState } from 'react';

import { useProfiles } from '@/hooks/useProfiles';
import { getCurrentLocale, navigateWithLocale } from '@/i18n/locales';
import { forcePersist } from '@/stores/gameStore';
import type { Player, Profile, TurnState } from '@/types/models';

import { useTranslate } from '../components/TranslateProvider.tsx';
import { useGamePlayActions, useGamePlayState } from './selectors/index.ts';

export interface UseGamePlayLogicReturn {
  // State
  isLoading: boolean;
  hasLoadError: boolean;
  showRoundSummary: boolean;
  showAnswerDialog: boolean;
  setShowAnswerDialog: (show: boolean) => void;
  removePointsDialogOpen: boolean;
  setRemovePointsDialogOpen: (open: boolean) => void;
  /** null = no player selected for removal (explicit empty state) */
  selectedPlayerForRemoval: { id: string; name: string; score: number } | null;
  /** null = no round summary data to display (explicit empty state) */
  roundSummaryData: { winnerId: string | null; pointsAwarded: number; profileName: string } | null;

  // Game state
  /** null = no game session loaded (explicit empty state) */
  id: string | null;
  /** null = no turn active (explicit empty state) */
  currentTurn: TurnState | null;
  players: Player[];
  status: 'pending' | 'active' | 'completed';
  /** null = no profile currently active (explicit empty state) */
  currentProfile: Profile | null;
  selectedProfiles: string[];
  totalProfilesCount: number;
  numberOfRounds: number;
  currentRound: number;
  revealedClueHistory: string[];

  // Game actions
  nextClue: () => void;
  setGlobalError: (error: string) => void;

  // Computed values
  /** null = no clue to display yet (explicit empty state) */
  currentClueText: string | null;
  isMaxCluesReached: boolean;
  isOnFinalClue: boolean;
  canAwardPoints: boolean;
  currentProfileIndex: number;
  totalProfiles: number;
  totalCluesPerProfile: number;
  pointsRemaining: number;

  // Handlers
  handleFinishGame: () => void;
  handleAwardPoints: (playerId: string) => void;
  handleContinueToNextProfile: () => void;
  handleNoWinner: () => Promise<void>;
  handleSkipProfile: () => Promise<void>;
  handleOpenRemovePoints: (player: { id: string; name: string; score: number }) => void;
  handleConfirmRemovePoints: (amount: number) => Promise<void>;

  // Translation
  t: (key: string, options?: Record<string, string | number>) => string;
}

export function useGamePlayLogic(sessionId?: string): UseGamePlayLogicReturn {
  const { t } = useTranslate();

  // Get current locale from URL
  const currentLocale = getCurrentLocale();

  // Game store state - using grouped selectors for performance optimization
  // Consolidates 18 individual selectors into 2 grouped hooks to reduce re-renders
  const {
    id,
    status,
    currentTurn,
    players,
    currentProfile,
    selectedProfiles,
    totalProfilesCount,
    numberOfRounds,
    currentRound,
    revealedClueHistory,
    clueShuffleMap,
  } = useGamePlayState();

  // Game store actions - using grouped selectors for performance optimization
  const {
    nextClue,
    awardPoints,
    removePoints,
    skipProfile,
    endGame,
    loadFromStorage,
    loadProfiles,
    setError: setGlobalError,
  } = useGamePlayActions();

  // Determine if loading is needed: only if sessionId provided AND no game already in store
  const gameAlreadyExists = !!id && (status === 'active' || status === 'completed');
  const [isLoading, setIsLoading] = useState(!!sessionId && !gameAlreadyExists);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showAnswerDialog, setShowAnswerDialog] = useState(false);
  const [removePointsDialogOpen, setRemovePointsDialogOpen] = useState(false);
  const [selectedPlayerForRemoval, setSelectedPlayerForRemoval] = useState<{
    id: string;
    name: string;
    score: number;
  } | null>(null);
  const [roundSummaryData, setRoundSummaryData] = useState<{
    winnerId: string | null;
    pointsAwarded: number;
    profileName: string;
  } | null>(null);

  // Fetch profiles for current language with error handling
  const { data: profilesData, isError, error } = useProfiles(currentLocale);

  // Track previous language to detect changes and handle errors
  const prevLanguageRef = useRef(currentLocale);
  // Track if we've synced profiles for the current session to avoid infinite loops
  const hasSyncedRef = useRef<string | null>(null);

  // Handle profile fetch errors
  useEffect(() => {
    if (isError && error) {
      console.error('Failed to load profiles for language:', currentLocale, error);
      setGlobalError('gamePlay.errors.loadFailed');
    }
  }, [isError, error, currentLocale, setGlobalError]);

  // Consolidated effect: Handle both language changes and initial load sync
  useEffect(() => {
    // Skip if no profiles data available
    if (!profilesData?.profiles) {
      return;
    }

    // Determine if this is a language change or initial load
    const languageChanged = prevLanguageRef.current !== currentLocale;
    const syncKey = `${id}-${currentLocale}`;
    const needsInitialSync = id && status === 'active' && hasSyncedRef.current !== syncKey;

    // Only proceed if either language changed or initial sync is needed
    if (!languageChanged && !needsInitialSync) {
      return;
    }

    // For language changes, only proceed if game is active
    if (languageChanged && status !== 'active') {
      // Update ref even if game not active to track the change
      prevLanguageRef.current = currentLocale;
      hasSyncedRef.current = null;
      return;
    }

    // Load the new profiles into the store
    loadProfiles(profilesData.profiles);

    // Update tracking refs
    prevLanguageRef.current = currentLocale;
    hasSyncedRef.current = syncKey;
  }, [profilesData, currentLocale, id, status, loadProfiles]);

  // Load game state from storage on mount if sessionId provided AND game doesn't already exist
  useEffect(() => {
    // Skip loading if game already exists in store
    if (sessionId && !gameAlreadyExists) {
      if (id.trim().length > 0 && id !== sessionId) {
        // Additional check: If store has a non-matching id, skip loading
        // This prevents trying to reload a session that was just deleted during language change
        // id.trim().length > 0 means the store has a session (not empty string from reset)
        // If that session doesn't match the URL sessionId, we're in a transition - don't load
        setIsLoading(false);
        return;
      }

      const loadSession = async () => {
        try {
          await loadFromStorage(sessionId);
          setHasLoadError(false);

          if (profilesData?.profiles) {
            // IMPORTANT: After loading from storage, immediately sync profiles to current language
            // This prevents the loaded state from having profiles in a different language
            loadProfiles(profilesData.profiles);
          }
        } catch (err) {
          console.error('Failed to load session:', err);
          setHasLoadError(true);
          setGlobalError('gamePlay.errors.loadFailed');
        } finally {
          setIsLoading(false);
        }
      };

      loadSession();
    }
  }, [
    sessionId,
    gameAlreadyExists,
    loadFromStorage,
    setGlobalError,
    profilesData,
    loadProfiles,
    id,
  ]);

  // Detect invalid game state and set error flag
  useEffect(() => {
    // Skip error check if we're in a transition state (mismatched ids)
    // This prevents showing errors when navigating away from a game (e.g., language change)
    // Only skip if BOTH sessionId and id exist and don't match
    if (sessionId && id.trim().length > 0 && id !== sessionId) {
      return;
    }

    // Only check after loading is complete and if we haven't already detected an error
    if (!isLoading && !hasLoadError && status !== 'completed') {
      if (!currentTurn || !currentProfile || status === 'pending') {
        setHasLoadError(true);
        setGlobalError('gamePlay.errors.loadFailed');
      }
    }
  }, [isLoading, hasLoadError, currentTurn, currentProfile, status, setGlobalError, id, sessionId]);

  // Automatically navigate to scoreboard when game completes
  useEffect(() => {
    if (status === 'completed' && id) {
      // Force persist immediately to ensure final state (with last round points) is saved
      // before navigation navigates to scoreboard
      const handleNavigation = async () => {
        try {
          await forcePersist();
          // After persistence is confirmed, navigate
          navigateWithLocale(`/scoreboard/${id}`);
        } catch (error) {
          console.error('Failed to persist before navigation:', error);
          // Still navigate even if persistence fails to avoid getting stuck
          navigateWithLocale(`/scoreboard/${id}`);
        }
      };

      handleNavigation();
    }
  }, [status, id]);

  // Computed values
  const currentClueText =
    currentTurn && currentTurn.cluesRead > 0 && currentProfile
      ? (() => {
          // Get shuffle indices for current profile, if they exist
          const shuffleIndices = clueShuffleMap.get(currentProfile.id);
          if (shuffleIndices) {
            // Use shuffled access
            const actualIndex = shuffleIndices[currentTurn.cluesRead - 1];
            return currentProfile.clues[actualIndex] ?? null;
          }
          // Fallback to sequential access if no shuffle found
          return currentProfile.clues[currentTurn.cluesRead - 1] ?? null;
        })()
      : null;

  const isMaxCluesReached =
    currentTurn && currentProfile ? currentTurn.cluesRead >= currentProfile.clues.length : false;

  const isOnFinalClue =
    currentTurn && currentProfile
      ? currentTurn.cluesRead === currentProfile.clues.length && currentTurn.cluesRead > 0
      : false;

  const canAwardPoints = currentTurn ? currentTurn.cluesRead > 0 : false;

  const currentProfileIndex = totalProfilesCount - selectedProfiles.length + 1;
  const totalProfiles = totalProfilesCount;

  const totalCluesPerProfile = currentProfile?.clues.length || 0;
  const pointsRemaining =
    currentTurn && currentTurn.cluesRead > 0
      ? totalCluesPerProfile - (currentTurn.cluesRead - 1)
      : totalCluesPerProfile;

  // Handlers
  const handleFinishGame = async () => {
    await endGame();
    if (id) {
      navigateWithLocale(`/scoreboard/${id}`);
    }
  };

  const handleAwardPoints = (playerId: string) => {
    const winner = players.find((p) => p.id === playerId);

    if (winner && currentTurn && currentTurn.cluesRead > 0 && currentProfile) {
      const points = totalCluesPerProfile - (currentTurn.cluesRead - 1);

      setRoundSummaryData({
        winnerId: playerId,
        pointsAwarded: points,
        profileName: currentProfile.name,
      });
      setShowRoundSummary(true);
    }
  };

  const handleContinueToNextProfile = async () => {
    setShowRoundSummary(false);

    if (roundSummaryData) {
      if (roundSummaryData.winnerId) {
        await awardPoints(roundSummaryData.winnerId);
      } else {
        skipProfile();
      }
    }

    setRoundSummaryData(null);
  };

  const handleNoWinner = async () => {
    await skipProfile();
  };

  const handleOpenRemovePoints = (player: { id: string; name: string; score: number }) => {
    setSelectedPlayerForRemoval(player);
    setRemovePointsDialogOpen(true);
  };

  const handleConfirmRemovePoints = async (amount: number) => {
    if (!selectedPlayerForRemoval) {
      return;
    }

    try {
      await removePoints(selectedPlayerForRemoval.id, amount);
    } catch (err) {
      console.error('Failed to remove points:', err);
      throw err;
    }
  };

  const handleSkipProfile = async () => {
    try {
      await skipProfile();
    } catch (err) {
      console.error('Failed to skip profile:', err);
      throw err;
    }
  };

  return {
    // State
    isLoading,
    hasLoadError,
    showRoundSummary,
    showAnswerDialog,
    setShowAnswerDialog,
    removePointsDialogOpen,
    setRemovePointsDialogOpen,
    selectedPlayerForRemoval,
    roundSummaryData,

    // Game state
    id,
    currentTurn,
    players,
    status,
    currentProfile,
    selectedProfiles,
    totalProfilesCount,
    numberOfRounds,
    currentRound,
    revealedClueHistory,

    // Game actions
    nextClue,
    setGlobalError,

    // Computed values
    currentClueText,
    isMaxCluesReached,
    isOnFinalClue,
    canAwardPoints,
    currentProfileIndex,
    totalProfiles,
    totalCluesPerProfile,
    pointsRemaining,

    // Handlers
    handleFinishGame,
    handleAwardPoints,
    handleContinueToNextProfile,
    handleNoWinner,
    handleSkipProfile,
    handleOpenRemovePoints,
    handleConfirmRemovePoints,

    // Translation
    t,
  };
}
