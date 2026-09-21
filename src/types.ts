// Shared type definitions used across modules.

export type CategoryAction = 'off' | 'notify' | 'skip';
export type ActionType = 'skip' | 'mute' | 'poi';

export interface CategoryDef {
    key: string;
    name: string;
    color: string;
    supportsMute: boolean;
    default: CategoryAction;
    isPoi?: boolean;
}

export interface Segment {
    uuid: string;
    category: string;
    actionType: ActionType;
    start: number;
    end: number;
    locked: boolean;
    votes: number;
}

export interface PendingSegment {
    start: number;
    end: number;
    category: string;
    actionType: 'skip' | 'poi';
}

export interface Stats {
    segmentsSkipped: number;
    secondsSaved: number;
}

export interface RequestResult {
    status: number;
    text: string;
}
