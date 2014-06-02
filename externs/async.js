/**
 * @fileoverview The subset of the async API that we use.
 */

/** @type {Object} */
var async = {}

/**
 * @param {Array} arr
 * @param {function(*,function(Error))} iterator
 * @param {function(Error)} callback
 */
async.each = function (arr, iterator, callback) {}

/**
 * @param {Array} arr
 * @param {function(*,function(Error, *))} iterator
 * @param {function(Error, Array)} callback
 */
async.map = function (arr, iterator, callback) {}

/**
 * @param {Array} arr
 * @param {function(*,function(boolean))} iterator
 * @param {function(boolean)} callback
 */
async.every = function (arr, iterator, callback) {}

/**
 * @param {Array.<function(Error,*)>|Object.<function(Error,*)>} tasks
 * @param {function(Error,Array)=} callback
 */
async.series = function (tasks, callback) {}

/**
 * @param {Array.<function(Error,*)>|Object.<function(Error,*)>} tasks
 * @param {function(Error,Array)=} callback
 */
async.parallel = function (tasks, callback) {}

/**
 * @param {Array.<function(Error,...[?])>|Object.<function(Error,...[?])>} tasks
 * @param {function(Error,Array=)=} callback
 */
async.waterfall = function (tasks, callback) {}

module.exports = async
