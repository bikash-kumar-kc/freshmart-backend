import { Module, Global } from '@nestjs/common';
import { dbProvider, DB_PROVIDER } from './db.provider';

@Global()
@Module({
  providers: [dbProvider],
  exports: [DB_PROVIDER],
})
export class DatabaseModule {}
