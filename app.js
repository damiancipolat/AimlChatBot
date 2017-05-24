#!/usr/bin/env node

var pkg = require('./package.json');
var Surly = require('./src/Surly');
var conf = require('rc')('surly', {
    brain: '',      b: '',
    help: false,
    version: false
});

var options = {
    brain: conf.b || conf.brain || __dirname + '/data/aiml',
    help: conf.help || conf.h,
    version: conf.version,
};

var prompt = 'Vos> ';

if (options.help) {
    console.log('BOT chat bot command line interface\n\n' +
        'Options: \n' +
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

console.log('--------------------------------------------------------------------');
console.log('---               BOT V 1.0 por Damián Cipolat                    --');
console.log('--------------------------------------------------------------------');
console.log('Bot: Escriba "quit" para salir o "help" para leer la ayuda.');
process.stdout.write(prompt);

process.stdin.addListener('data', function (d) {
	var sentence = d.toString().substring(0, d.length - 1);

	if (sentence === 'quit' || sentence === 'exit') {
		console.log('Yeah, fuck off.');
		process.exit(0);
	}

  bot.talk(sentence, function (err, response) {
    console.log('Bot> ' + response);
    process.stdout.write(prompt);
  });
});
