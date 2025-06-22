# Bchat
### work in progress. Current implementation: 6 bit encoding
It is advised to read the entire "Running the app" before trying to follow the instructions.

## Introduction
This only works on Android. After fully finishing the implementation here, I will try getting an Apple laptop to make it availalbe for iOS as well.
As much as possible is implemented in react-native to minimize the platform specific implementation.
The only platform specific implementation is broadcasting data from the native side. Scanning for bluetooth packets and everything else is handled with react native.
A magic number is used to distinguish bluetooth packets from the app itself against other bluetooth communication around.

This is a react-native application for a chat working on mesh networking instead of the existing internet infrastructure.
Mesh networking is a way of allowing devices to communicate if enogh devices are in-betwee the sender and the receiver. The existing internet is bascially just a big mesh.
This application wants to provide a way for messaging without the need for the existing infrastructure. Though it will be challenging to get enough users for this to be usable, we tought this would make for a nice side-project.

The app does not encrypt, it just encodes.

## How it works
The application uses bluetooth for sending messages. It does not connect with nearby devices, but instead it broadcasts the data.
Broadcasting data means sending packets of data in all directions in case recipients are in range. IT DOES NOT CONNECT with devices to send data. Once a packet of data is received, it is checked against the device's database, and if the packet is new, the device will start broadcasting the packet as well. It will not stop broadcasting it untill either: 1) the application is closed, 2) bluetooth is closed, 3) a new message overwrites it.
We use a list of 1000 messages stored internally. The list is cyclic. When a new message is received or when a message is sent, is added to this list. While the broadcasting is open, the app cycles through the list and sends the messages one by one.

This implementation uses 31 bytes per bluetooth packet and maximum energy level for bluetooth to reach somewhere between 20-100 meters. The actual number of bytes available to send messages is lower, because in those 31 bytes we need to add metadata like timestamp, random id, decoding data and a couple other info which is necessary for the message to be interpreted.

Newer implementation of Bluetooth would accept up to about 250 bytes of data, but to be compatible with as many devices as possible we stick with the legacy implementation of 31 bytes.

## Challenges
To sent messages with only 31 bytes of data, we needed to make a custom encoding of characters to lower the space needed for encoding the message. That means some characters or symbols will not be available.
A character is usually encoded on 1 byte ( = 8 bits). So instead of using this we implemented a 6 bit encoding. We actually have 4 levels of encoding:
- clasic unchanged encoding (but allows for very few characters)
- 6 bit encoding
- 5 bit encoding (this is as small as we can go, since the alphabet used by us has 26 letters)
Currently only the 6 bit encoding is actually used, but implementation for the 5 bit one is already in place.

# Running the app
Bluetooth AND location needs to be enabled. There is some enforcement to skip the need of the location but it's not yet tested. The location is needed because receiving bluetooth data means the device IS IN RANGE, which is quite small and would imply disclosing the location. But since this is meant as a message app and messages might be broadcasted from a 100 devices away, in future it will be possible to disable this need. 
Location needs to be allowed manually from the app settings in the phone. No popup is yet implemented for that. Without the location permission and bluetooth + location enabled, scanning and broadcasting cannot be used.

I will explain how I run the app, since this is sometimes a tricky topic if installation is not done correctly.
I use npx version 10.9.2
I open a terminal window from the project directory (from it's root).
I connect the device to my PC and run from 2 separate terminal tabs: 
"npx react-native start"
then 
"npx react-native run-android". 
This only runs the app WHILE IT'S CONNECTED to the PC. To be able to run it after you disconnect it as well, you frist need to run:
npx react-native bundle --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --platform android --dev false --minify true --assets-dest android/app/src/main/res
The above command bundles the packages such that the app can be run without needing "npx react-native start".

### In progress
Currently, the UI is incredibly basic and only uses the 6 bits encoding. It has a home screen and a chat screen.
The chat screen displays all messages.
Once the chat screen is accessed, you need to manually click the "start scan" button to scan for messages.
You also need to add one message by writing something in the text box and clicking "add message".
AFTER ADDING A MESSAGE, click "start broadcast" -> this starts the cyclic list to send messages. If the list is empty and you click "start broadcasting" nothign will happen.
Noe click "start broadcasting".

All 3 steps are needed to be able to broadcast messages received. Otherwise you will only be able to receive messages, they will be added to the cyclic list, but will not be broadcasted. There needs to be at least a message in the cyclic list for the device to start broadcasting and act as a node in the network.

This is currently cumbersome, but it's a first implementation that is presentable.

# Presentation

Home screen. Here we can delete the existing messages and access the chat screen. Ignore the rest of the buttons so far
<img src="https://github.com/user-attachments/assets/ab789a99-bb42-44fb-8770-4672a8104658" height="700"/>

Chat screen. Here are the buttons to add messages (3rd one), start broadcasting (2nd once), start scanning (1st one).
<img src="https://github.com/user-attachments/assets/7410b942-2651-4388-990d-72c40f8286bd" height="700"/>

As you can see, currently all metadata is displayed with the message. The ttl (time to live) is not yet used. The maximum length of a message is displayed by the "A" letters. There is no "null character" or "string end character" to figure out where the message ends, so you will see the actual message padded with "A" letters at the end.
