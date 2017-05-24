"use strict";

var BaseNode = require('../BaseNode');

/**
 * From AIML Spec
 * http://www.alicebot.org/TR/2001/WD-aiml/#section-short-cut-elements
 *
 *  The sr element is a shortcut for:
 *      <srai><star/></srai>
 *
 * The atomic sr does not have any content.
 *
 * <!-- Category: aiml-template-elements -->
 * <aiml:sr/>
 */
module.exports = class Sr extends BaseNode {
  constructor (node, surly) {
    super(node, surly);
    this.type = 'sr';
    this.surly = surly;
  }

  getText (callback) {
    var star = this.surly.environment.wildcard_stack.getLast();
    this.surly.talk(star[0], callback);
  }
};
