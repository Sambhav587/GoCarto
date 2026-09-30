#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/c9a1bc7aa8b2407decf074636d7558fd1eb6fab28becd7c2fc3e6974e2b8f460/contract';
import startContract from '../../snapshots/c9a1bc7aa8b2407decf074636d7558fd1eb6fab28becd7c2fc3e6974e2b8f460/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f36e8fc3d6022c2947beda86743243cdb98d01d782d7f1a5b82b17337eec9325/contract';
import endContract from '../../snapshots/f36e8fc3d6022c2947beda86743243cdb98d01d782d7f1a5b82b17337eec9325/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('passwordHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'User',
        column: col('role', 'text', {
          notNull: true,
          default: lit('customer'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
