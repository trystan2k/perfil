import type { TFunction } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfiles } from '@/hooks/useProfiles';
import { forcePersist, useGameStore } from '@/stores/gameStore';
import type { Player, Profile, TurnState } from '@/types/models';

export interface UseGamePlayLogicReturn {
  // State
  isLoading: boolean;
  hasLoadError: boolean;
  showRoundSummary: boolean;
  showAnswerDialog: boolean;
  setShowAnswerDialog: (show: boolean) => void;
  removePointsDialogOpen: boolean;
  setRemovePointsDialogOpen: (open: boolean) => void;
  selectedPlayerForRemoval: { id: string; name: string; score: number } | null;
  roundSummaryData: { winnerId: string | null; pointsAwarded: number; profileName: string } | null;

  // Game state
  id: string | null;
  currentTurn: TurnState | null;
  players: Player[];
  status: 'pending' | 'active' | 'completed';
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
  handleOpenRemovePoints: (player: { id: string; name: string; score: number }) => void;
  handleConfirmRemovePoints: (amount: number) => Promise<void>;

  // Translation
  t: TFunction;
}

export function useGamePlayLogic(sessionId?: string): UseGamePlayLogicReturn {
  const { t, i18n } = useTranslation();

  // Game store state - get id and status first for loading state computation
  const id = useGameStore((state) => state.id);
  const status = useGameStore((state) => state.status);

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

  // Game store state - remaining values
  const currentTurn = useGameStore((state) => state.currentTurn);
  const players = useGameStore((state) => state.players);
  const currentProfile = useGameStore((state) => state.currentProfile);
  const selectedProfiles = useGameStore((state) => state.selectedProfiles);
  const totalProfilesCount = useGameStore((state) => state.totalProfilesCount);
  const numberOfRounds = useGameStore((state) => state.numberOfRounds);
  const currentRound = useGameStore((state) => state.currentRound);
  const revealedClueHistory = useGameStore((state) => state.revealedClueHistory);
  const nextClue = useGameStore((state) => state.nextClue);
  const awardPoints = useGameStore((state) => state.awardPoints);
  const removePoints = useGameStore((state) => state.removePoints);
  const skipProfile = useGameStore((state) => state.skipProfile);
  const endGame = useGameStore((state) => state.endGame);
  const loadFromStorage = useGameStore((state) => state.loadFromStorage);
  const loadProfiles = useGameStore((state) => state.loadProfiles);
  const setGlobalError = useGameStore((state) => state.setError);

  // Fetch profiles for current language with error handling
  const { data: profilesData, isError, error } = useProfiles(i18n.language);

  // Track previous language to detect changes and handle errors
  const prevLanguageRef = useRef(i18n.language);
  // Track if we've synced profiles for the current session to avoid infinite loops
  const hasSyncedRef = useRef<string | null>(null);

  // Handle profile fetch errors by reverting language
  useEffect(() => {
    if (isError && error) {
      // If profiles failed to load for new language, revert to previous language
      const prevLang = prevLanguageRef.current;
      if (prevLang !== i18n.language) {
        console.error('Failed to load profiles for language:', i18n.language, error);
        // Revert language change to prevent inconsistent state
        i18n.changeLanguage(prevLang);
        prevLanguageRef.current = prevLang;
      }
    }
  }, [isError, error, i18n]);

  // Consolidated effect: Handle both language changes and initial load sync
  useEffect(() => {
    // Skip if no profiles data available
    if (!profilesData?.profiles) {
      return;
    }

    // Determine if this is a language change or initial load
    const languageChanged = prevLanguageRef.current !== i18n.language;
    const syncKey = `${id}-${i18n.language}`;
    const needsInitialSync = id && status === 'active' && hasSyncedRef.current !== syncKey;

    // Only proceed if either language changed or initial sync is needed
    if (!languageChanged && !needsInitialSync) {
      return;
    }

    // For language changes, only proceed if game is active
    if (languageChanged && status !== 'active') {
      // Update ref even if game not active to track the change
      prevLanguageRef.current = i18n.language;
      hasSyncedRef.current = null;
      return;
    }

    // Load the new profiles into the store
    loadProfiles(profilesData.profiles);

    // Update tracking refs
    prevLanguageRef.current = i18n.language;
    hasSyncedRef.current = syncKey;
  }, [profilesData, i18n.language, id, status, loadProfiles]);

  // Load game state from storage on mount if sessionId provided AND game doesn't already exist
  useEffect(() => {
    // Skip loading if game already exists in store
    if (sessionId && !gameAlreadyExists) {
      const loadSession = async () => {
        try {
          await loadFromStorage(sessionId);
          setHasLoadError(false);
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
  }, [sessionId, gameAlreadyExists, loadFromStorage, setGlobalError]);

  // Detect invalid game state and set error flag
  useEffect(() => {
    // Only check after loading is complete and if we haven't already detected an error
    if (!isLoading && !hasLoadError && status !== 'completed') {
      if (!currentTurn || !currentProfile || status === 'pending') {
        setHasLoadError(true);
        setGlobalError('gamePlay.errors.loadFailed');
      }
    }
  }, [isLoading, hasLoadError, currentTurn, currentProfile, status, setGlobalError]);

  // Automatically navigate to scoreboard when game completes
  useEffect(() => {
    if (status === 'completed' && id) {
      // Force persist immediately to ensure final state (with last round points) is saved
      // before navigation navigates to scoreboard
      const handleNavigation = async () => {
        try {
          await forcePersist();
          // After persistence is confirmed, navigate
          window.location.href = `/scoreboard/${id}`;
        } catch (error) {
          console.error('Failed to persist before navigation:', error);
          // Still navigate even if persistence fails to avoid getting stuck
          window.location.href = `/scoreboard/${id}`;
        }
      };

      handleNavigation();
    }
  }, [status, id]);

  // Computed values
  const currentClueText =
    currentTurn && currentTurn.cluesRead > 0 && currentProfile
      ? currentProfile.clues[currentTurn.cluesRead - 1]
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
      window.location.href = `/scoreboard/${id}`;
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
    handleOpenRemovePoints,
    handleConfirmRemovePoints,

    // Translation
    t,
  };
}
