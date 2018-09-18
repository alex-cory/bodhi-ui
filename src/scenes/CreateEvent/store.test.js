import { Routes } from 'constants';
import axios from 'axios';
import { isProduction } from '../../config/app';
import CEStore from './store';
import { decimalToSatoshi } from '../../helpers/utility';

jest.mock('../../network/graphql/queries'); // block and manually mock our backend
jest.mock('../../network/graphql/mutations');
jest.mock('../../helpers/mixpanelUtil');

jest.mock('axios');

const TIME_DELAY_FROM_NOW_SEC = 15 * 60;
let TIME_GAP_MIN_SEC = 30 * 60;
if (!isProduction()) {
  TIME_GAP_MIN_SEC = 2 * 60;
}

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
  beforeEach(() => {
    store = new CEStore(appMock);
  });

  describe('Open', () => {
    beforeEach(async () => {
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
      axios.post.mockReturnValueOnce(respEscrow);
      axios.get.mockReturnValueOnce(respInsightTotals);
      axios.post.mockReturnValueOnce(respValidAddr);
      await store.open();
    });
    it('test', () => {
      // expect(store.escrowAmount).toBe(1.5);
      expect(store.averageBlockTime).toBe(999);
      expect(store.isOpen).toBe(true);
    });
  });

  describe('Util Funcs', () => {
    it('setResultSetter', () => {
      store.setResultSetter('blacktea');
      expect(store.resultSetter).toBe('blacktea');
    });
  });
});
