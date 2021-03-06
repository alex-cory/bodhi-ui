import { computed } from 'mobx';
import { OracleStatus, TransactionType, TransactionStatus, Phases, Token } from 'constants';

import { satoshiToDecimal } from '../../helpers/utility';
import Option from './Option';

const { BETTING, VOTING, RESULT_SETTING, FINALIZING, WITHDRAWING } = Phases;
const { PENDING } = TransactionStatus;

/*
* Model for CentralizedOracles and DecentralizedOracles.
* Oracles are created to handle the betting and voting rounds in a TopicEvent.
* But, all the actual funds are stored in a TopicEvent.
*/
export default class Oracle {
  address = '' // Contract address
  topicAddress = '' // TopicEvent address that created this Oracle
  txid = '' // Transaction ID that this Oracle was created
  status = '' // Stage the Oracle is in. One of: [BETTING, VOTING, RESULT_SETTING, PENDING, FINALIZING]
  token = '' // BOT or QTUM
  amounts = [] // QTUM or BOT amounts array for each result index
  blockNum // Block number when this Oracle was created
  consensusThreshold = '' // Amount needed to validate a result
  startTime = '' // Depends on the type of Oracle. CentralizedOracle = betting start time. DecentralizedOracle = arbitration start time.
  endTime = '' // Depends on the type of Oracle. CentralizedOracle = betting end time. DecentralizedOracle = arbitration end time.
  name = '' // Name of the event
  optionIdxs = [] // Allowed options to vote on. CentralizedOracle will have all the options. DecentralizedOracle will be missing the index of the previous rounds result.
  options = [] // Option names
  resultIdx // Result index of current result
  resultSetStartTime = '' // Only for CentralizedOracle. Result setting start time.
  resultSetEndTime = '' // Only for CentralizedOracle. Result setting end time.
  resultSetterAddress = '' // Result setter's Qtum address.
  transactions = [] // Transaction objects tied to this Event.
  version // Current version of the contract. To manage deprecations later.

  // for UI
  url = '' // Internal URL for routing within UI.

  // for invalid option
  localizedInvalid = {};
  // BETTING, VOTING, RESULT_SETTING, FINALIZING, WITHDRAWING
  @computed get phase() {
    const { token, status } = this;
    const [BOT, QTUM] = [token === Token.BOT, token === Token.QTUM];
    if (QTUM && ['PENDING', 'WITHDRAW', 'CREATED', 'VOTING'].includes(status)) return BETTING;
    if (BOT && ['PENDING', 'VOTING', 'WITHDRAW'].includes(status)) return VOTING;
    if (QTUM && ['WAITRESULT', 'OPENRESULTSET'].includes(status)) return RESULT_SETTING;
    if (BOT && status === 'WAITRESULT') return FINALIZING;
    return WITHDRAWING; // only for topic
  }
  // OpenResultSetting means the Result Setter did not set the result in time so anyone can set the result now.
  @computed get isOpenResultSetting() {
    return this.token === Token.QTUM && this.status === 'OPENRESULTSET';
  }
  // Archived Oracles mean their purpose has been served. eg. Betting Oracle finished betting round.
  @computed get isArchived() {
    const { token, status } = this;
    const [BOT, QTUM] = [token === Token.BOT, token === Token.QTUM];
    if (QTUM && ['PENDING', 'WITHDRAW'].includes(status)) return true; // BETTING
    if (BOT && ['PENDING', 'WITHDRAW'].includes(status)) return true; // VOTING
    return false;
  }
  // Pending if there is a tx waiting to be accepted by the blockchain. Users can only do one tx at a time.
  @computed get isPending() {
    const { token, status, transactions } = this;
    const [QTUM] = [token === Token.QTUM];
    const { APPROVE_SET_RESULT, SET_RESULT, APPROVE_VOTE, VOTE, FINALIZE_RESULT, BET } = TransactionType;
    const pendingTypes = {
      BETTING: [BET],
      RESULT_SETTING: [APPROVE_SET_RESULT, SET_RESULT],
      VOTING: [APPROVE_VOTE, VOTE],
      FINALIZING: [FINALIZE_RESULT],
    }[this.phase];

    // It is pending if it has a pending tx in the current phase. eg. Bet tx in Betting phase.
    const isPending = transactions.some(({ type, status: txStatus }) => pendingTypes.includes(type) && txStatus === PENDING);
    if (isPending) return true;

    // Include unconfirmed Oracle
    if (QTUM && status === 'CREATED') {
      return true;
    }

    return false;
  }
  // Unconfirmed Oracles need to be confirmed by the blockchain before being able to acted on.
  @computed get unconfirmed() {
    return !this.topicAddress && !this.address;
  }
  // Upcoming is for showing upcoming Events in BOT Court so users don't lose track of an Event while it is in the Result Setting phase.
  @computed get isUpcoming() {
    return (
      this.phase === RESULT_SETTING
      && this.status === OracleStatus.WAIT_RESULT
      && (this.app.wallet.addresses.filter(({ address }) => (address === this.resultSetterAddress)).length === 0)
    );
  }

  constructor(oracle, app) {
    Object.assign(this, oracle);
    this.app = app;
    this.amounts = oracle.amounts.map(satoshiToDecimal);
    this.consensusThreshold = satoshiToDecimal(oracle.consensusThreshold);
    this.url = this.unconfirmed ? `/oracle/${oracle.hashId}` : `/oracle/${oracle.topicAddress}/${oracle.address}/${oracle.txid}`;
    this.endTime = this.phase === RESULT_SETTING ? oracle.resultSetEndTime : oracle.endTime;
    this.options = oracle.options.map((option, i) => new Option(option, i, this, app));
    this.localizedInvalid = {
      en: 'Invalid',
      zh: '无效',
      ko: '무효의',
      parse(locale) {
        return this[locale.slice(0, 2)];
      },
    };
  }
}
