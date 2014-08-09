var should = require('should')
var environment = require('./shared/environment')
var impromptu = require('../lib/impromptu')
var Impromptu = impromptu.constructor

describe('Config', function() {
  it('should exist', function() {
    should.exist(Impromptu.Config)
    should.exist(impromptu.config)
  })

  it('should set and get values', function() {
    var config = new Impromptu.Config()
    should.not.exist(config.get('a'))
    config.set('a', 1)
    config.get('a').should.equal(1)
  })

  it('should emit change events', function() {
    var config = new Impromptu.Config()
    var emitted = false
    config.on('a', function () {
      emitted = true
    })

    config.set('a', 1)
    emitted.should.equal(true)
  })

  it('should not emit event when value is unchanged', function() {
    var config = new Impromptu.Config()
    var emitted = 0
    config.on('a', function () {
      emitted++
    })

    emitted.should.equal(0)

    config.set('a', 1)
    emitted.should.equal(1)

    config.set('a', 1)
    emitted.should.equal(1)

    config.set('a', 2)
    emitted.should.equal(2)
  })

  it('should remove change event listeners', function() {
    var config = new Impromptu.Config()
    var emitted = 0
    var listener = function () {
      emitted++
    }

    config.on('a', listener)

    emitted.should.equal(0)

    config.set('a', 1)
    emitted.should.equal(1)

    config.off('a', listener)

    config.set('a', 2)
    emitted.should.equal(1)
  })
})
