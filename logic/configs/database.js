import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import MessageModel from '../models/MessageModel';
import { mySchema } from './schema';
import { myMigrations } from './migrations';


const adapter = new SQLiteAdapter({
	schema: mySchema,
	myMigrations,
});

const database = new Database({
	adapter,
	modelClasses: [MessageModel],
})

export default database
