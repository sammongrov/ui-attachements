import React, { Component } from 'react';
import { View, Text, Slider, TouchableOpacity, Alert } from 'react-native';
import PropTypes from 'prop-types';
import AppUtil from '@mongrov/utils'; 
import { Player } from 'react-native-audio-toolkit';
import { Colors } from '@ui/theme_default';
import { styles } from 'react-native-theme';
import { Icon, FontAwesomeIcon } from '@ui/components';

export default class AudioPlay extends Component {
  constructor() {
    super();

    this.state = {
      playButtonDisabled: false,
      progress: 0,
      playTime: 0,
      duration: 0,
      playing: false,
      loadingAudio: false,
      playerExists: false,
    };
  }

  componentWillMount() {
    this.player = null;
    this.lastSeek = 0;
    this._getProgressTimer();
  }

  componentWillUnmount() {
    if (this._progressInterval) {
      clearInterval(this._progressInterval);
      this._progressInterval = null;
    }
    if (this._playInterval) {
      clearInterval(this._playInterval);
      this._playInterval = null;
    }
    this._deletePlayer();
  }

  getTimerString(playTime) {
    const recT = playTime / 1000;
    const recM = Math.floor(recT / 60);
    const recS = Math.round(recT - recM * 60);
    return `${recM < 10 ? '0' : ''}${recM}:${recS < 10 ? '0' : ''}${recS}`;
  }

  _deletePlayer() {
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }

  _clearInactivePlayer() {
    if (this._progressInterval) {
      clearInterval(this._progressInterval);
      this._progressInterval = null;
    }
    if (this._playInterval) {
      clearInterval(this._playInterval);
      this._playInterval = null;
    }
    this.setState({ playButtonDisabled: false, playTime: 0, progress: 0, playerExists: false });
    this._deletePlayer();
  }

  _shouldUpdateProgressBar() {
    // Debounce progress bar update by 200 ms
    return Date.now() - this.lastSeek > 200;
  }

  _pause() {
    if (this.player) {
      this.player.pause((err) => {
        if (err) {
          AppUtil.debug(`ERROR IN PAUSING AUDIO PLAYER ${JSON.stringify(err)}`);
        }
        clearInterval(this._playInterval);
        this.setState({ playButtonDisabled: false });
      });
    }
  }

  _seek(percentage) {
    if (!this.player) {
      return;
    }

    this.setState({ loadingAudio: false });
    clearInterval(this._playInterval);
    this.lastSeek = Date.now();
    const position = percentage * this.player.duration;
    this.player.seek(position, () => {
      this._getPlayTimer();
    });
  }

  _getPlayTimer() {
    this._playInterval = setInterval(() => {
      if (this.player && this.player.currentTime < this.player.duration) {
        this.setState({ playTime: this.player.currentTime });
      } else {
        clearInterval(this._playInterval);
      }
    }, 1000);
  }

  _getProgressTimer() {
    this._progressInterval = setInterval(() => {
      if (this.player && this._shouldUpdateProgressBar() && this.player.duration > 0) {
        this.setState({
          progress: Math.max(0, this.player.currentTime) / this.player.duration,
        });
      }
    }, 100);
  }

  _startPlayer() {
    if (!this.player) {
      this.setState({ loadingAudio: true });

      if (!this._progressInterval) {
        this._getProgressTimer();
      }

      const { audioFile } = this.props;
      this.player = new Player(audioFile, {
        autoDestroy: false,
      });
      this.player.play(() => {
        this.setState({
          playButtonDisabled: true,
          duration: this.player.duration,
          playing: true,
          loadingAudio: false,
          playerExists: true,
        });
        this._getPlayTimer();
      });
    } else if (this.player && (this.player.canPrepare || this.player.canPlay)) {
      this.setState({ loadingAudio: true });
      this.player.play(() => {
        this.setState({
          playButtonDisabled: true,
          duration: this.player.duration,
          playing: true,
          loadingAudio: false,
        });
        this._getPlayTimer();
      });
    } else if (this.player && this.player.isPaused) {
      this.player.play(() => {
        this.setState({ playButtonDisabled: true, loadingAudio: false });
        this._getPlayTimer();
      });
    }

    this.player.on('ended', () => {
      clearInterval(this._playInterval);
      this.setState({
        playButtonDisabled: false,
        playTime: 0,
        progress: 0,
        playing: false,
      });
      // destroy player & clear intervals after 35sec
      setTimeout(() => {
        if (this.player && this.player.isStopped) {
          this._clearInactivePlayer();
        }
      }, 35000);
    });

    this.player.on('pause', () => {
      // destroy player & clear intervals after 35sec
      setTimeout(() => {
        if (this.player && this.player.isPaused) {
          this._clearInactivePlayer();
        }
      }, 35000);
    });

    this.player.on('error', () => {
      this._clearInactivePlayer();
    });
  }

  _deleteMessage() {
    const { deleteMessage } = this.props;
    Alert.alert(
      'Delete',
      'Do you want to delete message?',
      [
        { text: 'No', onPress: () => {}, style: 'cancel' },
        { text: 'Yes', onPress: () => deleteMessage() },
      ],
      { cancelable: false },
    );
  }

  render() {
    const {
      playButtonDisabled,
      progress,
      playTime,
      duration,
      playing,
      loadingAudio,
      playerExists,
    } = this.state;
    const { showPlayer, showDelete, position } = this.props;
    const playTimer = this.getTimerString(playTime);
    const durationTimer = this.getTimerString(duration);
    const disableSeek = playButtonDisabled || !playerExists;
    let audioPlayer;
    if (showPlayer) {
      audioPlayer = (
        <View style={styles.audioPlayerContainer}>
          <View style={styles.audioPlayerRow}>
            <View style={[styles.marginLeft15, styles.rowAlignJustifyCenter]}>
              {!playButtonDisabled &&
                !loadingAudio && (
                  <TouchableOpacity onPress={() => this._startPlayer()}>
                    <View
                      style={[
                        styles.audioPlayerButton,
                        {
                          backgroundColor:
                            position === 'right'
                              ? Colors.BG_CHAT_DETAIL_BUBBLE_RIGHT
                              : Colors.BG_CHAT_DETAIL_BUBBLE_LEFT,
                        },
                      ]}
                    >
                      <Icon
                        name="play-circle-outline"
                        type="material-community"
                        size={40}
                        color={
                          position === 'right' ? Colors.AUDIO_ICON_RIGHT : Colors.AUDIO_ICON_LEFT
                        }
                      />
                    </View>
                  </TouchableOpacity>
                )}
              {loadingAudio && (
                <View
                  style={[
                    styles.audioPlayerButton,
                    {
                      backgroundColor:
                        position === 'right'
                          ? Colors.BG_CHAT_DETAIL_BUBBLE_RIGHT
                          : Colors.BG_CHAT_DETAIL_BUBBLE_LEFT,
                    },
                  ]}
                >
                  <Icon
                    name="timer-sand"
                    type="material-community"
                    size={24}
                    color={position === 'right' ? Colors.AUDIO_ICON_RIGHT : Colors.AUDIO_ICON_LEFT}
                  />
                </View>
              )}
              {playButtonDisabled &&
                !loadingAudio && (
                  <TouchableOpacity onPress={() => this._pause()}>
                    <View
                      style={[
                        styles.audioPlayerButton,
                        {
                          backgroundColor:
                            position === 'right'
                              ? Colors.BG_CHAT_DETAIL_BUBBLE_RIGHT
                              : Colors.BG_CHAT_DETAIL_BUBBLE_LEFT,
                        },
                      ]}
                    >
                      <Icon
                        name="stop-circle-outline"
                        type="material-community"
                        size={40}
                        color={
                          position === 'right' ? Colors.AUDIO_ICON_RIGHT : Colors.AUDIO_ICON_LEFT
                        }
                      />
                    </View>
                  </TouchableOpacity>
                )}
            </View>
            <View style={styles.audioPlayerSliderContainer}>
              <Slider
                step={0.0001}
                disabled={disableSeek}
                onValueChange={(percentage) => this._seek(percentage)}
                value={progress}
                minimumTrackTintColor={Colors.AUDIO_ICON_RIGHT}
                thumbTintColor={
                  position === 'right' ? Colors.AUDIO_ICON_RIGHT : Colors.AUDIO_ICON_LEFT
                }
              />
            </View>
            {showDelete && (
              <TouchableOpacity
                style={styles.audioPlayerDeleteButton}
                onPress={() => this._deleteMessage()}
              >
                <FontAwesomeIcon
                  name="trash-o"
                  type="material-community"
                  color={position === 'right' ? Colors.AUDIO_ICON_RIGHT : Colors.AUDIO_ICON_LEFT}
                  size={28}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.audioPlayerTimerContainer}>
            <Text
              numberOfLines={1}
              style={[
                styles.audioPlayerTimerText,
                {
                  color: position === 'right' ? Colors.TEXT_WHITE : Colors.TEXT_LEFT_TIME,
                },
              ]}
            >
              {playing ? playTimer : durationTimer}
            </Text>
          </View>
        </View>
      );
    } else {
      audioPlayer = <View style={[styles.audioPlayerContainer, { minHeight: 65 }]} />;
    }
    return audioPlayer;
  }
}

AudioPlay.defaultProps = {
  audioFile: '',
  showPlayer: false,
  showDelete: false,
  position: '',
  deleteMessage: () => {},
};

AudioPlay.propTypes = {
  audioFile: PropTypes.string,
  showPlayer: PropTypes.bool,
  showDelete: PropTypes.bool,
  position: PropTypes.string,
  deleteMessage: PropTypes.func,
};
