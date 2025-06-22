import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class MessageModel extends Model {
	static table = 'messages';

	/*
	get id() {
		return this._getRaw('id');
	}
	get room() {
		return this._getRaw('room');
	}
	get message() {
		return this._getRaw('message');
	}
	get encoding() {
		return this._getRaw('encoding');
	}
	get messagePart() {
		return this._getRaw('messagePart');
	}
	*/

	//@field('room') number;

	//@field('message') string;

	// Specifies if the encoding type is 0 - normal, 1 - shortend, 2 - limited, 3 - minimal
	// 0 - every existing ascii char (unmodified encoding)
	// 1 - only A-Z a-z 0-9 space dot (6 bit encoding)
	// 2 - a-z and 0-9 and some other symbols (6 bit encoding)
	// 3 - a-z and some other symbols (5 bit encoding)
	//@field('encoding') number;

	//@field('messagePart') number;
}
