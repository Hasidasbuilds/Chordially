import { Schema, model, Document } from 'mongoose';

export type TipIntentState = 'pending' | 'submitted' | 'confirmed' | 'failed' | 'expired';
export type TipTxState = 'submitted' | 'confirmed' | 'failed';

export interface ITipIntent extends Document {
  fanId: string;
  artistId: string;
  sessionId: string;
  amountLamports: number;
  currency: string;
  state: TipIntentState;
  idempotencyKey: string;
  txId?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITipTransaction extends Document {
  intentId: string;
  fanId: string;
  artistId: string;
  sessionId: string;
  amountLamports: number;
  txSignature: string;
  state: TipTxState;
  confirmedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tipIntentSchema = new Schema<ITipIntent>(
  {
    fanId:           { type: String, required: true, index: true },
    artistId:        { type: String, required: true, index: true },
    sessionId:       { type: String, required: true, index: true },
    amountLamports:  { type: Number, required: true, min: 1 },
    currency:        { type: String, required: true, default: 'SOL' },
    state:           { type: String, enum: ['pending', 'submitted', 'confirmed', 'failed', 'expired'], default: 'pending' },
    idempotencyKey:  { type: String, required: true, unique: true },
    txId:            { type: String },
    expiresAt:       { type: Date, required: true },
  },
  { timestamps: true }
);

const tipTransactionSchema = new Schema<ITipTransaction>(
  {
    intentId:       { type: String, required: true, unique: true, index: true },
    fanId:          { type: String, required: true, index: true },
    artistId:       { type: String, required: true, index: true },
    sessionId:      { type: String, required: true, index: true },
    amountLamports: { type: Number, required: true, min: 1 },
    txSignature:    { type: String, required: true, unique: true },
    state:          { type: String, enum: ['submitted', 'confirmed', 'failed'], default: 'submitted' },
    confirmedAt:    { type: Date },
    failureReason:  { type: String },
  },
  { timestamps: true }
);

tipIntentSchema.index({ sessionId: 1, state: 1 });
tipTransactionSchema.index({ artistId: 1, state: 1 });

export const TipIntent = model<ITipIntent>('TipIntent', tipIntentSchema);
export const TipTransaction = model<ITipTransaction>('TipTransaction', tipTransactionSchema);
