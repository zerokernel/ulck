#!/usr/bin/env node
import {MongoClient} from 'mongodb';
import ulck from '../';
async function run () {
	let db = await MongoClient.connect('mongodb://localhost:27017/ulck');
	const {create, set, remove, get, query} = await ulck(db.collection("list"));
	let c1 = [], c2 = [], c3 = [];
	for(let i = 0; i < 20; i++) {
		c1[i] = await create({title:"测试" + i});
		await console.log(`c1[${i}]:`, c1[i]);
	}
	for(let i = 0; i < 20; i++) {
		c2[i] = await create({title:"测试" + i,pid:c1[i]});
		await console.log(`c2[${i}]:`, c2[i]);
	}
	for(let i = 0; i < 20; i++) {
		c3[i] = await create({title:"测试" + i,pid:c2[2]});
		await console.log(`c3[${i}]:`, c3[i]);
	}
}
run().catch(console.log).then(x=>process.exit(0))
