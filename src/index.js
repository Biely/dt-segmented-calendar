
Component({
  mixins: [],
  data: {
    mode: 0
  },
  props: {
    modeList: ['日', '周', '月'],
    onChange: () => {}
  },
  didMount() {},
  didUpdate() {},
  didUnmount() {},
  methods: {
    setMode(e) {
      this.setData({
        mode: e
      })
    },
    dateChange(e) {
      this.props.onChange({
        type: 1,
        value: e
      })
      // this.triggerEvent('change', )
    },
    weekChange(e) {
      this.props.onChange({
        type: 2,
        value: e
      })
    },
    monthChange(e) {
      this.props.onChange({
        type: 3,
        value: e
      })
    },
  },
});
