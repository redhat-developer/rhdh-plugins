'use strict';

var constants = require('./constants.cjs.js');

class DataInputSchemaService {
  extractWorkflowData(variables) {
    return variables && constants.WORKFLOW_DATA_KEY in variables ? variables[constants.WORKFLOW_DATA_KEY] : void 0;
  }
}

exports.DataInputSchemaService = DataInputSchemaService;
//# sourceMappingURL=DataInputSchemaService.cjs.js.map
