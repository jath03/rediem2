import React, { useState, useEffect, useRef } from 'react'
import { Text, View, TouchableOpacity, NativeModules, NativeEventEmitter } from 'react-native'
import { jsonToCSV } from 'react-native-csv';
import Share from 'react-native-share';
import styles from './styles';
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
  ScanSettings
} from 'react-native-ble-manager';
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default function RecordDataScreen(props) {
    const [currentData, setCurrentData] = useState(new Array());
    const [recording, setRecording] = useState(false);
    let recordedData = useRef([]);

    useEffect(() => {
        const listeners = [
            bleManagerEmitter.addListener(
                'BleManagerDidUpdateValueForCharacteristic',
                handleUpdateValueForCharacteristic,
            ),
        ];

        return () => {
            console.debug('[app] main component unmounting. Removing listeners...');
            for (const listener of listeners) {
                listener.remove();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recording]);

    const toggleRecording = () => {
        if (!recording) {
            console.debug("Starting recording");
            recordedData.current = [];
        } else {
            console.debug("Stopping recording");
            console.debug("# of entries recorded: " + recordedData.current.length);
        }
        setRecording(recording => !recording);
    };

    const exportData = async () => {
        let data_str = jsonToCSV({
            fields: ["R1", "R2", "R3", "R4", "R5", "R6", "X", "Y", "Z", "EMG", "BIOZ"],
            data: recordedData.current
        });
        const prefix = 'data:text/csv;base64,';
        const data = prefix + btoa(data_str);
        
        try {
            await Share.open({
                title: 'Share CSV',
                url: data,
                saveToFiles: true,
                failOnCancel: false,
                type: 'text/csv'
            });
        } catch (error) {
            console.log('Error =>', error);
        }
    };

    let buffer = new ArrayBuffer(32);
    // Writing to the buffer using uint8's because that's what we receive from
    // data.value below in handleUpdateValueForCharacteristic
    let uint8_view = new Uint8Array(buffer);

    // Reading from the buffer, we want to see the int16 and float values that 
    // we sent from the arduino
    let int16_view = new Int16Array(buffer, 0, 6);
    let float_view = new Float32Array(buffer, 12, 5);

    let buffer_idx = 0;
    let buffer_state = 0;
    let offset = 0;
    const handleUpdateValueForCharacteristic = (
        data: BleManagerDidUpdateValueForCharacteristicEvent,
    ) => {
        // The data doesn't necessarily come all in one packet, so we have to
        // manage this buffer filling up ourselves
        switch (buffer_state) {
            case 0:
                if (data.value[0] != 0x12) {
                    break;
                }
                buffer_state = 1;
                if (data.length == 1) {
                    break;
                }
                buffer_idx = 1;
                offset = 1;
            case 1:
                if (data.value[buffer_idx] != 0x34) {
                    buffer_idx = 0;
                    break;
                }
                buffer_state = 2;
                if (data.length - buffer_idx <= 0) {
                    break;
                }
                offset += buffer_idx;
                buffer_idx = 0;
            case 2:
                for (let i = offset; i < data.value.length; i++) {
                    uint8_view[buffer_idx + i - offset] = data.value[i];
                }
                if (buffer_idx + data.value.length - offset >= 32) {
                    tmp_data = Array.from(int16_view).concat(Array.from(float_view));
                    for (let i = 0; i < tmp_data.length; i++) {
                        tmp_data[i] = tmp_data[i].toFixed(2);
                    }
                    setCurrentData(tmp_data);
                    if (recording) {
                        recordedData.current.push(tmp_data);
                    }
                    console.log("Received data: " + tmp_data);
                    buffer_idx = 0;
                    buffer_state = 0;
                } else {
                    buffer_idx += data.value.length - offset;
                }
                offset = 0;
        }
    };


    return (
        <View style={styles.container}>
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity style={styles.button} onPress={toggleRecording}>
                    <Text style={styles.buttonTitle}>
                        {recording ? "Stop" : "Start"} Recording
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={exportData}
                    disabled={recordedData.length == 0 || recording}
                >
                    <Text style={styles.buttonTitle}>
                        Export Data
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={{alignItems: 'center'}}>
                <Text style={{color: '#000000'}}>
                    Live Data:
                </Text>
                <Text style={{color: '#000000'}}>
                    {currentData.toString()}
                </Text>
            </View>
        </View>
    )
}
