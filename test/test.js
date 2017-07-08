#!/usr/bin/env node
'use strict';

let run = (() => {
	var _ref = _asyncToGenerator(function* () {
		let db = yield _mongodb.MongoClient.connect('mongodb://localhost:27017/ulck');
		const { create, set, remove, get, query } = yield (0, _2.default)(db.collection("list"));
		let c1 = [],
		    c2 = [],
		    c3 = [];
		for (let i = 0; i < 20; i++) {
			c1[i] = yield create({ title: "测试" + i });
			yield console.log(`c1[${i}]:`, c1[i]);
		}
		for (let i = 0; i < 20; i++) {
			c2[i] = yield create({ title: "测试" + i, pid: c1[i] });
			yield console.log(`c2[${i}]:`, c2[i]);
		}
		for (let i = 0; i < 20; i++) {
			c3[i] = yield create({ title: "测试" + i, pid: c2[2] });
			yield console.log(`c3[${i}]:`, c3[i]);
		}
	});

	return function run() {
		return _ref.apply(this, arguments);
	};
})();

var _mongodb = require('mongodb');

var _ = require('../');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

run().catch(console.log).then(x => process.exit(0));