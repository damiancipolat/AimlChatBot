"use strict";

const substitutions = require('../data/substitutions.json');

/**
 * Swap words in a given sentence from a given set of pairs.
 * @param  {String} sentence Sentence to update
 * @param  {String} set      Set of substitutions to use
 * @return {String}          Updated sentence
 */
module.exports = function (sentence, set) {
  var x, y, chunks = sentence.split(' ');

  if (typeof substitutions[set] === 'undefined') {
    throw 'Invalid set.';
  }

  for (x = 0; x < chunks.length; x++) {
    if (typeof substitutions[set][chunks[x].toLowerCase()] !== 'undefined') {
      chunks[x] = substitutions[set][chunks[x].toLowerCase()];
    }
  }

  return chunks.join(' ');
};
