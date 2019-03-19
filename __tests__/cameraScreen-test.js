import React from 'react';
import { Actions } from 'react-native-router-flux';
import { PermissionsAndroid } from 'react-native';
import { shallow, configure } from 'enzyme';
import renderer from 'react-test-renderer';
import Adapter from 'enzyme-adapter-react-16';
import CameraScreen from '../CameraScreen';

configure({ adapter: new Adapter() });

jest.mock('react-native-router-flux', () => ({
  Actions: {
    ImagePreview: jest.fn(),
    popTo: jest.fn(),
    refresh: jest.fn(),
    VideoPreview: jest.fn(),
    currentScene: 'CameraScreenScene',
  },
}));

jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      VideoQuality: ['480p'],
    },
  },
}));

jest.mock('PermissionsAndroid', () => {
  const permissionsAndroid = {
    requestMultiple: jest.fn(() => Promise.resolve(true)),
    request: jest.fn(() => Promise.resolve(true)),
    PERMISSIONS: {
      RECORD_AUDIO: true,
      WRITE_EXTERNAL_STORAGE: true,
    },
  };
  return permissionsAndroid;
});

jest.mock('../../ui-components/Camera', () => {
  /* eslint-disable */
  const React = require('React');
  const PropTypes = require('prop-types');
  class MockCamera extends React.Component {
    static propTypes = { children: PropTypes.any };

    static defaultProps = { children: '' };

    render() {
      return React.createElement('CameraRollPicker', this.props, this.props.children);
    }
    /* eslint-enable */
  }
  return MockCamera;
});

const goBack = jest.fn();
const onSuccessAction = jest.fn();
const groupDetail = {
  _id: 'XT87kg1',
  name: 'furious',
  title: 'Not Fast, Just Furious',
  unread: 21,
};

jest.useFakeTimers();

beforeEach(() => {
  jest.resetModules();
});

it('onCameraPress is called', () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );

  const inst = cameraScreen.instance();
  inst.takePicture = jest.fn();
  const camera = cameraScreen.find('MockCamera').first();
  camera.props().onCameraPress();

  expect(Actions.currentScene).toBe('CameraScreenScene');
  expect(inst.takePicture).toBeCalled();
});

it('onCameraPress is called with else case', () => {
  Actions.currentScene = '';

  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  cameraScreen.setState({ hasImage: true });
  cameraScreen.update();

  const inst = cameraScreen.instance();
  inst.takePicture = jest.fn();
  const camera = cameraScreen.find('MockCamera').first();
  camera.props().onCameraPress();

  expect(Actions.currentScene).toBe('');
  expect(inst.takePicture).not.toBeCalled();
});

it('videoRecord if case', async () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );

  const inst = cameraScreen.instance();
  inst.checkVideoPermission = jest.fn();
  inst.takeVideo = jest.fn();
  inst.stopRecording = jest.fn();
  const camera = cameraScreen.find('MockCamera').first();
  await camera.props().videoRecord();

  expect(inst.checkVideoPermission).toBeCalled();
  expect(cameraScreen.state().isRecording).toBe(false);
  expect(inst.takeVideo).toBeCalled();
});

it('videoRecord else case', async () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  cameraScreen.setState({ isRecording: true });
  cameraScreen.update();
  const inst = cameraScreen.instance();
  inst.checkVideoPermission = jest.fn();
  inst.takeVideo = jest.fn();
  inst.stopRecording = jest.fn();
  const camera = cameraScreen.find('MockCamera').first();
  await camera.props().videoRecord();

  expect(inst.checkVideoPermission).toBeCalled();
  expect(cameraScreen.state().isRecording).toBe(true);
  expect(inst.stopRecording).toBeCalled();
});

it('refs prop', () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );

  const inst = cameraScreen.instance();
  const camera = cameraScreen.find('MockCamera').first();
  expect(camera).toHaveLength(1);
  camera.props().refs({});
  expect(inst.camera).toEqual({});
});

it('checkVideoPermission, Platform.OS = android', async () => {
  jest.doMock('Platform', () => {
    const platform = {
      OS: 'android',
      Version: 25,
    };
    return platform;
  });

  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  expect.assertions(1);
  await inst.checkVideoPermission();

  expect(PermissionsAndroid.requestMultiple).toBeCalled();
});

it('checkVideoPermission, Platform.OS = ios', async () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'ios';
    return Platform;
  });

  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  expect.assertions(1);
  await inst.checkVideoPermission();

  expect(PermissionsAndroid.requestMultiple).not.toBeCalled();
});

it('toggleFacing = back', () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );

  const inst = cameraScreen.instance();
  inst.toggleFacing();

  expect(cameraScreen.state().type).toBe('front');
});

it('toggleFacing = front', () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );

  cameraScreen.setState({ type: 'front' });
  cameraScreen.update();

  const inst = cameraScreen.instance();
  inst.toggleFacing();

  expect(cameraScreen.state().type).toBe('back');
});

it('toggleFlash, flash = off', () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );

  const inst = cameraScreen.instance();
  inst.toggleFlash();

  expect(cameraScreen.state().flash).toBe('on');
});

it('toggleFlash, flash = on', () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  cameraScreen.setState({ flash: 'on' });
  cameraScreen.update();

  const inst = cameraScreen.instance();
  inst.toggleFlash();

  expect(cameraScreen.state().flash).toBe('auto');
});

it('CameraScreen calls takeVideo', () => {
  setInterval.mockClear();
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  cameraScreen.setState({ timer: 500 });
  const inst = cameraScreen.instance();
  inst.startRecording = jest.fn();
  inst.stopRecording = jest.fn();
  inst.takeVideo();
  expect(inst.startRecording).toBeCalled();
  expect(setInterval).toBeCalled();
  // after 1 sec
  jest.advanceTimersByTime(1000);
  expect(cameraScreen.state().timer).toBe(499);
  // after 12 sec
  cameraScreen.setState({ timer: 0 });
  cameraScreen.update();
  inst.takeVideo();
  jest.advanceTimersByTime(12000);
  expect(inst.stopRecording).toBeCalled();
  expect(clearInterval).toBeCalled();
});

it('CameraScreen calls takePicture - this.camera is truthy, first if case', async () => {
  const dataToUpload = {
    uri: '//camera/photos/image-1112.jpg',
  };
  Actions.currentScene = 'CameraScreenScene';
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  inst.camera = {
    takePictureAsync: jest.fn(() => Promise.resolve(dataToUpload)),
  };
  Actions.popTo.mockClear();
  Actions.refresh.mockClear();
  setTimeout.mockClear();
  Actions.ImagePreview = jest.fn((obj) => {
    obj.onSuccessAction('my cool image');
  });
  expect.assertions(6);
  await inst.takePicture();
  expect(inst.camera.takePictureAsync).toBeCalled();
  expect(Actions.ImagePreview).toBeCalled();
  expect(cameraScreen.state().hasImage).toBe(true);
  expect(Actions.popTo).toBeCalledWith('ChatRoomScene');
  expect(setTimeout).toBeCalled();
  jest.runOnlyPendingTimers();
  expect(Actions.refresh).toBeCalled();
});

it('CameraScreen calls takePicture - this.camera is truthy, second if case', async () => {
  const dataToUpload = {
    uri: '//camera/photos/image-1112.jpg',
  };
  Actions.currentScene = 'ReplyCameraScreenScene';
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  inst.camera = {
    takePictureAsync: jest.fn(() => Promise.resolve(dataToUpload)),
  };
  Actions.ImagePreview.mockClear();
  Actions.popTo.mockClear();
  Actions.refresh.mockClear();
  setTimeout.mockClear();
  Actions.ImagePreview = jest.fn((obj) => {
    obj.onSuccessAction('my cool image');
  });
  expect.assertions(6);
  await inst.takePicture();
  expect(inst.camera.takePictureAsync).toBeCalled();
  expect(Actions.ImagePreview).toBeCalled();
  expect(cameraScreen.state().hasImage).toBe(true);
  expect(Actions.popTo).toBeCalledWith('ReplyMessageScene');
  expect(setTimeout).toBeCalled();
  jest.runOnlyPendingTimers();
  expect(Actions.refresh).toBeCalled();
});

it('CameraScreen calls takePicture - this.camera is null', async () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  inst.camera = null;
  Actions.ImagePreview = jest.fn();
  expect.assertions(1);
  await inst.takePicture();
  expect(Actions.ImagePreview).not.toBeCalled();
});

it('CameraScreen calls startRecording - this.camera is truthy, first if case', async () => {
  const dataToUpload = {
    uri: '//camera/videos/recording-1113.mp4',
  };
  Actions.currentScene = 'CameraScreenScene';

  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  inst.camera = {
    recordAsync: jest.fn(() => Promise.resolve(dataToUpload)),
  };
  Actions.popTo.mockClear();
  Actions.refresh.mockClear();
  Actions.VideoPreview.mockClear();
  setTimeout.mockClear();
  Actions.VideoPreview = jest.fn((obj) => {
    obj.onSuccessAction('my cool image');
  });
  expect.assertions(6);
  await inst.startRecording();
  expect(inst.camera.recordAsync).toBeCalled();
  expect(Actions.VideoPreview).toBeCalled();
  expect(Actions.popTo).toBeCalledWith('ChatRoomScene');
  expect(setTimeout).toBeCalled();
  jest.runOnlyPendingTimers();
  expect(Actions.refresh).toBeCalledWith({
    dataToUpload,
    imageCaption: 'Video Message',
  });
  expect(cameraScreen.state().isRecording).toBe(true);
});

/*
it('CameraScreen calls startRecording - this.camera is truthy, first if case, onSuccessAction default props', async () => {
  const dataToUpload = {
    uri: '//camera/videos/recording-1113.mp4',
  };
  Actions.currentScene = 'CameraScreenScene';

  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  inst.camera = {
    recordAsync: jest.fn(() => Promise.resolve(dataToUpload)),
  };
  Actions.popTo.mockClear();
  Actions.refresh.mockClear();
  Actions.VideoPreview.mockClear();
  setTimeout.mockClear();
  Actions.VideoPreview = jest.fn((obj) => {
    obj.onSuccessAction('my cool image');
  });
  expect.assertions(6);
  await inst.startRecording();
  expect(inst.camera.recordAsync).toBeCalled();
  expect(Actions.VideoPreview).toBeCalled();
  expect(Actions.popTo).toBeCalledWith('ChatRoomScene');
  expect(setTimeout).toBeCalled();
  jest.runOnlyPendingTimers();
  expect(Actions.refresh).toBeCalledWith({
    dataToUpload,
    imageCaption: 'Video Message',
  });
  expect(cameraScreen.state().isRecording).toBe(true);
});
*/

it('CameraScreen calls startRecording - this.camera is truthy, second if case', async () => {
  const dataToUpload = {
    uri: '//camera/videos/recording-1113.mp4',
  };
  Actions.currentScene = 'ReplyCameraScreenScene';

  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  inst.camera = {
    recordAsync: jest.fn(() => Promise.resolve(dataToUpload)),
  };
  Actions.popTo.mockClear();
  Actions.refresh.mockClear();
  Actions.VideoPreview.mockClear();
  setTimeout.mockClear();
  Actions.VideoPreview = jest.fn((obj) => {
    obj.onSuccessAction('my cool image');
  });
  expect.assertions(6);
  await inst.startRecording();
  expect(inst.camera.recordAsync).toBeCalled();
  expect(Actions.VideoPreview).toBeCalled();
  expect(Actions.popTo).toBeCalledWith('ReplyMessageScene');
  expect(setTimeout).toBeCalled();
  jest.runOnlyPendingTimers();
  expect(Actions.refresh).toBeCalledWith({
    dataToUpload,
    imageCaption: 'Video Message',
  });
  expect(cameraScreen.state().isRecording).toBe(true);
});

it('CameraScreen calls startRecording - this.camera is null', async () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  inst.camera = null;
  Actions.VideoPreview = jest.fn();
  expect.assertions(1);
  await inst.startRecording();
  expect(Actions.VideoPreview).not.toBeCalled();
});

it('CameraScreen calls stopRecording - this.camera is truthy', () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  const inst = cameraScreen.instance();
  inst.camera = {
    stopRecording: jest.fn(),
  };
  inst.stopRecording();
  expect(inst.camera.stopRecording).toBeCalled();
  expect(cameraScreen.state().isRecording).toBe(false);
  expect(cameraScreen.state().timer).toBe(0);
});

it('CameraScreen calls stopRecording - this.camera is null', () => {
  const cameraScreen = shallow(
    <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
  );
  cameraScreen.setState({ isRecording: true, timer: 999 });
  const inst = cameraScreen.instance();
  inst.camera = null;
  inst.stopRecording();
  expect(cameraScreen.state().isRecording).toBe(true);
  expect(cameraScreen.state().timer).toBe(999);
});

/* ---------- Snapshots ------------ */
it('CameraScreen renders correctly with props', () => {
  const tree = renderer
    .create(
      <CameraScreen goBack={goBack} onSuccessAction={onSuccessAction} groupDetail={groupDetail} />,
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});
