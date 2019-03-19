import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  // StyleSheet,
  Platform,
  TextInput,
  Keyboard,
  // ActionSheetIOS,
  ScrollView,
  Dimensions,
  BackHandler,
  // Alert,
  PermissionsAndroid,
} from 'react-native';
import PropTypes from 'prop-types';
import emoji from 'node-emoji';
import { styles } from 'react-native-theme';
import { Actions } from 'react-native-router-flux';
import { Colors } from '@ui/theme_default';
import { GiftedChat, MessageText, Bubble, Send, Composer } from 'react-native-gifted-chat';
import { iOSColors } from 'react-native-typography';
import ImagePicker from 'react-native-image-crop-picker';
import FastImage from 'react-native-fast-image';
import {
  NavBar,
  Icon,
  Avatar,
  // FontAwesomeIcon,
  FeatherIcon,
  UploadProgress,
  Screen,
} from '@ui/components';
import { AttachAudio, AudioPlay } from '@ui/attachments';
// import DBManager from '../app/DBManager';
import {DBManager} from 'app-module';
import {Application} from '@mongrov/config';
import videoThumbnail from '../../../src/images/videoThumb.jpg';

export default class ReplyMessage extends Component {
  constructor(props) {
    super(props);
    const { group, user, replyMessage, canDelete } = props;

    this._isMounted = false;
    this.group = group;
    // console.log('nanda props', this.group);
    this.user = user;
    this.replyMessage = replyMessage;
    this.canDelete = canDelete;
    this.textInputValue = '';

    this.state = {
      childMessages: [],
      parentMessage: {},
      // showActions: false,
      isIphoneX: false,
      height: 44,
      // showSendBtn: false,
      attachAudioBtn: false,
      actionsMenu: false,
      botVoice: false,
      attachAudio: false,
      // typingText: null,
      // inProgress: false,
      // uploadingFile: [],
      // msgLikes,
    };
  }

  componentWillMount() {
    const { messages, replyMessage } = this.props;
    const parentMessage = DBManager.group.findRootMessage(replyMessage._id);
    // console.log('ROOT MESSAGE', parentMessage);
    // const childMessages = this.findChildMessages(messages, replyMessage._id);
    const childMessages = DBManager.group.findAllChildMessages(messages, parentMessage._id);
    this.setState({ childMessages, parentMessage });
    this.isIphoneX();

    // audio attachment
    const msgAudio = DBManager.app.getSettingsValue('Message_AudioRecorderEnabled');
    // console.log('MESSAGE AUDIO', msgAudio);
    if (msgAudio && msgAudio.value) {
      this.setState({ attachAudioBtn: true });
    }
  }

  componentDidMount() {
    this._isMounted = true;

    DBManager.group.addGroupMessageListner(this.fetchGroupMessages);
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
  }

  componentWillUnmount() {
    this._isMounted = false;

    DBManager.group.removeGroupMessageListener(this.fetchGroupMessages);
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
  }

  componentDidUpdate = (prevProps, prevState) => {
    const { dataToUpload, imageCaption, attachAudio } = this.props;
    if (dataToUpload !== prevProps.dataToUpload) {
      this.uploadMedia(this.group._id, dataToUpload, imageCaption);
    }
    if (attachAudio !== prevState.attachAudio) {
      this.setState({ attachAudio, attachAudioBtn: true });
    }
  };

  onSend = (messages = []) => {
    const { chat } = DBManager._taskManager;
    const { user, group, replyMessage } = this;
    if (Platform.OS !== 'ios') {
      this.setState({ height: 44, attachAudioBtn: true });
      this.composerRef.clear();
      this.textInputValue = '';
    }
    if (replyMessage._id) {
      chat.sendThreadedMessageJob(group, replyMessage._id, messages[0]);
    }
    chat.sendTypingNotificationJob(this.groupId, user, false);
  };

  onChangeTextInput = (text) => {
    const textLength = text.trim().length;
    this.setState({ attachAudioBtn: !textLength });
    this.textInputValue = text;
  };

  // Android hardware back
  handleBackPress = () => {
    Actions.pop();
    return true;
  };

  // File upload functions

  uploadMedia = (groupId, dataToUpload, imageCaption) => {
    const { chat } = DBManager._taskManager;
    const isImage = !dataToUpload.uri.endsWith('mp4');
    chat.uploadMediaJob(dataToUpload, groupId, isImage, imageCaption, this.replyMessage._id);
  };

  renderAvatar = (props) => (
    <View style={styles.marginRight6}>
      <Avatar
        // statusColor={item.type === 'd' ? statusColor : 'transparent'}
        avatarUrl={`${Application.urls.SERVER_URL}/avatar/${
          props.currentMessage.user.username
        }?_dc=undefined`}
        avatarName={props.currentMessage.user.name}
        key={props.currentMessage.user.avatar}
        avatarSize={30}
      />
    </View>
  );

  getImageSizes = () => {
    const { width, height } = Dimensions.get('window');
    let imgHeight = height / 3;
    if (width > height) {
      imgHeight = height / 8;
    }
    return { width, height: imgHeight };
  };

  // findChildMessages = (messages, parentMsgId) =>
  //   messages.filter((msg) => msg.isReply && msg.replyMessageId === parentMsgId);

  // findAllChildMessages = (messages, rootMsgId) => {
  //   const isChildOfRoot = (messageId, parentMsgIdSet) => {
  //     // console.log('PARENT MESSAGES', parentMsgIdSet);
  //     const message = DBManager.group.findMessageById(messageId);
  //     // console.log('MESSAGE', message);
  //     if (message && message.isReply && message.replyMessageId) {
  //       if (parentMsgIdSet.has(message.replyMessageId)) {
  //         parentMsgIdSet.add(message._id);
  //         return true;
  //       }
  //       return isChildOfRoot(message.replyMessageId, parentMsgIdSet);
  //     }
  //     return false;
  //   };
  //   const parentsIdSet = new Set([rootMsgId]);
  //   const filteredMessages = messages.filter((msg) => isChildOfRoot(msg._id, parentsIdSet));
  //   // console.log('CHILD MESSAGES', filteredMessages);
  //   return filteredMessages;
  //   // return messages.filter((msg) => isChildOfRoot(msg, parentsIdSet));
  // };

  deleteMessage = (messageId, userId) => {
    // console.log(`User ${userId} selected message ${messageId} to delete`);
    const { user, group } = this;

    // can delete only own messages
    if (userId === user._id) {
      const { chat } = DBManager._taskManager;
      chat.deleteMessageJob(group._id, messageId);
    }
  };

  toggleActionsMenu = () => {
    const { actionsMenu } = this.state;
    this.setState({ actionsMenu: !actionsMenu });
  };

  checkPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version > 23) {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
    }
  };

  takePhoto = async () => {
    this.toggleActionsMenu();
    Actions.ReplyCameraScreen();
  };

  openPhotoLibrary = async () => {
    this.toggleActionsMenu();
    Actions.ReplyPhotoLibrary();
  };

  isIphoneX = () => {
    const d = Dimensions.get('window');
    const { height, width } = d;

    if (Platform.OS === 'ios' && (height === 812 || width === 812)) {
      this.setState({ isIphoneX: true });
    }
  };

  setGroupMessagesAsRead = (isUnread) => {
    if (isUnread) {
      DBManager._taskManager.chat.sendReadStatusJob(this.group._id);
    }
  };

  fetchGroupMessages = async () => {
    if (this._isMounted && this.group._id) {
      const { parentMessage } = this.state;
      const groupMessages = await DBManager.group.getGroupMessages(this.group._id);
      // console.log('LAST GROUP MESSAGE', groupMessages[0]);
      const group = await DBManager.group.findById(this.group._id);
      const childMessages = DBManager.group.findAllChildMessages(groupMessages, parentMessage._id);
      // console.log('LAST CHILD MESSAGE', childMessages[0]);

      this.setState({ childMessages });
      this.setGroupMessagesAsRead(group.unread);
    }
  };

  renderBubble = (props) => {
    let displayName = false;
    let imageMessageLoading = false;
    const { status, image, remoteFile, user, isReply } = props.currentMessage;
    const hasAttachment = image || remoteFile;

    if (props.position === 'left') {
      if (
        !(
          props.isSameUser(props.currentMessage, props.previousMessage) &&
          props.isSameDay(props.currentMessage, props.previousMessage)
        )
      ) {
        displayName = true;
      }
    }

    if (hasAttachment && props.position === 'right' && status === 0) {
      imageMessageLoading = true;
    }

    // deleted messages(status === -1) removed immediately
    if (status === -1) {
      return null;
    }

    return (
      <View>
        {displayName && <Text style={[styles.chatDetailUserName]}>{user.name}</Text>}
        <Bubble
          {...props}
          wrapperStyle={{
            left: styles.chatDetailLeftBubble,
            right: imageMessageLoading
              ? [styles.chatDetailRightBubble, { backgroundColor: iOSColors.lightGray }]
              : styles.chatDetailRightBubble,
          }}
          textStyle={{
            left: styles.chatDetailBubbleLeftText,
            right: styles.chatDetailBubbleRightText,
          }}
          renderTicks={this.renderTick}
          renderCustomView={(_props) => this.renderFileAttachment(_props)}
          renderMessageText={isReply ? this.renderMessage : null}
        />
      </View>
    );
  };

  renderTick = (currentMessage) => {
    const { user } = this;
    const { user: messageUser, status } = currentMessage;
    if (messageUser._id !== user._id) {
      return null;
    }
    if (status > 0) {
      return (
        <View style={[styles.rowDirection, styles.marginRight8]}>
          {status <= 100 && <Text style={styles.chatDetailTickMark}>✓</Text>}
          {status === 100 && <Text style={styles.chatDetailTickMark}>✓</Text>}
        </View>
      );
    }
    return null;
  };

  renderFileAttachment = (props) => {
    const { position } = props;
    const { status, remoteFile, remoteFileType, type, uploadFilePercent } = props.currentMessage;
    const { canDelete } = this.state;
    const filePath = status > 0 ? remoteFile : '';
    const showPlayer = status > 0;
    const playerThumbnail = status > 0 ? videoThumbnail : { uri: '' };

    if (remoteFile && (type === 3 || (remoteFileType && remoteFileType.startsWith('audio')))) {
      return (
        <TouchableOpacity style={styles.padding3}>
          {status === 0 &&
            uploadFilePercent >= 0 && <UploadProgress uploadFilePercent={uploadFilePercent} />}

          <AudioPlay
            audioFile={filePath}
            showPlayer={showPlayer}
            showDelete={canDelete}
            position={position}
            deleteMessage={() =>
              this.deleteMessage(props.currentMessage._id, props.currentMessage.user._id)
            }
          />
        </TouchableOpacity>
      );
    }
    if (remoteFile && (type === 2 || (remoteFileType && remoteFileType.startsWith('video')))) {
      return (
        <TouchableOpacity
          style={styles.padding3}
          onPress={() => {
            // do not show preview for un-uploaded video
            if (Actions.currentScene === 'ReplyMessageScene' && status > 0) {
              this.setState({ actionsMenu: false });
              Keyboard.dismiss();
              Actions.VideoPreview({
                videoUrl: filePath,
                // deleteMessage: () =>
                //   this.deleteMessage(props.currentMessage._id, props.currentMessage.user._id),
                showDelete: canDelete,
              });
            }
          }}
        >
          {status === 0 &&
            uploadFilePercent >= 0 && <UploadProgress uploadFilePercent={uploadFilePercent} />}

          <FastImage style={styles.chatDetailImageMessageView} source={playerThumbnail}>
            <View
              style={{
                position: 'absolute',
                width: '100%',
                top: '35%',
                left: 0,
                right: 0,
                flex: 1,
                alignItems: 'center',
              }}
            >
              {status > 0 && (
                <Icon name="play-circle" type="material-community" size={48} color="#000" />
              )}
            </View>
          </FastImage>
        </TouchableOpacity>
      );
    }
    return null;
  };

  checkAudioPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version > 23) {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);
    }
  };

  renderSend = (props) => {
    const { attachAudioBtn, botVoice } = this.state;
    // const textLength = props.text.trim().length;
    // if (textLength > 0) {
    //   return (
    //     <Send {...props} containerStyle={[styles.alignJustifyCenter, styles.marginRight5]}>
    //       <View style={[styles.chatDetailSendView, styles.alignJustifyCenter]}>
    //         <Icon name="send" color={Colors.TEXT_HEADER} size={28} />
    //       </View>
    //     </Send>
    //   );
    // }
    if (Platform.OS === 'ios' && props.text.trim().length > 0) {
      return (
        <Send {...props} containerStyle={[styles.alignJustifyCenter, styles.marginRight5]}>
          <View style={[styles.chatDetailSendView, styles.alignJustifyCenter]}>
            <Icon name="send" color={Colors.TEXT_HEADER} size={28} />
          </View>
        </Send>
      );
    }
    if (!attachAudioBtn) {
      return (
        <Send
          {...props}
          text={this.textInputValue}
          containerStyle={[styles.alignJustifyCenter, styles.marginRight5]}
        >
          <View style={[styles.chatDetailSendView, styles.alignJustifyCenter]}>
            <Icon name="send" color={Colors.TEXT_HEADER} size={28} />
          </View>
        </Send>
      );
    }
    if (/* textLength === 0 && */ attachAudioBtn && Application.APPCONFIG.ATTACH_AUDIO) {
      if (!botVoice) {
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <TouchableOpacity
              style={[styles.alignJustifyCenter, styles.chatDetailAudioButtonDimension]}
              onPress={async () => {
                Keyboard.dismiss();
                await this.checkAudioPermission();
                this.setState({
                  actionsMenu: false,
                  attachAudio: true,
                });
              }}
            >
              <Icon
                name="microphone"
                type="material-community"
                size={30}
                color={Colors.TEXT_HEADER}
              />
            </TouchableOpacity>
          </View>
        );
      }
      return null;
    }
  };

  renderMessageImage = (props) => {
    const { status, _id, image, user, uploadFilePercent } = props.currentMessage;
    const { canDelete } = this;
    // console.log(`Status ${status}, image ${image}, percentage ${uploadFilePercent}`);
    return (
      <TouchableOpacity
        onPress={() => {
          if (Actions.currentScene === 'ReplyMessageScene') {
            this.setState({ actionsMenu: false });
            Actions.ViewImage({
              imageUrl: image,
              goBack: () => Actions.pop,
              deleteMessage: () => this.deleteMessage(_id, user._id),
              showDelete: canDelete,
            });
          }
        }}
        style={{ padding: 3 }}
      >
        {status === 0 &&
          uploadFilePercent >= 0 && <UploadProgress uploadFilePercent={uploadFilePercent} />}

        <FastImage
          style={styles.chatDetailImageMessageView}
          source={{
            uri: image,
            priority: FastImage.priority.high,
          }}
        />
      </TouchableOpacity>
    );
  };

  renderReplyMessage = (replyMessage) => {
    const { image, remoteFile, remoteFileType, type, status } = replyMessage;
    const imgSizes = this.getImageSizes();
    const { width, height } = imgSizes;
    const imagePadding = 8;
    const imageWidth = width - imagePadding * 2;
    const imageHeight = height - imagePadding * 2;

    // attachments (video, audio)
    let showVideo, showAudio, playerThumbnail, filePath;
    if (remoteFile) {
      showVideo = type === 2 || (remoteFileType && remoteFileType.startsWith('video'));
      playerThumbnail = status > 0 ? videoThumbnail : '';
      showAudio = type === 3 || (remoteFileType && remoteFileType.startsWith('audio'));
      filePath = status > 0 ? remoteFile : '';
    }

    let content;
    if (image) {
      content = (
        <View
          style={{
            // alignItems: 'center',
            position: 'relative',
            backgroundColor: iOSColors.lightGray,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: 0,
            // maxHeight: height,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              if (Actions.currentScene === 'ReplyMessageScene') {
                Actions.ViewImage({
                  imageUrl: image,
                  goBack: () => Actions.pop,
                  // deleteMessage: () =>
                  //   this.deleteMessage(props.currentMessage._id, props.currentMessage.user._id),
                  // showDelete: canDelete,
                });
              }
            }}
            style={{ padding: imagePadding }}
          >
            <FastImage
              style={[
                styles.chatDetailImageMessageView,
                { width: imageWidth, height: imageHeight },
              ]}
              source={{
                uri: image,
                priority: FastImage.priority.high,
              }}
            />
          </TouchableOpacity>
        </View>
      );
    } else if (showVideo) {
      content = (
        <View
          style={{
            // alignItems: 'center',
            position: 'relative',
            backgroundColor: iOSColors.lightGray,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: 0,
            // maxHeight: height,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              // do not show preview for un-uploaded video
              if (Actions.currentScene === 'ReplyMessageScene' && status > 0) {
                this.setState({ actionsMenu: false });
                Keyboard.dismiss();
                Actions.VideoPreview({
                  videoUrl: filePath,
                  showDelete: false,
                });
              }
            }}
            style={{ padding: imagePadding }}
          >
            <FastImage
              style={[
                styles.chatDetailImageMessageView,
                { width: imageWidth, height: imageHeight },
              ]}
              source={playerThumbnail}
            >
              <View
                style={{
                  position: 'absolute',
                  width: '100%',
                  top: '35%',
                  left: 0,
                  right: 0,
                  flex: 1,
                  alignItems: 'center',
                }}
              >
                {status > 0 && (
                  <Icon name="play-circle" type="material-community" size={48} color="#000" />
                )}
              </View>
            </FastImage>
          </TouchableOpacity>
        </View>
      );
    } else if (showAudio) {
      content = (
        <View
          style={{
            // alignItems: 'center',
            position: 'relative',
            backgroundColor: Colors.BG_WHITE,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: 10,
            maxHeight: height,
          }}
        >
          <View
            style={[
              styles.padding3,
              {
                backgroundColor: Colors.BG_CHAT_DETAIL_BUBBLE_RIGHT,
                paddingBottom: 16,
                paddingTop: 10,
                borderRadius: 8,
                // width: '75%',
                marginBottom: 5,
              },
            ]}
          >
            <AudioPlay
              audioFile={filePath}
              showPlayer={status > 0}
              showDelete={false}
              position="right"
            />
          </View>
        </View>
      );
    } else {
      content = (
        <View
          style={{
            // alignItems: 'center',
            position: 'relative',
            backgroundColor: Colors.BG_WHITE,
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: 10,
            maxHeight: height,
          }}
        >
          <ScrollView>
            <View
              style={{
                borderRadius: 5,
                borderWidth: 1,
                borderColor: Colors.BG_REPLY_BORDER,
                padding: 10,
                backgroundColor: Colors.BG_WHITE,
              }}
            >
              <Text style={{ fontSize: 16, flex: 1, color: Colors.TEXT_DARK }}>
                {replyMessage.text}
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }
    return content;
  };

  renderActions = () => (
    <TouchableOpacity
      style={{
        width: 45,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={this.toggleActionsMenu}
    >
      <FeatherIcon name="plus-circle" color={iOSColors.gray} size={30} />
    </TouchableOpacity>
  );

  pickVideosFromGallery = () => {
    this.toggleActionsMenu();
    ImagePicker.openPicker({
      multiple: true,
      waitAnimationEnd: false,
      // includeExif: true,
      mediaType: 'video',
      maxFiles: 1,
    }).then((videos) => {
      // console.log('received video 1', videos);
      Actions.refresh({
        dataToUpload: { uri: videos[0].path, size: videos[0].size },
        imageCaption: 'Video Message',
      });
    });
    // .catch((error) => console.log('PICK VIDEOS ERROR', error));
  };

  renderChatFooter = () => {
    const { actionsMenu } = this.state;
    if (actionsMenu) {
      return (
        <View style={styles.chatDetailFooterContainer}>
          <TouchableOpacity
            style={styles.chatDetailFooterContentButton}
            onPress={async () => {
              if (Actions.currentScene === 'ReplyMessageScene') {
                await this.checkPermission();
                this.openPhotoLibrary();
              }
            }}
          >
            <View style={[styles.chatDetailFooterIconView, { backgroundColor: iOSColors.blue }]}>
              <FeatherIcon name="image" color={Colors.TEXT_WHITE} size={30} />
            </View>
            <Text style={styles.fontSize12}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.chatDetailFooterContentButton}
            onPress={() => {
              if (Actions.currentScene === 'ReplyMessageScene') {
                this.takePhoto();
              }
            }}
          >
            <View
              style={[styles.chatDetailFooterIconView, { backgroundColor: iOSColors.tealBlue }]}
            >
              <FeatherIcon name="camera" color={Colors.TEXT_WHITE} size={30} />
            </View>
            <Text style={styles.fontSize12}>Camera</Text>
          </TouchableOpacity>
          {Application.APPCONFIG.ATTACH_VIDEO && (
            <TouchableOpacity
              style={styles.chatDetailFooterContentButton}
              onPress={async () => {
                if (Actions.currentScene === 'ReplyMessageScene') {
                  this.pickVideosFromGallery();
                }
              }}
            >
              <View style={[styles.chatDetailFooterIconView, { backgroundColor: iOSColors.blue }]}>
                <FeatherIcon name="video" color={Colors.TEXT_WHITE} size={30} />
              </View>
              <Text style={styles.fontSize12}>Videos</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
  };

  renderAudioRecorder = () => <AttachAudio />;

  renderMessage = (props) => {
    let { text } = props.currentMessage;
    const result = text.split(')');
    text = result[result.length - 1].trim();
    text = emoji.emojify(text);
    const transformedMessage = { ...props.currentMessage, text };

    return <MessageText {...props} currentMessage={transformedMessage} />;
  };

  renderComposer = (props) => {
    const { height } = this.state;
    const inputHeight = Math.min(120, Math.max(44, height));
    // uncontrolled text input for Android
    if (Platform.OS !== 'ios') {
      return (
        <View style={[styles.composerContainerAndroid, styles.paddingLeft6]}>
          <TextInput
            multiline
            placeholder="Type a message..."
            placeholderTextColor={Colors.TYP_MIDGRAY}
            style={[styles.composerInput, { height: inputHeight }]}
            onContentSizeChange={(event) => {
              this.setState({
                height: event.nativeEvent.contentSize.height,
              });
            }}
            underlineColorAndroid={Colors.TRANSPARENT}
            disableFullscreenUI={true}
            ref={(component) => {
              this.composerRef = component;
            }}
            onChangeText={(text) => this.onChangeTextInput(text)}
            onChange={() => this.setState({ attachAudioBtn: false })}
            onFocus={() => this.setState({ actionsMenu: false })}
          />
        </View>
      );
    }
    // default composer for ios
    return <Composer {...props} />;
  };

  render() {
    const { user /* canDelete */ } = this;
    const { childMessages, parentMessage, isIphoneX, attachAudio } = this.state;
    // console.log('MESSAGES', childMessages);

    return (
      <Screen>
        <NavBar
          leftComponent={
            <TouchableOpacity
              style={[styles.navSideButtonDimension, styles.alignJustifyCenter]}
              onPress={() => {
                if (Actions.currentScene === 'ReplyMessageScene') {
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
          // rightComponent={
          //   canDelete && (
          //     <TouchableOpacity
          //       onPress={() => {
          //         Alert.alert(
          //           'Delete',
          //           'Do you want to delete message?',
          //           [
          //             { text: 'No', onPress: () => {}, style: 'cancel' },
          //             {
          //               text: 'Yes',
          //               onPress: () => {
          //                 this.deleteMessage(replyMessage._id, replyMessage.user._id);
          //                 Actions.pop();
          //               },
          //             },
          //           ],
          //           { cancelable: false },
          //         );
          //       }}
          //     >
          //       <FontAwesomeIcon
          //         name="trash-o"
          //         type="material-community"
          //         color={Colors.NAV_ICON}
          //         size={28}
          //       />
          //     </TouchableOpacity>
          //   )
          // }
          titleText="Reply Message"
        />
        {this.renderReplyMessage(parentMessage)}

        {user && (
          <View style={[styles.flex1, styles.chatDetailContainer]}>
            <GiftedChat
              messages={childMessages}
              onSend={(_messages) => this.onSend(_messages)}
              // onInputTextChanged={(event) => this.onInputTextChanged(event)}
              user={{
                _id: user._id,
                // avatar: this.state.user.avatar,
              }}
              keyboardShouldPersistTaps="handled"
              isAnimated={true}
              // Renders
              renderAvatarOnTop={true}
              renderBubble={(props) => this.renderBubble(props)}
              renderAvatar={this.renderAvatar}
              renderMessageImage={this.renderMessageImage}
              // renderFooter={this.renderFooter}
              renderSend={this.renderSend}
              renderComposer={this.renderComposer}
              renderActions={this.renderActions}
              renderInputToolbar={attachAudio ? this.renderAudioRecorder : null}
              // renderInputToolbar={this.renderInputToolbar}
              renderChatFooter={this.renderChatFooter}
              // minInputToolbarHeight={100}
              alwaysShowSend={true}
              bottomOffset={isIphoneX ? 30 : 0}
              textInputStyle={styles.chatDetailTextInput}
              containerStyle={{
                backgroundColor: Colors.BG_CHAT_DETAIL,
                borderTopWidth: 0,
                paddingTop: 3,
              }}
            />
          </View>
        )}
      </Screen>
    );
  }
}

ReplyMessage.defaultProps = {
  group: {},
  user: {},
  messages: [],
  replyMessage: {},
  canDelete: false,
};

ReplyMessage.propTypes = {
  group: PropTypes.object,
  user: PropTypes.object,
  messages: PropTypes.array,
  replyMessage: PropTypes.object,
  canDelete: PropTypes.bool,
};
