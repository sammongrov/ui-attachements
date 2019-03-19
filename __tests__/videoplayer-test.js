import React from 'react';
import renderer from 'react-test-renderer';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Actions } from 'react-native-router-flux';
import { Dimensions, Alert } from 'react-native';
import VideoPlayer from '../VideoPlayer';
import AppUtil from '@utils';

configure({ adapter: new Adapter() });

jest.mock('react-native-router-flux', () => ({
  Actions: {
    currentScene: 'VideoPreviewScene',
    pop: jest.fn(),
  },
}));

jest.mock('@utils', () => ({
  debug: jest.fn(),
}));

jest.mock('Dimensions', () => ({
  get: () => ({ width: 360, height: 720 }),
}));

jest.mock('Alert', () => ({
  alert: jest.fn((str1, str2, arr) => {
    arr[0].onPress();
  }),
}));

jest.mock('react-native-video', () => {
  /* eslint-disable */
  const React = require('React');
  const PropTypes = require('prop-types');
  return class MockVideo extends React.Component {
    static propTypes = { children: PropTypes.any };

    static defaultProps = { children: '' };

    render() {
      return React.createElement('Video', this.props, this.props.children);
    }
    /* eslint-enable */
  };
});

const videoUrl = 'https://funny-videos.com/user123/video345.mpg4';
const showSend = true;
const showDelete = true;
const onSuccessAction = jest.fn();
const deleteMessage = jest.fn();
const props = { videoUrl, showSend, showDelete, onSuccessAction, deleteMessage };

beforeEach(() => {
  jest.resetModules();
});

/* ------------------------- Snapshots ----------------------- */

it('VideoPlayer renders correctly without props', () => {
  const tree = renderer.create(<VideoPlayer />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('VideoPlayer renders correctly with props', () => {
  const tree = renderer.create(<VideoPlayer {...props} />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('videoUrl is set', () => {
  const tree = shallow(<VideoPlayer {...props} />);
  expect(tree.state().videoUrl).toMatch(videoUrl);
});

/* ------------------- component methods --------------------- */

it('VideoPlayer calls onLoadStart', () => {
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.onLoadStart();
  expect(tree.state().isLoading).toBe(true);
});

it('VideoPlayer calls onLoad', () => {
  const duration = 321;
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.onLoad({ duration });
  expect(tree.state().isLoading).toBe(false);
  expect(tree.state().duration).toBe(duration);
  expect(tree.state().showPlayPause).toBe(false);
});

it('VideoPlayer calls onProgress', () => {
  const currentTime = 12;
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.onProgress({ currentTime });
  expect(tree.state().currentTime).toBe(currentTime);
});

it('VideoPlayer calls onSeek', () => {
  const currentTime = 15;
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.onSeek({ currentTime });
  expect(tree.state().currentTime).toBe(currentTime);
});

it('VideoPlayer calls onEnd', () => {
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.player = { seek: jest.fn() };
  instance.onEnd();
  expect(instance.player.seek).toBeCalledWith(0);
  expect(tree.state().navbar).toBe(true);
  expect(tree.state().paused).toBe(true);
  expect(tree.state().showPlayPause).toBe(true);
});

it('VideoPlayer calls onBuffer', () => {
  const isBuffering = true;
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.onBuffer({ isBuffering });
  expect(tree.state().isBuffering).toBe(isBuffering);
});

it('VideoPlayer calls getOrientation - a portrait', () => {
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.getOrientation();
  expect(tree.state().orientation).toMatch('portrait');
});

it('VideoPlayer calls getOrientation - a landscape', () => {
  Dimensions.get = jest.fn(() => ({ width: 720, height: 360 }));
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.getOrientation();
  expect(tree.state().orientation).toMatch('landscape');
});

it('VideoPlayer calls _pause', () => {
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance._pause();
  expect(tree.state().paused).toBe(true);
  expect(tree.state().showPlayPause).toBe(true);
  expect(tree.state().navbar).toBe(true);
});

it('VideoPlayer calls _play', () => {
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance._play();
  expect(tree.state().paused).toBe(false);
  expect(tree.state().showPlayPause).toBe(false);
  expect(tree.state().navbar).toBe(false);
});

it('VideoPlayer calls _seek with no player', () => {
  const percentage = 0.55;
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.player = null;
  instance._seek(percentage);
  expect(tree.state().duration).toBe(0.0);
});

it('VideoPlayer calls _seek with a player', () => {
  const percentage = 0.55;
  const duration = 120;
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.player = { seek: jest.fn() };
  instance.onLoad({ duration });
  instance._seek(percentage);
  expect(instance.player.seek).toBeCalledWith(percentage * Number.parseFloat(duration));
});

it('VideoPlayer calls togglePlayPause when it plays', () => {
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance._play();
  instance.togglePlayPause();
  expect(tree.state().paused).toBe(true);
  expect(tree.state().showPlayPause).toBe(true);
  expect(tree.state().navbar).toBe(true);
});

it('VideoPlayer calls togglePlayPause when it is paused', () => {
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance._pause();
  instance.togglePlayPause();
  expect(tree.state().paused).toBe(false);
  expect(tree.state().showPlayPause).toBe(false);
  expect(tree.state().navbar).toBe(false);
});

it('VideoPlayer calls PreviewSuccess', () => {
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.PreviewSuccess();
  expect(onSuccessAction).toBeCalled();
});

it('VideoPlayer calls videoError', () => {
  const error = new Error('video error');
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance.videoError(error);
  expect(AppUtil.debug).toBeCalled();
});

it('VideoPlayer calls getTimerString', () => {
  const timeInSeconds0 = 0;
  const timeInSeconds1 = 5;
  const timeInSeconds2 = 42;
  const timeInSeconds3 = 77;
  const timeInSeconds4 = 723;
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  const result0 = instance.getTimerString(timeInSeconds0);
  const result1 = instance.getTimerString(timeInSeconds1);
  const result2 = instance.getTimerString(timeInSeconds2);
  const result3 = instance.getTimerString(timeInSeconds3);
  const result4 = instance.getTimerString(timeInSeconds4);
  expect(result0).toMatch('00:00');
  expect(result1).toMatch('00:05');
  expect(result2).toMatch('00:42');
  expect(result3).toMatch('01:17');
  expect(result4).toMatch('12:03');
});

it('VideoPlayer calls getCurrentProgress', () => {
  const currentTime = 273.61;
  const duration1 = 699;
  const duration2 = 0;
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  const result1 = instance.getCurrentProgress(currentTime, duration1);
  const result2 = instance.getCurrentProgress(currentTime, duration2);
  expect(result1).toBe(currentTime / duration1);
  expect(result2).toBe(duration2);
});

it('VideoPlayer calls _deleteMessage, alert with "no" option', () => {
  Actions.pop.mockClear();
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance._deleteMessage();
  expect(Alert.alert).toBeCalled();
  expect(deleteMessage).not.toBeCalled();
  expect(Actions.pop).not.toBeCalled();
});

it('VideoPlayer calls _deleteMessage, alert with "yes" option', () => {
  Actions.pop.mockClear();
  Alert.alert = jest.fn((str1, str2, arr) => {
    arr[1].onPress();
  });
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  instance._deleteMessage();
  expect(Alert.alert).toBeCalled();
  expect(deleteMessage).toBeCalled();
  expect(Actions.pop).toBeCalled();
});

/* ------------------------Simulations ----------------------- */

describe('VideoPlayer rendersMediaControls for Android', () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'android';
    return Platform;
  });

  it('onPress of a play button', () => {
    const tree = shallow(<VideoPlayer {...props} />);
    const instance = tree.instance();
    instance._play = jest.fn();
    tree.setState({ showPlayPause: true, paused: true });
    const playButton = tree.find('TouchableOpacity').last();
    playButton.props().onPress();
    expect(instance._play).toBeCalled();
  });

  it('onPress of a pause button', () => {
    const tree = shallow(<VideoPlayer {...props} />);
    const instance = tree.instance();
    instance._pause = jest.fn();
    tree.setState({ showPlayPause: true, paused: false });
    const pauseButton = tree.find('TouchableOpacity').last();
    pauseButton.props().onPress();
    expect(instance._pause).toBeCalled();
  });

  it('onValueChange of a progress slider', () => {
    const seekPercentage = 0.69854;
    const tree = shallow(<VideoPlayer {...props} />);
    const instance = tree.instance();
    instance._seek = jest.fn();
    const slider = tree.find('Slider').first();
    slider.props().onValueChange(seekPercentage);
    expect(instance._seek).toBeCalledWith(seekPercentage);
  });
});

it('ios platform', () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'ios';
    return Platform;
  });
  const tree = shallow(<VideoPlayer {...props} />);
  const instance = tree.instance();
  expect(instance.renderMediaControls()).toBeNull();
});

it('onPress of a send button from VideoPreviewScene', () => {
  onSuccessAction.mockClear();
  const tree = shallow(<VideoPlayer {...props} showSend={true} showDelete={false} />);
  const sendButton = tree
    .find('NavBar')
    .shallow()
    .find({ name: 'send' })
    .parent();
  sendButton.props().onPress();
  expect(onSuccessAction).toBeCalled();
});

it('onPress of a send button from other scene', () => {
  onSuccessAction.mockClear();
  Actions.currentScene = 'ChatList';
  const tree = shallow(<VideoPlayer {...props} showSend={true} showDelete={false} />);
  const sendButton = tree
    .find('NavBar')
    .shallow()
    .find({ name: 'send' })
    .parent();
  sendButton.props().onPress();
  expect(onSuccessAction).not.toBeCalled();
});

it('onPress of a delete button from VideoPreviewScene', () => {
  Actions.currentScene = 'VideoPreviewScene';
  const tree = shallow(<VideoPlayer {...props} showSend={false} showDelete={true} />);
  const instance = tree.instance();
  instance._deleteMessage = jest.fn();
  const deleteButton = tree
    .find('NavBar')
    .shallow()
    .find({ name: 'trash-o' })
    .parent();
  deleteButton.props().onPress();
  expect(instance._deleteMessage).toBeCalled();
});

it('onPress of a delete button from other scene', () => {
  Actions.currentScene = 'ChatList';
  const tree = shallow(<VideoPlayer {...props} showSend={false} showDelete={true} />);
  const instance = tree.instance();
  instance._deleteMessage = jest.fn();
  const deleteButton = tree
    .find('NavBar')
    .shallow()
    .find({ name: 'trash-o' })
    .parent();
  deleteButton.props().onPress();
  expect(instance._deleteMessage).not.toBeCalled();
});

it('onPress of a back navbar button from VideoPreviewScene', () => {
  Actions.currentScene = 'VideoPreviewScene';
  Actions.pop.mockClear();
  const tree = shallow(<VideoPlayer {...props} showSend={false} showDelete={true} />);
  const backButton = tree
    .find('NavBar')
    .shallow()
    .find({ name: 'chevron-left' })
    .parent();
  backButton.props().onPress();
  expect(Actions.pop).toBeCalled();
});

it('onPress of a back navbar button from other scene', () => {
  Actions.currentScene = 'ChatList';
  Actions.pop.mockClear();
  const tree = shallow(<VideoPlayer {...props} showSend={false} showDelete={true} />);
  const backButton = tree
    .find('NavBar')
    .shallow()
    .find({ name: 'chevron-left' })
    .parent();
  backButton.props().onPress();
  expect(Actions.pop).not.toBeCalled();
});

it('onLayout is called', () => {
  const tree = shallow(<VideoPlayer {...props} showSend={false} showDelete={true} />);
  const instance = tree.instance();
  instance.getOrientation = jest.fn();
  const view = tree.find('Screen').childAt(0);
  view.props().onLayout();
  expect(instance.getOrientation).toBeCalled();
});
