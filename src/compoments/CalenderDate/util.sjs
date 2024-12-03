function dateActiveIndex(emitTimer,dates,selectedDate) {
  return emitTimer === null ? dates.map(item => item.dateFormat).indexOf(selectedDate) : -1
}

function getAssignDateInfo(selectedDate, index) {
  // return selectedDate
  return selectedDate.split('-')[index] * 1
}

function showBackToTodayBtn(selectedDate, today) {
  return getAssignDateInfo(selectedDate, 0) !== getAssignDateInfo(today, 0) || getAssignDateInfo(selectedDate, 1) !== getAssignDateInfo(today, 1)
}

export default {
  dateActiveIndex,
  getAssignDateInfo,
  showBackToTodayBtn
};