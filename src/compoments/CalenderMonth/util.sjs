function isSelected(selectedMonth,monthInfo,emitTimer) {
  const year = selectedMonth.split('-')[0] * 1
  const month = selectedMonth.split('-')[1] * 1
  return monthInfo.year === year && monthInfo.month === month && emitTimer === null
}

function showBackToMonthBtn(calendarSwiperDates,current) {
  const curYear = calendarSwiperDates[current][0].year
  const now = getDate()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return curYear !== year || calendarSwiperDates[current].filter(item => item.month === month).length === 0
}

export default {
  isSelected,
  showBackToMonthBtn
}