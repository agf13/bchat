import MessageModel from '../models/MessageModel';
import MessageDto from '../models/MessageDto';
import database from '../configs/database';

import { Q } from '@nozbe/watermelondb';

class MessageRepo {
	private messageDb;

	constructor() {
		this.messageDb = database.collections.get('messages')
	}

	async insert(adapter: MessageDto) {
		try{
			await database.write(async () => {
				await this.messageDb.create(msg => {
					// msg._raw.id does not need to be set by us because this is handled by the database when this insert is done
					msg._raw.room = adapter.room;
					msg._raw.message = adapter.message;
					msg._raw.encoding = adapter.encoding;
					msg._raw.messagePart = adapter.messagePart;
					msg._raw.mId = adapter.mId;		// (added in schema v2)
					msg._raw.extra = adapter.extra;	// (added in schema v2)
					msg._raw.ttl = adapter.ttl;		// (added in schema v2)
				});
			});
		}
		catch (e) {
			console.log("Error in MessageRepo::insert: " + e.message);
		}
	}

	async unsafeDelete() {
		console.log("!!! MessageRepo::unsafeDelete: the code from here is commented such that the table is not mistakenly deleted");
	//	await database.get('messages').destroyPermanently();
	}

	async getAll(): MessageDto[] {
		try {
			let result: MessageDto[] = [];
			const messages = await this.messageDb.query().fetch();

			messages.forEach((msg) => {
				let adapter = new MessageDto();
				adapter.id = msg._raw.id;		// we take the id set automatically by the database since we might want to use it for delete/edit operations
				adapter.room = msg._raw.room;
				adapter.message = msg._raw.message;
				adapter.encoding = msg._raw.encoding;
				adapter.messagePart = msg._raw.messagePart;
				adapter.mId = msg._raw.mId; 	// (added in schema v2)
				adapter.extra = msg._raw.extra; // (added in schema v2)
				adapter.ttl = msg._raw.ttl; 	// (added in schema v2)

				result.push(adapter);
			});

			return result;
		}
		catch (e) {
			console.log("Error in MessageRepo::getAll: " + e.message);
		}
	}

	async isId(mIdValue): boolean {
		try {
			let items = await database.get('messages').query(Q.where('mId', mIdValue)).fetch();
			console.log("Do we have items with this id in db: ", items.length);
			return items.length > 0;
		}
		catch (e) {
			console.log("Error in MessageRepo::isId");
		}
	}

	async getById(id: string): MessageDto {
		try {
			let messageModel = await this.messageDb.fing(id);

			let adapter: MessageDto = new MessageDto();
			adapter.id = messageModel._raw.id;
			adapter.room = messageModel._raw.room;
			adapter.message = messageModel._raw.message;
			adapter.encoding = messageModel._raw.encoding;
			adapter.messagePart = messageModel._raw.messagePart;
			console.log("Adapter is: " + adapter.toString());

			return adapter;
		}
		catch (e) {
			console.log("Error in MessageRepo::getById: " + e.message);
		}
	}

	async delete(id: string) {
		try {
			let messageModel = await this.messageDb.find(id);
			await database.write(async () => {
				await messageModel.destroyPermanently();
			});
		}
		catch (e) {
			console.log("Error is MessageRepo::delete: " + e.message);
		}
	}

	async deleteAll() {
		try {
			const messages = await this.messageDb.query().fetch();

			await database.write(async () => {
				messages.forEach((msg) => {
					msg.destroyPermanently();
				});
			});
		}
		catch (e) {
			console.log("Error is MessageRepo::delete: " + e.message);
		}
	}
}

export default MessageRepo;
