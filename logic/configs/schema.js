import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
	version: 2,
	tables: [
		tableSchema({
			name: 'messages',
			columns: [
				{ name: 'room', type: 'number' },			// from version 1
				{ name: 'message', type: 'string' },		// from version 1
				{ name: 'encoding', type: 'number' }, 		// from version 1
				{ name: 'messagePart', type: 'number' }, 	// from version 1
				{ name: 'mId', type: 'number' },	// added in version 2
				{ name: 'extra', type: 'number' }, 	// added in version 2
				{ name: 'ttl', type: 'number' }, 	// added in version 2
				// Need to learn how to make migrations or drop the schema and remake it to add the propery of timestamp
			],
		}),
	],
});
