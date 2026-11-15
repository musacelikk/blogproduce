import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AutopilotModule } from './autopilot.module';
import { AutopilotApiController } from './autopilot-api.controller';
import { AutopilotService } from './autopilot.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { ApiKey } from '../entities/api-key.entity';

/**
 * Dependency resolution for the partner-API controller.
 *
 * This exists because the real thing shipped broken: `@UseGuards(ApiKeyGuard)`
 * constructs the guard in the context of the module that declares the
 * controller, and `ApiKeyGuard` injects the `ApiKey` repository. `AuthModule`
 * exporting the guard is not enough — `TypeOrmModule.forFeature` providers stay
 * inside the module that declares them — so `AutopilotModule` has to register
 * `ApiKey` itself, exactly as `ApiModule` does.
 *
 * The smoke test that was supposed to catch this booted the app against an
 * unreachable database and grepped the log for resolution errors. TypeORM
 * retried the connection, module initialisation never reached the controllers,
 * and the absence of an error read as success. A test has to actually resolve
 * the graph.
 */
describe('AutopilotApiController wiring', () => {
  it('resolves with the ApiKey repository available, as the module provides it', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AutopilotApiController],
      providers: [
        ApiKeyGuard,
        { provide: AutopilotService, useValue: {} },
        { provide: getRepositoryToken(ApiKey), useValue: {} },
      ],
    }).compile();

    expect(moduleRef.get(AutopilotApiController)).toBeDefined();
    expect(moduleRef.get(ApiKeyGuard)).toBeDefined();
  });

  it('fails to resolve without it — the exact production failure', async () => {
    // Pinning the negative too: if someone drops ApiKey from the module's
    // forFeature again, the positive test above is what starts failing, and
    // this says what the symptom will be.
    await expect(
      Test.createTestingModule({
        controllers: [AutopilotApiController],
        providers: [ApiKeyGuard, { provide: AutopilotService, useValue: {} }],
      }).compile(),
    ).rejects.toThrow(/ApiKeyRepository/);
  });

  it('AutopilotModule itself registers that repository', () => {
    // The two tests above pass even if the module stops providing ApiKey —
    // they build their own context. This one reads the module's real metadata,
    // so it is what fails if the registration is removed.
    const imports: any[] = Reflect.getMetadata('imports', AutopilotModule) ?? [];
    const token = getRepositoryToken(ApiKey);

    const registered = imports.some((imported) =>
      (imported?.providers ?? []).some((provider: any) => provider?.provide === token),
    );

    expect(registered).toBe(true);
  });
});
