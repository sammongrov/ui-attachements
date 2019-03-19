import React from 'react';
import renderer from 'react-test-renderer';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Actions } from 'react-native-router-flux';
import AttachAudio from '../AttachAudio';

configure({ adapter: new Adapter() });

jest.mock('react-native-router-flux', () => ({
  Actions: {
    refresh: jest.fn(),
  },
}));

jest.mock('react-native-audio-toolkit', () => {
  function MockRecorder() {
    this.destroy = jest.fn();
    this.prepare = jest.fn((cb) => {
      cb(null, '//records/audio1.mp4');
      return this;
    });
    this.record = jest.fn((cb) => {
      cb(null);
      return this;
    });
    this.stop = jest.fn((cb) => {
      cb(null);
    });
    this.isRecording = true;
  }
  return { Recorder: MockRecorder };
});

const Audio = require('react-native-audio-toolkit');

const { Recorder } = Audio;

jest.useFakeTimers();

beforeEach(() => {
  jest.resetModules();
});

/* ------------------------- Snapshots ----------------------- */
it('AttachAudio renders correctly', () => {
  const tree = renderer.create(<AttachAudio />).toJSON();
  expect(tree).toMatchSnapshot();
});

/* ------------------- component methods --------------------- */

it('AttachAudio willMount', () => {
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  expect(instance.recorder).toBeInstanceOf(Recorder);
});

it('AttachAudio willUnmount and destroys recorder', () => {
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  tree.unmount();
  expect(clearInterval).toBeCalled();
  expect(instance.recorder.destroy).toBeCalled();
});

it('AttachAudio willUnmount - no recorder', () => {
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder = null;
  tree.unmount();
  expect(clearInterval).toBeCalled();
});

it('AttachAudio calls _reloadRecorder - old recorder is present', () => {
  setInterval.mockClear();
  const tree = shallow(<AttachAudio />);
  tree.setState({ recordTime: 101 });
  const instance = tree.instance();
  instance.recorder = new Recorder('testAudio.mp4', {});
  instance._reloadRecorder();
  expect(instance.recorder.prepare).toBeCalled();
  expect(instance.recorder.record).toBeCalled();
  expect(setInterval).toBeCalled();
  expect(tree.state().filePath).toMatch('//records/audio1.mp4');
  jest.advanceTimersByTime(1000);
  expect(tree.state().recordTime).toBe(103);
});

it('AttachAudio calls _reloadRecorder - record time > 300', () => {
  setInterval.mockClear();
  const tree = shallow(<AttachAudio />);
  tree.setState({ recordTime: 303 });
  const instance = tree.instance();
  instance.cancelRecord = jest.fn();
  instance._reloadRecorder();
  jest.advanceTimersByTime(1000);
  expect(tree.state().recordTime).toBe(303);
  expect(instance.cancelRecord).toBeCalled();
});

it('AttachAudio calls sendRecord - no recorder', () => {
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder = null;
  const result = instance.sendRecord();
  expect(result).toBeUndefined();
});

it('AttachAudio calls sendRecord - the recorder is not recording', () => {
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder.isRecording = false;
  const result = instance.sendRecord();
  expect(result).toBeUndefined();
});

it('AttachAudio calls sendRecord - ios', () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'ios';
    return Platform;
  });
  Actions.refresh.mockClear();
  const filePath = '//records/audio1.mp4';
  const args = {
    attachAudio: false,
    dataToUpload: {
      uri: filePath,
    },
    imageCaption: 'Audio Message',
  };
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder.isRecording = true;
  instance.sendRecord();
  expect(Actions.refresh).toBeCalledWith(args);
});

it('AttachAudio calls sendRecord - android', () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'android';
    return Platform;
  });
  Actions.refresh.mockClear();
  const filePath = '//records/audio1.mp4';
  const args = {
    attachAudio: false,
    dataToUpload: {
      uri: `file://${filePath}`,
    },
    imageCaption: 'Audio Message',
  };
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder.isRecording = true;
  instance.sendRecord();
  expect(Actions.refresh).toBeCalledWith(args);
});

it('AttachAudio calls sendRecord and destroy recorder', () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'android';
    return Platform;
  });
  const error = new Error('cannot stop the recorder');
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder.destroy.mockClear();
  instance.recorder.isRecording = true;
  instance.recorder.stop = jest.fn((cb) => {
    cb(error);
  });
  instance.sendRecord();
  expect(instance.recorder.destroy).toBeCalled();
});

it('AttachAudio calls sendRecord and recorder is already destroyed', () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'android';
    return Platform;
  });
  const error = new Error('cannot stop the recorder');
  const destroy = jest.fn();
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder.destroy = destroy;
  instance.recorder.isRecording = true;
  instance.recorder.stop = jest.fn((cb) => {
    instance.recorder = null;
    cb(error);
  });
  instance.sendRecord();
  expect(destroy).not.toBeCalled();
});

it('AttachAudio calls cancelRecord - no recorder', () => {
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder = null;
  const result = instance.cancelRecord();
  expect(result).toBeUndefined();
});

it('AttachAudio calls cancelRecord - the recorder is not recording', () => {
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder.isRecording = false;
  const result = instance.cancelRecord();
  expect(result).toBeUndefined();
});

it('AttachAudio calls cancelRecord', () => {
  Actions.refresh.mockClear();
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder.isRecording = true;
  instance.cancelRecord();
  expect(Actions.refresh).toBeCalledWith({ attachAudio: false });
});

it('AttachAudio calls cancelRecord and destroy recorder', () => {
  const error = new Error('cannot stop the recorder');
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder.destroy.mockClear();
  instance.recorder.isRecording = true;
  instance.recorder.stop = jest.fn((cb) => {
    cb(error);
  });
  instance.cancelRecord();
  expect(instance.recorder.destroy).toBeCalled();
});

it('AttachAudio calls cancelRecord and recorder is already destroyed', () => {
  const error = new Error('cannot stop the recorder');
  const destroy = jest.fn();
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.recorder.destroy = destroy;
  instance.recorder.isRecording = true;
  instance.recorder.stop = jest.fn((cb) => {
    instance.recorder = null;
    cb(error);
  });
  instance.cancelRecord();
  expect(destroy).not.toBeCalled();
});

it('onPress of a cancel record button', () => {
  const tree = shallow(<AttachAudio />);
  tree.setState({ recordTime: 616 });
  const instance = tree.instance();
  instance.cancelRecord = jest.fn();
  const cancelButton = tree.find('TouchableOpacity').first();
  cancelButton.props().onPress();
  expect(instance.cancelRecord).toBeCalled();
});

it('onPress of a send record button', () => {
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance.sendRecord = jest.fn();
  const sendButton = tree.find('TouchableOpacity').last();
  sendButton.props().onPress();
  expect(instance.sendRecord).toBeCalled();
});

// call it the last
it('AttachAudio calls _reloadRecorder - an error in prepare', () => {
  jest.resetModules();
  jest.unmock('react-native-audio-toolkit');
  Audio.Recorder = function() {
    const error = new Error('recorder error');
    this.destroy = jest.fn();
    this.prepare = jest.fn((cb) => {
      cb(error, null);
      return this;
    });
    this.record = jest.fn((cb) => {
      cb(error);
      return this;
    });
    this.stop = jest.fn();
    this.isRecording = false;
  };
  setInterval.mockClear();
  const tree = shallow(<AttachAudio />);
  const instance = tree.instance();
  instance._reloadRecorder();
  expect(instance.recorder.prepare).toBeCalled();
  expect(tree.state().filePath).toBe('');
  expect(Actions.refresh).toBeCalledWith({ attachAudio: false });
  expect(setInterval).not.toBeCalled();
});
