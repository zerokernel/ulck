"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

/**
 * 信息整理
 */
let info = (() => {
	var _ref = _asyncToGenerator(function* (info) {
		if (info._id) {
			info.id = info._id;delete info._id;
		}
		return info;
	});

	return function info(_x) {
		return _ref.apply(this, arguments);
	};
})();

/**
 * 是否为字符串
 */


/**
 * 创建
 */
let create = (() => {
	var _ref2 = _asyncToGenerator(function* ({ title, pid, image, description, order, hide, info }) {
		if (!isString(title, true)) {
			throw "标题必须为非空字符串";
		}
		pid = getId(pid);
		if (!isString(image)) {
			image = "";
		}
		if (!isString(description)) {
			description = "";
		}
		if (!isOrder(order)) {
			order = 10000;
		}
		hide = Boolean(hide);
		if (!info) {
			info = {};
		} else {
			let info2 = info;
			info = {};
			for (let k in info2) {
				info[k] = info2[k];
			}
		}

		let value = { title, pid, image, description, order, hide, info };
		//插入到库
		let { result, ops } = yield this.db.insert(value);
		if (result.ok && ops[0]) {
			return ops[0]._id;
		}
		throw new Error("添加失败");
	});

	return function create(_x2) {
		return _ref2.apply(this, arguments);
	};
})();

/**
 * 修改
 */


let set = (() => {
	var _ref3 = _asyncToGenerator(function* (id, { title, pid, image, description, order, hide, info }) {
		if (!(id = getId(id))) {
			throw new Error("Id必须为24为16进制字符串");
		}
		let value = {};
		if (isString(title, true)) {
			value.title = title;
		}
		if (pid === null || (pid = getId(pid))) {
			value.pid = pid;
		}
		if (isString(image)) {
			value.image = image;
		}
		if (isString(description)) {
			value.description = description;
		}
		if (isOrder(order)) {
			value.order = parseInt(order);
		}
		if (typeof hide === "boolean") {
			value.hide = hide;
		}
		if (info) {
			for (let k in info) {
				value["info." + k] = info[k];
			}
		}
		let { result } = yield this.db.update({ _id: id }, { $set: value });
		return Boolean(result.ok);
	});

	return function set(_x3, _x4) {
		return _ref3.apply(this, arguments);
	};
})();

/**
 * 删除
 */


let remove = (() => {
	var _ref4 = _asyncToGenerator(function* (id) {
		if (!(id = getId(id))) {
			throw new Error("Id必须为24为16进制字符串");
		}
		let { result } = yield this.db.remove({ _id: id });
		return Boolean(result.ok);
	});

	return function remove(_x5) {
		return _ref4.apply(this, arguments);
	};
})();

/**
 * 获取
 */


let get = (() => {
	var _ref5 = _asyncToGenerator(function* (id) {
		if (!(id = getId(id))) {
			throw new Error("Id必须为24为16进制字符串");
		}
		let rs = yield this.db.find({ _id: id }).toArray();
		if (rs.length) {
			return yield info.call(this, rs[0]);
		}
		return null;
	});

	return function get(_x6) {
		return _ref5.apply(this, arguments);
	};
})();

/**
 * 查询
 */


let query = (() => {
	var _ref6 = _asyncToGenerator(function* ({ title, pid, hide, info, sort, limit: [from = 0, length = 20] = [] }) {
		var _this = this;

		let condition = {};
		if (pid instanceof Array) {
			condition.pid = { $in: pid.filter(function (x) {
					return x === null || getId(x);
				}) };
		} else if (pid === null || getId(pid)) {
			condition.pid = pid;
		}
		if (typeof hide === "boolean") {
			condition.hide = hide;
		}
		if (info) {
			for (let k in info) {
				condition["info." + k] = info[k];
			}
		}

		let cursor = this.db.find(condition);
		cursor.sort(getSort(sort));
		if (from < 0 || from !== parseInt(from) || isNaN(from) || from > 0xFFFFFFFF) {
			from = 0;
		}
		if (length <= 0 || length !== parseInt(length) || isNaN(length) || length > 1000) {
			length = 20;
		}
		cursor.skip(from).limit(length);
		let [list, num] = yield Promise.all([cursor.toArray().then(function (rs) {
			return Promise.all(rs.map(function (r) {
				return info.call(_this, r);
			}));
		}), cursor.count()]);
		return { list, num };
	});

	return function query(_x7) {
		return _ref6.apply(this, arguments);
	};
})();

exports.default = cmk;

var _mongodb = require("mongodb");

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * 获取ID
 */
function getId(id) {
	if (id instanceof _mongodb.ObjectId) {
		return id;
	}
	if (typeof id !== "string" || id.length !== 24 || id.search(/^[0-9a-f]{24}$/ig)) {
		return null;
	}
	return (0, _mongodb.ObjectId)(id);
}function isString(str, noNull) {
	if (noNull && !str) {
		return false;
	}
	return typeof str === "string";
}
/**
 * 是否为排序序号
 */
function isOrder(order) {
	if (order !== parseInt(order)) {
		return false;
	}
	if (order < -0xFFFFFFF) {
		return false;
	}
	if (order > +0xFFFFFFF) {
		return false;
	}
	return true;
}function cmk(db, {} = {}) {
	if (!(db instanceof _mongodb.Collection)) {
		throw "不是有效的Mongodb Collection";
	}

	let ret = {};
	let cfg = Object.create(ret);
	cfg.db = db;

	ret.create = create.bind(cfg);
	ret.set = set.bind(cfg);
	ret.remove = remove.bind(cfg);
	ret.get = get.bind(cfg);
	ret.query = query.bind(cfg);
	return ret;
}