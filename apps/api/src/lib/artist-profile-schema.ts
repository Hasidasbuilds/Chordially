import { Schema, model, Document } from 'mongoose';

export type PayoutStatus = 'unverified' | 'pending' | 'verified' | 'suspended';

export interface IArtistProfile extends Document {
  userId: string;
  slug: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  genres: string[];
  isVerified: boolean;
  payoutStatus: PayoutStatus;
  payoutWalletAddress?: string;
  followerCount: number;
  totalTipsReceived: number;
  socialLinks: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const artistProfileSchema = new Schema<IArtistProfile>(
  {
    userId:               { type: String, required: true, unique: true, index: true },
    slug:                 { type: String, required: true, unique: true, lowercase: true, trim: true },
    displayName:          { type: String, required: true, trim: true, maxlength: 64 },
    bio:                  { type: String, maxlength: 500 },
    avatarUrl:            { type: String },
    genres:               { type: [String], default: [] },
    isVerified:           { type: Boolean, default: false },
    payoutStatus:         { type: String, enum: ['unverified', 'pending', 'verified', 'suspended'], default: 'unverified' },
    payoutWalletAddress:  { type: String },
    followerCount:        { type: Number, default: 0, min: 0 },
    totalTipsReceived:    { type: Number, default: 0, min: 0 },
    socialLinks:          { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

artistProfileSchema.index({ genres: 1, isVerified: 1 });
artistProfileSchema.index({ payoutStatus: 1 });
artistProfileSchema.index({ followerCount: -1 });

export const ArtistProfile = model<IArtistProfile>('ArtistProfile', artistProfileSchema);
