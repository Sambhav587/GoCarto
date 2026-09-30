#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/38b9d0a2d6fd790a9319466cb09ef6cacb2486140a6529d4cf0d11da22d483be/contract';
import startContract from '../../snapshots/38b9d0a2d6fd790a9319466cb09ef6cacb2486140a6529d4cf0d11da22d483be/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f71e3391ae72799368fb68eeb0b5a769c9a65f5512e7d8674032e0b6d2251a93/contract';
import endContract from '../../snapshots/f71e3391ae72799368fb68eeb0b5a769c9a65f5512e7d8674032e0b6d2251a93/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Product',
        column: col('stockQuantity', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
