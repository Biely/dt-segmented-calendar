import { parseTime, deepClone } from '../../utils'

Component({
  mixins: [],
  data: {
    current: 1, // 当前周历轮播默认显示索引
    selectedMonth: null, // 选中年月
    monthCache: {}, // 月份缓存数据
    calendarSwiperDates: [], // 月历轮播日期信息
    monthClick: false,
    emitTimer: null
  },
  props: {
    duration: 300,
    cellHeight: 75,
    dateActiveColor: '#FE6601',
    defaultSelectedDate: parseTime(new Date(), '{y}-{m}-{d}'),
    onChange: {
      type: Function,
      value: ()=>{}
    }
  },
  didMount() {
    this.init()
  },
  didUpdate(prevProps, prevData) {
    if (prevData.current !== this.data.current) {
      const newCurrent = this.data.current
      const oldCurrent = prevData.current
      if (newCurrent === 0 && oldCurrent === 2) { // 右滑
        this.swiperChange(1)
        return
      }
      if (newCurrent === 2 && oldCurrent === 0) { // 左滑
        this.swiperChange(-1)
        return
      }
      if (newCurrent > oldCurrent) { // 右滑
        this.swiperChange(1)
      } else { // 左滑
        this.swiperChange(-1)
      }
    }
    if (prevData.selectedMonth!==this.data.selectedMonth) {
      const newSeletedMonth = this.data.selectedMonth
      const oldSeletedMonth = prevData.selectedMonth
      if (newSeletedMonth && (oldSeletedMonth === null || this.data.monthClick)) { // 初始化/日历点击选择时直接返回
        this.emitDate()
        this.setData({
          monthClick: false
        })
      } else { // 其它情况做防抖处理
        if (this.data.emitTimer !== null) {
          clearTimeout(this.data.emitTimer)
          this.setData({
            emitTimer: null
          })
        }
        const emitTimer = setTimeout(() => {
          this.emitDate()
          this.setData({
            emitTimer: null
          })
        }, this.props.duration + 200)
        this.setData({
          emitTimer: emitTimer
        })
      }
    }
  },
  didUnmount() {},
  methods: {
    // 计算选中月份的前轮播、本轮播、后轮播的年月信息
    getAdjacentYMD() {
      const year = this.data.selectedMonth.split('-')[0] * 1
      const month = this.data.selectedMonth.split('-')[1] * 1
      const offset = month > 6 ? 1 : 0
      const prev = `${year - 1 + offset}-${offset ? 1 : 7}`
      const cur = `${year}-${month}`
      const next = `${year + offset}-${offset ? 1 : 7}`
      return [prev, cur, next]
    },
    init(date) {
      this.setData({
        selectedMonth: date || this.props.defaultSelectedDate.slice(0, this.props.defaultSelectedDate.lastIndexOf('-'))
      })
      this.generateAdjacentMonth() // 生成临近月份缓存数据
    },
    // 生成临近月份缓存数据
    generateAdjacentMonth() {
      const arr = []
      const adjacentYMD = this.getAdjacentYMD()
      adjacentYMD.map(YM => {
        const [year, month] = YM.split('-')
        arr.push(this.getMonthData(year, month))
      })
      this.setData({
        calendarSwiperDates: this.adjacentSortByCurrent(arr)
      })
    },
    getMonthData(year, month) {
      if (this.data.monthCache[year + '-' + month]) return this.data.monthCache[year + '-' + month]
      year *= 1
      month = month <= 6 ? 1 : 7
      const now = new Date()
      const offset = month > 6 ? 6 : 0
      const arr = []
      for (let i = 1; i <= 6; i ++) {
        arr.push({
          year,
          month: i + offset,
          isCurMonth: year === now.getFullYear() && i + offset === now.getMonth() + 1
        })
      }
      const path = `monthCache[${year+ '-' + month}]`
      this.setData({
        [path]: arr
      })
      return this.data.monthCache[year + '-' + month]
    },
    // 根据current自动对轮播数据进行衔接排序
    adjacentSortByCurrent(arr) {
      const [prev, cur, next] = arr
      if (this.data.current === 0) {
        arr = [cur, next, prev]
      } else if (this.data.current === 1) {
        arr = [prev, cur, next]
      } else if (this.data.current === 2) {
        arr = [next, prev, cur]
      }
      return arr
    },
    // 轮播图切换结束
    swiperChange(e) {
      // 切换上个轮播/下个轮播，默认选中第一个月
      this.getPrevOrNextMonth(e)
      setTimeout(() => {
        this.generateAdjacentMonth() // 重新生成临近月份周缓存数据
      }, this.props.duration)
    },
    // 获取第一个月
    getPrevOrNextMonth(type) {
      let year = this.data.selectedMonth.split('-')[0] * 1
      let month = this.data.selectedMonth.split('-')[1] * 1
      if (type === 1) {
        year = month <= 6 ? year : year + 1
      } else {
        year = month <= 6 ? year - 1 : year
      }
      month = month <= 6 ? 7 : 1
      this.setData({
        selectedMonth: year + '-' + String(month).padStart(2, '0')
      })
    },
    // 选择月份
    chooseMonth(e) {
      console.log(e)
      const {monthInfo} = e.currentTarget.dataset;
      this.setData({
        selectedMonth: monthInfo.year + '-' + String(monthInfo.month).padStart(2, '0'),
        monthClick: true
      })
    },
    emitDate() {
      this.props.onChange(this.data.selectedMonth)
    },
    // 前往某一天 格式 YYYY-MM
    goToDate() {
      let date = parseTime(new Date(), '{y}-{m}')
      try {
        if (date.split('-').length < 1 || date.split('-').length > 2) throw '参数有误'
      } catch (err) {
        throw Error('请检查参数是否符合规范')
      }
      this.setData({
        monthClick: true
      })
      this.init(date)
    },
    onChangeSwiper(e) {
      this.setData({
        current: e.detail.current
      })
    }
  },
});
