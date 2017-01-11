import Exponent from 'exponent';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';

const redirectURLEndpoint = 'http://localhost:3000/redirect_url';
const accessTokenEndpoint = 'http://localhost:3000/access_token';

class App extends React.Component {

  state = {
    username: undefined,
  }

  _loginWithTwitter = async (): Promise => {
    // Call your backend to get the redirect URL, Exponent will take care of redirecting the user.
    const redirectURLRequest = await fetch(redirectURLEndpoint,
      { method: 'GET',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
    const redirectURL = JSON.parse(redirectURLRequest._bodyText).redirectURL;
    const redirectResult = await this._redirect(redirectURL);
    if (redirectResult.type === 'cancel') {
      return ['TWITTER ERROR', 'Twitter redirection failure'];
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
    const accessTokenURL = accessTokenEndpoint + this._toQueryString({ oauth_verifier: verifier });

    const accessTokenRequest = await fetch(accessTokenURL, { method: 'GET', headers: { Accept: 'application/json' } });
    const accessTokenResponse = JSON.parse(accessTokenRequest._bodyText).accessTokenResponse;
    const userId = accessTokenResponse.user_id;
    const username = accessTokenResponse.screen_name;
    const authToken = accessTokenResponse.oauth_token;
    const authTokenSecret = accessTokenResponse.oauth_token_secret;
    if (userId !== undefined) {
      this.setState({ username });
      return { type: 'success', userId, username, authToken, authTokenSecret };
    }
    return { type: 'cancel' };
  }

  _redirect = async (authURL: string): Promise => {
    const redirectResult = await Exponent.OAuth.redirect(
      authURL,
    );
    return redirectResult;
  }

  /**
 * Converts an object to a query string.
 */
  _toQueryString(params: Object): string {
    let result = '?';
    for (const [key, value] of Object.entries(params)) {
    // $FlowFixMe
      result += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
    }
    return result.slice(0, -1);
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
