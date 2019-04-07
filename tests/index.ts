import { getPlainSelectQueryAst, getDielIr } from "../src/compiler/compiler";
import { PrintCode } from "../src/util/messages";

const obj = getPlainSelectQueryAst("select * from t1 union select b from t2");

console.log(JSON.stringify(obj, null, 2));

const q = `
create table t1 (a integer);
create table t2 (a integer);
create table t3 (a integer);

create table v1 (aPrime integer);
create program after (t1)
	begin
		delete from v1;
		insert into v1 select a + 1 as aPrime from t1 where a > 2;
  end;

create output o1 as select aPrime from v1 join t2 on aPrime = a;
create output o2 as select aPrime from v1 join t3 on aPrime = a;
`;

const ir = getDielIr(q);
console.log("\n");
console.log(JSON.stringify(ir, null, 2));
