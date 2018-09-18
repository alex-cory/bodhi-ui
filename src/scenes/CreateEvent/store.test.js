import CEStore from './store';

jest.mock('../../helpers/mixpanelUtil');

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
describe('CEStore', () => {
  let store;
  beforeEach(() => {
    store = new CEStore(appMock);
  });

  it('calculateBlock', () => {
    store.setResultSetter('blacktea');
    expect(store.resultSetter).toBe('blacktea');
  });
});
