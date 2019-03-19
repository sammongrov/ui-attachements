import React, { Component } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
  Text,
  Slider,
  Alert,
  // StatusBar,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import Video from 'react-native-video';
import PropTypes from 'prop-types';
import AppUtil from '@mongrov/utils'; 

import { Icon, NavBar, FontAwesomeIcon, Screen } from '@ui/components';
import { Colors } from '@ui/theme_default';
import { styles } from 'react-native-theme';

const customStyles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 5,
    backgroundColor: 'rgba(143, 143, 143, 0.65)',
    borderRadius: 20,
    zIndex: 999,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  mediaControlsContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    left: 0,
    right: 0,
    flex: 1,
    alignItems: 'center',
  },
  portraitPlayPauseButton: {
    marginBottom: '41%',
    flex: 1,
    alignItems: 'center',
    zIndex: 1000,
  },
  landscapePlayPauseButton: {
    marginBottom: '10%',
    flex: 1,
    alignItems: 'center',
    zIndex: 1000,
  },
  videoSliderContainer: {
    flex: 1,
    width: '100%',
    padding: 10,
    minHeight: 60,
  },
  videoTimersContainer: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoSlider: {
    flex: 1,
    zIndex: 50,
    height: 40,
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    left: 70,
    right: 70,
    height: 120,
    opacity: 1,
  },
});

export default class VideoPlayer extends Component {
  constructor() {
    super();

    this.state = {
      videoUrl: '',
      rate: 1.0,
      volume: 1.0,
      muted: false,
      resizeMode: 'contain',
      duration: 0.0,
      currentTime: 0.0,
      controls: true, // iOS only
      paused: false,
      isLoading: true,
      isBuffering: false,
      navbar: false,
      orientation: 'portrait',
      showPlayPause: false,
    };
  }

  componentWillMount() {
    const { videoUrl } = this.props;
    this.setState({ videoUrl });
  }

  // componentDidMount() {
  //   StatusBar.setHidden(true);
  // }

  // componentWillUnmount() {
  //   StatusBar.setHidden(false);
  // }

  onLoadStart = () => {
    this.setState({ isLoading: true });
  };

  onLoad = ({ duration }) => {
    this.setState({ isLoading: false, duration, showPlayPause: false });
  };

  onProgress = ({ currentTime }) => {
    this.setState({ currentTime });
  };

  onSeek = ({ currentTime }) => {
    this.setState({ currentTime });
  };

  onEnd = () => {
    this.player.seek(0);
    this.setState({ navbar: true, paused: true, showPlayPause: true });
  };

  onBuffer = ({ isBuffering }) => {
    this.setState({ isBuffering });
  };

  getOrientation = () => {
    const { width, height } = Dimensions.get('window');
    let orientation = 'portrait';
    if (width > height) {
      orientation = 'landscape';
    }
    this.setState({ orientation });
  };

  _pause = () => {
    this.setState({ paused: true, showPlayPause: true, navbar: true });
  };

  _play = () => {
    this.setState({ paused: false, showPlayPause: false, navbar: false });
  };

  _seek = (percentage) => {
    if (!this.player) {
      return;
    }
    const { duration } = this.state;
    const position = Number.parseFloat(percentage) * Number.parseFloat(duration);
    this.player.seek(position);
  };

  togglePlayPause = () => {
    const { paused } = this.state;
    if (!paused) {
      this._pause();
      return;
    }
    this._play();
  };

  PreviewSuccess = () => {
    const { onSuccessAction } = this.props;
    onSuccessAction();
  };

  videoError = (error) => {
    AppUtil.debug(`ERROR IN VIDEO PLAYER ${JSON.stringify(error)}`);
  };

  getTimerString = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.round(timeInSeconds - minutes * 60);
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  getCurrentProgress = (currentTime, duration) =>
    duration !== 0 ? Number.parseFloat(currentTime) / Number.parseFloat(duration) : 0;

  _deleteMessage = () => {
    const { deleteMessage } = this.props;
    Alert.alert(
      'Delete',
      'Do you want to delete message?',
      [
        { text: 'No', onPress: () => {}, style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            deleteMessage();
            Actions.pop();
          },
        },
      ],
      { cancelable: false },
    );
  };

  renderMediaControls = () => {
    const { paused, duration, currentTime, orientation, showPlayPause } = this.state;
    const durationTimer = this.getTimerString(duration);
    const playTimer = this.getTimerString(currentTime);
    const progress = this.getCurrentProgress(currentTime, duration);
    const playPauseButtonStyle = customStyles[`${orientation}PlayPauseButton`];

    if (Platform.OS === 'android') {
      return (
        <View style={customStyles.mediaControlsContainer}>
          {showPlayPause && (
            <View style={playPauseButtonStyle}>
              {paused && (
                <TouchableOpacity
                  onPress={() => this._play()}
                  style={{
                    width: 60,
                    height: 60,
                    borderWidth: 1,
                    borderRadius: 30,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: 'rgba(0,0,0,0.5)',
                  }}
                >
                  <Icon name="play" type="material-community" size={40} color={Colors.ICON_WHITE} />
                </TouchableOpacity>
              )}
              {!paused && (
                <TouchableOpacity
                  onPress={() => this._pause()}
                  style={{
                    width: 60,
                    height: 60,
                    borderWidth: 1,
                    borderRadius: 30,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderColor: 'rgba(0,0,0,0.5)',
                  }}
                >
                  <Icon name="stop" type="material-community" size={40} color={Colors.ICON_WHITE} />
                </TouchableOpacity>
              )}
            </View>
          )}
          <View style={customStyles.videoSliderContainer}>
            <View style={customStyles.videoTimersContainer}>
              <Text numberOfLines={1} style={styles.timerText}>
                {playTimer}
              </Text>
              <Text numberOfLines={1} style={styles.timerText}>
                {durationTimer}
              </Text>
            </View>
            <View style={customStyles.videoSlider}>
              <Slider
                step={0.0001}
                disabled={!paused}
                onValueChange={(percentage) => this._seek(percentage)}
                value={progress}
                minimumTrackTintColor={Colors.NAV_ICON}
                maximumTrackTintColor={Colors.BG_WHITE}
                thumbTintColor={Colors.BG_WHITE}
                style={{ opacity: 1 }}
              />
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  render() {
    const { showSend, showDelete } = this.props;
    const {
      isLoading,
      isBuffering,
      videoUrl,
      rate,
      resizeMode,
      volume,
      muted,
      paused,
      controls,
      navbar,
    } = this.state;
    const displayNavbar = navbar ? 1 : 0;
    let rightComponent = null;
    if (showSend) {
      rightComponent = (
        <TouchableOpacity
          onPress={() => {
            if (Actions.currentScene === 'VideoPreviewScene') {
              this.PreviewSuccess();
            }
          }}
        >
          <Icon name="send" size={20} color={Colors.NAV_ICON} />
        </TouchableOpacity>
      );
    } else if (showDelete) {
      rightComponent = (
        <TouchableOpacity
          onPress={() => {
            if (Actions.currentScene === 'VideoPreviewScene') {
              this._deleteMessage();
            }
          }}
        >
          <FontAwesomeIcon
            name="trash-o"
            type="material-community"
            color={Colors.NAV_ICON}
            size={22}
          />
        </TouchableOpacity>
      );
    }

    return (
      <Screen safeBgColors={['#000', '#000']}>
        <View style={[styles.flex1, styles.blackBackground]} onLayout={() => this.getOrientation()}>
          {/* <StatusBar hidden={!navbar} /> */}
          <NavBar
            navContainerStyle={{
              position: 'absolute',
              width: '100%',
              zIndex: 100,
              opacity: displayNavbar,
            }}
            leftComponent={
              <TouchableOpacity
                onPress={() => {
                  if (Actions.currentScene === 'VideoPreviewScene') {
                    Actions.pop();
                  }
                }}
              >
                <Icon
                  name="chevron-left"
                  type="material-community"
                  color={Colors.NAV_ICON}
                  size={36}
                />
              </TouchableOpacity>
            }
            rightComponent={rightComponent}
          />
          <TouchableOpacity style={customStyles.container} onPress={this.togglePlayPause}>
            <Video
              source={{ uri: videoUrl }}
              ref={(ref) => {
                this.player = ref;
              }}
              style={customStyles.backgroundVideo}
              controls={controls}
              rate={rate}
              resizeMode={resizeMode}
              volume={volume}
              muted={muted}
              paused={paused}
              repeat={false}
              onLoad={this.onLoad}
              onLoadStart={this.onLoadStart}
              onProgress={this.onProgress}
              onSeek={this.onSeek}
              onError={this.videoError}
              onEnd={this.onEnd}
              onBuffer={this.onBuffer}
            />
            {this.renderMediaControls()}
            <ActivityIndicator
              animating={isLoading || isBuffering}
              size="large"
              color={Colors.NAV_ICON}
              style={customStyles.indicator}
            />
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }
}

VideoPlayer.defaultProps = {
  videoUrl: '',
  showSend: false,
  showDelete: false,
  onSuccessAction: PropTypes.func,
  deleteMessage: PropTypes.func,
};

VideoPlayer.propTypes = {
  videoUrl: PropTypes.string,
  showSend: PropTypes.bool,
  showDelete: PropTypes.bool,
  onSuccessAction: () => {},
  deleteMessage: () => {},
};
