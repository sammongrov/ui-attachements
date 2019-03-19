import React from 'react';
import { View, TouchableOpacity, Dimensions, Alert } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';
import { shallow, configure } from 'enzyme';
import renderer from 'react-test-renderer';
import { Actions } from 'react-native-router-flux';
import Adapter from 'enzyme-adapter-react-16';

import ViewImage from '../ViewImage';

configure({ adapter: new Adapter() });

/* eslint-disable */
jest.mock('react-native-image-zoom-viewer', () => {
  const React = require('React');
  const PropTypes = require('prop-types');
  return class MockImageViewer extends React.Component {
    static propTypes = { children: PropTypes.any };
    static defaultProps = { children: '' };

    render() {
      return React.createElement('ImageViewer', this.props, this.props.children);
    }
    /* eslint-enable */
  };
});

jest.mock('react-native-router-flux', () => ({
  Actions: {
    pop: jest.fn(),
  },
}));

jest.mock('Alert', () => ({
  alert: jest.fn((str1, str2, arr) => {
    arr[0].onPress();
  }),
}));

jest.mock('Dimensions', () => ({
  get: () => ({ width: 720, height: 720 }),
}));

beforeEach(() => {
  jest.resetModules();
});

const imageUrl = 'test_imageUrl';
const deleteMessage = jest.fn();
const showDelete = 'test_showDelete';
const goBack = jest.fn();

it('leftComponent TouchableOpacity is called', () => {
  const rootComp = shallow(
    <ViewImage
      imageUrl={imageUrl}
      deleteMessage={deleteMessage}
      goBack={goBack}
      showDelete={showDelete}
    />,
  );
  const navbar = rootComp.find({ titleText: 'Image Preview' });
  const TO = navbar
    .shallow()
    .find('TouchableOpacity')
    .first();
  TO.props().onPress();

  expect(Actions.pop).toBeCalled();
});

it('ViewImage render correctly', () => {
  const ViewImageTree = renderer
    .create(
      <ViewImage
        imageUrl={imageUrl}
        deleteMessage={deleteMessage}
        goBack={goBack}
        showDelete={showDelete}
      />,
    )
    .toJSON();

  expect(ViewImageTree).toMatchSnapshot();
});

it('rightComponent TouchableOpacity is called', () => {
  const rootComp = shallow(
    <ViewImage
      imageUrl={imageUrl}
      deleteMessage={deleteMessage}
      goBack={goBack}
      showDelete={showDelete}
    />,
  );
  const navbar = rootComp.find({ titleText: 'Image Preview' });
  const TO = navbar
    .shallow()
    .find('TouchableOpacity')
    .last();
  TO.props().onPress();

  expect(showDelete).toBeTruthy();
  expect(Alert.alert).toBeCalled();
});

it('initial state is set', () => {
  const root = shallow(<ViewImage />);
  expect(root.state().layout.width).toBe(720);
  expect(root.state().layout.height).toBe(720);
});

it('_onLayout method is called', () => {
  const event = { nativeEvent: { layout: { height: 360, width: 420 } } };
  const rootComp = shallow(
    <ViewImage
      imageUrl={imageUrl}
      deleteMessage={deleteMessage}
      goBack={goBack}
      showDelete={showDelete}
    />,
  );
  rootComp
    .find('Screen')
    .props()
    .onLayout(event);

  expect(rootComp.state().layout.height).toBe(360);
  expect(rootComp.state().layout.width).toBe(420);
});

it('renderBackButton is called', () => {
  const rootComp = shallow(<ViewImage goBack={goBack} />);
  const instance = rootComp.instance();
  const component = shallow(instance.renderBackButton());

  expect(component).toBeTruthy();
});

it('ImageViewer render correctly', () => {
  const rootComp = shallow(
    <ViewImage
      imageUrl={imageUrl}
      deleteMessage={deleteMessage}
      goBack={goBack}
      showDelete={showDelete}
    />,
  );

  const imageViewer = rootComp.find({ enableImageZoom: true });

  expect(imageViewer).toBeTruthy();

  const viewComponent = shallow(imageViewer.props().loadingRender());
  expect(viewComponent).toBeTruthy();

  const renderImageComp = shallow(imageViewer.props().renderImage());
  expect(renderImageComp).toBeTruthy();

  imageViewer.props().renderIndicator();
  expect(imageViewer.props().renderIndicator).toBeInstanceOf(Function);
});

it('navBar-rightComponent-Alert - Yes', () => {
  jest.mock('Alert', () => ({
    alert: jest.fn((str1, str2, arr) => {
      arr[1].onPress();
    }),
  }));

  const rootComp = shallow(
    <ViewImage
      imageUrl={imageUrl}
      deleteMessage={deleteMessage}
      goBack={goBack}
      showDelete={showDelete}
    />,
  );
  const navbar = rootComp.find({ titleText: 'Image Preview' });
  const TO = navbar
    .shallow()
    .find('TouchableOpacity')
    .last();
  TO.props().onPress();

  expect(deleteMessage).toBeCalled();
  expect(Actions.pop).toBeCalled();
  expect(showDelete).toBeTruthy();
});
