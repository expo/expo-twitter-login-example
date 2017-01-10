import Exponent from 'exponent';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';

class App extends React.Component {

  state = {
    username: undefined,
  }

  _loginWithTwitter = async ():Promise=> {
    //Call your backend to get the redirect URL, Exponent will take care of redirecting the user.
    let redirectURLRequest = await fetch('http://localhost:3000/redirect_url',
                                  { method: 'GET',
                                   headers:{ 'Content-Type':'application/json', 'Accept':'application/json' }});
    let redirectURL = JSON.parse(redirectURLRequest._bodyText)['redirectURL'];
    let redirectResult = await this._redirect(redirectURL);
    if (redirectResult.type === 'cancel') {
      return ['TWITTER ERROR', 'Twitter redirection failure'];
    }
    //Once redirected, we need the verifier to convert our token to an access token
    let redirectResponse = redirectResult.response;
    let redirectSplit = redirectResponse.split('?');
    let redirectSecondSplit = redirectSplit[1].split('&');

    let dictionaryOfRedirectKeyValuePairs = {};
    for (let redirectKeyPair of redirectSecondSplit) {
      let redirectThirdSplit = redirectKeyPair.split('=');
      dictionaryOfRedirectKeyValuePairs[redirectThirdSplit[0]] = redirectThirdSplit[1];
    }
    const verifier = dictionaryOfRedirectKeyValuePairs['oauth_verifier'];
    let accessTokenURL = 'http://localhost:3000/access_token' + this._toQueryString({ 'oauth_verifier':verifier });

    let accessTokenRequest = await fetch(accessTokenURL,{ method: 'GET', headers:{'Accept':'application/json' }, });
    let accessTokenResponse = JSON.parse(accessTokenRequest._bodyText)['accessTokenResponse'];
    console.log(accessTokenResponse);
    const userId = accessTokenResponse['user_id'];
    const username = accessTokenResponse['screen_name'];
    const authToken = accessTokenResponse['oauth_token'];
    const authTokenSecret = accessTokenResponse['oauth_token_secret'];
    if (userId !== undefined){
      this.setState({username});
      return {'type':'success', userId, username, authToken, authTokenSecret};
    }
  }

  _redirect = async (authURL:string):Promise => {
    let redirectResult = await Exponent.Twitter.redirect(
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
    console.log(this.state.username);
    return (
      <View style={styles.container}>
        {this.state.username !== undefined ?
          <Text style={styles.title}>Hi {this.state.username}!</Text> :
          <View><Text style={styles.title}>Example: Twitter login</Text>
            <Button title='Login with Twitter' onPress={this._loginWithTwitter} />
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
  }
});

Exponent.registerRootComponent(App);
