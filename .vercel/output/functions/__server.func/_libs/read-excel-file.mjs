import { u as unzip, s as strFromU8 } from "./fflate.mjs";
const xml = {
  createDocument: function createDocument(content) {
    return new DOMParser().parseFromString(content.trim(), "text/xml");
  }
};
function unzipFromArrayBuffer(input, options) {
  return unzipFromArrayBufferUsingFunction(input, options, unzipAsync, true);
}
function unzipFromArrayBufferUsingFunction(input) {
  var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _filter = _ref.filter;
  var unzip2 = arguments.length > 2 ? arguments[2] : void 0;
  return unzip2(new Uint8Array(input), {
    // Ignore certain types of files.
    filter: function filter(file) {
      if (_filter) {
        return _filter({
          path: file.name
        });
      }
      return true;
    }
  });
}
function unzipAsync(archive) {
  return new Promise(function(resolve, reject) {
    unzip(archive, function(error, files) {
      if (error) {
        reject(error);
      } else {
        resolve(files);
      }
    });
  });
}
function convertValuesFromUint8ArraysToStrings(entries) {
  var convertedEntries = {};
  for (var _i = 0, _Object$keys = Object.keys(entries); _i < _Object$keys.length; _i++) {
    var key = _Object$keys[_i];
    convertedEntries[key] = strFromU8(entries[key]);
  }
  return convertedEntries;
}
function filterZipArchiveEntry(_ref) {
  var path = _ref.path;
  return path.endsWith(".xml") || path.endsWith(".xml.rels");
}
function unpackXlsxFile(input) {
  if (input instanceof File || input instanceof Blob) {
    return input.arrayBuffer().then(getResultFromArrayBuffer);
  }
  return Promise.resolve(input).then(getResultFromArrayBuffer);
}
function getResultFromArrayBuffer(arrayBuffer) {
  return unzipFromArrayBuffer(arrayBuffer, {
    filter: filterZipArchiveEntry
  }).then(convertValuesFromUint8ArraysToStrings);
}
function findChild(node, tagName) {
  var i = 0;
  while (i < node.childNodes.length) {
    var childNode = node.childNodes[i];
    if (childNode.nodeType === 1 && getTagName(childNode) === tagName) {
      return childNode;
    }
    i++;
  }
}
function findChildren(node, tagName) {
  var results = [];
  var i = 0;
  while (i < node.childNodes.length) {
    var childNode = node.childNodes[i];
    if (childNode.nodeType === 1 && getTagName(childNode) === tagName) {
      results.push(childNode);
    }
    i++;
  }
  return results;
}
function forEach(node, tagName, func) {
  var i = 0;
  while (i < node.childNodes.length) {
    var childNode = node.childNodes[i];
    if (tagName) {
      if (childNode.nodeType === 1 && getTagName(childNode) === tagName) {
        func(childNode, i);
      }
    } else {
      func(childNode, i);
    }
    i++;
  }
}
function map(node, tagName, func) {
  var results = [];
  forEach(node, tagName, function(node2, i) {
    results.push(func(node2, i));
  });
  return results;
}
var NAMESPACE_REG_EXP = /.+\:/;
function getTagName(element) {
  return element.tagName.replace(NAMESPACE_REG_EXP, "");
}
function isElement(node) {
  return node.nodeType === 1;
}
function getFirstElementChild(element) {
  var i = 0;
  while (i < element.childNodes.length) {
    if (isElement(element.childNodes[i])) {
      return element.childNodes[i];
    }
    i++;
  }
}
function getOuterXml(node) {
  if (node.nodeType !== 1) {
    return node.textContent;
  }
  var xml2 = "<" + getTagName(node);
  var j = 0;
  while (j < node.attributes.length) {
    xml2 += " " + node.attributes[j].name + '="' + node.attributes[j].value + '"';
    j++;
  }
  xml2 += ">";
  var i = 0;
  while (i < node.childNodes.length) {
    xml2 += getOuterXml(node.childNodes[i]);
    i++;
  }
  xml2 += "</" + getTagName(node) + ">";
  return xml2;
}
function getCellElements(document) {
  var worksheet = document.documentElement;
  var sheetData = findChild(worksheet, "sheetData");
  var cells = [];
  forEach(sheetData, "row", function(row) {
    forEach(row, "c", function(cell) {
      cells.push(cell);
    });
  });
  return cells;
}
function getCellValueElement(document, element) {
  return findChild(element, "v");
}
function getCellInlineStringValue(document, element) {
  var firstElementChild = getFirstElementChild(element);
  if (firstElementChild && getTagName(firstElementChild) === "is") {
    var firstElementChildFirstElementChild = getFirstElementChild(firstElementChild);
    if (firstElementChildFirstElementChild && getTagName(firstElementChildFirstElementChild) === "t") {
      return firstElementChildFirstElementChild.textContent;
    }
  }
}
function getDimensions(document) {
  var worksheet = document.documentElement;
  var dimensions = findChild(worksheet, "dimension");
  if (dimensions) {
    return dimensions.getAttribute("ref");
  }
}
function getBaseStyles(document) {
  var styleSheet = document.documentElement;
  var cellStyleXfs = findChild(styleSheet, "cellStyleXfs");
  if (cellStyleXfs) {
    return findChildren(cellStyleXfs, "xf");
  }
  return [];
}
function getCellStyles(document) {
  var styleSheet = document.documentElement;
  var cellXfs = findChild(styleSheet, "cellXfs");
  if (!cellXfs) {
    return [];
  }
  return findChildren(cellXfs, "xf");
}
function getNumberFormats(document) {
  var styleSheet = document.documentElement;
  var numFmts = findChild(styleSheet, "numFmts");
  if (numFmts) {
    return findChildren(numFmts, "numFmt");
  }
  return [];
}
function getSharedStrings(document) {
  var sst = document.documentElement;
  return map(sst, "si", function(string) {
    var t = findChild(string, "t");
    if (t) {
      return t.textContent;
    }
    var value = "";
    forEach(string, "r", function(r) {
      value += findChild(r, "t").textContent;
    });
    return value;
  });
}
function getWorkbookProperties(document) {
  var workbook = document.documentElement;
  return findChild(workbook, "workbookPr");
}
function getRelationships(document) {
  var relationships = document.documentElement;
  return findChildren(relationships, "Relationship");
}
function getSheets(document) {
  var workbook = document.documentElement;
  var sheets = findChild(workbook, "sheets");
  return findChildren(sheets, "sheet");
}
function _createForOfIteratorHelperLoose$5(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray$7(o)) || allowArrayLike) {
    if (it) o = it;
    var i = 0;
    return function() {
      if (i >= o.length) return { done: true };
      return { done: false, value: o[i++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$7(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray$7(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$7(o, minLen);
}
function _arrayLikeToArray$7(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function parseSpreadsheetInfo(content, xml2) {
  var book = xml2.createDocument(content);
  var workbookProperties = getWorkbookProperties(book);
  var epoch1904 = Boolean(workbookProperties) && workbookProperties.getAttribute("date1904") === "1";
  var sheets = [];
  for (var _iterator = _createForOfIteratorHelperLoose$5(getSheets(book)), _step; !(_step = _iterator()).done; ) {
    var sheet = _step.value;
    if (sheet.getAttribute("name")) {
      sheets.push({
        id: sheet.getAttribute("sheetId"),
        name: sheet.getAttribute("name"),
        relationId: sheet.getAttribute("r:id")
      });
    }
  }
  return {
    epoch1904,
    sheets
  };
}
function parseFilePaths(content, xml2) {
  var document = xml2.createDocument(content);
  var filePaths = {
    sheets: {},
    sharedStrings: void 0,
    styles: void 0
  };
  var addFilePathInfo = function addFilePathInfo2(relationship) {
    var filePath = relationship.getAttribute("Target");
    var fileType = relationship.getAttribute("Type");
    switch (fileType) {
      case "http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles":
        filePaths.styles = getFilePath(filePath);
        break;
      case "http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings":
        filePaths.sharedStrings = getFilePath(filePath);
        break;
      case "http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet":
        filePaths.sheets[relationship.getAttribute("Id")] = getFilePath(filePath);
        break;
    }
  };
  getRelationships(document).forEach(addFilePathInfo);
  return filePaths;
}
function getFilePath(path) {
  if (path[0] === "/") {
    return path.slice("/".length);
  }
  return "xl/" + path;
}
function _typeof$1(o) {
  "@babel/helpers - typeof";
  return _typeof$1 = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof$1(o);
}
function ownKeys$1(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread$1(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys$1(Object(t), true).forEach(function(r2) {
      _defineProperty$1(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys$1(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty$1(obj, key, value) {
  key = _toPropertyKey$1(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey$1(arg) {
  var key = _toPrimitive$1(arg, "string");
  return _typeof$1(key) === "symbol" ? key : String(key);
}
function _toPrimitive$1(input, hint) {
  if (_typeof$1(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint);
    if (_typeof$1(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function parseStyles(content, xml2) {
  if (!content) {
    return {};
  }
  var doc = xml2.createDocument(content);
  var baseStyles = getBaseStyles(doc).map(parseCellStyle);
  var numberFormats = getNumberFormats(doc).map(parseNumberFormatStyle).reduce(function(formats, format) {
    formats[format.id] = format;
    return formats;
  }, []);
  var getCellStyle = function getCellStyle2(xf) {
    if (xf.hasAttribute("xfId")) {
      return _objectSpread$1(_objectSpread$1({}, baseStyles[xf.xfId]), parseCellStyle(xf, numberFormats));
    }
    return parseCellStyle(xf, numberFormats);
  };
  return getCellStyles(doc).map(getCellStyle);
}
function parseNumberFormatStyle(numFmt) {
  return {
    id: numFmt.getAttribute("numFmtId"),
    template: numFmt.getAttribute("formatCode")
  };
}
function parseCellStyle(xf, numFmts) {
  var style = {};
  if (xf.hasAttribute("numFmtId")) {
    var numberFormatId = xf.getAttribute("numFmtId");
    if (numFmts[numberFormatId]) {
      style.numberFormat = numFmts[numberFormatId];
    } else {
      style.numberFormat = {
        id: numberFormatId
      };
    }
  }
  return style;
}
function parseSharedStrings(content, xml2) {
  if (!content) {
    return [];
  }
  return getSharedStrings(xml2.createDocument(content));
}
function parseExcelDate(excelSerialDate, options) {
  if (options && options.epoch1904) {
    excelSerialDate += (1904 - 1900) * DAYS_IN_YEAR + JANUARY_0TH_1900_DAY + ERRONEOUS_FEBRUARY_29_1990_DAY;
  }
  var daysBeforeUnixEpoch = JANUARY_0TH_1900_DAY + ERRONEOUS_FEBRUARY_29_1990_DAY + (1970 - 1900) * DAYS_IN_YEAR + NUMBER_OF_LEAP_YEARS_BETWEEN_1900_AND_1970;
  return new Date(Math.floor((excelSerialDate - daysBeforeUnixEpoch) * DAY));
}
var NUMBER_OF_LEAP_YEARS_BETWEEN_1900_AND_1970 = 17;
var JANUARY_0TH_1900_DAY = 1;
var ERRONEOUS_FEBRUARY_29_1990_DAY = 1;
var DAY = 24 * 60 * 60 * 1e3;
var DAYS_IN_YEAR = 365;
function _createForOfIteratorHelperLoose$4(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray$6(o)) || allowArrayLike) {
    if (it) o = it;
    var i = 0;
    return function() {
      if (i >= o.length) return { done: true };
      return { done: false, value: o[i++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$6(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray$6(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$6(o, minLen);
}
function _arrayLikeToArray$6(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
var DATE_FORMAT_SPECIFIC_LOCALE_PREFIX = /^\[\$-[^\]]+\]/;
var DATE_FORMAT_ALLOW_ANY_OTHER_TEXT_SUFFIX = /;@$/;
var CACHE = {};
function isDateFormatCached(template) {
  if (template in CACHE) {
    return CACHE[template];
  }
  var result = isDateFormat(template);
  CACHE[template] = result;
  return result;
}
function isDateFormat(template) {
  template = template.toLowerCase();
  template = template.replace(DATE_FORMAT_SPECIFIC_LOCALE_PREFIX, "");
  template = template.replace(DATE_FORMAT_ALLOW_ANY_OTHER_TEXT_SUFFIX, "");
  var tokens = template.split(/\W+/);
  if (tokens.length < 0) {
    return false;
  }
  for (var _iterator = _createForOfIteratorHelperLoose$4(tokens), _step; !(_step = _iterator()).done; ) {
    var token = _step.value;
    if (DATE_TEMPLATE_TOKENS.indexOf(token) < 0) {
      return false;
    }
  }
  return true;
}
var DATE_TEMPLATE_TOKENS = [
  // Seconds (min two digits). Example: "05".
  "ss",
  // Minutes (min two digits). Example: "05". Could also be "Months". Weird.
  "mm",
  // Hours. Example: "1".
  "h",
  // Hours (min two digits). Example: "01".
  "hh",
  // "AM" part of "AM/PM". Lowercased just in case.
  "am",
  // "PM" part of "AM/PM". Lowercased just in case.
  "pm",
  // Day. Example: "1"
  "d",
  // Day (min two digits). Example: "01"
  "dd",
  // Month (numeric). Example: "1".
  "m",
  // Month (numeric, min two digits). Example: "01". Could also be "Minutes". Weird.
  "mm",
  // Month (shortened month name). Example: "Jan".
  "mmm",
  // Month (full month name). Example: "January".
  "mmmm",
  // Two-digit year. Example: "20".
  "yy",
  // Full year. Example: "2020".
  "yyyy",
  // I don't have any idea what "e" means.
  // It's used in "built-in" XLSX formats:
  // * 27 '[$-404]e/m/d';
  // * 36 '[$-404]e/m/d';
  // * 50 '[$-404]e/m/d';
  // * 57 '[$-404]e/m/d';
  "e"
];
function isDateFormatStyle(styleId, styles, options) {
  if (styleId) {
    var style = styles[styleId];
    if (!style) {
      throw new Error("Cell style not found: ".concat(styleId));
    }
    if (!style.numberFormat) {
      return false;
    }
    if (
      // Whether it's a "number format" that's conventionally used for storing date timestamps.
      BUILT_IN_DATE_FORMAT_IDS.indexOf(Number(style.numberFormat.id)) >= 0 || // Whether it's a "number format" that uses a "formatting template"
      // that the developer is certain is a date formatting template.
      options.dateFormat && style.numberFormat.template === options.dateFormat || // Whether the "smart formatting template" feature is not disabled
      // and it has detected that it's a date formatting template by looking at it.
      options.smartDateParser !== false && style.numberFormat.template && isDateFormatCached(style.numberFormat.template)
    ) {
      return true;
    }
  }
}
var LOCALE_INDEPENDENT_BUILT_IN_DATE_FORMAT_IDS = [
  14,
  // mm-dd-yy
  15,
  // d-mmm-yy
  16,
  // d-mmm
  17,
  // mmm-yy
  18,
  // h:mm AM/PM
  19,
  // h:mm:ss AM/PM
  20,
  // h:mm
  21,
  // h:mm:ss
  22,
  // m/d/yy h:mm
  45,
  // mm:ss
  46,
  // [h]:mm:ss
  47
  // mmss.0
];
var MAINLAND_CHINESE_OR_TAIWANESE_LOCALE_BUILT_IN_DATE_FORMAT_IDS = [
  27,
  // [$-404]e/m/d OR yyyy"年"m"月"
  28,
  // [$-404]e"年"m"月"d"日" OR m"月"d"日"
  29,
  // [$-404]e"年"m"月"d"日" OR m"月"d"日"
  30,
  // m/d/yy OR m-d-yy
  31,
  // yyyy"年"m"月"d"日" OR yyyy"年"m"月"d"日"
  32,
  // hh"時"mm"分" OR h"时"mm"分"
  33,
  // hh"時"mm"分"ss"秒" OR h"时"mm"分"ss"秒"
  34,
  // 上午/下午hh"時"mm"分" OR 上午/下午h"时"mm"分"
  35,
  // 上午/下午hh"時"mm"分"ss"秒" OR 上午/下午h"时"mm"分"ss"秒"
  36,
  // [$-404]e/m/d OR yyyy"年"m"月"
  50,
  // [$-404]e/m/d OR yyyy"年"m"月"
  51,
  // [$-404]e"年"m"月"d"日" OR m"月"d"日"
  52,
  // 上午/下午hh"時"mm"分" OR yyyy"年"m"月"
  53,
  // 上午/下午hh"時"mm"分"ss"秒" OR m"月"d"日"
  54,
  // [$-404]e"年"m"月"d"日" OR m"月"d"日"
  55,
  // 上午/下午hh"時"mm"分" OR 上午/下午h"时"mm"分"
  56,
  // 上午/下午hh"時"mm"分"ss"秒" OR 上午/下午h"时"mm"分"ss"秒"
  57,
  // [$-404]e/m/d OR yyyy"年"m"月"
  58
  // [$-404]e"年"m"月"d"日" OR m"月"d"日"
];
var JAPANESE_OR_KOREAN_LOCALE_BUILT_IN_DATE_FORMAT_IDS = [
  27,
  // [$-411]ge.m.d OR yyyy"年" mm"月" dd"日"
  28,
  // [$-411]ggge"年"m"月"d"日" OR mm-dd
  29,
  // [$-411]ggge"年"m"月"d"日" OR mm-dd
  30,
  // m/d/yy OR mm-dd-yy
  31,
  // yyyy"年"m"月"d"日" OR yyyy"년" mm"월" dd"일"
  32,
  // h"時"mm"分" OR h"시" mm"분"
  33,
  // h"時"mm"分"ss"秒" OR h"시" mm"분" ss"초"
  34,
  // yyyy"年"m"月" OR yyyy-mm-dd
  35,
  // m"月"d"日" OR yyyy-mm-dd
  36,
  // [$-411]ge.m.d OR yyyy"年" mm"月" dd"日"
  50,
  // [$-411]ge.m.d OR yyyy"年" mm"月" dd"日"
  51,
  // [$-411]ggge"年"m"月"d"日" OR mm-dd
  52,
  // yyyy"年"m"月" OR yyyy-mm-dd
  53,
  // m"月"d"日" OR yyyy-mm-dd
  54,
  // [$-411]ggge"年"m"月"d"日" OR mm-dd
  55,
  // yyyy"年"m"月" OR yyyy-mm-dd
  56,
  // m"月"d"日" OR yyyy-mm-dd
  57,
  // [$-411]ge.m.d OR yyyy"年" mm"月" dd"日"
  58
  // [$-411]ggge"年"m"月"d"日" OR mm-dd
];
var THAI_LOCALE_BUILT_IN_DATE_FORMAT_IDS = [
  71,
  // ว/ด/ปปปป
  72,
  // ว-ดดด-ปป
  73,
  // ว-ดดด
  74,
  // ดดด-ปป
  75,
  // ช:นน
  76,
  // ช:นน:ทท
  77,
  // ว/ด/ปปปป ช:นน
  78,
  // นน:ทท
  79,
  // [ช]:นน:ทท
  80,
  // นน:ทท.0
  81
  // d/m/bb
];
var BUILT_IN_DATE_FORMAT_IDS = LOCALE_INDEPENDENT_BUILT_IN_DATE_FORMAT_IDS.concat(
  // Add Mainland Chinese or Taiwanese date format IDs that haven't already been added.
  MAINLAND_CHINESE_OR_TAIWANESE_LOCALE_BUILT_IN_DATE_FORMAT_IDS
).concat(
  // Add Japanese or Korean date format IDs that haven't already been added.
  JAPANESE_OR_KOREAN_LOCALE_BUILT_IN_DATE_FORMAT_IDS.filter(function(numberFormatId) {
    return MAINLAND_CHINESE_OR_TAIWANESE_LOCALE_BUILT_IN_DATE_FORMAT_IDS.indexOf(numberFormatId) < 0;
  })
).concat(
  // Add Thai date format IDs that haven't already been added.
  THAI_LOCALE_BUILT_IN_DATE_FORMAT_IDS.filter(function(numberFormatId) {
    return MAINLAND_CHINESE_OR_TAIWANESE_LOCALE_BUILT_IN_DATE_FORMAT_IDS.indexOf(numberFormatId) < 0;
  }).filter(function(numberFormatId) {
    return JAPANESE_OR_KOREAN_LOCALE_BUILT_IN_DATE_FORMAT_IDS.indexOf(numberFormatId) < 0;
  })
);
function parseCellValue(value, type, _ref) {
  var getInlineStringValue = _ref.getInlineStringValue, getInlineStringXml = _ref.getInlineStringXml, getStyleId = _ref.getStyleId, styles = _ref.styles, sharedStrings = _ref.sharedStrings, epoch1904 = _ref.epoch1904, options = _ref.options;
  if (!type) {
    type = "n";
  }
  switch (type) {
    // XLSX tends to store all strings as "shared" (indexed) ones
    // using "s" cell type (for saving on strage space).
    // "str" cell type is then generally only used for storing
    // formula-pre-calculated cell values.
    case "str":
      value = parseString(value, options);
      break;
    // Sometimes, XLSX stores strings as "inline" strings rather than "shared" (indexed) ones.
    // Perhaps the specification doesn't force it to use one or another.
    // Example: `<sheetData><row r="1"><c r="A1" s="1" t="inlineStr"><is><t>Test 123</t></is></c></row></sheetData>`.
    case "inlineStr":
      value = getInlineStringValue();
      if (value === void 0) {
        throw new Error('Unsupported "inline string" cell value structure: '.concat(getInlineStringXml()));
      }
      value = parseString(value, options);
      break;
    // XLSX tends to store string values as "shared" (indexed) ones.
    // "Shared" strings is a way for an Excel editor to reduce
    // the file size by storing "commonly used" strings in a dictionary
    // and then referring to such strings by their index in that dictionary.
    // Example: `<sheetData><row r="1"><c r="A1" s="1" t="s"><v>0</v></c></row></sheetData>`.
    case "s":
      var sharedStringIndex = Number(value);
      if (isNaN(sharedStringIndex)) {
        throw new Error('Invalid "shared" string index: '.concat(value));
      }
      if (sharedStringIndex >= sharedStrings.length) {
        throw new Error('An out-of-bounds "shared" string index: '.concat(value));
      }
      value = sharedStrings[sharedStringIndex];
      value = parseString(value, options);
      break;
    // Boolean (TRUE/FALSE) values are stored as either "1" or "0"
    // in cells of type "b".
    case "b":
      if (value === "1") {
        value = true;
      } else if (value === "0") {
        value = false;
      } else {
        throw new Error('Unsupported "boolean" cell value: '.concat(value));
      }
      break;
    // XLSX specification seems to support cells of type "z":
    // blank "stub" cells that should be ignored by data processing utilities.
    case "z":
      value = void 0;
      break;
    // XLSX specification also defines cells of type "e" containing a numeric "error" code.
    // It's not clear what that means though.
    // They also wrote: "and `w` property stores its common name".
    // It's unclear what they meant by that.
    case "e":
      value = decodeError(value);
      break;
    // XLSX supports date cells of type "d", though seems like it (almost?) never
    // uses it for storing dates, preferring "n" numeric timestamp cells instead.
    // The value of a "d" cell is supposedly a string in "ISO 8601" format.
    // I haven't seen an XLSX file having such cells.
    // Example: `<sheetData><row r="1"><c r="A1" s="1" t="d"><v>2021-06-10T00:47:45.700Z</v></c></row></sheetData>`.
    case "d":
      if (value === void 0) {
        break;
      }
      var parsedDate = new Date(value);
      if (isNaN(parsedDate.valueOf())) {
        throw new Error('Unsupported "date" cell value: '.concat(value));
      }
      value = parsedDate;
      break;
    // Numeric cells have type "n".
    case "n":
      if (value === void 0) {
        break;
      }
      var styleId = getStyleId();
      if (styleId && isDateFormatStyle(styleId, styles, options)) {
        value = parseNumberDefault(value);
        value = parseExcelDate(value, {
          epoch1904
        });
      } else {
        var parseNumber = options.parseNumber || parseNumberDefault;
        value = parseNumber(value);
      }
      break;
    default:
      throw new TypeError("Cell type not supported: ".concat(type));
  }
  if (value === void 0) {
    value = null;
  }
  return value;
}
function decodeError(errorCode) {
  switch (errorCode) {
    case 0:
      return "#NULL!";
    case 7:
      return "#DIV/0!";
    case 15:
      return "#VALUE!";
    case 23:
      return "#REF!";
    case 29:
      return "#NAME?";
    case 36:
      return "#NUM!";
    case 42:
      return "#N/A";
    case 43:
      return "#GETTING_DATA";
    default:
      return "#ERROR_".concat(errorCode);
  }
}
function parseString(value, options) {
  if (options.trim !== false) {
    value = value.trim();
  }
  if (value === "") {
    value = void 0;
  }
  return value;
}
function parseNumberDefault(stringifiedNumber) {
  var parsedNumber = Number(stringifiedNumber);
  if (isNaN(parsedNumber)) {
    throw new Error('Invalid "numeric" cell value: '.concat(stringifiedNumber));
  }
  return parsedNumber;
}
function _slicedToArray$2(arr, i) {
  return _arrayWithHoles$2(arr) || _iterableToArrayLimit$2(arr, i) || _unsupportedIterableToArray$5(arr, i) || _nonIterableRest$2();
}
function _nonIterableRest$2() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$5(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray$5(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$5(o, minLen);
}
function _arrayLikeToArray$5(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit$2(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ;
      else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles$2(arr) {
  if (Array.isArray(arr)) return arr;
}
function parseCellCoordinates(coordinatesString) {
  var _coordinatesString$sp = coordinatesString.split(/(\d+)/), _coordinatesString$sp2 = _slicedToArray$2(_coordinatesString$sp, 2), column = _coordinatesString$sp2[0], row = _coordinatesString$sp2[1];
  return [
    // Row.
    Number(row),
    // Column.
    // It's not clear why would `column` ever be non-trimmed,
    // but if it was added here then perhaps it could hypothetically happen, or smth.
    getColumnNumberFromColumnLetters(column.trim())
  ];
}
var LETTERS = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
function getColumnNumberFromColumnLetters(columnLetters) {
  var n = 0;
  var i = 0;
  while (i < columnLetters.length) {
    n *= 26;
    n += LETTERS.indexOf(columnLetters[i]);
    i++;
  }
  return n;
}
function parseCell(element, sheetDocument, sharedStrings, styles, epoch1904, options) {
  var coordinates = parseCellCoordinates(element.getAttribute("r"));
  var valueElement = getCellValueElement(sheetDocument, element);
  var value = valueElement && valueElement.textContent;
  var type = element.getAttribute("t");
  return {
    row: coordinates[0],
    column: coordinates[1],
    value: parseCellValue(value, type, {
      getInlineStringValue: function getInlineStringValue() {
        return getCellInlineStringValue(sheetDocument, element);
      },
      getInlineStringXml: function getInlineStringXml() {
        return getOuterXml(element);
      },
      getStyleId: function getStyleId() {
        return element.getAttribute("s");
      },
      styles,
      sharedStrings,
      epoch1904,
      options
    })
  };
}
function parseCells(sheetDocument, sharedStrings, styles, epoch1904, options) {
  var cells = getCellElements(sheetDocument);
  if (cells.length === 0) {
    return [];
  }
  return cells.map(function(element) {
    return parseCell(element, sheetDocument, sharedStrings, styles, epoch1904, options);
  });
}
function _slicedToArray$1(arr, i) {
  return _arrayWithHoles$1(arr) || _iterableToArrayLimit$1(arr, i) || _unsupportedIterableToArray$4(arr, i) || _nonIterableRest$1();
}
function _nonIterableRest$1() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$4(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray$4(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$4(o, minLen);
}
function _arrayLikeToArray$4(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit$1(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ;
      else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles$1(arr) {
  if (Array.isArray(arr)) return arr;
}
function parseSheetDimensions(sheetDocument) {
  var dimensions = getDimensions(sheetDocument);
  if (dimensions) {
    dimensions = dimensions.split(":").map(parseCellCoordinates).map(function(_ref) {
      var _ref2 = _slicedToArray$1(_ref, 2), row = _ref2[0], column = _ref2[1];
      return {
        row,
        column
      };
    });
    if (dimensions.length === 1) {
      dimensions = [dimensions[0], dimensions[0]];
    }
    return dimensions;
  }
}
function reconstructSheetDimensionsFromSheetCells(cells) {
  var comparator = function comparator2(a, b) {
    return a - b;
  };
  var allRows = cells.map(function(cell) {
    return cell.row;
  }).sort(comparator);
  var allCols = cells.map(function(cell) {
    return cell.column;
  }).sort(comparator);
  var minRow = allRows[0];
  var maxRow = allRows[allRows.length - 1];
  var minCol = allCols[0];
  var maxCol = allCols[allCols.length - 1];
  return [{
    row: minRow,
    column: minCol
  }, {
    row: maxRow,
    column: maxCol
  }];
}
function _createForOfIteratorHelperLoose$3(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray$3(o)) || allowArrayLike) {
    if (it) o = it;
    var i = 0;
    return function() {
      if (i >= o.length) return { done: true };
      return { done: false, value: o[i++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$3(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray$3(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$3(o, minLen);
}
function _arrayLikeToArray$3(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function dropEmptyRows(data) {
  var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, rowIndexSourceMap = _ref.rowIndexSourceMap, _ref$accessor = _ref.accessor, accessor = _ref$accessor === void 0 ? function(_) {
    return _;
  } : _ref$accessor, onlyTrimAtTheEnd = _ref.onlyTrimAtTheEnd;
  var i = data.length - 1;
  while (i >= 0) {
    var empty = true;
    for (var _iterator = _createForOfIteratorHelperLoose$3(data[i]), _step; !(_step = _iterator()).done; ) {
      var cell = _step.value;
      if (accessor(cell) !== null) {
        empty = false;
        break;
      }
    }
    if (empty) {
      data.splice(i, 1);
      if (rowIndexSourceMap) {
        rowIndexSourceMap.splice(i, 1);
      }
    } else if (onlyTrimAtTheEnd) {
      break;
    }
    i--;
  }
  return data;
}
function _createForOfIteratorHelperLoose$2(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray$2(o)) || allowArrayLike) {
    if (it) o = it;
    var i = 0;
    return function() {
      if (i >= o.length) return { done: true };
      return { done: false, value: o[i++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$2(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray$2(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$2(o, minLen);
}
function _arrayLikeToArray$2(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function dropEmptyColumns(data) {
  var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref$accessor = _ref.accessor, accessor = _ref$accessor === void 0 ? function(_) {
    return _;
  } : _ref$accessor, onlyTrimAtTheEnd = _ref.onlyTrimAtTheEnd;
  var i = data[0].length - 1;
  while (i >= 0) {
    var empty = true;
    for (var _iterator = _createForOfIteratorHelperLoose$2(data), _step; !(_step = _iterator()).done; ) {
      var row = _step.value;
      if (accessor(row[i]) !== null) {
        empty = false;
        break;
      }
    }
    if (empty) {
      var j = 0;
      while (j < data.length) {
        data[j].splice(i, 1);
        j++;
      }
    } else if (onlyTrimAtTheEnd) {
      break;
    }
    i--;
  }
  return data;
}
function _createForOfIteratorHelperLoose$1(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike) {
    if (it) o = it;
    var i = 0;
    return function() {
      if (i >= o.length) return { done: true };
      return { done: false, value: o[i++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray$1(arr, i) || _nonIterableRest();
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray$1(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray$1(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen);
}
function _arrayLikeToArray$1(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ;
      else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
function convertCellsToData2dArray(cells, dimensions) {
  if (cells.length === 0) {
    return [];
  }
  var _dimensions = _slicedToArray(dimensions, 2);
  _dimensions[0];
  var rightBottom = _dimensions[1];
  var colsCount = rightBottom.column;
  var rowsCount = rightBottom.row;
  var data = new Array(rowsCount);
  var i = 0;
  while (i < rowsCount) {
    data[i] = new Array(colsCount);
    var j = 0;
    while (j < colsCount) {
      data[i][j] = null;
      j++;
    }
    i++;
  }
  for (var _iterator = _createForOfIteratorHelperLoose$1(cells), _step; !(_step = _iterator()).done; ) {
    var cell = _step.value;
    var rowIndex = cell.row - 1;
    var columnIndex = cell.column - 1;
    if (columnIndex < colsCount && rowIndex < rowsCount) {
      data[rowIndex][columnIndex] = cell.value;
    }
  }
  data = dropEmptyRows(
    dropEmptyColumns(data, {
      onlyTrimAtTheEnd: true
    }),
    {
      onlyTrimAtTheEnd: true
    }
    // { onlyTrimAtTheEnd: true, rowIndexSourceMap: options.rowIndexSourceMap }
  );
  return data;
}
function parseSheet$1(content, xml2, sharedStrings, styles, epoch1904, options) {
  var sheetDocument = xml2.createDocument(content);
  var cells = parseCells(sheetDocument, sharedStrings, styles, epoch1904, options);
  var dimensions = parseSheetDimensions(sheetDocument) || reconstructSheetDimensionsFromSheetCells(cells);
  return convertCellsToData2dArray(cells, dimensions);
}
function _createForOfIteratorHelperLoose(o, allowArrayLike) {
  var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];
  if (it) return (it = it.call(o)).next.bind(it);
  if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike) {
    if (it) o = it;
    var i = 0;
    return function() {
      if (i >= o.length) return { done: true };
      return { done: false, value: o[i++] };
    };
  }
  throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function parseSpreadsheetContents(contents, xml2) {
  var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  var getFileContent = function getFileContent2(filePath) {
    if (!contents[filePath]) {
      throw new Error('"'.concat(filePath, '" file not found inside the *.xlsx file zip archive'));
    }
    return contents[filePath];
  };
  var filePaths = parseFilePaths(getFileContent("xl/_rels/workbook.xml.rels"), xml2);
  var sharedStrings = filePaths.sharedStrings ? parseSharedStrings(getFileContent(filePaths.sharedStrings), xml2) : [];
  var styles = filePaths.styles ? parseStyles(getFileContent(filePaths.styles), xml2) : {};
  var _parseSpreadsheetInfo = parseSpreadsheetInfo(getFileContent("xl/workbook.xml"), xml2), sheets = _parseSpreadsheetInfo.sheets, epoch1904 = _parseSpreadsheetInfo.epoch1904;
  var sheetIdsToRead = options.sheets && options.sheets.map(function(sheet) {
    return getSheetId(sheet, sheets);
  });
  var sheetsData = [];
  for (var _i = 0, _Object$keys = Object.keys(filePaths.sheets); _i < _Object$keys.length; _i++) {
    var sheetId = _Object$keys[_i];
    if (sheetIdsToRead && !sheetIdsToRead.includes(sheetId)) {
      continue;
    }
    sheetsData.push({
      sheet: getSheetNameById(sheetId, sheets),
      data: parseSheet$1(getFileContent(filePaths.sheets[sheetId]), xml2, sharedStrings, styles, epoch1904, options)
    });
  }
  return sheetsData;
}
function getSheetId(sheet, sheets) {
  if (typeof sheet === "string") {
    for (var _iterator = _createForOfIteratorHelperLoose(sheets), _step; !(_step = _iterator()).done; ) {
      var _sheet = _step.value;
      if (_sheet.name === sheet) {
        return _sheet.relationId;
      }
    }
    throw new Error('Sheet "'.concat(sheet, '" not found. Available sheets: ').concat(sheets.map(function(_ref) {
      var name = _ref.name;
      return '"'.concat(name, '"');
    }).join(", ")));
  } else {
    if (sheet <= sheets.length) {
      return sheets[sheet - 1].relationId;
    }
    throw new Error("Sheet number out of bounds: ".concat(sheet, ". Available sheets count: ").concat(sheets.length));
  }
}
function getSheetNameById(sheetId, sheets) {
  for (var _iterator2 = _createForOfIteratorHelperLoose(sheets), _step2; !(_step2 = _iterator2()).done; ) {
    var sheet = _step2.value;
    if (sheet.relationId === sheetId) {
      return sheet.name;
    }
  }
  throw new Error("Sheet ID not found: ".concat(sheetId));
}
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}
function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== void 0) {
    var res = prim.call(input, hint);
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function parseSheet(contents, xml2, sheet, options) {
  var data = parseSpreadsheetContents(contents, xml2, _objectSpread(_objectSpread({}, options), {}, {
    sheets: [1]
  }))[0].data;
  return data;
}
function readSheet(input, sheet, options) {
  return unpackXlsxFile(input).then(function(contents) {
    return parseSheet(contents, xml, sheet, options);
  });
}
export {
  readSheet as r
};
