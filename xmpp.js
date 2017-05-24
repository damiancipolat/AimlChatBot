#!/usr/bin/env node

var fs = require('fs');
var Client = require('node-xmpp-client');
var pkg = require('./package.json');
var Surly = require('./src/Surly');
var conf = require('rc')('surly', {
  username: '',   u: '',
  password: '',   p: '',
  host: '',       h: '',
  port: '',       P: '',
  brain: '',      b: '',
  help: false,
  version: false
});
var options = {
    username: conf.u || conf.username || '',
    password: conf.p || conf.password || '',
    host: conf.h || conf.host || 'talk.google.com',
    port: conf.P || conf.port || 5222,
    brain: conf.b || conf.brain || __dirname + '/aiml',
    help: conf.help || conf.h,
    version: conf.version,
};

if (options.help) {
    console.log('Surly chat bot command line interface\n\n' +
        'Options: \n' +
        '  -u, --username    XMPP username ()\n' +
        '  -p, --password    XMPP password ()\n' +
        '  -h, --host        XMPP host     (talk.google.com)\n' +
        '  -P, --port        XMPP port     (5222)\n' +
        '  -b, --brain       AIML directory (aiml/)\n' +
        '  --help            Show this help message\n' +
        '  --version         Show version number');
    process.exit();
}

if (options.version) {
    console.log(pkg.version);
    process.exit();
}

var bot = new Surly({
  brain: options.brain
});

var client = new Client({
  jid:      options.username,
  password: options.password,
  port:     options.port,
  host:     options.host,
  preferred: "PLAIN"
})

client.on('online', function () {
  console.log('Online!');
  client.send(new Client.Stanza('presence', {})
    .c('show').t('chat').up()
    .c('status').t('Hello! I am here!')
  );
});

client.on('offline', function () {
  console.log('Offline!');
});

client.on('error', function(e) {
    console.error(e);
});

function log() {
  var msg = Array.prototype.join.call(arguments, '');
  fs.appendFile(__dirname + '/logs/surly-xmpp.log', msg + '\n', function (err) {
    if (err) {
      throw 'Failed to write to log file. ' + err;
    }
  });
}

client.on('stanza', function (stanza) {
  if (stanza.is('message') && stanza.attrs.type !== 'error') {
    var body = stanza.getChildText('body');
    if (!body) return;

    log(stanza.attrs.from, ': ', body);

    bot.talk(body, function (err, response) {
      if (err) return;

      var reply = new Client.Stanza('message', {
        to: stanza.attrs.from,
        from: stanza.attrs.to,
        type: 'chat'
      });

      log('Surly: ', response);

      reply.c('body').t(response);

      client.send(reply);
    });
  }
});
