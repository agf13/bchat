import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { NativeModules } from 'react-native';

import MessageDto from '../../logic/models/MessageDto';
import MessageRepo from '../../logic/repositories/MessageRepo';
const { BluetoothModule } = NativeModules;

class MyBluetoothManager {
	manager: BleManager;
	repo: MessageRepo;
	onNewMessage: ()=>{};

	constructor(onNewMessage) {
		this.manager = new BleManager();
		this.repo = new MessageRepo();
		console.log("Is this defined?", onNewMessage);
		this.reload = onNewMessage;
	}

	async startScan() {
		this.manager.startDeviceScan(null, null, async (error, device) => {
			if(error) {
				console.log(error);
				return;
			}
		
			const manufacturerData = device.manufacturerData;
			if(manufacturerData) {								
				const buffer = Buffer.from(manufacturerData, 'base64');
				const bytes = Array.from(buffer).map(b => b.toString(2).padStart(8, '0')).join('');
				//const actualBytes = bytes.slice(16); //no longer skip // skip first 16 bits because they are the flags added from android side. Currently they are not used for nothing so might think of changing this in the future
				
				try {
					let msg = new MessageDto();		// init a new instance of MessageDto
					//let result = msg.fromBitRepresentation(actualBytes);
					let result = msg.fromBitRepresentation(bytes);	// decode the bytes. If they are successfully decoded, then in result we will have the messag and msg will contain all details
					if(result !== undefined) { // if the result really has a value ( = decoded successfully)
						console.log(msg); // log the message 
						let isId = await this.repo.isId(msg.mId); // check if the message is in our db
						console.log("is isId defined: ", isId); // log whether the message is in the db or not
						if(isId === false) { // if it is not in our db
							this.repo.insert(msg); // add to our db then prepare to start broadcasting it because it might be a new messagee
							const bitRep = msg.toBitRepresentation(); // convert to bit representation
							const numbers = msg.bitStringToNumber8String(bitRep); // convert to 8 bit number to be easily usable by the android/ios side
							//this.onNewMessage();
							this.reload();

							BluetoothModule.addMessage(numbers); // add the message to the broadcast list. If the broadcast is started, the message will eventually be sent
						}
						else {
							console.log("In theory, if we are here then we do"); // If we print this, it means the message was part of our db, so we don't want to broadcast it
						}
					}
				}
				catch(e) {
					console.log("Error:", e);
				}

				/*
				const bytes = atob(manufacturerData);
				let dataAsBits = [...bytes].map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('');
				dataAsBits = dataAsBits.slice(16);
				console.log("bytes as bits:", dataAsBits);
				let msg = new MessageDto();
				msg.fromBitRepresentation(dataAsBits);
				console.log(msg);
				*/
				
				//let numbers = this.convertToNumbers(buffer);
				//if(numbers != undefined) { console.log("Decoded numbers:", numbers) };
			}
		});
	}

	stopScan() {
		this.manager.stopDeviceScan();
		console.log("Scan stopped");
	}

	decode(buff) {
		console.log("... decoding");
		buff = buff.toString('binary');
		console.log("buff: ", buff);
		buff = buff.slice(16); // ignore first 16 bits because they represent the value of 0x1234

		let msg = new MessageDto();
		msg.fromBitRepresentation(buff);
		console.log("soooo, so far?");
	}

	convertToNumbers(buff) {
		buff = buff.toString("hex")
		let newNum = "";
		let newNum10 = 0;

		let result = []

		console.log("converting: ", buff);
		for(let i=0; i < buff.length; i++) {
			newNum += this.convertBase16ToBase2(buff[i]);
			if(i%2==1) {
				newNum10 = parseInt(newNum, 2);
				result.push(newNum10);
				newNum = "";
			}
			if((i==1 && newNum10 != 52) || (i==3 && newNum10 != 18)) {
				console.log("Problem at i:",i,"current number:",newNum10);
				return undefined;
			}
			if((i==5 && newNum10 != 31) || (i==7 && newNum10 != 59)) {
				console.log("Problem at i:",i,"current number:", newNum10);
				return undefined;
			}
		}

		console.log("Decoded numbers: ", result);
		return result;
	}

	convertBase16ToBase2(sym) {
		let convDict = {"0": "0000", "1": "0001", "2": "0010", "3": "0011", "4": "0100", "5":"0101", "6": "0110", "7": "0111", "8": "1000",
			"9": "1001", "a": "1010", "b": "1011", "c": "1100", "d": "1101", "e": "1110", "f": "1111"};
		return convDict[sym];
	}
}

export default MyBluetoothManager;
