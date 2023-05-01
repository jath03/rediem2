import React, { useState, useEffect, useRef } from 'react'
import { Text, View, SafeAreaView, TouchableOpacity, NativeModules, NativeEventEmitter } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { jsonToCSV } from 'react-native-csv'
import Share from 'react-native-share'
import { Chart, Line, Area, HorizontalAxis, VerticalAxis } from 'react-native-responsive-linechart'
import styles from './styles'
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
  ScanSettings
} from 'react-native-ble-manager'
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const FIELDS = {
    "R1": {
        name: "Resistor 1 (Ω)",
        bounds: {min: 10_000, max: 30_000}
    },
    "R2": {
        name: "Resistor 2 (Ω)",
        bounds: {min: 10_000, max: 30_000}
    },
    "R3": {
        name: "Resistor 3 (Ω)",
        bounds: {min: 10_000, max: 30_000}
    },
    "R4": {
        name: "Resistor 4 (Ω)",
        bounds: {min: 10_000, max: 30_000}
    },
    "R5": {
        name: "Resistor 5 (Ω)",
        bounds: {min: 10_000, max: 30_000}
    },
    "R6": {
        name: "Resistor 6 (Ω)",
        bounds: {min: 10_000, max: 30_000}
    },
    "X": {
        name: "Accelerometer X (g)",
        bounds: {min: -2, max: 2}
    },
    "Y": {
        name: "Accelerometer Y (g)",
        bounds: {min: -2, max: 2}
    },
    "Z": {
        name: "Accelerometer Z (g)",
        bounds: {min: -2, max: 2}
    },
    "EMG": {
        name: "EMG (mV)",
        bounds: {min: 240, max: 255}
    },
    "BIOZ": {
        name: "BioZ (kΩ)",
        bounds: {min: -5, max: 5}
    }
};
// const FIELD_NAMES = [""]

export default function RecordDataScreen(props) {
    const [currentData, setCurrentData] = useState(new Array());
    const [recording, setRecording] = useState(false);
    const [recordedData, setRecordedData] = useState([]);
    const startTime = useRef(Date.now())

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
            setRecordedData([]);
            startTime.current = Date.now();
        } else {
            console.debug("Stopping recording");
            console.debug("# of entries recorded: " + recordedData.length);
        }
        setRecording(recording => !recording);
    };

    const exportData = async () => {
        let data_str = jsonToCSV({
            fields: Object.keys(FIELDS),
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
                    tmp_data = [Date.now(), ...Array.from(int16_view).concat(Array.from(float_view))];
                    // for (let i = 1; i < tmp_data.length; i++) {
                    //     tmp_data[i] = tmp_data[i].toFixed(2);
                    // }
                    setCurrentData(tmp_data);
                    if (recording) {
                        setRecordedData(recdata => {
                            recdata.push(tmp_data);
                            return recdata;
                        });
                    }
                    buffer_idx = 0;
                    buffer_state = 0;
                } else {
                    buffer_idx += data.value.length - offset;
                }
                offset = 0;
        }
    };

    const transpose = (matrix) => {
        let transposed = matrix[0].map((col, i) => matrix.map(row => row[i]));
        let timestamps = transposed.shift();
        let out = transposed.map(item => item.map((e, i) => {
            // console.debug(e);
            // console.debug(timestamps);
            return {
                // date: new Date(timestamps[i] - startTime.current),
                // value: e
                x: (timestamps[i] - startTime.current) / 1000,
                y: e
            };
        }));
        // console.debug(out);
        return out;
    };

    const GraphItem = ({item, index}) => {
        const vals = Object.values(FIELDS);
        return (
            <View>
                <Text style={{color: '#000000'}}>{vals[index].name}</Text>
                <Chart
                    disableGestures
                    data={item}
                    style={{height: 200, width: 300}}
                    padding={{left: 45, right: 10, top: 10, bottom: 10}}
                    yDomain={vals[index].bounds}
                >
                    <VerticalAxis
                        tickCount={5}
                        theme={{ labels: { formatter: (v) => v.toFixed(2) } }}
                    />
                    <HorizontalAxis />
                    <Line />
                </Chart>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={{flexDirection: 'row'}}>
                <TouchableOpacity style={styles.button} onPress={toggleRecording}>
                    <Text style={styles.buttonText}>
                        {recording ? "Stop" : "Start"} Recording
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.button}
                    onPress={exportData}
                    disabled={recordedData.length == 0 || recording}
                >
                    <Text style={styles.buttonText}>
                        Export Data
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={{alignItems: 'center'}}>
                <Text style={{color: '#000000'}}>
                    Live Data:
                </Text>
                <Text style={{color: '#000000'}}>
                    {currentData.slice(1).map(i => i.toFixed(2)).toString()}
                </Text>
            </View>
            <SafeAreaView style={{alignItems: 'center'}}>
                {recordedData.length > 1 ?
                    <FlatList
                        data={transpose(recordedData)}
                        renderItem={GraphItem}
                        contentContainerStyle={{ paddingBottom: 200 }}
                    />
                    :
                    <Text>Hit record for visualization</Text>
                }
            </SafeAreaView>
        </View>
    )
}
