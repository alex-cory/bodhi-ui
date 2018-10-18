import { isEqual } from 'lodash';
import cryptoRandomString from 'crypto-random-string';
import { EventType, TransactionType } from 'constants';

import EventStore from './store';
import mockDB from '../../../test/mockDB';
import { getMockAppStore } from '../../helpers/testUtil';

// Test init
jest.mock('../../network/graphql/queries');
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
const navigatorMock = {};
global.navigator = navigatorMock;
global.localStorage = localStorageMock;

describe('EventStore', () => {
  let app;
  let store;
  let wallet;

  beforeEach(() => {
    app = getMockAppStore();
    wallet = app.wallet.addresses[0].address;

    store = new EventStore(app); // create a new instance before each test case
    mockDB.init();
  });

  describe('constructor', () => {
    it('sets the values', () => {
      expect(isEqual(store.app, app)).toBe(true);
    });
  });

  describe('init()', () => {
    it('sets all the values for an Unconfirmed Oracle', async () => {
      const oracle = mockDB.generateOracle({
        topicAddress: undefined,
        address: undefined,
        hashId: cryptoRandomString(32),
      });
      mockDB.addOracles(oracle);

      await store.init({
        type: EventType.UNCONFIRMED,
        hashId: oracle.hashId,
      });

      // reset()
      expect(store.topics.length).toBe(0);
      expect(store.amount).toBe('');
      expect(store.address).toBe(undefined);
      expect(store.topicAddress).toBe(undefined);
      expect(store.transactions.length).toBe(0);
      expect(store.selectedOptionIdx).toBe(-1);
      expect(store.escrowClaim).toBe(0);
      expect(store.hashId).toBe(oracle.hashId);
      expect(store.allowance).toBe(undefined);
      expect(store.qtumWinnings).toBe(0);
      expect(store.botWinnings).toBe(0);
      expect(store.withdrawableAddresses.length).toBe(0);

      // initUnconfirmedOracle()
      expect(store.oracles.length).toBe(1);
      expect(store.oracles[0].hashId).toBe(oracle.hashId);
      expect(store.loading).toBe(false);
    });

    it('sets all the values for a Betting Oracle', async () => {
      const { topicAddress, address, txid } = mockDB.paginatedOracles.oracles[0];
      mockDB.addTransactions(mockDB.generateTransaction({
        type: TransactionType.BET,
        senderAddress: wallet.address,
        topicAddress,
      }));

      await store.init({
        topicAddress,
        address,
        txid,
        type: EventType.ORACLE,
      });

      // reset()
      expect(store.amount).toBe('');
      expect(store.selectedOptionIdx).toBe(-1);
      expect(store.escrowClaim).toBe(0);
      expect(store.allowance).toBe(undefined);
      expect(store.qtumWinnings).toBe(0);
      expect(store.botWinnings).toBe(0);
      expect(store.withdrawableAddresses.length).toBe(0);

      // Oracle values
      expect(store.topicAddress).toBe(topicAddress);
      expect(store.address).toBe(address);
      expect(store.txid).toBe(txid);
      expect(store.type).toBe(EventType.ORACLE);
      expect(store.hashId).toBe(undefined);

      // initOracle()
      expect(store.oracles.length).toBe(1);
      expect(store.oracles[0].address).toBe(address);
      expect(store.loading).toBe(false);

      // queryTransactions()
      expect(store.transactions.length).toBe(1);

      // getAllowanceAmount()
      expect(store.allowance).toBe(undefined);
    });

    it('sets all the values for a Result Setting Oracle', async () => {
    });

    it('sets all the values for a Voting Oracle', async () => {
    });

    it('sets all the values for a Finalizing Oracle', async () => {
    });

    it('sets all the values for a Withdrawing Topic', async () => {
    });

    it('sets the reactions', () => {
    });
  });
});
