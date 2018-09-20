/** This is a mock module of ../queries.js,
 * so the test files link to this instead of connecting to backend
 * This file simply skip the backend retrival and fake query results and return
 * Current logic is straightforward but good enough to make tests
 * */
import mockData from './mockData';

export function mockResetAllList() {
  mockData.resetAll();
}

export function mockResetTopicList() {
  mockData.resetTopics();
}

export function mockResetOracleList() {
  mockData.resetOracles();
}

export function mockAddTopic(newTopic) {
  mockData.addTopics(newTopic);
}

export function mockResetTransactionList() {
  mockData.resetTransactions();
}

export function mockAddTransaction(newTransaction) {
  mockData.addTransactions(newTransaction);
}

export function mockAddOracle(newOracle) {
  mockData.addOracles(newOracle);
}

export function createTopic(
  name,
  results,
  centralizedOracle,
  bettingStartTime,
  bettingEndTime,
  resultSettingStartTime,
  resultSettingEndTime,
  escrowAmount,
  senderAddress,
) {
  const newTransaction = {
    createdTime: '',
    status: 'PENDING',
    token: 'BOT',
    txid: '',
    type: 'APPROVECREATEEVENT',
    createdBlock: 0,
    gasLimit: '100000000',
    gasPrice: 0.01,
    senderAddress,
    version: 0,
    name,
    options: results,
    resultSetterAddress: centralizedOracle,
    bettingStartTime,
    bettingEndTime,
    resultSettingStartTime,
    resultSettingEndTime,
    amount: escrowAmount,
  };

  mockData.addTransactions(newTransaction);

  // return temp transaction
  return newTransaction;
}

export function createBetTx(version, topicAddress, oracleAddress, optionIdx, amount, senderAddress) {
  const newTransaction = {
    createdBlock: 0,
    createdTime: 0,
    gasLimit: '100000000',
    gasPrice: 0.01,
    senderAddress,
    version,
    topicAddress,
    oracleAddress,
    optionIdx,
    token: 'QTUM',
    amount,
    type: 'BET',
    status: 'PENDING',
  };

  mockData.addTransactions(newTransaction);

  // return temp transaction
  return newTransaction;
}

export function createSetResultTx(version, topicAddress, oracleAddress, optionIdx, amount, senderAddress) {
}

export function createVoteTx(version, topicAddress, oracleAddress, optionIdx, amount, senderAddress) {
}

export function createFinalizeResultTx(version, topicAddress, oracleAddress, senderAddress) {
}

export function createWithdrawTx(type, version, topicAddress, senderAddress) {
}

export function createTransferTx(senderAddress, receiverAddress, token, amount) {
}
