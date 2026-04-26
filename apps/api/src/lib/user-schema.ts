import { Schema, model, Document } from 'mongoose';

export type UserRole = 'fan' | 'artist' | 'admin';
export type ConsentState = 'pending' | 'accepted' | 'withdrawn';
export type ModerationStatus = 'active' | 'warned' | 'suspended' | 'banned';

export interface IUser extends Document {
  email: string;
  authId: string;           // external auth provider subject (e.g. Clerk userId)
  role: UserRole;
  displayName: string;
  avatarUrl?: string;
  consentState: ConsentState;
  consentUpdatedAt?: Date;
  moderationStatus: ModerationStatus;
  profileRef?: string;      // slug or ObjectId of role-specific profile doc
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    authId:           { type: String, required: true, unique: true, index: true },
    role:             { type: String, enum: ['fan', 'artist', 'admin'], required: true },
    displayName:      { type: String, required: true, trim: true, maxlength: 64 },
    avatarUrl:        { type: String },
    consentState:     { type: String, enum: ['pending', 'accepted', 'withdrawn'], default: 'pending' },
    consentUpdatedAt: { type: Date },
    moderationStatus: { type: String, enum: ['active', 'warned', 'suspended', 'banned'], default: 'active' },
    profileRef:       { type: String },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, moderationStatus: 1 });

userSchema.pre('save', function (next) {
  if (this.isModified('consentState')) {
    this.consentUpdatedAt = new Date();
  }
  next();
});

export const User = model<IUser>('User', userSchema);
