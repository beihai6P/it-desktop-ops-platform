import { useState, useCallback, useEffect } from 'react';
import type { Session, Participant } from '@/types';
import { sessionAPI } from '@/services/api';

interface CollaborationState {
  activeTab: 'sessions' | 'history';
  currentSession: Session | null;
  sessions: Session[];
  participants: Participant[];
  isSharing: boolean;
  isRecording: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  loading: boolean;
}

export function useCollaboration() {
  const [state, setState] = useState<CollaborationState>({
    activeTab: 'sessions',
    currentSession: null,
    sessions: [],
    participants: [],
    isSharing: false,
    isRecording: false,
    isCameraOn: true,
    isMicOn: true,
    loading: true,
  });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await sessionAPI.getAll();
      setState((prev) => ({ ...prev, sessions: response.data.sessions, loading: false }));
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const setActiveTab = useCallback((tab: 'sessions' | 'history') => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const selectSession = useCallback((session: Session) => {
    setState((prev) => ({ ...prev, currentSession: session }));
  }, []);

  const closeSession = useCallback(() => {
    setState((prev) => ({ ...prev, currentSession: null }));
  }, []);

  const toggleSharing = useCallback(() => {
    setState((prev) => ({ ...prev, isSharing: !prev.isSharing }));
  }, []);

  const toggleRecording = useCallback(() => {
    setState((prev) => ({ ...prev, isRecording: !prev.isRecording }));
  }, []);

  const toggleCamera = useCallback(() => {
    setState((prev) => ({ ...prev, isCameraOn: !prev.isCameraOn }));
  }, []);

  const toggleMic = useCallback(() => {
    setState((prev) => ({ ...prev, isMicOn: !prev.isMicOn }));
  }, []);

  const endSession = useCallback(async (sessionId: string) => {
    try {
      await sessionAPI.update(sessionId, { status: 'ended' });
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId ? { ...s, status: 'ended' as const } : s
        ),
        currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession,
      }));
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, []);

  const createSession = useCallback(async (title: string, type: Session['type']) => {
    try {
      const response = await sessionAPI.create({ title, type, status: 'active' });
      const newSession = response.data;
      setState((prev) => ({
        ...prev,
        sessions: [newSession, ...prev.sessions],
        currentSession: newSession,
      }));
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, []);

  const addParticipant = useCallback(async (sessionId: string, participant: Omit<Participant, 'id'>) => {
    const newParticipant: Participant = {
      ...participant,
      id: `p-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      participants: [...prev.participants, newParticipant],
      sessions: prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, participants: s.participants + 1 } : s
      ),
    }));
  }, []);

  const removeParticipant = useCallback((participantId: string) => {
    setState((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== participantId),
    }));
  }, []);

  const filterSessions = useCallback(() => {
    const { activeTab, sessions } = state;
    if (activeTab === 'sessions') {
      return sessions.filter((s) => s.status !== 'ended');
    }
    return sessions.filter((s) => s.status === 'ended');
  }, [state]);

  return {
    ...state,
    setActiveTab,
    selectSession,
    closeSession,
    toggleSharing,
    toggleRecording,
    toggleCamera,
    toggleMic,
    endSession,
    createSession,
    addParticipant,
    removeParticipant,
    filterSessions,
    loadSessions,
  };
}