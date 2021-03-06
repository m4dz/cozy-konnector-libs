const cozy = require('../cozyclient')
const moment = require('moment')
const DOCTYPE = 'io.cozy.bank.operations'

module.exports = {
  displayName: 'Bank Operation',
  doctype: DOCTYPE,
  all (selector, callback) {
    if (!selector) selector = {date: {'$gt': 0}}

    cozy.data.defineIndex(DOCTYPE, ['date'])
    .then((index) => {
      return cozy.data.query(index, {'selector': selector})
    })
    .then(operations => {
      operations = operations.map(operation => {
        operation.date = moment(operation.date)
        return operation
      })
      callback(null, operations)
    })
    .catch(err => {
      callback(err)
    })
  },
  attachBill (operationId, billId, callback) {
    let attributes = {
      bill: billId
    }

    cozy.data.updateAttributes(DOCTYPE, operationId, attributes)
      .then(updated => {
        callback(null, updated)
      })
      .catch(err => {
        callback(err)
      })
  },
  createChildOperation (parentOperation, difference, callback) {
    let attributes = Object.assign({}, parentOperation, difference)
    attributes.parent = attributes._id
    delete attributes._id
    delete attributes._rev
    delete attributes._type

    cozy.data.create(DOCTYPE, attributes)
      .then(() => callback(null))
      .catch(err => {
        callback(err)
      })
  }
}
