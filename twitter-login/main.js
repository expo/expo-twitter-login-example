import Exponent from 'exponent';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
  Linking,
} from 'react-native';

const redirectURLEndpoint = 'http://localhost:3000/redirect_url';
const accessTokenEndpoint = 'http://localhost:3000/access_token';

// Twitter tokens
let authToken;
let secretToken;

class App extends React.Component {
  state = {
    username: undefined,
  };

  componentDidMount() {
    Linking.addEventListener('url', this._handleTwitterRedirect);
  }

  _handleTwitterRedirect = async (event) => {
    // Parse the response query string into an object.
    const [, queryString] = event.url.split('?');
    const responseObj = queryString.split('&').reduce((map, pair) => {
      const [key, value] = pair.split('=');
      map[key] = value; // eslint-disable-line
      return map;
    }, {});


    const verifier = responseObj.oauth_verifier;
    console.log(verifier);
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
    Exponent.WebBrowser.dismissBrowser();
  }

  _loginWithTwitter = async () => {
    // Call your backend to get the redirect URL, Exponent will take care of redirecting the user.
    const redirectURLResult = await fetch(redirectURLEndpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    }).then(res => res.json());
    authToken = redirectURLResult.token;
    secretToken = redirectURLResult.secretToken;
    Exponent.WebBrowser.openBrowserAsync(redirectURLResult.redirectURL);
    // const openBrowserResult = await Exponent.WebBrowser.openBrowserAsync(redirectURLResult.redirectURL);
    // if (openBrowserResult.type === 'cancel') {
    //   return;
    // }
    //
    // const verifier = openBrowserResult.response.oauth_verifier;
    // const accessTokenURL = accessTokenEndpoint + this._toQueryString({
    //   oauth_verifier: verifier,
    //   oauth_token: authToken,
    //   oauth_token_secret: secretToken,
    // });
    //
    // const accessTokenResult = await fetch(accessTokenURL, {
    //   method: 'GET',
    //   headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    // }).then(res => res.json());
    //
    // const accessTokenResponse = accessTokenResult.accessTokenResponse;
    // const username = accessTokenResponse.screen_name;
    //
    // this.setState({ username });
  };

  /**
   * Converts an object to a query string.
   */
  _toQueryString(params) {
    return '?' + Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.username !== undefined ?
          <Text style={styles.title}>Hi {this.state.username}!</Text> :
          <View>
            <Text style={styles.title}>Example: Twitter login</Text>
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
