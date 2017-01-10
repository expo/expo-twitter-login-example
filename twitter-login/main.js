import Exponent from 'exponent';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';

class App extends React.Component {

  _loginWithTwitter = async ()=> {
    //Call your backend to get the redirect URL with its authorization header containing a signature.
    let redirectURL = await fetch('http://localhost:3000/getRedirectURL', { method: 'GET' });
    console.warn(redirectURL);
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Example: Twitter login</Text>
        <Button title='Login with Twitter' onPress={this._loginWithTwitter} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
  }
});

Exponent.registerRootComponent(App);
