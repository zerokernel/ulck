import {ObjectId, Collection} from "mongodb";

/**
 * 获取ID
 */
function getId(id) {
	if (id instanceof ObjectId) {return id;}
	if (typeof id !== "string" || id.length!== 24 || id.search(/^[0-9a-f]{24}$/ig)) {return null;}
	return ObjectId(id);
}

/**
 * 信息整理
 */
async function info(info) {
	if (info._id) {info.id = info._id;delete info._id;}
	return info;
}

/**
 * 是否为字符串
 */
function isString(str,noNull) {
	if (noNull && !str) {return false;}
	return typeof str === "string";
}
/**
 * 是否为排序序号
 */
function isOrder(order) {
	if (order !== parseInt(order)) {return false;}
	if (order < -0xFFFFFFF) {return false;}
	if (order > +0xFFFFFFF) {return false;}
	return true;
}
/**
 * 创建
 */
async function create({title, pid, image, description, order, hide, info}) {
	if (!isString(title, true)) {throw "标题必须为非空字符串";}
	pid = getId(pid);
	if (!isString(image)) {image = "";}
	if (!isString(description)) {description = "";}
	if (!isOrder(order)) {order = 10000;}
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

	let value = {title, pid, image, description, order, hide, info, };
	//插入到库
	let {result,ops} = await this.db.insert(value);
	if (result.ok && ops[0]) {return ops[0]._id;}
	throw new Error("添加失败");
}

/**
 * 修改
 */
async function set(id, {title, pid, image, description, order, hide, info, }) {
	if (!(id = getId(id))) {throw new Error("Id必须为24为16进制字符串");}
	let value = {};
	if (isString(title, true)) {value.title = title;}
	if (pid === null || (pid = getId(pid))) {value.pid = pid;}
	if (isString(image)) {value.image = image;}
	if (isString(description)) {value.description = description;}
	if (isOrder(order)) {value.order = parseInt(order);}
	if (typeof hide === "boolean") {value.hide = hide;}
	if (info) {for (let k in info) {value["info." + k] = info[k];}}
	let {result} = await this.db.update({_id:id},{$set:value});
	return Boolean(result.ok);
}

/**
 * 删除
 */
async function remove(id) {
	if (!(id = getId(id))) {throw new Error("Id必须为24为16进制字符串");}
	let {result} = await this.db.remove({_id: id});
	return Boolean(result.ok);
}

/**
 * 获取
 */
async function get(id) {
	if (!(id = getId(id))) {throw new Error("Id必须为24为16进制字符串");}
	let rs = await this.db.find({_id:id}).toArray();
	if (rs.length) {return await info.call(this, rs[0]);}
	return null;
}

/**
 * 查询
 */
async function query({title, pid, hide, info, sort, limit:[from = 0, length = 20] = [], }) {
	let condition = {};
	if (pid instanceof Array) {
		condition.pid = {$in:pid.filter(x=> x === null || getId(x))};
	}else if (pid === null || getId(pid)) {
		condition.pid = pid;
	}
	if (typeof hide === "boolean") {condition.hide = hide;}
	if (info) {for (let k in info) {condition["info." + k] = info[k];}}

	let cursor = this.db.find(condition);
	cursor.sort(getSort(sort));
	if (from < 0 || from !== parseInt(from) || isNaN(from) || from >0xFFFFFFFF) {from = 0;}
	if (length <= 0 || length !== parseInt(length) || isNaN(length) || length > 1000) {length = 20;}
	cursor.skip(from).limit(length);
	let [list, num] = await Promise.all([cursor.toArray().then(rs=>Promise.all(rs.map(r=>info.call(this,r)))), cursor.count()]);
	return {list, num};
}

export default function cmk(db, {} = {}) {
	if (!(db instanceof Collection)) {throw "不是有效的Mongodb Collection";}

	let ret = {};
	let cfg = Object.create(ret);
	cfg.db = db;

	ret.create	= create.bind(cfg);
	ret.set		= set.bind(cfg);
	ret.remove	= remove.bind(cfg);
	ret.get		= get.bind(cfg);
	ret.query	= query.bind(cfg);
	return ret;
}
