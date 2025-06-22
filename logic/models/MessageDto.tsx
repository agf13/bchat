import { Buffer } from 'buffer';

class MessageDto {
	public id: string 				// 2 bytes
	public room: number				// 2 bytes
	public message: string			// ? bytes
	public encoding: number			// 2 bits (will actually hold as much as a number but only from 0 to 3). Encoding 0 uses all bits, so this is no encoding. Encoding 1 and 2 use 6 bits. Encoding 3 uses 5 bits
	public messagePart: number		// 2 bits (will actually hold as much as a number but only from 0 to 3)
	public extra: number			// (v2) 4 bits (as flags, each of the 4 bits will be a 0 or 1 determining what is activated: 1st bit -> custom encoding, 2nd bit -> ?, 3rd bit -> ?, 4rd bit -> ?)
	public ttl: number				// (v2) 10 bits (will actually hold as much as a number but only from 0 to 1023)
	public mId: string				// (v2) 2 bytes (to hold a unique value for the message while it's send across the network)
	public decodingLevel1: string
	public decodingLevel2: string
	public decodingLevel3: string
	

	constructor() {
		this.id = ""
		this.room = 0
		this.message = ""
		this.encoding = 0
		this.messagePart = 0
		this.extra = 0 // 4 bit balue
		this.ttl = 1023 // maximum we allow
		this.mId = 0
		this.encodingLevel1 = new Map();
		this.encodingLevel2 = new Map();
		this.encodingLevel3 = new Map();
		this.initDefaultEncodings();
		this.bitsForMessage = 114;
	}

	toString(): string {
		try {
			let output = ""
			output += "id: " + this.id;
			output += "; room: " + this.room;
			output += "; message: " + this.message;
			output += "; encoding:" + this.encoding;
			output += "; messagePart: " + this.messagePart;
			output += "; extra: " + this.extra;
			output += "; ttl: " + this.ttl;
			output += "; mId: " + this.mId;
			return output
		}
		catch (e) {
			console.log("Error at MessageDto::toString: " + e.message);
		}
	}

	initDefaultEncodings() {
		this.decodingLevel1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01234567890 .";
		this.decodingLevel2 = "abcdefghijklmnopqrstuvwxyz01234567890 .";
		this.decodingLevel3 = "abcdefghijklmnopqrstuvwxyz .";

		for(let i = 0; i < this.decodingLevel1.length; i++) {
			this.encodingLevel1.set(this.decodingLevel1[i], i);
		}
		for(let i = 0; i < this.decodingLevel2.length; i++) {
			this.encodingLevel2.set(this.decodingLevel2[i], i);
		}
		for(let i = 0; i < this.decodingLevel3.length; i++) {
			this.encodingLevel3.set(this.decodingLevel3[i], i);
		}
	}

	/*
		def:	Encode the message part using a default encoding level from 0 to 4
		in:		level - number // from 0 to 3
		out:	string // the result of the encoding
	*/
	defaultEncode(): string {
		try {
			let bits = [];
			let maxChars = 0; // since on bluetooth broadcast maximum is 31 bytes per packet and 3 might be reserved for flags => 28 bytes remainiang. Usual chars are encoded on 1 byte, emojis on up to 3 bytes
			const level = this.encoding;

			// Make sure the encoding is a valid value
			if(level < 0 || level > 3) {
				return undefined;
			}

			// Set encoding to be used
			let encodingRule = {}
			if(level === 0) {	// At level 0 we encode with TextEncoder as it's easier for the usual encoding used for Ascii and Emojis on 1 and up to 4 bytes
				//const encodedMessage = this.message.toString(2);
				//return encodedMessage;
				return "";
			}
			else if(level === 1) {
				encodingRule = this.encodingLevel1;
				maxChars = parseInt(this.bitsForMessage / 6); // our 6 bit encoding. On 122 bits we can handle 122/6 = 20 chars
			}
			else if(level === 2) {
				encodingRule = this.encodingLevel2;
				maxChars = parseInt(this.bitsForMessage / 6); // our 6 bit encoding. On 122 bits we can handle 122/6 = 20 chars
			}
			else if(level === 3) {
				encodingRule = this.encodingLevel3;
				maxChars = parseInt(this.bitsForMessage / 5); // our 5 bit enoding. On 122 bits we can handle 122/5 = 24 chars
			}
			else {
				encodingRule = this.encodingLevel1;
				maxChars = parseInt(this.bitsForMessage / 6);
			}

			// Encode the message string using the chosen encoding level
			for(let i=0; i < this.message.length && i < maxChars; i++) {
				const currentChar = this.message[i];
				const currentCharEncoding = encodingRule.get(currentChar);

				if(currentCharEncoding !== undefined) {
					let encodedChar = "";
					if(level === 1 || level === 2) {	// Levels 1 and 2 use an encoding on 6 bits
						encodedChar = currentCharEncoding.toString(2).padStart(6, '0');
					}
					else if(level === 3) {				// Level 3 uses an encoding on 5 bits
						 encodedChar = currentCharEncoding.toString(2).padStart(5, '0');
					}
					bits.push(encodedChar);
				}
			}

			const bitString = bits.join('');
			return bitString;
		}
		catch (e) {
			console.log("Error in MessageDto:defaultEncode: " + e.message);
		}
	}

	/*
		def: 	Decode the message using the same level of default encoding used when encoding
		in: 	level - number // the level of encoding we believe the message was encoded with (from 0 to 3)
				encodedString - string // the string representing the encoded value
		out:	string // the original text
	*/
	defaultDecode(level: number, encodedString: string): string {
		try{
			let message = "";
			let decodeLength = 0;
			let numbers = [];

			// Check that the decoding is in the range of known levels
			if(level < 0 || level > 3) {
				return null;
			}

			// Set the decode rule
			let decodeRule = ""
			if(level === 0) {			// At level 0 we decode using the TextDecoder since we don't know how to handle emojis
				return ""
			}
			else if(level === 1) { 		// Level 1 uses a 6 bit encoding
				decodeRule = this.decodingLevel1;
				decodeLength = this.decodingLevel1.length;
				numbers = encodedString.match(/.{6}/g).map(bin => parseInt(bin, 2));
			}
			else if(level === 2) {	// Level 2 uses a 6 bit encoding
				decodeRule = this.decodingLevel2;
				decodeLength = this.decodingLevel2.length;
				numbers = encodedString.match(/.{6}/g).map(bin => parseInt(bin, 2));
			}
			else if(level === 3) {	// Level 3 uses a 5 bit encoding
				decodeRule = this.decodingLevel3;
				decodeLength = this.decodingLevel3.length;
				numbers = encodedString.match(/.{5}/g).map(bin => parseInt(bin, 2));
			}
			else {
				decodeRule = this.decodingLevel1;
				decodeLength = this.decodingLevel1.length;
				numbers = encodedString.match(/.{6}/g).map(bin => parseInt(bin, 2));
			}

			// Do the actual decoding
			for(let i = 0; i < numbers.length; i++) {
				if(numbers[i] < decodeLength) {
					message += decodeRule[numbers[i]];
				}
			}

			return message;
		}
		catch (e) {
			console.log("Error at MessageDto::defaultDecode: " + e.message)
		}
	}

	toBroadcastString(): string {
		let result = Buffer.from(this.message, 'utf-8').toString('base64');
		return result;
	}

	fromBroadcastString(broadcastString: string): string {
		let result = Buffer.from(broadcastString, "base64").toString('utf-8');
		return result;
	}

	/*
		def:	this function is supposed to convert the transferable data from the message model to a string in base2 representing our custom encoding
	*/
	toBitRepresentation(): string {
		let base2String = "";
		// base2String += "0001111100111011" // MAgic number 1F3B. This is assigned on the native side (android or ios) so it's no longer assigned from here
		base2String += this.mId.toString(2).padStart(16, '0');
		console.log("mid when sending: ", base2String);
		console.log("mid ass number: ", this.mId);
		base2String += this.messagePart.toString(2).padStart(4, '0');
		base2String += this.room.toString(2).padStart(16, '0');
		base2String += this.encoding.toString(2).padStart(2, '0');
		base2String += this.ttl.toString(2).padStart(10,'0');
		base2String += this.extra.toString(2).padStart(6, '0');
		base2String += this.defaultEncode(this.encoding).padEnd(this.bitsForMessage, '0');

		// No longer available !// 16+(16+4)+(16+2)+(10+6)+154 = 16+(20+18)+(16+154) = 16+(38+170) = 16+208 = 224 (28 bytes = 31 bytes - 3 bytes reserved for flags). Remove 1 more byte because we need at least a letter for device name
		// Our total size is 21 btes that we can use. Because in those 31 bytes, 3 are needed for a 1 letter name for the device (scan is ignored without this sometimes) and 4 bytes for the flags. Since 31-7=24 usable

		return base2String;
	}

	fromBitRepresentation(stringValue: string): string {
		const magicNumberStr = stringValue.slice(0, 16); // this should be 1F3B. But it is send in different order from android side so probably form ios is the same. So we would check to be equal with 3B1F instead.
		if(magicNumberStr !== "0011101100011111") { // this is checking against 3B1F because when the id of manufacturer data is set with 1F3B it will actually send 3B1F (the order is probably from endianess)
			console.log("magic number mismatch");
			return undefined;
		}

		/*
		if(stringValue.length != 136) { // Not a representation we support
			console.log("length differs. Ours: " + stringValue.length + ", expected: 136");
			return undefined;
		}
		*/


		const mIdStr = stringValue.slice(16, 32);
		const messagePartStr = stringValue.slice(32, 36);
		const roomStr = stringValue.slice(36, 52);
		const encodingStr = stringValue.slice(52, 54);
		const ttlStr = stringValue.slice(54, 64);
		const extraStr = stringValue.slice(64, 70);
		const messageStr = stringValue.slice(70);

		const mId = parseInt(mIdStr, 2);
		const messagePart = parseInt(messagePartStr, 2);
		const room = parseInt(roomStr, 2);
		const encoding = parseInt(encodingStr, 2);
		const ttl = parseInt(ttlStr, 2);
		const extra = parseInt(extraStr, 2);

		const message = this.defaultDecode(encoding, messageStr);
		console.log("mid value:", mId);

		this.mId = mId;
		this.messagePart = messagePart;
		this.room = room;
		this.encoding = encoding;
		this.ttl = ttl;
		this.extra = extra;
		this.message = message;

		return message;
	}

	bitStringToNumber8String(stringValue: string): string {
		/*	// Disabling length check. This should make updating to using a newer verison of bluetooth which accepts more data in packets more easier
		if(stringValue.length != 136) {
			console.log("MessageDto::bitStringToNumber8String: length mismatch. Received", stringValue.length, ", expected: 136");
			return undefined;
		}
		*/
		const stringLength = stringValue.length;

		let output = "";
		for(let i=0; i < stringLength; i+=8) {
			let currentNumber = parseInt(stringValue.slice(i, i+8), 2);
			output+=currentNumber.toString();
			if(i <= stringLength - 8) { // if it's not the last character, then append a space
				output += " ";
			}
		}

		return output;
	}

	number8StringToBitString(stringValue: string): string {
		// the reverse operation from taking 8 by 8 bits and convertgin to nubers. Now we take numbers and convert to 8 bits
		try {
			let numbersStr = stringValue.split(" ");
			let bitString = "";
			let current = 0;
			for(let i=0; i < numbersStr.length; i++) {
				current = numbersStr[i];
				if(current != "") {
					bitString += (parseInt(current)).toString(2).padStart(8, "0");
				}  
			}
			
			return bitString;
		}
		catch (e) {
			console.log("Error at MessageDto::number8StringToBitString:", e.message);
		}
	}
}

export default MessageDto;
