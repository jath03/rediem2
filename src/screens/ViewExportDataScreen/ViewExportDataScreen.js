// // import React from 'react'
// // import { Text, View } from 'react-native'

// // export default function ViewExportDataScreen(props) {
// //     return (
// //         <View>
// //             <Text>Would you like to view or export your data?</Text>
// //         </View>
// //     )
// // }

// import React, { useState } from 'react';
// import { Button, View, Text } from 'react-native';
// import RNFS from 'react-native-fs';
// import Email from 'react-native-email';

// const EmailData = () => {
//   const [filePath, setFilePath] = useState(null);

//   const createDataFile = () => {
//     const data = JSON.stringify({
//       data1: 'Example Data 1',
//       data2: 'Example Data 2',
//     });
//     const path = RNFS.DocumentDirectoryPath + '/data.json';
//     RNFS.writeFile(path, data, 'utf8')
//       .then(() => {
//         setFilePath(path);
//       });
//   };

//   const sendEmail = () => {
//     const to = '';
//     const subject = 'Data File';
//     const body = 'Please find the attached data file.';
//     const attachment = [{
//       path: filePath,
//       type: 'application/json',
//       name: 'data.json',
//     }];

//     Email.default.open({
//       to,
//       subject,
//       body,
//       attachments: attachment,
//     });
//   };

//   return (
//     <View>
//       <Button title="Create Data File" onPress={createDataFile} />
//       {filePath && (
//         <Button title="Email Data File" onPress={sendEmail} />
//       )}
//     </View>
//   );
// };

// export default EmailData;
