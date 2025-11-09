export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface Profile {
  id: string;
  category: string;
  name: string;
  clues: string[];
  metadata?: {
    language?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    source?: string;
    [key: string]: unknown;
  };
}

export interface TurnState {
  profileId: string;
  activePlayerId: string;
  cluesRead: number;
  revealed: boolean;
}

export interface GameSession {
  id: string;
  players: Player[];
  currentTurn: TurnState | null;
  remainingProfiles: string[];
  totalCluesPerProfile: number;
}

export interface ProfilesData {
  version?: string;
  profiles: Profile[];
}
