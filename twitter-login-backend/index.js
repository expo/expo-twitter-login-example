/* eslint-disable babel/new-cap, no-console */

const express = require('express');
const nodeFetch = require('node-fetch');
const Crypto = require('crypto-js');

const app = express();

// Twitter keys
const twitterConsumerSecret = 'QD21zYutGb3fAo3ajzu1P3U3EZYVP2PoPChj8LoCup2EKWNjqG';
const twitterConsumerKey = 'WV9aXjxc8U8Fc9uJh2pGFo6pD';

// URL + Routes
const requestTokenURL = '/oauth/request_token';
const authorizationURL = '/oauth/authorize';
const accessURL = '/oauth/access_token';
const baseURL = 'https://api.twitter.com';


 // Callback URL of your application, change if standalone. Otherwise this is the one for in Exponent apps.
const callbackURL = 'host.exp.exponent://oauthredirect';

app.listen(3000, () => {
  console.log('Twitter login app listening port 3000');
});

app.get('/redirect_url', (req, res) => {
  // Set response to JSON
  res.setHeader('Content-Type', 'application/json');

  // Request Token
  // Creates base header + Request URL
  const tokenRequestHeaderParams = createHeaderBase();
  const tokenRequestURL = baseURL + requestTokenURL;

  // Add additional parameters for signature + Consumer Key
  tokenRequestHeaderParams.oauth_consumer_key = twitterConsumerKey;

  // Creates copy to add additional request params, to then create the signature
  const callBackParam = { oauth_callback: callbackURL };
  const parametersForSignature = Object.assign({}, callBackParam, tokenRequestHeaderParams);
  const signature = createSignature(parametersForSignature, 'POST', tokenRequestURL, twitterConsumerSecret);
  tokenRequestHeaderParams.oauth_signature = signature;
  // Creates the Header String, adds the callback parameter
  const headerString = createHeaderString(tokenRequestHeaderParams);
  const callbackKeyValue = ', oauth_callback="' + encodeURIComponent(callbackURL) + '"';
  const tokenRequestHeader = headerString + callbackKeyValue;
  // Request
  nodeFetch(tokenRequestURL, { method: 'POST', headers: { Authorization: tokenRequestHeader } })
    .then(response => {
      return response.text();
    }).then(response => {
      const tokenResponse = parseFormEncoding(response);
      const authToken = tokenResponse.oauth_token;
      const authTokenSecret = tokenResponse.oauth_token_secret;
      // Token Authorization, send the URL to the native app to then display in 'Webview'
      const authURL = baseURL + authorizationURL + '?oauth_token=' + authToken;
      res.json({ redirectURL: authURL, token: authToken, secretToken: authTokenSecret });
    });
});

// Requires oauth_verifier
app.get('/access_token', (req, res) => {
  const verifier = req.query.oauth_verifier;
  const authToken = req.query.oauth_token;
  const secretToken = req.query.oauth_secret_token;
  // Creates base header + Access Token URL
  const accessTokenHeaderParams = createHeaderBase();
  const accessTokenURL = baseURL + accessURL;

  // Add additional parameters for signature + Consumer Key
  accessTokenHeaderParams.oauth_consumer_key = twitterConsumerKey;
  accessTokenHeaderParams.oauth_token = authToken;
  accessTokenHeaderParams.oauth_token_secret = secretToken;

  const accessTokenSignature = createSignature(accessTokenHeaderParams, 'POST', accessTokenURL, twitterConsumerSecret);
  accessTokenHeaderParams.oauth_signature = accessTokenSignature;

  // Creates the Header String, adds the oauth verfier
  const accessTokenHeaderString = createHeaderString(accessTokenHeaderParams);
  const verifierKeyValue = ', oauth_verifier="' + encodeURIComponent(verifier) + '"';
  const accessTokenRequestHeader = accessTokenHeaderString + verifierKeyValue;
  // Convert token to Access Token
  nodeFetch(accessTokenURL, { method: 'POST', headers: { Authorization: accessTokenRequestHeader } })
  .then(response => {
    return response.text();
  }).then(response => {
    const accessTokenResponse = parseFormEncoding(response);
    res.json({ accessTokenResponse });
  });
});

/**
 * Parse a form encoded string into an object
 * @param  {string} formEncoded Form encoded string
 * @return {Object}             Decoded data object
 */
function parseFormEncoding(formEncoded) {
  const pairs = formEncoded.split('&');
  const result = {};
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    result[key] = value;
  }
  return result;
}

/**
 * Creates the Token Request OAuth header
 * @param  {Object} params OAuth params
 * @return {string}        OAuth header string
 */
function createHeaderString(params) {
  return 'OAuth ' + Object.keys(params).map(key => {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(params[key]);
    return `${encodedKey}="${encodedValue}"`;
  }).join(', ');
}

/**
 * Creates the Signature for the OAuth header
 * @param  {Object}  params         OAuth + Request Parameters
 * @param  {string}  HTTPMethod     Type of Method (POST,GET...)
 * @param  {string}  requestURL     Full Request URL
 * @param  {string}  consumerSecret Twitter Consumer Secret
 * @param  {?string} tokenSecret    Secret token (Optional)
 * @return {string}                 Returns the encoded/hashed signature
 */
function createSignature(params, httpMethod, requestURL, consumerSecret, tokenSecret) {
  const encodedParameters = percentEncodeParameters(params);
  const upperCaseHTTPMethod = httpMethod.toUpperCase();
  const encodedRequestURL = encodeURIComponent(requestURL);
  const encodedConsumerSecret = encodeURIComponent(consumerSecret);

  const signatureBaseString = upperCaseHTTPMethod +
    '&' + encodedRequestURL +
    '&' + encodeURIComponent(encodedParameters);

  let signingKey;
  if (tokenSecret !== undefined) {
    signingKey = encodedRequestURL + '&' + encodeURIComponent(tokenSecret);
  } else {
    signingKey = encodedConsumerSecret + '&';
  }
  const signature = Crypto.HmacSHA1(signatureBaseString, signingKey);
  const encodedSignature = Crypto.enc.Base64.stringify(signature);
  return encodedSignature;
}

/**
 * Percent encode the OAUTH Header + Request parameters for signature
 * @param  {Object} params Dictionary of params
 * @return {string}        Percent encoded parameters string
 */
function percentEncodeParameters(params) {
  return Object.keys(params).map(key => {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(params[key]);
    return `${encodedKey}=${encodedValue}`;
  }).join('&');
}

/**
 * Creates the header with the base parameters (Date, nonce etc...)
 * @return {Object} returns a header dictionary with base fields filled.
 */
function createHeaderBase() {
  return {
    oauth_consumer_key: '',
    oauth_nonce: createNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: new Date().getTime() / 1000,
    oauth_version: '1.0',
  };
}

/**
 * Creates a nonce for OAuth header
 * @return {string} nonce
 */
function createNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
