function getAssignDateInfo(curDate,index) {
  return curDate.split('-')[index] * 1
}

function isSelected(weekInfo, weekIndex, weekActiveIndex, weekDateRange, emitTimer) {
  return weekActiveIndex === weekIndex && weekDateRange[0] === weekInfo.start && emitTimer === null
}

function showBackToWeekBtn(curDate) {
  return getAssignDateInfo(curDate, 0) != getDate().getFullYear() || getAssignDateInfo(curDate,1) !== getDate().getMonth() + 1
}

export default {
  getAssignDateInfo,
  isSelected,
  showBackToWeekBtn
};