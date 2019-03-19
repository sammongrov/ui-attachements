import React, { Component } from 'react';
import {
  View,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { styles } from 'react-native-theme';
import { Actions } from 'react-native-router-flux';
import PropTypes from 'prop-types';
import { Colors } from '@ui/theme_default';
import { NavBar, Icon } from '@ui/components';

export default class ImagePreview extends Component {
  constructor(props) {
    super(props);
    this.imageData = this.props.imageData; // eslint-disable-line
    this.imageUrl = this.props.imageUrl; // eslint-disable-line
    this.state = {
      messageText: '',
      imageUrl: this.imageUrl,
      height: 40,
    };
    this.groupDetail = this.props.groupDetail; // eslint-disable-line
    this.onSuccessAction = this.props.onSuccessAction; // eslint-disable-line
    this.PreviewSuccess = this.PreviewSuccess.bind(this);
  }

  componentWillMount() {
    // console.log('data-viswa', this.imageData);
  }

  updateSize = (height) => {
    this.setState({
      height,
    });
  };

  PreviewSuccess() {
    const { messageText } = this.state;
    const { onSuccessAction } = this.props;
    onSuccessAction(messageText);
    // this.onSuccessAction(this.groupDetail, this.imageData, messageText);
  }

  render() {
    const { imageUrl, messageText, height } = this.state;
    const newStyle = { height };
    return (
      <View style={[styles.flex1, styles.blackBackground]}>
        <NavBar
          leftComponent={
            <TouchableOpacity
              style={[styles.navSideButtonDimension, styles.alignJustifyCenter]}
              onPress={() => {
                if (Actions.currentScene === 'ImagePreviewScene') {
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
          titleText="Image Preview"
        />
        <Image
          style={styles.alignCenterJustifyEnd}
          source={{
            uri: imageUrl,
          }}
          resizeMode="contain"
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.imagePreviewOverlay, styles.imagePreviewKeyboardView]}
        >
          <View style={[styles.rowFlex, styles.imagePreviewMessagecontainer]}>
            <TextInput
              placeholder="Add Caption..."
              style={[styles.flex1, styles.imagePreviewTextInput, newStyle]}
              onChangeText={(text) => {
                this.setState({ messageText: text });
              }}
              value={messageText}
              underlineColorAndroid="transparent"
              multiline={true}
              onContentSizeChange={(e) => this.updateSize(e.nativeEvent.contentSize.height)}
            />
            <TouchableOpacity
              style={[styles.alignJustifyCenter, styles.imagePreviewSendButton]}
              onPress={() => {
                if (Actions.currentScene === 'ImagePreviewScene') {
                  this.PreviewSuccess();
                }
              }}
            >
              <Icon name="send" size={20} color={Colors.ICON_WHITE} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }
}

ImagePreview.propTypes = {
  imageUrl: PropTypes.string,
  imageData: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  groupDetail: PropTypes.object,
  onSuccessAction: PropTypes.func,
};

ImagePreview.defaultProps = {
  imageUrl: '',
  imageData: {},
  groupDetail: {},
  onSuccessAction: () => {},
};
