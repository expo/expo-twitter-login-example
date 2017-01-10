import Exponent from 'exponent';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';

type RedirectResult = {
  type: 'cancel',
} | {
  type: 'success',
  response: string,
};

class App extends React.Component {

  _loginWithTwitter = async ()=> {
    //Call your backend to get the redirect URL with its authorization header containing a signature.
    let redirectURLRequest = await fetch('http://localhost:3000/getRedirectURL',
                                  { method: 'GET',
                                   headers:{ 'Content-Type':'application/json', 'Accept':'application/json' }});
    let redirectURL = JSON.parse(redirectURLRequest._bodyText)['redirectURL'];
    let redirectResult = this._redirect(redirectURL);
    if (redirectResult.type === 'cancel') {
      return ['TWITTER ERROR', 'Twitter redirection failure'];
    }

  }

  _redirect = async (authURL:string):Promise<RedirectResult> => {
    let redirectResult = await Exponent.Twitter.redirect(
      authURL,
    );
    return redirectResult;
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
