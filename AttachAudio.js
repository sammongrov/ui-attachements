import React, { Component } from 'react';
import { Actions } from 'react-native-router-flux';
import { Text, View, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { Recorder } from 'react-native-audio-toolkit';
import { styles } from 'react-native-theme';
import { Colors } from '@ui/theme_default';
import { Icon /* , FontAwesomeIcon */ } from '@ui/components';

// TODO: clean old styles of audio attachment and add new to the theme
const customStyles = StyleSheet.create({
  audioAttachContainer: {
    paddingBottom: Platform.select({
      ios: 35,
      android: null,
    }),
  },
  composer: {
    marginLeft: 10,
    marginTop: Platform.select({
      ios: 6,
      android: 0,
    }),
    marginBottom: Platform.select({
      ios: 5,
      android: 3,
    }),
    borderWidth: 1,
    borderColor: Colors.TYP_MIDGRAY,
    borderRadius: Platform.select({
      ios: 33 / 2,
      android: 41 / 2,
    }),
    height: Platform.select({
      ios: 33,
      android: 41,
    }),
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    color: Colors.TEXT_BLACK,
    marginLeft: 5,
  },
  timerView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.ICON_RED,
    fontSize: 16,
  },
});

export default class AttachAudio extends Component {
  constructor() {
    super();
    this.state = {
      recordTime: 0,
      filePath: '',
    };
  }

  componentWillMount() {
    this.recorder = null;
    this._reloadRecorder();
  }

  componentWillUnmount() {
    clearInterval(this._recordInterval);
    if (this.recorder) {
      this.recorder.destroy();
    }
  }

  _reloadRecorder() {
    if (this.recorder) {
      this.recorder.destroy();
    }

    this.recorder = new Recorder('newRecord.mp4', {
      bitrate: 256000,
      channels: 2,
      sampleRate: 44100,
      quality: 'max',
    })
      .prepare((err, fsPath) => {
        if (err) {
          // console.log('PREPARE RECORDER ERROR', err);
        } else {
          this.setState({ filePath: fsPath });
        }
      })
      .record((err) => {
        if (err) {
          // console.log('RECORDER ERROR', err);
          // this.setState({ recordTime: 0 });
          Actions.refresh({
            attachAudio: false,
          });
          return;
        }
        this._recordInterval = setInterval(() => {
          const { recordTime } = this.state;
          if (recordTime < 300) {
            this.setState({ recordTime: recordTime + 1 });
          } else {
            // clearInterval(this._recordInterval);
            this.cancelRecord();
          }
        }, 1000);
      });
  }

  sendRecord() {
    if (this.recorder && this.recorder.isRecording) {
      const { filePath } = this.state;
      this.recorder.stop((err) => {
        if (err) {
          // console.log('STOP RECORDER ERROR', err);
          if (this.recorder) {
            this.recorder.destroy();
          }
        }
        // clearInterval(this._recordInterval);
        // this.setState({ recordTime: 0 });
        Actions.refresh({
          attachAudio: false,
          dataToUpload: {
            uri: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
          },
          imageCaption: 'Audio Message',
        });
      });
    }
  }

  cancelRecord() {
    if (this.recorder && this.recorder.isRecording) {
      this.recorder.stop((err) => {
        if (err) {
          // console.log('STOP RECORDER ERROR', err);
          if (this.recorder) {
            this.recorder.destroy();
          }
        }
        // clearInterval(this._recordInterval);
        // this.setState({ recordTime: 0 });
        Actions.refresh({
          attachAudio: false,
        });
      });
    }
  }

  render() {
    const { recordTime: recT } = this.state;
    const recM = (recT - (recT % 60)) / 60;
    const recS = recT % 60;
    const timerString = `${recM < 10 ? '0' : ''}${recM}:${recS < 10 ? '0' : ''}${recS}`;
    return (
      <View style={[customStyles.audioAttachContainer, styles.rowFlex]}>
        <View style={[styles.rowFlex, customStyles.composer]}>
          <View style={customStyles.timerView}>
            <View>
              <Icon
                name="checkbox-blank-circle"
                type="material-community"
                color={recT % 2 ? Colors.ICON_RED : Colors.TYP_GRAY}
                size={12}
              />
            </View>
            <Text numberOfLines={1} style={customStyles.timerText}>
              {timerString}
            </Text>
          </View>

          <TouchableOpacity onPress={() => this.cancelRecord()}>
            <Text numberOfLines={1} style={customStyles.cancelText}>
              Cancel
            </Text>
            {/* <FontAwesomeIcon
              name="trash-o"
              type="material-community"
              color={Colors.TYP_GRAY}
              size={22}
            /> */}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => this.sendRecord()}>
          <View style={[styles.chatDetailSendView, styles.alignJustifyCenter]}>
            <Icon name="send" color={Colors.TEXT_HEADER} size={28} />
          </View>
        </TouchableOpacity>
      </View>
    );
    // return (
    //   <View style={styles.audioAttachContainer}>
    //     <View style={styles.rowFlex}>
    //       <View style={styles.audioAttachTimerView}>
    //         <Text numberOfLines={1} ellipsizeMode="tail" style={styles.audioAttachTimerText}>{`${
    //           recM < 10 ? '0' : ''
    //         }${recM}:${recS < 10 ? '0' : ''}${recS}`}</Text>
    //       </View>
    //       <TouchableOpacity
    //         style={[styles.centerContainer, styles.margin5]}
    //         onPress={() => this.sendRecord()}
    //       >
    //         <View style={[styles.audioAttachiconButton, styles.audioAttachSendIconView]}>
    //           <Icon name="send" type="material-community" color={Colors.ICON_WHITE} size={24} />
    //         </View>
    //         <Text numberOfLines={1} ellipsizeMode="tail" style={styles.audioAttachText}>
    //           Send
    //         </Text>
    //       </TouchableOpacity>
    //       <TouchableOpacity
    //         style={[styles.centerContainer, styles.margin5]}
    //         onPress={() => this.cancelRecord()}
    //       >
    //         <View style={[styles.audioAttachiconButton, styles.audioAttachCancelIconView]}>
    //           <Icon name="close" type="material-community" color={Colors.ICON_WHITE} size={28} />
    //         </View>
    //         <Text numberOfLines={1} ellipsizeMode="tail" style={styles.audioAttachText}>
    //           Cancel
    //         </Text>
    //       </TouchableOpacity>
    //     </View>
    //   </View>
    // );
  }
}
