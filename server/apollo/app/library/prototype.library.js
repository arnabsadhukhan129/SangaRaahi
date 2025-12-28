String.prototype.isJsonParsable = function () {
    try {
        JSON.parse(this.valueOf());
        return true;
    } catch (e) {
        return false;
    }
};
/**
 * Modify the date based on the argument
 * @param {string} numstr 
 * @returns The modified date.
 */
Date.prototype.modifyAKADate = function (numstr) {
    const date = new Date(this.valueOf());
    if (typeof numstr === 'undefined' || numstr === '' || numstr.length === 0) return date;
    let operator = numstr.trim();
    operator = operator.substring(0, 1);
    numstr = numstr.replace(operator, "");
    let num = parseInt(numstr.replace(/\D+$/g, ""));
    if (isNaN(num)) {
        return date;
    }
    let str = numstr.replace(/[0-9]/g, '');
    str = str.trim();
    switch (str.toLowerCase()) {
        case 'days':
        case 'day':
        case 'd':
            if (operator === '+') {
                date.setDate(date.getDate() + num);
            } else if (operator === "-") {
                date.setDate(date.getDate() - num);
            }
            break;
        case 'months':
        case 'month':
        case 'm':
            if (operator === '+') {
                date.setMonth(date.getMonth() + num);
            } else if (operator === "-") {
                date.setMonth(date.getMonth() - num);
            }
            break;
        case "years":
        case "year":
        case 'y':
            if (operator === '+') {
                date.setFullYear(date.getFullYear() + num);
            } else if (operator === "-") {
                date.setFullYear(date.getFullYear() - num);
            }
            break;
        case "hours":
        case "hour":
        case 'h':
            if (operator === '+') {
                date.setHours(date.getHours() + num);
            } else if (operator === "-") {
                date.setHours(date.getHours() - num);
            }
            break;
        case "minutes":
        case "mintue":
        case "min":
        case 'i':
            if (operator === '+') {
                date.setMinutes(date.getMinutes() + num);
            } else if (operator === "-") {
                date.setMinutes(date.getMinutes() - num);
            }
            break;
        case "seconds":
        case "second":
        case "sec":
        case 's':
            if (operator === '+') {
                date.setSeconds(date.getSeconds() + num);
            } else if (operator === "-") {
                date.setSeconds(date.getSeconds() - num);
            }
            break;
        default:
            return date;
    }

    return date;
};
/**
 * Convert the utc time of the calling date object to the offset.
 * And after the conversion changes the date object to present the time as local time instructed by the offset.
 * Example:- 
 * Client -> UTC
 * Client -> Saudi Arabia UTC + 3:00
 * offset = -180 // As the getTimezoneOffset return negative in the case of UTC + 
 * Client Time is 09:00
 * So suppose that the server is in Indian timezone
 * 9 * 60 = 540
 * UTC = 540 + -180;
 * UTC = 360
 * Hour = 360 / 60 = 6
 * So the time will be 06:00
 * @param {number} offset is the offset to wich the utc time to be converted.
 * @param {boolean} utc_local is use to convert the time from utc to local or vice versa
 */
Date.prototype.setUTCTimeZoneOffset = function (offset, utc_local = false) {
    if (typeof offset !== 'number') throw new Error("Offset is invalid. Required number found undefined");
    if (utc_local) {
        // UTC -> Local time based on offset
        offset *= -1;
        let millis = offset * 60 * 1000;
        let utc_hour_minutes = this.getUTCHours() * 60;
        let utc_minutes = this.getUTCMinutes();
        let new_minutes = (utc_hour_minutes + utc_minutes) + offset;
        let hour = parseInt(new_minutes / 60);
        let minute = new_minutes % 60;
        // For handling when the hour goes to the next day.
        // If we skip the line then it will consider the next next day.
        // Suppose that we have 2021-10-04 01:30 IST as time and 
        // hour = 25
        // so if we set hour directly without resetting it then 
        // 25 means 2021-10-04 01:30 + 25 = 2021-10-05 01:30
        // Because 25 - 24 = 1 hour, so we are basically setting 01 hour as hour to the date object with the date 2021-10-04
        // But because of extra 24 hours in 25 hours we are increasing one more day. Hence the result will be 2021-10-05
        if (this.getDate() !== this.getUTCDate())
            hour = hour > 24 ? hour - 24 : hour;

        // Checking if the time of the current object become less when adding the offset.
        // This means that the time has subtracted.
        // Hence make the hour as negative to just subtract the particular hours from the date object
        if (this.getTime() + millis < this.getTime()) {
            hour = hour - 24;
        }
        this.setHours(hour);
        this.setMinutes(minute);
        // console.log("In set utc get hour: ", this.getHours(), this.getMinutes(), this.getDate(), this.getMonth());
    } else {
        // Local to UTC based on Offset
        let local_hour = this.getHours();
        let local_minutes = this.getMinutes();
        let utc_hour_minutes = ((local_hour * 60) + local_minutes) + offset;
        let utc_hour = parseInt(utc_hour_minutes / 60);
        let utc_minutes = (utc_hour_minutes % 60);
        if (this.getDate() !== this.getUTCDate()) {
            if (utc_hour < 0) {
                utc_hour *= -1;
                utc_hour = 24 - utc_hour;
            } else if (utc_hour >= 0 && utc_hour <= 24) {
                // Date will be same
                this.setUTCDate(this.getDate());
            }
        }
        this.setUTCHours(utc_hour);
        this.setUTCMinutes(utc_minutes);
    }
    return this;
}
/**
 * Localize the date object based on the arguments passed.
 * This changes the date object itself.
 * The local hour and time and date will be cahnge to the offset time zone provided.
 * Which results in changing the UTC date also.
 * // This is only used for getting the dynamic local date time based on the timezone and offset provided from 
 * UTC date object.
 * @returns The date object
 */
Date.prototype.localization = function () {
    let a = arguments;
    if (a.length < 2) throw new Error("Arguments count missmatch.");
    if (typeof a[0] === 'undefined' || a[0] === null || typeof a[1] === 'undefined' || a[1] === null) throw new Error("Invalid arguments");
    if (isNaN(a[0]) && isNaN(a[1])) throw new Error("Offset is invalid");
    if (!isNaN(a[0]) && !isNaN(a[1])) throw new Error("Timezone is not provided");
    let timezone = isNaN(a[0]) ? a[0] : a[1];
    let client_offset = !isNaN(a[1]) ? a[1] : a[0];
    let cacheoffset = client_offset;
    client_offset *= -1;
    let hour = parseInt(client_offset / 60);
    let minutes = client_offset % 60;
    // We dont need to negatify the minutes
    if (minutes <= 0) {
        minutes = Math.abs(minutes);
    }
    let operator = hour < 0 ? "-" : "+";
    hour = hour.appendZero();
    minutes = minutes.appendZero();
    let timezoneoffsetstring = operator + hour + ":" + minutes;
    let localString = this.toLocaleString('en-IN',
        {
            timeZone: timezone, hour12: false,
            dateStyle: 'long', timeStyle: 'medium'
        });
    let date_split = localString.split(",");
    date_split = date_split.map(d => d.trim());
    // The offset hour will come from the offset
    localString = date_split.join(" ") + " GMT" + timezoneoffsetstring;
    // Setting the date time object to the specified local time object.
    // but even though we are doing this the current date object is not getting changed.
    // We are calling the next setUTCTimeZoneOffset function for changing the date object to represent the local time 
    // As of timezone and offset.
    return this.setUTCTimeZoneOffset(cacheoffset, true);
}
/**
 * Returns the date and time and weekday from the UTC date object based on the 
 * Timezone and offset specified.
 * @returns The object with date and weekday details
 */
Date.prototype.localizationZ = function () {
    let a = arguments;
    // We are expecting two arguments to be provided. timezone, offset
    // May increase in future.
    if (a.length < 2) throw new Error("Arguments count missmatch.");
    if (typeof a[0] === 'undefined' || a[0] === null || typeof a[1] === 'undefined' || a[1] === null) throw new Error("Invalid arguments");
    // Offset should be integer
    if (isNaN(a[0]) && isNaN(a[1])) throw new Error("Offset is invalid");
    // Tmezone should be string
    if (!isNaN(a[0]) && !isNaN(a[1])) throw new Error("Timezone is not provided");
    // Here we are checking and assigning the value to the specific variable.
    // Because this function can take number of arguments and can be passed in any order.
    // Getting the timezone
    let timezone = isNaN(a[0]) ? a[0] : a[1];
    // Getting the offset
    let client_offset = !isNaN(a[1]) ? a[1] : a[0];
    // Swapping the negative to positive and positive to negative.
    // As because most offset are coming as 
    // How much minutes can we subtract from the local time to get the UTC.
    // And how much minutes can we add to the local time to get the UTC.
    client_offset *= -1;
    // Getting the difference of hour & minutes
    let hour = parseInt(client_offset / 60);
    let minutes = client_offset % 60;
    // We dont need to negatify the minutes
    if (minutes <= 0) {
        minutes = Math.abs(minutes);
    }
    let operator = hour < 0 ? "-" : "+";
    hour = hour.appendZero();
    minutes = minutes.appendZero();
    // Example:- For India it should be +05:00
    let timezoneoffsetstring = operator + hour + ":" + minutes;
    let _this = new Date(this.valueOf());
    let localString = _this.toLocaleDateString('en-US',
        {
            timeZone: timezone,
            year: 'numeric', month: 'numeric', day: 'numeric'
        });
    let weekday = _this.toLocaleString('en-IN',
        {
            timeZone: timezone, hour12: false, weekday: 'short'
        });
    let weekday_long = _this.toLocaleString('en-IN',
        {
            timeZone: timezone, hour12: false, weekday: 'long'
        });
    // From 28/09/2021 To 2021-09-28
    let datesplit = localString.split("/");
    let __date_str = datesplit[2] + "-" + (datesplit[0] < 10 ? "0" + datesplit[0] : datesplit[0]) + "-" + (datesplit[1] < 10 ? "0" + datesplit[1] : datesplit[1]);
    // let __date_str = localString.split("/").map(dstr => parseInt(dstr) < 10 ? "0" + dstr : dstr).reverse().join("-");
    let __time_str = _this.toLocaleString('en-IN',
        {
            timeZone: timezone, hour12: false, timeStyle: "short"
        });
    // For converting 24 to 00
    __time_str = __time_str.split(":")[0] === "24" ? "00:" + __time_str.split(":")[1] : __time_str;
    // date_split[0] =  __date_str;
    // The offset hour will come from the offset
    let localizestringfull = __date_str + " " + __time_str + " GMT" + timezoneoffsetstring;

    return {
        weekday: {
            short: weekday,
            long: weekday_long
        },
        date: {
            date: __date_str,
            time: __time_str,
            full: localizestringfull,
            timeZoneDiff: "GMT" + timezoneoffsetstring
        }
    };
}
Array.prototype.removeItem = function () {
    var what, a = arguments,
        L = a.length,
        ax;
    while (L && this.length) {
        what = a[--L];
        while (((ax = this.indexOf(what)) !== -1) || ((ax = this.indexOf(what.toString())) !== -1)) {
            this.splice(ax, 1);
        }
    }
    return this;
};
Number.prototype.appendZero = function (positify = false) {
    if (this.valueOf() < 10) {
        let number = this.valueOf();
        if (number < 0) {
            number = Math.abs(number);
            return "0" + number;
        }
        return "0" + this.valueOf();
    }
    return this.valueOf();
}
Date.prototype.getFirstDate = function() {
    let date = new Date(this.valueOf());
    let day = date.getDate();
    if(day > 1) {
        date = date.modifyAKADate(`-${day - 1}d`)
    }
    return date;
}
Date.prototype.getLastDate = function() {
    let date = new Date(this.valueOf());
    return  new Date(date.getFullYear(), date.getMonth() + 1, 0, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}
// module.exports = jsonParsable;