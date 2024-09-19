//React Native tarafında yazılması gerekiyor sanırım
class WorkingHoursDto {
  constructor(
    sundayStart,
    sundayEnd,
    mondayStart,
    mondayEnd,
    tuesdayStart,
    tuesdayEnd,
    wednesdayStart,
    wednesdayEnd,
    thursdayStart,
    thursdayEnd,
    fridayStart,
    fridayEnd,
    saturdayStart,
    saturdayEnd,
    isWorkingOnSunday,
    isWorkingOnMonday,
    isWorkingOnTuesday,
    isWorkingOnWednesday,
    isWorkingOnThursday,
    isWorkingOnFriday,
    isWorkingOnSaturday
  ) {
    this.sundayStart = sundayStart;
    this.sundayEnd = sundayEnd;
    this.mondayStart = mondayStart;
    this.mondayEnd = mondayEnd;
    this.tuesdayStart = tuesdayStart;
    this.tuesdayEnd = tuesdayEnd;
    this.wednesdayStart = wednesdayStart;
    this.wednesdayEnd = wednesdayEnd;
    this.thursdayStart = thursdayStart;
    this.thursdayEnd = thursdayEnd;
    this.fridayStart = fridayStart;
    this.fridayEnd = fridayEnd;
    this.saturdayStart = saturdayStart;
    this.saturdayEnd = saturdayEnd;
    this.isWorkingOnSunday = isWorkingOnSunday;
    this.isWorkingOnMonday = isWorkingOnMonday;
    this.isWorkingOnTuesday = isWorkingOnTuesday;
    this.isWorkingOnWednesday = isWorkingOnWednesday;
    this.isWorkingOnThursday = isWorkingOnThursday;
    this.isWorkingOnFriday = isWorkingOnFriday;
    this.isWorkingOnSaturday = isWorkingOnSaturday;
  }
}

module.exports = WorkingHoursDto;
