import React from 'react';
import renderer from 'react-test-renderer';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import AppUtil from '@utils';
import { Alert } from 'react-native';
import { Colors } from '@ui/theme_default';
import AudioPlay from '../AudioPlay';

configure({ adapter: new Adapter() });

jest.spyOn(Date, 'now').mockImplementation(() => 1479427300700);

jest.mock('@utils', () => ({
  debug: jest.fn(),
}));

jest.mock('Alert', () => ({
  alert: jest.fn((str1, str2, arr) => {
    arr[0].onPress();
  }),
}));

jest.mock('react-native-audio-toolkit', () => {
  function MockPlayer() {
    this.destroy = jest.fn();
    this.pause = jest.fn((cb) => {
      cb(null);
      return this;
    });
    this.play = jest.fn((cb) => {
      cb();
      return this;
    });
    this.seek = jest.fn((position, cb) => {
      cb();
      return this;
    });
    this.on = jest.fn((event, cb) => {
      if (event === 'ended') {
        cb();
      }
      return this;
    });
    this.duration = 369;
    this.currentTime = 12;
    this.canPrepare = true;
    this.canPlay = true;
    this.isPaused = false;
    this.isStopped = true;
  }
  return { Player: MockPlayer };
});

const audioFile = '//recordings/myVoice1.mp4';
const showPlayer = true;
const showDelete = true;
const position = 'left';
const deleteMessage = jest.fn();
const props = { audioFile, showPlayer, showDelete, position, deleteMessage };
const error = new Error('player error');

jest.useFakeTimers();

beforeEach(() => {
  jest.resetModules();
});

/* ------------------------- Snapshots ----------------------- */
it('AttachAudio renders correctly without props', () => {
  const tree = renderer.create(<AudioPlay />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('AttachAudio renders correctly with props', () => {
  const tree = renderer.create(<AudioPlay {...props} />).toJSON();
  expect(tree).toMatchSnapshot();
});

/* ------------------- component methods --------------------- */

it('AudioPlay willMount', () => {
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  expect(instance.player).toBeNull();
  expect(instance.lastSeek).toBe(0);
  expect(setInterval).toBeCalled();
});

it('AudioPlay willUnmount and clears a progress interval', () => {
  clearInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance._progressInterval = 1;
  instance._playInterval = null;
  instance._deletePlayer = jest.fn();
  tree.unmount();
  expect(clearInterval).toBeCalledTimes(1);
  expect(instance._deletePlayer).toBeCalled();
});

it('AudioPlay willUnmount and clears a play interval', () => {
  clearInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance._progressInterval = null;
  instance._playInterval = 2;
  instance._deletePlayer = jest.fn();
  tree.unmount();
  expect(clearInterval).toBeCalledTimes(1);
  expect(instance._deletePlayer).toBeCalled();
});

it('AudioPlayer calls getTimerString', () => {
  const timeInMS0 = 0;
  const timeInMS1 = 5000;
  const timeInMS2 = 42000;
  const timeInMS3 = 77000;
  const timeInMS4 = 723000;
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  const result0 = instance.getTimerString(timeInMS0);
  const result1 = instance.getTimerString(timeInMS1);
  const result2 = instance.getTimerString(timeInMS2);
  const result3 = instance.getTimerString(timeInMS3);
  const result4 = instance.getTimerString(timeInMS4);
  expect(result0).toMatch('00:00');
  expect(result1).toMatch('00:05');
  expect(result2).toMatch('00:42');
  expect(result3).toMatch('01:17');
  expect(result4).toMatch('12:03');
});

it('AudioPlayer calls _deletePlayer - no player', () => {
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = null;
  expect(instance._deletePlayer()).toBeUndefined();
});

it('AudioPlayer calls _deletePlayer - the player is present', () => {
  const destroy = jest.fn();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = { destroy };
  instance._deletePlayer();
  expect(destroy).toBeCalled();
  expect(instance.player).toBeNull();
});

it('AudioPlayer calls _clearInactivePlayer with a progress interval', () => {
  clearInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance._progressInterval = 1;
  instance._playInterval = null;
  instance._deletePlayer = jest.fn();
  instance._clearInactivePlayer();
  expect(clearInterval).toBeCalledTimes(1);
  expect(tree.state().playButtonDisabled).toBe(false);
  expect(tree.state().playTime).toBe(0);
  expect(tree.state().progress).toBe(0);
  expect(tree.state().playerExists).toBe(false);
  expect(instance._deletePlayer).toBeCalled();
});

it('AudioPlayer calls _clearInactivePlayer with a play interval', () => {
  clearInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance._progressInterval = null;
  instance._playInterval = 2;
  instance._deletePlayer = jest.fn();
  instance._clearInactivePlayer();
  expect(clearInterval).toBeCalledTimes(1);
  expect(instance._deletePlayer).toBeCalled();
});

it('AudioPlayer _shouldUpdateProgressBar returns true', () => {
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.lastSeek = 1479427200000;
  expect(instance._shouldUpdateProgressBar()).toBe(true);
});

it('AudioPlayer _shouldUpdateProgressBar returns false', () => {
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.lastSeek = 1479427300625;
  expect(instance._shouldUpdateProgressBar()).toBe(false);
});

it('AudioPlayer calls _pause - no player', () => {
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = null;
  expect(instance._pause()).toBeUndefined();
});

it('AudioPlayer calls _pause - error returned', () => {
  AppUtil.debug.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    pause: jest.fn((cb) => {
      cb(error);
    }),
  };
  instance._pause();
  expect(AppUtil.debug).toBeCalled();
});

it('AudioPlayer calls _pause - the player paused', () => {
  clearInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    pause: jest.fn((cb) => {
      cb(null);
    }),
  };
  instance._pause();
  expect(clearInterval).toBeCalled();
  expect(tree.state().playButtonDisabled).toBe(false);
});

it('AudioPlayer calls _seek - no player', () => {
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = null;
  expect(instance._seek(0.35)).toBeUndefined();
});

it('AudioPlayer calls _seek with a player', () => {
  clearInterval.mockClear();
  const percentage = 0.35;
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    seek: jest.fn((pos, cb) => {
      cb();
    }),
    duration: 15000,
  };
  instance._getPlayTimer = jest.fn();
  instance._seek(percentage);
  const playerPosition = percentage * instance.player.duration;
  expect(tree.state().loadingAudio).toBe(false);
  expect(clearInterval).toBeCalled();
  expect(instance.player.seek).toBeCalledWith(playerPosition, expect.any(Function));
});

it('AudioPlayer calls _getPlayTimer - no player', () => {
  clearInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = null;
  instance._getPlayTimer();
  jest.advanceTimersByTime(1000);
  expect(clearInterval).toBeCalled();
});

it('AudioPlayer calls _getPlayTimer - a track is completed', () => {
  clearInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    currentTime: 15653,
    duration: 15653,
  };
  instance._getPlayTimer();
  jest.advanceTimersByTime(1000);
  expect(clearInterval).toBeCalled();
});

it('AudioPlayer calls _getPlayTimer - a track is ongoing', () => {
  clearInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    currentTime: 10810,
    duration: 15653,
  };
  instance._getPlayTimer();
  jest.advanceTimersByTime(1000);
  expect(tree.state().playTime).toBe(instance.player.currentTime);
  expect(clearInterval).not.toBeCalled();
});

it('AudioPlayer calls _getProgressTimer - no player', () => {
  setInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = null;
  instance._getProgressTimer();
  jest.advanceTimersByTime(100);
  expect(setInterval).toBeCalled();
});

it('AudioPlayer calls _getProgressTimer - a progress bar should not be updated', () => {
  setInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    duration: 15653,
  };
  instance._shouldUpdateProgressBar = jest.fn(() => false);
  instance._getProgressTimer();
  jest.advanceTimersByTime(100);
  expect(setInterval).toBeCalled();
});

it('AudioPlayer calls _getProgressTimer - a duration == 0', () => {
  setInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    duration: 0,
  };
  instance._shouldUpdateProgressBar = jest.fn(() => true);
  instance._getProgressTimer();
  jest.advanceTimersByTime(100);
  expect(setInterval).toBeCalled();
});

it('AudioPlayer calls _getProgressTimer successfully', () => {
  setInterval.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    duration: 15653,
    currentTime: 1250,
  };
  instance._shouldUpdateProgressBar = jest.fn(() => true);
  instance._getProgressTimer();
  const progress = Math.max(0, instance.player.currentTime) / instance.player.duration;
  jest.advanceTimersByTime(100);
  expect(setInterval).toBeCalled();
  expect(tree.state().progress).toBe(progress);
});

it('AudioPlayer calls _startPlayer - no player', () => {
  setTimeout.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = null;
  instance._progressInterval = null;
  instance._getProgressTimer = jest.fn();
  instance._getPlayTimer = jest.fn();
  instance._clearInactivePlayer = jest.fn();
  instance._startPlayer();
  expect(instance._getProgressTimer).toBeCalled();
  expect(tree.state().playButtonDisabled).toBe(false);
  expect(tree.state().duration).toBe(369);
  expect(tree.state().playing).toBe(false);
  expect(tree.state().loadingAudio).toBe(false);
  expect(tree.state().playerExists).toBe(true);
  expect(tree.state().playTime).toBe(0);
  expect(tree.state().progress).toBe(0);
  jest.runOnlyPendingTimers();
  expect(setTimeout).toBeCalled();
  expect(instance._clearInactivePlayer).toBeCalled();
});

it('AudioPlayer calls _startPlayer - progress interval set', () => {
  setTimeout.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = null;
  instance._progressInterval = 1;
  instance._getProgressTimer = jest.fn();
  instance._getPlayTimer = jest.fn();
  instance._startPlayer();
  expect(instance._getProgressTimer).not.toBeCalled();
});

it('AudioPlayer calls _startPlayer - player canPrepare', () => {
  setTimeout.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    play: jest.fn((cb) => {
      cb();
    }),
    canPrepare: true,
    canPlay: true,
    duration: 10001,
    on: jest.fn((event, cb) => {
      if (event === 'ended') {
        cb();
      }
      return this;
    }),
    isStopped: false,
  };
  instance._getProgressTimer = jest.fn();
  instance._getPlayTimer = jest.fn();
  instance._clearInactivePlayer = jest.fn();
  instance._startPlayer();
  expect(tree.state().playButtonDisabled).toBe(false);
  expect(tree.state().duration).toBe(10001);
  expect(tree.state().playing).toBe(false);
  expect(tree.state().loadingAudio).toBe(false);
  expect(instance._getPlayTimer).toBeCalled();
  expect(tree.state().playTime).toBe(0);
  expect(tree.state().progress).toBe(0);
  jest.runOnlyPendingTimers();
  expect(setTimeout).toBeCalled();
  expect(instance._clearInactivePlayer).not.toBeCalled();
});

it('AudioPlayer calls _startPlayer - player canPlay', () => {
  setTimeout.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    play: jest.fn((cb) => {
      cb();
    }),
    canPrepare: false,
    canPlay: true,
    duration: 10001,
    on: jest.fn((event, cb) => {
      if (event === 'pause') {
        cb();
      }
      return this;
    }),
    isPaused: false,
  };
  instance._getProgressTimer = jest.fn();
  instance._getPlayTimer = jest.fn();
  instance._clearInactivePlayer = jest.fn();
  instance._startPlayer();
  expect(tree.state().playButtonDisabled).toBe(true);
  expect(tree.state().duration).toBe(10001);
  expect(tree.state().playing).toBe(true);
  expect(tree.state().loadingAudio).toBe(false);
  expect(instance._getPlayTimer).toBeCalled();
  jest.runOnlyPendingTimers();
  expect(setTimeout).toBeCalled();
  expect(instance._clearInactivePlayer).not.toBeCalled();
});

it('AudioPlayer calls _startPlayer - player isPaused', () => {
  setTimeout.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    play: jest.fn((cb) => {
      cb();
    }),
    canPrepare: false,
    canPlay: false,
    duration: 10001,
    on: jest.fn((event, cb) => {
      if (event === 'pause') {
        cb();
      }
      return this;
    }),
    isPaused: true,
  };
  instance._getProgressTimer = jest.fn();
  instance._getPlayTimer = jest.fn();
  instance._clearInactivePlayer = jest.fn();
  instance._startPlayer();
  expect(tree.state().playButtonDisabled).toBe(true);
  expect(tree.state().loadingAudio).toBe(false);
  expect(instance._getPlayTimer).toBeCalled();
  jest.runOnlyPendingTimers();
  expect(setTimeout).toBeCalled();
  expect(instance._clearInactivePlayer).toBeCalled();
});

it('AudioPlayer calls _startPlayer - player on error', () => {
  setTimeout.mockClear();
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance.player = {
    play: jest.fn((cb) => {
      cb();
    }),
    canPrepare: false,
    canPlay: false,
    duration: 10001,
    on: jest.fn((event, cb) => {
      if (event === 'error') {
        cb();
      }
      return this;
    }),
    isPaused: false,
  };
  instance._clearInactivePlayer = jest.fn();
  instance._startPlayer();
  expect(instance._clearInactivePlayer).toBeCalled();
});

it('VideoPlayer calls _deleteMessage, alert with "no" option', () => {
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance._deleteMessage();
  expect(Alert.alert).toBeCalled();
  expect(deleteMessage).not.toBeCalled();
});

it('VideoPlayer calls _deleteMessage, alert with "yes" option', () => {
  Alert.alert = jest.fn((str1, str2, arr) => {
    arr[1].onPress();
  });
  const tree = shallow(<AudioPlay {...props} />);
  const instance = tree.instance();
  instance._deleteMessage();
  expect(Alert.alert).toBeCalled();
  expect(deleteMessage).toBeCalled();
});

it('VideoPlayer calls _deleteMessage, alert with "yes" option, default prop', () => {
  Alert.alert = jest.fn((str1, str2, arr) => {
    arr[1].onPress();
  });
  const tree = shallow(
    <AudioPlay audioFile={audioFile} showPlayer={true} showDelete={true} position="right" />,
  );
  const instance = tree.instance();
  instance._deleteMessage();
  expect(Alert.alert).toBeCalled();
});

/* --------------------Simulations --------------------------- */
it('onPress start button', () => {
  const tree = shallow(<AudioPlay {...props} position="right" />);
  tree.setState({ playButtonDisabled: false, loadingAudio: false });
  const instance = tree.instance();
  instance._startPlayer = jest.fn();
  const playButton = tree.find('TouchableOpacity').first();
  playButton.props().onPress();
  expect(instance._startPlayer).toBeCalled();
});

it('loadingAudio', () => {
  const tree = shallow(<AudioPlay {...props} position="right" />);
  tree.setState({ loadingAudio: true });
  const icon = tree.find({ name: 'timer-sand' }).first();
  expect(icon.props().color).toBe(Colors.AUDIO_ICON_RIGHT);
});

it('onPress pause button', () => {
  const tree = shallow(<AudioPlay {...props} position="right" />);
  tree.setState({ playButtonDisabled: true, loadingAudio: false });
  const instance = tree.instance();
  instance._pause = jest.fn();
  const pauseButton = tree.find('TouchableOpacity').first();
  pauseButton.props().onPress();
  expect(instance._pause).toBeCalled();
});

it('onValueChange of a slider', () => {
  const tree = shallow(<AudioPlay {...props} position="right" />);
  const instance = tree.instance();
  instance._seek = jest.fn();
  const slider = tree.find('Slider').first();
  slider.props().onValueChange(0.78);
  expect(instance._seek).toBeCalledWith(0.78);
});

it('onValueChange of a slider', () => {
  const tree = shallow(<AudioPlay {...props} position="right" showDelete={true} />);
  const instance = tree.instance();
  instance._deleteMessage = jest.fn();
  const deleteButton = tree.find('TouchableOpacity').last();
  deleteButton.props().onPress();
  expect(instance._deleteMessage).toBeCalled();
});
