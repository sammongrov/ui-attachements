import React from 'react';
import renderer from 'react-test-renderer';
import { shallow, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import emoji from 'node-emoji';
import { Actions } from 'react-native-router-flux';
import { Dimensions, BackHandler, PermissionsAndroid, View, Keyboard } from 'react-native';
import ReplyMessage from '../ReplyMessage';
import DbManager from '../../app/DBManager';
import Application from '../../constants/config';

configure({ adapter: new Adapter() });

jest.mock('node-emoji', () => ({
  emojify: jest.fn(),
}));

jest.mock('react-native-router-flux', () => ({
  Actions: {
    currentScene: 'ReplyMessageScene',
    pop: jest.fn(),
    ReplyCameraScreen: jest.fn(),
    ReplyPhotoLibrary: jest.fn(),
    ViewImage: jest.fn(),
    VideoPreview: jest.fn(),
    refresh: jest.fn(),
  },
}));

jest.mock('Dimensions', () => ({
  get: () => ({ width: 720, height: 360 }),
}));

jest.mock('BackHandler', () => {
  const backHandler = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  return backHandler;
});

jest.mock('Keyboard', () => ({
  dismiss: jest.fn(),
}));

jest.mock('PermissionsAndroid', () => {
  const permissionsAndroid = {
    requestMultiple: jest.fn(() => Promise.resolve(true)),
    PERMISSIONS: {
      CAMERA: true,
      READ_EXTERNAL_STORAGE: true,
      RECORD_AUDIO: true,
    },
  };
  return permissionsAndroid;
});

jest.mock('../../app/DBManager', () => {
  const dbManager = {
    group: {
      findRootMessage: jest.fn(),
      addGroupMessageListner: jest.fn(),
      removeGroupMessageListener: jest.fn(),
      findMessageById: jest.fn(),
      getGroupMessages: jest.fn(),
      findAllChildMessages: jest.fn(() => []),
      findById: jest.fn(),
    },
    app: {
      getSettingsValue: jest.fn(() => true),
    },
    _taskManager: {
      chat: {
        sendThreadedMessageJob: jest.fn(),
        sendTypingNotificationJob: jest.fn(),
        deleteMessageJob: jest.fn(),
        sendReadStatusJob: jest.fn(),
        uploadMediaJob: jest.fn(),
      },
    },
  };
  return dbManager;
});

jest.mock('react-native-image-crop-picker', () => ({
  openPicker: jest.fn(() =>
    Promise.resolve([
      {
        path: '//videos/recording-125.mp4',
        size: 2048,
      },
    ]),
  ),
}));

jest.mock('../../constants/config', () => ({
  APPCONFIG: {
    ATTACH_AUDIO: true,
    ATTACH_VIDEO: true,
  },
  urls: {
    SERVER_URL: '',
  },
}));

const group = {
  _id: 'XO12T8PE791l',
  name: 'unit-test',
};
const user = {
  _id: 'UX1258g51dF91',
  name: 'unit-test-writer',
};
const messages = [
  {
    _id: 'MSG22222203',
    text: 'yes we can',
    user,
    replyMessageId: 'MSG22222202',
    group,
    type: 10,
    isReply: true,
  },
  {
    _id: 'MSG22222209',
    text: 'but not today',
    user: { _id: 'PP1258g51dF92', name: 'busy-dev' },
    replyMessageId: 'MSG22222202',
    group,
    type: 10,
    isReply: true,
  },
  {
    _id: 'MSG22222221',
    text: 'mmmm, that is what we do',
    user: { _id: 'MM1258g51dF92', name: 'dreaming-dev' },
    replyMessageId: 'MSG22222202',
    group,
    type: 10,
    isReply: true,
  },
  {
    _id: 'MSG555555654',
    text: 'have you got a lunch?',
    user: { _id: 'CM1258g51dF00', name: 'comfort-forever' },
    replyMessageId: null,
    group,
    type: 10,
    isReply: false,
  },
  {
    _id: 'MSG555555600',
    text: 'ok. let us meet today',
    user: { _id: 'CM1258g51dF00', name: 'future-dev' },
    replyMessageId: 'ART123T7h00',
    group,
    type: 10,
    isReply: true,
  },
];
const replyMessage = {
  _id: 'MSG22222202',
  user: { _id: 'UO1258g51dF92', name: 'unit-test-reader' },
  replyMessageId: null,
  group,
  type: 1,
  isReply: false,
  status: 100,
  likes: 5,
  text: 'can we cover 200% of statements?',
  createdAt: '2017-11-24T19:21:42.183Z',
  updatedAt: '2017-11-24T19:21:42.183Z',
};
const canDelete = true;
const props = { group, user, messages, replyMessage, canDelete };
DbManager.group.findRootMessage = jest.fn(() => replyMessage);
DbManager.group.findMessageById = jest.fn((id) => messages.find((msg) => id === msg._id));

beforeEach(() => {
  jest.resetModules();
});

/* ------------------------- Snapshots ----------------------- */

it('ReplyMessage renders correctly without props', () => {
  const tree = renderer.create(<ReplyMessage />).toJSON();
  expect(tree).toMatchSnapshot();
});

it('ReplyMessage renders correctly with props', () => {
  const tree = renderer.create(<ReplyMessage {...props} />).toJSON();
  expect(tree).toMatchSnapshot();
});

/* ------------------- component methods --------------------- */

it('ReplyMessage componentWillMount - no audio', () => {
  DbManager.group.findRootMessage.mockClear();
  DbManager.app.getSettingsValue = jest.fn(() => null);
  const tree = shallow(<ReplyMessage {...props} />);
  expect(DbManager.group.findRootMessage).toBeCalled();
  expect(DbManager.app.getSettingsValue).toBeCalled();
  expect(tree.state().parentMessage).toEqual(replyMessage);
  expect(tree.state().attachAudioBtn).toBe(false);
});

it('ReplyMessage componentWillMount - audio is allowed', () => {
  DbManager.group.findRootMessage.mockClear();
  DbManager.app.getSettingsValue = jest.fn(() => ({ value: true }));
  const tree = shallow(<ReplyMessage {...props} />);
  expect(DbManager.group.findRootMessage).toBeCalled();
  expect(DbManager.app.getSettingsValue).toBeCalled();
  expect(tree.state().parentMessage).toEqual(replyMessage);
  expect(tree.state().attachAudioBtn).toBe(true);
});

it('ReplyMessage componentDidMount', () => {
  DbManager.group.addGroupMessageListner.mockClear();
  BackHandler.addEventListener.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  expect(DbManager.group.addGroupMessageListner).toBeCalled();
  expect(BackHandler.addEventListener).toBeCalled();
  expect(instance._isMounted).toBe(true);
});

it('ReplyMessage componentWillUnmount', () => {
  DbManager.group.removeGroupMessageListener.mockClear();
  BackHandler.removeEventListener.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  tree.unmount();
  expect(DbManager.group.removeGroupMessageListener).toBeCalled();
  expect(BackHandler.removeEventListener).toBeCalled();
  expect(instance._isMounted).toBe(false);
});

it('ReplyMessage componentDidUpdate', () => {
  const prevProps = { dataToUpload: null };
  const prevState = { attachAudio: false };
  const newDataToUpload = {
    dataToUpload: {
      uri: '//Camera/album1/image01-02-03.jpg',
      size: '800x600',
    },
  };
  const tree = shallow(<ReplyMessage {...props} dataToUpload={newDataToUpload} />);
  tree.setProps({ attachAudio: true });
  const instance = tree.instance();
  instance.uploadMedia = jest.fn();
  instance.componentDidUpdate(prevProps, prevState);
  expect(instance.uploadMedia).toBeCalled();
  expect(tree.state().attachAudio).toBe(true);
  expect(tree.state().attachAudioBtn).toBe(true);
});

it('ReplyMessage calls onSend - ios', () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'ios';
    return Platform;
  });
  DbManager._taskManager.chat.sendThreadedMessageJob.mockClear();
  DbManager._taskManager.chat.sendTypingNotificationJob.mockClear();
  const message = [{ _id: 'MSS17895oB01', text: 'test' }];
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.onSend(message);
  expect(DbManager._taskManager.chat.sendThreadedMessageJob).toBeCalled();
  expect(DbManager._taskManager.chat.sendTypingNotificationJob).toBeCalled();
});

it('ReplyMessage calls onSend - android', () => {
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'android';
    return Platform;
  });
  DbManager._taskManager.chat.sendThreadedMessageJob.mockClear();
  DbManager._taskManager.chat.sendTypingNotificationJob.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.replyMessage = { text: 'message without id' };
  instance.composerRef = { clear: jest.fn() };
  instance.onSend();
  expect(tree.state().height).toBe(44);
  expect(instance.composerRef.clear).toBeCalled();
  expect(instance.textInputValue).toBe('');
  expect(DbManager._taskManager.chat.sendThreadedMessageJob).not.toBeCalled();
  expect(DbManager._taskManager.chat.sendTypingNotificationJob).toBeCalled();
});

it('ReplyMessage calls onChangeTextInput', () => {
  const tree = shallow(<ReplyMessage {...props} />, { disableLifecycleMethods: true });
  const instance = tree.instance();
  const text = 'who is';
  instance.onChangeTextInput(text);
  expect(tree.state().attachAudioBtn).toBe(!text.trim().length);
  expect(instance.textInputValue).toMatch(text);
});

it('ReplyMessage calls handleBackPress', () => {
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  Actions.pop.mockClear();
  const result = instance.handleBackPress();
  expect(Actions.pop).toBeCalled();
  expect(result).toBe(true);
});

it('ReplyMessage calls uploadMedia for an image', () => {
  DbManager._taskManager.chat.uploadMediaJob.mockClear();
  const groupId = 'XO12T8PE791l';
  const imageCaption = 'My tasty sandwich';
  const newDataToUpload = {
    uri: '//Camera/album1/image01-02-03.jpg',
    size: '800x600',
  };
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.uploadMedia(groupId, newDataToUpload, imageCaption);
  expect(DbManager._taskManager.chat.uploadMediaJob).toBeCalledWith(
    newDataToUpload,
    groupId,
    true,
    imageCaption,
    instance.replyMessage._id,
  );
});

it('ReplyMessage calls uploadMedia for an audio file', () => {
  DbManager._taskManager.chat.uploadMediaJob.mockClear();
  const groupId = 'XO12T8PE791l';
  const imageCaption = 'My tasty sandwich';
  const newDataToUpload = {
    uri: '//VoiceRecords/greetings03.mp4',
  };
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.uploadMedia(groupId, newDataToUpload, imageCaption);
  expect(DbManager._taskManager.chat.uploadMediaJob).toBeCalledWith(
    newDataToUpload,
    groupId,
    false,
    imageCaption,
    instance.replyMessage._id,
  );
});

it('ReplyMessage calls renderAvatar', () => {
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  const avatarProps = {
    currentMessage: {
      _id: 'MSG555555677',
      text: 'have you got my present?',
      user: { _id: 'CM1258g51dF00', name: 'youKnowWhoAmI', username: 'whoAmI', avatar: 'WHOMI' },
    },
  };
  const view = shallow(instance.renderAvatar(avatarProps));
  const avatar = view.find('Avatar');
  expect(avatar.props().avatarName).toMatch(avatarProps.currentMessage.user.name);
});

it('ReplyMessage calls getImageSizes - a landscape mode', () => {
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  const expectedResult = {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height / 8,
  };
  const result = instance.getImageSizes();
  expect(result).toEqual(expectedResult);
});

it('ReplyMessage calls getImageSizes - a portrait mode', () => {
  Dimensions.get = jest.fn(() => ({ width: 360, height: 720 }));
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  const expectedResult = {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height / 3,
  };
  const result = instance.getImageSizes();
  expect(result).toEqual(expectedResult);
});

it('ReplyMessage calls deleteMessage of another user', () => {
  DbManager._taskManager.chat.deleteMessageJob.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  const messageId = 'MSZ7777705';
  const userId = 'ZZZ12398Ht';
  instance.deleteMessage(messageId, userId);
  expect(DbManager._taskManager.chat.deleteMessageJob).not.toBeCalled();
});

it('ReplyMessage calls deleteMessage of a current user', () => {
  DbManager._taskManager.chat.deleteMessageJob.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  const messageId = 'MSZ7777705';
  const userId = user._id;
  instance.deleteMessage(messageId, userId);
  expect(DbManager._taskManager.chat.deleteMessageJob).toBeCalled();
});

it('ReplyMessage calls toggleActionsMenu', () => {
  const tree = shallow(<ReplyMessage {...props} />);
  tree.setState({ actionsMenu: true });
  const instance = tree.instance();
  instance.toggleActionsMenu();
  expect(tree.state().actionsMenu).toBe(false);
});

it('ReplyMessage calls takePhoto', () => {
  Actions.ReplyCameraScreen.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.takePhoto();
  expect(Actions.ReplyCameraScreen).toBeCalled();
});

it('ReplyMessage calls openPhotoLibrary', () => {
  Actions.ReplyPhotoLibrary.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.openPhotoLibrary();
  expect(Actions.ReplyPhotoLibrary).toBeCalled();
});

// it('ReplyMessage calls findAllChildMessages', () => {
//   const tree = shallow(<ReplyMessage {...props} />);
//   const instance = tree.instance();
//   const result = instance.findAllChildMessages(messages, replyMessage._id);
//   expect(result).toEqual(messages.slice(0, 3));
// });

it('ReplyMessage calls checkPermission - android', async () => {
  jest.doMock('Platform', () => {
    const platform = {
      OS: 'android',
      Version: 25,
    };
    return platform;
  });
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  await instance.checkPermission();
  expect(PermissionsAndroid.requestMultiple).toBeCalled();
});

it('ReplyMessage calls checkPermission - ios', async () => {
  PermissionsAndroid.requestMultiple.mockClear();
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'ios';
    return Platform;
  });
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  await instance.checkPermission();
  expect(PermissionsAndroid.requestMultiple).not.toBeCalled();
});

it('ReplyMessage calls isIphoneX - ios', async () => {
  Dimensions.get = jest.fn(() => ({ width: 812, height: 812 }));
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'ios';
    return Platform;
  });
  const tree = shallow(<ReplyMessage {...props} />);
  expect(tree.state().isIphoneX).toBe(true);
});

it('ReplyMessage calls setGroupMessagesAsRead with 0 unread messages', () => {
  DbManager._taskManager.chat.sendReadStatusJob.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  const isUnread = 0;
  instance.setGroupMessagesAsRead(isUnread);
  expect(DbManager._taskManager.chat.sendReadStatusJob).not.toBeCalled();
});

it('ReplyMessage calls setGroupMessagesAsRead with unread messages', () => {
  DbManager._taskManager.chat.sendReadStatusJob.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  const isUnread = 13;
  instance.setGroupMessagesAsRead(isUnread);
  expect(DbManager._taskManager.chat.sendReadStatusJob).toBeCalled();
});

it('ReplyMessage calls fetchGroupMessages - the component is not mounted', () => {
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance._isMounted = false;
  instance.setGroupMessagesAsRead = jest.fn();
  instance.fetchGroupMessages();
  expect(instance.setGroupMessagesAsRead).not.toBeCalled();
});

it('ReplyMessage calls fetchGroupMessages - no group id', () => {
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.group = { _id: null };
  instance.setGroupMessagesAsRead = jest.fn();
  instance.fetchGroupMessages();
  expect(instance.setGroupMessagesAsRead).not.toBeCalled();
});

it('ReplyMessage calls fetchGroupMessages', async () => {
  DbManager.group.getGroupMessages = jest.fn(() => messages);
  DbManager.group.findAllChildMessages = jest.fn(() => messages.slice(1, 2));
  DbManager.group.findById = jest.fn(() => group);
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.setGroupMessagesAsRead = jest.fn();
  await instance.fetchGroupMessages();
  expect(tree.state().childMessages).toEqual(messages.slice(1, 2));
  expect(instance.setGroupMessagesAsRead).toBeCalled();
});

describe('ReplyMessage calls renderBubble', () => {
  const bubbleProps = {
    currentMessage: {
      _id: 'X01020130P',
      text: 'Just be sure before you will give it all to me',
      user: { _id: 'U007', username: 'someone' },
      status: 100,
      isReply: false,
    },
    previousMessage: {
      _id: 'Y02Yt78c8',
      text: 'I am ready. Now?',
      user: { _id: 'U003', username: 'mainUser' },
      status: 100,
      isReply: false,
    },
    isSameUser: jest.fn(() => true),
    isSameDay: jest.fn(() => false),
    position: 'left',
    user: { _id: 'U007', username: 'someone' },
  };

  it('Bubble is rendered', () => {
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const bubble = shallow(instance.renderBubble(bubbleProps));
    expect(bubble.find('Bubble').length).toBe(1);
    expect(bubble.find('Text').length).toBe(1);
  });

  it('Bubble is rendered with displayName', () => {
    bubbleProps.isSameUser = jest.fn(() => true);
    bubbleProps.isSameDay = jest.fn(() => true);
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const bubble = shallow(instance.renderBubble(bubbleProps));
    expect(bubble.find('Text').length).toBe(0);
  });

  it('Bubble is rendered with an image loading', () => {
    bubbleProps.position = 'right';
    bubbleProps.currentMessage.image = '//images/test-image.jpg';
    bubbleProps.currentMessage.status = 0;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const bubble = shallow(instance.renderBubble(bubbleProps));
    expect(bubble.find('Text').length).toBe(0);
  });

  it('Bubble is rendered with a deleted message', () => {
    bubbleProps.currentMessage.status = -1;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const bubble = instance.renderBubble(bubbleProps);
    expect(bubble).toBeNull();
  });

  it('Bubble props are called', () => {
    bubbleProps.currentMessage.status = 10;
    bubbleProps.currentMessage.isReply = true;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    instance.renderTick = jest.fn();
    instance.renderFileAttachment = jest.fn();
    instance.renderMessage = jest.fn();
    const bubble = shallow(instance.renderBubble(bubbleProps)).find('Bubble');
    bubble.props().renderTicks();
    bubble.props().renderCustomView();
    bubble.props().renderMessageText();
    expect(instance.renderTick).toBeCalled();
    expect(instance.renderFileAttachment).toBeCalled();
    expect(instance.renderMessage).toBeCalled();
    // isReply false
    bubbleProps.currentMessage.isReply = false;
    const bubble1 = shallow(instance.renderBubble(bubbleProps)).find('Bubble');
    expect(bubble1.props().renderMessageText).toBeNull();
  });
});

describe('ReplyMessage calls renderTick', () => {
  const currentMessage = {
    _id: 'X01020130P',
    text: 'Just be sure before you will give it all to me',
    user: { _id: 'U007', username: 'someone' },
    status: 100,
    isReply: false,
  };

  it('a message user is not the current user ', () => {
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const ticks = instance.renderTick(currentMessage);
    expect(ticks).toBeNull();
  });

  it('shows a double tick', () => {
    currentMessage.user = user;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const ticks = shallow(instance.renderTick(currentMessage)).find('Text');
    expect(ticks.length).toBe(2);
  });

  it('shows a single tick', () => {
    currentMessage.user = user;
    currentMessage.status = 10;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const ticks = shallow(instance.renderTick(currentMessage)).find('Text');
    expect(ticks.length).toBe(1);
  });

  it('shows no ticks', () => {
    currentMessage.user = user;
    currentMessage.status = 0;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const ticks = instance.renderTick(currentMessage);
    expect(ticks).toBeNull();
  });
});

describe('ReplyMessage calls renderFileAttachment', () => {
  const currentMessage = {
    _id: 'X01020130P',
    text: 'Just be sure before you will give it all to me',
    user: { _id: 'U007', username: 'someone' },
    status: 100,
    isReply: false,
    remoteFile: null,
  };

  it('without a remote file ', () => {
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const attachment = instance.renderFileAttachment({ currentMessage });
    expect(attachment).toBeNull();
  });

  it('with a remote audio file ', () => {
    currentMessage.remoteFile = '//files/remote-file1.mp4';
    currentMessage.remoteFileType = 'audio file';
    currentMessage.type = 0;
    currentMessage.status = 0;
    currentMessage.uploadFilePercent = 0.556;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    instance.deleteMessage = jest.fn();
    const attachment = shallow(instance.renderFileAttachment({ currentMessage })).find('AudioPlay');
    attachment.props().deleteMessage();
    expect(attachment.length).toBe(1);
    expect(instance.deleteMessage).toBeCalled();
  });

  it('with a remote video file - upload in progress', () => {
    Actions.currentScene = 'ReplyMessageScene';
    currentMessage.remoteFile = '//files/remote-file1.mp4';
    currentMessage.remoteFileType = 'video file';
    currentMessage.type = 0;
    currentMessage.status = 0;
    currentMessage.uploadFilePercent = 0.556;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    instance.deleteMessage = jest.fn();
    const attachment = shallow(
      <View>{instance.renderFileAttachment({ currentMessage })}</View>,
    ).find('TouchableOpacity');
    attachment.props().onPress();
    expect(attachment.length).toBe(1);
    expect(Actions.VideoPreview).not.toBeCalled();
    expect(Keyboard.dismiss).not.toBeCalled();
  });

  it('with a remote video file - upload in progress', () => {
    Actions.currentScene = 'ReplyMessageScene';
    currentMessage.remoteFile = '//files/remote-file1.mp4';
    currentMessage.remoteFileType = 'video file';
    currentMessage.type = 0;
    currentMessage.status = 10;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    instance.deleteMessage = jest.fn();
    const attachment = shallow(
      <View>{instance.renderFileAttachment({ currentMessage })}</View>,
    ).find('TouchableOpacity');
    attachment.props().onPress();
    expect(Actions.VideoPreview).toBeCalled();
    expect(Keyboard.dismiss).toBeCalled();
  });
});

it('ReplyMessage calls checkAudioPermission - android', async () => {
  jest.doMock('Platform', () => {
    const platform = {
      OS: 'android',
      Version: 25,
    };
    return platform;
  });
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  expect.assertions(1);
  await instance.checkAudioPermission();
  expect(PermissionsAndroid.requestMultiple).toBeCalled();
});

it('ReplyMessage calls checkAudioPermission - ios', async () => {
  PermissionsAndroid.requestMultiple.mockClear();
  jest.doMock('Platform', () => {
    const Platform = require.requireActual('Platform');
    Platform.OS = 'ios';
    return Platform;
  });
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  expect.assertions(1);
  await instance.checkAudioPermission();
  expect(PermissionsAndroid.requestMultiple).not.toBeCalled();
});

describe('ReplyMessage calls renderSend', () => {
  const sendProps = {
    text: 'Supersonic is here',
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it('ios platform', () => {
    jest.doMock('Platform', () => {
      const Platform = require.requireActual('Platform');
      Platform.OS = 'ios';
      return Platform;
    });
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const sendIcon = shallow(instance.renderSend(sendProps)).find('Icon');
    expect(sendIcon.length).toBe(1);
  });

  it('android platform - send icon', () => {
    jest.doMock('Platform', () => {
      const Platform = require.requireActual('Platform');
      Platform.OS = 'android';
      return Platform;
    });
    sendProps.text = 'At what time?';
    const tree = shallow(<ReplyMessage {...props} />, { disableLifecycleMethods: true });
    tree.setState({ attachAudioBtn: false });
    const instance = tree.instance();
    instance.textInputValue = sendProps.text;
    const sendIcon = shallow(instance.renderSend(sendProps)).find({ name: 'send' });
    expect(sendIcon.length).toBe(1);
  });

  it('android platform - audio button, no bot voice', async () => {
    jest.doMock('Platform', () => {
      const Platform = require.requireActual('Platform');
      Platform.OS = 'android';
      return Platform;
    });
    Keyboard.dismiss.mockClear();
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ attachAudioBtn: true, botVoice: false });
    const instance = tree.instance();
    instance.checkAudioPermission = jest.fn(() => Promise.resolve(true));
    const audioBtn = shallow(instance.renderSend()).find('TouchableOpacity');
    expect.assertions(4);
    await audioBtn.props().onPress();
    expect(Keyboard.dismiss).toBeCalled();
    expect(instance.checkAudioPermission).toBeCalled();
    expect(tree.state().actionsMenu).toBe(false);
    expect(tree.state().attachAudio).toBe(true);
  });

  it('android platform - audio button, a bot voice is enabled', () => {
    jest.doMock('Platform', () => {
      const Platform = require.requireActual('Platform');
      Platform.OS = 'android';
      return Platform;
    });
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ attachAudioBtn: true, botVoice: true });
    const instance = tree.instance();
    const audioBtn = instance.renderSend();
    expect(audioBtn).toBeNull();
  });

  it('android platform - audio disabled from config', () => {
    jest.doMock('Platform', () => {
      const Platform = require.requireActual('Platform');
      Platform.OS = 'android';
      return Platform;
    });
    Application.APPCONFIG.ATTACH_AUDIO = false;
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ attachAudioBtn: true, botVoice: true });
    const instance = tree.instance();
    const audioBtn = instance.renderSend();
    expect(audioBtn).toBeUndefined();
  });
});

describe('ReplyMessage calls renderMessageImage', () => {
  const currentMessage = {
    _id: 'X01020130P',
    text: 'Just be sure before you will give it all to me',
    user: { _id: 'U007', username: 'someone' },
    status: 100,
    isReply: false,
    image: '//images/my-image22.png',
  };

  it('from ReplyMessageScene', () => {
    Actions.ViewImage = jest.fn((obj) => {
      obj.goBack();
      obj.deleteMessage();
    });
    const tree = shallow(<ReplyMessage {...props} messages={[currentMessage]} />);
    const instance = tree.instance();
    instance.deleteMessage = jest.fn();
    const wrapper = shallow(<View>{instance.renderMessageImage({ currentMessage })}</View>);
    const touchOpacity = wrapper.find('TouchableOpacity');
    touchOpacity.props().onPress();
    expect(Actions.ViewImage).toBeCalled();
    const image = wrapper.find('FastImage');
    expect(image.length).toBe(1);
  });

  it('from ChatListScene', () => {
    Actions.ViewImage.mockClear();
    Actions.currentScene = 'ChatListScene';
    const tree = shallow(<ReplyMessage {...props} messages={[currentMessage]} />);
    const instance = tree.instance();
    instance.deleteMessage = jest.fn();
    const wrapper = shallow(<View>{instance.renderMessageImage({ currentMessage })}</View>);
    const touchOpacity = wrapper.find('TouchableOpacity');
    touchOpacity.props().onPress();
    expect(Actions.ViewImage).not.toBeCalled();
  });

  it('from ReplyMessageScene - an image upload is in progress', () => {
    currentMessage.status = 0;
    currentMessage.uploadFilePercent = 0.987;
    const tree = shallow(<ReplyMessage {...props} messages={[currentMessage]} />);
    const instance = tree.instance();
    const wrapper = shallow(<View>{instance.renderMessageImage({ currentMessage })}</View>);
    const uploadProgress = wrapper.find('UploadProgress');
    expect(uploadProgress.length).toBe(1);
  });
});

describe('ReplyMessage calls renderReplyMessage', () => {
  it('a message with an image from ReplyMessageScene', () => {
    replyMessage.image = '//pictures/my-image780.jpg';
    Actions.ViewImage = jest.fn((obj) => {
      obj.goBack();
    });
    Actions.currentScene = 'ReplyMessageScene';
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    instance.getImageSizes = jest.fn(() => ({ width: 250, height: 175 }));
    const wrapper = shallow(instance.renderReplyMessage(replyMessage));
    const touchOpacity = wrapper.find('TouchableOpacity');
    touchOpacity.props().onPress();
    expect(Actions.ViewImage).toBeCalled();
  });

  it('a message with an image from other scene', () => {
    Actions.ViewImage.mockClear();
    Actions.currentScene = 'ChatListScene';
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    instance.getImageSizes = jest.fn(() => ({ width: 250, height: 175 }));
    const wrapper = shallow(instance.renderReplyMessage(replyMessage));
    const touchOpacity = wrapper.find('TouchableOpacity');
    touchOpacity.props().onPress();
    expect(Actions.ViewImage).not.toBeCalled();
  });

  it('a message with a video from ReplyMessageScene', () => {
    Actions.VideoPreview.mockClear();
    Keyboard.dismiss.mockClear();
    Actions.currentScene = 'ReplyMessageScene';
    replyMessage.image = null;
    replyMessage.remoteFile = '//videos/MyVideos/Camera/video_1569.mp4';
    replyMessage.remoteFileType = 'video file';
    replyMessage.status = 10;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    instance.getImageSizes = jest.fn(() => ({ width: 250, height: 175 }));
    const wrapper = shallow(instance.renderReplyMessage(replyMessage));
    const touchOpacity = wrapper.find('TouchableOpacity');
    touchOpacity.props().onPress();
    expect(tree.state().actionsMenu).toBe(false);
    expect(Keyboard.dismiss).toBeCalled();
    expect(Actions.VideoPreview).toBeCalled();
  });

  it('a message with a video from other scene', () => {
    Actions.VideoPreview.mockClear();
    Keyboard.dismiss.mockClear();
    Actions.currentScene = 'Chat';
    replyMessage.image = null;
    replyMessage.remoteFile = '//videos/MyVideos/Camera/video_1569.mp4';
    replyMessage.remoteFileType = 'video file';
    replyMessage.status = 0;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    instance.getImageSizes = jest.fn(() => ({ width: 250, height: 175 }));
    const wrapper = shallow(instance.renderReplyMessage(replyMessage));
    const touchOpacity = wrapper.find('TouchableOpacity');
    touchOpacity.props().onPress();
    expect(Keyboard.dismiss).not.toBeCalled();
    expect(Actions.VideoPreview).not.toBeCalled();
  });

  it('a message with an audio', () => {
    replyMessage.image = null;
    replyMessage.remoteFile = '//recordings/MyRecordings/audio_1569.mp4';
    replyMessage.remoteFileType = 'audio file';
    replyMessage.status = 10;
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    instance.getImageSizes = jest.fn(() => ({ width: 250, height: 175 }));
    const wrapper = shallow(instance.renderReplyMessage(replyMessage));
    const player = wrapper.find('AudioPlay');
    expect(player.length).toBe(1);
  });
});

it('ReplyMessage calls renderActions', () => {
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.toggleActionsMenu = jest.fn();
  const wrapper = shallow(<View>{instance.renderActions()}</View>);
  const touchOpacity = wrapper.find('TouchableOpacity');
  touchOpacity.props().onPress();
  expect(instance.toggleActionsMenu).toBeCalled();
});

it('ReplyMessage calls pickVideosFromGallery', async () => {
  Actions.refresh.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.toggleActionsMenu = jest.fn();
  expect.assertions(2);
  await instance.pickVideosFromGallery();
  expect(instance.toggleActionsMenu).toBeCalled();
  expect(Actions.refresh).toBeCalled();
});

describe('ReplyMessage calls renderChatFooter', () => {
  it('showActions is false', () => {
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ showActions: false });
    const instance = tree.instance();
    const wrapper = instance.renderChatFooter();
    expect(wrapper).toBeUndefined();
  });

  it('showActions is true - onPress openPhotoLibrary from current scene', async () => {
    Actions.currentScene = 'ReplyMessageScene';
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ actionsMenu: true });
    const instance = tree.instance();
    instance.checkPermission = jest.fn();
    instance.openPhotoLibrary = jest.fn();
    const wrapper = shallow(instance.renderChatFooter());
    const touchOpacity = wrapper.find('TouchableOpacity').first();
    await touchOpacity.props().onPress();
    expect(instance.checkPermission).toBeCalled();
    expect(instance.openPhotoLibrary).toBeCalled();
  });

  it('showActions is true - onPress openPhotoLibrary from other scene', async () => {
    Actions.currentScene = 'ChatList';
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ actionsMenu: true });
    const instance = tree.instance();
    instance.checkPermission = jest.fn();
    instance.openPhotoLibrary = jest.fn();
    const wrapper = shallow(instance.renderChatFooter());
    const touchOpacity = wrapper.find('TouchableOpacity').first();
    await touchOpacity.props().onPress();
    expect(instance.checkPermission).not.toBeCalled();
    expect(instance.openPhotoLibrary).not.toBeCalled();
  });

  it('showActions is true - onPress takePhoto from current scene', () => {
    Actions.currentScene = 'ReplyMessageScene';
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ actionsMenu: true });
    const instance = tree.instance();
    instance.takePhoto = jest.fn();
    const wrapper = shallow(instance.renderChatFooter());
    const touchOpacity = wrapper.find('TouchableOpacity').at(1);
    touchOpacity.props().onPress();
    expect(instance.takePhoto).toBeCalled();
  });

  it('showActions is true - onPress takePhoto from other scene', () => {
    Actions.currentScene = 'ChatList';
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ actionsMenu: true });
    const instance = tree.instance();
    instance.takePhoto = jest.fn();
    const wrapper = shallow(instance.renderChatFooter());
    const touchOpacity = wrapper.find('TouchableOpacity').at(1);
    touchOpacity.props().onPress();
    expect(instance.takePhoto).not.toBeCalled();
  });

  it('showActions is true - onPress pickVideosFromGallery from current scene', () => {
    Actions.currentScene = 'ReplyMessageScene';
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ actionsMenu: true });
    const instance = tree.instance();
    instance.pickVideosFromGallery = jest.fn();
    const wrapper = shallow(instance.renderChatFooter());
    const touchOpacity = wrapper.find('TouchableOpacity').last();
    touchOpacity.props().onPress();
    expect(instance.pickVideosFromGallery).toBeCalled();
  });

  it('showActions is true - onPress pickVideosFromGallery from other scene', () => {
    Actions.currentScene = 'ChatList';
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ actionsMenu: true });
    const instance = tree.instance();
    instance.pickVideosFromGallery = jest.fn();
    const wrapper = shallow(instance.renderChatFooter());
    const touchOpacity = wrapper.find('TouchableOpacity').last();
    touchOpacity.props().onPress();
    expect(instance.pickVideosFromGallery).not.toBeCalled();
  });
});

it('ReplyMessage calls renderAudioRecorder', () => {
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  const audio = shallow(<View>{instance.renderAudioRecorder()}</View>).find('AttachAudio');
  expect(audio).toBeTruthy();
});

it('ReplyMessage calls renderMessage', () => {
  const currentMessage = {
    _id: 'X01020130P',
    text: 'Just be sure before you will give it all to me',
    user: { _id: 'U007', username: 'someone' },
    status: 100,
    isReply: false,
    image: '//images/my-image22.png',
  };
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  const wrapper = shallow(instance.renderMessage({ currentMessage }));
  expect(wrapper).toBeTruthy();
  expect(emoji.emojify).toBeCalled();
});

describe('ReplyMessage calls renderComposer', () => {
  const composerProps = {
    text: 'Supersonic is here',
  };

  beforeEach(() => {
    jest.resetModules();
  });

  it('ios platform', () => {
    jest.doMock('Platform', () => {
      const Platform = require.requireActual('Platform');
      Platform.OS = 'ios';
      return Platform;
    });
    const tree = shallow(<ReplyMessage {...props} />);
    const instance = tree.instance();
    const composer = shallow(instance.renderComposer(composerProps));
    expect(composer).toBeTruthy();
  });

  it('android platform', () => {
    jest.doMock('Platform', () => {
      const Platform = require.requireActual('Platform');
      Platform.OS = 'android';
      return Platform;
    });
    const tree = shallow(<ReplyMessage {...props} />);
    tree.setState({ height: 44 });
    const instance = tree.instance();
    instance.onChangeTextInput = jest.fn();
    const nativeEvent = {
      nativeEvent: {
        contentSize: {
          height: 120,
        },
      },
    };
    const textInput = shallow(instance.renderComposer(composerProps)).find('TextInput');
    textInput.props().onContentSizeChange(nativeEvent);
    textInput.props().onChangeText('Friday');
    textInput.props().onChange();
    textInput.props().onFocus();
    textInput.getElement().ref({});
    expect(tree.state().height).toBe(120);
    expect(tree.state().attachAudioBtn).toBe(false);
    expect(tree.state().actionsMenu).toBe(false);
    expect(instance.onChangeTextInput).toBeCalled();
    expect(instance.composerRef).toBeTruthy();
  });
});

it('onPress of a navbar back button from ReplyMessageScene', () => {
  Actions.currentScene = 'ReplyMessageScene';
  Actions.pop.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const backButton = tree
    .find('NavBar')
    .shallow()
    .find({ name: 'chevron-left' })
    .parent();
  backButton.props().onPress();
  expect(Actions.pop).toBeCalled();
});

it('onPress of a navbar back button from other scene', () => {
  Actions.currentScene = 'ChatListScene';
  Actions.pop.mockClear();
  const tree = shallow(<ReplyMessage {...props} />);
  const backButton = tree
    .find('NavBar')
    .shallow()
    .find({ name: 'chevron-left' })
    .parent();
  backButton.props().onPress();
  expect(Actions.pop).not.toBeCalled();
});

it('GiftedChat onSend & renderBubble', () => {
  const tree = shallow(<ReplyMessage {...props} />);
  const instance = tree.instance();
  instance.onSend = jest.fn();
  instance.renderBubble = jest.fn();
  const giftedChat = tree.find('GiftedChat');
  giftedChat.props().onSend();
  giftedChat.props().renderBubble();
  expect(instance.onSend).toBeCalled();
  expect(instance.renderBubble).toBeCalled();
});
