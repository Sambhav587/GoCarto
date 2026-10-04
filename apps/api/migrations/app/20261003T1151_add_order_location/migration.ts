#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/e39e1d7f1a6e3740fd3cedf4dea6e33606e2fd6dd84866dc1f1aac0d56d9f2b7/contract';
import endContract from '../../snapshots/e39e1d7f1a6e3740fd3cedf4dea6e33606e2fd6dd84866dc1f1aac0d56d9f2b7/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f36e8fc3d6022c2947beda86743243cdb98d01d782d7f1a5b82b17337eec9325/contract';
import startContract from '../../snapshots/f36e8fc3d6022c2947beda86743243cdb98d01d782d7f1a5b82b17337eec9325/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Order',
        column: col('latitude', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Order',
        column: col('longitude', 'float8', { codecRef: { codecId: 'pg/float8@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
