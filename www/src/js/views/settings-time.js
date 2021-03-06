
var React = require('react');
var Backbone = require('backbone');
var ReactBackbone = require('react.backbone');

var TimeTools = require('../common/time.js');

var _ = require('lodash');
var moment = require('moment');

module.exports = React.createBackboneClass({

  timeSourceChanged: function(event) {
    var model = this.props.model;
    if (event.target.id == 'automatic-time-source') {
      // Reset NTP
      model.save({'ntp': true, 'ntpServer': ''}, {patch: true});
    } else if (event.target.id == 'custom-time-source') {
      model.save({'ntp': true}, {patch: true});
    } else {
      model.save({'ntp': false}, {patch: true});
    }
    model.set('timeSource', event.target.id);
  },

  dateChanged: function(event) {
    var model = this.props.model;
    var dateTime = moment(model.get('dateTime')).utcOffset(model.get('offset') / 60);
    var newDate = _.map(event.target.value.split('-'),
                        function(v) { return parseInt(v); });

    dateTime.year(newDate[0]);
    dateTime.month(newDate[1] - 1);
    dateTime.date(newDate[2]);

    model.save({'dateTime': dateTime.unix()}, {patch: true});
  },

  timeChanged: function(event) {
    var model = this.props.model;
    var dateTime = moment(model.get('dateTime')).utcOffset(model.get('offset') / 60);
    var newTime = _.map(event.target.value.split(':'),
                        function(v) { return parseInt(v); });

    dateTime.hour(newTime[0]);
    dateTime.minute(newTime[1]);
    dateTime.second(newTime[3]);

    model.save({'dateTime': dateTime.unix()}, {patch: true});
  },

  timezoneSelectChanged: function(event) { var selected = event.target.value;
    var model = this.props.model;
    if (selected != model.get('timezone')) {
      model.save({'timezone': selected}, {patch: true});
    }
  },

  ntpServerNameChanged: function(event) {
    var ntpServerName = event.target.value;
    if (ntpServerName !== this.props.model.get('ntpServer')) {
      this.props.model.save({'ntpServer': ntpServerName}, {patch: true});
    }
  },

  render: function() {
    var model = this.props.model;

    var timeSource = model.get('timeSource') || null;
    if (timeSource == null) {
      if (model.get('ntp')) {
        if (model.get('ntpServer')) {
          timeSource = 'custom-time-source';
        } else {
          timeSource = 'automatic-time-source';
        }
      } else {
        timeSource = 'manual-time-source';
      }
    }

    var dateTime = moment.unix(model.get('dateTime') || moment.unix());
    dateTime = dateTime.utcOffset((model.get('offset') / 60) || 0);

    var timezoneName = model.get('timezone');
    var candidateTZ = TimeTools.TimeZones.filter(function(tz) {
      return tz.name === timezoneName;
    });

    var timezone;
    if (candidateTZ.length === 0) {
      // Select timezone based on "closer to" offset heuristic
      //  rather than explicit name
      var offset = model.get('offset') || 0;
      timezone = TimeTools.pickTimeZoneFromOffset(offset);
    } else {
      timezone = candidateTZ[0];
    }

    function formatTimeZoneSelectorValue(tz) {
      return  "(UTC" + tz.offset + ") " + tz.value;
    }

    return (
      <div>
        <div className="row">
          <h2>Date and time</h2>
        </div>
        <div className="row">
          <input
            type="radio"
            id="automatic-time-source"
            name="ntp-server"
            checked={timeSource == 'automatic-time-source'}
            onChange={this.timeSourceChanged} />
          <label htmlFor="automatic-ntp-radio">
            <strong>Use automatic NTP server configuration</strong>
          </label>

          <input
            type="radio"
            id="custom-time-source"
            name="ntp-server"
            checked={timeSource == 'custom-time-source'}
            onChange={this.timeSourceChanged} />
          <label htmlFor="custom-ntp-radio">
            <strong>Use custom NTP server</strong>
          </label>

          <input
            type="radio"
            id="manual-time-source"
            name="ntp-server"
            checked={timeSource == 'manual-time-source'}
            onChange={this.timeSourceChanged} />
          <label htmlFor="manial-ntp-radio">
            <strong>Set date and time manually</strong>
          </label>
        </div>

        <div className="row u-vertically-center">
          <div className="col-3"><strong>Date</strong></div>
          <div className="col-5">
            <input
              type="date"
              id="date-picker"
              value={dateTime.format('YYYY-MM-DD')}
              onChange={this.dateChanged}
              disabled={timeSource != 'manual-time-source'} />
          </div>
        </div>

        <div className="row u-vertically-center">
          <div className="col-3"><strong>Time</strong></div>
          <div className="col-5">
            <input
              type="time"
              id="time-picker"
              value={dateTime.format('HH:mm:SS')}
              onChange={this.timeChanged}
              disabled={timeSource != 'manual-time-source'} />
          </div>
        </div>

        <div className="row u-vertically-center">
          <label className="col-3 u-float--left" htmlFor="time-zone-select">
            <strong>Timezone</strong>
          </label>

          <select
            className="col-5 u-float--right"
            id="time-zone-select"
            value={timezone.name}
            onChange={this.timezoneSelectChanged}>

            {TimeTools.TimeZones.map(function(tz) {
              return (
                  <option key={tz.name} value={tz.name}> {formatTimeZoneSelectorValue(tz)} </option>
              );
            })}

          </select>
      </div>

        <div className="row u-vertically-center">
          <label className="col-3 u-float--left" htmlFor="ntp-server-name">
            <strong>Custom NTP server</strong>
          </label>
          <input
            className="col-5 u-float--right"
            type="text"
            placeholder="NTP server domain"
            id="ntp-server-name"
            value={model.get('ntpServer')}
            onChange={this.ntpServerNameChanged}
            disabled={timeSource != 'custom-time-source'} />
        </div>
      </div>
    );
  }
});
