const {ObjectId} = require("mongodb");

/**
 * 获取ID
 */
function getId(id) {
	if (id instanceof ObjectId) {return id;}
	if (typeof id !== "string" || id.length!== 24 || id.search(/^[0-9a-f]{24}$/ig)) {return null;}
	return ObjectId(id);
}
/**
 */
function getSort(order) {
	if (!(Array.isArray(order) && order.length)) {
		return {order:1, _id:1};
	}
	let sort = {};
	order.map(o => {
		let k = 1;
		//#表示降序排列
		if (o[0] === '#') {
			o = o.substr(1);
			k = -1;
		}
		//$为特殊字段
		if (o[0] === '$') {
			o = o.substr(1);
		} else {
			o = 'content.' + o;
		}
		sort[o] = k;
	})
	return sort;
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
async function create({title, parent, type, image, description, order, hide, info}) {
	if (!(title && typeof title === "string")) {
		return null;
	}
	parent = getId(parent);
	if (typeof image !== "string") {
		image = "";
	}
	if (typeof description !== "string") {
		description = "";
	}
	if (typeof type !== "string") {
		type = "";
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

	let value = {title, parent, type, image, description, order, hide, info, };
	//插入到库
	const {result, insertedIds} = await this.db.insert(value);
	return result.ok && insertedIds && insertedIds[0] || null;
}

/**
 * 修改
 */
async function set(id, {title, parent, type, image, description, order, hide, info, }) {
	if (!(id = getId(id))) {
		return false;
	}
	let $set = {};
	if (title && typeof title === "string") {
		$set.title = title;
	}
	if (parent === null || (parent = getId(parent))) {
		$set.parent = parent;
	}
	if (typeof image === "string") {
		$set.image = image;
	}
	if (typeof description === "string") {
		$set.description = description;
	}
	if (typeof type === "string") {
		$set.type = type;
	}
	if (isOrder(order)) {
		$set.order = parseInt(order);
	}
	if (typeof hide === "boolean") {
		$set.hide = hide;
	}
	if (info) {
		for (let k in info) {
			$set["info." + k] = info[k];
		}
	}
	let {result} = await this.db.update({_id:id},{$set});
	return Boolean(result.ok);
}

/**
 * 删除
 */
async function remove(id) {
	if (!(id = getId(id))) {
		return false;
	}
	let {result} = await this.db.remove({_id: id});
	return Boolean(result.ok);
}

/**
 * 获取
 */
async function get(id, {level = 0} = {}) {
	if (!(id = getId(id))) {
		return false;
	}
	let info = await this.db.findOne({_id:id});
	if (!info) {
		return null;
	}
	info.id = info._id;
	delete info._id;
	//子分类
	let idSet = {[id]:1};
	let ids = [id];
	let descendant = info.descendant = [];
	while(ids.length && (level > 0 || level == -1)) {
		level--;
		ids = await this.db.find({parent: {$in:ids}}, {_id:1}).toArray();
		ids = ids.map(({_id}) => _id).filter(id => !(id in idSet));
		ids.forEach(id => idSet[id] = 1);
		if (ids.length) {
			descendant.push(ids);
		}
	}
	//父分类
	idSet = {[id]:1};
	let ancestor = info.ancestor = [];
	let parent = info.parent;
	while(parent) {
		parent = await this.db.findOne({_id:parent},{parent:1, _id:0});
		if (!(parent = parent && parent.parent)) {
			break;
		}
		if (parent in idSet) {
			break;
		}
		idSet[parent] = 1;
		ancestor.unshift(parent);
	}
	return info;
}

/**
 * 查询
 */
async function list({title, parent, type, hide, info, sort, skip = 0, limit = 20, }) {
	let condition = {};
	if (Array.isArray(parent)) {
		let $in = [];
		for (let i = 0, l = parent.length; i < l; i++) {
			let id = parent[i];
			if (id === null || (id = getId(id))) {
				$in.push(id);
			}
		}
		condition.parent = {$in};
	}else if (parent === null || (parent = getId(parent))) {
		condition.parent = parent;
	}
	if (typeof type === "string") {
		condition.type = type;
	}
	if (typeof hide === "boolean") {
		condition.hide = hide;
	}
	if (info) {
		for (let k in info) {
			condition["info." + k] = info[k];
		}
	}

	sort = getSort(sort);
	const cursor = this.db.find(condition).sort(sort).skip(skip).limit(limit);
	const [list, total] = await Promise.all([cursor.toArray(), cursor.count()]);

	list.forEach(info =>{
		info.id = info._id;
		delete info._id;
	});
	return {list, total};
}

module.exports = function ulck(db, {} = {}) {
	let ret = {};
	let cfg = Object.create(ret);
	cfg.db = db;

	ret.create	= create.bind(cfg);
	ret.remove	= remove.bind(cfg);
	ret.set		= set.bind(cfg);
	ret.get		= get.bind(cfg);
	ret.list	= list.bind(cfg);

	return ret;
}
