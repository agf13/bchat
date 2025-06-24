package com.bchat; // replace your-apps-package-name with your app’s package name
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.util.Log;
import android.os.Handler;
import android.os.Looper;

public class BluetoothModule extends ReactContextBaseJavaModule {
	Handler handler = new Handler(Looper.getMainLooper());
	int interval = 200;
	int index = 0;
	List<byte[]> messageList = new ArrayList<>();
	int maxMessages = 1000;
	int cycleIndex = -1; // starting from -1 so that when the messages are building to fill up the list, when the list is full cycleIndex should point at the last element (size - 1)
	BluetoothLeAdvertiser advertiser = BluetoothAdapter.getDefaultAdapter().getBluetoothLeAdvertiser();

	BluetoothModule(ReactApplicationContext context) {
		super(context);
	}

	@Override
	public String getName() {
		System.out.println("--- from java");
		return "BluetoothModule";
	}

	@ReactMethod
	public String printMessage(String msg) {
		Log.e("Is this working?", "hmmmmm?");
		return msg;
	}

	/*
		def:	This function builds the cyclic list used to send messages
	*/
	@ReactMethod
	public void addMessage(String msg) {
		byte[] messageBytes = convertNumberStringToBytes(msg);
		int messageListSize = messageList.size();

		if(messageListSize >= maxMessages) {
			cycleIndex = (cycleIndex + 1) % messageListSize;
			messageList.set(cycleIndex, messageBytes);
		}
		else {
			cycleIndex++;
			messageList.add(messageBytes);
		}
	}

	AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
		@Override
		public void onStartSuccess(AdvertiseSettings settingsInEffect) {
			handler.postDelayed(() -> advertiser.stopAdvertising(this), 100); // time for only a couple of packets with the same message in a row
		}
	};

	/*
		def:
	*/
	Runnable broadcastRunnable = new Runnable() {
		@Override
		public void run() {
			if(messageList.size() == 0) return;

			byte[] message = messageList.get(index);
			index = (index + 1) % messageList.size();

			BluetoothAdapter.getDefaultAdapter().setName("f");

			AdvertiseData advertiseData = new AdvertiseData.Builder()
				.addManufacturerData(0x1F3B, message)
				.setIncludeDeviceName(true)
				.build();
			
			AdvertiseSettings settings = new AdvertiseSettings.Builder()
				.setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
				.setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
				.setConnectable(false)
				.build();

			advertiser.startAdvertising(settings, advertiseData, advertiseCallback);

			handler.postDelayed(this, 10); // wait 0.01s before next execution
		}
	};

	/*
		def: returns the message stored at the given index
	*/
	@ReactMethod
	public String getMessage(int index) {
		index = index % messageList.size();
		byte[] messageBytes =  messageList.get(index);
		return convertBytesToNumberString(messageBytes);
	}

	/*
		def:	Converts a given string with space separated numbers into a byte array
				The string only contains 8bit numbers!
	*/
	public byte[] convertNumberStringToBytes(String str) {
		String[] parts = str.trim().split("\\s+");
		byte[] bytes = new byte[parts.length];
		for(int i=0; i < parts.length; i++) {
			bytes[i] = (byte) Integer.parseInt(parts[i]);
		}

		return bytes;
	}

	/*
		def:	Converts back the bytes array to a space separated string of numbers
	*/
	public String convertBytesToNumberString(byte[] bytes) {
		String result = "";
		int current;
		for(int i=0; i < bytes.length; i++) {
			current = bytes[i] & 0xFF;
			if(i < bytes.length - 1) {
				result += String.valueOf(current) + " ";
			}
			else {
				result += String.valueOf(current);
			}
		}

		return result;
	}

	/*
		def:	define a funciton to start broadcastign messages
	*/
	@ReactMethod
	public void runBroadcast() {
		handler.post(broadcastRunnable);
	}

	@ReactMethod
	public void stopBroadcast() {
		handler.removeCallbacks(broadcastRunnable);
		advertiser.stopAdvertising(advertiseCallback);
	}


	
	/*
		def:	sends the string as a manufacturer data. The string is only numbers separated by space. Numbers are from 0 to 255 (8bit values).
				Those values are converted to bytes and send as part of the bluetooth packet
	*/
	/*
	@ReactMethod
	public void startBluetoothAdvertising(String msg) {
	    BluetoothAdapter bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

	    if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
	        Log.e("BLE", "Bluetooth is not enabled.");
	        return;
	    }

	    if (advertiser == null) {
	        Log.e("BLE", "BLE advertising not supported.");
	        return;
	    }

		// Convert string msg
		String[] parts = msg.split(" ");
		byte[] bytes = new byte[parts.length];
		for(int i=0; i < parts.length; i++) {
			int value = Integer.parseInt(parts[i]);
			bytes[i] = (byte) value;
		}
		Log.d("BLE", "Bytes before sending: " + bytes);
		Log.d("BLE", "Size sent: " + String.valueOf(bytes.length));
		BluetoothAdapter.getDefaultAdapter().setName("f"); // force change name to minimize necessary data to be sent

		// Make the remaining necesarry settings
	    AdvertiseSettings settings = new AdvertiseSettings.Builder()
	            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
    	        .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
	            .setConnectable(true)
	            .build();

	    AdvertiseData data = new AdvertiseData.Builder()
				//.addManufacturerData(0x1234, "HelloWorld".getBytes())
				.addManufacturerData(0x1234, bytes)
    	        .setIncludeDeviceName(true) // includes phone name
        	    .build();

	    advertiser.startAdvertising(settings, data, new AdvertiseCallback() {
    	    @Override
        	public void onStartSuccess(AdvertiseSettings settingsInEffect) {
	            Log.d("BLE", "Advertising started successfully");
    	    }

	        @Override
    	    public void onStartFailure(int errorCode) {
        	    Log.e("BLE", "Advertising failed: " + errorCode);
	        }
    	});
	}
	*/

	@ReactMethod
	public String loopback(String msg) {
		return msg;
	}
}
