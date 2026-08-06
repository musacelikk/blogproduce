import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SchemaMigratorService } from './schema-migrator.service';

/**
 * Applies additive schema changes at boot, before anything serves traffic.
 * Imported early in AppModule so the columns exist by the first request.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [SchemaMigratorService],
  exports: [SchemaMigratorService],
})
export class DatabaseModule {}
