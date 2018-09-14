/* eslint-disable */
import { Qweb3 } from 'Qweb3';

// If there is no qryptoProvider, it meaans there is no qrypto installed
if (!window && window.qryptoProvider) {
  // TODO: prompt user to install qrypto
  console.log('No qryptoProvider, please consider to install qrypto');
  console.log('https://chrome.google.com/webstore/detail/qrypto/hdmjdgjbehedbnjmljikggbmmbnbmlnd');
  return;
}
// Instantiate Qweb3 with CurrentProvider
const CurrentProvider = window.qrypto.rpcProvider;
const qweb3 = new Qweb3(CurrentProvider());

// documentation for qweb3:
// https://github.com/bodhiproject/qweb3.js#qweb3js
export default qweb3;
