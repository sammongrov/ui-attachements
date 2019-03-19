import React, { Component } from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { styles } from 'react-native-theme';
import CameraRollPicker from 'react-native-camera-roll-picker';
import { Colors } from '@ui/theme_default';
import { Icon, NavBar, Screen } from '@ui/components';
import { Actions } from 'react-native-router-flux';

export default class PhotoLibrary extends Component {
  state = {
    layout: {
      width: Dimensions.get('window').width,
    },
  };

  _onLayout = (event) => {
    this.setState({
      layout: {
        width: event.nativeEvent.layout.width,
      },
    });
  };

  render() {
    const { layout } = this.state;
    return (
      <Screen onLayout={this._onLayout}>
        <View style={[styles.flex1, { width: layout.width, backgroundColor: '#000' }]}>
          <NavBar
            leftComponent={
              <TouchableOpacity
                style={[styles.navSideButtonDimension, styles.alignJustifyCenter]}
                onPress={() => {
                  if (Actions.currentScene === 'PhotoLibraryScene') {
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
            titleText="Image Gallery"
          />
          <CameraRollPicker
            maximum={1}
            assetType="All"
            pageSize={2}
            imagesPerRow={3}
            callback={(images, dataToUpload) => {
              if (Actions.currentScene === 'PhotoLibraryScene') {
                Actions.ImagePreview({
                  imageUrl: dataToUpload.uri,
                  onSuccessAction: (imageCaption) => {
                    Actions.popTo('ChatRoomScene');
                    setTimeout(() => {
                      Actions.refresh({
                        dataToUpload,
                        imageCaption,
                      });
                    }, 0);
                  },
                });
              }
              if (Actions.currentScene === 'ReplyPhotoLibraryScene') {
                Actions.ImagePreview({
                  imageUrl: dataToUpload.uri,
                  onSuccessAction: (imageCaption) => {
                    Actions.popTo('ReplyMessageScene');
                    setTimeout(() => {
                      Actions.refresh({
                        dataToUpload,
                        imageCaption,
                      });
                    }, 0);
                  },
                });
              }
            }}
            selected={[]}
            containerWidth={layout.width}
            selectedMarker={null}
          />
        </View>
      </Screen>
    );
  }
}
