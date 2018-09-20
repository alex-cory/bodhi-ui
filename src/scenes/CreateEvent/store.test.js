import axios from 'axios';
import moment from 'moment';
import CEStore from './store';
import { decimalToSatoshi } from '../../helpers/utility';
import { mockAddTransaction, mockResetAllList } from '../../network/graphql/queries/';

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
  const respValidAddrTrue = {
    iscompressed: true,
    ismine: true,
    isscript: false,
    isvalid: true,
    iswatchonly: false,
    timestamp: 1536777189,
  };
  const respValidAddrFalse = {
    iscompressed: true,
    ismine: true,
    isscript: false,
    isvalid: false,
    iswatchonly: false,
    timestamp: 1536777189,
  };
  const respNull = {
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

  describe('Util Funcs', () => {
    beforeEach(() => {
      store = new CEStore(appMock);
    });
    it('isBeforeNow', () => {
      const res1 = store.isBeforeNow(moment().subtract(1, 'm').unix());
      expect(res1).toBe(true);
      const res2 = store.isBeforeNow(moment().unix());
      expect(res2).toBe(false);
      const res3 = store.isBeforeNow(moment().add(1, 'm').unix());
      expect(res3).toBe(false);
    });
    it('isValidAddress', async () => {
      axios.post.mockReturnValueOnce({ data: respValidAddrFalse });
      const res1 = await store.isValidAddress();
      expect(res1).toBe(false);
      axios.post.mockReset();

      axios.post.mockReturnValueOnce({ data: respValidAddrTrue });
      const res2 = await store.isValidAddress();
      expect(res2).toBe(true);
      axios.post.mockReset();

      axios.post.mockReturnValueOnce({ data: respNull });
      store.isValidAddress();
      axios.post.mockReset();
    });
    it('calculateBlock', async () => {
    });
  });

  describe('Open', () => {
    beforeEach(() => {
      store = new CEStore(appMock);
      mockResetAllList();
      axios.post.mockReset();
      axios.get.mockReset();
    });

    it('Default run', async () => {
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
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockReturnValueOnce({ data: respTxFees });
      await store.open();
      expect(store.isOpen).toBe(true);
      axios.post.mockReset();
      axios.get.mockReset();
      store = new CEStore(appMock);

      mockResetAllList();
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
      axios.post.mockReset();
      axios.get.mockReset();
      store = new CEStore(appMock);

      mockResetAllList();
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockReturnValueOnce({ data: respTxFees });
      await store.open();
      expect(store.isOpen).toBe(true);
      axios.post.mockReset();
      axios.get.mockReset();
      store = new CEStore(appMock);

      mockResetAllList();
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
    });

    it('escrowRes post Error Handle', async () => {
      axios.post.mockImplementation(() => { throw new Error('Jest: Error Handle escrowRes'); });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockReturnValueOnce({ data: respTxFees });
      await store.open();
      expect(store.isOpen).toBe(false);
    });

    it('txFees post Error Handle', async () => {
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockImplementation(() => { throw new Error('Jest: Error Handle txFees'); });
      await store.open();
      expect(store.isOpen).toBe(true);
    });

    it('insightTotals get Error Handle', async () => {
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockImplementation(() => { throw new Error('Jest: Error Handle insightTotals'); });
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

  describe('Submit', () => {
  });

  describe('Reactions', () => {
    describe('this.creator', () => {
    });
    describe('this.resultSetterDialogOpen', () => {
    });
    describe('this.prediction.startTime', () => {
    });
    describe('this.prediction.endTime', () => {
    });
    describe('this.resultSetting.startTime', () => {
    });
    describe('this.resultSetting.endTime', () => {
    });
  });

  describe('Computed', () => {
    describe('hasEnoughFee()', () => {
    });
    describe('warning()', () => {
    });
    describe('blockNum()', () => {
    });
    describe('isAllValid()', () => {
    });
  });

  describe('close()', () => {
  });

  describe('prepareToCreateEvent()', () => {
  });

  describe('Dialog Funcs', () => {
    beforeEach(() => {
      store = new CEStore(appMock);
      mockResetAllList();
      axios.post.mockReset();
      axios.get.mockReset();
      axios.post.mockReturnValueOnce({ data: respEscrow });
      axios.get.mockReturnValueOnce({ data: respInsightTotals });
      axios.post.mockReturnValueOnce({ data: respTxFees });
      store.open();
    });
    afterEach(() => {
      store.close();
    });
    afterAll(() => {
      mockResetAllList();
      axios.post.mockReset();
      axios.get.mockReset();
    });
    it('setResultSetter', () => {
      store.setResultSetter('blacktea');
      expect(store.resultSetter).toBe('blacktea');
    });
    it('addOutcome', () => {
      const lenOutcomes = store.outcomes.length;
      const lenErrorOutcomes = store.error.outcomes.length;
      store.addOutcome();
      expect(store.outcomes.length).toBe(lenOutcomes + 1);
      expect(store.error.outcomes.length).toBe(lenErrorOutcomes + 1);
      expect(store.outcomes[store.outcomes.length - 1]).toBeDefined();
      expect(store.outcomes[store.outcomes.length - 1]).toBeDefined();
      store.addOutcome('blacktea');
      expect(store.outcomes.length).toBe(lenOutcomes + 2);
      expect(store.error.outcomes.length).toBe(lenErrorOutcomes + 2);
      expect(store.outcomes[store.outcomes.length - 1]).toBe('blacktea');
      expect(store.outcomes[store.outcomes.length - 1]).toBe('blacktea');
    });
    it('validateTitle', () => {
      store.title = 'a.a.';
      store.validateTitle();
      expect(store.error.title).toBe('');
      store.title = undefined;
      store.validateTitle();
      expect(store.error.title).toBe('create.required');
      store.title = 'a.a.'.repeat(640);
      store.validateTitle();
      expect(store.error.title).toBe('create.nameLong');
      store.title = '   ';
      store.validateTitle();
      expect(store.error.title).toBe('');
      store.title = '';
      store.validateTitle();
      expect(store.error.title).toBe('create.required');
    });
    it('validateCreator', () => {
    });
    it('validatePredictionStartTime', () => {
      store.prediction.startTime = moment().subtract(2, 's').unix();
      store.validatePredictionStartTime();
      expect(store.error.prediction.startTime).toBe('create.datePast');
      store.prediction.startTime = moment().unix();
      store.validatePredictionStartTime();
      expect(store.error.prediction.startTime).toBe('');
      store.prediction.startTime = moment().add(2, 's').unix();
      store.validatePredictionStartTime();
      expect(store.error.prediction.startTime).toBe('');
    });
    it('validatePredictionEndTime', () => {
      store.prediction.startTime = moment().add(1800, 's').unix();
      store.prediction.endTime = moment().subtract(2, 's').unix();
      store.validatePredictionEndTime();
      expect(store.error.prediction.endTime).toBe('create.datePast');
      store.prediction.endTime = moment().add(1801, 's').unix();
      store.validatePredictionEndTime();
      expect(store.error.prediction.endTime).toBe('create.validBetEnd');
      store.prediction.endTime = moment().add(4000, 's').unix();
      store.validatePredictionEndTime();
      expect(store.error.prediction.endTime).toBe('');
    });
    it('validateSettingStartTime', () => {
      store.prediction.endTime = moment().add(1800, 's').unix();
      store.resultSetting.startTime = moment().subtract(2, 's').unix();
      store.validateResultSettingStartTime();
      expect(store.error.resultSetting.startTime).toBe('create.datePast');
      store.resultSetting.startTime = moment().add(1700, 's').unix();
      store.validateResultSettingStartTime();
      expect(store.error.resultSetting.startTime).toBe('create.validResultSetStart');
      store.resultSetting.startTime = moment().add(1820, 's').unix();
      store.validateResultSettingStartTime();
      expect(store.error.resultSetting.startTime).toBe('');
    });
    it('validateSettingEndTime', () => {
      store.resultSetting.startTime = moment().add(1800, 's').unix();
      store.resultSetting.endTime = moment().subtract(2, 's').unix();
      store.validateResultSettingEndTime();
      expect(store.error.resultSetting.endTime).toBe('create.datePast');
      store.resultSetting.endTime = moment().add(1801, 's').unix();
      store.validateResultSettingEndTime();
      expect(store.error.resultSetting.endTime).toBe('create.validResultSetEnd');
      store.resultSetting.endTime = moment().add(4000, 's').unix();
      store.validateResultSettingEndTime();
      expect(store.error.resultSetting.endTime).toBe('');
    });
    it('validateOutcome', () => {
      store.addOutcome('');
      store.addOutcome('b.b.');
      store.addOutcome('invalid');
      store.addOutcome('a.a.');
      store.addOutcome('a.a.'.repeat(640));
      store.addOutcome('blacktea');
      for (let i = 0; i < store.outcomes.length; i++) store.validateOutcome(i);
      expect(store.error.outcomes.length).toBe(8);
      expect(store.error.outcomes[0]).toBe('create.required');
      expect(store.error.outcomes[1]).toBe('create.required');
      expect(store.error.outcomes[2]).toBe('create.required');
      expect(store.error.outcomes[3]).toBe('');
      expect(store.error.outcomes[4]).toBe('create.invalidName');
      expect(store.error.outcomes[5]).toBe('');
      expect(store.error.outcomes[6]).toBe('create.resultTooLong');
      expect(store.error.outcomes[7]).toBe('');
      store.addOutcome('a.a.');
      for (let i = 0; i < store.outcomes.length; i++) store.validateOutcome(i);
      expect(store.error.outcomes[5]).toBe('create.duplicateOutcome');
      expect(store.error.outcomes[8]).toBe('create.duplicateOutcome');
      store.outcomes[8] = 'a.a.a.';
      for (let i = 0; i < store.outcomes.length; i++) store.validateOutcome(i);
      expect(store.error.outcomes[5]).toBe('');
      expect(store.error.outcomes[8]).toBe('');
    });
    it('validateResultSetter', async () => {
      store.setResultSetter('');
      axios.post.mockReturnValueOnce({ data: respValidAddrTrue });
      await store.validateResultSetter();
      expect(store.error.resultSetter).toBe('create.required');
      axios.post.mockReset();

      store.setResultSetter('blacktea');
      axios.post.mockReturnValueOnce({ data: respValidAddrTrue });
      await store.validateResultSetter();
      expect(store.error.resultSetter).toBe('');
      axios.post.mockReset();

      axios.post.mockReturnValueOnce({ data: respValidAddrFalse });
      await store.validateResultSetter();
      expect(store.error.resultSetter).toBe('create.invalidAddress');
      axios.post.mockReset();

      axios.post.mockReturnValueOnce({ data: respNull });
      await store.validateResultSetter();
      expect(store.error.resultSetter).toBe('create.invalidAddress');
      axios.post.mockReset();
    });
    it('validateAll', async () => {
    });
  });
});
