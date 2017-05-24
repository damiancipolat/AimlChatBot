"use strict";

const fs = require('fs');
const async = require('async');
const BaseNode = require('./BaseNode');
const libxmljs = require('libxmljs');
const Category = require('./Category');
const Logger = require('../Logger');

/**
* Main AIML handler. Contains a list of category nodes, potentially loaded
* from multiple files.
*/
module.exports = class Aiml {
  constructor (options) {
    this.surly = options.surly;
    this.wipe();
    this.categories = [];
    this.log = new Logger();
  }

  /**
   * Remove all loaded data from memory and set up defaults. Called when Aiml
   * object is initialised
   */
  wipe () {
    this.categories = [];
    this.topics = ['*'];
  }

  /**
   * Load an AIML string
   * @param {String} aiml    A whole AIML file
   */
  parseAiml (aiml) {
    this.log.debug('parsing aiml...');

    var xmlDoc = libxmljs.parseXmlString(aiml),
      topics = xmlDoc.find('topic'),
      categories,
      topic_name,
      topic_cats,
      i, j;

    // Handle topic cats first - they should be matched first
    for (i = 0; i < topics.length; i++) {
      topic_name = topics[i].attr('name').value();
      topic_cats = topics[i].find('category');

      for (j = 0; j < topic_cats.length; j++) {
        this.categories.push(new Category(topic_cats[j], this.surly, topic_name));
      }
    }

    categories = xmlDoc.find('category');
    this.log.debug('Loading ' + this.categories.length + ' categories.');

    for (i = 0; i < categories.length; i++) {
      this.categories.push(new Category(categories[i], this.surly));
    }

    this.showCategories();
  }

  /**
   * List out all loaded categories and their topics. For debugging.
   */
  showCategories () {
    for (var i = 0; i < this.categories.length; i++) {
      this.log.debug(this.categories[i].topic + ' - ' + this.categories[i].pattern.text_pattern);
    }
  }

  /**
   * Simple check to see if any data has been loaded
   * @return {Boolean} True if data has been loaded
   */
  hasData () {
    return this.categories.length > 0;
  }

  /**
   * Give a sentence and get a response
   */
  getResponse(sentence, callback) {
    var template = this.findMatchingCategory(sentence, function (category) {

      if (category) {
        var template = category.getTemplate();
        template.getText(callback);
      } else {
        callback('No match.', 'Fuck knows.');
      }
    }.bind(this));
  }

  /**
   * Loop through loaded AIML and return the `template` from the first `category`
   * with a `pattern` that matches `sentence`.
   * @param {String} sentence    Text input from user
   */
  findMatchingCategory (sentence, foundCatCallback) {
    if (!this.hasData()) {
      throw 'No data loaded.';
    }

    sentence = this.normaliseSentence(sentence);

    async.detectSeries(this.categories, function (item, callback) {
      item.match(sentence, callback);
    }, function (matchingCategory) { // Shouldn't there be err here? What?!
      foundCatCallback(matchingCategory);
    });
  }

  /**
   * Find files in a dir and run loadAimlFile on them
   * @param  {String} dir
   * @return {Undefined}
   */
  loadDir (dir, callback) {
    var files = fs.readdirSync(dir);

    this.log.debug('Loading dir' + dir);

    for (var i in files) {
      if (!files.hasOwnProperty(i)) continue;

      var name = dir + '/' + files[i];

      if (fs.statSync(name).isDirectory()) {
        this.log.debug('Ignoring directory: ' + name);
      } else if (name.substr(-5).toLowerCase() === '.aiml') {
        this.loadFile(name, callback);
      }
    }
  }

  /**
   * Load an AIML file
   * @param  {String} file
   * @return {Undefined}
   */
  loadFile (file, callback) {
    this.log.debug('Loading file: ' + file);
    fs.readFile(file, 'utf8', function (err, xml) {
      if (err) {
        throw 'Failed to load AIML file. ' + err;
      }

      this.parseAiml(xml);
    }.bind(this));
  }

  /**
   * Perform input normalisation. See AIML spec section 8.3
   * Should (but doesn't yet) include:
   *  - Substitution normalisations
   *  - Sentence-splitting normalisations
   *  - Pattern-fitting normalisations
   * @todo - check against spec
   *
   * @param  {[type]} sentence [description]
   * @return {[type]}          [description]
   */
  normaliseSentence (sentence) {
    this.log.debug('normalising ', sentence);

    // add spaces to prevent false positives
    if (sentence.charAt(0) !== ' ') {
      sentence = ' ' + sentence;
    }

    // Remove trailing punctuation - @todo use regex!
    while (['!', '.', '?'].indexOf(sentence.charAt(sentence.length -1)) !== -1) {
      sentence = sentence.substr(0, sentence.length - 1);
    }

    if (sentence.charAt(sentence.length - 1) !== ' ') {
      sentence = sentence + ' ';
    }

    sentence = sentence.toUpperCase(); // @todo - remove this

    return sentence;
  }
};
