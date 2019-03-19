import React from 'react';
import renderer from 'react-test-renderer';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Actions } from 'react-native-router-flux';
import ImagePreview from '../ImagePreview';

configure({ adapter: new Adapter() });
const onSuccessAction = jest.fn();
const imageUrl = 'https://my-photo-library.com/image-1.png';
const imageData = { width: 320, height: 160, caption: 'coffee' };
const groupDetail = { _id: 'GENERAL', title: 'All about coffee' };

jest.mock('react-native-router-flux', () => ({
  Actions: {
    currentScene: 'ImagePreviewScene',
    pop: jest.fn(),
  },
}));

jest.mock('Platform', () => {
  const Platform = require.requireActual('Platform');
  Platform.OS = 'android';
  return Platform;
});

it('renders correctly with props', () => {
  const tree = renderer
    .create(
      <ImagePreview
        onSuccessAction={onSuccessAction}
        imageUrl={imageUrl}
        imageData={imageData}
        groupDetail={groupDetail}
      />,
    )
    .toJSON();
  expect(tree).toMatchSnapshot();
});

it('renders correctly without props', () => {
  const tree = renderer.create(<ImagePreview />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('onPress on Profile', () => {
  const tree = shallow(<ImagePreview />).dive();
  const image = tree.find('TouchableOpacity');
  image.props().onPress();
  expect(image.props().onPress).toBeInstanceOf(Function);
});

it('updateSize', () => {
  const rootComponent = shallow(<ImagePreview />);
  const instance = rootComponent.instance();
  const result = instance.updateSize();
  expect(result).toBeUndefined();
});

it('PreviewSuccess is called', () => {
  const rootComponent = shallow(<ImagePreview onSuccessAction={onSuccessAction} />);
  const instance = rootComponent.instance();
  const result = instance.PreviewSuccess();
  expect(result).toBeUndefined();
  expect(onSuccessAction.mock.calls.length).toBe(1);
});

it('PreviewSuccess is not called', () => {
  onSuccessAction.mockClear();
  Actions.currentScene = 'ChatList';
  const root = shallow(<ImagePreview onSuccessAction={onSuccessAction} />);
  root
    .find('TouchableOpacity')
    .last()
    .props()
    .onPress();
  expect(onSuccessAction.mock.calls.length).toBe(0);
});

it('should render the onChange to messageText', () => {
  const rootComponent = shallow(<ImagePreview />);
  const authorInputComponent = rootComponent.find('TextInput').first();
  authorInputComponent.simulate('ChangeText', 'text');
  expect(rootComponent.state('messageText')).toEqual('text');
});

it('calls onContentSizeChange', () => {
  const event = { nativeEvent: { contentSize: { height: 150 } } };
  const rootComponent = shallow(<ImagePreview />);
  const input = rootComponent.find('TextInput').first();
  input.props().onContentSizeChange(event);
  expect(rootComponent.state('height')).toEqual(150);
});

it('Navbar onPress calls Actions.pop', () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'ios';
    return Platform;
  });
  Actions.currentScene = 'ImagePreviewScene';
  const root = shallow(<ImagePreview />);
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
  const root = shallow(<ImagePreview />);
  const button = root
    .find('NavBar')
    .shallow()
    .find('TouchableOpacity');
  button.props().onPress();
  expect(Actions.pop.mock.calls.length).toBe(0);
});
