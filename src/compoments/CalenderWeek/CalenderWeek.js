import { parseTime, deepClone } from '../../utils'

Component({
  mixins: [],
  data: {
    weekDateRange: null, // 选中日期范围
    curDate: null, // 当前月份日期
    monthDateCache: {}, // 月份日期缓存数据
    current: 1, // 当前周历轮播默认显示索引
    calendarSwiperDates: [], // 周历轮播日期信息
    weekClick: false, // 是否点击周信息
    emitTimer: null,
    swiperHeight: 0,
    weekActiveIndex: 0,
    weekActiveDateRange: null
  },
  props: {
    duration: 300,
    cellHeight: 60,
    dateActiveColor: '#FE6601',
    sundayIndex: 6,
    defaultSelectedDate: parseTime(new Date(), '{y}-{m}-{d}'),
    onChange: {
      type: Function,
      value: ()=>{}
    }
  },
  didMount() {
    this.init()
  },
  didUpdate(prevProps,prevData) {
    if (prevData.current!==this.data.current) {
      const newCurrent = this.data.current
      const oldCurrent = prevData.current
      if (newCurrent=== 0 && oldCurrent === 2) {
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
      this.swiperHeightFunc()
      this.weekActiveIndexFunc()
    }
    if (prevData.weekDateRange!==this.data.weekDateRange) {
      const newWeekRange = this.data.weekDateRange
      const oldWeekRange = prevData.oldWeekRange
      this.weekActiveIndexFunc()
      if (newWeekRange && (oldWeekRange===null || this.data.weekClick)) {
        this.emitDate()
        this.setData({
          weekClick: false
        })
      } else {
        if (this.data.emitTimer !== null) {
          clearTimeout(this.data.emitTimer)
          this.setData({
            emitTimer: null
          })
        }
        const emitTimer = setTimeout(()=>{
          this.emitDate()
          this.setData({
            emitTimer: null
          })
        }, this.props.duration+200)
        this.setData({
          emitTimer: emitTimer
        })
      }
    }
    if (prevData.calendarSwiperDates!==this.data.calendarSwiperDates) {
      this.swiperHeightFunc()
      this.weekActiveIndexFunc()
    }
  },
  didUnmount() {},
  methods: {
    /* 获取指定日期信息
    isToday: 是否获取当天的信息还是选中日期的信息
    index: 0 表示年份 1 表示月份 2 表示日期 */
    getAssignDateInfo(index) {
      return this.data.curDate.split('-')[index] * 1
    },
    // 计算选中日期的上月、本月、下月的年月信息
    getAdjacentYMD() {
      const year = this.getAssignDateInfo(0)
      const month = this.getAssignDateInfo(1)
      const prev = `${month === 1 ? year - 1 : year}-${month === 1 ? 12 : month - 1}`
      const cur = `${year}-${month}`
      const next = `${month === 12 ? year + 1 : year}-${month === 12 ? 1 : month + 1}`
      return [prev, cur, next]
    },
    swiperHeightFunc() {
      const swiperHeight = Math.ceil((this.data.calendarSwiperDates[this.data.current] || []).length / 4) * (this.props.cellHeight + 20) + 'rpx'
      this.setData({
        swiperHeight: swiperHeight
      })
    },
    weekActiveIndexFunc() {
      let index = 0, curDates = this.data.calendarSwiperDates[this.data.current]
      for (let i = 0; i < curDates.length; i ++) {
        if (curDates[i].start === this.data.weekDateRange[0] && curDates[i].end === this.data.weekDateRange[1]) {
          index = i
          break
        }
      }
      this.setData({
        weekActiveIndex: index
      })
      this.weekActiveDateRangeFunc()
      return index
    },
    // 选中周日期范围
    weekActiveDateRangeFunc() {
      const curDates = this.data.calendarSwiperDates[this.data.current][this.data.weekActiveIndex]
      const start = curDates.start.slice(5).replace(/-/g, '.')
      const end = curDates.end.slice(5).replace(/-/g, '.')
      this.setData({
        weekActiveDateRange: start + '-' + end
      })
      return start + '-' + end
    },
    // 初始化数据
			init(date) {
				this.theDayIsNextMonth(date || this.props.defaultSelectedDate) // 判断日期所在位置是否为下一个月
				this.generateAdjacentMonthWeek() // 生成临近月份周缓存数据
				this.setWeekDateRange(date || this.props.defaultSelectedDate) // 设置选中日期范围
			},
      // 设置选中日期范围
			setWeekDateRange(date) {
				let index = 0, curDates = this.data.calendarSwiperDates[this.data.current]
				if (date) {
					for (let i = 0; i < curDates.length; i ++) {
						if (curDates[i].start <= date && curDates[i].end >= date) {
							index = i
							break
						}
					}
				}
				const curWeek = this.data.calendarSwiperDates[this.data.current][index]
				this.setData({
          weekDateRange: [curWeek.start, curWeek.end]
        })
			},
      // 根据current自动对轮播数据进行衔接排序
			adjacentSortByCurrent(prev, cur, next) {
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
      // 判断日期所在位置是否为下一个月
			theDayIsNextMonth(date) {
				// 获取该日期所在月份处于下一个月的日期区间
				const dateArr = date.split('-')
				const lastDay = new Date(dateArr[0], dateArr[1], 0)
				const lastDayWeekIndex = lastDay.getDay()
				const nextMonthDateLen = (this.props.sundayIndex >= 6 ? lastDayWeekIndex : (this.props.sundayIndex + lastDayWeekIndex + 1) % 7)
				let month = nextMonthDateLen > 0 && new Date(date).getDate() > lastDay.getDate() - nextMonthDateLen ? dateArr[1] : dateArr[1] - 1
				if (month === 0) {
					dateArr[0] -= 1
					month = 12
				}
        this.setData({
          curDate: parseTime(new Date(dateArr[0], month, 1), '{y}-{m}-{d}')
        })
			},
      // 生成本月、上个月、下个月周信息
			generateAdjacentMonthWeek() {
				const arr = []
        const adjacentYMD = this.getAdjacentYMD()
				adjacentYMD.map(YM => {
					const [year, month] = YM.split('-')
					arr.push(this.generateMonthWeekCache(year, month))
				})
				const [prev, cur, next] = arr
        this.setData({
          calendarSwiperDates: this.adjacentSortByCurrent(prev, cur, next)
        })
			},
      // 生成月份周缓存数据并返回
			generateMonthWeekCache(year, month) {
				year = Number(year)
				month = Number(month)
				// 缓存中已存在
				if (this.data.monthDateCache[`${year}-${month}`]) return this.data.monthDateCache[`${year}-${month}`]
				let calendarWeek = []
				// 获取指定月份的第一天和最后一天
				// 计算指定月份最后一周的日期
				const firstDay = new Date(year, month - 1, 1);
				let lastDay = new Date(year, month, 0);
				const lastDayWeekIndex = lastDay.getDay()
				const nextMonthDateLen = (this.props.sundayIndex >= 6 ? lastDayWeekIndex : (this.props.sundayIndex + lastDayWeekIndex + 1) % 7)
				lastDay.setDate(lastDay.getDate() - nextMonthDateLen)
				// 循环遍历每一周
				while (firstDay <= lastDay) {
					const startOfWeek = new Date(lastDay)
					startOfWeek.setDate(startOfWeek.getDate() - 6)
					calendarWeek.unshift({
						start: parseTime(startOfWeek, '{y}-{m}-{d}'),
						end: parseTime(lastDay, '{y}-{m}-{d}'),
						isCurWeek: startOfWeek <= new Date() && new Date() <= lastDay
					})
					lastDay.setDate(lastDay.getDate() - 7)
				}
        const path = `monthDateCache[${year}-${month}]`
        this.setData({
          [path]: deepClone(calendarWeek)
        })
				return this.data.monthDateCache[`${year}-${month}`]
			},
      // 轮播图切换结束
			swiperChange(e) {
				// 切换上个月/下个月，默认选中第一周
				this.getPrevOrNextDate(e)
				this.setWeekDateRange()
				setTimeout(() => {
					this.generateAdjacentMonthWeek() // 重新生成临近月份周缓存数据
				}, this.props.duration)
			},
      // 获取月的一号日期/周的第一天
			getPrevOrNextDate(type) {
				let year = this.getAssignDateInfo(0)
				let month = this.getAssignDateInfo(1)
				month = month + type
				if (month > 12) {
					month = 1
					year += 1
				} else if (month === 0) {
					month = 12
					year -= 1
				}
				this.theDayIsNextMonth(`${year}-${month}-1`)
			},
      // 选择某一周
			chooseWeek(e) {
        const {weekInfo} = e.currentTarget.dataset;
				if (JSON.stringify(this.data.weekDateRange) !== JSON.stringify([weekInfo.start, weekInfo.end])) {
          this.setData({
            weekClick: true,
            weekDateRange: [weekInfo.start, weekInfo.end]
          })
				}
			},
      // 前往某一天 格式 YYYY-MM | YYYY-MM-DD
			goToDate() {
        let date = parseTime(new Date(), '{y}-{m}-{d}')
				try {
					if (date.split('-').length < 2 || date.split('-').length > 3) throw '参数有误'
					if (date.split('-').length === 2) {
						date += '-01'
					}
				} catch (err) {
					throw Error('请检查参数是否符合规范')
				}
        this.setData({
          weekClick: true
        })
				this.init(date)
			},
      // 向父组件传递当前选中数据
			emitDate() {
				this.props.onChange(this.data.weekDateRange)
			},
      onChangeSwiper(e) {
        this.setData({
          current: e.detail.current
        })
      }
  },
});
