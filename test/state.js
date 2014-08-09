var should = require('should')
var environment = require('./shared/environment')
var impromptu = require('../lib/impromptu')
var Impromptu = impromptu.constructor

describe('State', function() {
  it('should exist', function() {
    should.exist(Impromptu.State)
    should.exist(impromptu.state)
  })

  it('should set and get values', function() {
    var state = new Impromptu.State()
    should.not.exist(state.get('a'))
    state.set('a', 1)
    state.get('a').should.equal(1)
  })

  it('should emit change events', function() {
    var state = new Impromptu.State()
    var emitted = false
    state.on('a', function () {
      emitted = true
    })

    state.set('a', 1)
    emitted.should.equal(true)
  })

  it('should not emit event when value is unchanged', function() {
    var state = new Impromptu.State()
    var emitted = 0
    state.on('a', function () {
      emitted++
    })

    emitted.should.equal(0)

    state.set('a', 1)
    emitted.should.equal(1)

    state.set('a', 1)
    emitted.should.equal(1)

    state.set('a', 2)
    emitted.should.equal(2)
  })

  it('should remove change event listeners', function() {
    var state = new Impromptu.State()
    var emitted = 0
    var listener = function () {
      emitted++
    }

    state.on('a', listener)

    emitted.should.equal(0)

    state.set('a', 1)
    emitted.should.equal(1)

    state.off('a', listener)

    state.set('a', 2)
    emitted.should.equal(1)
  })
})
