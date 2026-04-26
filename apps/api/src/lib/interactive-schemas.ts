import { Schema, model, Document } from 'mongoose';

export type MomentType = 'highlight' | 'milestone' | 'custom';
export type UnlockState = 'locked' | 'unlocked' | 'expired';

export interface IMoment extends Document {
  sessionId: string;
  artistId: string;
  type: MomentType;
  label: string;
  timestampMs: number;
  voteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IVote extends Document {
  momentId: string;
  fanId: string;
  sessionId: string;
  createdAt: Date;
}

export interface IUnlock extends Document {
  sessionId: string;
  fanId: string;
  featureKey: string;
  state: UnlockState;
  unlockedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const momentSchema = new Schema<IMoment>(
  {
    sessionId:   { type: String, required: true, index: true },
    artistId:    { type: String, required: true, index: true },
    type:        { type: String, enum: ['highlight', 'milestone', 'custom'], required: true },
    label:       { type: String, required: true, maxlength: 128 },
    timestampMs: { type: Number, required: true, min: 0 },
    voteCount:   { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const voteSchema = new Schema<IVote>(
  {
    momentId:  { type: String, required: true, index: true },
    fanId:     { type: String, required: true },
    sessionId: { type: String, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const unlockSchema = new Schema<IUnlock>(
  {
    sessionId:  { type: String, required: true, index: true },
    fanId:      { type: String, required: true, index: true },
    featureKey: { type: String, required: true },
    state:      { type: String, enum: ['locked', 'unlocked', 'expired'], default: 'locked' },
    unlockedAt: { type: Date },
    expiresAt:  { type: Date },
  },
  { timestamps: true }
);

voteSchema.index({ momentId: 1, fanId: 1 }, { unique: true });
unlockSchema.index({ fanId: 1, featureKey: 1, sessionId: 1 }, { unique: true });

export const Moment = model<IMoment>('Moment', momentSchema);
export const Vote = model<IVote>('Vote', voteSchema);
export const Unlock = model<IUnlock>('Unlock', unlockSchema);
