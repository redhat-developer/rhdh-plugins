'use strict';

var ProcessInstanceState = /* @__PURE__ */ ((ProcessInstanceState2) => {
  ProcessInstanceState2["Active"] = "ACTIVE";
  ProcessInstanceState2["Completed"] = "COMPLETED";
  ProcessInstanceState2["Aborted"] = "ABORTED";
  ProcessInstanceState2["Suspended"] = "SUSPENDED";
  ProcessInstanceState2["Error"] = "ERROR";
  ProcessInstanceState2["Pending"] = "PENDING";
  return ProcessInstanceState2;
})(ProcessInstanceState || {});
var MilestoneStatus = /* @__PURE__ */ ((MilestoneStatus2) => {
  MilestoneStatus2["Available"] = "AVAILABLE";
  MilestoneStatus2["Active"] = "ACTIVE";
  MilestoneStatus2["Completed"] = "COMPLETED";
  return MilestoneStatus2;
})(MilestoneStatus || {});
var TypeKind = /* @__PURE__ */ ((TypeKind2) => {
  TypeKind2["InputObject"] = "INPUT_OBJECT";
  return TypeKind2;
})(TypeKind || {});
var TypeName = /* @__PURE__ */ ((TypeName2) => {
  TypeName2["Id"] = "IdArgument";
  TypeName2["String"] = "StringArgument";
  TypeName2["Date"] = "DateArgument";
  return TypeName2;
})(TypeName || {});

exports.MilestoneStatus = MilestoneStatus;
exports.ProcessInstanceState = ProcessInstanceState;
exports.TypeKind = TypeKind;
exports.TypeName = TypeName;
//# sourceMappingURL=models.cjs.js.map
