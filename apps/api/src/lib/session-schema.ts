import { Schema, model, Document } from 'mongoose';

export type SessionState = 'draft' | 'live' | 'ended' | 'cancelled';

export interface ISession extends Document {
  artistId: string;
  title: string;
  description?: string;
  state: SessionState;
  scheduledAt?: Date;
  startedAt?: Date;
  endedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  peakViewerCount: number;
  totalViewerCount: number;
  totalTipsReceived: number;
  streamKey?: string;
  playbackUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    artistId:          { type: String, required: true, index: true },
    title:             { type: String, required: true, trim: true, maxlength: 120 },
    description:       { type: String, maxlength: 1000 },
    state:             { type: String, enum: ['draft', 'live', 'ended', 'cancelled'], default: 'draft' },
    scheduledAt:       { type: Date },
    startedAt:         { type: Date },
    endedAt:           { type: Date },
    cancelledAt:       { type: Date },
    cancelReason:      { type: String, maxlength: 256 },
    peakViewerCount:   { type: Number, default: 0, min: 0 },
    totalViewerCount:  { type: Number, default: 0, min: 0 },
    totalTipsReceived: { type: Number, default: 0, min: 0 },
    streamKey:         { type: String, select: false },
    playbackUrl:       { type: String },
    thumbnailUrl:      { type: String },
    tags:              { type: [String], default: [] },
  },
  { timestamps: true }
);

sessionSchema.index({ artistId: 1, state: 1 });
sessionSchema.index({ state: 1, scheduledAt: 1 });

export const Session = model<ISession>('Session', sessionSchema);
