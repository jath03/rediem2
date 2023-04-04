import React, { useState, useEffect } from 'react'
import { ActivityIndicator, Text, View, FlatList, SafeAreaView, Platform, PermissionsAndroid, TouchableOpacity, NativeModules, NativeEventEmitter } from 'react-native'
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

export default function ConnectDeviceScreen(props) {
    const [isScanning, setIsScanning] = useState(false);
    const [peripherals, setPeripherals] = useState(new Map());

    const addOrUpdatePeripheral = (id: string, updatedPeripheral: Peripheral) => {
        setPeripherals(map => new Map(map.set(id, updatedPeripheral)));
    };

    useEffect(() => {
        try {
        BleManager.start({showAlert: false})
            .then(() => console.debug('BleManager started.'))
            .catch(error =>
            console.error('BleManager could not be started.', error),
            );
        } catch (error) {
        console.error('unexpected error starting BleManager.', error);
        return;
        }

        const listeners = [
            bleManagerEmitter.addListener(
                'BleManagerDiscoverPeripheral',
                handleDiscoverPeripheral,
            ),
            bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
        // bleManagerEmitter.addListener(
        //     'BleManagerDisconnectPeripheral',
        //     handleDisconnectedPeripheral,
        // ),
            bleManagerEmitter.addListener(
                'BleManagerDidUpdateValueForCharacteristic',
                handleUpdateValueForCharacteristic,
            ),
        ];

        handleAndroidPermissions();

        return () => {
            console.debug('[app] main component unmounting. Removing listeners...');
            for (const listener of listeners) {
                listener.remove();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startScan = () => {
        if (!isScanning) {
            // reset found peripherals before scan
            setPeripherals(new Map());

            try {
                console.debug('[startScan] starting scan...');
                setIsScanning(true);
                BleManager.scan(["6E400001-B5A3-F393-E0A9-E50E24DCCA9E"], 5, false).then(() => {  // Nordic UART service UUID
                    console.debug('[startScan] scan promise returned successfully.');
                }).catch(err => {
                    console.error('[startScan] ble scan returned in error', err);
                });
            } catch (error) {
                console.error('[startScan] ble scan error thrown', error);
            }
        }
    };

    const handleStopScan = () => {
        setIsScanning(false);
        console.debug('[handleStopScan] scan is stopped.');
        console.debug(peripherals);
        console.debug(peripherals.length);
    };
    
    let buffer = new ArrayBuffer(24);
    // Writing to the buffer using uint8's because that's what we receive from
    // data.value below in handleUpdateValueForCharacteristic
    let uint8_view = new Uint8Array(buffer);
    
    // Reading from the buffer, we want to see the int16 and float values that 
    // we sent from the arduino
    let int16_view = new Int16Array(buffer, 0, 6);
    let float_view = new Float32Array(buffer, 12, 3);
    
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
                if (buffer_idx + data.value.length - offset >= 24) {
                    console.log("Revieved data: " + int16_view + "," + float_view);
                    buffer_idx = 0;
                    buffer_state = 0;
                } else {
                    buffer_idx += data.value.length - offset;
                }
                offset = 0;
        }
    };

    const handleDiscoverPeripheral = (peripheral: Peripheral) => {
        console.debug('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
        if (peripheral.name) {
        // peripheral.name = 'NO NAME';
            peripheral.connected = false;
            peripheral.connecting = false;
            addOrUpdatePeripheral(peripheral.id, peripheral);
        }
    };
    
    const connectPeripheral = async (peripheral: Peripheral) => {
        try {
            if (peripheral) {
                addOrUpdatePeripheral(peripheral.id, {...peripheral, connecting: true});
        
                await BleManager.connect(peripheral.id);
                console.debug(`[connectPeripheral][${peripheral.id}] connected.`);
        
                addOrUpdatePeripheral(peripheral.id, {
                ...peripheral,
                connecting: false,
                connected: true,
                });
        
                // before retrieving services, it is often a good idea to let bonding & connection finish properly
                await sleep(900);
        
                /* Test read current RSSI value, retrieve services first */
                const peripheralData = await BleManager.retrieveServices(peripheral.id);
                console.debug(
                `[connectPeripheral][${peripheral.id}] retrieved peripheral services`,
                peripheralData,
                );
        
                const rssi = await BleManager.readRSSI(peripheral.id);
                console.debug(
                `[connectPeripheral][${peripheral.id}] retrieved current RSSI value: ${rssi}.`,
                );
        
                if (peripheralData.characteristics) {
                    for (let characteristic of peripheralData.characteristics) {
                        if (characteristic.descriptors) {
                            for (let descriptor of characteristic.descriptors) {
                                try {
                                    let data = await BleManager.readDescriptor(peripheral.id, characteristic.service, characteristic.characteristic, descriptor.uuid);
                                    console.debug(`[connectPeripheral][${peripheral.id}] descriptor read as:`, data);
                                } catch (error) {
                                    console.error(`[connectPeripheral][${peripheral.id}] failed to retrieve descriptor ${descriptor} for characteristic ${characteristic}:`, error);
                                }
                            }
                        }
                    }
                }
                
                BleManager.startNotification(
                    peripheral.id,
                    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
                    "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
                ).then(() => {
                    console.debug("[connectPeripheral] Enabled notification");
                }).catch((error) => {
                    console.debug(error);
                });
    
                let p = peripherals.get(peripheral.id);
                if (p) {
                    addOrUpdatePeripheral(peripheral.id, {...peripheral, rssi});
                }
            }
        } catch (error) {
        console.error(
            `[connectPeripheral][${peripheral.id}] connectPeripheral error`,
            error,
        );
        }
    };
    
    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const handleAndroidPermissions = () => {
        if (Platform.OS === 'android' && Platform.Version >= 31) {
        PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]).then(result => {
            if (result) {
            console.debug(
                '[handleAndroidPermissions] User accepts runtime permissions android 12+',
            );
            } else {
            console.error(
                '[handleAndroidPermissions] User refuses runtime permissions android 12+',
            );
            }
        });
        } else if (Platform.OS === 'android' && Platform.Version >= 23) {
        PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then(checkResult => {
            if (checkResult) {
            console.debug(
                '[handleAndroidPermissions] runtime permission Android <12 already OK',
            );
            } else {
            PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ).then(requestResult => {
                if (requestResult) {
                console.debug(
                    '[handleAndroidPermissions] User accepts runtime permission android <12',
                );
                } else {
                console.error(
                    '[handleAndroidPermissions] User refuses runtime permission android <12',
                );
                }
            });
            }
        });
        }
    };


    const Separator = () => <View style={styles.separator} />;

    const PeripheralItem = ({item}) => (
        <TouchableOpacity style={styles.device} onPress={() => connectPeripheral(item)}>
            <Text style={styles.buttonTitle}>
                {item.name}
                {item.connecting && ' - Connecting...'}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Separator />
            <View style={{flexDirection: 'row'}}>
            <TouchableOpacity style={styles.button} onPress={startScan}>
                <Text style={styles.buttonTitle}>Scan for Devices</Text>
            </TouchableOpacity>

            <ActivityIndicator animating={isScanning} />
            </View>
            <Separator />
                <FlatList
                    data={Array.from(peripherals.values())}
                    renderItem={PeripheralItem}
                />
        </View>
    )
}
