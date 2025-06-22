/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import Reacti, { useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
	ScrollView,
	StatusBar,
	StyleSheet,
	Text,
	useColorScheme,
	View,
	TouchableOpacity,
} from 'react-native';

import {
	Colors,
	DebugInstructions,
	Header,
	LearnMoreLinks,
	ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import HomeScreen from './components/screens/HomeScreen';
import ChatScreen from './components/screens/ChatScreen';

type SectionProps = PropsWithChildren<{
	title: string;
}>;

function App(): React.JSX.Element {
	const [isHome, setIsHome] = useState(true);
	const [scanScreenActivated, setScanScreenActivated] = useState(true);

	function navigateChat() {
		setIsHome(!isHome);
	}

	const screen = () => {
		if(isHome) {
			return (<HomeScreen navigateChat={navigateChat} />);
		}
		else {
			return (<ChatScreen />);
		}
	}

	return (
		<View style={styles.screensContainer}>
			{screen()}
		</View>
	);
}

const styles = StyleSheet.create({
	screensContainer: {
		flex: 1,
	},
	sectionContainer: {
		marginTop: 32,
		paddingHorizontal: 24,
	},
	sectionTitle: {
		fontSize: 24,
		fontWeight: '600',
	},
	sectionDescription: {
		marginTop: 8,
		fontSize: 18,
		fontWeight: '400',
	},
	highlight: {
		fontWeight: '700',
	},
});

export default App;
