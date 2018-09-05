import { Qweb3 } from 'Qweb3';

// If there is no qryptoProvider, it meaans there is no qrypto installed
// TODO: prompt user to install qrypto
if (!window && window.qryptoProvider) return {};
// Instantiate Qweb3 with CurrentProvider
const CurrentProvider = window.qryptoProvider;
const qweb3 = new Qweb3(new CurrentProvider());

// documentation for qweb3:
// https://github.com/bodhiproject/qweb3.js#qweb3js
export default qweb3;
