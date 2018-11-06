import React from 'react';
import { observer, inject } from 'mobx-react';
import { injectIntl, defineMessages } from 'react-intl';
import { FormControl, TextField, FormHelperText, withStyles, Select, Button, MenuItem } from '@material-ui/core';
import cx from 'classnames';
import { Section } from './components';

import styles from './styles';

const messages = defineMessages({
  createNamePlaceholderMsg: {
    id: 'create.namePlaceholder',
    defaultMessage: 'e.g. Who will be the next president of the United States?',
  },
  eventUnconfirmedMessage: {
    id: 'oracle.eventUnconfirmed',
    defaultMessage: 'This created Event is unconfirmed. You cannot interact with it until it is confirmed by the blockchain.',
  },
  createEscrow: {
    id: 'create.escrow',
    defaultMessage: 'Escrow',
  },
});

const Stake = withStyles(styles, { withTheme: true })(observer(({ classes, store: { createEvent }, intl }) => {
  const a = 1;
  return (
    <Section title={messages.createEscrow}>
      <TextField
        select
        value={createEvent.escrowAmount}
        onChange={createEvent.handleEscrowAmountChange}
        variant="outlined"
        SelectProps={{
          native: true,
        }}
      >
        <option value={100}>100 BOT</option>
        <option value={200}>200 BOT</option>
        <option value={300}>300 BOT</option>
        <option value={400}>400 BOT</option>
      </TextField>
      <Button variant="outlined" disabled classes={{ root: classes.root, disabled: classes.disabled }}>
        {createEvent.arbitrationLength}h
      </Button>
    </Section>
  );
}));

export default injectIntl(inject('store')(Stake));
