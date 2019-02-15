import { assertSimpleType, assertMultiplyType } from "./compilerTests/assertTypes";
import { generateViewConstraintCheckQuery } from "./compilerTests/generateViewConstraints";
import {not_null1, not_null2} from "./compilerTests/constraintQueryInput/null_constraint_input";
import {check1, check2, check3} from "./compilerTests/constraintQueryInput/check_constraint_input";
import {unique1, unique2} from "./compilerTests/constraintQueryInput/unique_constraint_input";
import { GenerateUnitTestErrorLogger } from "../lib/messages";


const toTest = [not_null1, not_null2, check1, check2, check3, unique1, unique2];

function assertCheckViewConstraintTest() {
    toTest.forEach(element => {
        const logger = GenerateUnitTestErrorLogger("assertCheckViewConstraintTest", element);
        var viewqueries = generateViewConstraintCheckQuery(element);
        var i, j, q;
        for (i = 0; i < viewqueries.length; i++) {
            for (j = 0; j < viewqueries[i].length; j++) {

                q = viewqueries[i][j];
                console.log(`============= Query ${j} =================`);
                console.log(q);
            }
            console.log("=======================================");
        }
    });
}

assertCheckViewConstraintTest();
