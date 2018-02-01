/* eslint react/no-array-index-key: 0, no-nested-ternary:0 */ // Disable "Do not use Array index in keys" for options since they dont have unique identifier

import React, { PropTypes } from 'react';
import { Row, Col } from 'antd';
import { connect } from 'react-redux';
import _ from 'lodash';

import LayoutContentWrapper from '../components/utility/layoutWrapper';
import IsoWidgetsWrapper from './Widgets/widgets-wrapper';
import BottomButtonWidget from './Widgets/bottom-button';
import SingleProgressWidget from './Widgets/progress/progress-single';
import ReportsWidget from './Widgets/report/report-widget';
import TabBtnGroup from '../components/bodhi-dls/tabBtnGroup';
import dashboardActions from '../redux/dashboard/actions';
import appActions from '../redux/app/actions';
import { Token, OracleStatus, SortBy } from '../constants';
import { getLocalDateTimeString } from '../helpers/utility';

const TAB_BET = 0;
const TAB_SET = 1;
const TAB_VOTE = 2;
const TAB_FINALIZE = 3;
const TAB_WITHDRAW = 4;
const DEFAULT_TAB_INDEX = TAB_BET;
const MAX_DISPLAY_OPTIONS = 3;
const COL_PER_ROW = { // Specify how many col in each row
  xs: 1,
  sm: 3,
  md: 3,
  lg: 4,
  xl: 4,
  xxl: 4,
};
const ROW_GUTTER = {
  xs: 0,
  sm: 16, // Set gutter to 16 + 8 * n, with n being a natural number
  md: 24,
  lg: 24,
  xl: 32,
  xxl: 32,
};

class Dashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  componentWillMount() {
    this.executeGraphRequest(this.props.tabIndex);
  }

  componentWillReceiveProps(nextProps) {
    const {
      tabIndex,
      sortBy,
      syncProgress,
      isSyncing,
    } = nextProps;

    if (tabIndex !== this.props.tabIndex || sortBy !== this.props.sortBy) {
      this.executeGraphRequest(tabIndex, sortBy);
    }

    // Refresh page if sync is complete
    if (isSyncing && syncProgress === 100) {
      this.executeGraphRequest(this.props.tabIndex);
      this.props.toggleSyncing(false);
    }
  }

  render() {
    const { tabIndex, getTopicsSuccess, getOraclesSuccess } = this.props;
    const topics = getTopicsSuccess;
    const oracles = getOraclesSuccess;

    let rowItems;
    switch (tabIndex) {
      case TAB_BET:
      case TAB_SET:
      case TAB_VOTE:
      case TAB_FINALIZE: {
        rowItems = this.renderOracles(oracles, tabIndex);
        break;
      }
      case TAB_WITHDRAW: {
        rowItems = this.renderTopics(topics);
        break;
      }
      default: {
        throw new RangeError(`Invalid tab position ${tabIndex}`);
      }
    }

    return (
      <LayoutContentWrapper
        className="horizontalWrapper"
        style={{ minHeight: '100vh', paddingTop: '50px', paddingBottom: '50px' }}
      >
        <TabBtnGroup
          buttons={[{
            text: 'Bet',
          }, {
            text: 'Set',
          }, {
            text: 'Vote',
          }, {
            text: 'Finalize',
          }, {
            text: 'Withdraw',
          }]}
        />
        <Row
          gutter={28}
          justify="center"
        >
          {rowItems}
        </Row>
      </LayoutContentWrapper>
    );
  }

  executeGraphRequest(tabIndex, sortBy) {
    const {
      onGetTopics,
      onGetOracles,
    } = this.props;

    const sortDirection = sortBy || SortBy.Ascending;

    switch (tabIndex) {
      case TAB_BET: {
        onGetOracles(
          [
            { token: Token.Qtum, status: OracleStatus.Voting },
          ],
          { field: 'endTime', direction: sortDirection },
        );
        break;
      }
      case TAB_SET: {
        onGetOracles(
          [
            { token: Token.Qtum, status: OracleStatus.WaitResult },
            { token: Token.Qtum, status: OracleStatus.OpenResultSet },
          ],
          { field: 'resultSetEndTime', direction: sortDirection },
        );
        break;
      }
      case TAB_VOTE: {
        onGetOracles(
          [
            { token: Token.Bot, status: OracleStatus.Voting },
          ],
          { field: 'endTime', direction: sortDirection },
        );
        break;
      }
      case TAB_FINALIZE: {
        onGetOracles(
          [
            { token: Token.Bot, status: OracleStatus.WaitResult },
          ],
          { field: 'endTime', direction: sortDirection },
        );
        break;
      }
      case TAB_WITHDRAW: {
        onGetTopics(
          [
            { status: OracleStatus.Withdraw },
          ],
          { field: 'blockNum', direction: sortDirection },
        );
        break;
      }
      default: {
        throw new RangeError(`Invalid tab position ${tabIndex}`);
      }
    }
  }

  renderOracles(oracles, tabIndex) {
    // Calculate grid number for Col attribute
    const colWidth = {};
    Object.keys(COL_PER_ROW).forEach((key) => {
      colWidth[key] = 24 / COL_PER_ROW[key];
    });

    const rowItems = [];
    _.each(oracles, (oracle) => {
      let endBlockString;
      let buttonText;
      switch (tabIndex) {
        case TAB_BET: {
          console.log(oracle.endTime);
          endBlockString = `Betting ends ${getLocalDateTimeString(oracle.endTime)}`;
          buttonText = 'Place Bet';
          break;
        }
        case TAB_SET: {
          endBlockString = `Result setting ends ${getLocalDateTimeString(oracle.resultSetEndBlock)}`;
          buttonText = 'Set Result';
          break;
        }
        case TAB_VOTE: {
          endBlockString = `Voting ends ${getLocalDateTimeString(oracle.endBlock)}`;
          buttonText = 'Place Vote';
          break;
        }
        case TAB_FINALIZE: {
          endBlockString = `Voting ended ${getLocalDateTimeString(oracle.endBlock)}`;
          buttonText = 'Finalize Result';
          break;
        }
        default: {
          throw new RangeError(`Invalid tab position ${tabIndex}`);
        }
      }

      const totalBalance = _.sum(oracle.amounts);
      const raisedString = `Raised: ${totalBalance.toFixed(2)} ${oracle.token}`;

      let displayOptions = [];
      // Determine what options showing in progress bars
      if (oracle.token === Token.Bot) {
        displayOptions = _.filter(oracle.options, (option, index) => {
          // If index of option is in optionsIdx array
          if (oracle.optionIdxs.indexOf(index) >= 0) {
            return option;
          }

          return false;
        });
      } else {
        displayOptions = _.map(oracle.options, _.clone);
      }

      // Trim options array to only MAX_DISPLAY_OPTIONS (3) elements
      if (!_.isEmpty(displayOptions) && displayOptions.length > MAX_DISPLAY_OPTIONS) {
        displayOptions = displayOptions.slice(0, MAX_DISPLAY_OPTIONS);
      }

      const threshold = oracle.consensusThreshold;

      // Constructing opitons elements
      let optionsEle = null;

      if (!_.isEmpty(displayOptions)) {
        if (oracle.token === Token.Bot) {
          optionsEle = displayOptions.map((result, index) => (
            <SingleProgressWidget
              key={`option${index}`}
              label={result}
              percent={threshold === 0 ?
                threshold : _.round((oracle.amounts[oracle.optionIdxs[index]] / threshold) * 100)}
              barHeight={12}
              fontColor="#4A4A4A"
            />
          ));
        } else {
          optionsEle = displayOptions.map((result, index) => (
            <SingleProgressWidget
              key={`option${index}`}
              label={result}
              percent={totalBalance === 0 ? totalBalance : _.round((oracle.amounts[index] / totalBalance) * 100)}
              barHeight={12}
              fontColor="#4A4A4A"
            />
          ));
        }
      }

      // Make sure length of options element array is MAX_DISPLAY_OPTIONS (3) so that every card has the same height
      // Ideally there should a be loop in case MAX_DISPLAY_OPTIONS is greater than 3
      if (optionsEle && optionsEle.length < MAX_DISPLAY_OPTIONS) {
        for (let i = optionsEle.length; i < MAX_DISPLAY_OPTIONS; i += 1) {
          optionsEle.push(<div
            key={`option-placeholder-${i}`}
            style={{ height: '48px', marginTop: '18px', marginBottom: '18px' }}
          ></div>);
        }
      }

      // Constructing Card element on the right
      const oracleEle = (
        <Col
          xs={colWidth.xs}
          sm={colWidth.sm}
          xl={colWidth.xl}
          key={oracle.address}
          style={{ marginBottom: '24px' }}
        >
          <IsoWidgetsWrapper>
            {/* Report Widget */}
            <ReportsWidget
              label={oracle.name}
              details={[raisedString, endBlockString]}
            >
              {optionsEle}
            </ReportsWidget>
            <BottomButtonWidget
              pathname={`/oracle/${oracle.topicAddress}/${oracle.address}`}
              text={buttonText}
            />
          </IsoWidgetsWrapper>
        </Col>
      );

      rowItems.push(oracleEle);
    });

    return rowItems;
  }

  renderTopics(topicEvents) {
    // Calculate grid number for Col attribute
    const colWidth = {};

    Object.keys(COL_PER_ROW).forEach((key) => {
      colWidth[key] = 24 / COL_PER_ROW[key];
    });

    const rowItems = [];

    _.each(topicEvents, (topic) => {
      const qtumTotal = _.sum(topic.qtumAmount);
      const botTotal = _.sum(topic.botAmount);

      const raisedString = `Raised: ${qtumTotal.toFixed(2)} ${Token.Qtum}, ${botTotal.toFixed(2)} ${Token.Bot}`;
      const endBlockString = 'Ended';

      let optionBalances = _.map(topic.options, (opt, idx) => {
        const qtumAmount = topic.qtumAmount[idx];
        const botAmount = topic.botAmount[idx];

        return {
          name: opt,
          value: `${qtumAmount} ${Token.Qtum}, ${botAmount} ${Token.Bot}`,
          percent: qtumTotal === 0 ? qtumTotal : _.round((qtumAmount / qtumTotal) * 100),
          secondaryPercent: botTotal === 0 ? botTotal : _.round((botAmount / botTotal) * 100),
        };
      });

      // Trim options array to only MAX_DISPLAY_OPTIONS (3) elements
      if (!_.isEmpty(optionBalances) && optionBalances.length > MAX_DISPLAY_OPTIONS) {
        optionBalances = optionBalances.slice(0, MAX_DISPLAY_OPTIONS);
      }

      // Constructing opitons elements
      let optionsEle = null;

      if (!_.isEmpty(optionBalances)) {
        optionsEle = optionBalances.map((item, index) => (
          <SingleProgressWidget
            key={`option${index}`}
            label={item.name}
            percent={item.percent}
            barHeight={12}
            fontColor="#4A4A4A"
            barColor={topic.resultIdx === index ? '' : 'grey'}
            secondaryPercent={item.secondaryPercent}
            secondaryBarHeight={item.secondaryBarHeight}
          />
        ));
      }

      // Make sure length of options element array is MAX_DISPLAY_OPTIONS (3) so that every card has the same height
      // Ideally there should a be loop in case MAX_DISPLAY_OPTIONS is greater than 3
      if (optionsEle && optionsEle.length < MAX_DISPLAY_OPTIONS) {
        for (let i = optionsEle.length; i < MAX_DISPLAY_OPTIONS; i += 1) {
          optionsEle.push(<div
            key={`option-placeholder-${i}`}
            style={{ height: '72px', marginTop: '18px', marginBottom: '18px' }}
          ></div>);
        }
      }

      const topicEle = (
        <Col xs={colWidth.xs} sm={colWidth.sm} xl={colWidth.xl} key={topic.address} style={{ marginBottom: '24px' }}>
          <IsoWidgetsWrapper>
            {/* Report Widget */}
            <ReportsWidget
              label={topic.name}
              details={[raisedString, endBlockString]}
            >
              {optionsEle}
            </ReportsWidget>

            <BottomButtonWidget
              pathname={`/topic/${topic.address}`}
              text="Withdraw"
            />
          </IsoWidgetsWrapper>
        </Col>
      );

      rowItems.push(topicEle);
    });
    return rowItems;
  }
}

Dashboard.propTypes = {
  getTopicsSuccess: PropTypes.oneOfType([
    PropTypes.array, // Result array
    PropTypes.string, // error message
    PropTypes.bool, // No result
  ]),
  onGetTopics: PropTypes.func,
  getOraclesSuccess: PropTypes.oneOfType([
    PropTypes.array, // Result array
    PropTypes.string, // error message
    PropTypes.bool, // No result
  ]),
  // getOraclesError: PropTypes.string,
  onGetOracles: PropTypes.func,
  tabIndex: PropTypes.number,
  sortBy: PropTypes.string,
  toggleSyncing: PropTypes.func,
  syncProgress: PropTypes.number,
  isSyncing: PropTypes.bool,
};

Dashboard.defaultProps = {
  getTopicsSuccess: [],
  onGetTopics: undefined,
  getOraclesSuccess: [],
  // getOraclesError: '',
  onGetOracles: undefined,
  tabIndex: DEFAULT_TAB_INDEX,
  sortBy: undefined,
  toggleSyncing: undefined,
  syncProgress: undefined,
  isSyncing: false,
};

const mapStateToProps = (state) => ({
  getTopicsSuccess: state.Dashboard.get('success') && state.Dashboard.get('value'),
  getTopicsError: !state.Dashboard.get('success') && state.Dashboard.get('value'),
  getOraclesSuccess: state.Dashboard.get('allOraclesSuccess') && state.Dashboard.get('allOraclesValue'),
  getOraclesError: !state.Dashboard.get('allOraclesSuccess') && state.Dashboard.get('allOraclesValue'),
  tabIndex: state.Dashboard.get('tabIndex'),
  sortBy: state.Dashboard.get('sortBy'),
  syncProgress: state.App.get('syncProgress'),
  isSyncing: state.App.get('isSyncing'),
});

function mapDispatchToProps(dispatch) {
  return {
    onGetTopics: (filters, orderBy) => dispatch(dashboardActions.getTopics(filters, orderBy)),
    onGetOracles: (filters, orderBy) => dispatch(dashboardActions.getOracles(filters, orderBy)),
    toggleSyncing: (isSyncing) => dispatch(appActions.toggleSyncing(isSyncing)),
  };
}

// Wrap the component to inject dispatch and state into it
export default connect(mapStateToProps, mapDispatchToProps)(Dashboard);
