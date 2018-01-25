/* eslint react/prop-types: 0 */ // --> OFF

import _ from 'lodash';
import React, { PropTypes } from 'react';
import { Alert, Button, Form, Input, message, InputNumber } from 'antd';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { DynamicFieldSet } from '../form/DynamicFieldSet';
import topicActions from '../../redux/topic/actions';
import appActions from '../../redux/app/actions';

const FormItem = Form.Item;
const Web3Utils = require('web3-utils');

const MIN_OPTION_NUMBER = 2;
const MAX_OPTION_NUMBER = 10;
const MAX_LEN_EVENTNAME_HEX = 640;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 18 },
  },
};

class CreateTopic extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.getCurrentSenderAddress = this.getCurrentSenderAddress.bind(this);
    this.checkEventName = this.checkEventName.bind(this);
  }

  componentWillMount() {
    this.props.onGetBlockCount();
  }

  componentWillUnmount() {
    this.props.onClearCreateReturn();
  }

  /** Return selected address on Topbar as sender; empty string if not found * */
  getCurrentSenderAddress() {
    const { walletAddrs, walletAddrsIndex } = this.props;

    if (!_.isEmpty(walletAddrs) && walletAddrsIndex < walletAddrs.length && !_.isUndefined(walletAddrs[walletAddrsIndex])) {
      return walletAddrs[walletAddrsIndex].address;
    }

    return '';
  }

  handleSubmit(evt) {
    evt.preventDefault();

    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        // Maps form variables to saga request variables
        const {
          resultSetter: resultSetterAddress,
          title: name,
          options,
          bettingStartBlock,
          bettingEndBlock,
          resultSettingStartBlock,
          resultSettingEndBlock,
        } = values;

        this.props.onCreateTopic({
          resultSetterAddress,
          name,
          options: _.filter(options, (item) => !!item), // Filter out empty strings in options
          bettingStartBlock: bettingStartBlock.toString(),
          bettingEndBlock: bettingEndBlock.toString(),
          resultSettingStartBlock: resultSettingStartBlock.toString(),
          resultSettingEndBlock: resultSettingEndBlock.toString(),
          senderAddress: this.getCurrentSenderAddress(),
        });
      }
    });
  }

  onCancel(evt) {
    evt.preventDefault();

    this.props.history.push('/');
  }

  checkEventName(rule, value, callback) {
    const hexString = Web3Utils.toHex(value);

    if (hexString && hexString.length <= MAX_LEN_EVENTNAME_HEX) {
      callback();
    } else {
      callback('Event name is too long.');
    }
  }

  createInputNumberField(id, label, args, min) {
    return (<FormItem
      {...formItemLayout}
      label={label}
    >
      {this.props.form.getFieldDecorator(id, args)(<InputNumber min={min} />)}
    </FormItem>);
  }

  render() {
    const { createReturn, blockCount } = this.props;

    const { getFieldDecorator } = this.props.form;

    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0,
        },
        sm: {
          span: 18,
          offset: 6,
        },
      },
    };

    let alertElement;

    if (createReturn) {
      if (createReturn.result) {
        alertElement =
            (<Alert
              message="Success!"
              description={`The transaction is broadcasted to blockchain. You can view details from below link https://testnet.qtum.org/tx/${createReturn.result.txid}`}
              type="success"
              closable={false}
            />);
      } else if (createReturn.error) {
        alertElement = (<Alert
          message="Oops, something went wrong"
          description={createReturn.error}
          type="error"
          closable={false}
        />);
      }
    }
    const alertContainer = <div className="alert-container">{alertElement}</div>;

    return (

      <div className="create-topic-container">
        <h3>Create an event</h3>
        <Form onSubmit={this.handleSubmit}>
          <FormItem
            {...formItemLayout}
            label="Title"
          >
            {getFieldDecorator('title', {
              rules: [
                {
                  required: true, message: 'Cannot be empty.',
                },
                {
                  validator: this.checkEventName,
                },
              ],
            })(<Input
              placeholder="e.g. Who will be the next president of the United States?"
            />)}
          </FormItem>

          {this.createInputNumberField(
            'bettingStartBlock',
            'Betting Start Block',
            {
              rules: [{
                required: true, message: 'Must be greater than or equal to current block number.',
              }],
            },
            blockCount
          )}

          {this.createInputNumberField(
            'bettingEndBlock',
            'Betting End Block',
            {
              rules: [{
                required: true, message: 'Must be greater than Betting Start Block.',
              }],
            },
            _.isNumber(this.props.form.getFieldValue('bettingStartBlock') ?
              this.props.form.getFieldValue('bettingStartBlock') + 1 : blockCount) + 1
          )}

          {this.createInputNumberField(
            'resultSettingStartBlock',
            'Result Setting Start Block',
            {
              rules: [{
                required: true, message: 'Must be greater than or equal to Betting End Block.',
              }],
            },
            _.isNumber(this.props.form.getFieldValue('bettingEndBlock') ?
              this.props.form.getFieldValue('bettingEndBlock') : blockCount) + 1
          )}

          {this.createInputNumberField(
            'resultSettingEndBlock',
            'Result Setting End Block',
            {
              rules: [{
                required: true, message: 'Must be greater than Result Setting Start Block.',
              }],
            },
            _.isNumber(this.props.form.getFieldValue('resultSettingStartBlock') ?
              this.props.form.getFieldValue('resultSettingStartBlock') + 1 : blockCount) + 1
          )}

          <FormItem
            {...formItemLayout}
            label="Results"
          >
            {(<DynamicFieldSet form={this.props.form} />)}
          </FormItem>

          <FormItem
            {...formItemLayout}
            label="Result Setter"
          >
            {getFieldDecorator('resultSetter', {
              rules: [{
                required: true, message: 'Please enter a valid Qtum address.',
              }],
            })(<Input placeholder="e.g. qavn7QqvdHPYKr71bNWJo4tcmcgTKaYfjM" />)}
          </FormItem>

          <FormItem {...tailFormItemLayout} className="submit-controller">
            {alertContainer}
            <Button
              type="primary"
              htmlType="submit"
              disabled={createReturn && createReturn.result}
            >Publish</Button>
            <Button
              type="default"
              onClick={this.onCancel}
            >{(createReturn && createReturn.result) ? 'Back' : 'Cancel'}</Button>
          </FormItem>
        </Form>
      </div>
    );
  }
}

CreateTopic.propTypes = {
  form: PropTypes.object.isRequired,
  createReturn: PropTypes.object,
  onCreateTopic: PropTypes.func,
  onClearCreateReturn: PropTypes.func,
  onGetBlockCount: PropTypes.func,
  walletAddrs: PropTypes.array,
  walletAddrsIndex: PropTypes.number,
  blockCount: PropTypes.number,
};

CreateTopic.defaultProps = {
  createReturn: undefined,
  onCreateTopic: undefined,
  onClearCreateReturn: undefined,
  onGetBlockCount: undefined,
  walletAddrs: [],
  walletAddrsIndex: 0,
  blockCount: 0,
};

const mapStateToProps = (state) => ({
  createReturn: state.Topic.get('create_return'),
  walletAddrs: state.App.get('walletAddrs'),
  walletAddrsIndex: state.App.get('walletAddrsIndex'),
  blockCount: state.App.get('get_block_count_return') && state.App.get('get_block_count_return').result,
});

function mapDispatchToProps(dispatch) {
  return {
    onCreateTopic: (params) => dispatch(topicActions.onCreate(params)),
    onClearCreateReturn: () => dispatch(topicActions.onClearCreateReturn()),
    onGetBlockCount: () => dispatch(appActions.getBlockCount()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Form.create()(CreateTopic)));

class OptionsInput extends React.Component {
  constructor(props) {
    super(props);

    console.log(props);

    const value = this.props.value || [];

    this.state = {
      value,
    };

    this.onValueChanged = this.onValueChanged.bind(this);
    this.onAddBtnClicked = this.onAddBtnClicked.bind(this);
    this.onDeleteBtnClicked = this.onDeleteBtnClicked.bind(this);
    this.triggerChange = this.triggerChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    // Should be a controlled component.
    if ('value' in nextProps) {
      const { value } = nextProps;

      this.setState({ value });
    }
  }

  onValueChanged(evt) {
    const { value } = evt.target;
    const { index } = evt.target.dataset;

    const newValue = this.state.value;
    newValue[index] = value;

    this.triggerChange(newValue);
  }

  onAddBtnClicked() {
    const numOfOptions = this.state.value.length;

    if (numOfOptions < MAX_OPTION_NUMBER) {
      const newValue = this.state.value;

      newValue.push('');

      this.triggerChange(newValue);
    } else {
      message.warning(`Cannot add more than ${MAX_OPTION_NUMBER} options.`);
    }
  }

  onDeleteBtnClicked(evt) {
    const { index } = evt.target.dataset;
    const numOfOptions = this.state.value.length;

    if (numOfOptions === MIN_OPTION_NUMBER) {
      message.warning(`Options count cannot be less than ${MIN_OPTION_NUMBER}.`);
      return;
    }

    const indexNumber = _.toNumber(index);
    const newValues = _.filter(this.state.value, (value, idx) => idx !== indexNumber);

    this.triggerChange(newValues);
  }

  triggerChange(changedValue) {
    const { onChange } = this.props;

    if (onChange) {
      onChange(changedValue);
    }
  }

  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <div className="options-container">
        {_.map(this.state.value, (value, index) => (
          <div key={`option${index}`} className="options-item" >
            {getFieldDecorator(`option${index}`, {
              rules: [{
                required: true, message: 'Cannot be empty.',
              },
              {
                validator: this.checkEventName,
              },
              ],
            })(<Input
              data-index={index}
              onChange={this.onValueChanged}
              placeholder={`# ${index + 1} option`}
            />)
            }
            <Button data-index={index} onClick={this.onDeleteBtnClicked} >Delete</Button>
          </div>))}
        <Button onClick={this.onAddBtnClicked}>Add</Button>
      </div>
    );
  }
}

OptionsInput.propTypes = {
  onChange: PropTypes.func,
};

OptionsInput.defaultProps = {
  onChange: undefined,
};
