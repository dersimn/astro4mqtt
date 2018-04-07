#!/usr/bin/env node

const pkg = require('./package.json');
const log = require('yalm');
const config = require('yargs')
    .env('ASTRO4MQTT')
    .usage(pkg.name + ' ' + pkg.version + '\n' + pkg.description + '\n\nUsage: $0 [options]')
    .describe('verbosity', 'possible values: "error", "warn", "info", "debug"')
    .describe('name', 'instance name. used as mqtt client id and as prefix for connected topic')
    .describe('mqtt-url', 'mqtt broker url. See https://github.com/mqttjs/MQTT.js#connect-using-a-url')
    .describe('update-interval', 'update interval (in ms)')
    .alias({
        h: 'help',
        m: 'mqtt-url',
        v: 'verbosity',
        b: 'latitude',
        l: 'longitude'
    })
    .default({
        name: 'astro',
        'mqtt-url': 'mqtt://127.0.0.1',
        'update-interval': 60000,
        'l': -0.1,
        'b': 51.5
    })
    .version()
    .help('help')
    .argv;
const MqttSmarthome = require('mqtt-smarthome-connect');
const Timer = require('yetanothertimerlibrary');
const SunCalc = require('suncalc');

log.setLevel(config.verbosity);
log.info(pkg.name + ' ' + pkg.version + ' starting');
log.debug("loaded config: ", config);

log.info('mqtt trying to connect', config.mqttUrl);
const mqtt = new MqttSmarthome(config.mqttUrl, {
    logger: log,
    will: {topic: config.name + '/connected', payload: '0', retain: true}
});
mqtt.connect();

mqtt.on('connect', () => {
    log.info('mqtt connected', config.mqttUrl);
    mqtt.publish(config.name + '/connected', '1', {retain: true});
});

var calc = new Timer(() => {
	var now = new Date();
	var sunPos = SunCalc.getPosition(now, config.latitude, config.longitude);

	mqtt.publish(config.name + "/status/sun/azimuth", sunPos.azimuth * 180 / Math.PI);
	mqtt.publish(config.name + "/status/sun/altitude", sunPos.altitude * 180 / Math.PI);
}, config.updateInterval).exec(1000);
