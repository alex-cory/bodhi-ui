import axios from 'axios';
import CEStore from './store';
import { decimalToSatoshi } from '../../helpers/utility';
import { mockResetTransactionList, mockAddTransaction } from '../../network/graphql/queries/';

jest.mock('../../network/graphql/queries'); // block and manually mock our backend
jest.mock('../../network/graphql/mutations');
jest.mock('../../helpers/mixpanelUtil');

jest.mock('axios');

// setup mock
const appMock = {
  wallet: {
    lastUsedWallet: {
      qtum: 100,
      bot: 100,
    },
    lastUsedAddress: 'abcdef',

  },
  ui: {
    setError: () => {},
    setGlobalMessage: () => {},
  },
  qtumPrediction: {
    loadFirst: () => {},
  },
  pendingTxsSnackbar: {
    init: () => {},
  },
  global: {
    syncBlockNum: 123,
  },
};

// start test
describe('Create Event Store', () => {
  let store;

  describe('Open', () => {
    const respEscrow = {
      0: decimalToSatoshi(1.5),
    };
    const respInsightTotals = {
      n_blocks_mined: 598,
      time_between_blocks: 999,
      mined_currency_amount: 239200000000,
      transaction_fees: 384590974074,
      number_of_transactions: 1585,
      outputs_volume: 11460269902794,
      difficulty: 964275.6173266647,
      stake: 0.0016828621038027618,
    };
    const respValidAddr = {
      account: '',
      address: '',
      hdmasterkeyid: '',
      iscompressed: true,
      ismine: true,
      isscript: false,
      isvalid: true,
      iswatchonly: false,
      pubkey: '',
      scriptPubKey: '',
      timestamp: 1536777189,
    };
    const respTxFees = {
      0: {
        amount: '500000000',
        gasCost: '0.10',
        gasLimit: 250000,
        token: 'BOT',
        type: 'approve',
      },
      1: {
        amount: '500000000',
        gasCost: '1.40',
        gasLimit: 350000,
        token: 'BOT',
        type: 'createEvent',
      },
    };

    beforeEach(() => {
      store = new CEStore(appMock);
    });
    it('run', async () => {
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockReturnValueOnce({ data: respTxFees });
      await store.open();
      expect(store.escrowAmount).toBe(1.5);
      expect(store.averageBlockTime).toBe(999);
      expect(store.isOpen).toBe(true);
      expect(store.creator).toBe(appMock.wallet.lastUsedAddress);
      expect(store.prediction.startTime).toBeDefined();
      expect(store.prediction.endTime).toBeDefined();
      expect(store.resultSetting.startTime).toBeDefined();
      expect(store.resultSetting.endTime).toBeDefined();
      expect(store.txFees.length).toBe(2);
      expect(store.txFees[0].type).toBe('approve');
      expect(store.txFees[1].type).toBe('createEvent');
    });

    it('Noshow when pending tx exists', async () => {
      mockResetTransactionList();
      mockAddTransaction({
        txid: 0,
        status: 'CREATEEVENT',
        type: 'PENDING',
      });
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockReturnValueOnce({ data: respTxFees });
      await store.open();
      expect(store.isOpen).toBe(false);
      store = new CEStore(appMock);
      mockResetTransactionList();
      mockAddTransaction({
        txid: 0,
        status: 'CREATEEVENT',
        type: 'CREATED',
      });
      mockAddTransaction({
        txid: 0,
        status: 'BET',
        type: 'PENDING',
      });
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockReturnValueOnce({ data: respTxFees });
      await store.open();
      expect(store.isOpen).toBe(true);
      store = new CEStore(appMock);
      mockResetTransactionList();
      mockAddTransaction({
        txid: 0,
        status: 'APPROVECREATEEVENT',
        type: 'PENDING',
      });
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockReturnValueOnce({ data: respTxFees });
      await store.open();
      expect(store.isOpen).toBe(false);
      store = new CEStore(appMock);
    });

    it('escrowRes post Error Handle', async () => {
      axios.post.mockImplementation(() => { throw new Error(); });
      await store.open();
      expect(store.isOpen).toBe(false);
    });

    it('txFees post Error Handle', async () => {
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockImplementation(() => { throw new Error(); });
      await store.open();
      expect(store.isOpen).toBe(false);
    });

    it('insightTotals get Error Handle', async () => {
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockImplementation(() => { throw new Error(); });
      axios.post.mockReturnValueOnce({ data: respTxFees });
      await store.open();
      expect(store.escrowAmount).toBe(1.5);
      expect(store.averageBlockTime).toBeDefined();
      expect(store.isOpen).toBe(true);
      expect(store.creator).toBe(appMock.wallet.lastUsedAddress);
      expect(store.prediction.startTime).toBeDefined();
      expect(store.prediction.endTime).toBeDefined();
      expect(store.resultSetting.startTime).toBeDefined();
      expect(store.resultSetting.endTime).toBeDefined();
      expect(store.txFees.length).toBe(2);
      expect(store.txFees[0].type).toBe('approve');
      expect(store.txFees[1].type).toBe('createEvent');
    });
  });

  describe('Util Funcs', () => {
    it('setResultSetter', () => {
      store.setResultSetter('blacktea');
      expect(store.resultSetter).toBe('blacktea');
    });
  });
});
