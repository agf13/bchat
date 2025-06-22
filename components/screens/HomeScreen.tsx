import React, { useState } from 'react';
import {
	View,
	Text,
	TouchableOpacity,
	TextInput,
	StyleSheet,
	ScrollView,
} from 'react-native';
import { MessageModel } from '../../logic/models/MessageModel';
import MessageRepo from '../../logic/repositories/MessageRepo';
import MessageDto from '../../logic/models/MessageDto';
import ChatScreen from './ChatScreen';

const HomeScreen = ({navigateChat}) => {
	const [value, setValue] = useState(0);
	const [dlist, setDlist] = useState([]);
	const messageRepo = new MessageRepo();

	const multipleItems = () => {
		let finalItems = [];
		dlist.map((item, index) => {
			const newItem = (<Text key={index.toString()}>{item}</Text>);
			finalItems.push(newItem);
		});
		return finalItems;
	}

	return (
		<View style={styles.container} >
			<Text style={styles.title}>{"HOME PAGE"}</Text>
			<View style={styles.spacerVertical2} />
			<Text style={styles.important}>{"CHOOSE ROOM"}</Text>
			<View style={styles.spacerVertical} />
			<TextInput
				style={styles.textInput}
				placeholder={"Choose a number"}
				value={value}
				onChangeText={setValue}
			/>
			<Text>{"Choose a number between 1 and 65535"}</Text>
			<Text>{"This number is like choosing a channel"}</Text>
			<Text>{"Everyone sees the messages from all channels"}</Text>
			<View style={styles.spacerVertical} />
			<TouchableOpacity
				style={styles.startButton}
				onPress={()=>{
					let newList = [];
					newList.push(value);
					setDlist(newList);
					navigateChat();
				}}
			>
				<Text>{"Start"}</Text>
			</TouchableOpacity>
			<View style={styles.spacerVertical} />
			<ScrollView>
				{(multipleItems())}
			</ScrollView>

			<TouchableOpacity style={styles.startButton} onPress={async ()=>{
					try{
						let m = new MessageDto();
						m.room = 1;
						m.message = "abc";
						m.encoding = 1;
						m.messagePart = 2;
						messageRepo.insert(m);
					} catch (e) {
						console.log("Error: " + e.message);
					}
			}}>
				<Text>{"add data"}</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.startButton} onPress={async ()=>{
				try{
					let result: MessageDto[] = await messageRepo.getAll();		
					result.forEach((r) => {console.log(r.toString());});
				} catch (e) {
					console.log("Error: " + e.meesage);
				}
			}}>
				<Text>{"get date"}</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.startButton} onPress={async ()=>{
				try{
					messageRepo.deleteAll();
				} catch (e) {
					console.log("Error: " + e.meesage);
				}
			}}>
				<Text>{"Delete all messages"}</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	spacerVertical: {
		height: 20,
	},
	spacerVertical2: {
		height: 100,
	},
	container: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		fontSize: 24,
		alignItems: 'center',
	},
	important: {
		fontSize: 16,
		alignItems: 'center',
	},
	textInput: {
		padding: 10,
		borderWidth: 1,
		borderColor: 'black',
		width: "50%",
	},
	startButton: {
		padding: 10,
		borderWidth: 1,
		borderColor: 'black',
		borderRadius: 10,
	}
});

export default HomeScreen;
