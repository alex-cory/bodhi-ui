import React, { Component } from 'react';
import Progress from '../../../components/uielements/progress';

export default class ProgressWidget extends Component {
  render() {
    const {
      label,
      icon,
      iconcolor,
      details,
      percent,
      barHeight,
      status,
    } = this.props;

    const iconStyle = {
      color: iconcolor,
    };

    const titleStyle = {
      'font-size': '16px',
      'font-weight': 300,
    };

    return (
      <div className="isoProgressWidget">
        <div className="isoProgressWidgetTopbar">
          <h3 style={titleStyle}>{label}</h3>
          <i className={icon} style={iconStyle} />
        </div>

        <div className="isoProgressWidgetBody">
          <p className="isoDescription">{details}</p>
          <Progress
            percent={percent}
            strokeWidth={barHeight}
            status={status}
            showInfo={false}
          />
        </div>
      </div>
    );
  }
}
