import { parseTime, deepClone } from '../../utils'

Component({
  options: {
    // 使用基础库内置的数据变化观测器
    // observers: true,
  },
  mixins: [],
  data: {
    today: parseTime(new Date(), '{y}-{m}-{d}'), // 今天日期
    selectedDate: null, // 选中日期
    week: [], // 日历周数
    current: 1, // 当前日历轮播默认显示索引
    calendarSwiperDates: [], // 日历轮播日期信息
    swiperChangeByClick: false, // 是否通过点击上月份或下月份的日期进行轮播切换
    swiperMode: 'close', // 日历轮播显示模式 open：展开 close：收缩
    monthDateCache: {}, // 月份日期缓存数据
    emitTimer: null, // 日期改变向父级传递当前选中日期计时器
    dateClick: false, // 是否进行了日期的点击选择
    currentYear: null,
    currentMonthDate: null,
    curCalendarDates:[],
    adjacentYMD: [],
    dateActiveIndex: null,
    swiperHeight: 0,
    getcurCalendarDates: [],
    getAdjacentYMD: []
  },
  props: {
    duration: 300,
    cellHeight: 75,
    dateActiveColor: '#FE6601',
    sundayIndex: 6,
    calendarMode: 'open',
    changeSetDefault: true,
    defaultSelectedDate: parseTime(new Date(), '{y}-{m}-{d}'),
    showArrowBtn: true,
    onChange: {
      type: Function,
      value: ()=>{}
    }
  },
  didMount() {
    this.init()
  },
  didUpdate(prevProps,prevData) {
    if (prevData.selectedDate!==this.data.selectedDate) {
      const newV = this.data.selectedDate
      const oldV = prevData.selectedDate
      if (this.data.swiperMode === 'close') {
        setTimeout(() => {
          this.generateAdjacentMonthDate() // 生成临近月份日期缓存数据
        }, this.props.duration);
      }
      if (newV && (oldV === null || this.data.dateClick)) { // 初始化/日历点击选择时直接返回
        this.emitDate()
        this.setData({
          dateClick: false
        })
      } else { // 其它情况做防抖处理
        if (this.data.emitTimer !== null) {
          clearTimeout(this.data.emitTimer)
          this.setData({
            emitTimer: null
          })
        }
        this.data.emitTimer = setTimeout(() => {
          this.emitDate()
          this.setData({
            emitTimer: null
          })
        }, this.props.duration + 200)
      }
    }
    if (prevData.current!==this.data.current) {
      const oldCurrent = prevData.current
      const newCurrent = this.data.current
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
    if (prevData.swiperMode!==this.data.swiperMode) {
      // console.log("watch swiperMode")
      const normalHeight = (this.data.calendarSwiperDates[this.data.current]||[]).length / 7 * (this.props.cellHeight+20)+'rpx'
      const shrinkHeight = this.props.cellHeight + 20 + 'rpx'
      this.setData({
        swiperHeight: this.data.swiperMode === 'open' ? normalHeight: shrinkHeight
      })
      this.getcurCalendarDatesFunc()
    }
    if (prevData.calendarSwiperDates!==this.data.calendarSwiperDates) {
      // console.log("watch calendarSwiperDates")
    }
  },
  didUnmount() {},
  methods: {
    getcurCalendarDatesFunc() {
      if (this.data.swiperMode === 'open') { // 展开
        this.setData({
          getcurCalendarDates: this.data.calendarSwiperDates
        })
        return this.data.calendarSwiperDates
      } else {
        const dates = this.getCalendarShrinkSwiperDates()
        console.log("close",dates)
        this.setData({
          getcurCalendarDates: dates
        })
        return dates
      }
    },
			// 计算选中日期的上月、本月、下月的年月信息
    getAdjacentYMDFunc() {
      const year = this.getAssignDateInfo(false, 0)
      const month = this.getAssignDateInfo(false, 1)
      const prev = `${month === 1 ? year - 1 : year}-${month === 1 ? 12 : month - 1}`
      const cur = `${year}-${month}`
      const next = `${month === 12 ? year + 1 : year}-${month === 12 ? 1 : month + 1}`
      this.setData({
        getAdjacentYMD: [prev, cur, next]
      })
      return [prev, cur, next]
    },
    /* 获取指定日期信息
			isToday: 是否获取当天的信息还是选中日期的信息
			index: 0 表示年份 1 表示月份 2 表示日期 */
    getAssignDateInfo(isToday, index) {
      return (isToday ? this.data.today : this.data.selectedDate).split('-')[index] * 1
    },
    // 初始化数据
    init() {
      if (this.data.selectedDate === null) { // 默认选中日期为当天
        this.setData({
          selectedDate: this.props.defaultSelectedDate || this.data.today
        })
      }
      this.initWeek() // 初始化要显示的周数
      this.generateAdjacentMonthDate() // 生成临近月份日期缓存数据
      // this.getcurCalendarDatesFunc()
    },
    // 初始化周数
    initWeek() {
      const normalWeek = ['日', '一', '二', '三', '四', '五', '六'] // 正常周数
      const sIndex = this.props.sundayIndex < 0 ? 0 : this.props.sundayIndex >= normalWeek.length ? normalWeek.length - 1 : this.props.sundayIndex
      normalWeek.unshift(...normalWeek.slice(-sIndex))
      normalWeek.length = 7
      this.setData({
        week: normalWeek
      })
    },
    // 根据current自动对轮播数据进行衔接排序
    adjacentSortByCurrent(prev, cur, next) {
      // console.log("adjacentSortByCurrent",this.data.current)
      let arr
      if (this.data.current === 0) {
        arr = [cur, next, prev]
      } else if (this.data.current === 1) {
        arr = [prev, cur, next]
      } else if (this.data.current === 2) {
        arr = [next, prev, cur]
      }
      return arr
    },
    // 生成本月、上个月、下个月日期信息
    generateAdjacentMonthDate() {
      const arr = []
      this.getAdjacentYMDFunc().map(YM => {
        const [year, month] = YM.split('-')
        arr.push(this.generateMonthDateCache(year, month))
      })
      const [prev, cur, next] = arr
      this.setData({
        calendarSwiperDates: this.adjacentSortByCurrent(prev, cur, next)
      })
      // this.getcurCalendarDatesFunc()
      if (this.data.swiperChangeByClick) {
        this.setData({
          swiperChangeByClick: false
        })
      }
      this.getcurCalendarDatesFunc()
    },
    // 生成月份日期缓存数据并返回
    generateMonthDateCache(year, month) {
      year = Number(year)
      month = Number(month)
      // 缓存中已存在
      if (this.data.monthDateCache[`${year}-${month}`]) return this.data.monthDateCache[`${year}-${month}`]
      let calendarDate = []
      const monthDates = new Date(year, month, 0).getDate() // 获取此月份总天数
      const normalWeek = ['一', '二', '三', '四', '五', '六', '日'] // 正常周数
      const monthFirstDay = normalWeek[new Date(year, month - 1, 0).getDay()] // 获取本月一号为星期几
      const monthFirstDayIndex = this.data.week.indexOf(monthFirstDay) // 计算本月一号在日历周数中的索引，索引之前的填充上个月的后几天
      // 本月一号在日历中不是第一个位置，需要进行填充
      if (monthFirstDayIndex !== 0) {
        const prevMonthDates = new Date(year, month - 1, 0).getDate() // 获取上一个月份的总天数
        // 填充本月一号之前的数据
        for (let i = 0; i < monthFirstDayIndex; i ++) {
          const item = {
            year: month === 1 ? year - 1 : year,
            month: month === 1 ? 12 : month - 1,
            date: prevMonthDates - i,
            dateFormat: `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}-${String(prevMonthDates - i).padStart(2, '0')}`,
            type: 'prev'
          }
          // 判断填充的日期是否包含今天日期
          this.theDateIsToday(item)
          calendarDate.unshift(item)
        }
      }
      // 循环生成当月所有日期
      for (let i = 1; i <= monthDates; i ++) {
        const item = {
          year,
          month,
          date: i,
          isSelected: false,
          dateFormat: `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
          type: 'cur'
        }
        // 今天的日期在不在里面
        this.theDateIsToday(item)
        calendarDate.push(item)
      }
      const residue = calendarDate.length % 7
      // 判断是否需要填充下个月的前几天
      if (residue !== 0) {
        for (let i = 1; i <= 7 - residue; i ++) {
          const item = {
            year: month === 12 ? year + 1 : year,
            month: month === 12 ? 1 : month + 1,
            date: i,
            dateFormat: `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
            type: 'next'
          }
          // 下个月的前几天包含今天
          this.theDateIsToday(item)
          calendarDate.push(item)
        }
      }
      const path = `monthDateCache[${year}-${month}]`
      this.setData({
        [path]: deepClone(calendarDate)
      })
      return this.data.monthDateCache[`${year}-${month}`]
    },
    // 轮播图切换结束
    swiperChange(e) {
      // 切换上个月/下个月，默认选中一号 / 切换上一周/下一周，默认选中第一天
      if (!this.data.swiperChangeByClick) {
        this.getPrevOrNextDate(e)
      }
      if (this.data.swiperMode === 'open') { // 展开
        // 通过点击上个月/下个月日期进行切换，不需要默认选中下个月的一号，直接选中点击的那个日期
        setTimeout(() => {
          this.generateAdjacentMonthDate() // // 重新生成临近月份日期缓存数据
        }, this.props.duration)
      }
    },
    // 判断日期是否为今天
    theDateIsToday(item) {
      if (`${item.year}${item.month}${item.date}` === `${this.getAssignDateInfo(true, 0)}${this.getAssignDateInfo(true, 1)}${this.getAssignDateInfo(true, 2)}`) {
        item.isToday = true
      }
    },
    // 计算收缩时的日历轮播日期信息
    getCalendarShrinkSwiperDates() {
      const [prevYM, curYM, nextYM] = this.getAdjacentYMDFunc()
      // 本月日期数据
      const curDates = this.data.monthDateCache[curYM]
      // 计算当前日期所在行
      const line = Math.floor(curDates.map(item => item.dateFormat).indexOf(this.data.selectedDate) / 7)
      // 当前周日期信息
      const cur = curDates.slice(line * 7, (line + 1) * 7)
      let prev, next
      /**
       * 获取上一周日期信息
       * 注意：当选中日期为第一周要额外判断，如果刚好为日历的第一天，则上一周数据应为上一个月的最后一周，否则为上一个月的倒数第二周
       */ 
      if (line === 0) {
        // 获取上个月日历数据
        const prevDates = this.data.monthDateCache[prevYM]
        // 获取上个月的日历行数
        const prevDatesLine = prevDates.length / 7
        if (curDates[0].dateFormat === this.data.selectedDate) { // 选中日期刚好为日历第一天
          prev = prevDates.slice((prevDatesLine - 1) * 7) // 上个月倒数第一周数据
        } else {
          prev = prevDates.slice((prevDatesLine - 2) * 7, (prevDatesLine - 1) * 7) // 上个月倒数第二周数据
        }
      } else {
        prev = curDates.slice((line - 1) * 7, line * 7)
      }
      /**
       * 获取下一周日期信息
       * 注意：当选中日期为最后一周要额外判断，如果刚好为日历的最后一天，则下一周数据应为下一个月的第一周，否则为下一个月的第二周
       */ 
      if (line + 1 === curDates.length / 7) {
        // 获取下个月的日期数据
        const nextDates = this.data.monthDateCache[nextYM]
        if (curDates[curDates.length - 1].dateFormat === this.data.selectedDate) { // 选中日期刚好为日历最后一天
          next = nextDates.slice(0, 7) // 下个月第一周数据
        } else {
          next = nextDates.slice(7, 14) // 下个月第二周数据
        }
      } else {
        next = curDates.slice((line + 1) * 7, (line + 2) * 7)
      }
      return this.adjacentSortByCurrent(prev, cur, next)
    },
    // 手动切换日历
    switchCalendar(type) {
      const currentKey = this.data.swiperMode === 'close' ? 'shrinkCurrent' : 'current'
      const v = this.data[currentKey] + (type === 'prev' ? -1 : 1)
      // this[currentKey] = v === -1 ? 2 : v === 3 ? 0 : v
      this.setData({
        [currentKey]: v === -1 ? 2 : v === 3 ? 0 : v
      })
    },
    // 获取月的一号日期/周的第一天
    getPrevOrNextDate(type) {
      if (this.data.swiperMode === 'open') {
        const year = this.getAssignDateInfo(false, 0)
        let month = this.getAssignDateInfo(false, 1)
        month = month + type
        // 判断切换月份时选中当前日期高亮还是一号，若选中当前日期高亮需进行大小判断
        const curActiveDate = this.getAssignDateInfo(false, 2)
        const maxDate = new Date(year, month, 0).getDate()
        const date = this.props.changeSetDefault ? 1 : curActiveDate > maxDate ? maxDate : curActiveDate
        this.setData({
          selectedDate: parseTime(new Date(year, month - 1, date), '{y}-{m}-{d}')
        })
        // this.selectedDate = 
      } else {
        let current = this.data.current + type < 0 ? 2 : this.data.current + type > 2 ? 0 : this.data.current + type
        // this.selectedDate = this.getcurCalendarDates[current][0].dateFormat
        const getcurCalendarDates = this.getcurCalendarDatesFunc()
        this.setData({
          selectedDate: getcurCalendarDates[current][0].dateFormat
        })
      }
    },
    // 前往某一天 格式 YYYY-MM | YYYY-MM-DD
    goToDate() {
      let date = this.data.today
      try {
        if (date.split('-').length < 2 || date.split('-').length > 3) throw '参数有误'
        if (date.split('-').length === 2) {
          date += '-01'
        }
      } catch (err) {
        throw Error('请检查参数是否符合规范')
      }
      this.setData({
        dateClick: true,
        selectedDate: date
      })
      this.generateAdjacentMonthDate()
    },
    // 日历轮播展开的情况下选择日期
    chooseDate(e) {
      const {dateInfo} = e.currentTarget.dataset;
      // 重复点击后续不做处理
      if (dateInfo.dateFormat === this.data.selectedDate) return false
      if (this.data.swiperMode === 'open') { // 展开
        // 是否点击了上个月份的后几天或者点击了下个月份的前几天
        if (dateInfo.type !== 'cur') {
          if (dateInfo.type === 'prev') { // 点击了上个月份的后几天，滑到上个月
            this.setData({
              current: this.data.current === 0 ? 2 : this.data.current - 1
            })
          } else { // 点击了下个月份的前几天，滑到下个月
            this.setData({
              current: this.data.current === 2 ? 0 : this.data.current + 1
            })
          }
          // 将选中日期赋值为当前点击的那个日期
          this.setData({
            swiperChangeByClick: true
          })
        } else {
          this.setData({
            dateClick: true
          })
        }
      } else { // 收缩
        // 是否点击了上个月份的后几天或者点击了下个月份的前几天
        if (dateInfo.type !== 'cur') {
          // 将选中日期赋值为当前点击的那个日期
          this.setData({
            swiperChangeByClick: true
          })
        }
        this.setData({
          dateClick: true
        })
      }
      // 将当前选中的日期清空并选中最新的日期
      this.setData({
        selectedDate: dateInfo.dateFormat
      })
    },
    // 向父组件传递当前选中数据
    emitDate() {
      console.log("向父组件传递当前选中数据",this.props.onChange)
      this.props.onChange(this.data.selectedDate)
    },
    onChangeSwiper(e) {
      console.log("onChangeSwiper",e)
      this.setData({
        current: e.detail.current
      })
    },
    swiperModeChange() {
      this.setData({
        swiperMode: this.data.swiperMode==='open' ? 'close' : 'open'
      })
    }
  },
});
