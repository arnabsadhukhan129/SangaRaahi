const config = require("../config");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const i18n = require("i18n");
const striptags = require('striptags')
const httpError = require('../errors/httperrorcode');
const GeneralApiError = require('../errors/general-api.error');
const MODULES = { fs, path, appConfig: config["AppConfig"], i18n, jwt };
let shortUrl = require("node-url-shortener");
/**
 * Some basic protyping added
 */
require("./prototype.library");
/**
 * Requiring the global file here, as that library file is required in all other file.
 */
module.exports = {
  isDevEnv: function () {
    return this.ENV("NODE_ENV", "development") === "development";
  },
  isStagingEnv: function () {
    return this.ENV("NODE_ENV", "development") === "staging";
  },
  isProdEnv: function () {
    return this.ENV("NODE_ENV", "development") === "production";
  },
  isForceNormalConnection: function () {
    return this.ENV("FORCE_NORMAL_DB_CONNECTION") === "true";
  },
  getI18n: () => {
    return i18n;
  },
  getLocale: function (req) {
    return this.getI18n().getLocale(req).toLowerCase();
  },
  setLocale: function (localestring) {
    this.getI18n().setLocale(localestring);
  },
  translate: function (key, extraArgs = undefined) {
    return this.getI18n().__(key, extraArgs);
  },
  getModules: function (str) {
    return MODULES[str] ? MODULES[str] : require(str);
  },
  getConfig: function (config) {
    return config[`${this.toTitleCase(config)}Config`];
  },
  getAppConfig: function (key, defaultValue = "") {
    const appConfig = config.AppConfig;
    const splitter = key.split(".");
    let appConfigValue = this.cloneObject(appConfig);
    splitter.forEach(key => {
      appConfigValue = appConfigValue[key];
    });
    return appConfigValue || defaultValue;
  },
  getEnum: function (enumName) {
    const EnumConfig = config.EnumConfig;
    const splitter = enumName.split(".");
    let enumValue = this.cloneObject(EnumConfig);
    splitter.forEach(key => {
        enumValue = enumValue[key];
    });
    return enumValue;
  },
  ENV: function (key, defaultvalue = "") {
    return process.env[key] || defaultvalue;
  },
  Model: function (modelName) {
    const Models = require("../models/index");
    const M = Models[modelName];
    if (!M) throw new Error("No model exist");
    return M;
  },
  shouldExcludeAuth: function (fieldName) {
    return this.getAppConfig("EXCEPT_AUTH_REQUEST", []).includes(fieldName);
  },
  shouldExcludeAuthLogin: function(fieldName) {
      return this.getAppConfig('EXCEPT_AUTH_LOGIN_CHECK', []).includes(fieldName);
  },
  stripTags: function(html) {
    return striptags(html);
  },
  /**
   *
   * @param {string} text
   * @param {string} fromlang
   * @param {string} tolang
   * @returns
   */
  // _translate: async (text, fromlang, tolang) => {
  //     if(!fromlang || !tolang) return text;
  //     return await translate(text, {from:fromlang, to:tolang});
  // },
  /**
   * Remove the key value pair from the object provided as key.
   * @param {any} object The object that needs to be filter.
   * @param {Array<string> | string} keys The key to remove from the object.
   * @returns {object} The filtered object.
   */
  omitKeysFromObject: (object, keys) => {
    if (typeof object != "object") return {};
    if (typeof keys === "undefined" || keys == null || keys === "") {
      if (typeof object == "object") return object;
      else return {};
    }
    if (typeof keys === "string") {
      let { [keys]: remoovekey, ...returnObject } = object;
      return returnObject;
    } else {
      keys.map((k) => {
        let { [k]: removekey, ...restobjects } = object;
        object = restobjects;
      });
      return object;
    }
  },
  /**
   *
   * @param token
   * @param secret_key
   * @returns {Promise<any>}
   */
  getObjectFromJWT: function (token, secret_key = null) {
    return new Promise((resolve, reject) => {
      if (!token) reject("No token provided");
      let decryptedToken = this.decrypt(token);
      if (decryptedToken === "") {
        decryptedToken = token;
      }
      secret_key = secret_key
        ? secret_key
        : process.env.ACCESS_TOKEN_SECRET_KEY;
      jwt.verify(decryptedToken, secret_key, (err, object) => {
        if (err) {
          reject(err);
        }
        resolve(object);
      });
    });
  },
  getDataFromJWT: function (token, secret_key = null) {
    if (!token) {
      return {error:true,message:"No token provided"}
    };
    let decryptedToken = this.decrypt(token);
    if (decryptedToken === "") {
      decryptedToken = token;
    }
    secret_key = secret_key
      ? secret_key
      : process.env.ACCESS_TOKEN_SECRET_KEY;
    let response = jwt.verify(decryptedToken, secret_key);
    return response;
  },
  getBearerToken: function (req) {
    let authHeader = req.headers["authorization"];
    let bearer_arr = authHeader && authHeader.split(" ");
    if (typeof bearer_arr === "undefined" || bearer_arr.length <= 1) {
      return "";
    }
    if (bearer_arr[0] !== "Bearer") {
      return "";
    }
    return bearer_arr[1].replace(/"/g, "");
  },
  generateRandomNumber: (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
  },
  /**
   * Find weather the variable is empty or not.
   * @param {any} obj is the variable to check for value
   * @returns boolean
   */
  isEmpty: (obj) => {
    //Space check in string
    if(typeof obj === "string") {
      if(obj.trim() === "") {
        return true;
      }
    }
    // For case when an invalid length value is provided
    if (typeof obj === "undefined" || obj === null) {
      return true;
    }
    // If an object passed. Then check if the object has any keys
    if (typeof obj === "object" && !Array.isArray(obj)) {
      return Object.keys(obj).length === 0;
    } else {
      if (Array.isArray(obj)) {
        return obj.length === 0;
      }
      // Else for incase not array passed then convert it to string
      // And found the length; This consider 0 for non-empty
      // As 0 is also a value.
      if (!Array.isArray(obj)) obj += "";
      return obj.length === 0;
    }
  },
  isHTTPLink: function (dataLink) {
    // this.log(dataLink + " " + (dataLink.substr(0, 4)).toLowerCase(), "HTTPTEST001");
    return dataLink.substr(0, 4).toLowerCase() === "http";
  },
  /**
   * Get the size specified by faction from bytes
   * @param {number} bytes The bytes
   * @param {string} faction The unit in which the data needs to be returned. Supported:- bytes, kb, mb, gb
   * @returns the converted size of the faction. Default is in KB
   */
  getSize: (bytes, faction = "kb") => {
    faction = faction.toLowerCase();
    switch (faction) {
      case "bytes":
      case "b":
        return bytes;
      case "kb":
      case "kilobytes":
        return bytes / 1024;
      case "mb":
      case "megabytes":
        return bytes / 1024 / 1024;
      case "gb":
      case "gigabytes":
        return bytes / 1024 / 1024 / 1024;
      default:
        return 0;
    }
  },
  getSizeFormatted: function (size, format = "BYTES") {
    format = format.toUpperCase();
    if (size < 1024) return { size: this.roundUp(size), format: format };
    let size_chat = ["BYTES", "KB", "MB", "GB", "TB"];
    let index = size_chat.indexOf(format);
    if (index >= size_chat.length)
      return { size: this.roundUp(size), format: format };
    let s = size / 1024;
    return this.getSizeFormatted(s, size_chat[index + 1]);
  },
  /**
   * Check to see if the string is parsable as JSON format or not.
   * @param {string} str
   * @returns boolean
   */
  isJsonParsable: function (str) {
    try {
      if (typeof str !== "string") throw new Error("String required");
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  },
  array_column: function (arrayheystack, col) {
    if (typeof arrayheystack === "undefined" || !arrayheystack) return [];
    return arrayheystack.map((x) => {
      if (typeof x == "string" && this.isJsonParsable(x)) {
        x = JSON.parse(x);
      }
      return x[col];
    });
  },
  /**
   * Returns the unique elements from array1 that is not present in array 2.
   * @param {array} array1
   * @param {array} array2
   * @returns
   */
  distinctArray: (array1, array2) => {
    return array1.filter((a) => array2.indexOf(a) < 0);
  },
  returnDuplicate: (array1, array2) => {
    return array1.filter((a) => array2.indexOf(a) >= 0);
  },
  cloneObject: (objectheystack) => {
    if (typeof objectheystack !== "object")
      throw new Error(
        "Object or array required. Found: " + typeof objectheystack
      );
    return JSON.parse(JSON.stringify(objectheystack));
  },
  // Collected
  encrypt: function (rawdata) {
    if (!rawdata) return "";
    try {
      const cipher = crypto.createCipheriv(
        process.env.CRYPTO_ENC_ALGO,
        process.env.SECRET_KEY,
        process.env.INIT_VECTOR
      );
      let encryptedData = cipher.update(rawdata, "utf-8", "hex");
      encryptedData += cipher.final("hex");
      return encryptedData;
    } catch (e) {
      console.log(e);
      return "";
    }
  },
  decrypt: function (encryptdata) {
    if (!encryptdata) return "";
    try {
      const cipher = crypto.createDecipheriv(
        process.env.CRYPTO_ENC_ALGO,
        process.env.SECRET_KEY,
        process.env.INIT_VECTOR
      );
      let decryptedData = cipher.update(encryptdata, "hex", "utf-8");
      decryptedData += cipher.final("utf-8");
      return decryptedData;
    } catch (e) {
      this.log(e.stack, "DECRYPT001");
      return "";
    }
  },
  isEqual: function (arr1, arr2, includeDuplicate = false) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
    if (!includeDuplicate && arr1.length !== arr2.length) return false;
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    return (
      arr1.every((item) => set2.has(item)) &&
      arr2.every((item) => set1.has(item))
    );
  },
  doNumberToCountUnit: (number) => {
    number = parseFloat(number);
    let SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];
    // what tier? (determines SI symbol)
    let tier = (Math.log10(Math.abs(number)) / 3) | 0;

    // if zero, we don't need a suffix
    if (tier === 0) return number;

    // get suffix and determine scale
    let suffix = SI_SYMBOL[tier];
    let scale = Math.pow(10, tier * 3);

    // scale the number
    let scaled = number / scale;

    // format number and add suffix
    return scaled.toFixed(1) + suffix;
  },
  generateRandomCode: (length = 6) => {
    let chars =
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var result = "";
    for (var i = length; i > 0; --i)
      result += chars[Math.floor(Math.random() * chars.length)];
    return result.toUpperCase();
  },
  isValidUrl: (url) => {
    // Base 64 check
    let first_stack = url.split(";");
    if (first_stack.length > 1) {
      // Stack has semicolor which is not normal for URL
      return false;
    }
    let regex = new RegExp(
      "(https?:\\/\\/)?((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|((\\d{1,3}\\.){3}\\d{1,3}))(\\:\\d+)?(\\/[-a-z\\d%_.~+@]*)*(\\?[;&a-z\\d%_.~+=-@]*)?(\\#[-a-z\\d_@]*)?$",
      "i"
    );
    if (regex.test(url)) {
      try {
        let _url = new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  },
  generateAccessToken: function (user, otptoken = true, expiresIn = null) {
    const option = expiresIn
      ? { expiresIn: expiresIn }
      : otptoken
      ? { expiresIn: "10m" }
      : {};
    return this.encrypt(
      otptoken
        ? jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, option)
        : jwt.sign(user, process.env.ACCESS_TOKEN_SECRET_KEY, option)
    );
  },
  generateRefreshToken: function (user, otp = true, expiresIn = null) {
    const key = otp ? "otp_refresh_token" : "login-auth";
    const option = expiresIn ? { expiresIn: expiresIn } : {};
    let token = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET_KEY, option);
    // console.log("TOKEN GENERATED REFRESH");
    /*redis.get(key, (err, reply) => {
            if (err) {
                redis.set(key, JSON.stringify({ [user._id]: token }));
                reply[user._id] = token;
                redis.set(key, JSON.parse(reply));
                return;
            }
            // console.log("Has some values", reply);
            if (reply) {
                reply = JSON.parse(reply);
            } else {
                reply = {};
            }
            reply[user._id] = token;
            redis.set(key, JSON.stringify(reply));
        });*/
    return this.encrypt(token);
  },
  generateAccessFromRefresh: function (token, otp = true) {
    return new Promise((resolve, reject) => {
      const key = otp ? "otp_refresh_token" : "login-auth";
      if (!token) return reject("No Token");
      token = this.decrypt(token);
      let user = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET_KEY);
      if (!user) return reject("No Data");
      const { exp, iat, ...restuser } = user;
      const accessToken = this.generateAccessToken(restuser);
      resolve({
        user,
        accessToken,
      });
    });

    /*try {
            /*redis.get(key, (err, reply) => {
                if (err) throw err;
                if (!reply) throw new Error("No reply data, GENERATEACCESSFROMREFRESH003");
                try {
                    reply = JSON.parse(reply);
                    console.log(reply[user.id]);
                    if (!reply[user.id] || reply[user.id] !== token) throw new Error("No reply data, GENERATEACCESSFROMREFRESH004");
                    // All OK
                    // Generate the access token
                    const { exp, iat, ...restuser } = user;
                    const accessToken = this.encrypt(this.generateAccessToken(restuser));
                    if (typeof payload === 'function') payload(null, user, accessToken);
                } catch (e) {
                    payload(e, null, null);
                }
            });
        } catch (e) {
            console.log("Error from redis");
        }*/
  },
  generateOtpToken: (otp, cause, extra) => {
    let payload = {
      otp: otp,
      cause: cause,
    };
    if (extra) {
      payload.extra = extra;
    }
    return jwt.sign(payload, process.env.GENERAL_SECRET_KEY, {
      expiresIn: "5m",
    });
  },
  log: function (message, code = "") {
    try {
      if (code)
        message =
          new Date().toISOString() + " - [" + code + "] " + message + "\n\n";
      else
        message = new Date().toISOString() + " - [UNKNOWN] " + message + "\n\n";
      fs.appendFile(config.LOG_FILE, message, (err) => {
        if (err) console.log("File err: ", err);
      });
    } catch (e) {}
  },
  getNameFromFileUrl: function (file_url) {
    if (!file_url) return "";
    if (this.isHTTPLink(file_url)) return file_url.split("/").pop();
    return file_url;
  },
  errorJson: function (res, data) {
    if (!data.data) data.data = [];
    return res.status(data.status).json(data);
  },
  createResMessage: function (message, dataobject) {
    if (!message) throw new Error("Message needed.");
    if (typeof dataobject !== "object" || this.isEmpty(dataobject))
      return message;
    Object.keys(dataobject).map((key) => {
      let regex = new RegExp(`##${key}##`, "g");
      message = message.replace(regex, dataobject[key]);
    });
    return message;
  },
  isSocketIO: function (socket) {
    return !!(
      socket &&
      (typeof socket.join === "function" || socket.rooms || socket.handshake)
    );
  },
  escapeRegExp: function (text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  },
  matchLike: function (text, match_with) {
    return new RegExp(".*" + this.escapeRegExp(text.trim()) + ".*", "i").test(
      match_with
    );
  },
  roundUp: function (number) {
    return Math.round((number + Number.EPSILON) * 100) / 100;
  },
  stringalizeDays: function (days) {
    if (!days || isNaN(days))
      throw new Error("Days should be number. Found " + typeof days);
    days = Number(days);
    if (days < 30)
      return this.getI18n().__("subscriptionValidityDays", { day: days });
    let month = parseInt(days / 30);
    let rdays = days % 30;
    if (month < 12) {
      return this.getI18n().__("subscriptionValidityMonthDays", {
        day: rdays,
        month: month,
      });
    }
    let year = parseInt(month / 12);
    month = month % 12;
    return this.getI18n().__("subscriptionValidityYearMonthDays", {
      day: rdays,
      month: month,
      year: year,
    });
  },
  stringalizeDaysFullText: function (days) {
    if (!days || isNaN(days))
      throw new Error("Days should be number. Found " + typeof days);
    days = Number(days);
    if (days < 30)
      return this.getI18n().__("subscriptionValidityDaysFullText", {
        day: days,
      });
    let month = parseInt(days / 30);
    let rdays = days % 30;
    if (month < 12) {
      return this.getI18n().__("subscriptionValidityMonthDaysFullText", {
        day: rdays,
        month: month,
      });
    }
    let year = parseInt(month / 12);
    month = month % 12;
    return this.getI18n().__("subscriptionValidityYearMonthDaysFullText", {
      day: rdays,
      month: month,
      year: year,
    });
  },
  initPagination: function () {
    return {
      currentPage: 0,
      lastPage: 0,
      perPage: 0,
      total: 0,
    };
  },
  getPaginationInfo: function(total, page, limit) {
    const pagination = this.initPagination();
    pagination.currentPage = page;
    pagination.total = total;
    pagination.perPage = limit;
    pagination.lastPage = 1;
    if(total) {
      pagination.lastPage = parseInt(total / limit);
      if (total % limit !== 0) pagination.lastPage++;
    }
    return pagination;
  },
  extractContentType: function (extension) {
    switch (extension.toLowerCase()) {
      case "pdf":
        return `application/${extension}`;
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
        return `image/${extension}`;
      case "svg":
      case "svg+xml":
        return "image/svg+xml";
      case "xml":
        return "application/xml";
      default:
        return null;
    }
  },
  extractExtension: function (contentType) {
    if (!contentType) return null;
    contentType = contentType.toLowerCase();
    let slitted_sir = contentType.split("/");
    return slitted_sir.length > 1 ? slitted_sir[1] : slitted_sir[0];
  },
  getDialCode: function (dial_code) {
    if (!dial_code) return "";
    if (dial_code.substr(0, 1) === "-") return dial_code;
    return "+" + dial_code;
  },
  isEmail: (email) => {
    let regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
  },

  getKeyNameFromFile: function (key, separator = ".") {
    let keyArr = key.split(separator);
    // Remove the js extension
    if (separator === ".") keyArr.pop();
    if (keyArr.length === 1) return this.toTitleCase(keyArr[0]);
    return keyArr
      .map((k) => {
        return this.getKeyNameFromFile(k, "-");
      })
      .join("");
  },
  /**
   *
   * @param {string} stringData data to convert
   * @param {string} separatorIfAny is the words separated by any separator. If not provided then the stringData will be converted as it is with just the first letter being uppercase, and the rest of the letter being lowercase
   * @param {boolean} shouldJoin flag for whether to return the string as join string. Default is true. Returns the whole string in a single string. If false then returns the sentence containing each word separated by space
   * @param {string} optionalJoiner contains the separator for to separate each string word in returned string. Default is empty. This applies only if the shouldJoin is true.
   */
  toTitleCase: function (stringData, separatorIfAny="", shouldJoin=true, optionalJoiner="") {
    if(!stringData) return stringData;
    const toTitle = function (str) {
      return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    };
    if(separatorIfAny) {
      const _splitterConvert = stringData.split(separatorIfAny).map(s => toTitle(s));
      if(shouldJoin) return _splitterConvert.join(optionalJoiner || "");
      return _splitterConvert.join(" ");
    }
    return toTitle(stringData);
  },
  toTitleCaseForResponse: function (stringData) {
    if(!stringData) return stringData;
    const toTitle = function (str) {
      return str.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    };
      const _splitterConvert = stringData.split("_").map(s => toTitle(s));
      return _splitterConvert.join(" ");
  },
  toBoolean: function (data) {
    return !!data;
  },
  generalizeUser: function (user) {
    if (Array.isArray(user)) {
      return user.map((u) => {
        u.email = u.contact && u.contact.email ? u.contact.email.address : "";
        u.is_email_verified =
          u.contact && u.contact.email
            ? this.toBoolean(u.contact.email.is_verified)
            : false;
        u.phone = u.contact && u.contact.phone ? u.contact.phone.number : "";
        u.is_phone_verified =
          u.contact && u.contact.phone
            ? this.toBoolean(u.contact.phone.is_verified)
            : false;
        u.phone_code = u.contact && u.contact.phone ? u.contact.phone.phone_code : "";
        u.country_code = u.contact && u.contact.phone ? u.contact.phone.country_code : "";
        
        u.secondary_phone = u.contact && u.contact.secondary_phone ? u.contact.secondary_phone.number : "";
        u.is_secondary_phone_verified =
          u.contact && u.contact.secondary_phone
            ? this.toBoolean(u.contact.secondary_phone.is_verified)
            : false;
        u.secondary_phone_code = u.contact && u.contact.secondary_phone ? u.contact.secondary_phone.phone_code : "";
        u.secondary_country_code = u.contact && u.contact.secondary_phone ? u.contact.secondary_phone.country_code : "";

        u.address = u.contact ? u.contact.address : "";
        u.firstAddressLine = u.contact && u.contact.first_address_line ? u.contact.first_address_line : "";
        u.secondAddressLine = u.contact && u.contact.second_address_line ? u.contact.second_address_line : "";
        u.city = u.contact ? u.contact.city : "";
        u.country = u.contact ? u.contact.country : "";
        u.zipcode = u.contact ? u.contact.zipcode : "";
        u.latitude = u.contact ? u.contact.latitude : null;
        u.longitude = u.contact ? u.contact.longitude : null;
        delete u.contact;
        return this.reconstructObjectKeys(u);
      });
    } else if (typeof user === "object") {
      let u = user;
      u.email = u.contact && u.contact.email ? u.contact.email.address : "";
      u.is_email_verified =
        u.contact && u.contact.email
          ? this.toBoolean(u.contact.email.is_verified)
          : false;
      u.phone = u.contact && u.contact.phone ? u.contact.phone.number : "";
      u.is_phone_verified =
        u.contact && u.contact.phone
          ? this.toBoolean(u.contact.phone.is_verified)
          : false;
      u.phone_code =
        u.contact && u.contact.phone ? u.contact.phone.phone_code : "";
      u.country_code =
        u.contact && u.contact.phone ? u.contact.phone.country_code : "";

      u.secondary_phone = u.contact && u.contact.secondary_phone ? u.contact.secondary_phone.number : "";
      u.is_secondary_phone_verified =
        u.contact && u.contact.secondary_phone
          ? this.toBoolean(u.contact.secondary_phone.is_verified)
          : false;
      u.secondary_phone_code = u.contact && u.contact.secondary_phone ? u.contact.secondary_phone.phone_code : "";
      u.secondary_country_code = u.contact && u.contact.secondary_phone ? u.contact.secondary_phone.country_code : "";

      u.address = u.contact ? u.contact.address : "";
      u.firstAddressLine = u.contact && u.contact.first_address_line ? u.contact.first_address_line : "";
      u.secondAddressLine = u.contact && u.contact.second_address_line ? u.contact.second_address_line : "";
      u.state = u.contact && u.contact.state ? u.contact.state : "";
      u.city = u.contact ? u.contact.city : "";
      u.country = u.contact ? u.contact.country : "";
      u.zipcode = u.contact ? u.contact.zipcode : "";
      u.latitude = u.contact ? u.contact.latitude : null;
      u.longitude = u.contact ? u.contact.longitude : null;
      delete u.contact;
      return this.reconstructObjectKeys(u);
    }
    return user;
  },
  convertToLocalTime: function(date,offset) {
    return new Date(date.getTime() - (offset * 60 * 1000))
  },
  convertToUtcTime: function(date,offset) {
    return new Date(date.getTime() + (offset * 60 * 1000))
  },
    convertDate: function(date) {
        return new Date(Date.parse(date)).toLocaleDateString('en-us', { weekday:"long", year:"numeric", month:"short", day:"numeric"});
    },
    convertIsoDate: function(date) {
      if(typeof date === "object") {
        return new Date(date).toISOString();
      }
    },
    /**
     *
     * @param {Array<object>|object} payload
     * @param _keyName
     * @param operation
     */
     reconstructObjectKeys: function(payload, _keyName="", operation) {
        if(typeof payload !== 'object') throw new Error("Payload must be an array of objects or simple object. Found: " + (typeof payload));
        function convertToCamelCase(p) {
          if(!p){
            return p;
          }
          if(p && p.constructor && ['EmbeddedDocument','model'].includes(p.constructor.name )){
            p = p.toJSON();
          }
            Object.keys(p).forEach(k => {
                if(k !== "_id") {
                    const keyName = k.split("_").map((item, i) => {
                      if (i !== 0) return Lib.toTitleCase(item);
                      return item;
                    }).join("");
                    const value = p[k];
                    delete p[k];
                  if(_keyName && Array.isArray(_keyName) && _keyName.includes(k) && typeof operation === 'function') {
                    p[keyName] = operation(value, k);
                  } else if(_keyName === k && typeof operation === 'function') {
                    p[keyName] = operation(value, k);
                  } else {
                    let finalKey = isNaN(parseInt(keyName)) ? keyName : parseInt(keyName);
                    p[finalKey] = typeof value === 'object' ? convertToCamelCase(value) : value;
                  }
                } else if(k === "_id"){
                  let value = p[k];
                  delete p[k];
                  if(_keyName === "_id" || (Array.isArray(_keyName) && _keyName.includes("_id"))) {
                    value = operation(value, "_id");
                  }
                  p['id'] = value;
                } 
            });
            return p;
        }
        if(Array.isArray(payload)) {
            return payload.map(p => {
                return convertToCamelCase(p);
            });
        } else {
            return convertToCamelCase(payload);
        }
    },
    reconstructObjectKeysArray: function(payload, _keyName=[], operation) {
        if(typeof payload !== 'object') throw new Error("Payload must be an array of objects or simple object. Found: " + (typeof payload));
        function convertToCamelCase(p) {
          if(!p){
            return p;
          }
          if(p && p.constructor && ['EmbeddedDocument','model'].includes(p.constructor.name )){
            p = p.toJSON();
          }
            Object.keys(p).forEach(k => {
                if(k !== "_id") {
                    const keyName = k.split("_").map((item, i) => {
                        if (i !== 0) return Lib.toTitleCase(item);
                        return item;
                    }).join("");
                    const value = p[k];
                    delete p[k];
                    if(_keyName === k && typeof operation === 'function') {
                        if(value != null){
                            p[keyName] = operation(value);
                        }
                    } else {
                      let finalKey = isNaN(parseInt(keyName)) ? keyName : parseInt(keyName);
                      p[finalKey] = typeof value === 'object' ? convertToCamelCase(value) : value;
                    }
                } else if(k === "_id"){
                    const value = p[k];
                    delete p[k];
                    p['id'] = value;
                }
            });
            return p;
        }
        if(Array.isArray(payload)) {
            return payload.map(p => {
                return convertToCamelCase(p);
            });
        } else {
            return convertToCamelCase(payload);
        }
    },
    isLangKey: function(presumableKey) {
      const en = require('../languages/en.json');
      return Object.keys(en).includes(presumableKey);
    },
    resSuccess: function(...args) {
        let message;
        const response = {
            code:200,
            error:false,
            message:this.translate( "generalSuccess"),
            systemCode:"SUCCESS"
        }
        if(args.length === 0) {
            return response;
        }
        message = args[0] && typeof args[0] === 'string' ? args[0] : null;
        message = !message ? this.translate( "generalSuccess") : (!this.isLangKey(message) ? message : this.translate(message));
        const data = typeof args[0] === 'string' ? args[1] : args[0];
        return {
            code:200,
            error:false,
            message:message,
            systemCode:"SUCCESS",
            data:data
        };
    },
    distance(lat1, lon1, lat2, lon2) {
      let unit = "K";
      let radlat1 = Math.PI * lat1/180
      let radlat2 = Math.PI * lat2/180
      let theta = lon1-lon2
      let radtheta = Math.PI * theta/180
      let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
      if (dist > 1) {
        dist = 1;
      }
      dist = Math.acos(dist)
      dist = dist * 180/Math.PI
      dist = dist * 60 * 1.1515
      if (unit==="K") { dist = dist * 1.609344 }
      return dist
    },
  /**
   *
   * @param {string} errorStatus
   * @return {{
   *     statusCode: string,
   *     code: number
   * }}
   */
    getHttpErrors: function (errorStatus) {
      return httpError[errorStatus];
    },

    sendResponse: function({error, message, statusCode, data, ErrorClass, stack}) { 
      if (error) {
        if (ErrorClass) {
          if (statusCode) {
            throw new ErrorClass(message, statusCode, stack);
          } else {
            throw new ErrorClass(message, '', stack);
          }
        }
        if (statusCode) {
          throw new GeneralApiError(message, statusCode, stack);
        }
        throw new GeneralApiError(message, '', stack);
      } else {
        return this.resSuccess(message, data);
      }
    },
    
    objectLength: function(obj) {
      var result = 0;
      for(var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
        // or Object.prototype.hasOwnProperty.call(obj, prop)
          result++;
        }
      }
      return result;
    },

    containsNumbers: function(str) {
      return /\d/.test(str);
    },

    urlShortner: function(str) {
      return new Promise((resolve, reject) => {
        shortUrl.short(str, function (err, url) {
          if(err){
            reject(err)
          }
          resolve(url);
        });
      })
      
    },

    getPlayBackLink: function(link) {
      const myArray = link.split("/");
      let embedLink = '';
      let type = '';
      let linkToken = '';
      let isPlaylist = false;
      
      if(myArray[2] === 'www.youtube.com' || myArray[2] === 'youtu.be'|| myArray[2] === 'youtube.com') {
        let lastIndex = myArray.length - 1;
        linkToken =  myArray[lastIndex];
        
        // linkToken = linkToken.split("v=");
        // if(linkToken.length === 1) {
        //   isPlaylist = true;
        //   linkToken = linkToken[0].split("list=");
        // }
        // if(linkToken.length > 1) {
        //   linkToken = linkToken[1].split("&"); 
        // }

        linkToken = linkToken.split("?");
        if(linkToken[0] === 'playlist') {
          isPlaylist = true;
          linkToken = linkToken[1].split("list=");
          linkToken = linkToken[1].split("&");
          linkToken = linkToken[0];
        }else if(linkToken[0] === 'watch'){
          linkToken = linkToken[1].split("v=");
          linkToken = linkToken[1];
        }else{
          linkToken = linkToken[0];
        }
        
      
        linkToken = linkToken.replace("?", "");
        if(isPlaylist) {
          embedLink = 'https://www.youtube.com/embed/playlist?list='+linkToken;
        }else{
          embedLink = 'https://www.youtube.com/embed/'+linkToken;
        }
        type = 'Youtube';
      }else if (myArray[2] === 'vimeo.com' || myArray[2] === 'player.vimeo.com' ) {
        let lastIndex = myArray.length - 1;
        linkToken =  myArray[lastIndex];
        embedLink = 'https://player.vimeo.com/video/'+linkToken;
        type = 'Vimeo';
      }else {
        return { error:true, message: "Link should be the Youtube or a Vimeo link." }
      }
      
      return { error:false, type:type, link:embedLink, token: linkToken, isPlaylist };
    },

    convertDuration: function(duration) {
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      const seconds = parseInt(match[3]) || 0;
    
      const formattedDuration = [hours, minutes, seconds]
        .map(unit => unit.toString().padStart(2, '0'))
        .join(':');
    
      return formattedDuration;
    },

    stringCompare: function(string1,string2) {
      if(this.isEmpty(string1)) {
        return false;
      }
      const compareValue = string1.localeCompare(string2)
      if(compareValue === 0) {
        return true;
      }else {
        return false;
      }
    },
    isArray: function (myArray) {
      return myArray.constructor === Array;
    },
    
};
