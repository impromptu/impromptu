function Config () {
  this._data = {}
}

Config.prototype.get = function (key) {
  return this._data[key]
}

Config.prototype.set = function (key, value) {
  this._data[key] = value
}

module.exports = Config
