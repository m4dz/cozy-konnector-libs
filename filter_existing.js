const debug = require('debug')('filter_existing')

// Returns a fetcher layer that adds a new array field to the second function
// parameter.
// This array contains all entries that are not already stored in the
// database. To know if an entry has no match in the database, it checks if
// date fields are the same.
//
// It expects a field called "fetched" as field of the second parameter. This
// field contains the entries to filter.
//
module.exports = (log, model, suffix, vendor) => {
  return function (requiredFields, entries, body, next) {
    debug(entries.fetched, 'entries to filter')
    entries.filtered = []

    // Set vendor automatically if not given
    if ((vendor == null) && (entries.fetched.length > 0)) {
      ({ vendor } = entries.fetched[0])
    }

    // Get current entries
    return model.all(function (err, entryObjects) {
      let hash
      if (err) {
        debug(err, 'error when trying to get all the entries')
        return next(err.message)
      }
      const entryHash = {}

      // Build an hash where key is the date and valie is the entry
      for (let entry of Array.from(entryObjects)) {
        // If a vendor parameter is given, entry should be of given
        // vendor to be added to the hash (useful for bills).
        if (vendor != null) {
          if (entry.vendor === vendor) {
            hash = `${entry.date.format('YYYY-MM-DD')}T00:00:00.000Z`
            entryHash[hash] = entry
          }

          // Simply add the entry
        } else if (entry.uniqueId) {
          hash = entry.uniqueId
          entryHash[hash] = entry
        } else {
          hash = `${entry.date.format('YYYY-MM-DD')}T00:00:00.000Z`
          entryHash[hash] = entry
        }
      }

      // Keep only non already existing entries.
      entries.filtered = entries.fetched.filter(function (entry) {
        if (entry.uniqueId) {
          hash = entry.uniqueId
        } else {
          hash = `${entry.date.format('YYYY-MM-DD')}T00:00:00.000Z`
        }
        return (entryHash[hash] == null)
      })

      // Keep only entries matching current vendor.
      entries.filtered = entries.filtered.filter(entry => entry.vendor === vendor)

      debug(entries.filtered, 'filtered entries')
      return next()
    })
  }
}
