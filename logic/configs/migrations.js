import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const myMigrations = schemaMigrations({
	migrations: [
		{
			toVersion: 2, // this migration is to go from version 1 to version 2
			steps: [
				addColumns({
					table: 'messages',
					columns: [
						{ name: 'mId', type: 'number' },
						{ name: 'extra', type: 'number' },
						{ name: 'ttl', type: 'number' },
					],
				}),
			],
		}
	]
});
