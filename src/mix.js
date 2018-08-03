import aops from './async-operations.js'
export default {
  data () {
    return {
      [aops.cfg.dataPropName]: {},
    }
  },
  computed: {
    $async () {
      return this[aops.cfg.dataPropName]
    },
  },
  created () {
    aops.onCreated(this)
  },
}
