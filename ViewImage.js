import React, { Component } from 'react';
import { View, TouchableOpacity, Dimensions, Alert } from 'react-native';
import PropTypes from 'prop-types';
import { styles } from 'react-native-theme';
import ImageViewer from 'react-native-image-zoom-viewer';
import FastImage from 'react-native-fast-image';
import { Colors } from '@ui/theme_default';
import { Icon, Loading, NavBar, Screen, FontAwesomeIcon } from '@ui/components';
import { Actions } from 'react-native-router-flux';

export default class ViewImage extends Component {
  state = {
    layout: {
      height: Dimensions.get('window').height,
      width: Dimensions.get('window').width,
    },
  };

  _onLayout = (event) => {
    this.setState({
      layout: {
        height: event.nativeEvent.layout.height,
        width: event.nativeEvent.layout.width,
      },
    });
  };

  renderBackButton() {
    const { goBack } = this.props;
    return (
      <TouchableOpacity style={styles.cameraBackButton} onPress={goBack}>
        <Icon name="chevron-left" size={30} color={Colors.ICON_WHITE} width={30} />
      </TouchableOpacity>
    );
  }

  render() {
    const { imageUrl, deleteMessage, showDelete } = this.props;
    const { layout } = this.state;
    return (
      <Screen safeBgColors={['#000', '#000']} onLayout={this._onLayout}>
        <View style={[styles.flex1, { width: layout.width, backgroundColor: '#000' }]}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 100,
            }}
          >
            <NavBar
              leftComponent={
                <TouchableOpacity onPress={Actions.pop}>
                  <Icon
                    name="chevron-left"
                    type="material-community"
                    color={Colors.TEXT_WHITE}
                    size={36}
                  />
                </TouchableOpacity>
              }
              rightComponent={
                showDelete && (
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        'Delete',
                        'Do you want to delete message?',
                        [
                          { text: 'No', onPress: () => {}, style: 'cancel' },
                          {
                            text: 'Yes',
                            onPress: () => {
                              deleteMessage();
                              Actions.pop();
                            },
                          },
                        ],
                        { cancelable: false },
                      );
                    }}
                  >
                    <FontAwesomeIcon
                      name="trash-o"
                      type="material-community"
                      color={Colors.TEXT_WHITE}
                      size={22}
                    />
                  </TouchableOpacity>
                )
              }
              titleText="Image Preview"
              textStyle={{ color: Colors.TEXT_WHITE }}
              navContainerStyle={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderBottomWidth: 0,
              }}
            />
          </View>
          <ImageViewer
            imageUrls={[{ url: imageUrl }]}
            backgroundColor={Colors.BG_BLACK}
            enableImageZoom
            loadingRender={() => (
              <View style={styles.alignJustifyCenter}>
                <Loading />
              </View>
            )}
            renderImage={(props) => <FastImage {...props} />}
            renderIndicator={() => {}}
          />
        </View>
      </Screen>
    );
  }
}

ViewImage.propTypes = {
  imageUrl: PropTypes.string,
  goBack: PropTypes.func.isRequired,
};

ViewImage.defaultProps = {
  imageUrl: '',
};
