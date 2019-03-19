import React from 'react';
import renderer from 'react-test-renderer';
import { shallow, configure } from 'enzyme';
/* eslint-disable */
import { Dimensions } from 'react-native';
import CameraRollPicker from 'react-native-camera-roll-picker';
/* eslint-enable */
import Adapter from 'enzyme-adapter-react-16';
import { Actions } from 'react-native-router-flux';
import PhotoLibrary from '../PhotoLibrary';

configure({ adapter: new Adapter() });
// const onConfirmServer = jest.fn();

jest.mock('react-native-camera-roll-picker', () => {
  /* eslint-disable */
  const React = require('React');
  const PropTypes = require('prop-types');
  return class MockCameraRollPicker extends React.Component {
    static propTypes = { children: PropTypes.any };

    static defaultProps = { children: '' };

    render() {
      return React.createElement('CameraRollPicker', this.props, this.props.children);
    }
    /* eslint-enable */
  };
});

jest.mock('react-native-router-flux', () => ({
  Actions: {
    ImagePreview: jest.fn((data) => {
      data.onSuccessAction();
    }),
    popTo: jest.fn(),
    refresh: jest.fn(),
    currentScene: 'PhotoLibraryScene',
    pop: jest.fn(),
  },
}));

jest.mock('Dimensions', () => ({
  get: () => ({ width: 720, height: 360 }),
}));

jest.useFakeTimers();

it('render correctly with props', () => {
  const tree = renderer.create(<PhotoLibrary />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('initial state is set', () => {
  const root = shallow(<PhotoLibrary />);
  expect(root.state().layout.width).toBe(720);
});

it('Navbar onPress calls Actions.pop', () => {
  Actions.currentScene = 'PhotoLibraryScene';
  const root = shallow(<PhotoLibrary />);
  const button = root
    .find('NavBar')
    .shallow()
    .find('TouchableOpacity');
  button.props().onPress();
  expect(Actions.pop.mock.calls.length).toBe(1);
});

it('Navbar onPress does not calls Actions.pop', () => {
  Actions.currentScene = 'ChatList';
  Actions.pop.mockClear();
  const root = shallow(<PhotoLibrary />);
  const button = root
    .find('NavBar')
    .shallow()
    .find('TouchableOpacity');
  button.props().onPress();
  expect(Actions.pop.mock.calls.length).toBe(0);
});

it('photolibrary, CameraRollPicker first if case', () => {
  const dataToUpload = {
    uri: '/image/image-1.jpg',
  };
  const images = true;
  const imageCaption = 'my cool image';

  Actions.currentScene = 'PhotoLibraryScene';
  Actions.refresh.mockClear();
  Actions.popTo.mockClear();
  setTimeout.mockClear();
  Actions.ImagePreview = jest.fn((obj) => {
    obj.onSuccessAction(imageCaption);
  });

  const rootComponent = shallow(<PhotoLibrary />);
  const authorInputComponent = rootComponent.find({ assetType: 'All' });
  authorInputComponent.props().callback(images, dataToUpload);

  expect(Actions.ImagePreview).toBeCalled();
  expect(Actions.popTo).toBeCalledWith('ChatRoomScene');

  jest.runAllTimers();

  expect(Actions.refresh).toBeCalledWith({ dataToUpload, imageCaption });
});

it('photolibrary, CameraRollPicker second if case', () => {
  const dataToUpload = {
    uri: '/image/image-1.jpg',
  };
  const images = true;
  const imageCaption = 'my cool image';

  Actions.currentScene = 'ReplyPhotoLibraryScene';
  Actions.refresh.mockClear();
  Actions.popTo.mockClear();
  setTimeout.mockClear();
  Actions.ImagePreview = jest.fn((obj) => {
    obj.onSuccessAction(imageCaption);
  });

  const rootComponent = shallow(<PhotoLibrary />);
  const authorInputComponent = rootComponent.find({ assetType: 'All' });
  authorInputComponent.props().callback(images, dataToUpload);

  expect(Actions.ImagePreview).toBeCalled();
  expect(Actions.popTo).toBeCalledWith('ReplyMessageScene');

  jest.runAllTimers();

  expect(Actions.refresh).toBeCalledWith({ dataToUpload, imageCaption });
});

it('_onLayout method is called', () => {
  const event = { nativeEvent: { layout: { width: 360 } } };
  const root = shallow(<PhotoLibrary />);
  root
    .find('Screen')
    .props()
    .onLayout(event);
  expect(root.state().layout.width).toBe(360);
});
