import { getDielIr } from "../../src/compiler/compiler";
import { ExprFunAst, ExprType, ExprParen, OriginalRelation } from "../../src/parser/dielAstTypes";
import { GenerateUnitTestErrorLogger } from "../testHelper";

export function assertBasicConstraints() {
  const q = `
  CREATE EVENT TABLE Persons (
    Name text,
    PersonID int NOT NULL,
    Age int,
    CHECK (Age>=18)
  );

  CREATE TABLE Orders (
    OrderID int NOT NULL,
    OrderNumber int NOT NULL,
    PersonID int,
    PRIMARY KEY (OrderID),
    FOREIGN KEY (PersonID) REFERENCES Persons(PersonID)
  );`;
  let ir = getDielIr(q);
  const logger = GenerateUnitTestErrorLogger("assertBasicConstraints", q);
  const ordersTable = ir.GetRelationDef("Orders") as OriginalRelation;
  if (!ordersTable) {
    logger.error(`Did not even parse Orders table`);
  }
  console.log(JSON.stringify(ordersTable));

  // foreign key
  const fk = ordersTable.constraints.foreignKeys;
  if (!fk) {
    logger.error(`foreign key not created`);
  }
  const expected = "PersonID";
  if ((fk[0].sourceColumn !== expected)) {
    logger.error(`created foreign key source column is wrong, got ${fk[0].sourceColumn} but expected ${expected}`);
  }
  if (fk[0].targetColumn !== expected) {
    logger.error(`created foreign key targetColumn is wrong, got ${fk[0].targetColumn}`);
  }
  if (fk[0].targetRelation !== "Persons") {
    logger.error(`created foreign key targetRelation is wrong, got ${fk[0].targetRelation}`);
  }
  // NOT NULL
  const notNulls = ordersTable.constraints.notNull;
  if (notNulls.length !== 2) {
    logger.error(`Missing not nulls, only have ${JSON.stringify(notNulls)}`);
  }
  // a bit brittle here, assumes parsing order
  if (notNulls[0] !== "OrderID") {
    logger.error(`Parsed wrong not null; have ${notNulls[0]} but expects OrderID`);
  }
  if (notNulls[1] !== "OrderNumber") {
    logger.error(`Parsed wrong not null; have ${JSON.stringify(notNulls[1])}`);
  }
  // Primary key
  const pk = ordersTable.constraints.primaryKey;
  if ((!pk) || pk[0] !== "OrderID") {
    logger.error(`Primary key not created or is wrong, ${pk}`);
  }
  // check
  const personsTable = ir.GetRelationDef("Persons") as OriginalRelation;
  const checks = personsTable.constraints.exprChecks;
  if ((!checks) || checks.length === 0) {
    logger.error(`check not created, ${JSON.stringify(checks)}`);
  }
  if (checks[0].exprType !== ExprType.Parenthesis || (<ExprFunAst>((<ExprParen>checks[0]).content)).functionReference !== ">=") {
    logger.error(`check not correct, ${JSON.stringify(checks[0])}`);
  }
  logger.pass();
  return true;
}