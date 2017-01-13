import Exponent from 'exponent';
import React from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';

const redirectURLEndpoint = 'http://localhost:3000/redirect_url';
const accessTokenEndpoint = 'http://localhost:3000/access_token';

// Twitter tokens
let authToken;
let secretToken;

class App extends React.Component {

  state = {
    username: undefined,
  }

  _loginWithTwitter = async (): Promise => {
    // Call your backend to get the redirect URL, Exponent will take care of redirecting the user.
    const redirectURL = await fetch(redirectURLEndpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    }).then(res => res.json());
    authToken = redirectURL.token;
    secretToken = redirectURL.secretToken;
    const redirectResult = await Exponent.OAuth.redirectAsync(redirectURL.redirectURL);
    if (redirectResult.type === 'cancel') {
      Alert.alert('User canceled');
      return;
    }

    // Once redirected, we need the verifier to convert our token to an access token
    const redirectResponse = redirectResult.response;
    const redirectSplit = redirectResponse.split('?');
    const redirectSecondSplit = redirectSplit[1].split('&');

    const dictionaryOfRedirectKeyValuePairs = {};
    for (const redirectKeyPair of redirectSecondSplit) {
      const redirectThirdSplit = redirectKeyPair.split('=');
      dictionaryOfRedirectKeyValuePairs[redirectThirdSplit[0]] = redirectThirdSplit[1];
    }
    const verifier = dictionaryOfRedirectKeyValuePairs.oauth_verifier;
    const accessTokenURL = accessTokenEndpoint + this._toQueryString({
      oauth_verifier: verifier,
      oauth_token: authToken,
      oauth_token_secret: secretToken,
    });

    const accessTokenResult = await fetch(accessTokenURL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    }).then(res => res.json());

    const accessTokenResponse = accessTokenResult.accessTokenResponse;
    const username = accessTokenResponse.screen_name;

    this.setState({ username });
  }

  /**
   * Converts an object to a query string.
   */
  _toQueryString(params: Object): string {
    return '?' + Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.username !== undefined ?
          <Text style={styles.title}>Hi {this.state.username}!</Text> :
          <View><Text style={styles.title}>Example: Twitter login</Text>
            <Button title="Login with Twitter" onPress={this._loginWithTwitter} />
          </View>
        }
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
  },
});

Exponent.registerRootComponent(App);
