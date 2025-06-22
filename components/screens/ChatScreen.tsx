import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	TextInput,
	StyleSheet,
	ScrollView,
	KeyboardAvoidingView,
	NativeModules,
} from 'react-native';

import { MessageModel } from '../../logic/models/MessageModel';
import MessageRepo from '../../logic/repositories/MessageRepo';
import MessageDto from '../../logic/models/MessageDto';
import MyBluetoothManager from './ScanBluetoothScreen';

const { BluetoothModule } = NativeModules;

const ChatScreen = ({room}) => {
	const [messageList, setMessageList] = useState([]);
	const [message, setMessage] = useState("");
	let messageRepo = new MessageRepo();

	// Make sure to load the list of messages on first render of the screen
	useEffect(() => {
		console.log("Loading messages");
		reloadMessages();
	}, []);

	async function reloadMessages() {
		console.log("Ok... maybe eloading");
		let allMessages = await messageRepo.getAll();
		setMessageList(allMessages);
	}
	
	const allMessages = () => {
		let showItems = [];
		if(messageList === undefined || messageList === []) {
				console.log("Message list is either null or empty");
				return;
		}
		else {
			console.log("all messages: " + messageList.length);
		
			messageList.map((item, index) => {
				const newItem = (<Text key={index.toString()} style={styles.message}>{item.toString()}</Text>);
				showItems.push(newItem);
			});

			return showItems;
		}
	}

	function sendMessage() {
		try {
			let messageAdapter = new MessageDto();
			messageAdapter.message = message;
			setMessage("");

			messageRepo.insert(messageAdapter);
			reloadMessages();
		}
		catch (e) {
			console.log("Error: " + e.message);
		}
	}

	return (
		<View style={styles.container}>
			{/* The view for all the messages */}
			<ScrollView style={styles.viewList}>
				{(allMessages())}
			</ScrollView>
			{/* The view for the keyboard */}
			<KeyboardAvoidingView style={styles.inputSide}>
				<TextInput
					style={styles.textInput}
					value={message}
					onChangeText={setMessage}
					multiline
					numberOfLines={3}
					textAlignVertical="top"
				/>

				<TouchableOpacity
					style={styles.sendButton}
					onPress={()=>{
						reloadMessages();
					}}
				>
					<Text>{"Show messages"}</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.sendButton}
					onPress={()=>{
						try {
							BluetoothModule.runBroadcast();
							console.log("Broadcasted started");
						}
						catch(e) {
							console.log("Error:", e);
						}
					}}
				>
					<Text>{"start broadcast"}</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.sendButton}
					onPress={()=>{
						try {
							//let myClass = new MyBluetoothManager();
							//myClass.startScan();

							let dto = new MessageDto();

							const mId = Math.floor(Math.random() * 65536);
							console.log("random: ", mId);
        	                dto.mId = mId;
							console.log("setting mid to:", dto.mId);
    	                    dto.messagePart = 0;
	                        dto.room = 1;
                        	dto.encoding = 1;
                    	    dto.ttl = 1023;
                	        dto.extra = 0;
            	            dto.message = message;

							let toSend = dto.toBitRepresentation();
							console.log("bit rep:", toSend);
							let numberString = dto.bitStringToNumber8String(toSend);
							console.log("number string:", numberString);

							BluetoothModule.addMessage(numberString);
						}
						catch (e) {
							console.log("Error: ", e);
						}
					}}
				>
					<Text>{"add message"}</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.sendButton}
					onPress={async ()=>{
						try{
							let myClass = new MyBluetoothManager(reloadMessages);
							myClass.startScan();
						}
						catch (e) {
							console.log("error: ", e);
						}
					}}
				>
					<Text>{"Start scanning"}</Text>
				</TouchableOpacity>
			</KeyboardAvoidingView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		flex: 1,
	},
	viewList: {
		flex: 1,
	},
	inputSide: {
		height: 70,
		justifyContent: 'center',
		flexDirection: 'row',
	},
	message: {
		padding: 5,
	},
	textInput: {
		borderColor: 'black',
		borderWidth: 1,
		flex: 8,
	},
	sendButton: {
		justifyContent: 'center',
		padding: 10,
		flex: 2,
		borderColor: 'black',
		borderWidth: 1,
		marginLeft: 5,
		marginRight: 0,
	},
});

export default ChatScreen;
