import React, { Component } from 'react';
import { Actions } from 'react-native-router-flux';
import { View, Platform, PermissionsAndroid } from 'react-native';
import { styles } from 'react-native-theme';
import PropTypes from 'prop-types';
import { RNCamera } from 'react-native-camera';
import { Camera } from '@ui/components';
import { Config } from '@appConfig';

const flashModeOrder = {
  off: 'on',
  on: 'auto',
  auto: 'torch',
  torch: 'off',
};

export default class CameraScreen extends Component {
  constructor(props) {
    super(props);
    const { goBack } = this.props;
    this.goBack = goBack;
    this.state = {
      type: 'back',
      flash: 'off',
      isRecording: false,
      recordOptions: {
        // mute: false, // mute with any value disable audio capture
        maxDuration: 60,
        quality: RNCamera.Constants.VideoQuality['480p'],
      },
      timer: 10,
      hasImage: false,
    };
  }

  checkVideoPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version > 23) {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        // PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
    }
  };

  takeVideo = () => {
    // const { timer } = this.state;
    const { groupDetail, onSuccessAction } = this.props;
    this.groupDetail = groupDetail;
    this.onSuccessAction = onSuccessAction;
    this.takePicture = this.takePicture.bind(this);
    this.toggleFacing = this.toggleFacing.bind(this);
    this.toggleFlash = this.toggleFlash.bind(this);
    this.startRecording = this.startRecording.bind(this);
    this.stopRecording = this.stopRecording.bind(this);
  };

  takeVideo = () => {
    let i = 1;
    const { timer } = this.state;
    this.startRecording();
    const t = setInterval(() => {
      if (i > 10) {
        this.stopRecording();
        clearInterval(t);
      } else {
        i += 1;
      }
      if (timer > 0) {
        this.setState({ timer: timer - 1 });
      }
    }, 1000);
  };

  takePicture = async () => {
    if (this.camera) {
      this.camera
        .takePictureAsync({
          quality: 0.9,
          exif: true,
          fixOrientation: true,
          forceUpOrientation: true,
        })
        .then((dataToUpload) => {
          if (Actions.currentScene === 'CameraScreenScene') {
            Actions.ImagePreview({
              imageUrl: dataToUpload.uri,
              onSuccessAction: (imageCaption) => {
                this.setState({ hasImage: true });
                Actions.popTo('ChatRoomScene');
                setTimeout(() => {
                  Actions.refresh({
                    dataToUpload,
                    imageCaption,
                  });
                }, 0);
              },
            });
          }
          if (Actions.currentScene === 'ReplyCameraScreenScene') {
            Actions.ImagePreview({
              imageUrl: dataToUpload.uri,
              onSuccessAction: (imageCaption) => {
                this.setState({ hasImage: true });
                Actions.popTo('ReplyMessageScene');
                setTimeout(() => {
                  Actions.refresh({
                    dataToUpload,
                    imageCaption,
                  });
                }, 0);
              },
            });
          }
        });
      this.setState({ hasImage: false });
    }
  };

  startRecording = async () => {
    const { recordOptions } = this.state;
    // const { onSuccessAction } = this.props;
    if (this.camera) {
      this.camera.recordAsync(recordOptions).then((dataToUpload) => {
        if (Actions.currentScene === 'CameraScreenScene') {
          Actions.VideoPreview({
            videoUrl: dataToUpload.uri,
            showSend: true,
            onSuccessAction: () => {
              Actions.popTo('ChatRoomScene');
              setTimeout(() => {
                Actions.refresh({
                  dataToUpload,
                  imageCaption: 'Video Message',
                });
              }, 0);
            },
          });
        }
        if (Actions.currentScene === 'ReplyCameraScreenScene') {
          Actions.VideoPreview({
            videoUrl: dataToUpload.uri,
            showSend: true,
            onSuccessAction: () => {
              Actions.popTo('ReplyMessageScene');
              setTimeout(() => {
                Actions.refresh({
                  dataToUpload,
                  imageCaption: 'Video Message',
                });
              }, 0);
            },
          });
        }
      });
      // .catch((err) => {
      //   // console.log('Video recording error', err);
      // });
      this.setState({
        isRecording: true,
      });
    }
  };

  stopRecording = () => {
    if (this.camera) {
      this.camera.stopRecording();
      this.setState({
        isRecording: false,
        timer: 0,
      });
    }
  };

  toggleFacing = () => {
    const { type } = this.state;
    this.setState({
      type: type === 'back' ? 'front' : 'back',
    });
  };

  toggleFlash = () => {
    const { flash } = this.state;
    this.setState({
      flash: flashModeOrder[flash],
    });
  };

  render() {
    const { isRecording, type, flash, timer, hasImage } = this.state;
    const { goBack } = this.props;
    const recT = timer;
    const recM = (recT - (recT % 60)) / 60;
    const recS = recT % 60;
    return (
      <View style={styles.flex1}>
        {/* <StatusBar hidden /> */}
        <Camera
          cameraIconEnable
          videoIconEnable={Config.APPCONFIG.ATTACH_VIDEO}
          onCameraPress={() => {
            if (
              Actions.currentScene === 'CameraScreenScene' ||
              ('ReplyCameraScreenScene' && !hasImage)
            ) {
              this.takePicture();
            }
          }}
          refs={(ref) => {
            this.camera = ref;
          }}
          videoRecord={async () => {
            await this.checkVideoPermission();
            if (!isRecording) {
              this.takeVideo();
            } else {
              this.stopRecording();
            }
          }}
          recordIndicator={isRecording}
          recordingTime={`${recM < 10 ? '0' : ''}${recM}:${recS < 10 ? '0' : ''}${recS}`}
          cameraSwitch={type}
          switchAction={this.toggleFacing}
          flashType={flash}
          changeFlashAction={this.toggleFlash}
          goBack={goBack}
        />
      </View>
    );
  }
}

CameraScreen.propTypes = {
  groupDetail: PropTypes.object,
  onSuccessAction: PropTypes.func,
  goBack: PropTypes.func.isRequired,
};

CameraScreen.defaultProps = {
  groupDetail: {},
  onSuccessAction: () => {},
};
