import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Track
// ---------------------------------------------------------------------------
export interface ITrack extends Document {
  title: string;
  artistId: Types.ObjectId;
  durationMs: number;
  audioUrl: string;
  plays: number;
  createdAt: Date;
}

const trackSchema = new Schema<ITrack>(
  {
    title:      { type: String, required: true, trim: true },
    artistId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    durationMs: { type: Number, required: true, min: 0 },
    audioUrl:   { type: String, required: true },
    plays:      { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

trackSchema.index({ artistId: 1, createdAt: -1 });

export const Track = model<ITrack>('Track', trackSchema);

// ---------------------------------------------------------------------------
// Tip
// ---------------------------------------------------------------------------
export interface ITip extends Document {
  fromUserId: Types.ObjectId;
  toArtistId: Types.ObjectId;
  trackId?: Types.ObjectId;
  amountCents: number;
  currency: string;
  status: 'pending' | 'settled' | 'failed';
  createdAt: Date;
}

const tipSchema = new Schema<ITip>(
  {
    fromUserId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    toArtistId:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trackId:     { type: Schema.Types.ObjectId, ref: 'Track' },
    amountCents: { type: Number, required: true, min: 1 },
    currency:    { type: String, default: 'USD', uppercase: true, length: 3 },
    status:      { type: String, enum: ['pending', 'settled', 'failed'], default: 'pending' },
  },
  { timestamps: true }
);

export const Tip = model<ITip>('Tip', tipSchema);
