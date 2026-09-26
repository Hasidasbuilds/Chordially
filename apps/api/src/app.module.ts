import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/users/user.module.js';
import { CreatorModule } from './modules/creators/creator.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { TipModule } from './modules/tips/tip.module.js';
import { StreamModule } from './modules/streams/stream.module.js';
import { CreatorPayoutModule } from './modules/creator-payouts/creator-payout.module.js';

@Module({
  imports: [AuthModule, UserModule, CreatorModule, WalletModule, TipModule, StreamModule, CreatorPayoutModule],
})
export class AppModule {}
